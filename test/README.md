# XML Utilities Test Suite

This directory contains comprehensive tests for the XML utilities (`XmlUtil` class) located in `../src/utils/xml.util.js`.

## Test Coverage

The test suite covers all major functionality of the XmlUtil class:

### 🧪 **Core Functions**
- **`objectToXml`** - Object to XML conversion
- **`xmlToObject`** - XML to object parsing
- **`validateXml`** - XML validation
- **`formatXml`** - XML formatting and indentation
- **`extractFromXml`** - Data extraction using path queries
- **`createXmlResponse`** - API response creation

### 🔍 **Test Categories**
- **Unit Tests** - Individual function testing
- **Edge Cases** - Boundary conditions and unusual inputs
- **Error Handling** - Graceful error management
- **Integration Tests** - End-to-end functionality
- **Performance Tests** - Large data handling

## Running Tests

### Prerequisites
Jest is already configured in the root `package.json`. If you need to install it:
```bash
npm install --save-dev jest
```

### Test Commands
From the **root directory** of your project:
```bash
# Run all tests
npm test

# Run tests in watch mode (auto-rerun on file changes)
npm run test:watch

# Run tests with coverage report
npm run test:coverage

# Run tests with verbose output
npm run test:verbose
```

## Test Structure

### **objectToXml Tests**
- Simple object conversion
- Nested object handling
- Array processing
- Primitive type support
- Custom formatting options
- XML special character escaping
- Empty object handling

### **xmlToObject Tests**
- Basic XML parsing
- Declaration handling
- Parsing options
- Malformed XML handling

### **validateXml Tests**
- Well-formed XML validation
- Malformed XML rejection
- Unbalanced tag detection
- Edge case handling (null, undefined, non-strings)

### **formatXml Tests**
- XML formatting and indentation
- Custom formatting options
- Already formatted XML handling
- Empty XML handling

### **extractFromXml Tests**
- Path-based data extraction
- Non-existent path handling
- Invalid XML graceful handling

### **createXmlResponse Tests**
- Response object creation
- Content type and length calculation

### **Error Handling Tests**
- Graceful error management
- Proper error messages
- Logger integration

### **Edge Cases Tests**
- Deep nesting (100+ levels)
- Very long text content
- Special characters in element names

### **Integration Tests**
- Round-trip object conversion
- Complex nested structures
- Real-world data scenarios

## Mocking

The tests use Jest mocks to isolate the XmlUtil class from external dependencies:

- **Logger Mocking** - Prevents actual logging during tests
- **Dependency Isolation** - Tests focus on XML utility logic

## Coverage

The Jest configuration is set up in the root `package.json` to generate coverage reports:

- **Coverage Directory**: `coverage/` (in root directory)
- **Reporters**: Text, LCOV, HTML
- **Target**: All files in `src/**/*.js`

## Example Test Output

```bash
 PASS  xml.util.test.js
  XmlUtil
    objectToXml
      ✓ should convert simple object to XML (3ms)
      ✓ should handle nested objects (1ms)
      ✓ should handle arrays (1ms)
      ✓ should handle primitive types (1ms)
      ✓ should respect custom options (1ms)
      ✓ should escape XML special characters (1ms)
      ✓ should handle empty objects (1ms)
    xmlToObject
      ✓ should parse simple XML to object (1ms)
      ✓ should handle XML with declaration (1ms)
      ✓ should respect parsing options (1ms)
      ✓ should handle malformed XML gracefully (1ms)
    validateXml
      ✓ should validate well-formed XML (1ms)
      ✓ should reject malformed XML (1ms)
      ✓ should reject XML with unbalanced tags (1ms)
      ✓ should handle empty string (1ms)
      ✓ should handle null/undefined (1ms)
      ✓ should handle non-string input (1ms)
    formatXml
      ✓ should format unformatted XML (1ms)
      ✓ should respect custom formatting options (1ms)
      ✓ should handle already formatted XML (1ms)
      ✓ should handle empty XML (1ms)
    extractFromXml
      ✓ should extract data using simple path (1ms)
      ✓ should return null for non-existent path (1ms)
      ✓ should handle invalid XML gracefully (1ms)
    createXmlResponse
      ✓ should create proper response object (1ms)
      ✓ should calculate correct content length (1ms)
    error handling
      ✓ should handle errors in objectToXml gracefully (1ms)
      ✓ should handle errors in xmlToObject gracefully (1ms)
      ✓ should handle errors in formatXml gracefully (1ms)
      ✓ should handle errors in createXmlResponse gracefully (1ms)
    edge cases
      ✓ should handle very deep nesting (1ms)
      ✓ should handle very long text content (1ms)
      ✓ should handle special characters in element names (1ms)
    integration tests
      ✓ should round-trip object through XML conversion (1ms)
      ✓ should handle complex nested structures (1ms)

Test Suites: 1 passed, 1 total
Tests:       35 passed, 35 total
Snapshots:   0 total
Time:        2.145s
```

## Adding New Tests

To add new tests:

1. **Identify the function** to test
2. **Create test cases** covering normal usage, edge cases, and error conditions
3. **Follow the existing pattern** of describe blocks and test functions
4. **Use descriptive test names** that explain what is being tested
5. **Include both positive and negative test cases**

## Troubleshooting

### Common Issues
- **Import Errors**: Ensure the path to `xml.util.js` is correct
- **Mock Issues**: Check that logger mocking is working properly
- **Test Failures**: Review the actual vs expected output in test results

### Debug Mode
Run tests with verbose output to see detailed information:
```bash
npm run test:verbose
```

This comprehensive test suite ensures the XML utilities are robust, reliable, and handle all edge cases properly.
