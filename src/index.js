import express from "express";
import cors from "cors";
import path from "path";
import { fileURLToPath } from 'url';
import { SearchAgent } from "./agents/searchAgent.js";
import { config } from "./utils/config.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const searchAgent = new SearchAgent();

// Middleware
app.use(cors());
app.use(express.json());

// Serve static files dari folder public
app.use(express.static(path.join(__dirname, '../public')));

// Store search history (dalam production, gunakan database)
let searchHistory = [];

// API Routes
app.post("/api/search", async (req, res) => {
  try {
    const { query, filters } = req.body || {};

    if (!query) {
      return res.status(400).json({
        success: false,
        error: "Query is required"
      });
    }

    let result;
    if (filters && typeof filters === 'object' && Object.keys(filters).length > 0) {
      result = await searchAgent.searchWithFilters(query, filters);
      result.query = query;
      result.timestamp = new Date().toISOString();
    } else {
      result = await searchAgent.search(query);
    }

    searchHistory.push(result);

    res.json(result);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

app.post("/search/ipid", async (req, res) => {
  try {
    console.log("📥 IPID Search Request:", req.body);
    const { ipId } = req.body;
    
    if (!ipId) {
      return res.status(400).json({
        success: false,
        error: "IPID is required"
      });
    }

    console.log(`🔍 Processing IPID: ${ipId}`);
    const result = await searchAgent.searchByIPID(ipId);
    console.log("✅ IPID Search Result:", result.success);
    
    searchHistory.push(result);
    res.json(result);
  } catch (error) {
    console.error("❌ IPID Search Error:", error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

app.get("/api/recommendations", async (req, res) => {
  try {
    const recommendations = await searchAgent.getRecommendations(searchHistory);
    res.json({
      success: true,
      recommendations
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

app.get("/api/history", (req, res) => {
  res.json({
    success: true,
    history: searchHistory.slice(-10) // Last 10 searches
  });
});

app.get("/api/health", (req, res) => {
  res.json({
    success: true,
    message: "Smart IP Search Agent is running",
    timestamp: new Date().toISOString()
  });
});

// Serve main HTML file untuk semua non-API routes
app.get('*', (req, res) => {
  if (!req.path.startsWith('/api')) {
    res.sendFile(path.join(__dirname, '../public/index.html'));
  }
});


app.post("/search/batch-ipid", async (req, res) => {
  try {
    const { ipIds } = req.body;
    
    if (!ipIds || !Array.isArray(ipIds) || ipIds.length === 0) {
      return res.status(400).json({
        success: false,
        error: "Array of IPIDs is required"
      });
    }

    const result = await searchAgent.searchMultipleIPIDs(ipIds);
    
    // Save to history
    searchHistory.push(result);
    
    res.json(result);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

app.post("/search/smart", async (req, res) => {
  try {
    const { input } = req.body;
    
    if (!input) {
      return res.status(400).json({
        success: false,
        error: "Search input is required"
      });
    }

    const result = await searchAgent.smartSearch(input);
    
    // Save to history
    searchHistory.push(result);
    
    res.json(result);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Get detailed metadata for specific IPID
app.get("/metadata/:ipId", async (req, res) => {
  try {
    const { ipId } = req.params;
    
    const result = await searchAgent.searchByIPID(ipId);
    
    if (result.success) {
      res.json({
        success: true,
        metadata: result.data.metadata,
        portalData: result.data.metadata.portalData
      });
    } else {
      res.status(404).json(result);
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Start server
app.listen(config.port, () => {
  console.log(`🚀 Smart IP Search Agent running on port ${config.port}`);
  console.log(`📡 Story Protocol connected to ${config.storyRpcUrl}`);
  console.log(`🌐 Frontend available at http://localhost:${config.port}`);
});
