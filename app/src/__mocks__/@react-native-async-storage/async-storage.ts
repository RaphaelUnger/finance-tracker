const storage: Record<string, string> = {};

export default {
    getItem: async (k: string) => (k in storage ? storage[k] : null),
    setItem: async (k: string, v: string) => { storage[k] = v; },
    removeItem: async (k: string) => { delete storage[k]; },
};
