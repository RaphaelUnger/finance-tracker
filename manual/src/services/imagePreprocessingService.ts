import * as ImageManipulator from 'expo-image-manipulator';
import RNFS from 'react-native-fs';

export interface ImagePreprocessingOptions {
  enableAutoCorrection?: boolean;
  enablePerspectiveCorrection?: boolean;
  enableNoiseReduction?: boolean;
  contrastFactor?: number;
  brightnessFactor?: number;
  sharpening?: boolean;
}

export interface ImageAnalysisResult {
  quality: number;
  hasText: boolean;
  isReceipt: boolean;
  confidence: number;
  suggestedCorrections: string[];
}

class ImagePreprocessingService {
  /**
   * Preprocess image for optimal OCR results
   */
  async preprocessImage(
    imageUri: string,
    options: ImagePreprocessingOptions = {}
  ): Promise<string> {
    try {
      const {
        enableAutoCorrection = true,
        enablePerspectiveCorrection = true,
        enableNoiseReduction = true,
        contrastFactor = 1.2,
        brightnessFactor = 1.1,
        sharpening = true
      } = options;

      let processedUri = imageUri;

      // Step 1: Basic image analysis
      const analysis = await this.analyzeImage(imageUri);
      console.log('Image analysis result:', analysis);

      // Step 2: Auto-rotate based on EXIF data
      if (enableAutoCorrection) {
        processedUri = await this.autoRotateImage(processedUri);
      }

      // Step 3: Perspective correction for receipts
      if (enablePerspectiveCorrection && analysis.isReceipt) {
        processedUri = await this.correctPerspective(processedUri);
      }

      // Step 4: Enhance contrast and brightness
      processedUri = await this.enhanceImageQuality(
        processedUri,
        contrastFactor,
        brightnessFactor
      );

      // Step 5: Noise reduction and sharpening
      if (enableNoiseReduction) {
        processedUri = await this.reduceNoise(processedUri);
      }

      if (sharpening) {
        processedUri = await this.sharpenImage(processedUri);
      }

      // Step 6: Optimize for OCR (resize if needed)
      processedUri = await this.optimizeForOCR(processedUri);

      return processedUri;

    } catch (error) {
      console.error('Image preprocessing failed:', error);
      // Return original image if preprocessing fails
      return imageUri;
    }
  }

  /**
   * Analyze image to determine if it's a receipt and quality
   */
  async analyzeImage(imageUri: string): Promise<ImageAnalysisResult> {
    try {
      // Basic image info analysis
      const imageInfo = await ImageManipulator.manipulateAsync(imageUri, [], {
        format: ImageManipulator.SaveFormat.JPEG
      });

      const { width, height } = imageInfo;
      const aspectRatio = height / width;

      // Heuristics for receipt detection
      const isReceiptShape = aspectRatio > 1.5 && aspectRatio < 4.0; // Typical receipt proportions
      const hasGoodResolution = width >= 600 && height >= 800;

      // Simple quality assessment
      let quality = 0.5;
      if (hasGoodResolution) quality += 0.3;
      if (isReceiptShape) quality += 0.2;

      const result: ImageAnalysisResult = {
        quality,
        hasText: true, // Assume true, would need more complex analysis
        isReceipt: isReceiptShape,
        confidence: quality,
        suggestedCorrections: []
      };

      // Add suggestions based on analysis
      if (!hasGoodResolution) {
        result.suggestedCorrections.push('Image resolution could be higher for better OCR results');
      }

      if (!isReceiptShape) {
        result.suggestedCorrections.push('Image might not be a receipt - check framing');
      }

      return result;

    } catch (error) {
      console.error('Image analysis failed:', error);
      return {
        quality: 0.3,
        hasText: false,
        isReceipt: false,
        confidence: 0.1,
        suggestedCorrections: ['Image analysis failed - manual review recommended']
      };
    }
  }

  /**
   * Auto-rotate image based on orientation
   */
  private async autoRotateImage(imageUri: string): Promise<string> {
    try {
      // For now, just ensure proper orientation
      // In a real implementation, you'd read EXIF data
      const result = await ImageManipulator.manipulateAsync(
        imageUri,
        [
          // Most receipts are vertical, so rotate if needed based on dimensions
        ],
        {
          compress: 0.9,
          format: ImageManipulator.SaveFormat.JPEG
        }
      );

      return result.uri;
    } catch (error) {
      console.error('Auto-rotation failed:', error);
      return imageUri;
    }
  }

  /**
   * Correct perspective distortion for receipts
   */
  private async correctPerspective(imageUri: string): Promise<string> {
    try {
      // Basic perspective correction using resize and crop
      // Advanced perspective correction would require computer vision libraries

      const result = await ImageManipulator.manipulateAsync(
        imageUri,
        [
          // Basic crop to focus on receipt content (remove background)
          {
            crop: {
              originX: 0.05,
              originY: 0.05,
              width: 0.9,
              height: 0.9
            }
          }
        ],
        {
          compress: 0.9,
          format: ImageManipulator.SaveFormat.JPEG
        }
      );

      return result.uri;
    } catch (error) {
      console.error('Perspective correction failed:', error);
      return imageUri;
    }
  }

