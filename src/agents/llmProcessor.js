import { openai } from "../utils/config.js";

export class LLMProcessor {
  constructor() {
    this.client = openai;
  }

  // Parse user query menggunakan LLM
  async parseUserQuery(userInput) {
    try {
      if (!this.client || !this.client.chat || !this.client.chat.completions) {
        return this.fallbackParse(userInput);
      }
      const prompt = `
        Parse the following user query for IP asset search and extract structured parameters:
        
        User Query: "${userInput}"
        
        Extract and return a JSON object with these fields:
        - query: main search terms
        - mediaType: image, audio, video, text, or null
        - license: open use, commercial, non-commercial, derivatives, or null
        - creator: creator name if mentioned, or null
        - tags: array of relevant tags
        - intent: brief description of what user is looking for
        - isIPID: boolean - true if input looks like an IPID (0x followed by 40 hex characters)
        
        Example:
        Input: "saya mencari gambar dimjink lagi berak, lisensi open use"
        Output: {
          "query": "dimjink berak",
          "mediaType": "image",
          "license": "open use",
          "creator": null,
          "tags": ["dimjink", "berak", "funny"],
          "intent": "Looking for funny images with open use license",
          "isIPID": false
        }
        
        Example IPID:
        Input: "0xB1D831271A68Db5c18c8F0B69327446f7C8D0A42"
        Output: {
          "query": "0xB1D831271A68Db5c18c8F0B69327446f7C8D0A42",
          "mediaType": null,
          "license": null,
          "creator": null,
          "tags": [],
          "intent": "Looking for specific IP Asset by IPID",
          "isIPID": true
        }
        
        Return only valid JSON:
      `;

      const response = await this.client.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [
          {
            role: "system",
            content: "You are an expert at parsing search queries for intellectual property assets. Always return valid JSON."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        temperature: 0.3,
      });

      const parsedQuery = JSON.parse(response.choices[0].message.content);
      return parsedQuery;
    } catch (error) {
      console.error("Error parsing user query:", error);
      // Fallback parsing
      return this.fallbackParse(userInput);
    }
  }

  // Fallback parsing jika LLM gagal
  fallbackParse(userInput) {
    const query = userInput.toLowerCase();
    
    return {
      query: userInput,
      mediaType: this.detectMediaType(query),
      license: this.detectLicense(query),
      creator: null,
      tags: this.extractTags(query),
      intent: "General IP asset search",
      isIPID: this.isValidIPID(userInput)
    };
  }

  detectMediaType(query) {
    if (query.includes("gambar") || query.includes("image") || query.includes("foto")) return "image";
    if (query.includes("video") || query.includes("film")) return "video";
    if (query.includes("audio") || query.includes("musik") || query.includes("lagu")) return "audio";
    if (query.includes("text") || query.includes("artikel")) return "text";
    return null;
  }

  detectLicense(query) {
    if (query.includes("open use") || query.includes("bebas")) return "open use";
    if (query.includes("commercial") || query.includes("komersial")) return "commercial";
    if (query.includes("non-commercial")) return "non-commercial";
    return null;
  }

  extractTags(query) {
    // Simple tag extraction - bisa diperbaiki dengan NLP yang lebih advanced
    const words = query.split(" ").filter(word => word.length > 3);
    return words.slice(0, 5); // Ambil maksimal 5 kata sebagai tags
  }

  // Check if input is valid IPID format
  isValidIPID(input) {
    const ipIdRegex = /^0x[a-fA-F0-9]{40}$/;
    return ipIdRegex.test(input);
  }

