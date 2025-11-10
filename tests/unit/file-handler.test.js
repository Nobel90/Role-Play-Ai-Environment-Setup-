/**
 * Unit tests for file handler utilities
 */

const fs = require('fs').promises;
const { readJsonFile, writeJsonFile, validateJson, formatJson } = require('../../src/utils/file-handler');

// Mock fs
jest.mock('fs', () => ({
  promises: {
    readFile: jest.fn(),
    writeFile: jest.fn()
  }
}));

describe('File Handler Utilities', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('readJsonFile', () => {
    it('should read and parse JSON file successfully', async () => {
      const mockData = { test: 'data' };
      fs.readFile.mockResolvedValue(JSON.stringify(mockData));

      const result = await readJsonFile('test.json');

      expect(result).toEqual(mockData);
      expect(fs.readFile).toHaveBeenCalledWith('test.json', 'utf8');
    });

    it('should handle file not found errors', async () => {
      const error = new Error('File not found');
      error.code = 'ENOENT';
      fs.readFile.mockRejectedValue(error);

      await expect(readJsonFile('nonexistent.json')).rejects.toThrow('File not found: nonexistent.json');
    });

    it('should handle invalid JSON errors', async () => {
      fs.readFile.mockResolvedValue('invalid json');
      const error = new SyntaxError('Unexpected token');
      JSON.parse = jest.fn().mockImplementation(() => {
        throw error;
      });

      await expect(readJsonFile('invalid.json')).rejects.toThrow('Invalid JSON');
    });
  });

  describe('writeJsonFile', () => {
    it('should write JSON file successfully', async () => {
      const testData = { test: 'data' };
      fs.writeFile.mockResolvedValue();

      await writeJsonFile('test.json', testData);

      expect(fs.writeFile).toHaveBeenCalledWith(
        'test.json',
        JSON.stringify(testData, null, 2),
        'utf8'
      );
    });

    it('should use custom indentation', async () => {
      const testData = { test: 'data' };
      fs.writeFile.mockResolvedValue();

      await writeJsonFile('test.json', testData, 4);

      expect(fs.writeFile).toHaveBeenCalledWith(
        'test.json',
        JSON.stringify(testData, null, 4),
        'utf8'
      );
    });
  });

  describe('validateJson', () => {
    it('should validate valid JSON string', () => {
      const validJson = '{"test": "data"}';
      const result = validateJson(validJson);
      expect(result).toEqual({ test: 'data' });
    });

    it('should throw error for invalid JSON', () => {
      const invalidJson = '{test: invalid}';
      expect(() => validateJson(invalidJson)).toThrow('Invalid JSON');
    });
  });

  describe('formatJson', () => {
    it('should format JSON object', () => {
      const data = { test: 'data' };
      const result = formatJson(data, 2);
      expect(result).toBe('{\n  "test": "data"\n}');
    });

    it('should format JSON string', () => {
      const data = '{"test": "data"}';
      const result = formatJson(data, 2);
      expect(result).toBe('{\n  "test": "data"\n}');
    });

    it('should throw error for invalid JSON', () => {
      const invalidData = '{test: invalid}';
      expect(() => formatJson(invalidData)).toThrow('Error formatting JSON');
    });
  });
});

