// Configuration
const API_BASE = window.location.origin;
const WS_URL = `${window.location.protocol === 'https:' ? 'wss:' : 'ws:'}//${window.location.host}`;

let ws = null;
let allProducts = [];
let currentSearchResults = [];

// Initialize app
document.addEventListener('DOMContentLoaded', () => {
    initWebSocket();
    loadAllProducts();
    
    // Enter key to search
    document.getElementById('searchInput').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            searchProducts();
        }
    });
});

// WebSocket connection
function initWebSocket() {
    try {
        ws = new WebSocket(WS_URL);
        
        ws.onopen = () => {
            console.log('WebSocket connected');
            updateWSStatus(true);
        };
        
        ws.onmessage = (event) => {
            const message = JSON.parse(event.data);
            handleWSMessage(message);
        };
        
        ws.onerror = (error) => {
            console.error('WebSocket error:', error);
            updateWSStatus(false);
        };
        
        ws.onclose = () => {
            console.log('WebSocket disconnected');
            updateWSStatus(false);
            
            // Reconnect after 3 seconds
            setTimeout(initWebSocket, 3000);
        };
    } catch (error) {
        console.error('WebSocket connection failed:', error);
        updateWSStatus(false);
    }
}

// Handle WebSocket messages
function handleWSMessage(message) {
    console.log('WebSocket message:', message);
    
    if (message.type === 'inventory_update') {
        showNotification(`Inventory Updated: ${message.data.name} (${message.data.newInventory} in stock)`, 'info');
        
        // Update product in memory
        const product = allProducts.find(p => p.id === message.data.id);
        if (product) {
            product.inventory = message.data.newInventory;
        }
        
        // Update display
        updateProductCard(message.data.id, message.data.newInventory);
        updateStats();
    }
}

// Update WebSocket status indicator
function updateWSStatus(connected) {
    const indicator = document.getElementById('wsIndicator');
    const status = document.getElementById('wsStatus');
    
    if (connected) {
        indicator.classList.add('connected');
        status.textContent = 'Live Updates Active';
    } else {
        indicator.classList.remove('connected');
        status.textContent = 'Disconnected';
    }
}

// Load all products
async function loadAllProducts() {
    try {
        const response = await fetch(`${API_BASE}/api/products`);
        const data = await response.json();
        
        if (data.success) {
            allProducts = data.products;
            displayProducts(allProducts);
            updateStats();
        }
    } catch (error) {
        console.error('Error loading products:', error);
        document.getElementById('productsContainer').innerHTML = `
            <div class="no-results">
                <div class="no-results-icon">❌</div>
                <h2>Failed to load products</h2>
                <p>${error.message}</p>
            </div>
        `;
    }
}

// Search products by intent
async function searchProducts() {
    const query = document.getElementById('searchInput').value.trim();
    
    if (!query) {
        displayProducts(allProducts);
        return;
    }
    
    try {
        document.getElementById('productsContainer').innerHTML = '<div class="loading">Searching with AI...</div>';
        
        const response = await fetch(`${API_BASE}/api/search`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ query })
        });
        
        const data = await response.json();
        
        if (data.success) {
            currentSearchResults = data.products;
            displayProducts(data.products, true);
            document.getElementById('searchResults').textContent = data.products.length;
            
            if (data.products.length > 0) {
                showNotification(`Found ${data.products.length} products for "${query}"`, 'success');
            }
        }
    } catch (error) {
        console.error('Search error:', error);
        showNotification('Search failed. Please try again.', 'error');
    }
}

// Set search query from example
function setSearchQuery(query) {
    document.getElementById('searchInput').value = query;
    searchProducts();
}

// Display products
function displayProducts(products, showRelevance = false) {
    const container = document.getElementById('productsContainer');
    
    if (products.length === 0) {
        container.innerHTML = `
            <div class="no-results">
                <div class="no-results-icon">🔍</div>
                <h2>No products found</h2>
                <p>Try a different search term</p>
            </div>
        `;
        return;
    }
    
    const html = `
        <div class="products-grid">
            ${products.map(product => createProductCard(product, showRelevance)).join('')}
        </div>
    `;
    
    container.innerHTML = html;
}