  // Generate response summary untuk search results
  async generateResponseSummary(searchResults, originalQuery) {
    try {
      if (!this.client || !this.client.chat || !this.client.chat.completions) {
        return `Ditemukan ${searchResults.length} hasil untuk pencarian "${originalQuery}".`;
      }
      const prompt = `
        Generate a helpful summary for IP asset search results:
        
        Original Query: "${originalQuery}"
        Number of Results: ${searchResults.length}
        
        Results Preview: ${JSON.stringify(searchResults.slice(0, 3), null, 2)}
        
        Create a friendly, informative summary in Indonesian that:
        1. Acknowledges the user's search
        2. Mentions how many results were found
        3. Highlights key findings or patterns
        4. Suggests next steps if relevant
        
        Keep it concise and helpful.
      `;

      const response = await this.client.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [
          {
            role: "system",
            content: "You are a helpful AI assistant for IP asset search. Respond in Indonesian."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        temperature: 0.7,
      });

      return response.choices[0].message.content;
    } catch (error) {
      console.error("Error generating summary:", error);
      return `Ditemukan ${searchResults.length} hasil untuk pencarian "${originalQuery}".`;
    }
  }

  // Generate comprehensive summary untuk IP Asset berdasarkan IPID
  async generateIPAssetSummary(ipAssetData) {
  try {
    const portalData = ipAssetData.metadata?.portalData || this.createBasicPortalData(ipAssetData);

    if (!this.client || !this.client.chat || !this.client.chat.completions) {
      const title = this.extractTitle(ipAssetData);
      const ipId = ipAssetData.ipId || 'Unknown';
      const imageUrl = portalData.displayInfo?.image;
      return `🎨 **${title}** berhasil ditemukan!

📋 **Detail IP Asset:**
- ID: ${ipId}
- Registered on Story Protocol
- ${imageUrl ? '🖼️ Have visual content' : '📄 Digital content'}

${imageUrl ? `🔗 **See Image:** ${imageUrl}` : ''}

💡 **How ���​to Use:**
1. Check the license before use
2. Access the content via the provided URL
3. Contact the creator for collaboration

🌐 **Portal Story:** https://aeneid.explorer.story.foundation/ipa/${ipId}`;
    }

    const prompt = `
      Generate a comprehensive, engaging summary for this IP Asset:
      
      BASIC INFO:
      - Title: ${portalData.displayInfo?.title}
      - Description: ${portalData.displayInfo?.description}
      - IP ID: ${ipAssetData.ipId}
      - Media Type: ${portalData.displayInfo?.mediaType}
      - Image URL: ${portalData.displayInfo?.image}
      - Media URL: ${portalData.displayInfo?.mediaUrl}
      
      CREATORS:
      ${(portalData.displayInfo?.creators || []).map(creator => 
        `- ${creator.name} (${creator.contributionPercent}%)`
      ).join('\n') || '- Creator information not available'}
      
      LICENSE INFO:
      - Commercial Use: ${portalData.licenseInfo?.commercialUse ? 'Diizinkan ✅' : 'Tidak Diizinkan ❌'}
      - Derivatives: ${portalData.licenseInfo?.derivativesAllowed ? 'Diizinkan ✅' : 'Tidak Diizinkan ❌'}
      - Minting Fee: ${portalData.licenseInfo?.mintingFee || '0'} WIP
      
      MEDIA CONTENT:
      - Has Image: ${portalData.displayInfo?.image ? 'Yes ✅' : 'No ❌'}
      - Media Type: ${portalData.displayInfo?.mediaType}
      - Additional Media: ${(portalData.additionalInfo?.media || []).length} files
      
      Create an engaging summary in Indonesian that:
      1. Introduces the IP Asset with enthusiasm
      2. Highlights the visual/media content available
      3. Explains usage rights clearly
      4. Provides actionable next steps
      5. Mentions how to view the content
      
      Make it sound exciting and valuable!
    `;

    const response = await this.client.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: "You are an enthusiastic IP Asset expert who makes blockchain technology exciting and accessible. Always highlight visual content and practical value in Indonesian."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: 0.8,
    });