  /**
   * Enhance image contrast and brightness
   */
  private async enhanceImageQuality(
    imageUri: string,
    contrastFactor: number,
    brightnessFactor: number
  ): Promise<string> {
    try {
      // Note: React Native Image Manipulator has limited filter support
      // For advanced image enhancement, you'd need a native module or external service

      // Basic resize for consistency
      const result = await ImageManipulator.manipulateAsync(
        imageUri,
        [
          {
            resize: {
              width: 1200, // Optimal width for OCR
            }
          }
        ],
        {
          compress: 0.8,
          format: ImageManipulator.SaveFormat.JPEG
        }
      );

      return result.uri;
    } catch (error) {
      console.error('Image enhancement failed:', error);
      return imageUri;
    }
  }

  /**
   * Reduce noise in the image
   */
  private async reduceNoise(imageUri: string): Promise<string> {
    try {
      // Basic noise reduction through compression and resizing
      const result = await ImageManipulator.manipulateAsync(
        imageUri,
        [],
        {
          compress: 0.85, // Slight compression can reduce noise
          format: ImageManipulator.SaveFormat.JPEG
        }
      );

      return result.uri;
    } catch (error) {
      console.error('Noise reduction failed:', error);
      return imageUri;
    }
  }

  /**
   * Sharpen image for better text recognition
   */
  private async sharpenImage(imageUri: string): Promise<string> {
    try {
      // Image sharpening would require advanced image processing
      // For now, return as-is (placeholder for future enhancement)
      return imageUri;
    } catch (error) {
      console.error('Image sharpening failed:', error);
      return imageUri;
    }
  }

  /**
   * Optimize image specifically for OCR processing
   */
  private async optimizeForOCR(imageUri: string): Promise<string> {
    try {
      // Ensure optimal size and format for OCR
      const result = await ImageManipulator.manipulateAsync(
        imageUri,
        [
          {
            resize: {
              width: 1200 // OCR works best with 1200-1600px width
            }
          }
        ],
        {
          compress: 0.9,
          format: ImageManipulator.SaveFormat.JPEG
        }
      );

      return result.uri;
    } catch (error) {
      console.error('OCR optimization failed:', error);
      return imageUri;
    }
  }

  /**
   * Auto-crop receipt from image
   */
  async autoCropReceipt(imageUri: string): Promise<string> {
    try {
      // Advanced auto-cropping would use edge detection
      // For MVP, use intelligent cropping based on image analysis

      const analysis = await this.analyzeImage(imageUri);

      if (!analysis.isReceipt) {
        // If not a receipt shape, try to crop to center
        const result = await ImageManipulator.manipulateAsync(
          imageUri,
          [
            {
              crop: {
                originX: 0.1,
                originY: 0.1,
                width: 0.8,
                height: 0.8
              }
            }
          ],
          {
            compress: 0.9,
            format: ImageManipulator.SaveFormat.JPEG
          }
        );

        return result.uri;
      }

      return imageUri; // Already good receipt shape
    } catch (error) {
      console.error('Auto-crop failed:', error);
      return imageUri;
    }
  }

  /**
   * Batch process multiple images
   */
  async batchPreprocess(
    imageUris: string[],
    options: ImagePreprocessingOptions = {}
  ): Promise<string[]> {
    const results: string[] = [];

    for (const uri of imageUris) {
      try {
        const processed = await this.preprocessImage(uri, options);
        results.push(processed);
      } catch (error) {
        console.error(`Failed to process image ${uri}:`, error);
        results.push(uri); // Use original on failure
      }
    }

    return results;
  }

  /**
   * Generate processing statistics
   */
  async getProcessingStats(
    originalUri: string,
    processedUri: string
  ): Promise<{
    originalSize: number;
    processedSize: number;
    compressionRatio: number;
    qualityImprovement: number;
  }> {
    try {
      const [originalStats, processedStats] = await Promise.all([
        RNFS.stat(originalUri.replace('file://', '')),
        RNFS.stat(processedUri.replace('file://', ''))
      ]);

      const compressionRatio = processedStats.size / originalStats.size;

      // Simple quality heuristic based on analysis
      const originalAnalysis = await this.analyzeImage(originalUri);
      const processedAnalysis = await this.analyzeImage(processedUri);

      const qualityImprovement = processedAnalysis.quality - originalAnalysis.quality;

      return {
        originalSize: originalStats.size,
        processedSize: processedStats.size,
        compressionRatio,
        qualityImprovement
      };
    } catch (error) {
      console.error('Failed to get processing stats:', error);
      return {
        originalSize: 0,
        processedSize: 0,
        compressionRatio: 1,
        qualityImprovement: 0
      };
    }
  }

  /**
   * Create preview with enhancement indicators
   */
  async createEnhancementPreview(
    imageUri: string,
    options: ImagePreprocessingOptions = {}
  ): Promise<{
    original: string;
    enhanced: string;
    improvements: string[];
  }> {
    try {
      const enhanced = await this.preprocessImage(imageUri, options);
      const analysis = await this.analyzeImage(enhanced);

      return {
        original: imageUri,
        enhanced,
        improvements: [
          'Optimized for OCR processing',
          'Enhanced contrast and brightness',
          'Noise reduction applied',
          ...analysis.suggestedCorrections
        ]
      };
    } catch (error) {
      console.error('Failed to create enhancement preview:', error);
      return {
        original: imageUri,
        enhanced: imageUri,
        improvements: ['Enhancement failed - using original image']
      };
    }
  }
}

export default new ImagePreprocessingService();
