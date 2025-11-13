// Lightweight OCR service wrapper (example)
// Uses tesseract.js worker for JS/WASM OCR, with a fallback hook for native ML Kit bindings.
// This file is a small, copyable example and not a production-ready module.

import type { Worker, CreateWorkerOptions } from 'tesseract.js';

export type OCRResult = { text: string };

// Deferred import to avoid bundling unless used
async function createTesseractWorker(): Promise<Worker> {
    const tesseract = await import('tesseract.js');
    const worker = await tesseract.createWorker({
        logger: (m: any) => console.debug('[tesseract]', m)
    } as CreateWorkerOptions);
    return worker as unknown as Worker;
}

export async function recognizeWithTesseract(uri: string): Promise<OCRResult> {
    const worker = await createTesseractWorker();
    try {
        await worker.load();
        await worker.loadLanguage('eng');
        await worker.initialize('eng');
        const { data } = await worker.recognize(uri);
        return { text: data.text };
    } finally {
        try {
            await worker.terminate();
        } catch (e) {
            // ignore
        }
    }
}

// Example fallback stub - replace with native ML Kit or platform-specific bindings
export async function recognizeWithNativeFallback(uri: string): Promise<OCRResult> {
    // Placeholder: call into a native module or a React Native library for ML Kit.
    // Example interface: NativeModules.MLKitOCR.detectText(uri)
    // For the example, we'll call tesseract as the default.
    return recognizeWithTesseract(uri);
}

// Unified interface used by the app
export async function detectText(uri: string, preferNative = false): Promise<OCRResult> {
    if (preferNative) {
        try {
            return await recognizeWithNativeFallback(uri);
        } catch (err) {
            console.warn('Native OCR failed, falling back to tesseract', err);
            return recognizeWithTesseract(uri);
        }
    }
    return recognizeWithTesseract(uri);
}