// Create product card HTML
function createProductCard(product, showRelevance = false) {
    const inventoryClass = getInventoryClass(product.inventory);
    const inventoryPercent = Math.min(100, (product.inventory / 150) * 100);
    
    return `
        <div class="product-card" data-product-id="${product.id}">
            ${showRelevance && product.relevanceScore ? `
                <div class="relevance-badge">Match: ${product.relevanceScore}</div>
            ` : ''}
            
            <div class="product-header">
                <div class="product-name">${product.name}</div>
                <div class="product-price">$${product.price.toFixed(2)}</div>
            </div>
            
            <div class="product-category">${product.category}</div>
            
            <div class="product-description">${product.description}</div>
            
            <div class="product-tags">
                ${product.tags.slice(0, 5).map(tag => `<span class="tag">${tag}</span>`).join('')}
            </div>
            
            <div class="inventory-status">
                <span class="inventory-label">Stock:</span>
                <span class="inventory-value ${inventoryClass}" data-inventory="${product.id}">
                    ${product.inventory} units
                </span>
            </div>
            <div class="inventory-bar">
                <div class="inventory-bar-fill ${inventoryClass}" style="width: ${inventoryPercent}%"></div>
            </div>
            
            <div class="action-buttons">
                <button class="btn btn-primary" onclick="purchaseProduct(${product.id})">
                    Purchase
                </button>
                <button class="btn btn-success" onclick="restockProduct(${product.id})">
                    Restock +5
                </button>
            </div>
        </div>
    `;
}

// Get inventory status class
function getInventoryClass(inventory) {
    if (inventory > 50) return 'high';
    if (inventory > 20) return 'medium';
    return 'low';
}

// Update product card in real-time
function updateProductCard(productId, newInventory) {
    const card = document.querySelector(`[data-product-id="${productId}"]`);
    if (!card) return;
    
    // Add animation
    card.classList.add('updated');
    setTimeout(() => card.classList.remove('updated'), 500);
    
    // Update inventory value
    const inventoryElement = card.querySelector(`[data-inventory="${productId}"]`);
    if (inventoryElement) {
        const inventoryClass = getInventoryClass(newInventory);
        inventoryElement.className = `inventory-value ${inventoryClass}`;
        inventoryElement.textContent = `${newInventory} units`;
        
        // Update bar
        const bar = card.querySelector('.inventory-bar-fill');
        if (bar) {
            const inventoryPercent = Math.min(100, (newInventory / 150) * 100);
            bar.className = `inventory-bar-fill ${inventoryClass}`;
            bar.style.width = `${inventoryPercent}%`;
        }
    }
}

// Purchase product
async function purchaseProduct(productId) {
    try {
        const response = await fetch(`${API_BASE}/api/purchase/${productId}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ quantity: 1 })
        });
        
        const data = await response.json();
        
        if (data.success) {
            showNotification('Purchase successful!', 'success');
        } else {
            showNotification(data.message, 'error');
        }
    } catch (error) {
        console.error('Purchase error:', error);
        showNotification('Purchase failed', 'error');
    }
}

// Restock product
async function restockProduct(productId) {
    try {
        const response = await fetch(`${API_BASE}/api/restock/${productId}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ quantity: 5 })
        });
        
        const data = await response.json();
        
        if (data.success) {
            showNotification('Restocked successfully!', 'success');
        } else {
            showNotification('Restock failed', 'error');
        }
    } catch (error) {
        console.error('Restock error:', error);
        showNotification('Restock failed', 'error');
    }
}

// Update statistics
function updateStats() {
    document.getElementById('totalProducts').textContent = allProducts.length;
    
    const lowStock = allProducts.filter(p => p.inventory <= 30).length;
    document.getElementById('lowStock').textContent = lowStock;
    
    const searchCount = currentSearchResults.length || allProducts.length;
    document.getElementById('searchResults').textContent = searchCount;
}

// Show notification
function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.style.animation = 'slideIn 0.3s reverse';
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}
