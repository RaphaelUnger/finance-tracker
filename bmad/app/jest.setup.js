// Mock AsyncStorage
const storage = {};
jest.mock('@react-native-async-storage/async-storage', () => ({
    getItem: jest.fn(async (k) => (k in storage ? storage[k] : null)),
    setItem: jest.fn(async (k, v) => { storage[k] = v; }),
    removeItem: jest.fn(async (k) => { delete storage[k]; }),
}));

// Set __DEV__ for logger tests
global.__DEV__ = true;
