// API Configuration
const API_BASE_URL = window.location.origin;

// Global State
let isLoading = false;
let searchHistory = [];
let currentUser = { id: 'user-1', name: 'You' };

// DOM Elements
const elements = {
    loadingScreen: document.getElementById('loading-screen'),
    app: document.getElementById('app'),
    messagesArea: document.getElementById('messages-area'),
    searchForm: document.getElementById('search-form'),
    searchInput: document.getElementById('search-input'),
    sendBtn: document.getElementById('send-btn'),
    voiceBtn: document.getElementById('voice-btn'),
    imageBtn: document.getElementById('image-btn'),
    filterBtn: document.getElementById('filter-btn'),
    historyBtn: document.getElementById('history-btn'),
    helpBtn: document.getElementById('help-btn'),
    settingsBtn: document.getElementById('settings-btn'),
    toastContainer: document.getElementById('toast-container')
};

// Initialize App
document.addEventListener('DOMContentLoaded', () => {
    initializeApp();
});

async function initializeApp() {
    try {
        // Show loading screen
        showLoadingScreen();
        
        // Initialize components
        await Promise.all([
            initializeEventListeners(),
            loadSearchHistory(),
            checkAPIHealth()
        ]);
        
        // Add welcome message
        addWelcomeMessage();
        
        // Hide loading screen and show app
        setTimeout(() => {
            hideLoadingScreen();
            showApp();
        }, 2000);
        
    } catch (error) {
        console.error('Failed to initialize app:', error);
        showToast('Failed to initialize app', 'error');
        hideLoadingScreen();
        showApp();
    }
}

function showLoadingScreen() {
    elements.loadingScreen.style.display = 'flex';
    elements.app.classList.add('hidden');
}

function hideLoadingScreen() {
    elements.loadingScreen.style.opacity = '0';
    setTimeout(() => {
        elements.loadingScreen.style.display = 'none';
    }, 500);
}

function showApp() {
    elements.app.classList.remove('hidden');
    elements.app.style.animation = 'fadeIn 0.5s ease-in-out';
}

// Event Listeners
function initializeEventListeners() {
    // Search form
    elements.searchForm.addEventListener('submit', handleSearch);
    elements.searchInput.addEventListener('input', handleInputChange);
    elements.searchInput.addEventListener('keydown', handleKeyDown);
    
    // Buttons
    elements.voiceBtn.addEventListener('click', handleVoiceInput);
    elements.imageBtn.addEventListener('click', handleImageInput);
    elements.filterBtn.addEventListener('click', handleFilterToggle);
    elements.historyBtn.addEventListener('click', () => showModal('history-modal'));
    elements.helpBtn.addEventListener('click', () => showModal('help-modal'));
    elements.settingsBtn.addEventListener('click', () => showModal('settings-modal'));
    
    // Quick suggestions
    document.querySelectorAll('.suggestion-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const query = e.target.dataset.query;
            elements.searchInput.value = query;
            handleSearch(e);
        });
    });
    
    // Modal close buttons
    document.querySelectorAll('.modal-close').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const modalId = e.target.dataset.modal;
            hideModal(modalId);
        });
    });
    
    // Click outside modal to close
    document.querySelectorAll('.modal').forEach(modal => {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                hideModal(modal.id);
            }
        });
    });
    
    // Auto-resize textarea
    elements.searchInput.addEventListener('input', autoResizeTextarea);
}

function handleInputChange() {
    const hasText = elements.searchInput.value.trim().length > 0;
    elements.sendBtn.disabled = !hasText || isLoading;
}

function handleKeyDown(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        if (!isLoading && elements.searchInput.value.trim()) {
            handleSearch(e);
        }
    }
}

function autoResizeTextarea() {
    const textarea = elements.searchInput;
    textarea.style.height = 'auto';
    textarea.style.height = Math.min(textarea.scrollHeight, 120) + 'px';
}

