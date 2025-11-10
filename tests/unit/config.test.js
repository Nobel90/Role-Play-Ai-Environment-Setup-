/**
 * Unit tests for configuration management
 */

const fs = require('fs');
const path = require('path');
const { getConfig, updateConfig, DEFAULT_CONFIG } = require('../../src/config/settings');

// Mock Electron app
jest.mock('electron', () => ({
  app: {
    getPath: jest.fn(() => path.join(process.cwd(), 'test-config'))
  }
}));

// Mock fs
jest.mock('fs', () => ({
  existsSync: jest.fn(),
  readFileSync: jest.fn(),
  writeFileSync: jest.fn(),
  mkdirSync: jest.fn()
}));

describe('Configuration Management', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Reset environment variables
    delete process.env.JSONBIN_URL;
    delete process.env.JSONBIN_MASTER_KEY;
    delete process.env.API_TIMEOUT;
  });

  describe('getConfig', () => {
    it('should return default config when no file or env vars exist', () => {
      fs.existsSync.mockReturnValue(false);
      const config = getConfig();
      expect(config).toEqual(DEFAULT_CONFIG);
    });

    it('should load config from file if exists', () => {
      const fileConfig = { BIN_URL: 'https://custom.url' };
      fs.existsSync.mockReturnValue(true);
      fs.readFileSync.mockReturnValue(JSON.stringify(fileConfig));

      const config = getConfig();
      expect(config.BIN_URL).toBe('https://custom.url');
    });

    it('should override with environment variables', () => {
      process.env.JSONBIN_URL = 'https://env.url';
      process.env.JSONBIN_MASTER_KEY = 'env-key';
      process.env.API_TIMEOUT = '20000';

      fs.existsSync.mockReturnValue(false);
      const config = getConfig();

      expect(config.BIN_URL).toBe('https://env.url');
      expect(config.HEADERS['X-Master-Key']).toBe('env-key');
      expect(config.TIMEOUT).toBe(20000);
    });
  });

  describe('updateConfig', () => {
    it('should update and save configuration', () => {
      fs.existsSync.mockReturnValue(false);
      fs.mkdirSync.mockImplementation(() => {});

      const updates = { BIN_URL: 'https://new.url' };
      const newConfig = updateConfig(updates);

      expect(newConfig.BIN_URL).toBe('https://new.url');
      expect(fs.writeFileSync).toHaveBeenCalled();
    });
  });
});

