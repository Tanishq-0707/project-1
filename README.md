# AI Product Search & Real-Time Inventory Tracker

An intelligent e-commerce platform that uses AI to help users find products based on their intent (e.g., "beach trip"), with real-time inventory tracking via WebSocket.

## 🌟 Features

### AI-Powered Intent Recognition
- Search products by intent rather than keywords
- Example: Search "beach trip" to find goggles, beachwear, barbecue items, coolers, and beach accessories
- Intelligent tag extraction and product ranking
- Supports OpenAI API for advanced intent recognition (optional)
- Falls back to keyword matching if OpenAI is not configured

### Real-Time Inventory Tracking
- Live inventory updates via WebSocket
- Visual inventory status indicators (high/medium/low stock)
- Real-time notifications when inventory changes
- Purchase and restock simulation

### Product Categories
- **Goggles**: Swimming goggles, snorkeling masks, safety goggles
- **Beachwear**: Bikinis, swim trunks, rash guards, cover-ups
- **Barbecue Items**: Grills, BBQ tools, thermometers, cleaning supplies
- **Beach Accessories**: Towels, umbrellas, bags, coolers
- **Beach Toys**: Beach balls, frisbees, sandcastle kits
- **Pool Accessories**: Floats, waterproof phone cases

## 🚀 Quick Start

### Prerequisites
- Node.js (v14 or higher)
- npm or yarn
- OpenAI API key (optional, for AI-powered search)

### Installation

1. Clone the repository:
```bash
git clone https://github.com/Tanishq-0707/project-1.git
cd project-1
```

2. Install dependencies:
```bash
npm install
```

3. Configure environment (optional):
```bash
cp .env.example .env
# Edit .env and add your OpenAI API key if you want AI-powered search
```

4. Start the server:
```bash
npm start
```

5. Open your browser and navigate to:
```
http://localhost:3000
```

## 📖 Usage

### Searching for Products

Simply type your intent in the search box:
- "beach trip" - Find all beach-related items
- "pool party" - Get pool accessories, floats, coolers, BBQ items
- "barbecue" - Find grills, tools, and cooking equipment
- "kids activities" - Discover toys and games
- "water sports" - Get goggles, snorkeling gear, and swimwear

### Inventory Management

Each product card shows:
- Current stock level with visual indicator
- Purchase button (simulates buying 1 unit)
- Restock button (adds 5 units to inventory)

All inventory changes are broadcast in real-time to all connected clients via WebSocket.

## 🏗️ Architecture

### Backend (Node.js + Express)
- **server/server.js**: Main Express server with REST API and WebSocket
- **server/aiService.js**: AI intent recognition using OpenAI API with fallback
- **server/inventoryTracker.js**: Real-time inventory management
- **server/products.json**: Product database (20 products with categories and tags)

### Frontend (Vanilla JavaScript)
- **client/public/index.html**: Main UI
- **client/public/app.js**: Frontend logic with WebSocket client

## 🔌 API Endpoints

### GET /api/health
Health check endpoint

### GET /api/products
Get all products

### GET /api/products/:id
Get specific product by ID

### POST /api/search
Search products by intent
```json
{
  "query": "beach trip"
}
```

### POST /api/purchase/:id
Simulate product purchase
```json
{
  "quantity": 1
}
```

### POST /api/restock/:id
Restock product
```json
{
  "quantity": 5
}
```

### GET /api/inventory/low-stock
Get low stock products (threshold: 30)

## 🔧 Configuration

### Environment Variables

Create a `.env` file in the root directory:

```env
# Optional: OpenAI API Key for AI-powered intent recognition
OPENAI_API_KEY=your_openai_api_key_here

# Server Port (default: 3000)
PORT=3000
```

**Note**: The application works perfectly without an OpenAI API key using intelligent keyword matching.

## 🧪 Testing the Features

### Test AI Search
1. Enter "beach trip" in the search box
2. See relevant products: goggles, beachwear, BBQ items, coolers, beach accessories
3. Products are ranked by relevance score

### Test Real-Time Inventory
1. Open the app in two browser windows side by side
2. Click "Purchase" on a product in one window
3. Watch the inventory update in real-time in both windows
4. See the notification and visual animation

### Test Product Categories
Try these search terms:
- "swimming" - Goggles, beachwear, pool items
- "bbq" - Grills, tools, coolers
- "kids" - Toys, games, rash guards
- "vacation" - Beach items, swimwear

## 📊 Product Database

The system includes 20 diverse products across multiple categories:
- 3 types of goggles (swimming, snorkeling, safety)
- 4 beachwear items (bikini, trunks, rash guard, cover-up)
- 4 barbecue items (grill, tools, thermometer, brush)
- 9 beach/pool accessories (towels, umbrella, bag, cooler, toys, float, phone case)

Each product has:
- Unique ID
- Name and description
- Category
- Multiple relevant tags
- Price
- Current inventory level

## 🎨 UI Features

- Modern gradient design
- Responsive grid layout
- Real-time inventory bars with color coding
- Product relevance scoring
- Live connection status indicator
- Toast notifications for actions
- Animated updates
- Example search suggestions

## 🔐 Security Note

This is a demonstration project. In production:
- Add authentication and authorization
- Validate and sanitize all inputs
- Use environment variables for sensitive data
- Implement rate limiting
- Add HTTPS
- Use a proper database instead of JSON files

## 🤝 Contributing

Contributions are welcome! Feel free to submit issues or pull requests.

## 📝 License

ISC

## 🙏 Acknowledgments

- OpenAI for GPT-3.5 Turbo API
- Express.js for the backend framework
- ws library for WebSocket support
