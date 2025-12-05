module.exports = {
    preset: 'ts-jest',
    testEnvironment: 'node',
    moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json'],
    roots: ['<rootDir>/src', '<rootDir>/tests', '<rootDir>/__tests__'],
    setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
    collectCoverageFrom: [
        'src/services/**/*.{ts,tsx}',
        'src/utils/**/*.{ts,tsx}',
        '!src/**/*.d.ts',
        '!src/__mocks__/**',
        '!src/services/index.ts',
        '!src/services/models.ts',
        '!src/services/ocrService.ts',
        '!src/services/transactionService.ts',
    ],
    coverageThreshold: {
        global: {
            branches: 70,
            functions: 80,
            lines: 80,
            statements: 80,
        },
    },
    coverageReporters: ['text', 'lcov', 'html'],
};
