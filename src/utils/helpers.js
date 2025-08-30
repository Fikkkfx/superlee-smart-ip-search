import crypto from "crypto";
import { toHex } from "viem";

// Hash utilities untuk Story Protocol
export class HashUtils {
  // Generate SHA-256 hash dari string
  static hashString(input) {
    return crypto.createHash('sha256').update(input).digest('hex');
  }

  // Generate SHA-256 hash dari buffer
  static hashBuffer(buffer) {
    return crypto.createHash('sha256').update(buffer).digest('hex');
  }

  // Generate hash dari file (untuk browser)
  static async hashFile(file) {
    const arrayBuffer = await file.arrayBuffer();
    const hashBuffer = await crypto.subtle.digest("SHA-256", arrayBuffer);
    return toHex(new Uint8Array(hashBuffer), { size: 32 });
  }

  // Generate hash dari URL
  static async hashFromUrl(url) {
    try {
      const response = await fetch(url);
      const buffer = await response.arrayBuffer();
      const hashBuffer = await crypto.subtle.digest("SHA-256", buffer);
      return toHex(new Uint8Array(hashBuffer), { size: 32 });
    } catch (error) {
      console.error("Error hashing from URL:", error);
      throw error;
    }
  }

  // Validate hash format (64 character hex string)
  static isValidHash(hash) {
    const cleanHash = hash.startsWith('0x') ? hash.slice(2) : hash;
    return /^[a-fA-F0-9]{64}$/.test(cleanHash);
  }
}

// Text processing utilities
export class TextUtils {
  // Clean dan normalize text untuk search
  static cleanText(text) {
    if (!text) return '';
    return text
      .toLowerCase()
      .trim()
      .replace(/[^\w\s]/g, ' ') // Remove special characters
      .replace(/\s+/g, ' '); // Normalize whitespace
  }

  // Extract keywords dari text
  static extractKeywords(text, maxKeywords = 10) {
    const cleaned = this.cleanText(text);
    const words = cleaned.split(' ');
    
    // Filter out common words (stopwords)
    const stopwords = new Set([
      'dan', 'atau', 'yang', 'di', 'ke', 'dari', 'untuk', 'dengan', 'pada',
      'adalah', 'akan', 'telah', 'sudah', 'belum', 'tidak', 'bukan',
      'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for',
      'of', 'with', 'by', 'is', 'are', 'was', 'were', 'be', 'been', 'have',
      'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could', 'should'
    ]);

    const keywords = words
      .filter(word => word.length > 2 && !stopwords.has(word))
      .slice(0, maxKeywords);

    return [...new Set(keywords)]; // Remove duplicates
  }

  // Generate slug dari text
  static generateSlug(text) {
    return text
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_-]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }

  // Truncate text dengan ellipsis
  static truncate(text, maxLength = 100) {
    if (!text || text.length <= maxLength) return text;
    return text.substring(0, maxLength).trim() + '...';
  }

  // Highlight search terms dalam text
  static highlightSearchTerms(text, searchTerms) {
    if (!text || !searchTerms || searchTerms.length === 0) return text;
    
    let highlightedText = text;
    searchTerms.forEach(term => {
      const regex = new RegExp(`(${term})`, 'gi');
      highlightedText = highlightedText.replace(regex, '<mark>$1</mark>');
    });
    
    return highlightedText;
  }
}

