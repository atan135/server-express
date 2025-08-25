const { logger } = require("../middleware/logger.middleware");

class XmlUtil {
  static logger = logger("xml");

  /**
   * Convert JavaScript object to XML string
   * 将Javascript对象转换为XML字符串
   * @param {Object} obj - Object to convert
   * @param {string} rootName - Root element name
   * @param {Object} options - Conversion options
   * @returns {string} XML string
   */
  static objectToXml(obj, rootName = 'root', options = {}) {
    try {
      const {
        indent = '  ',
        newline = '\n',
        declaration = true,
        encoding = 'UTF-8',
        version = '1.0'
      } = options;

      let xml = '';
      
      // Add XML declaration
      if (declaration) {
        xml += `<?xml version="${version}" encoding="${encoding}"?>${newline}`;
      }

      // Convert object to XML
      xml += this._objToXml(obj, rootName, indent, newline, 0);
      
      return xml;
    } catch (error) {
      this.logger.error('Error converting object to XML', { error: error.message });
      throw new Error(`Failed to convert object to XML: ${error.message}`);
    }
  }

  /**
   * Convert XML string to JavaScript object
   * 将XML字符串转换为Javascript对象
   * @param {string} xmlString - XML string to parse
   * @param {Object} options - Parsing options
   * @returns {Object} Parsed object
   */
  static xmlToObject(xmlString, options = {}) {
    try {
      const {
        explicitArray = false,
        ignoreAttrs = false,
        trim = true,
        normalize = true
      } = options;

      // Handle null/undefined input
      if (!xmlString) {
        return {};
      }

      // Simple XML to object parser
      const result = this._parseXml(xmlString, {
        explicitArray,
        ignoreAttrs,
        trim,
        normalize
      });

      return result;
    } catch (error) {
      this.logger.error('Error parsing XML to object', { error: error.message });
      throw new Error(`Failed to parse XML: ${error.message}`);
    }
  }

  /**
   * Validate XML string format
   * 验证XML字符串格式是否正确
   * @param {string} xmlString - XML string to validate
   * @returns {boolean} True if valid XML
   */
  static validateXml(xmlString) {
    try {
      // Basic XML validation
      if (!xmlString || typeof xmlString !== 'string') {
        return false;
      }

      // Check for root element
      const hasRoot = /<[^?][^>]*>/.test(xmlString);
      
      // Check for balanced tags (basic check)
      const openTags = (xmlString.match(/<[^/][^>]*>/g) || []).length;
      const closeTags = (xmlString.match(/<\/[^>]*>/g) || []).length;
      
      // Additional check: ensure we have at least one complete tag pair
      const hasCompleteTag = /<[^>]+>[^<]*<\/[^>]+>/.test(xmlString);
      
      return hasRoot && openTags === closeTags && hasCompleteTag;
    } catch (error) {
      this.logger.error('Error validating XML', { error: error.message });
      return false;
    }
  }

  /**
   * Format XML string with proper indentation
   * 格式化XML字符串，添加适当的缩进
   * @param {string} xmlString - XML string to format
   * @param {Object} options - Formatting options
   * @returns {string} Formatted XML string
   */
  static formatXml(xmlString, options = {}) {
    try {
      const {
        indent = '  ',
        newline = '\n',
        maxLineLength = 120
      } = options;

      // Handle null/undefined input
      if (!xmlString) {
        return '';
      }

      // Remove existing whitespace and newlines
      let formatted = xmlString.replace(/>\s+</g, '><').trim();
      
      // Add line breaks and indentation
      formatted = formatted.replace(/></g, `>${newline}<`);
      
      let indentLevel = 0;
      const lines = formatted.split(newline);
      const formattedLines = [];

      for (let line of lines) {
        line = line.trim();
        if (!line) continue;

        // Decrease indent for closing tags
        if (line.startsWith('</')) {
          indentLevel = Math.max(0, indentLevel - 1);
        }

        // Add indentation
        const indentedLine = indent.repeat(indentLevel) + line;
        formattedLines.push(indentedLine);

        // Increase indent for opening tags (not self-closing)
        if (line.startsWith('<') && !line.startsWith('</') && !line.endsWith('/>')) {
          indentLevel++;
        }
      }

      return formattedLines.join(newline);
    } catch (error) {
      this.logger.error('Error formatting XML', { error: error.message });
      throw new Error(`Failed to format XML: ${error.message}`);
    }
  }

