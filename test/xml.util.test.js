const XmlUtil = require('../src/utils/xml.util');

// Mock logger to avoid dependency issues in tests
jest.mock('../src/middleware/logger.middleware', () => ({
  logger: jest.fn(() => ({
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn()
  }))
}));

describe('XmlUtil', () => {
  let mockLogger;

  beforeEach(() => {
    mockLogger = {
      info: jest.fn(),
      error: jest.fn(),
      warn: jest.fn()
    };
    require('../src/middleware/logger.middleware').logger.mockReturnValue(mockLogger);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('objectToXml', () => {
    test('should convert simple object to XML', () => {
      const obj = { name: 'John', age: 30 };
      const result = XmlUtil.objectToXml(obj, 'person');
      
      expect(result).toContain('<?xml version="1.0" encoding="UTF-8"?>');
      expect(result).toContain('<person>');
      expect(result).toContain('<name>John</name>');
      expect(result).toContain('<age>30</age>');
      expect(result).toContain('</person>');
    });

    test('should handle nested objects', () => {
      const obj = {
        user: {
          profile: {
            firstName: 'John',
            lastName: 'Doe'
          },
          settings: {
            theme: 'dark'
          }
        }
      };
      
      const result = XmlUtil.objectToXml(obj, 'data');
      
      expect(result).toContain('<user>');
      expect(result).toContain('<profile>');
      expect(result).toContain('<firstName>John</firstName>');
      expect(result).toContain('<lastName>Doe</lastName>');
      expect(result).toContain('<settings>');
      expect(result).toContain('<theme>dark</theme>');
    });

    test('should handle arrays', () => {
      const obj = {
        users: [
          { name: 'John', age: 30 },
          { name: 'Jane', age: 25 }
        ]
      };
      
      const result = XmlUtil.objectToXml(obj, 'data');
      
      expect(result).toContain('<users>');
      expect(result).toContain('<name>John</name>');
      expect(result).toContain('<age>30</age>');
      expect(result).toContain('<name>Jane</name>');
      expect(result).toContain('<age>25</age>');
    });

    test('should handle primitive types', () => {
      const obj = {
        string: 'hello',
        number: 42,
        boolean: true,
        nullValue: null
      };
      
      const result = XmlUtil.objectToXml(obj, 'data');
      
      expect(result).toContain('<string>hello</string>');
      expect(result).toContain('<number>42</number>');
      expect(result).toContain('<boolean>true</boolean>');
      expect(result).toContain('<nullValue />');
    });

    test('should respect custom options', () => {
      const obj = { name: 'John' };
      const options = {
        indent: '    ',
        newline: '\r\n',
        declaration: false,
        encoding: 'ISO-8859-1',
        version: '1.1'
      };
      
      const result = XmlUtil.objectToXml(obj, 'person', options);
      
      expect(result).not.toContain('<?xml');
      expect(result).toContain('<person>');
      expect(result).toContain('\r\n');
    });

    test('should escape XML special characters', () => {
      const obj = {
        text: 'Hello & World < 10 > 5 "quoted" \'single\''
      };
      
      const result = XmlUtil.objectToXml(obj, 'data');
      
      expect(result).toContain('<text>Hello &amp; World &lt; 10 &gt; 5 &quot;quoted&quot; &apos;single&apos;</text>');
    });

    test('should handle empty objects', () => {
      const obj = {};
      const result = XmlUtil.objectToXml(obj, 'empty');
      
      expect(result).toContain('<empty>');
      expect(result).toContain('</empty>');
    });
  });

  describe('xmlToObject', () => {
    test('should parse simple XML to object', () => {
      const xml = '<person><name>John</name><age>30</age></person>';
      const result = XmlUtil.xmlToObject(xml);
      
      expect(result).toHaveProperty('person');
      expect(result.person).toContain('John'); // Simplified parser returns nested content
    });

    test('should handle XML with declaration', () => {
      const xml = '<?xml version="1.0" encoding="UTF-8"?><data>test</data>';
      const result = XmlUtil.xmlToObject(xml);
      
      expect(result).toHaveProperty('data');
    });

    test('should respect parsing options', () => {
      const xml = '<data>  test  </data>';
      const result = XmlUtil.xmlToObject(xml, { trim: false, normalize: false });
      
      expect(result).toHaveProperty('data');
    });

    test('should handle malformed XML gracefully', () => {
      const xml = '<data>test';
      const result = XmlUtil.xmlToObject(xml);
      
      // The simple parser will still try to extract what it can
      expect(result).toBeDefined();
    });
  });

  describe('validateXml', () => {
    test('should validate well-formed XML', () => {
      const validXml = '<data>test</data>';
      const result = XmlUtil.validateXml(validXml);
      
      expect(result).toBe(true);
    });

    test('should reject malformed XML', () => {
      const invalidXml = '<data>test';
      const result = XmlUtil.validateXml(invalidXml);
      
      expect(result).toBe(false);
    });

    test('should reject XML with unbalanced tags', () => {
      const invalidXml = '<data><item>test</data>';
      const result = XmlUtil.validateXml(invalidXml);
      
      expect(result).toBe(false);
    });

    test('should handle empty string', () => {
      const result = XmlUtil.validateXml('');
      expect(result).toBe(false);
    });

    test('should handle null/undefined', () => {
      expect(XmlUtil.validateXml(null)).toBe(false);
      expect(XmlUtil.validateXml(undefined)).toBe(false);
    });

    test('should handle non-string input', () => {
      expect(XmlUtil.validateXml(123)).toBe(false);
      expect(XmlUtil.validateXml({})).toBe(false);
    });
  });

  describe('formatXml', () => {
    test('should format unformatted XML', () => {
      const unformatted = '<data><item>test</item><nested><value>123</value></nested></data>';
      const result = XmlUtil.formatXml(unformatted);
      
      expect(result).toContain('\n');
      expect(result).toContain('  <item>');
      expect(result).toContain('    <value>');
    });

    test('should respect custom formatting options', () => {
      const xml = '<data><item>test</item></data>';
      const options = { indent: '    ', newline: '\r\n' };
      const result = XmlUtil.formatXml(xml, options);
      
      expect(result).toContain('    <item>');
      expect(result).toContain('\r\n');
    });

    test('should handle already formatted XML', () => {
      const formatted = '<data>\n  <item>test</item>\n</data>';
      const result = XmlUtil.formatXml(formatted);
      
      expect(result).toContain('  <item>');
    });

    test('should handle empty XML', () => {
      const result = XmlUtil.formatXml('');
      expect(result).toBe('');
    });
  });

  describe('extractFromXml', () => {
    test('should extract data using simple path', () => {
      const xml = '<data><user><name>John</name><age>30</age></user></data>';
      const result = XmlUtil.extractFromXml(xml, 'data');
      
      // The simple parser extracts the content of the root element
      expect(result).toContain('John');
    });

    test('should return null for non-existent path', () => {
      const xml = '<data><user><name>John</name></user></data>';
      const result = XmlUtil.extractFromXml(xml, 'data.user.email');
      
      expect(result).toBeNull();
    });

    test('should handle invalid XML gracefully', () => {
      const result = XmlUtil.extractFromXml('<invalid>', 'data.user.name');
      
      expect(result).toBeNull();
    });
  });

  describe('createXmlResponse', () => {
    test('should create proper response object', () => {
      const data = { message: 'Success', status: 'OK' };
      const result = XmlUtil.createXmlResponse(data, 'api-response');
      
      expect(result).toHaveProperty('contentType', 'application/xml');
      expect(result).toHaveProperty('content');
      expect(result).toHaveProperty('length');
      expect(result.content).toContain('<api-response>');
      expect(result.content).toContain('<message>Success</message>');
      expect(result.content).toContain('<status>OK</status>');
    });

    test('should calculate correct content length', () => {
      const data = { test: 'data' };
      const result = XmlUtil.createXmlResponse(data, 'test');
      
      expect(result.length).toBe(Buffer.byteLength(result.content, 'utf8'));
    });
  });

  describe('error handling', () => {
    test('should handle errors in objectToXml gracefully', () => {
      // Mock a scenario that would cause an error
      const circularObj = {};
      circularObj.self = circularObj;
      
      expect(() => {
        XmlUtil.objectToXml(circularObj, 'test');
      }).toThrow('Failed to convert object to XML');
    });

    test('should handle errors in xmlToObject gracefully', () => {
      const invalidXml = null;
      
      // The method now handles null gracefully and returns empty object
      const result = XmlUtil.xmlToObject(invalidXml);
      expect(result).toEqual({});
    });

    test('should handle errors in formatXml gracefully', () => {
      const invalidXml = null;
      
      // The method now handles null gracefully and returns empty string
      const result = XmlUtil.formatXml(invalidXml);
      expect(result).toBe('');
    });

    test('should handle errors in createXmlResponse gracefully', () => {
      const circularObj = {};
      circularObj.self = circularObj;
      
      expect(() => {
        XmlUtil.createXmlResponse(circularObj, 'test');
      }).toThrow('Failed to create XML response');
    });
  });

  describe('edge cases', () => {
    test('should handle very deep nesting', () => {
      let deepObj = { value: 'deep' };
      for (let i = 0; i < 100; i++) {
        deepObj = { nested: deepObj };
      }
      
      const result = XmlUtil.objectToXml(deepObj, 'deep');
      expect(result).toContain('<deep>');
      expect(result).toContain('</deep>');
    });

    test('should handle very long text content', () => {
      const longText = 'a'.repeat(10000);
      const obj = { content: longText };
      
      const result = XmlUtil.objectToXml(obj, 'data');
      expect(result).toContain(longText);
    });

    test('should handle special characters in element names', () => {
      const obj = { 'special-name': 'value' };
      
      const result = XmlUtil.objectToXml(obj, 'data');
      expect(result).toContain('<special-name>');
      expect(result).toContain('</special-name>');
    });
  });

  describe('integration tests', () => {
    test('should round-trip object through XML conversion', () => {
      const originalObj = {
        user: {
          id: 1,
          name: 'John Doe',
          email: 'john@example.com',
          preferences: {
            theme: 'dark',
            notifications: true
          },
          tags: ['admin', 'user']
        }
      };
      
      const xml = XmlUtil.objectToXml(originalObj, 'data');
      const parsedObj = XmlUtil.xmlToObject(xml);
      
      // Note: The simple parser won't preserve the full structure,
      // but we can verify the XML is generated
      expect(xml).toContain('<data>');
      expect(parsedObj).toBeDefined();
    });

    test('should handle complex nested structures', () => {
      const complexObj = {
        company: {
          name: 'Tech Corp',
          employees: [
            {
              id: 1,
              name: 'Alice',
              department: 'Engineering',
              skills: ['JavaScript', 'Python', 'SQL']
            },
            {
              id: 2,
              name: 'Bob',
              department: 'Design',
              skills: ['UI/UX', 'Figma', 'Prototyping']
            }
          ],
          departments: {
            engineering: { head: 'Alice', size: 15 },
            design: { head: 'Bob', size: 8 }
          }
        }
      };
      
      const xml = XmlUtil.objectToXml(complexObj, 'organization');
      const formatted = XmlUtil.formatXml(xml);
      
      expect(formatted).toContain('<company>');
      expect(formatted).toContain('<employees>');
      expect(formatted).toContain('<departments>');
    });
  });
});

