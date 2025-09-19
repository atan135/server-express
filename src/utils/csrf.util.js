const { logger } = require("../middleware/logger.middleware");

class CSRFUtil {
    static logger = logger("csrf-util");

    /**
     * Get CSRF token from server
     * 从服务器获取CSRF令牌
     * @param {string} baseUrl - Base URL of the API
     * @returns {Promise<Object>} CSRF token response
     */
    static async getCSRFToken(baseUrl = '') {
        try {
            const response = await fetch(`${baseUrl}/api/auth/csrf-token`, {
                method: 'GET',
                credentials: 'include', // Include cookies for session
                headers: {
                    'Content-Type': 'application/json',
                }
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();

            if (data.errcode !== 0) {
                throw new Error(data.errmsg || 'Failed to get CSRF token');
            }

            this.logger.debug('CSRF token retrieved', {
                sessionId: data.sessionId,
                tokenLength: data.csrfToken?.length
            });

            return data;
        } catch (error) {
            this.logger.error('Error getting CSRF token', { error: error.message });
            throw error;
        }
    }

    /**
     * Make authenticated request with CSRF token
     * 使用CSRF令牌发送认证请求
     * @param {string} url - Request URL
     * @param {Object} options - Fetch options
     * @param {string} csrfToken - CSRF token
     * @returns {Promise<Response>} Fetch response
     */
    static async authenticatedRequest(url, options = {}, csrfToken) {
        try {
            const defaultOptions = {
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-Token': csrfToken,
                    ...options.headers
                },
                ...options
            };

            this.logger.debug('Making authenticated request', {
                url,
                method: defaultOptions.method || 'GET',
                hasCSRFToken: !!csrfToken
            });

            const response = await fetch(url, defaultOptions);
            return response;
        } catch (error) {
            this.logger.error('Error making authenticated request', {
                error: error.message,
                url
            });
            throw error;
        }
    }

    /**
     * Create form data with CSRF token
     * 创建包含CSRF令牌的表单数据
     * @param {Object} formData - Form data object
     * @param {string} csrfToken - CSRF token
     * @returns {FormData} FormData with CSRF token
     */
    static createFormDataWithCSRF(formData, csrfToken) {
        const data = new FormData();

        // Add CSRF token
        data.append('_csrf', csrfToken);

        // Add other form data
        Object.keys(formData).forEach(key => {
            data.append(key, formData[key]);
        });

        this.logger.debug('Form data created with CSRF token', {
            fieldCount: Object.keys(formData).length + 1
        });

        return data;
    }

    /**
     * Create URL with CSRF token as query parameter
     * 创建包含CSRF令牌作为查询参数的URL
     * @param {string} url - Base URL
     * @param {string} csrfToken - CSRF token
     * @returns {string} URL with CSRF token
     */
    static createURLWithCSRF(url, csrfToken) {
        const separator = url.includes('?') ? '&' : '?';
        const urlWithCSRF = `${url}${separator}_csrf=${encodeURIComponent(csrfToken)}`;

        this.logger.debug('URL created with CSRF token', {
            originalUrl: url,
            hasQuery: url.includes('?')
        });

        return urlWithCSRF;
    }

    /**
     * Validate CSRF token format
     * 验证CSRF令牌格式
     * @param {string} token - CSRF token to validate
     * @returns {boolean} True if token format is valid
     */
    static validateTokenFormat(token) {
        if (!token || typeof token !== 'string') {
            return false;
        }

        // CSRF tokens are typically base64-like strings
        // This is a basic format check
        const tokenRegex = /^[A-Za-z0-9+/=_-]+$/;
        const isValid = tokenRegex.test(token) && token.length >= 16;

        this.logger.debug('CSRF token format validation', {
            isValid,
            tokenLength: token.length
        });

        return isValid;
    }

    /**
     * Store CSRF token in localStorage
     * 将CSRF令牌存储到localStorage
     * @param {string} token - CSRF token
     * @param {string} sessionId - Session ID
     */
    static storeTokenInLocalStorage(token, sessionId) {
        try {
            if (typeof window !== 'undefined' && window.localStorage) {
                localStorage.setItem('csrf_token', token);
                localStorage.setItem('csrf_session_id', sessionId);

                this.logger.debug('CSRF token stored in localStorage', {
                    sessionId,
                    tokenLength: token.length
                });
            }
        } catch (error) {
            this.logger.error('Error storing CSRF token in localStorage', {
                error: error.message
            });
        }
    }

    /**
     * Get CSRF token from localStorage
     * 从localStorage获取CSRF令牌
     * @returns {Object|null} CSRF token and session ID
     */
    static getTokenFromLocalStorage() {
        try {
            if (typeof window !== 'undefined' && window.localStorage) {
                const token = localStorage.getItem('csrf_token');
                const sessionId = localStorage.getItem('csrf_session_id');

                if (token && sessionId) {
                    this.logger.debug('CSRF token retrieved from localStorage', {
                        sessionId,
                        tokenLength: token.length
                    });

                    return { token, sessionId };
                }
            }

            return null;
        } catch (error) {
            this.logger.error('Error getting CSRF token from localStorage', {
                error: error.message
            });
            return null;
        }
    }

    /**
     * Clear CSRF token from localStorage
     * 从localStorage清除CSRF令牌
     */
    static clearTokenFromLocalStorage() {
        try {
            if (typeof window !== 'undefined' && window.localStorage) {
                localStorage.removeItem('csrf_token');
                localStorage.removeItem('csrf_session_id');

                this.logger.debug('CSRF token cleared from localStorage');
            }
        } catch (error) {
            this.logger.error('Error clearing CSRF token from localStorage', {
                error: error.message
            });
        }
    }

    /**
     * Generate HTML form with CSRF token
     * 生成包含CSRF令牌的HTML表单
     * @param {string} action - Form action URL
     * @param {string} method - HTTP method
     * @param {Object} fields - Form fields
     * @param {string} csrfToken - CSRF token
     * @returns {string} HTML form string
     */
    static generateHTMLForm(action, method = 'POST', fields = {}, csrfToken) {
        let formHTML = `<form action="${action}" method="${method}">`;

        // Add CSRF token as hidden field
        formHTML += `<input type="hidden" name="_csrf" value="${csrfToken}">`;

        // Add other fields
        Object.keys(fields).forEach(key => {
            formHTML += `<input type="hidden" name="${key}" value="${fields[key]}">`;
        });

        formHTML += '</form>';

        this.logger.debug('HTML form generated with CSRF token', {
            action,
            method,
            fieldCount: Object.keys(fields).length + 1
        });

        return formHTML;
    }

    /**
     * Generate meta tag for CSRF token
     * 生成CSRF令牌的meta标签
     * @param {string} csrfToken - CSRF token
     * @returns {string} Meta tag HTML
     */
    static generateMetaTag(csrfToken) {
        const metaTag = `<meta name="csrf-token" content="${csrfToken}">`;

        this.logger.debug('CSRF meta tag generated', {
            tokenLength: csrfToken.length
        });

        return metaTag;
    }
}

module.exports = CSRFUtil;