// Date utilities
export class DateUtils {
  // Format date untuk display
  static formatDate(date, locale = 'id-ID') {
    if (!date) return '';
    
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    return dateObj.toLocaleDateString(locale, {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }

  // Format datetime untuk display
  static formatDateTime(date, locale = 'id-ID') {
    if (!date) return '';
    
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    return dateObj.toLocaleString(locale, {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  // Get relative time (e.g., "2 hours ago")
  static getRelativeTime(date, locale = 'id-ID') {
    if (!date) return '';
    
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    const now = new Date();
    const diffInSeconds = Math.floor((now - dateObj) / 1000);

    const intervals = {
      year: 31536000,
      month: 2592000,
      week: 604800,
      day: 86400,
      hour: 3600,
      minute: 60
    };

    for (const [unit, seconds] of Object.entries(intervals)) {
      const interval = Math.floor(diffInSeconds / seconds);
      if (interval >= 1) {
        return new Intl.RelativeTimeFormat(locale, { numeric: 'auto' })
          .format(-interval, unit);
      }
    }

    return 'Baru saja';
  }

  // Convert unix timestamp to Date
  static fromUnixTimestamp(timestamp) {
    return new Date(timestamp * 1000);
  }

  // Convert Date to unix timestamp
  static toUnixTimestamp(date) {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    return Math.floor(dateObj.getTime() / 1000);
  }
}

// Validation utilities
export class ValidationUtils {
  // Validate Ethereum address
  static isValidAddress(address) {
    return /^0x[a-fA-F0-9]{40}$/.test(address);
  }

  // Validate URL
  static isValidUrl(url) {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  }

  // Validate email
  static isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  // Validate IPFS hash
  static isValidIPFSHash(hash) {
    // Basic IPFS hash validation (CIDv0 and CIDv1)
    return /^(Qm[1-9A-HJ-NP-Za-km-z]{44}|b[A-Za-z2-7]{58}|z[1-9A-HJ-NP-Za-km-z]{48})$/.test(hash);
  }

  // Validate media type
  static isValidMediaType(mediaType) {
    const validTypes = [
      'image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml',
      'audio/mpeg', 'audio/wav', 'audio/ogg', 'audio/mp4',
      'video/mp4', 'video/webm', 'video/quicktime'
    ];
    return validTypes.includes(mediaType);
  }

  // Validate search query
  static validateSearchQuery(query) {
    const errors = [];
    
    if (!query || typeof query !== 'string') {
      errors.push('Query must be a non-empty string');
    } else {
      if (query.trim().length < 2) {
        errors.push('Query must be at least 2 characters long');
      }
      if (query.length > 500) {
        errors.push('Query must be less than 500 characters');
      }
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  }
}

// Array utilities
export class ArrayUtils {
  // Remove duplicates dari array
  static removeDuplicates(array) {
    return [...new Set(array)];
  }

  // Chunk array into smaller arrays
  static chunk(array, size) {
    const chunks = [];
    for (let i = 0; i < array.length; i += size) {
      chunks.push(array.slice(i, i + size));
    }
    return chunks;
  }

  // Shuffle array
  static shuffle(array) {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }

  // Group array by key
  static groupBy(array, key) {
    return array.reduce((groups, item) => {
      const group = item[key];
      groups[group] = groups[group] || [];
      groups[group].push(item);
      return groups;
    }, {});
  }

  // Sort array by multiple criteria
  static sortBy(array, ...criteria) {
    return array.sort((a, b) => {
      for (const criterion of criteria) {
        let aVal, bVal, desc = false;
        
        if (typeof criterion === 'string') {
          aVal = a[criterion];
          bVal = b[criterion];
        } else if (typeof criterion === 'function') {
          aVal = criterion(a);
          bVal = criterion(b);
        } else if (criterion.key) {
          aVal = a[criterion.key];
          bVal = b[criterion.key];
          desc = criterion.desc || false;
        }
        
        if (aVal < bVal) return desc ? 1 : -1;
        if (aVal > bVal) return desc ? -1 : 1;
      }
      return 0;
    });
  }
}

// Object utilities
export class ObjectUtils {
  // Deep clone object
  static deepClone(obj) {
    return JSON.parse(JSON.stringify(obj));
  }

  // Merge objects deeply
  static deepMerge(target, ...sources) {
    if (!sources.length) return target;
    const source = sources.shift();

    if (this.isObject(target) && this.isObject(source)) {
      for (const key in source) {
        if (this.isObject(source[key])) {
          if (!target[key]) Object.assign(target, { [key]: {} });
          this.deepMerge(target[key], source[key]);
        } else {
          Object.assign(target, { [key]: source[key] });
        }
      }
    }

    return this.deepMerge(target, ...sources);
  }

  // Check if value is object
  static isObject(item) {
    return item && typeof item === 'object' && !Array.isArray(item);
  }

  // Get nested property safely
  static getNestedProperty(obj, path, defaultValue = null) {
    const keys = path.split('.');
    let current = obj;
    
    for (const key of keys) {
      if (current === null || current === undefined || !(key in current)) {
        return defaultValue;
      }
      current = current[key];
    }
    
    return current;
  }

  // Set nested property
  static setNestedProperty(obj, path, value) {
    const keys = path.split('.');
    const lastKey = keys.pop();
    let current = obj;
    
    for (const key of keys) {
      if (!(key in current) || !this.isObject(current[key])) {
        current[key] = {};
      }
      current = current[key];
    }
    
    current[lastKey] = value;
    return obj;
  }

  // Remove empty properties
  static removeEmpty(obj) {
    const cleaned = {};
    
    for (const [key, value] of Object.entries(obj)) {
      if (value !== null && value !== undefined && value !== '') {
        if (this.isObject(value)) {
          const cleanedNested = this.removeEmpty(value);
          if (Object.keys(cleanedNested).length > 0) {
            cleaned[key] = cleanedNested;
          }
        } else if (Array.isArray(value) && value.length > 0) {
          cleaned[key] = value;
        } else if (!Array.isArray(value)) {
          cleaned[key] = value;
        }
      }
    }
    
    return cleaned;
  }
}

// Cache utilities
export class CacheUtils {
  static cache = new Map();
  static defaultTTL = 300000; // 5 minutes

  // Set cache dengan TTL
  static set(key, value, ttl = this.defaultTTL) {
    const expiry = Date.now() + ttl;
    this.cache.set(key, { value, expiry });
  }

  // Get dari cache
  static get(key) {
    const item = this.cache.get(key);
    
    if (!item) return null;
    
    if (Date.now() > item.expiry) {
      this.cache.delete(key);
      return null;
    }
    
    return item.value;
  }

  // Clear cache
  static clear() {
    this.cache.clear();
  }

  // Clear expired items
  static clearExpired() {
    const now = Date.now();
    for (const [key, item] of this.cache.entries()) {
      if (now > item.expiry) {
        this.cache.delete(key);
      }
    }
  }

  // Get cache stats
  static getStats() {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys())
    };
  }
}

// Rate limiting utilities
export class RateLimiter {
  static requests = new Map();

  // Check if request is allowed
  static isAllowed(key, limit = 10, windowMs = 60000) {
    const now = Date.now();
    const windowStart = now - windowMs;
    
    if (!this.requests.has(key)) {
      this.requests.set(key, []);
    }
    
    const requests = this.requests.get(key);
    
    // Remove old requests
    const validRequests = requests.filter(time => time > windowStart);
    this.requests.set(key, validRequests);
    
    if (validRequests.length >= limit) {
      return false;
    }
    
    // Add current request
    validRequests.push(now);
    return true;
  }

  // Get remaining requests
  static getRemaining(key, limit = 10, windowMs = 60000) {
    const now = Date.now();
    const windowStart = now - windowMs;
    
    if (!this.requests.has(key)) {
      return limit;
    }
    
    const requests = this.requests.get(key);
    const validRequests = requests.filter(time => time > windowStart);
    
    return Math.max(0, limit - validRequests.length);
  }
}

// Export all utilities
export default {
  HashUtils,
  TextUtils,
  DateUtils,
  ValidationUtils,
  ArrayUtils,
  ObjectUtils,
  CacheUtils,
  RateLimiter
};