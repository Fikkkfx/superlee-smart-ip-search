// src/agents/searchAgent.js
import { StoryService } from "../services/storyService.js";
import { LLMProcessor } from "./llmProcessor.js";

export class SearchAgent {
  constructor() {
    this.storyService = new StoryService();
    this.llmProcessor = new LLMProcessor();
  }

  // Main search function - PERBAIKAN
  async search(userQuery) {
    try {
      console.log(`🔍 Processing query: "${userQuery}"`);
      
      // 1. Parse user query dengan LLM
      const parsedQuery = await this.llmProcessor.parseUserQuery(userQuery);
      console.log("📝 Parsed query:", parsedQuery);

      // 2. Check if it's an IPID
      if (parsedQuery.isIPID || this.storyService.isValidIPID(userQuery)) {
        console.log("🎯 Detected IPID, redirecting to IPID search");
        return await this.searchByIPID(userQuery);
      }

      // 3. Search IP assets using corrected method name
      const searchResults = await this.storyService.searchWithFilters(parsedQuery);
      console.log(`📊 Found ${searchResults.length} results`);

      // 4. Generate summary
      const summary = await this.llmProcessor.generateResponseSummary(
        searchResults, 
        userQuery
      );

      // 5. Return structured response
      return {
        success: true,
        query: userQuery,
        parsedQuery,
        results: searchResults,
        summary,
        totalResults: searchResults.length,
        timestamp: new Date().toISOString()
      };

    } catch (error) {
      console.error("❌ Search error:", error);
      return {
        success: false,
        error: error.message,
        query: userQuery,
        timestamp: new Date().toISOString()
      };
    }
  }

  // Search by IPID - fungsi utama
  async searchByIPID(ipId) {
  try {
    const extracted = (ipId || '').match(/0x[a-fA-F0-9]{40}/);
    const targetIpId = (extracted ? extracted[0] : ipId || '').trim();
    console.log(`🔍 Searching by IPID: ${targetIpId}`);

    if (!this.storyService.isValidIPID(targetIpId)) {
      throw new Error(`Invalid IPID format: ${ipId}. IPID should be a valid Ethereum address.`);
    }

    const result = await this.storyService.getIPAssetByIPID(targetIpId);

    // Jika service fallback ke mock, tetap anggap success
    if (!result.success) {
      return {
        success: false,
        searchType: 'ipid',
        ipId: targetIpId,
        error: result.error,
        suggestion: result.suggestion,
        timestamp: new Date().toISOString()
      };
    }

    console.log("📊 IP Asset data received:", JSON.stringify(result, null, 2));

    let summary;
    try {
      summary = await this.llmProcessor.generateIPAssetSummary(result);
    } catch (summaryError) {
      console.error("⚠️ Summary generation failed:", summaryError);
      summary = `IP Asset dengan ID ${targetIpId} berhasil ditemukan di Story Protocol. Lihat detail lengkap di portal.`;
    }

    return {
      success: true,
      searchType: 'ipid',
      ipId: targetIpId,
      data: result,
      summary: summary,
      portalUrl: `https://aeneid.explorer.story.foundation/ipa/${targetIpId}`,
      timestamp: new Date().toISOString()
    };

  } catch (error) {
    console.error(`❌ IPID search error for ${ipId}:`, error);
    return {
      success: false,
      searchType: 'ipid',
      ipId: ipId,
      error: error.message,
      timestamp: new Date().toISOString()
    };
  }
}

  // Search dengan filter spesifik
  async searchWithFilters(query, filters) {
    try {
      const searchParams = {
        query,
        ...filters
      };

      const results = await this.storyService.searchWithFilters(searchParams);
      
      return {
        success: true,
        results,
        filters: searchParams,
        totalResults: results.length
      };
    } catch (error) {
      console.error("Error in filtered search:", error);
      throw error;
    }
  }

  // Smart search - detect if input is IPID or text query
  async smartSearch(input) {
    try {
      // Check if input looks like an IPID
      if (this.storyService.isValidIPID(input)) {
        console.log("🎯 Detected IPID format, searching by IPID");
        return await this.searchByIPID(input);
      } else {
        console.log("🔤 Detected text query, performing natural language search");
        return await this.search(input);
      }
    } catch (error) {
      console.error("❌ Smart search error:", error);
      return {
        success: false,
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }

  // Batch search multiple IPIDs
  async searchMultipleIPIDs(ipIds) {
    try {
      console.log(`🔍 Batch searching ${ipIds.length} IPIDs`);

      const results = await Promise.allSettled(
        ipIds.map(ipId => this.searchByIPID(ipId))
      );

      const successful = results
        .filter(result => result.status === 'fulfilled' && result.value.success)
        .map(result => result.value);

      const failed = results
        .filter(result => result.status === 'rejected' || !result.value.success)
        .map((result, index) => ({
          ipId: ipIds[index],
          error: result.status === 'rejected' ? result.reason : result.value.error
        }));

      return {
        success: true,
        searchType: 'batch_ipid',
        totalSearched: ipIds.length,
        successful: successful.length,
        failed: failed.length,
        results: successful,
        errors: failed,
        timestamp: new Date().toISOString()
      };

    } catch (error) {
      console.error("❌ Batch IPID search error:", error);
      return {
        success: false,
        searchType: 'batch_ipid',
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }

  // Get recommendations berdasarkan search history
  async getRecommendations(searchHistory) {
    try {
      const patterns = this.analyzeSearchPatterns(searchHistory);
      const recommendations = await this.generateRecommendations(patterns);
      return recommendations;
    } catch (error) {
      console.error("Error generating recommendations:", error);
      return [];
    }
  }

  analyzeSearchPatterns(history) {
    const patterns = {
      commonMediaTypes: {},
      commonLicenses: {},
      commonTags: {}
    };

    history.forEach(search => {
      if (search.parsedQuery) {
        const { mediaType, license, tags } = search.parsedQuery;
        
        if (mediaType) {
          patterns.commonMediaTypes[mediaType] = 
            (patterns.commonMediaTypes[mediaType] || 0) + 1;
        }
        
        if (license) {
          patterns.commonLicenses[license] = 
            (patterns.commonLicenses[license] || 0) + 1;
        }
        
        if (tags) {
          tags.forEach(tag => {
            patterns.commonTags[tag] = 
              (patterns.commonTags[tag] || 0) + 1;
          });
        }
      }
    });

    return patterns;
  }

  async generateRecommendations(patterns) {
    const recommendations = [];
    
    const topMediaType = Object.keys(patterns.commonMediaTypes)
      .sort((a, b) => patterns.commonMediaTypes[b] - patterns.commonMediaTypes[a])[0];
    
    if (topMediaType) {
      recommendations.push({
        type: "media_type",
        suggestion: `Explore more ${topMediaType} assets`,
        query: `latest ${topMediaType} assets`
      });
    }

    return recommendations;
  }
}