  /**
   * Extract specific data from XML using XPath-like queries
   * @param {string} xmlString - XML string to query
   * @param {string} query - Simple path query (e.g., 'user.name')
   * @returns {any} Extracted data
   */
  static extractFromXml(xmlString, query) {
    try {
      const obj = this.xmlToObject(xmlString);
      const keys = query.split('.');
      
      let result = obj;
      for (const key of keys) {
        if (result && typeof result === 'object' && result[key] !== undefined) {
          result = result[key];
        } else {
          return null;
        }
      }
      
      return result;
    } catch (error) {
      this.logger.error('Error extracting data from XML', { 
        query, 
        error: error.message 
      });
      return null;
    }
  }

  /**
   * Create XML response for API endpoints
   * @param {Object} data - Data to include in response
   * @param {string} rootName - Root element name
   * @param {Object} options - XML generation options
   * @returns {Object} Response object with XML content
   */
  static createXmlResponse(data, rootName = 'response', options = {}) {
    try {
      const xml = this.objectToXml(data, rootName, options);
      
      return {
        contentType: 'application/xml',
        content: xml,
        length: Buffer.byteLength(xml, 'utf8')
      };
    } catch (error) {
      this.logger.error('Error creating XML response', { error: error.message });
      throw new Error(`Failed to create XML response: ${error.message}`);
    }
  }

  // Private helper methods

  /**
   * Recursively convert object to XML
   * @private
   */
  static _objToXml(obj, elementName, indent, newline, level) {
    const currentIndent = indent.repeat(level);
    
    if (obj === null || obj === undefined) {
      return `${currentIndent}<${elementName} />${newline}`;
    }
    
    if (typeof obj === 'string' || typeof obj === 'number' || typeof obj === 'boolean') {
      return `${currentIndent}<${elementName}>${this._escapeXml(String(obj))}</${elementName}>${newline}`;
    }
    
    if (Array.isArray(obj)) {
      let xml = '';
      for (const item of obj) {
        xml += this._objToXml(item, elementName, indent, newline, level);
      }
      return xml;
    }
    
    if (typeof obj === 'object') {
      let xml = `${currentIndent}<${elementName}>${newline}`;
      
      for (const [key, value] of Object.entries(obj)) {
        xml += this._objToXml(value, key, indent, newline, level + 1);
      }
      
      xml += `${currentIndent}</${elementName}>${newline}`;
      return xml;
    }
    
    return `${currentIndent}<${elementName} />${newline}`;
  }

  /**
   * Simple XML parser
   * @private
   */
  static _parseXml(xmlString, options) {
    // This is a simplified parser - for production use, consider using xml2js
    const result = {};
    
    // Remove XML declaration and comments
    let cleanXml = xmlString.replace(/<\?xml[^>]*\?>/g, '')
                           .replace(/<!--[\s\S]*?-->/g, '')
                           .trim();
    
    // Extract root element name
    const rootMatch = cleanXml.match(/<([^>]+)>/);
    if (rootMatch) {
      const rootName = rootMatch[1].split(' ')[0];
      result[rootName] = this._parseElement(cleanXml, rootName, options);
    }
    
    // If no valid structure found, return empty object
    if (Object.keys(result).length === 0) {
      return {};
    }
    
    return result;
  }

  /**
   * Parse XML element
   * @private
   */
  static _parseElement(xml, elementName, options) {
    // Simplified element parsing
    const { trim, normalize } = options;
    
    // Extract text content for the specific element
    const pattern = new RegExp(`<${elementName}[^>]*>([^<]*)</${elementName}>`);
    const textMatch = xml.match(pattern);
    if (textMatch) {
      let text = textMatch[1];
      if (trim) text = text.trim();
      if (normalize) text = text.replace(/\s+/g, ' ');
      return text;
    }
    
    // If no direct text content, look for nested elements
    const nestedPattern = new RegExp(`<${elementName}[^>]*>([\\s\\S]*?)</${elementName}>`);
    const nestedMatch = xml.match(nestedPattern);
    if (nestedMatch) {
      let content = nestedMatch[1];
      if (trim) content = content.trim();
      if (normalize) content = content.replace(/\s+/g, ' ');
      return content;
    }
    
    return '';
  }

  /**
   * Escape XML special characters
   * @private
   */
  static _escapeXml(text) {
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;');
  }
}

module.exports = XmlUtil;
