// Lightweight OCR service wrapper (example)
// Uses tesseract.js worker for JS/WASM OCR, with a fallback hook for native ML Kit bindings.
// This file is a small, copyable example and not a production-ready module.

export type OCRResult = { text: string; error?: string };
import logger from '../utils/logger';

// Deferred import to avoid bundling unless used
async function createTesseractWorker(): Promise<any> {
    // tesseract.js requires Web Worker support. React Native does not provide Worker by default
    // which leads to errors like "Property 'Worker' doesn't exist" when attempting to create a worker.
    // Detect environment and avoid importing tesseract in unsupported runtimes.
    const hasWorker = typeof (globalThis as any).Worker === 'function' || typeof (global as any).Worker === 'function';
    if (!hasWorker) {
        logger.warn('tesseract worker not available: no Web Worker support in this environment');
        return null as any;
    }
    try {
        const tesseract = await import('tesseract.js');
        const worker = await tesseract.createWorker({
            logger: (m: any) => logger.debug('[tesseract]', m)
        } as any);
        return worker;
    } catch (err: any) {
        // Don't throw here; return null to allow the app to continue and surface a friendly message.
        logger.error('tesseract import failed', err);
        return null as any;
    }
}

export async function recognizeWithTesseract(uri: string): Promise<OCRResult> {
    const worker = await createTesseractWorker();
    if (!worker) {
        return { text: '', error: "tesseract.js not available (dynamic import failed). Install 'tesseract.js' or provide a native OCR implementation." };
    }
    try {
        await worker.load();
        await worker.loadLanguage('eng');
        await worker.initialize('eng');
        const { data } = await worker.recognize(uri);
        return { text: data.text };
    } catch (e: any) {
        logger.error('tesseract recognition failed', e);
        return { text: '', error: e?.message || String(e) };
    } finally {
        try {
            await worker.terminate();
        } catch (e) {
            logger.debug('worker terminate failed', e);
        }
    }
}

// Example fallback stub - replace with native ML Kit or platform-specific bindings
export async function recognizeWithNativeFallback(uri: string): Promise<OCRResult> {
    // Placeholder: call into a native module or a React Native library for ML Kit.
    // Example interface: NativeModules.MLKitOCR.detectText(uri)
    // For the example, we'll call tesseract as the default.
    try {
        return await recognizeWithTesseract(uri);
    } catch (e: any) {
        return { text: '', error: e?.message || String(e) };
    }
}

// Unified interface used by the app
export async function detectText(uri: string, preferNative = false): Promise<OCRResult> {
    if (preferNative) {
        try {
            return await recognizeWithNativeFallback(uri);
        } catch (err) {
            logger.warn('Native OCR failed, falling back to tesseract', err);
            return await recognizeWithTesseract(uri);
        }
    }
    try {
        return await recognizeWithTesseract(uri);
    } catch (e: any) {
        logger.error('detectText failed', e);
        return { text: '', error: e?.message || String(e) };
    }
}

// Returns basic OCR capability info without performing recognition.
export async function getCapabilities(): Promise<{ workerAvailable: boolean; tesseractInstalled: boolean }> {
    const workerAvailable = typeof (globalThis as any).Worker === 'function' || typeof (global as any).Worker === 'function';
    let tesseractInstalled = false;
    try {
        // try a lightweight import check (may still throw if package missing)
        // we avoid creating a worker here.
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        const mod = await import('tesseract.js');
        if (mod) tesseractInstalled = true;
    } catch (e) {
        tesseractInstalled = false;
    }
    return { workerAvailable, tesseractInstalled };
}