// Search Functionality
async function handleSearch(e) {
    e.preventDefault();
    
    const query = elements.searchInput.value.trim();
    if (!query || isLoading) return;
    
    // Add user message
    addMessage({
        type: 'user',
        content: query,
        timestamp: new Date(),
        status: 'sending'
    });
    
    // Clear input and show loading
    elements.searchInput.value = '';
    handleInputChange();
    setLoading(true);
    
    try {
        // Show typing indicator
        showTypingIndicator();
        
        // Perform search
        const response = await fetch(`${API_BASE_URL}/api/search`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ query })
        });
        
        const result = await response.json();
        
        // Hide typing indicator
        hideTypingIndicator();
        
        if (result.success) {
            // Update user message status
            updateLastUserMessageStatus('sent');
            
            // Add bot response
            addMessage({
                type: 'bot',
                content: result.summary || `Search complete! Found ${result.totalResults} results for "${query}".`,
                timestamp: new Date(),
                status: 'sent'
            });
            
            // Show search results
            if (result.results && result.results.length > 0) {
                addSearchResults(result);
            }
            
            // Add to history
            searchHistory.unshift(result);
            if (searchHistory.length > 50) {
                searchHistory = searchHistory.slice(0, 50);
            }
            
            showToast('Search completed successfully', 'success');
        } else {
            updateLastUserMessageStatus('error');
            addMessage({
                type: 'bot',
                content: `Sorry, search failed: ${result.error}`,
                timestamp: new Date(),
                status: 'sent'
            });
            showToast(result.error, 'error');
        }
        
    } catch (error) {
        console.error('Search error:', error);
        hideTypingIndicator();
        updateLastUserMessageStatus('error');
        addMessage({
            type: 'bot',
            content: 'Sorry, an error occurred while searching. Please try again.',
            timestamp: new Date(),
            status: 'sent'
        });
        showToast('Network error occurred', 'error');
    } finally {
        setLoading(false);
    }
}

// Voice Input
function handleVoiceInput() {
    if (!('webkitSpeechRecognition' in window)) {
        showToast('Speech recognition not supported', 'warning');
        return;
    }
    
    const recognition = new webkitSpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = 'id-ID';
    
    recognition.onstart = () => {
        elements.voiceBtn.classList.add('recording');
        showToast('Listening...', 'info');
    };
    
    recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        elements.searchInput.value = transcript;
        handleInputChange();
        autoResizeTextarea();
        showToast('Voice input captured', 'success');
    };
    
    recognition.onerror = (event) => {
        console.error('Speech recognition error:', event.error);
        showToast('Voice input failed', 'error');
    };
    
    recognition.onend = () => {
        elements.voiceBtn.classList.remove('recording');
    };
    
    recognition.start();
}

// Image Input (placeholder)
function handleImageInput() {
    showToast('Image search coming soon!', 'info');
}

// Filter Toggle (placeholder)
function handleFilterToggle() {
    showToast('Advanced filters coming soon!', 'info');
}

// Message Management
function addMessage(message) {
    const messageElement = createMessageElement(message);
    elements.messagesArea.appendChild(messageElement);
    scrollToBottom();
}

