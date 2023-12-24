import { isValidUrl } from '../src/util.mjs';

describe('Utils', () => {
  describe('isValidUrl#', () => {
    test('should be a valid http url', () => {
      expect(isValidUrl('http://example.com')).toBeTruthy;
    });

    test('should be a valid https url', () => {
      expect(isValidUrl('https://example.com')).toBeTruthy;
    });

    test('should be a valid https url with username and password', () => {
      expect(isValidUrl('http://hello:world@example.com')).toBeTruthy;
    });

    test('should be a valid https url with username and password', () => {
      expect(isValidUrl('https://hello:world@example.com')).toBeTruthy;
    });

    test('should throw error for invalid url', () => {
      expect(() => {
        isValidUrl('htt//example.com');
      }).toThrow('Invalid URL');
    });
  });
});
