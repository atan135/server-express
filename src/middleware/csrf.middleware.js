const csrf = require('csrf');
const { logger } = require('./logger.middleware');

class CSRFMiddleware {
    constructor() {
        this.logger = logger('csrf');
        this.tokens = new csrf();

        // CSRF secret - in production, this should be stored securely
        this.secret = process.env.CSRF_SECRET || 'your-csrf-secret-key-change-in-production';

        // Token storage (in production, use Redis or database)
        this.tokenStore = new Map();

        // Token expiration time (24 hours)
        this.tokenExpiration = 24 * 60 * 60 * 1000; // 24 hours in milliseconds
    }

    /**
     * Generate CSRF token for a session
     * 为会话生成CSRF令牌
     * @param {string} sessionId - Session identifier
     * @returns {string} CSRF token
     */
    generateToken(sessionId) {
        try {
            const token = this.tokens.create(this.secret);

            // Store token with expiration
            this.tokenStore.set(sessionId, {
                token,
                createdAt: Date.now(),
                expiresAt: Date.now() + this.tokenExpiration
            });

            this.logger.debug('CSRF token generated', { sessionId, token: token.substring(0, 8) + '...' });
            return token;
        } catch (error) {
            this.logger.error('Error generating CSRF token', { error: error.message, sessionId });
            throw error;
        }
    }

    /**
     * Verify CSRF token
     * 验证CSRF令牌
     * @param {string} sessionId - Session identifier
     * @param {string} token - CSRF token to verify
     * @returns {boolean} True if token is valid
     */
    verifyToken(sessionId, token) {
        try {
            // Check if token exists in store
            const storedToken = this.tokenStore.get(sessionId);
            if (!storedToken) {
                this.logger.warn('CSRF token not found in store', { sessionId });
                return false;
            }

            // Check if token has expired
            if (Date.now() > storedToken.expiresAt) {
                this.logger.warn('CSRF token expired', { sessionId, expiresAt: storedToken.expiresAt });
                this.tokenStore.delete(sessionId);
                return false;
            }

            // Verify token
            const isValid = this.tokens.verify(this.secret, token);
            if (!isValid) {
                this.logger.warn('CSRF token verification failed', { sessionId, token: token.substring(0, 8) + '...' });
                return false;
            }

            this.logger.debug('CSRF token verified successfully', { sessionId });
            return true;
        } catch (error) {
            this.logger.error('Error verifying CSRF token', { error: error.message, sessionId });
            return false;
        }
    }

    /**
     * Revoke CSRF token
     * 撤销CSRF令牌
     * @param {string} sessionId - Session identifier
     */
    revokeToken(sessionId) {
        try {
            const deleted = this.tokenStore.delete(sessionId);
            this.logger.debug('CSRF token revoked', { sessionId, deleted });
            return deleted;
        } catch (error) {
            this.logger.error('Error revoking CSRF token', { error: error.message, sessionId });
            return false;
        }
    }

    /**
     * Clean up expired tokens
     * 清理过期的令牌
     */
    cleanupExpiredTokens() {
        try {
            const now = Date.now();
            let cleanedCount = 0;

            for (const [sessionId, tokenData] of this.tokenStore.entries()) {
                if (now > tokenData.expiresAt) {
                    this.tokenStore.delete(sessionId);
                    cleanedCount++;
                }
            }

            if (cleanedCount > 0) {
                this.logger.debug('Cleaned up expired CSRF tokens', { cleanedCount });
            }

            return cleanedCount;
        } catch (error) {
            this.logger.error('Error cleaning up expired tokens', { error: error.message });
            return 0;
        }
    }

    /**
     * Get session ID from request
     * 从请求中获取会话ID
     * @param {Object} req - Express request object
     * @returns {string} Session ID
     */
    getSessionId(req) {
        // Try to get session ID from various sources
        return req.sessionID ||
            req.headers['x-session-id'] ||
            req.headers['x-csrf-session'] ||
            req.ip ||
            'anonymous';
    }

    /**
     * CSRF protection middleware
     * CSRF保护中间件
     */
    protect() {
        return (req, res, next) => {
            try {
                // Skip CSRF protection for safe methods
                if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
                    return next();
                }

                // Skip CSRF protection for certain paths
                const skipPaths = ['/api/auth/csrf-token', '/api/health'];
                if (skipPaths.some(path => req.path.startsWith(path))) {
                    return next();
                }

                const sessionId = this.getSessionId(req);
                const token = req.headers['x-csrf-token'] || req.body._csrf || req.query._csrf;

                if (!token) {
                    this.logger.warn('CSRF token missing', {
                        sessionId,
                        method: req.method,
                        path: req.path,
                        ip: req.ip
                    });
                    return res.status(403).json({
                        errcode: 1,
                        error: 'Forbidden',
                        errmsg: 'CSRF token missing'
                    });
                }

                if (!this.verifyToken(sessionId, token)) {
                    this.logger.warn('CSRF token verification failed', {
                        sessionId,
                        method: req.method,
                        path: req.path,
                        ip: req.ip
                    });
                    return res.status(403).json({
                        errcode: 1,
                        error: 'Forbidden',
                        errmsg: 'Invalid CSRF token'
                    });
                }

                this.logger.debug('CSRF token verified', { sessionId, method: req.method, path: req.path });
                next();
            } catch (error) {
                this.logger.error('CSRF middleware error', { error: error.message });
                res.status(500).json({
                    errcode: 1,
                    error: 'Internal Server Error',
                    errmsg: 'CSRF protection error'
                });
            }
        };
    }

    /**
     * Generate and return CSRF token endpoint
     * 生成并返回CSRF令牌的端点
     */
    generateTokenEndpoint() {
        return (req, res) => {
            try {
                const sessionId = this.getSessionId(req);
                const token = this.generateToken(sessionId);

                this.logger.info('CSRF token generated for endpoint', { sessionId });

                res.json({
                    errcode: 0,
                    errmsg: 'CSRF token generated successfully',
                    csrfToken: token,
                    sessionId: sessionId
                });
            } catch (error) {
                this.logger.error('Error generating CSRF token endpoint', { error: error.message });
                res.status(500).json({
                    errcode: 1,
                    error: 'Internal Server Error',
                    errmsg: 'Failed to generate CSRF token'
                });
            }
        };
    }

    /**
     * Get CSRF token statistics
     * 获取CSRF令牌统计信息
     */
    getStats() {
        const now = Date.now();
        let activeTokens = 0;
        let expiredTokens = 0;

        for (const [sessionId, tokenData] of this.tokenStore.entries()) {
            if (now > tokenData.expiresAt) {
                expiredTokens++;
            } else {
                activeTokens++;
            }
        }

        return {
            activeTokens,
            expiredTokens,
            totalTokens: this.tokenStore.size,
            tokenExpiration: this.tokenExpiration
        };
    }
}

// Create singleton instance
const csrfMiddleware = new CSRFMiddleware();

// Clean up expired tokens every hour
setInterval(() => {
    csrfMiddleware.cleanupExpiredTokens();
}, 60 * 60 * 1000); // 1 hour

module.exports = csrfMiddleware;
