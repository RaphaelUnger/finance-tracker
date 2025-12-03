import { Transaction } from '../types';
import { DatabaseService } from './databaseService';
import MerchantRecognitionService from './merchantRecognitionService';

export interface ReceiptData {
  amount?: number;
  date?: Date;
  merchant?: string;
  items?: ReceiptItem[];
  total?: number;
  tax?: number;
  currency?: string;
  confidence?: number;
}

export interface ReceiptItem {
  description: string;
  price: number;
  quantity?: number;
}

export interface OCRResult {
  text: string;
  confidence: number;
  boundingBox?: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
}

export interface ParsedReceipt {
  extractedData: ReceiptData;
  originalText: string;
  confidence: number;
  parseErrors: string[];
  suggestedTransaction?: Partial<Transaction>;
}

class ReceiptParser {
  private databaseService: DatabaseService;
  
  // Common patterns for different languages and formats
  private readonly AMOUNT_PATTERNS = [
    // German patterns
    /(?:summe|gesamt|total|betrag|zu zahlen)[\s\:]*([€$]?\s*\d+[,\.]\d{2})/gi,
    /([€$]?\s*\d+[,\.]\d{2})[\s]*(?:eur|euro|€)?$/gmi,
    // English patterns
    /(?:total|amount|sum)[\s\:]*([€$]?\s*\d+[,\.]\d{2})/gi,
    // General patterns
    /^([€$]?\s*\d+[,\.]\d{2})$/gm
  ];

  private readonly DATE_PATTERNS = [
    // German date formats
    /(\d{1,2})[\.\/](\d{1,2})[\.\/](\d{2,4})/g,
    /(\d{2,4})[\.\/](\d{1,2})[\.\/](\d{1,2})/g,
    // ISO date format
    /(\d{4})-(\d{1,2})-(\d{1,2})/g,
    // Text dates
    /(\d{1,2})[\s\.]*(?:januar|februar|märz|april|mai|juni|juli|august|september|oktober|november|dezember)[\s\.]*(\d{2,4})/gi
  ];

  private readonly MERCHANT_PATTERNS = [
    // Store names at beginning of receipt
    /^([A-ZÄÖÜ][a-zäöü\s]+(?:[A-ZÄÖÜ][a-zäöü]*)*)\s*$/gm,
    // Store with address
    /^([A-ZÄÖÜ][A-Za-zäöü\s&]+)\s*\n/gm,
    // Common store patterns
    /^(REWE|EDEKA|ALDI|LIDL|KAUFLAND|DM|ROSSMANN|PENNY|NETTO)/gmi
  ];

  private readonly NOISE_PATTERNS = [
    /^\*+$/gm,
    /^-+$/gm,
    /^=+$/gm,
    /^\.+$/gm,
    /^\s*$$/gm,
    /kassennummer|kassen-nr|bon-nr|transaction|receipt/gi
  ];

  constructor() {
    this.databaseService = new DatabaseService();
  }

  /**
   * Parse OCR text and extract receipt data with enhanced merchant recognition
   */
  async parseReceiptEnhanced(
    ocrText: string,
    confidence: number = 0,
    merchantInfo?: any
  ): Promise<ParsedReceipt> {
    const parseErrors: string[] = [];
    const cleanedText = this.cleanOCRText(ocrText);

    try {
      // Use merchant info if provided by enhanced OCR
      let merchant = merchantInfo?.merchant?.name;
      let category = merchantInfo?.suggestedCategory;

      // Fallback to basic extraction if no merchant info
      if (!merchant) {
        merchant = this.extractMerchant(cleanedText, parseErrors);
        category = await this.suggestCategoryBasic(merchant);
      }

      // Extract other data with improved algorithms
      const amount = this.extractAmount(cleanedText, parseErrors);
      const date = this.extractDate(cleanedText, parseErrors);
      const items = this.extractItems(cleanedText);

      const extractedData: ReceiptData = {
        amount,
        date,
        merchant,
        items,
        confidence: merchantInfo ? Math.max(confidence, merchantInfo.confidence) : confidence,
        currency: 'EUR'
      };

      // Create suggested transaction with enhanced categorization
      const suggestedTransaction = await this.createEnhancedSuggestedTransaction(
        extractedData,
        merchantInfo
      );

      return {
        extractedData,
        originalText: ocrText,
        confidence: extractedData.confidence || confidence,
        parseErrors,
        suggestedTransaction
      };

    } catch (error) {
      parseErrors.push(`Parse error: ${error.message}`);

      return {
        extractedData: {
          confidence: 0,
          currency: 'EUR'
        },
        originalText: ocrText,
        confidence: 0,
        parseErrors,
        suggestedTransaction: undefined
      };
    }
  }
    const parseErrors: string[] = [];
    const cleanedText = this.cleanOCRText(ocrText);
    
