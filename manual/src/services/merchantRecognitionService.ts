import { DatabaseService } from './databaseService';

export interface MerchantInfo {
  id: string;
  name: string;
  aliases: string[];
  category: string;
  confidence: number;
  patterns: string[];
  location?: {
    country: string;
    region?: string;
    city?: string;
  };
  businessType: 'retail' | 'restaurant' | 'service' | 'online' | 'gas_station' | 'pharmacy' | 'grocery' | 'other';
  defaultAmount?: number; // For common purchases
  tags: string[];
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface MerchantRecognitionResult {
  merchant?: MerchantInfo;
  confidence: number;
  matchType: 'exact' | 'alias' | 'pattern' | 'fuzzy' | 'learned';
  suggestedCategory?: string;
  alternatives: MerchantInfo[];
}

export interface LearningData {
  originalText: string;
  merchantName: string;
  category: string;
  userConfirmed: boolean;
  frequency: number;
  lastSeen: Date;
}

class MerchantRecognitionService {
  private databaseService: DatabaseService;
  private merchantsCache: Map<string, MerchantInfo> = new Map();
  private learningData: Map<string, LearningData> = new Map();
  private initialized = false;

  constructor() {
    this.databaseService = new DatabaseService();
  }

  /**
   * Initialize service with merchant database
   */
  async initialize(): Promise<void> {
    if (this.initialized) return;

    try {
      await this.loadMerchantDatabase();
      await this.loadLearningData();
      await this.seedDefaultMerchants();
      this.initialized = true;
      console.log(`Merchant Recognition initialized with ${this.merchantsCache.size} merchants`);
    } catch (error) {
      console.error('Failed to initialize merchant recognition:', error);
      throw error;
    }
  }

  /**
   * Recognize merchant from receipt text
   */
  async recognizeMerchant(receiptText: string): Promise<MerchantRecognitionResult> {
    await this.initialize();

    try {
      const cleanedText = this.cleanReceiptText(receiptText);
      const textLines = cleanedText.split('\n').map(line => line.trim()).filter(Boolean);

      // Try different recognition strategies
      const results = await Promise.all([
        this.exactMatch(textLines),
        this.aliasMatch(textLines),
        this.patternMatch(textLines),
        this.fuzzyMatch(textLines),
        this.learnedMatch(textLines)
      ]);

      // Find the best match
      const bestResult = results
        .filter(result => result !== null)
        .sort((a, b) => b!.confidence - a!.confidence)[0];

      if (bestResult) {
        // Update learning data
        await this.updateLearningData(receiptText, bestResult);
        return bestResult;
      }

      // No match found - create learning opportunity
      return {
        confidence: 0,
        matchType: 'fuzzy',
        alternatives: this.getSuggestedMerchants(textLines)
      };

    } catch (error) {
      console.error('Merchant recognition failed:', error);
      return {
        confidence: 0,
        matchType: 'fuzzy',
        alternatives: []
      };
    }
  }

