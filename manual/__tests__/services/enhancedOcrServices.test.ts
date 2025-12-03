import ImagePreprocessingService from '../../services/imagePreprocessingService';
import MerchantRecognitionService from '../../services/merchantRecognitionService';
import { MerchantInfo } from '../../services/merchantRecognitionService';

// Mock dependencies
jest.mock('expo-image-manipulator');
jest.mock('react-native-fs');

describe('Enhanced OCR Services', () => {
  describe('ImagePreprocessingService', () => {
    beforeEach(() => {
      jest.clearAllMocks();
    });

    describe('Image Analysis', () => {
      it('should analyze image quality correctly', async () => {
        const mockImageUri = 'file://test-receipt.jpg';

        // Mock image manipulator response
        const mockImageInfo = {
          uri: mockImageUri,
          width: 800,
          height: 1200
        };

        require('expo-image-manipulator').manipulateAsync = jest.fn().mockResolvedValue(mockImageInfo);

        const analysis = await ImagePreprocessingService.analyzeImage(mockImageUri);

        expect(analysis.isReceipt).toBe(true); // height/width = 1.5, typical receipt ratio
        expect(analysis.quality).toBeGreaterThan(0.5);
        expect(analysis.hasText).toBe(true);
        expect(analysis.confidence).toBeGreaterThan(0);
        expect(Array.isArray(analysis.suggestedCorrections)).toBe(true);
      });

      it('should detect poor quality images', async () => {
        const mockImageUri = 'file://poor-quality.jpg';

        const mockImageInfo = {
          uri: mockImageUri,
          width: 200, // Low resolution
          height: 300
        };

        require('expo-image-manipulator').manipulateAsync = jest.fn().mockResolvedValue(mockImageInfo);

        const analysis = await ImagePreprocessingService.analyzeImage(mockImageUri);

        expect(analysis.quality).toBeLessThan(0.8);
        expect(analysis.suggestedCorrections).toContain('Image resolution could be higher for better OCR results');
      });

      it('should detect non-receipt images', async () => {
        const mockImageUri = 'file://landscape.jpg';

        const mockImageInfo = {
          uri: mockImageUri,
          width: 1200,
          height: 800 // Landscape orientation
        };

        require('expo-image-manipulator').manipulateAsync = jest.fn().mockResolvedValue(mockImageInfo);

        const analysis = await ImagePreprocessingService.analyzeImage(mockImageUri);

        expect(analysis.isReceipt).toBe(false);
        expect(analysis.suggestedCorrections).toContain('Image might not be a receipt - check framing');
      });
    });

    describe('Image Preprocessing', () => {
      it('should preprocess image with default options', async () => {
        const mockImageUri = 'file://input.jpg';
        const mockProcessedUri = 'file://processed.jpg';

        require('expo-image-manipulator').manipulateAsync = jest.fn()
          .mockResolvedValueOnce({ uri: mockImageUri, width: 800, height: 1200 }) // Analysis
          .mockResolvedValue({ uri: mockProcessedUri }); // Processing steps

        const result = await ImagePreprocessingService.preprocessImage(mockImageUri);

        expect(result).toBe(mockProcessedUri);
        expect(require('expo-image-manipulator').manipulateAsync).toHaveBeenCalledTimes(4); // Analysis + 3 processing steps
      });

      it('should handle preprocessing failures gracefully', async () => {
        const mockImageUri = 'file://input.jpg';

        require('expo-image-manipulator').manipulateAsync = jest.fn()
          .mockRejectedValueOnce(new Error('Processing failed'));

        const result = await ImagePreprocessingService.preprocessImage(mockImageUri);

        // Should return original URI on failure
        expect(result).toBe(mockImageUri);
      });

      it('should batch process multiple images', async () => {
        const inputUris = ['file://1.jpg', 'file://2.jpg', 'file://3.jpg'];
        const processedUris = ['file://1-processed.jpg', 'file://2-processed.jpg', 'file://3-processed.jpg'];

        require('expo-image-manipulator').manipulateAsync = jest.fn()
          .mockImplementation((uri) => {
            const index = inputUris.indexOf(uri);
            if (index === -1) {
              // For analysis calls
              return Promise.resolve({ uri, width: 800, height: 1200 });
            }
            // For processing calls
            return Promise.resolve({ uri: processedUris[index] });
          });

        const results = await ImagePreprocessingService.batchPreprocess(inputUris);

        expect(results).toHaveLength(3);
        expect(results).toEqual(expect.arrayContaining(processedUris));
      });
    });

    describe('Enhancement Preview', () => {
      it('should create enhancement preview with improvements list', async () => {
        const mockImageUri = 'file://original.jpg';
        const mockEnhancedUri = 'file://enhanced.jpg';

        require('expo-image-manipulator').manipulateAsync = jest.fn()
          .mockResolvedValueOnce({ uri: mockImageUri, width: 800, height: 1200 })
          .mockResolvedValue({ uri: mockEnhancedUri });

        const preview = await ImagePreprocessingService.createEnhancementPreview(mockImageUri);

        expect(preview.original).toBe(mockImageUri);
        expect(preview.enhanced).toBe(mockEnhancedUri);
        expect(Array.isArray(preview.improvements)).toBe(true);
        expect(preview.improvements.length).toBeGreaterThan(0);
        expect(preview.improvements).toContain('Optimized for OCR processing');
      });
    });
  });

  describe('MerchantRecognitionService', () => {
    beforeEach(() => {
      jest.clearAllMocks();

      // Reset service state
      MerchantRecognitionService['initialized'] = false;
      MerchantRecognitionService['merchantsCache'].clear();
      MerchantRecognitionService['learningData'].clear();
    });

    describe('Initialization', () => {
      it('should initialize with default merchants', async () => {
        // Mock database service methods
        const mockDatabaseService = {
          getMerchants: jest.fn().mockResolvedValue([]),
          getLearningData: jest.fn().mockResolvedValue([]),
          saveMerchant: jest.fn().mockResolvedValue(undefined)
        };

        MerchantRecognitionService['databaseService'] = mockDatabaseService as any;

        await MerchantRecognitionService.initialize();

        expect(mockDatabaseService.getMerchants).toHaveBeenCalled();
        expect(mockDatabaseService.getLearningData).toHaveBeenCalled();
        expect(mockDatabaseService.saveMerchant).toHaveBeenCalledTimes(10); // Default merchants
      });

      it('should not re-initialize if already initialized', async () => {
        const mockDatabaseService = {
          getMerchants: jest.fn().mockResolvedValue([]),
          getLearningData: jest.fn().mockResolvedValue([]),
          saveMerchant: jest.fn().mockResolvedValue(undefined)
        };

        MerchantRecognitionService['databaseService'] = mockDatabaseService as any;

        await MerchantRecognitionService.initialize();
        await MerchantRecognitionService.initialize();

        // Should only be called once
        expect(mockDatabaseService.getMerchants).toHaveBeenCalledTimes(1);
      });
    });

    describe('Merchant Recognition', () => {
      beforeEach(async () => {
        const mockDatabaseService = {
          getMerchants: jest.fn().mockResolvedValue([]),
          getLearningData: jest.fn().mockResolvedValue([]),
          saveMerchant: jest.fn().mockResolvedValue(undefined)
        };

        MerchantRecognitionService['databaseService'] = mockDatabaseService as any;
        await MerchantRecognitionService.initialize();
      });

      it('should recognize exact merchant match', async () => {
        const receiptText = `
          REWE Markt
          Hauptstraße 123
          Total: €45.67
        `;

        const result = await MerchantRecognitionService.recognizeMerchant(receiptText);

        expect(result.merchant?.name).toBe('REWE');
        expect(result.matchType).toBe('exact');
        expect(result.confidence).toBeGreaterThan(0.9);
        expect(result.suggestedCategory).toBe('Lebensmittel');
      });

      it('should recognize merchant by alias', async () => {
        const receiptText = `
          EDEKA CENTER
          Musterstraße 45
          Summe: €23.45
        `;

        const result = await MerchantRecognitionService.recognizeMerchant(receiptText);

        expect(result.merchant?.name).toBe('EDEKA');
        expect(result.matchType).toBe('alias');
        expect(result.confidence).toBeGreaterThan(0.85);
      });

      it('should recognize merchant by pattern', async () => {
        const receiptText = `
          Rossmann Drogerie
          Testweg 12
          Gesamt: €15.99
        `;

        const result = await MerchantRecognitionService.recognizeMerchant(receiptText);

        expect(result.merchant?.name).toBe('ROSSMANN');
        expect(result.matchType).toBe('pattern');
        expect(result.confidence).toBeGreaterThan(0.7);
      });

      it('should handle unrecognized merchants gracefully', async () => {
        const receiptText = `
          Unknown Store XYZ
          Nowhere Street 999
          Total: €10.00
        `;

        const result = await MerchantRecognitionService.recognizeMerchant(receiptText);

        expect(result.merchant).toBeUndefined();
        expect(result.confidence).toBe(0);
        expect(result.matchType).toBe('fuzzy');
        expect(Array.isArray(result.alternatives)).toBe(true);
      });
    });

    describe('Learning System', () => {
      beforeEach(async () => {
        const mockDatabaseService = {
          getMerchants: jest.fn().mockResolvedValue([]),
          getLearningData: jest.fn().mockResolvedValue([]),
          saveMerchant: jest.fn().mockResolvedValue(undefined),
          saveLearningData: jest.fn().mockResolvedValue(undefined)
        };

        MerchantRecognitionService['databaseService'] = mockDatabaseService as any;
        await MerchantRecognitionService.initialize();
      });

      it('should learn from user corrections', async () => {
        const originalText = 'UNKNOWN MARKET XYZ';
        const correctedMerchant = 'Local Supermarket';
        const correctedCategory = 'Lebensmittel';

        await MerchantRecognitionService.learnFromCorrection(
          originalText,
          correctedMerchant,
          correctedCategory
        );

        const learningData = MerchantRecognitionService['learningData'];
        const entries = Array.from(learningData.values());

        expect(entries.length).toBe(1);
        expect(entries[0].merchantName).toBe(correctedMerchant);
        expect(entries[0].category).toBe(correctedCategory);
        expect(entries[0].userConfirmed).toBe(true);
        expect(entries[0].frequency).toBe(1);
      });

      it('should increment frequency for repeated corrections', async () => {
        const originalText = 'SAME UNKNOWN MARKET';
        const correctedMerchant = 'Local Mart';
        const correctedCategory = 'Lebensmittel';

        // First correction
        await MerchantRecognitionService.learnFromCorrection(
          originalText,
          correctedMerchant,
          correctedCategory
        );

        // Second correction of same pattern
        await MerchantRecognitionService.learnFromCorrection(
          originalText,
          correctedMerchant,
          correctedCategory
        );

        const learningData = MerchantRecognitionService['learningData'];
        const entries = Array.from(learningData.values());

        expect(entries.length).toBe(1);
        expect(entries[0].frequency).toBe(2);
      });
    });

    describe('Merchant Management', () => {
      it('should add new merchant', async () => {
        const mockDatabaseService = {
          getMerchants: jest.fn().mockResolvedValue([]),
          getLearningData: jest.fn().mockResolvedValue([]),
          saveMerchant: jest.fn().mockResolvedValue(undefined)
        };

        MerchantRecognitionService['databaseService'] = mockDatabaseService as any;
        await MerchantRecognitionService.initialize();

        const newMerchant = {
          name: 'New Coffee Shop',
          aliases: ['Coffee Shop XYZ'],
          category: 'Restaurants',
          confidence: 0.9,
          patterns: ['coffee shop', 'café'],
          businessType: 'restaurant' as const,
          tags: ['coffee', 'drinks'],
          isActive: true,
          location: { country: 'DE' }
        };

        const merchantId = await MerchantRecognitionService.addMerchant(newMerchant);

        expect(merchantId).toBeDefined();
        expect(merchantId).toContain('merchant_');
        expect(mockDatabaseService.saveMerchant).toHaveBeenCalledWith(
          expect.objectContaining({
            name: 'New Coffee Shop',
            category: 'Restaurants'
          })
        );
      });

      it('should get merchant suggestions based on input', async () => {
        const mockDatabaseService = {
          getMerchants: jest.fn().mockResolvedValue([]),
          getLearningData: jest.fn().mockResolvedValue([]),
          saveMerchant: jest.fn().mockResolvedValue(undefined)
        };

        MerchantRecognitionService['databaseService'] = mockDatabaseService as any;
        await MerchantRecognitionService.initialize();

        const suggestions = await MerchantRecognitionService.getMerchantSuggestions('rewe', 3);

        expect(Array.isArray(suggestions)).toBe(true);
        expect(suggestions.length).toBeGreaterThan(0);
        expect(suggestions.length).toBeLessThanOrEqual(3);

        // Should find REWE merchant
        const reweMatch = suggestions.find(m => m.name === 'REWE');
        expect(reweMatch).toBeDefined();
      });
    });

    describe('Recognition Statistics', () => {
      it('should provide recognition statistics', async () => {
        const mockDatabaseService = {
          getMerchants: jest.fn().mockResolvedValue([]),
          getLearningData: jest.fn().mockResolvedValue([]),
          saveMerchant: jest.fn().mockResolvedValue(undefined)
        };

        MerchantRecognitionService['databaseService'] = mockDatabaseService as any;
        await MerchantRecognitionService.initialize();

        const stats = await MerchantRecognitionService.getRecognitionStats();

        expect(typeof stats.totalMerchants).toBe('number');
        expect(typeof stats.activeMerchants).toBe('number');
        expect(typeof stats.learningEntries).toBe('number');
        expect(Array.isArray(stats.topCategories)).toBe(true);
        expect(Array.isArray(stats.recentLearnings)).toBe(true);
      });
    });

    describe('Fuzzy Matching', () => {
      it('should calculate string similarity correctly', async () => {
        const service = MerchantRecognitionService as any;

        // Test exact match
        expect(service.calculateStringSimilarity('test', 'test')).toBe(1.0);

        // Test no match
        expect(service.calculateStringSimilarity('abc', 'xyz')).toBeLessThan(0.5);

        // Test partial match
        expect(service.calculateStringSimilarity('rewe', 'rewe markt')).toBeGreaterThan(0.5);
      });

      it('should calculate fuzzy score for merchants', async () => {
        const mockDatabaseService = {
          getMerchants: jest.fn().mockResolvedValue([]),
          getLearningData: jest.fn().mockResolvedValue([]),
          saveMerchant: jest.fn().mockResolvedValue(undefined)
        };

        MerchantRecognitionService['databaseService'] = mockDatabaseService as any;
        await MerchantRecognitionService.initialize();

        const service = MerchantRecognitionService as any;
        const mockMerchant: MerchantInfo = {
          id: 'test',
          name: 'REWE',
          aliases: ['REWE Markt'],
          category: 'Lebensmittel',
          confidence: 0.9,
          patterns: ['rewe'],
          businessType: 'grocery',
          tags: ['grocery'],
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date()
        };

        // Exact name match
        expect(service.calculateFuzzyScore('rewe markt', mockMerchant)).toBeGreaterThan(0.4);

        // Pattern match
        expect(service.calculateFuzzyScore('some rewe text', mockMerchant)).toBeGreaterThan(0.2);

        // No match
        expect(service.calculateFuzzyScore('completely different', mockMerchant)).toBeLessThan(0.2);
      });
    });
  });

  describe('Integration Tests', () => {
    it('should work together for enhanced OCR workflow', async () => {
      // Mock image preprocessing
      const mockImageUri = 'file://receipt.jpg';
      const mockProcessedUri = 'file://processed.jpg';

      require('expo-image-manipulator').manipulateAsync = jest.fn()
        .mockResolvedValue({ uri: mockProcessedUri, width: 800, height: 1200 });

      // Test image preprocessing
      const processedUri = await ImagePreprocessingService.preprocessImage(mockImageUri);
      expect(processedUri).toBe(mockProcessedUri);

      // Mock merchant recognition database
      const mockDatabaseService = {
        getMerchants: jest.fn().mockResolvedValue([]),
        getLearningData: jest.fn().mockResolvedValue([]),
        saveMerchant: jest.fn().mockResolvedValue(undefined)
      };

      MerchantRecognitionService['databaseService'] = mockDatabaseService as any;
      await MerchantRecognitionService.initialize();

      // Test merchant recognition
      const receiptText = 'REWE MARKT\nTotal: €45.67';
      const recognition = await MerchantRecognitionService.recognizeMerchant(receiptText);

      expect(recognition.merchant?.name).toBe('REWE');
      expect(recognition.confidence).toBeGreaterThan(0.8);
    });
  });

  describe('Error Handling', () => {
    it('should handle image preprocessing errors gracefully', async () => {
      require('expo-image-manipulator').manipulateAsync = jest.fn()
        .mockRejectedValue(new Error('Image processing failed'));

      const result = await ImagePreprocessingService.preprocessImage('file://invalid.jpg');
      expect(result).toBe('file://invalid.jpg'); // Should return original URI
    });

    it('should handle merchant recognition errors gracefully', async () => {
      const mockDatabaseService = {
        getMerchants: jest.fn().mockRejectedValue(new Error('Database error')),
        getLearningData: jest.fn().mockResolvedValue([]),
        saveMerchant: jest.fn().mockResolvedValue(undefined)
      };

      MerchantRecognitionService['databaseService'] = mockDatabaseService as any;

      await expect(MerchantRecognitionService.initialize()).rejects.toThrow('Database error');
    });

    it('should handle empty receipt text', async () => {
      const mockDatabaseService = {
        getMerchants: jest.fn().mockResolvedValue([]),
        getLearningData: jest.fn().mockResolvedValue([]),
        saveMerchant: jest.fn().mockResolvedValue(undefined)
      };

      MerchantRecognitionService['databaseService'] = mockDatabaseService as any;
      await MerchantRecognitionService.initialize();

      const result = await MerchantRecognitionService.recognizeMerchant('');
      expect(result.confidence).toBe(0);
      expect(result.merchant).toBeUndefined();
    });
  });
});
