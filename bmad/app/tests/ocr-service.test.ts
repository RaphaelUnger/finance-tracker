import { getCapabilities } from '../src/services/ocrService';

// Mock tesseract.js to avoid actual OCR processing
jest.mock('tesseract.js', () => ({
    createWorker: jest.fn(),
}));

// Mock the logger
jest.mock('../src/utils/logger', () => ({
    debug: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    default: {
        debug: jest.fn(),
        info: jest.fn(),
        warn: jest.fn(),
        error: jest.fn(),
    },
}));

describe('ocrService', () => {
    describe('getCapabilities', () => {
        it('should return capability information', async () => {
            const caps = await getCapabilities();

            expect(caps).toHaveProperty('workerAvailable');
            expect(caps).toHaveProperty('tesseractInstalled');
            expect(typeof caps.workerAvailable).toBe('boolean');
            expect(typeof caps.tesseractInstalled).toBe('boolean');
        });

        it('should detect tesseract installation', async () => {
            const caps = await getCapabilities();
            // Since we mocked tesseract.js, it should be detected as installed
            expect(caps.tesseractInstalled).toBe(true);
        });
    });
});
