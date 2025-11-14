declare module 'tesseract.js' {
    // minimal typings used by the project
    export type Worker = any;
    export type CreateWorkerOptions = any;
    export function createWorker(opts?: CreateWorkerOptions): Promise<Worker>;
    const t: any;
    export default t;
}
