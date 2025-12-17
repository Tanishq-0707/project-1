const OpenAI = require('openai');

class AIService {
  constructor() {
    // Initialize OpenAI client only if API key is provided
    this.openai = process.env.OPENAI_API_KEY 
      ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
      : null;
  }

  /**
   * Analyze user intent and extract relevant product tags
   * @param {string} query - User's search query
   * @returns {Promise<Array<string>>} - Array of relevant tags
   */
  async analyzeIntent(query) {
    // If OpenAI is not configured, use fallback keyword matching
    if (!this.openai) {
      return this.fallbackIntentAnalysis(query);
    }

    try {
      const completion = await this.openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [
          {
            role: "system",
            content: `You are a product recommendation assistant. Given a user's intent or search query, identify relevant product categories and tags.
            
Available categories and tags:
- Beach activities: beach, swimming, vacation, sun protection, water sports
- Goggles: goggles, snorkeling, diving, swimming, protection
- Beachwear: beachwear, bikini, swim trunks, swimwear, rash guard, cover-up
- BBQ/Grilling: bbq, grilling, barbecue, outdoor cooking, camping
- Beach accessories: towel, umbrella, cooler, bag, beach toys, sand toys
- Pool: pool, float, swimming
- Kids: kids, children, toys, games

Respond with ONLY a comma-separated list of relevant tags, no explanations.`
          },
          {
            role: "user",
            content: query
          }
        ],
        temperature: 0.7,
        max_tokens: 100
      });

      const tags = completion.choices[0].message.content
        .split(',')
        .map(tag => tag.trim().toLowerCase())
        .filter(tag => tag.length > 0);

      return tags;
    } catch (error) {
      console.error('OpenAI API error:', error.message);
      // Fallback to keyword matching if API fails
      return this.fallbackIntentAnalysis(query);
    }
  }

  /**
   * Fallback intent analysis using keyword matching
   * @param {string} query - User's search query
   * @returns {Array<string>} - Array of relevant tags
   */
  fallbackIntentAnalysis(query) {
    const lowerQuery = query.toLowerCase();
    const tags = new Set();
    const MIN_WORD_LENGTH = 3;

    // Intent mappings
    const intentMappings = {
      'beach trip': ['beach', 'vacation', 'swimming', 'beachwear', 'goggles', 'towel', 'umbrella', 'bbq', 'cooler', 'toys'],
      'beach': ['beach', 'vacation', 'swimming', 'beachwear', 'goggles', 'towel', 'umbrella'],
      'vacation': ['beach', 'vacation', 'swimming', 'beachwear', 'goggles'],
      'swimming': ['swimming', 'goggles', 'beachwear', 'pool', 'beach'],
      'pool party': ['pool', 'swimming', 'beachwear', 'float', 'toys', 'cooler', 'bbq'],
      'bbq': ['bbq', 'grilling', 'outdoor', 'cooking', 'cooler'],
      'barbecue': ['bbq', 'grilling', 'outdoor', 'cooking', 'cooler'],
      'grilling': ['bbq', 'grilling', 'cooking'],
      'camping': ['camping', 'outdoor', 'bbq', 'grilling'],
      'kids': ['kids', 'toys', 'games', 'children'],
      'water sports': ['water sports', 'goggles', 'swimming', 'beach', 'snorkeling'],
      'diving': ['diving', 'snorkeling', 'goggles', 'beach'],
      'snorkeling': ['snorkeling', 'goggles', 'beach'],
      'outdoor': ['outdoor', 'beach', 'camping', 'bbq']
    };

    // Check for exact or partial matches
    for (const [intent, intentTags] of Object.entries(intentMappings)) {
      if (lowerQuery.includes(intent)) {
        intentTags.forEach(tag => tags.add(tag));
      }
    }

    // Also add individual words from query as potential tags
    const words = lowerQuery.split(/\s+/).filter(word => word.length > MIN_WORD_LENGTH);
    words.forEach(word => tags.add(word));

    return Array.from(tags);
  }

  /**
   * Rank products based on relevance to extracted tags
   * @param {Array<Object>} products - Array of products
   * @param {Array<string>} tags - Array of relevant tags
   * @returns {Array<Object>} - Sorted array of products with relevance scores
   */
  rankProducts(products, tags) {
    return products
      .map(product => {
        let score = 0;
        
        // Check how many tags match
        tags.forEach(tag => {
          // Check in product tags
          if (product.tags.some(pTag => pTag.toLowerCase().includes(tag) || tag.includes(pTag.toLowerCase()))) {
            score += 2;
          }
          
          // Check in category
          if (product.category.toLowerCase().includes(tag) || tag.includes(product.category.toLowerCase())) {
            score += 1;
          }
          
          // Check in name
          if (product.name.toLowerCase().includes(tag)) {
            score += 1;
          }
        });

        return {
          ...product,
          relevanceScore: score
        };
      })
      .filter(product => product.relevanceScore > 0)
      .sort((a, b) => b.relevanceScore - a.relevanceScore);
  }
}

module.exports = AIService;
