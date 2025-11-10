/**
 * Unit tests for JSONBin API client
 */

const { fetchJson, uploadJson } = require('../../src/api/jsonbin-client');
const axios = require('axios');

// Mock axios
jest.mock('axios');
const mockedAxios = axios;

// Mock config
jest.mock('../../src/config/settings', () => ({
  getConfig: () => ({
    BIN_URL: 'https://api.jsonbin.io/v3/b/test',
    HEADERS: {
      'Content-Type': 'application/json',
      'X-Master-Key': 'test-key'
    },
    TIMEOUT: 15000
  })
}));

describe('JSONBin API Client', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('fetchJson', () => {
    it('should fetch JSON successfully', async () => {
      const mockData = { record: { test: 'data' } };
      mockedAxios.get.mockResolvedValue({
        status: 200,
        data: mockData
      });

      const result = await fetchJson();

      expect(result).toEqual(mockData.record);
      expect(mockedAxios.get).toHaveBeenCalledWith(
        'https://api.jsonbin.io/v3/b/test',
        expect.objectContaining({
          headers: expect.any(Object),
          timeout: 15000
        })
      );
    });

    it('should handle HTTP errors', async () => {
      mockedAxios.get.mockRejectedValue({
        response: {
          status: 404,
          statusText: 'Not Found',
          data: { message: 'Bin not found' }
        }
      });

      await expect(fetchJson()).rejects.toThrow('HTTP 404: Bin not found');
    });

    it('should handle network errors', async () => {
      mockedAxios.get.mockRejectedValue({
        request: {}
      });

      await expect(fetchJson()).rejects.toThrow('Network error: No response from server');
    });
  });

  describe('uploadJson', () => {
    it('should upload JSON successfully', async () => {
      const testData = { test: 'data' };
      const mockResponse = { success: true };
      mockedAxios.put.mockResolvedValue({
        status: 200,
        data: mockResponse
      });

      const result = await uploadJson(testData);

      expect(result).toEqual(mockResponse);
      expect(mockedAxios.put).toHaveBeenCalledWith(
        'https://api.jsonbin.io/v3/b/test',
        testData,
        expect.objectContaining({
          headers: expect.any(Object),
          timeout: 15000
        })
      );
    });

    it('should handle upload errors', async () => {
      const testData = { test: 'data' };
      mockedAxios.put.mockRejectedValue({
        response: {
          status: 401,
          statusText: 'Unauthorized',
          data: { message: 'Invalid API key' }
        }
      });

      await expect(uploadJson(testData)).rejects.toThrow('HTTP 401: Invalid API key');
    });
  });
});