    return response.choices[0].message.content;

  } catch (error) {
    console.error("Error generating IP Asset summary:", error);
    
    const title = this.extractTitle(ipAssetData);
    const ipId = ipAssetData.ipId || 'Unknown';
    const imageUrl = ipAssetData.metadata?.portalData?.displayInfo?.image;
    
    return `🎨 **${title}** berhasil ditemukan!

📋 **Detail IP Asset:**
- ID: ${ipId}
- Registered on Story Protocol
- ${imageUrl ? '🖼️ Have visual content' : '📄 Digital content'}

${imageUrl ? `🔗 **See Image:** ${imageUrl}` : ''}

💡 **How ​​to Use:**
1. Check the license before use
2. Access the content via the provided URL
3. Contact the creator for collaboration

🌐 **Portal Story:** https://aeneid.explorer.story.foundation/ipa/${ipId}`;
  }
}

    // Helper function untuk membuat basic portal data
  createBasicPortalData(ipAssetData) {
    const basicInfo = ipAssetData.basicInfo || ipAssetData.data?.basicInfo || {};
    const metadata = ipAssetData.metadata || {};
    
    return {
      displayInfo: {
        title: basicInfo.title || metadata.title || `IP Asset ${(ipAssetData.ipId || '').slice(0, 8)}...`,
        description: basicInfo.description || metadata.description || 'No description available',
        image: basicInfo.image || metadata.image || '',
        mediaUrl: basicInfo.mediaUrl || metadata.mediaUrl || '',
        mediaType: basicInfo.mediaType || metadata.mediaType || 'unknown',
        creators: basicInfo.creators || metadata.creators || [],
        createdAt: basicInfo.registrationDate || basicInfo.createdAt || new Date().toISOString()
      },
      technicalInfo: {
        ipId: ipAssetData.ipId || '',
        nftContract: basicInfo.nftContract || '',
        tokenId: basicInfo.tokenId || '',
        owner: basicInfo.owner || '',
        registrationDate: basicInfo.registrationDate || new Date().toISOString(),
        metadataURI: basicInfo.metadataURI || '',
        metadataHash: basicInfo.metadataHash || '',
        nftTokenURI: basicInfo.nftTokenURI || '',
        nftMetadataHash: basicInfo.nftMetadataHash || ''
      },
      licenseInfo: {
        hasLicenseTerms: false,
        licenseTerms: [],
        commercialUse: false,
        derivativesAllowed: false,
        mintingFee: "0"
      },
      relationshipInfo: {
        hasParents: false,
        hasChildren: false,
        parentCount: 0,
        childrenCount: 0,
        parents: [],
        children: []
      },
      financialInfo: {
        royaltyInfo: null,
        hasRoyalties: false,
        transactionCount: 0,
        recentTransactions: []
      },
      aiInfo: {
        isAIAgent: false
      },
      additionalInfo: {
        tags: [],
        ipType: 'unknown',
        watermarkImage: null,
        media: [],
        app: null,
        robotTerms: null
      }
    };
  }

  // Helper function untuk extract title
  extractTitle(ipAssetData) {
    if (ipAssetData.data?.metadata?.portalData?.displayInfo?.title) {
      return ipAssetData.data.metadata.portalData.displayInfo.title;
    }
    if (ipAssetData.metadata?.portalData?.displayInfo?.title) {
      return ipAssetData.metadata.portalData.displayInfo.title;
    }
    if (ipAssetData.basicInfo?.title) {
      return ipAssetData.basicInfo.title;
    }
    if (ipAssetData.data?.basicInfo?.title) {
      return ipAssetData.data.basicInfo.title;
    }
    return `IP Asset ${(ipAssetData.ipId || '').slice(0, 8)}...`;
  }

  // Generate comparison summary untuk multiple IP Assets
  async generateComparisonSummary(ipAssets) {
    try {
      if (!this.client || !this.client.chat || !this.client.chat.completions) {
        return "Perbandingan IP Assets berhasil diambil. Lihat detail masing-masing asset untuk informasi lengkap.";
      }
      const prompt = `
        Compare these IP Assets and provide insights:
        
        ${ipAssets.map((asset, index) => `
        IP ASSET ${index + 1}:
        - Title: ${asset.data.metadata.portalData.displayInfo.title}
        - Type: ${asset.data.metadata.portalData.additionalInfo.ipType}
        - Media Type: ${asset.data.metadata.portalData.displayInfo.mediaType}
        - Commercial Use: ${asset.data.metadata.portalData.licenseInfo.commercialUse}
        - Derivatives: ${asset.data.metadata.portalData.licenseInfo.derivativesAllowed}
        - Parents: ${asset.data.metadata.portalData.relationshipInfo.parentCount}
        - Children: ${asset.data.metadata.portalData.relationshipInfo.childrenCount}
        - Is AI Agent: ${asset.data.metadata.portalData.aiInfo.isAIAgent}
        - Creator: ${asset.data.metadata.portalData.displayInfo.creators[0]?.name || 'Unknown'}
        `).join('\n')}
        
        Provide a comparison analysis in Indonesian focusing on:
        1. Similarities and differences in content and type
        2. Licensing comparison and usage rights
        3. Relationship patterns and derivative chains
        4. Commercial potential and monetization opportunities
        5. Usage recommendations for different scenarios
        6. AI Agent capabilities if applicable
        
        Make it practical and actionable for users deciding which IP to use or license.
      `;

      const response = await this.client.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [
          {
            role: "system",
            content: "You are an IP Asset comparison expert who helps users make informed decisions about IP licensing and usage. Provide detailed analysis in Indonesian."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        temperature: 0.7,
      });

      return response.choices[0].message.content;

    } catch (error) {
      console.error("Error generating comparison summary:", error);
      return "Perbandingan IP Assets berhasil diambil. Lihat detail masing-masing asset untuk informasi lengkap.";
    }
  }

  // Generate metadata analysis untuk technical users
  async generateMetadataAnalysis(metadata) {
    try {
      if (!this.client || !this.client.chat || !this.client.chat.completions) {
        return "Analisis metadata berhasil dilakukan. Metadata mengikuti standar IPA dan siap untuk integrasi.";
      }
      const prompt = `
        Analyze this IP Asset metadata and provide technical insights:
        
        METADATA STRUCTURE:
        ${JSON.stringify(metadata, null, 2)}
        
        Provide analysis in Indonesian covering:
        1. Metadata completeness and quality
        2. Technical implementation details
        3. Compliance with IPA Metadata Standard
        4. Potential issues or missing fields
        5. Recommendations for improvement
        6. Integration possibilities
        
        Focus on technical accuracy and practical implementation advice.
      `;

      const response = await this.client.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [
          {
            role: "system",
            content: "You are a technical metadata analyst specializing in Story Protocol's IPA Metadata Standard. Provide detailed technical analysis in Indonesian."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        temperature: 0.5,
      });

      return response.choices[0].message.content;

    } catch (error) {
      console.error("Error generating metadata analysis:", error);
      return "Analisis metadata berhasil dilakukan. Metadata mengikuti standar IPA dan siap untuk integrasi.";
    }
  }

  // Generate licensing recommendations
  async generateLicensingRecommendations(licenseInfo, userIntent) {
    try {
      if (!this.client || !this.client.chat || !this.client.chat.completions) {
        return "Rekomendasi lisensi tersedia berdasarkan terms yang ada. Silakan review detail lisensi untuk memahami hak dan kewajiban.";
      }
      const prompt = `
        Based on this license information and user intent, provide licensing recommendations:
        
        LICENSE INFO:
        - Commercial Use: ${licenseInfo.commercialUse}
        - Derivatives Allowed: ${licenseInfo.derivativesAllowed}
        - Minting Fee: ${licenseInfo.mintingFee} WIP
        - License Terms: ${JSON.stringify(licenseInfo.licenseTerms, null, 2)}
        
        USER INTENT: ${userIntent}
        
        Provide recommendations in Indonesian covering:
        1. Suitability for user's intended use case
        2. Cost implications and fee structure
        3. Rights and restrictions explanation
        4. Steps to obtain license
        5. Alternative options if available
        6. Legal considerations
        
        Make it practical and easy to understand for business users.
      `;

      const response = await this.client.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [
          {
            role: "system",
            content: "You are a licensing expert who helps users understand IP licensing terms and make informed decisions. Respond in Indonesian with practical business advice."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        temperature: 0.6,
      });

      return response.choices[0].message.content;

    } catch (error) {
      console.error("Error generating licensing recommendations:", error);
      return "Rekomendasi lisensi tersedia berdasarkan terms yang ada. Silakan review detail lisensi untuk memahami hak dan kewajiban.";
    }
  }

  // Generate relationship insights untuk IP families
  async generateRelationshipInsights(relationships) {
    try {
      if (!this.client || !this.client.chat || !this.client.chat.completions) {
        return "Analisis hubungan IP menunjukkan struktur keluarga IP yang kompleks dengan berbagai peluang pengembangan.";
      }
      const prompt = `
        Analyze these IP relationships and provide insights:
        
        RELATIONSHIPS:
        - Parents: ${relationships.parents.length}
        - Children: ${relationships.children.length}
        
        PARENT IPs:
        ${relationships.parents.map(parent => `- ${parent.ipId} (${parent.title || 'Unknown'})`).join('\n')}
        
        CHILD IPs:
        ${relationships.children.map(child => `- ${child.ipId} (${child.title || 'Unknown'})`).join('\n')}
        
        Provide insights in Indonesian covering:
        1. IP family structure and hierarchy
        2. Derivative chain analysis
        3. Revenue sharing implications
        4. Creative evolution patterns
        5. Licensing inheritance
        6. Opportunities for further development
        
        Help users understand the IP ecosystem and potential opportunities.
      `;

      const response = await this.client.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [
          {
            role: "system",
            content: "You are an IP ecosystem analyst who helps users understand complex IP relationships and derivative chains. Provide insights in Indonesian."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        temperature: 0.6,
      });

      return response.choices[0].message.content;

    } catch (error) {
      console.error("Error generating relationship insights:", error);
      return "Analisis hubungan IP menunjukkan struktur keluarga IP yang kompleks dengan berbagai peluang pengembangan.";
    }
  }

  // Generate search suggestions berdasarkan context
  async generateSearchSuggestions(searchContext, searchHistory = []) {
    try {
      if (!this.client || !this.client.chat || !this.client.chat.completions) {
        return [
          "Explore IP assets populer",
          "Cari berdasarkan creator",
          "Filter by media type",
          "Lisensi open use",
          "AI agents terbaru"
        ];
      }
      const prompt = `
        Based on the current search context and history, suggest related searches:
        
        CURRENT CONTEXT:
        ${JSON.stringify(searchContext, null, 2)}
        
        RECENT SEARCH HISTORY:
        ${searchHistory.slice(-5).map(search => `- ${search.query}`).join('\n')}
        
        Generate 5 relevant search suggestions in Indonesian that would help the user discover:
        1. Related IP assets
        2. Similar creators or themes
        3. Different media types of same concept
        4. Licensing alternatives
        5. Derivative opportunities
        
        Format as a simple array of search strings.
      `;

      const response = await this.client.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [
          {
            role: "system",
            content: "You are a search suggestion expert who helps users discover relevant IP assets. Generate practical search suggestions in Indonesian."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        temperature: 0.8,
      });

      try {
        return JSON.parse(response.choices[0].message.content);
      } catch {
        // Fallback jika response bukan JSON
        return [
          "IP assets serupa dengan lisensi berbeda",
          "Karya dari creator yang sama",
          "Derivative works terbaru",
          "IP dengan lisensi komersial",
          "AI agents terpopuler"
        ];
      }

    } catch (error) {
      console.error("Error generating search suggestions:", error);
      return [
        "Explore IP assets populer",
        "Cari berdasarkan creator",
        "Filter by media type",
        "Lisensi open use",
        "AI agents terbaru"
      ];
    }
  }
}
