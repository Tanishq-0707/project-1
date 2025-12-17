const fs = require('fs').promises;
const path = require('path');

class InventoryTracker {
  constructor(wsServer) {
    this.productsFile = path.join(__dirname, 'products.json');
    this.wsServer = wsServer;
    this.products = [];
    this.loadProducts();
  }

  /**
   * Load products from JSON file
   */
  async loadProducts() {
    try {
      const data = await fs.readFile(this.productsFile, 'utf8');
      const parsed = JSON.parse(data);
      this.products = parsed.products;
      console.log(`Loaded ${this.products.length} products`);
    } catch (error) {
      console.error('Error loading products:', error);
      this.products = [];
    }
  }

  /**
   * Save products to JSON file
   */
  async saveProducts() {
    try {
      await fs.writeFile(
        this.productsFile,
        JSON.stringify({ products: this.products }, null, 2),
        'utf8'
      );
    } catch (error) {
      console.error('Error saving products:', error);
    }
  }

  /**
   * Get all products
   * @returns {Array<Object>} - Array of all products
   */
  getAllProducts() {
    return this.products;
  }

  /**
   * Get product by ID
   * @param {number} id - Product ID
   * @returns {Object|null} - Product or null if not found
   */
  getProductById(id) {
    return this.products.find(p => p.id === id) || null;
  }

  /**
   * Update product inventory
   * @param {number} id - Product ID
   * @param {number} quantity - New quantity
   * @returns {Object|null} - Updated product or null if not found
   */
  async updateInventory(id, quantity) {
    const product = this.products.find(p => p.id === id);
    
    if (!product) {
      return null;
    }

    const oldQuantity = product.inventory;
    product.inventory = Math.max(0, quantity); // Ensure non-negative
    
    await this.saveProducts();
    
    // Broadcast inventory update to all connected WebSocket clients
    this.broadcastInventoryUpdate({
      id: product.id,
      name: product.name,
      oldInventory: oldQuantity,
      newInventory: product.inventory,
      timestamp: new Date().toISOString()
    });

    return product;
  }

  /**
   * Simulate a purchase (decrease inventory)
   * @param {number} id - Product ID
   * @param {number} quantity - Quantity to purchase
   * @returns {Object} - Result object with success status and message
   */
  async purchaseProduct(id, quantity = 1) {
    const product = this.products.find(p => p.id === id);
    
    if (!product) {
      return { success: false, message: 'Product not found' };
    }

    if (product.inventory < quantity) {
      return { 
        success: false, 
        message: `Insufficient inventory. Only ${product.inventory} available.` 
      };
    }

    await this.updateInventory(id, product.inventory - quantity);
    
    return { 
      success: true, 
      message: `Successfully purchased ${quantity} unit(s)`,
      product: product
    };
  }

  /**
   * Restock product (increase inventory)
   * @param {number} id - Product ID
   * @param {number} quantity - Quantity to add
   * @returns {Object|null} - Updated product or null if not found
   */
  async restockProduct(id, quantity) {
    const product = this.products.find(p => p.id === id);
    
    if (!product) {
      return null;
    }

    return await this.updateInventory(id, product.inventory + quantity);
  }

  /**
   * Get inventory status (low stock products)
   * @param {number} threshold - Low stock threshold (default: 30)
   * @returns {Array<Object>} - Array of low stock products
   */
  getLowStockProducts(threshold = 30) {
    return this.products
      .filter(p => p.inventory <= threshold)
      .sort((a, b) => a.inventory - b.inventory);
  }

  /**
   * Broadcast inventory update to all WebSocket clients
   * @param {Object} update - Update data
   */
  broadcastInventoryUpdate(update) {
    if (!this.wsServer) return;

    const message = JSON.stringify({
      type: 'inventory_update',
      data: update
    });

    const WebSocket = require('ws');
    this.wsServer.clients.forEach(client => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(message);
      }
    });
  }

  /**
   * Simulate random inventory changes (for demo purposes)
   */
  startRandomInventoryUpdates(intervalMs = 30000) {
    setInterval(() => {
      if (this.products.length === 0) return;

      // Randomly select a product
      const randomIndex = Math.floor(Math.random() * this.products.length);
      const product = this.products[randomIndex];

      // Randomly increase or decrease inventory by 1-5
      const change = Math.floor(Math.random() * 5) + 1;
      const increase = Math.random() > 0.5;
      
      const newInventory = increase 
        ? product.inventory + change 
        : Math.max(0, product.inventory - change);

      this.updateInventory(product.id, newInventory);
      
      console.log(`[Random Update] ${product.name}: ${product.inventory} → ${newInventory}`);
    }, intervalMs);
  }
}

module.exports = InventoryTracker;
