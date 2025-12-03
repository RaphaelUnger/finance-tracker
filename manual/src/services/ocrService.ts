import { createWorker, Worker } from 'tesseract.js';
import * as ImageManipulator from 'expo-image-manipulator';
import { CameraRoll } from '@react-native-camera-roll/camera-roll';
import RNFS from 'react-native-fs';
import ImagePreprocessingService from './imagePreprocessingService';
import MerchantRecognitionService from './merchantRecognitionService';

export interface OCROptions {
  language?: string;
  confidence?: number;
  preprocessing?: boolean;
  psm?: number; // Page Segmentation Mode
}

export interface OCRResult {
  text: string;
  confidence: number;
  words?: Array<{
    text: string;
    confidence: number;
    bbox: {
      x0: number;
      y0: number;
      x1: number;
      y1: number;
    };
  }>;
  lines?: Array<{
    text: string;
    confidence: number;
    bbox: {
      x0: number;
      y0: number;
      x1: number;
      y1: number;
    };
  }>;
}

export interface ImageProcessingOptions {
  crop?: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  resize?: {
    width: number;
    height: number;
  };
  rotate?: number;
  contrast?: number;
  brightness?: number;
  sharpen?: boolean;
}

class OCRService {
  private worker: Worker | null = null;
  private isInitialized = false;
  private initializationPromise: Promise<void> | null = null;

  /**
   * Initialize Tesseract.js worker
   */
  async initialize(language: string = 'deu+eng'): Promise<void> {
    if (this.isInitialized) return;

    if (this.initializationPromise) {
      return this.initializationPromise;
    }

    this.initializationPromise = this.doInitialize(language);
    await this.initializationPromise;
  }

  private async doInitialize(language: string): Promise<void> {
    try {
      console.log('Initializing OCR Service...');

      this.worker = await createWorker({
        logger: m => {
          if (m.status === 'recognizing text') {
            console.log(`OCR Progress: ${Math.round(m.progress * 100)}%`);
          }
        }
      });

      await this.worker.loadLanguage(language);
      await this.worker.initialize(language);

      // Configure Tesseract for receipt recognition
      await this.worker.setParameters({
        tessedit_pageseg_mode: '6', // Uniform block of text
        tessedit_char_whitelist: '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyzäöüÄÖÜß€$.,:-/\\n ',
        tessjs_create_hocr: '1',
        tessjs_create_tsv: '1'
      });

      this.isInitialized = true;
      console.log('OCR Service initialized successfully');

    } catch (error) {
      console.error('Failed to initialize OCR Service:', error);
      this.isInitialized = false;
      this.initializationPromise = null;
      throw new Error(`OCR initialization failed: ${error.message}`);
    }
  }

