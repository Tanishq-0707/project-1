const express = require('express');
const cors = require('cors');
const WebSocket = require('ws');
const http = require('http');
require('dotenv').config();

const AIService = require('./aiService');
const InventoryTracker = require('./inventoryTracker');

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('client/public'));

// Initialize services
const aiService = new AIService();
const inventoryTracker = new InventoryTracker(wss);

// WebSocket connection handling
wss.on('connection', (ws) => {
  console.log('New WebSocket client connected');
  
  // Send initial inventory status
  ws.send(JSON.stringify({
    type: 'connection',
    message: 'Connected to inventory tracker',
    timestamp: new Date().toISOString()
  }));

  ws.on('message', (message) => {
    console.log('Received:', message.toString());
  });

  ws.on('close', () => {
    console.log('WebSocket client disconnected');
  });
});

// API Routes

/**
 * GET / - Health check
 */
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    openai_configured: !!process.env.OPENAI_API_KEY
  });
});

/**
 * GET /api/products - Get all products
 */
app.get('/api/products', (req, res) => {
  try {
    const products = inventoryTracker.getAllProducts();
    res.json({ success: true, products });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/products/:id - Get product by ID
 */
app.get('/api/products/:id', (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const product = inventoryTracker.getProductById(id);
    
    if (!product) {
      return res.status(404).json({ success: false, error: 'Product not found' });
    }
    
    res.json({ success: true, product });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/search - Search products by intent
 */
app.post('/api/search', async (req, res) => {
  try {
    const { query } = req.body;
    
    if (!query) {
      return res.status(400).json({ success: false, error: 'Query is required' });
    }

    console.log(`Search query: "${query}"`);
    
    // Analyze user intent using AI
    const tags = await aiService.analyzeIntent(query);
    console.log(`Extracted tags: ${tags.join(', ')}`);
    
    // Get all products
    const allProducts = inventoryTracker.getAllProducts();
    
    // Rank products by relevance
    const rankedProducts = aiService.rankProducts(allProducts, tags);
    
    res.json({ 
      success: true, 
      query,
      tags,
      products: rankedProducts,
      count: rankedProducts.length
    });
  } catch (error) {
    console.error('Search error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * PUT /api/inventory/:id - Update product inventory
 */
app.put('/api/inventory/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const { quantity } = req.body;
    
    if (quantity === undefined || quantity < 0) {
      return res.status(400).json({ 
        success: false, 
        error: 'Valid quantity is required' 
      });
    }
    
    const product = await inventoryTracker.updateInventory(id, quantity);
    
    if (!product) {
      return res.status(404).json({ success: false, error: 'Product not found' });
    }
    
    res.json({ success: true, product });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/purchase/:id - Simulate a purchase
 */
app.post('/api/purchase/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const { quantity = 1 } = req.body;
    
    const result = await inventoryTracker.purchaseProduct(id, quantity);
    
    if (!result.success) {
      return res.status(400).json(result);
    }
    
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/restock/:id - Restock a product
 */
app.post('/api/restock/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const { quantity } = req.body;
    
    if (!quantity || quantity <= 0) {
      return res.status(400).json({ 
        success: false, 
        error: 'Valid quantity is required' 
      });
    }
    
    const product = await inventoryTracker.restockProduct(id, quantity);
    
    if (!product) {
      return res.status(404).json({ success: false, error: 'Product not found' });
    }
    
    res.json({ success: true, product });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/inventory/low-stock - Get low stock products
 */
app.get('/api/inventory/low-stock', (req, res) => {
  try {
    const threshold = parseInt(req.query.threshold) || 30;
    const lowStockProducts = inventoryTracker.getLowStockProducts(threshold);
    
    res.json({ 
      success: true, 
      threshold,
      products: lowStockProducts,
      count: lowStockProducts.length
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Start server
const PORT = process.env.PORT || 3000;

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`HTTP API: http://localhost:${PORT}`);
  console.log(`WebSocket: ws://localhost:${PORT}`);
  
  if (!process.env.OPENAI_API_KEY) {
    console.log('\n⚠️  OpenAI API key not found. Using fallback intent analysis.');
    console.log('To use AI-powered search, set OPENAI_API_KEY in .env file\n');
  }
  
  // Start random inventory updates for demo (every 30 seconds)
  // inventoryTracker.startRandomInventoryUpdates(30000);
});

module.exports = { app, server, wss };