  /**
   * Add new merchant to database
   */
  async addMerchant(merchantInfo: Omit<MerchantInfo, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    await this.initialize();

    try {
      const merchant: MerchantInfo = {
        ...merchantInfo,
        id: `merchant_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      await this.databaseService.saveMerchant(merchant);
      this.merchantsCache.set(merchant.id, merchant);

      console.log(`Added new merchant: ${merchant.name}`);
      return merchant.id;
    } catch (error) {
      console.error('Failed to add merchant:', error);
      throw error;
    }
  }

  /**
   * Learn from user corrections
   */
  async learnFromCorrection(
    originalText: string,
    correctedMerchant: string,
    correctedCategory: string
  ): Promise<void> {
    await this.initialize();

    try {
      const learningKey = this.createLearningKey(originalText, correctedMerchant);
      const existing = this.learningData.get(learningKey);

      const learningEntry: LearningData = {
        originalText: originalText.toLowerCase(),
        merchantName: correctedMerchant,
        category: correctedCategory,
        userConfirmed: true,
        frequency: existing ? existing.frequency + 1 : 1,
        lastSeen: new Date()
      };

      this.learningData.set(learningKey, learningEntry);
      await this.persistLearningData();

      console.log(`Learned: "${originalText}" -> "${correctedMerchant}" (${correctedCategory})`);

      // If frequency is high enough, suggest creating a permanent merchant
      if (learningEntry.frequency >= 3) {
        await this.suggestMerchantCreation(learningEntry);
      }
    } catch (error) {
      console.error('Learning from correction failed:', error);
    }
  }

  /**
   * Get merchant suggestions based on partial input
   */
  async getMerchantSuggestions(
    input: string,
    limit: number = 5
  ): Promise<MerchantInfo[]> {
    await this.initialize();

    const inputLower = input.toLowerCase();
    const suggestions: { merchant: MerchantInfo; score: number }[] = [];

    for (const merchant of this.merchantsCache.values()) {
      if (!merchant.isActive) continue;

      let score = 0;

      // Exact name match
      if (merchant.name.toLowerCase().includes(inputLower)) {
        score += 10;
      }

      // Alias match
      for (const alias of merchant.aliases) {
        if (alias.toLowerCase().includes(inputLower)) {
          score += 8;
        }
      }

      // Pattern match
      for (const pattern of merchant.patterns) {
        if (pattern.toLowerCase().includes(inputLower)) {
          score += 6;
        }
      }

      // Tags match
      for (const tag of merchant.tags) {
        if (tag.toLowerCase().includes(inputLower)) {
          score += 4;
        }
      }

      if (score > 0) {
        suggestions.push({ merchant, score });
      }
    }

    return suggestions
      .sort((a, b) => b.score - a.score)
      .slice(0, limit)
      .map(s => s.merchant);
  }

  /**
   * Get recognition statistics
   */
  async getRecognitionStats(): Promise<{
    totalMerchants: number;
    activeMerchants: number;
    learningEntries: number;
    topCategories: { category: string; count: number }[];
    recentLearnings: LearningData[];
  }> {
    await this.initialize();

    const activeMerchants = Array.from(this.merchantsCache.values()).filter(m => m.isActive);
    const categoryCount = new Map<string, number>();

    activeMerchants.forEach(merchant => {
      const current = categoryCount.get(merchant.category) || 0;
      categoryCount.set(merchant.category, current + 1);
    });

    const topCategories = Array.from(categoryCount.entries())
      .map(([category, count]) => ({ category, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    const recentLearnings = Array.from(this.learningData.values())
      .sort((a, b) => b.lastSeen.getTime() - a.lastSeen.getTime())
      .slice(0, 10);

    return {
      totalMerchants: this.merchantsCache.size,
      activeMerchants: activeMerchants.length,
      learningEntries: this.learningData.size,
      topCategories,
      recentLearnings
    };
  }

  // Private methods

  private async loadMerchantDatabase(): Promise<void> {
    try {
      const merchants = await this.databaseService.getMerchants();
      this.merchantsCache.clear();

      merchants.forEach(merchant => {
        this.merchantsCache.set(merchant.id, merchant);
      });
    } catch (error) {
      console.error('Failed to load merchant database:', error);
      // Initialize with empty cache
      this.merchantsCache.clear();
    }
  }

  private async loadLearningData(): Promise<void> {
    try {
      const learningEntries = await this.databaseService.getLearningData();
      this.learningData.clear();

      learningEntries.forEach(entry => {
        const key = this.createLearningKey(entry.originalText, entry.merchantName);
        this.learningData.set(key, entry);
      });
    } catch (error) {
      console.error('Failed to load learning data:', error);
      this.learningData.clear();
    }
  }

  private async seedDefaultMerchants(): Promise<void> {
    if (this.merchantsCache.size > 0) return; // Already seeded

    const defaultMerchants: Omit<MerchantInfo, 'id' | 'createdAt' | 'updatedAt'>[] = [
      // German Grocery Stores
      {
        name: 'REWE',
        aliases: ['REWE Group', 'REWE Markt', 'REWE CENTER'],
        category: 'Lebensmittel',
        confidence: 0.95,
        patterns: ['rewe', 'nahkauf'],
        businessType: 'grocery',
        tags: ['grocery', 'food', 'german'],
        isActive: true,
        location: { country: 'DE' }
      },
      {
        name: 'EDEKA',
        aliases: ['EDEKA Markt', 'EDEKA CENTER', 'E CENTER'],
        category: 'Lebensmittel',
        confidence: 0.95,
        patterns: ['edeka', 'e center'],
        businessType: 'grocery',
        tags: ['grocery', 'food', 'german'],
        isActive: true,
        location: { country: 'DE' }
      },
      {
        name: 'ALDI',
        aliases: ['ALDI SÜD', 'ALDI NORD', 'ALDI Markt'],
        category: 'Lebensmittel',
        confidence: 0.95,
        patterns: ['aldi', 'aldi süd', 'aldi nord'],
        businessType: 'grocery',
        tags: ['grocery', 'discount', 'german'],
        isActive: true,
        location: { country: 'DE' }
      },
      {
        name: 'LIDL',
        aliases: ['LIDL Markt', 'LIDL STIFTUNG'],
        category: 'Lebensmittel',
        confidence: 0.95,
        patterns: ['lidl'],
        businessType: 'grocery',
        tags: ['grocery', 'discount', 'german'],
        isActive: true,
        location: { country: 'DE' }
      },

      // Gas Stations
      {
        name: 'Shell',
        aliases: ['Shell Station', 'Shell Tankstelle'],
        category: 'Transport',
        confidence: 0.90,
        patterns: ['shell', 'tankstelle'],
        businessType: 'gas_station',
        tags: ['gas', 'fuel', 'international'],
        isActive: true,
        location: { country: 'DE' }
      },
      {
        name: 'ARAL',
        aliases: ['ARAL Tankstelle', 'ARAL Station'],
        category: 'Transport',
        confidence: 0.90,
        patterns: ['aral'],
        businessType: 'gas_station',
        tags: ['gas', 'fuel', 'german'],
        isActive: true,
        location: { country: 'DE' }
      },

      // Pharmacies
      {
        name: 'DM',
        aliases: ['dm-drogerie markt', 'dm drogerie', 'DM MARKT'],
        category: 'Gesundheit',
        confidence: 0.90,
        patterns: ['dm-drogerie', 'dm markt', 'drogerie markt'],
        businessType: 'pharmacy',
        tags: ['pharmacy', 'health', 'cosmetics', 'german'],
        isActive: true,
        location: { country: 'DE' }
      },
      {
        name: 'ROSSMANN',
        aliases: ['Rossmann Drogerie', 'Dirk Rossmann'],
        category: 'Gesundheit',
        confidence: 0.90,
        patterns: ['rossmann', 'drogerie rossmann'],
        businessType: 'pharmacy',
        tags: ['pharmacy', 'health', 'cosmetics', 'german'],
        isActive: true,
        location: { country: 'DE' }
      },

      // Restaurants & Fast Food
      {
        name: 'McDonald\'s',
        aliases: ['McDonalds', 'Mc Donalds', 'McDoof'],
        category: 'Restaurants',
        confidence: 0.85,
        patterns: ['mcdonald', 'mcdonalds', 'mcd'],
        businessType: 'restaurant',
        tags: ['fastfood', 'restaurant', 'international'],
        isActive: true,
        location: { country: 'DE' },
        defaultAmount: 8.50
      },
      {
        name: 'Burger King',
        aliases: ['BK', 'Burger King Restaurant'],
        category: 'Restaurants',
        confidence: 0.85,
        patterns: ['burger king', 'burgerking', 'bk'],
        businessType: 'restaurant',
        tags: ['fastfood', 'restaurant', 'international'],
        isActive: true,
        location: { country: 'DE' },
        defaultAmount: 9.20
      },

      // Online Services
      {
        name: 'Amazon',
        aliases: ['Amazon.de', 'Amazon EU', 'AMAZON PAYMENTS'],
        category: 'Shopping',
        confidence: 0.95,
        patterns: ['amazon', 'amzn', 'amazon.de'],
        businessType: 'online',
        tags: ['online', 'shopping', 'international'],
        isActive: true,
        location: { country: 'DE' }
      },
      {
        name: 'PayPal',
        aliases: ['PayPal Europe', 'PAYPAL INST XFER'],
        category: 'Services',
        confidence: 0.90,
        patterns: ['paypal', 'pp'],
        businessType: 'service',
        tags: ['payment', 'online', 'international'],
        isActive: true,
        location: { country: 'DE' }
      }
    ];

    for (const merchantData of defaultMerchants) {
      await this.addMerchant(merchantData);
    }

    console.log(`Seeded ${defaultMerchants.length} default merchants`);
  }

  private cleanReceiptText(text: string): string {
    return text
      .replace(/[^\w\s\-\.]/gi, ' ')
      .replace(/\s+/g, ' ')
      .trim()
      .toLowerCase();
  }

  private async exactMatch(textLines: string[]): Promise<MerchantRecognitionResult | null> {
    for (const line of textLines) {
      for (const merchant of this.merchantsCache.values()) {
        if (!merchant.isActive) continue;

        if (line.includes(merchant.name.toLowerCase())) {
          return {
            merchant,
            confidence: 0.95,
            matchType: 'exact',
            suggestedCategory: merchant.category,
            alternatives: []
          };
        }
      }
    }
    return null;
  }

  private async aliasMatch(textLines: string[]): Promise<MerchantRecognitionResult | null> {
    for (const line of textLines) {
      for (const merchant of this.merchantsCache.values()) {
        if (!merchant.isActive) continue;

        for (const alias of merchant.aliases) {
          if (line.includes(alias.toLowerCase())) {
            return {
              merchant,
              confidence: 0.90,
              matchType: 'alias',
              suggestedCategory: merchant.category,
              alternatives: []
            };
          }
        }
      }
    }
    return null;
  }

  private async patternMatch(textLines: string[]): Promise<MerchantRecognitionResult | null> {
    for (const line of textLines) {
      for (const merchant of this.merchantsCache.values()) {
        if (!merchant.isActive) continue;

        for (const pattern of merchant.patterns) {
          if (line.includes(pattern.toLowerCase())) {
            return {
              merchant,
              confidence: 0.80,
              matchType: 'pattern',
              suggestedCategory: merchant.category,
              alternatives: []
            };
          }
        }
      }
    }
    return null;
  }

  private async fuzzyMatch(textLines: string[]): Promise<MerchantRecognitionResult | null> {
    const candidates: { merchant: MerchantInfo; score: number }[] = [];

    for (const line of textLines) {
      for (const merchant of this.merchantsCache.values()) {
        if (!merchant.isActive) continue;

        const score = this.calculateFuzzyScore(line, merchant);
        if (score > 0.6) {
          candidates.push({ merchant, score });
        }
      }
    }

    if (candidates.length === 0) return null;

    const best = candidates.sort((a, b) => b.score - a.score)[0];
    const alternatives = candidates
      .slice(1, 4)
      .map(c => c.merchant);

    return {
      merchant: best.merchant,
      confidence: best.score * 0.75, // Reduce confidence for fuzzy matches
      matchType: 'fuzzy',
      suggestedCategory: best.merchant.category,
      alternatives
    };
  }

  private async learnedMatch(textLines: string[]): Promise<MerchantRecognitionResult | null> {
    for (const line of textLines) {
      for (const learning of this.learningData.values()) {
        if (!learning.userConfirmed) continue;

        if (line.includes(learning.originalText) ||
            learning.merchantName.toLowerCase().includes(line.substring(0, 10))) {

          // Try to find the actual merchant
          const merchant = Array.from(this.merchantsCache.values())
            .find(m => m.name.toLowerCase() === learning.merchantName.toLowerCase());

          return {
            merchant,
            confidence: Math.min(0.85, 0.6 + (learning.frequency * 0.05)),
            matchType: 'learned',
            suggestedCategory: learning.category,
            alternatives: []
          };
        }
      }
    }
    return null;
  }

  private calculateFuzzyScore(text: string, merchant: MerchantInfo): number {
    let score = 0;
    const textLower = text.toLowerCase();

    // Check name similarity
    const nameScore = this.calculateStringSimilarity(textLower, merchant.name.toLowerCase());
    score += nameScore * 0.5;

    // Check aliases
    for (const alias of merchant.aliases) {
      const aliasScore = this.calculateStringSimilarity(textLower, alias.toLowerCase());
      score = Math.max(score, aliasScore * 0.4);
    }

    // Check patterns
    for (const pattern of merchant.patterns) {
      if (textLower.includes(pattern.toLowerCase())) {
        score += 0.3;
      }
    }

    return Math.min(score, 1.0);
  }

  private calculateStringSimilarity(str1: string, str2: string): number {
    // Simple Levenshtein distance-based similarity
    const matrix: number[][] = [];
    const len1 = str1.length;
    const len2 = str2.length;

    for (let i = 0; i <= len2; i++) {
      matrix[i] = [i];
    }
    for (let j = 0; j <= len1; j++) {
      matrix[0][j] = j;
    }

    for (let i = 1; i <= len2; i++) {
      for (let j = 1; j <= len1; j++) {
        if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1,
            matrix[i][j - 1] + 1,
            matrix[i - 1][j] + 1
          );
        }
      }
    }

    const distance = matrix[len2][len1];
    const maxLen = Math.max(len1, len2);
    return maxLen === 0 ? 1 : 1 - (distance / maxLen);
  }

  private getSuggestedMerchants(textLines: string[]): MerchantInfo[] {
    const suggestions: { merchant: MerchantInfo; score: number }[] = [];

    for (const line of textLines.slice(0, 5)) { // Check first 5 lines
      for (const merchant of this.merchantsCache.values()) {
        if (!merchant.isActive) continue;

        const score = this.calculateFuzzyScore(line, merchant);
        if (score > 0.3) {
          suggestions.push({ merchant, score });
        }
      }
    }

    return suggestions
      .sort((a, b) => b.score - a.score)
      .slice(0, 3)
      .map(s => s.merchant);
  }

  private createLearningKey(originalText: string, merchantName: string): string {
    return `${originalText.toLowerCase().substring(0, 20)}_${merchantName.toLowerCase()}`;
  }

  private async updateLearningData(
    receiptText: string,
    result: MerchantRecognitionResult
  ): Promise<void> {
    if (!result.merchant) return;

    const key = this.createLearningKey(receiptText, result.merchant.name);
    const existing = this.learningData.get(key);

    const learningEntry: LearningData = {
      originalText: receiptText.substring(0, 100).toLowerCase(),
      merchantName: result.merchant.name,
      category: result.merchant.category,
      userConfirmed: false,
      frequency: existing ? existing.frequency + 1 : 1,
      lastSeen: new Date()
    };

    this.learningData.set(key, learningEntry);
  }

  private async suggestMerchantCreation(learning: LearningData): Promise<void> {
    console.log(`Suggest creating merchant for frequent pattern: ${learning.merchantName}`);
    // This could trigger a UI notification to suggest creating a new merchant entry
  }

  private async persistLearningData(): Promise<void> {
    try {
      const learningArray = Array.from(this.learningData.values());
      await this.databaseService.saveLearningData(learningArray);
    } catch (error) {
      console.error('Failed to persist learning data:', error);
    }
  }
}

export default new MerchantRecognitionService();