function createMessageElement(message) {
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${message.type}`;
    
    const avatar = createAvatarElement(message.type);
    const content = createMessageContentElement(message);
    
    if (message.type === 'user') {
        messageDiv.appendChild(content);
        messageDiv.appendChild(avatar);
    } else {
        messageDiv.appendChild(avatar);
        messageDiv.appendChild(content);
    }
    
    return messageDiv;
}

function createAvatarElement(type) {
    const avatarDiv = document.createElement('div');
    avatarDiv.className = 'message-avatar';
    
    const icon = document.createElement('i');
    if (type === 'user') {
        icon.className = 'fas fa-user';
    } else if (type === 'bot') {
        icon.className = 'fas fa-robot';
    } else {
        icon.className = 'fas fa-info-circle';
    }
    
    avatarDiv.appendChild(icon);
    return avatarDiv;
}

function createMessageContentElement(message) {
    const contentDiv = document.createElement('div');
    contentDiv.className = 'message-content';
    
    const bubbleDiv = document.createElement('div');
    bubbleDiv.className = 'message-bubble';
    
    const textDiv = document.createElement('div');
    textDiv.className = 'message-text';
    textDiv.textContent = message.content;
    
    const metaDiv = document.createElement('div');
    metaDiv.className = 'message-meta';
    
    const timeSpan = document.createElement('span');
    timeSpan.textContent = formatTime(message.timestamp);
    
    const statusDiv = document.createElement('div');
    statusDiv.className = 'message-status';
    
    if (message.type === 'user') {
        const statusIcon = document.createElement('i');
        statusIcon.className = getStatusIcon(message.status);
        statusDiv.appendChild(statusIcon);
    }
    
    metaDiv.appendChild(timeSpan);
    metaDiv.appendChild(statusDiv);
    
    bubbleDiv.appendChild(textDiv);
    bubbleDiv.appendChild(metaDiv);
    contentDiv.appendChild(bubbleDiv);
    
    return contentDiv;
}

function getStatusIcon(status) {
    const icons = {
        sending: 'fas fa-clock',
        sent: 'fas fa-check',
        error: 'fas fa-exclamation-triangle'
    };
    return icons[status] || 'fas fa-check';
}

function updateLastUserMessageStatus(status) {
    const messages = elements.messagesArea.querySelectorAll('.message.user');
    if (messages.length > 0) {
        const lastMessage = messages[messages.length - 1];
        const statusIcon = lastMessage.querySelector('.message-status i');
        if (statusIcon) {
            statusIcon.className = getStatusIcon(status);
        }
    }
}

function addWelcomeMessage() {
    const welcomeMessage = {
        type: 'bot',
        content: `Hello! 👋 I'm Superlee, ready to help you find IP assets on Story Protocol.

You can search naturally, for example:
• "I'm looking for an image of Dimjink singing, open use license"
• "music video for commercial purposes"
• "anime characters that can be modified"

What are you looking for today?`,
        timestamp: new Date(),
        status: 'sent'
    };
    
    addMessage(welcomeMessage);
}

// Typing Indicator
function showTypingIndicator() {
    const typingDiv = document.createElement('div');
    typingDiv.id = 'typing-indicator';
    typingDiv.className = 'typing-indicator';
    
    typingDiv.innerHTML = `
        <div class="typing-dots">
            <div class="typing-dot"></div>
            <div class="typing-dot"></div>
            <div class="typing-dot"></div>
        </div>
        <span>Story AI sedang mencari...</span>
    `;
    
    elements.messagesArea.appendChild(typingDiv);
    scrollToBottom();
}

function hideTypingIndicator() {
    const typingIndicator = document.getElementById('typing-indicator');
    if (typingIndicator) {
        typingIndicator.remove();
    }
}

// Search Results
function addSearchResults(searchResult) {
    const resultsDiv = document.createElement('div');
    resultsDiv.className = 'search-results';
    
    // Add summary if available
    if (searchResult.summary) {
        const summaryDiv = createSummaryElement(searchResult);
        resultsDiv.appendChild(summaryDiv);
    }
    
    // Add results grid
    if (searchResult.results && searchResult.results.length > 0) {
        const gridDiv = createResultsGridElement(searchResult.results);
        resultsDiv.appendChild(gridDiv);
    }
    
    elements.messagesArea.appendChild(resultsDiv);
    scrollToBottom();
}

function createSummaryElement(searchResult) {
    const summaryDiv = document.createElement('div');
    summaryDiv.className = 'results-summary';
    
    summaryDiv.innerHTML = `
        <div class="summary-header">
            <div class="summary-icon">
                <i class="fas fa-search"></i>
            </div>
            <h3 class="summary-title">Ringkasan Pencarian</h3>
        </div>
        <div class="summary-text">${searchResult.summary}</div>
        <div class="summary-meta">
            <span>Query: "${searchResult.query}"</span>
            <span>•</span>
            <span>${searchResult.totalResults} hasil ditemukan</span>
            <span>•</span>
            <span>${formatTime(new Date(searchResult.timestamp))}</span>
        </div>
    `;
    
    return summaryDiv;
}

function createResultsGridElement(results) {
    const gridDiv = document.createElement('div');
    gridDiv.className = 'results-grid';
    
    results.forEach((result, index) => {
        const cardDiv = createResultCardElement(result, index);
        gridDiv.appendChild(cardDiv);
    });
    
    return gridDiv;
}

function createResultCardElement(result, index) {
    const cardDiv = document.createElement('div');
    cardDiv.className = 'result-card';
    cardDiv.style.animationDelay = `${index * 0.1}s`;
    
    // Media preview
    const mediaDiv = document.createElement('div');
    mediaDiv.className = 'result-media';
    
    if (result.mediaUrl && result.mediaType?.startsWith('image')) {
        const img = document.createElement('img');
        img.src = result.mediaUrl;
        img.alt = result.title;
        img.onerror = () => {
            img.style.display = 'none';
            mediaDiv.innerHTML = `<div class="result-media-icon">${getMediaTypeIcon(result.mediaType)}</div>`;
        };
        mediaDiv.appendChild(img);
    } else {
        mediaDiv.innerHTML = `<div class="result-media-icon">${getMediaTypeIcon(result.mediaType)}</div>`;
    }
    
    // Media overlay
    const overlayDiv = document.createElement('div');
    overlayDiv.className = 'result-media-overlay';
    overlayDiv.innerHTML = '<button class="btn secondary sm"><i class="fas fa-eye"></i> Preview</button>';
    mediaDiv.appendChild(overlayDiv);
    
    // Content
    const contentDiv = document.createElement('div');
    contentDiv.className = 'result-content';
    
    contentDiv.innerHTML = `
        <div class="result-title">${result.title}</div>
        <div class="result-description">${result.description}</div>
        
        <div class="result-meta">
            <div class="result-tags">
                ${result.mediaType ? `<span class="result-tag media-type">${getMediaTypeIcon(result.mediaType)} ${result.mediaType}</span>` : ''}
                ${result.licenseTerms ? `<span class="result-tag license">${getLicenseIcon(result.licenseTerms)} ${getLicenseText(result.licenseTerms)}</span>` : ''}
                ${result.tags ? result.tags.slice(0, 3).map(tag => `<span class="result-tag">#${tag}</span>`).join('') : ''}
            </div>
            
            ${result.creators && result.creators.length > 0 ? `
                <div class="result-info">
                    <i class="fas fa-user"></i>
                    <span>${result.creators[0].name}</span>
                </div>
            ` : ''}
            
            ${result.createdAt ? `
                <div class="result-info">
                    <i class="fas fa-calendar"></i>
                    <span>${formatDate(result.createdAt)}</span>
                </div>
            ` : ''}
        </div>
        
        <div class="result-actions">
            <div class="result-actions-left">
                <button class="btn ghost sm" onclick="likeResult('${result.ipId}')">
                    <i class="fas fa-heart"></i>
                </button>
                <button class="btn ghost sm" onclick="shareResult('${result.ipId}')">
                    <i class="fas fa-share"></i>
                </button>
            </div>
            <div class="result-actions-right">
                <button class="btn secondary sm" onclick="downloadResult('${result.ipId}')">
                    <i class="fas fa-download"></i> Download
                </button>
                <button class="btn primary sm" onclick="viewResult('${result.ipId}')">
                    <i class="fas fa-external-link-alt"></i> View
                </button>
            </div>
        </div>
    `;
    
    cardDiv.appendChild(mediaDiv);
    cardDiv.appendChild(contentDiv);
    
    return cardDiv;
}

// Helper Functions
function getMediaTypeIcon(mediaType) {
    const icons = {
        image: '🖼️',
        video: '🎥',
        audio: '🎵',
        text: '📄',
        character: '👤',
        music: '🎼'
    };
    return icons[mediaType?.toLowerCase()] || '📎';
}

function getLicenseIcon(licenseTerms) {
    if (!licenseTerms) return '📄';
    if (licenseTerms.commercialUse) return '💼';
    return '🆓';
}

function getLicenseText(licenseTerms) {
    if (!licenseTerms) return 'Unknown';
    if (licenseTerms.commercialUse) return 'Commercial';
    return 'Open Use';
}

function formatTime(date) {
    return new Date(date).toLocaleTimeString('id-ID', {
        hour: '2-digit',
        minute: '2-digit'
    });
}

function formatDate(dateString) {
    return new Date(dateString).toLocaleDateString('id-ID', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
}

// Loading State
function setLoading(loading) {
    isLoading = loading;
    elements.sendBtn.disabled = loading || !elements.searchInput.value.trim();
    
    if (loading) {
        elements.sendBtn.classList.add('loading');
        elements.sendBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Mencari...';
    } else {
        elements.sendBtn.classList.remove('loading');
        elements.sendBtn.innerHTML = '<i class="fas fa-paper-plane"></i> <span>Kirim</span>';
    }
}

// Scroll Management
function scrollToBottom() {
    setTimeout(() => {
        elements.messagesArea.scrollTop = elements.messagesArea.scrollHeight;
    }, 100);
}

// Modal Management
function showModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.add('active');
        
        // Load content based on modal type
        if (modalId === 'history-modal') {
            loadHistoryModal();
        }
    }
}

function hideModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.remove('active');
    }
}

function loadHistoryModal() {
    const historyContent = document.getElementById('history-content');
    if (!historyContent) return;
    
    if (searchHistory.length === 0) {
        historyContent.innerHTML = '<div class="history-empty">Belum ada riwayat pencarian.</div>';
        return;
    }
    
    historyContent.innerHTML = searchHistory.map(item => `
        <div class="history-item" onclick="repeatSearch('${item.query}')">
            <div class="history-query">${item.query}</div>
            <div class="history-meta">
                <span>${item.totalResults} hasil</span>
                <span>${formatTime(new Date(item.timestamp))}</span>
            </div>
        </div>
    `).join('');
}

// Toast Notifications
function showToast(message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.textContent = message;
    
    elements.toastContainer.appendChild(toast);
    
    // Show toast
    setTimeout(() => {
        toast.classList.add('show');
    }, 100);
    
    // Hide toast after 3 seconds
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => {
            if (toast.parentNode) {
                toast.parentNode.removeChild(toast);
            }
        }, 300);
    }, 3000);
}

// API Functions
async function checkAPIHealth() {
    try {
        const response = await fetch(`${API_BASE_URL}/api/health`);
        const result = await response.json();
        if (result.success) {
            console.log('✅ API is healthy');
        }
    } catch (error) {
        console.error('❌ API health check failed:', error);
        showToast('API connection failed', 'warning');
    }
}

async function loadSearchHistory() {
    try {
        const response = await fetch(`${API_BASE_URL}/api/history`);
        const result = await response.json();
        if (result.success) {
            searchHistory = result.history || [];
        }
    } catch (error) {
        console.error('Failed to load search history:', error);
    }
}

// Action Handlers
function repeatSearch(query) {
    elements.searchInput.value = query;
    hideModal('history-modal');
    handleSearch({ preventDefault: () => {} });
}

function likeResult(ipId) {
    showToast('Added to favorites', 'success');
}

function shareResult(ipId) {
    if (navigator.share) {
        navigator.share({
            title: 'Story IP Asset',
            text: 'Check out this IP Asset from Story Protocol',
            url: window.location.href
        });
    } else {
        // Fallback: copy to clipboard
        navigator.clipboard.writeText(window.location.href);
        showToast('Link copied to clipboard', 'success');
    }
}

function downloadResult(ipId) {
    showToast('Download started', 'info');
}

function viewResult(ipId) {
    showToast('Opening in new tab', 'info');
    // window.open(`/asset/${ipId}`, '_blank');
}