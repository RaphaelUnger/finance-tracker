import logger, { debug, info, warn, error } from '../src/utils/logger';

describe('logger', () => {
    let consoleSpy: {
        debug: jest.SpyInstance;
        info: jest.SpyInstance;
        warn: jest.SpyInstance;
        error: jest.SpyInstance;
    };

    beforeEach(() => {
        consoleSpy = {
            debug: jest.spyOn(console, 'debug').mockImplementation(),
            info: jest.spyOn(console, 'info').mockImplementation(),
            warn: jest.spyOn(console, 'warn').mockImplementation(),
            error: jest.spyOn(console, 'error').mockImplementation(),
        };
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });

    describe('debug', () => {
        it('should log debug messages with prefix', () => {
            debug('test message');
            expect(consoleSpy.debug).toHaveBeenCalledWith('[debug]', 'test message');
        });

        it('should log multiple arguments', () => {
            debug('message', 123, { key: 'value' });
            expect(consoleSpy.debug).toHaveBeenCalledWith('[debug]', 'message', 123, { key: 'value' });
        });
    });

    describe('info', () => {
        it('should log info messages with prefix', () => {
            info('info message');
            expect(consoleSpy.info).toHaveBeenCalledWith('[info]', 'info message');
        });
    });

    describe('warn', () => {
        it('should log warning messages with prefix', () => {
            warn('warning message');
            expect(consoleSpy.warn).toHaveBeenCalledWith('[warn]', 'warning message');
        });
    });

    describe('error', () => {
        it('should log error messages with prefix', () => {
            error('error message');
            expect(consoleSpy.error).toHaveBeenCalledWith('[error]', 'error message');
        });

        it('should log error objects', () => {
            const err = new Error('test error');
            error('failed:', err);
            expect(consoleSpy.error).toHaveBeenCalledWith('[error]', 'failed:', err);
        });
    });

    describe('default export', () => {
        it('should export all log functions', () => {
            expect(logger.debug).toBe(debug);
            expect(logger.info).toBe(info);
            expect(logger.warn).toBe(warn);
            expect(logger.error).toBe(error);
        });
    });
});