  /**
   * Enhanced OCR recognition with image preprocessing and merchant recognition
   */
  async recognizeTextAdvanced(
    imageUri: string,
    options: OCROptions = {}
  ): Promise<OCRResult & { merchantInfo?: any; imageQuality?: any }> {
    try {
      await this.initialize(options.language);

      if (!this.worker) {
        throw new Error('OCR worker not initialized');
      }

      console.log('Starting enhanced OCR recognition...');
      const startTime = Date.now();

      // Step 1: Analyze and preprocess image
      let processedImageUri = imageUri;
      let imageQuality = null;

      if (options.preprocessing !== false) {
        imageQuality = await ImagePreprocessingService.analyzeImage(imageUri);
        console.log('Image quality analysis:', imageQuality);

        // Apply preprocessing if image quality is not optimal
        if (imageQuality.quality < 0.8) {
          processedImageUri = await ImagePreprocessingService.preprocessImage(imageUri, {
            enableAutoCorrection: true,
            enablePerspectiveCorrection: imageQuality.isReceipt,
            enableNoiseReduction: true,
            contrastFactor: imageQuality.quality < 0.5 ? 1.4 : 1.2,
            brightnessFactor: imageQuality.quality < 0.5 ? 1.2 : 1.1,
            sharpening: true
          });
          console.log('Image preprocessing applied');
        }
      }

      // Step 2: Perform OCR with optimized settings
      const ocrConfig = {
        ...this.getOptimizedOCRConfig(imageQuality),
        rectangle: options.confidence ? undefined : undefined
      };

      const result = await this.worker.recognize(processedImageUri, ocrConfig);

      // Step 3: Enhance OCR result with merchant recognition
      let merchantInfo = null;
      if (result.data.text && result.data.text.length > 20) {
        try {
          merchantInfo = await MerchantRecognitionService.recognizeMerchant(result.data.text);
          console.log('Merchant recognition result:', merchantInfo);
        } catch (error) {
          console.warn('Merchant recognition failed:', error);
        }
      }

      const processingTime = Date.now() - startTime;
      console.log(`Enhanced OCR completed in ${processingTime}ms`);

      // Parse enhanced Tesseract result
      const ocrResult: OCRResult & { merchantInfo?: any; imageQuality?: any } = {
        text: this.enhanceOCRText(result.data.text, merchantInfo),
        confidence: result.data.confidence / 100,
        words: result.data.words?.map(word => ({
          text: word.text,
          confidence: word.confidence / 100,
          bbox: word.bbox
        })),
        lines: result.data.lines?.map(line => ({
          text: line.text,
          confidence: line.confidence / 100,
          bbox: line.bbox
        })),
        merchantInfo,
        imageQuality
      };

      // Apply confidence threshold
      if (options.confidence && ocrResult.confidence < options.confidence) {
        throw new Error(`OCR confidence ${ocrResult.confidence.toFixed(2)} below threshold ${options.confidence}`);
      }

      console.log(`Enhanced OCR Result: ${ocrResult.text.length} characters, ${ocrResult.confidence.toFixed(2)} confidence`);

      return ocrResult;

    } catch (error) {
      console.error('Enhanced OCR recognition failed:', error);
      throw new Error(`Enhanced OCR recognition failed: ${error.message}`);
    }
  }
    try {
      await this.initialize(options.language);

      if (!this.worker) {
        throw new Error('OCR worker not initialized');
      }

      console.log('Starting OCR recognition...');
      const startTime = Date.now();

      // Preprocess image if requested
      let processedImageUri = imageUri;
      if (options.preprocessing) {
        processedImageUri = await this.preprocessImage(imageUri);
      }

      // Perform OCR
      const result = await this.worker.recognize(processedImageUri, {
        rectangle: options.confidence ? undefined : undefined // Could add ROI selection
      });

      const processingTime = Date.now() - startTime;
      console.log(`OCR completed in ${processingTime}ms`);

      // Parse Tesseract result
      const ocrResult: OCRResult = {
        text: result.data.text,
        confidence: result.data.confidence / 100, // Convert to 0-1 range
        words: result.data.words?.map(word => ({
          text: word.text,
          confidence: word.confidence / 100,
          bbox: word.bbox
        })),
        lines: result.data.lines?.map(line => ({
          text: line.text,
          confidence: line.confidence / 100,
          bbox: line.bbox
        }))
      };

      // Filter low confidence results if threshold is set
      if (options.confidence && ocrResult.confidence < options.confidence) {
        throw new Error(`OCR confidence ${ocrResult.confidence.toFixed(2)} below threshold ${options.confidence}`);
      }

      console.log(`OCR Result: ${ocrResult.text.length} characters, ${ocrResult.confidence.toFixed(2)} confidence`);

      return ocrResult;

    } catch (error) {
      console.error('OCR recognition failed:', error);
      throw new Error(`OCR recognition failed: ${error.message}`);
    }
  }

  /**
   * Preprocess image for better OCR results
   */
  private async preprocessImage(imageUri: string): Promise<string> {
    try {
      console.log('Preprocessing image for OCR...');

      // Get image info
      const imageInfo = await ImageManipulator.manipulateAsync(
        imageUri,
        [],
        { format: ImageManipulator.SaveFormat.JPEG }
      );

      const manipulateActions = [];

      // Auto-rotate based on EXIF if needed
      // This would need additional EXIF reading logic

      // Resize if image is too large (improves OCR performance)
      const maxWidth = 1200;
      const maxHeight = 1600;

      if (imageInfo.width > maxWidth || imageInfo.height > maxHeight) {
        const ratio = Math.min(maxWidth / imageInfo.width, maxHeight / imageInfo.height);

        manipulateActions.push({
          resize: {
            width: Math.round(imageInfo.width * ratio),
            height: Math.round(imageInfo.height * ratio)
          }
        });
      }

      // Apply manipulations
      const result = await ImageManipulator.manipulateAsync(
        imageUri,
        manipulateActions,
        {
          compress: 0.8,
          format: ImageManipulator.SaveFormat.JPEG
        }
      );

      console.log('Image preprocessing completed');
      return result.uri;

    } catch (error) {
      console.error('Image preprocessing failed:', error);
      // Return original URI if preprocessing fails
      return imageUri;
    }
  }

  /**
   * Advanced image processing for receipt optimization
   */
  async optimizeReceiptImage(
    imageUri: string,
    options: ImageProcessingOptions = {}
  ): Promise<string> {
    try {
      const manipulateActions = [];

      // Crop if specified
      if (options.crop) {
        manipulateActions.push({ crop: options.crop });
      }

      // Rotate if specified
      if (options.rotate) {
        manipulateActions.push({ rotate: options.rotate });
      }

      // Resize if specified
      if (options.resize) {
        manipulateActions.push({ resize: options.resize });
      }

      // Apply contrast and brightness adjustments
      // Note: React Native Image Manipulator has limited filter support
      // For advanced image processing, we might need a native module

      const result = await ImageManipulator.manipulateAsync(
        imageUri,
        manipulateActions,
        {
          compress: 0.9,
          format: ImageManipulator.SaveFormat.JPEG
        }
      );

      return result.uri;

    } catch (error) {
      console.error('Image optimization failed:', error);
      throw new Error(`Image optimization failed: ${error.message}`);
    }
  }

  /**
   * Detect receipt boundaries using edge detection (simplified)
   */
  async detectReceiptBounds(imageUri: string): Promise<{ x: number; y: number; width: number; height: number } | null> {
    // This is a placeholder for future enhancement
    // Advanced receipt detection would require:
    // 1. Edge detection algorithms
    // 2. Contour finding
    // 3. Perspective correction
    // For MVP, we'll return null and use manual cropping

    console.log('Receipt boundary detection not implemented in MVP');
    return null;
  }

  /**
   * Save processed receipt image to device storage
   */
  async saveReceiptImage(imageUri: string, receiptId: string): Promise<string> {
    try {
      const timestamp = Date.now();
      const fileName = `receipt_${receiptId}_${timestamp}.jpg`;

      // Create receipts directory if it doesn't exist
      const receiptsDir = `${RNFS.DocumentDirectoryPath}/receipts`;
      await RNFS.mkdir(receiptsDir);

      const destinationPath = `${receiptsDir}/${fileName}`;

      // Copy image to app storage
      await RNFS.copyFile(imageUri, destinationPath);

      console.log(`Receipt image saved: ${destinationPath}`);
      return destinationPath;

    } catch (error) {
      console.error('Failed to save receipt image:', error);
      throw new Error(`Failed to save receipt image: ${error.message}`);
    }
  }

  /**
   * Get all saved receipt images
   */
  async getSavedReceipts(): Promise<Array<{ id: string; path: string; timestamp: number }>> {
    try {
      const receiptsDir = `${RNFS.DocumentDirectoryPath}/receipts`;

      // Check if directory exists
      const dirExists = await RNFS.exists(receiptsDir);
      if (!dirExists) {
        return [];
      }

      const files = await RNFS.readdir(receiptsDir);

      const receiptFiles = files
        .filter(file => file.startsWith('receipt_') && file.endsWith('.jpg'))
        .map(file => {
          const parts = file.replace('receipt_', '').replace('.jpg', '').split('_');
          const id = parts[0];
          const timestamp = parseInt(parts[1]) || 0;

          return {
            id,
            path: `${receiptsDir}/${file}`,
            timestamp
          };
        })
        .sort((a, b) => b.timestamp - a.timestamp);

      return receiptFiles;

    } catch (error) {
      console.error('Failed to get saved receipts:', error);
      return [];
    }
  }

  /**
   * Delete saved receipt image
   */
  async deleteReceiptImage(imagePath: string): Promise<void> {
    try {
      const exists = await RNFS.exists(imagePath);
      if (exists) {
        await RNFS.unlink(imagePath);
        console.log(`Receipt image deleted: ${imagePath}`);
      }
    } catch (error) {
      console.error('Failed to delete receipt image:', error);
      throw new Error(`Failed to delete receipt image: ${error.message}`);
    }
  }

  /**
   * Get OCR service statistics
   */
  getStats(): {
    isInitialized: boolean;
    isReady: boolean;
  } {
    return {
      isInitialized: this.isInitialized,
      isReady: this.worker !== null && this.isInitialized
    };
  }

  /**
   * Clean up resources
   */
  async cleanup(): Promise<void> {
    try {
      if (this.worker) {
        await this.worker.terminate();
        this.worker = null;
      }
      this.isInitialized = false;
      this.initializationPromise = null;
      console.log('OCR Service cleanup completed');
    } catch (error) {
      console.error('OCR Service cleanup failed:', error);
    }
  }

  /**
   * Learn from user corrections to improve OCR accuracy
   */
  async learnFromCorrection(
    originalOCRText: string,
    correctedText: string,
    imageUri?: string
  ): Promise<void> {
    try {
      // Store learning data for future OCR improvements
      const learningData = {
        originalOCR: originalOCRText,
        correctedText: correctedText,
        timestamp: Date.now(),
        imageInfo: imageUri ? await this.getImageInfo(imageUri) : null
      };

      // Save learning data (implement in database service)
      console.log('OCR Learning data:', learningData);

      // TODO: Implement machine learning feedback loop
      // This could be used to train custom OCR models or adjust recognition parameters

    } catch (error) {
      console.error('Learning from OCR correction failed:', error);
    }
  }

  /**
   * Get OCR statistics and performance metrics
   */
  async getOCRStats(): Promise<{
    totalProcessed: number;
    averageConfidence: number;
    averageProcessingTime: number;
    topMerchants: string[];
    accuracyTrend: number[];
  }> {
    try {
      // Placeholder for OCR statistics
      // In a real implementation, this would track OCR performance metrics
      return {
        totalProcessed: 0,
        averageConfidence: 0.82,
        averageProcessingTime: 4200,
        topMerchants: ['REWE', 'EDEKA', 'ALDI', 'McDonald\'s'],
        accuracyTrend: [0.78, 0.80, 0.82, 0.84, 0.85]
      };
    } catch (error) {
      console.error('Failed to get OCR stats:', error);
      return {
        totalProcessed: 0,
        averageConfidence: 0,
        averageProcessingTime: 0,
        topMerchants: [],
        accuracyTrend: []
      };
    }
  }

  // Private helper methods for enhanced OCR

  private getOptimizedOCRConfig(imageQuality: any) {
    const baseConfig = {
      tessedit_pageseg_mode: '6', // Uniform block of text
      tessedit_char_whitelist: '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyzäöüÄÖÜß€$.,:-/\n ',
      tessjs_create_hocr: '1',
      tessjs_create_tsv: '1'
    };

    // Adjust settings based on image quality
    if (imageQuality) {
      if (imageQuality.quality < 0.5) {
        // Low quality image - use more aggressive settings
        return {
          ...baseConfig,
          tessedit_pageseg_mode: '7', // Treat as single text line
          tessjs_create_pdf: '0' // Disable PDF to save memory
        };
      } else if (imageQuality.isReceipt) {
        // Receipt-specific optimization
        return {
          ...baseConfig,
          tessedit_pageseg_mode: '4', // Variable-size textlines
          preserve_interword_spaces: '1'
        };
      }
    }

    return baseConfig;
  }

  private enhanceOCRText(originalText: string, merchantInfo: any): string {
    let enhancedText = originalText;

    // Apply common OCR corrections
    enhancedText = enhancedText
      // Fix common OCR character mistakes
      .replace(/[Il|]/g, '1')  // I, l, | to 1
      .replace(/[O0]/g, '0')   // O to 0 in numbers context
      .replace(/[Ss\$]/g, '$') // S to $ in currency context
      // Fix common German umlauts
      .replace(/ae/gi, 'ä')
      .replace(/oe/gi, 'ö')
      .replace(/ue/gi, 'ü')
      .replace(/ss/gi, 'ß');

    // If merchant was recognized, try to correct the merchant name
    if (merchantInfo?.merchant) {
      const merchantName = merchantInfo.merchant.name;
      // Try to replace variations of the merchant name with the canonical version
      enhancedText = enhancedText.replace(
        new RegExp(merchantName.split('').join('\\s*'), 'gi'),
        merchantName
      );
    }

    return enhancedText;
  }

  private async getImageInfo(imageUri: string): Promise<any> {
    try {
      const imageInfo = await ImageManipulator.manipulateAsync(imageUri, [], {
        format: ImageManipulator.SaveFormat.JPEG
      });
      return {
        width: imageInfo.width,
        height: imageInfo.height,
        aspectRatio: imageInfo.height / imageInfo.width
      };
    } catch (error) {
      console.error('Failed to get image info:', error);
      return null;
    }
  }
}

export default new OCRService();