    try {
      // Extract different components
      const amount = this.extractAmount(cleanedText, parseErrors);
      const date = this.extractDate(cleanedText, parseErrors);
      const merchant = this.extractMerchant(cleanedText, parseErrors);
      const items = this.extractItems(cleanedText);

      const extractedData: ReceiptData = {
        amount,
        date,
        merchant,
        items,
        confidence,
        currency: 'EUR' // Default for German market
      };

      // Create suggested transaction
      const suggestedTransaction = await this.createSuggestedTransaction(extractedData);

      return {
        extractedData,
        originalText: ocrText,
        confidence,
        parseErrors,
        suggestedTransaction
      };

    } catch (error) {
      parseErrors.push(`Parse error: ${error.message}`);
      
      return {
        extractedData: {
          confidence: 0,
          currency: 'EUR'
        },
        originalText: ocrText,
        confidence: 0,
        parseErrors,
        suggestedTransaction: undefined
      };
    }
  }

  /**
   * Clean OCR text by removing noise and fixing common errors
   */
  private cleanOCRText(text: string): string {
    let cleaned = text;

    // Remove noise patterns
    this.NOISE_PATTERNS.forEach(pattern => {
      cleaned = cleaned.replace(pattern, '');
    });

    // Fix common OCR errors
    cleaned = cleaned
      // Fix currency symbols
      .replace(/€/g, '€')
      .replace(/[Cc]/g, 'C') // Common OCR error
      // Fix numbers
      .replace(/[Oo]/g, '0') // O instead of 0
      .replace(/[Il]/g, '1') // I/l instead of 1
      // Normalize whitespace
      .replace(/\s+/g, ' ')
      .replace(/\n\s*\n/g, '\n')
      .trim();

    return cleaned;
  }

  /**
   * Extract amount/total from receipt text
   */
  private extractAmount(text: string, errors: string[]): number | undefined {
    try {
      const amounts: number[] = [];

      this.AMOUNT_PATTERNS.forEach(pattern => {
        const matches = [...text.matchAll(pattern)];
        matches.forEach(match => {
          if (match[1]) {
            const amountStr = match[1]
              .replace(/[€$]/g, '')
              .replace(/,/g, '.')
              .trim();
            
            const amount = parseFloat(amountStr);
            if (!isNaN(amount) && amount > 0 && amount < 10000) {
              amounts.push(amount);
            }
          }
        });
      });

      if (amounts.length === 0) {
        errors.push('No amount found in receipt');
        return undefined;
      }

      // Return the largest amount (likely the total)
      return Math.max(...amounts);

    } catch (error) {
      errors.push(`Amount extraction error: ${error.message}`);
      return undefined;
    }
  }

  /**
   * Extract date from receipt text
   */
  private extractDate(text: string, errors: string[]): Date | undefined {
    try {
      const today = new Date();
      const oneYearAgo = new Date(today.getFullYear() - 1, today.getMonth(), today.getDate());

      this.DATE_PATTERNS.forEach(pattern => {
        const matches = [...text.matchAll(pattern)];
        
        for (const match of matches) {
          let day, month, year;

          if (match[0].includes('-')) {
            // ISO format: YYYY-MM-DD
            year = parseInt(match[1]);
            month = parseInt(match[2]) - 1; // Month is 0-based
            day = parseInt(match[3]);
          } else {
            // European format: DD.MM.YYYY or DD/MM/YYYY
            day = parseInt(match[1]);
            month = parseInt(match[2]) - 1;
            year = parseInt(match[3]);
            
            // Handle 2-digit years
            if (year < 100) {
              year += year < 50 ? 2000 : 1900;
            }
          }

          if (day >= 1 && day <= 31 && month >= 0 && month <= 11) {
            const date = new Date(year, month, day);
            
            // Validate date is reasonable (not future, not too old)
            if (date <= today && date >= oneYearAgo) {
              return date;
            }
          }
        }
      });

      errors.push('No valid date found in receipt');
      return undefined;

    } catch (error) {
      errors.push(`Date extraction error: ${error.message}`);
      return undefined;
    }
  }

  /**
   * Extract merchant/store name
   */
  private extractMerchant(text: string, errors: string[]): string | undefined {
    try {
      const lines = text.split('\n');
      const firstLines = lines.slice(0, 5); // Check first 5 lines

      // Try to find merchant in first lines
      for (const line of firstLines) {
        const trimmedLine = line.trim();
        
        // Skip very short lines
        if (trimmedLine.length < 3) continue;
        
        // Check against known merchant patterns
        for (const pattern of this.MERCHANT_PATTERNS) {
          const match = trimmedLine.match(pattern);
          if (match && match[1]) {
            const merchant = match[1].trim();
            if (merchant.length > 2 && merchant.length < 50) {
              return merchant;
            }
          }
        }

        // If no pattern matches, take first substantial line
        if (trimmedLine.length >= 3 && 
            trimmedLine.length <= 30 && 
            /^[A-Za-zäöüÄÖÜß\s&-]+$/.test(trimmedLine)) {
          return trimmedLine;
        }
      }

      errors.push('No merchant name found');
      return undefined;

    } catch (error) {
      errors.push(`Merchant extraction error: ${error.message}`);
      return undefined;
    }
  }

  /**
   * Extract individual items from receipt (basic implementation)
   */
  private extractItems(text: string): ReceiptItem[] {
    const items: ReceiptItem[] = [];
    const lines = text.split('\n');

    for (const line of lines) {
      const trimmedLine = line.trim();
      
      // Look for lines with item description and price
      const itemPattern = /^(.+?)\s+(\d+[,\.]\d{2})$/;
      const match = trimmedLine.match(itemPattern);
      
      if (match && match[1] && match[2]) {
        const description = match[1].trim();
        const priceStr = match[2].replace(',', '.');
        const price = parseFloat(priceStr);

        if (!isNaN(price) && 
            description.length > 2 && 
            description.length < 100 &&
            price > 0 && 
            price < 1000) {
          
          items.push({
            description,
            price,
            quantity: 1
          });
        }
      }
    }

    return items.slice(0, 50); // Limit to 50 items max
  }

  /**
   * Create enhanced suggested transaction using merchant recognition
   */
  private async createEnhancedSuggestedTransaction(
    receiptData: ReceiptData,
    merchantInfo?: any
  ): Promise<Partial<Transaction> | undefined> {
    try {
      if (!receiptData.amount) return undefined;

      // Get categories for auto-categorization
      const categories = await this.databaseService.getCategories();

      // Use merchant recognition result for better categorization
      let categoryId = '';
      let description = '';
      let confidence = receiptData.confidence || 0;

      if (merchantInfo?.merchant) {
        // Use merchant-based categorization
        categoryId = this.findCategoryByName(categories, merchantInfo.suggestedCategory) || '';
        description = `${merchantInfo.merchant.name}`;
        confidence = Math.max(confidence, merchantInfo.confidence);

        console.log(`Enhanced categorization: ${merchantInfo.merchant.name} -> ${merchantInfo.suggestedCategory}`);
      } else if (receiptData.merchant) {
        // Fallback to basic categorization
        categoryId = this.suggestCategory(receiptData, categories);
        description = `Receipt: ${receiptData.merchant}`;
      } else {
        // No merchant found
        categoryId = this.findCategoryByName(categories, 'Sonstiges') || '';
        description = 'Receipt Scan';
      }

      const suggestedTransaction: Partial<Transaction> = {
        amount: receiptData.amount,
        description,
        date: receiptData.date?.getTime() || Date.now(),
        type: 'expense',
        categoryId,
        notes: this.generateEnhancedNotes(receiptData, merchantInfo, confidence)
      };

      return suggestedTransaction;

    } catch (error) {
      console.error('Error creating enhanced suggested transaction:', error);
      return undefined;
    }
  }

  /**
   * Find category by name with fuzzy matching
   */
  private findCategoryByName(categories: any[], categoryName?: string): string | undefined {
    if (!categoryName) return undefined;

    const categoryLower = categoryName.toLowerCase();

    // Exact match first
    let category = categories.find(cat =>
      cat.name.toLowerCase() === categoryLower
    );

    if (category) return category.id;

    // Fuzzy match
    category = categories.find(cat =>
      cat.name.toLowerCase().includes(categoryLower) ||
      categoryLower.includes(cat.name.toLowerCase())
    );

    return category?.id;
  }

  /**
   * Generate enhanced notes with merchant and confidence info
   */
  private generateEnhancedNotes(
    receiptData: ReceiptData,
    merchantInfo?: any,
    confidence?: number
  ): string {
    const notes: string[] = [];

    if (merchantInfo?.merchant) {
      notes.push(`Merchant: ${merchantInfo.merchant.name}`);
      notes.push(`Match Type: ${merchantInfo.matchType}`);
      notes.push(`Merchant Confidence: ${Math.round(merchantInfo.confidence * 100)}%`);
    } else if (receiptData.merchant) {
      notes.push(`Store: ${receiptData.merchant}`);
    }

    if (receiptData.items && receiptData.items.length > 0) {
      notes.push(`Items: ${receiptData.items.length}`);

      if (receiptData.items.length <= 5) {
        const itemsList = receiptData.items
          .map(item => `${item.description} (€${item.price.toFixed(2)})`)
          .join(', ');
        notes.push(`Details: ${itemsList}`);
      }
    }

    if (confidence !== undefined) {
      notes.push(`OCR Confidence: ${Math.round(confidence * 100)}%`);
    }

    // Add processing timestamp
    notes.push(`Processed: ${new Date().toLocaleString('de-DE')}`);

    return notes.join('\n');
  }

  /**
   * Basic category suggestion fallback
   */
  private async suggestCategoryBasic(merchant?: string): Promise<string | undefined> {
    if (!merchant) return undefined;

    const merchantLower = merchant.toLowerCase();

    // Basic keyword matching
    if (/rewe|edeka|aldi|lidl|supermarkt|market/i.test(merchantLower)) {
      return 'Lebensmittel';
    }
    if =/dm|rossmann|apotheke|pharmacy/i.test(merchantLower)) {
      return 'Gesundheit';
    }
    if (/shell|aral|tankstelle|gas/i.test(merchantLower)) {
      return 'Transport';
    }
    if (/restaurant|café|pizza|burger|mcdonald|kfc/i.test(merchantLower)) {
      return 'Restaurants';
    }
    if (/amazon|online|shop/i.test(merchantLower)) {
      return 'Shopping';
    }

    return 'Sonstiges';
  }
    try {
      if (!receiptData.amount) return undefined;

      // Get categories for auto-categorization
      const categories = await this.databaseService.getCategories();
      const categoryId = this.suggestCategory(receiptData, categories);

      const description = this.generateDescription(receiptData);

      const suggestedTransaction: Partial<Transaction> = {
        amount: receiptData.amount,
        description,
        date: receiptData.date?.getTime() || Date.now(),
        type: 'expense',
        categoryId,
        notes: this.generateNotes(receiptData)
      };

      return suggestedTransaction;

    } catch (error) {
      console.error('Error creating suggested transaction:', error);
      return undefined;
    }
  }

  /**
   * Suggest appropriate category based on merchant and items
   */
  private suggestCategory(receiptData: ReceiptData, categories: any[]): string {
    const merchant = receiptData.merchant?.toLowerCase() || '';
    
    // Food/Grocery stores
    if (/rewe|edeka|aldi|lidl|kaufland|penny|netto|supermarkt|market/i.test(merchant)) {
      return categories.find(cat => /lebensmittel|food|grocery/i.test(cat.name))?.id || '';
    }

    // Drugstores
    if (/dm|rossmann|apotheke|pharmacy/i.test(merchant)) {
      return categories.find(cat => /gesundheit|health|drogerie/i.test(cat.name))?.id || '';
    }

    // Gas stations
    if =/tankstelle|shell|aral|esso|bp|total|gas/i.test(merchant)) {
      return categories.find(cat => /transport|verkehr|fuel/i.test(cat.name))?.id || '';
    }

    // Restaurants
    if (/restaurant|café|pizza|burger|mcdonald|kfc/i.test(merchant)) {
      return categories.find(cat => /restaurant|essen|dining/i.test(cat.name))?.id || '';
    }

    // Default to general category
    return categories.find(cat => /sonstiges|other|misc/i.test(cat.name))?.id || '';
  }

  /**
   * Generate transaction description
   */
  private generateDescription(receiptData: ReceiptData): string {
    if (receiptData.merchant) {
      return `Receipt: ${receiptData.merchant}`;
    }

    if (receiptData.items && receiptData.items.length > 0) {
      return `Receipt: ${receiptData.items[0].description}`;
    }

    return 'Receipt Scan';
  }

  /**
   * Generate transaction notes with receipt details
   */
  private generateNotes(receiptData: ReceiptData): string {
    const notes: string[] = [];

    if (receiptData.merchant) {
      notes.push(`Store: ${receiptData.merchant}`);
    }

    if (receiptData.items && receiptData.items.length > 0) {
      notes.push(`Items: ${receiptData.items.length}`);
      
      if (receiptData.items.length <= 5) {
        const itemsList = receiptData.items
          .map(item => `${item.description} (€${item.price.toFixed(2)})`)
          .join(', ');
        notes.push(`Details: ${itemsList}`);
      }
    }

    if (receiptData.confidence !== undefined) {
      notes.push(`OCR Confidence: ${Math.round(receiptData.confidence * 100)}%`);
    }

    return notes.join('\n');
  }

  /**
   * Validate and improve extracted data
   */
  validateAndImprove(receiptData: ReceiptData): ReceiptData {
    const improved = { ...receiptData };

    // Validate amount
    if (improved.amount && (improved.amount < 0.01 || improved.amount > 9999)) {
      improved.amount = undefined;
    }

    // Validate date
    if (improved.date) {
      const today = new Date();
      const oneYearAgo = new Date(today.getFullYear() - 1, today.getMonth(), today.getDate());
      
      if (improved.date > today || improved.date < oneYearAgo) {
        improved.date = undefined;
      }
    }

    // Clean merchant name
    if (improved.merchant) {
      improved.merchant = improved.merchant
        .trim()
        .replace(/\s+/g, ' ')
        .substring(0, 50);
    }

    return improved;
  }

  /**
   * Learn from user corrections to improve future parsing
   */
  async learnFromCorrection(
    originalText: string, 
    extractedData: ReceiptData, 
    correctedData: ReceiptData
  ): Promise<void> {
    // This could be implemented to store patterns and improve recognition
    // For MVP, we'll just log the correction for future enhancement
    console.log('Learning opportunity:', {
      original: extractedData,
      corrected: correctedData,
      textLength: originalText.length
    });
    
    // TODO: Implement machine learning feedback loop in future sprint
  }
}

export default new ReceiptParser();
