const csrfMiddleware = require('../src/middleware/csrf.middleware');

describe('CSRF Middleware', () => {
    let mockReq, mockRes, mockNext;

    beforeEach(() => {
        mockReq = {
            method: 'POST',
            path: '/api/auth/login',
            headers: {},
            body: {},
            query: {},
            ip: '127.0.0.1',
            sessionID: 'test-session-123'
        };

        mockRes = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn().mockReturnThis()
        };

        mockNext = jest.fn();
    });

    describe('generateToken', () => {
        test('should generate a valid CSRF token', () => {
            const sessionId = 'test-session-123';
            const token = csrfMiddleware.generateToken(sessionId);

            expect(token).toBeDefined();
            expect(typeof token).toBe('string');
            expect(token.length).toBeGreaterThan(0);
        });

        test('should store token in token store', () => {
            const sessionId = 'test-session-123';
            const token = csrfMiddleware.generateToken(sessionId);

            const storedToken = csrfMiddleware.tokenStore.get(sessionId);
            expect(storedToken).toBeDefined();
            expect(storedToken.token).toBe(token);
            expect(storedToken.createdAt).toBeDefined();
            expect(storedToken.expiresAt).toBeDefined();
        });
    });

    describe('verifyToken', () => {
        test('should verify valid token', () => {
            const sessionId = 'test-session-123';
            const token = csrfMiddleware.generateToken(sessionId);

            const isValid = csrfMiddleware.verifyToken(sessionId, token);
            expect(isValid).toBe(true);
        });

        test('should reject invalid token', () => {
            const sessionId = 'test-session-123';
            const token = csrfMiddleware.generateToken(sessionId);
            const invalidToken = 'invalid-token';

            const isValid = csrfMiddleware.verifyToken(sessionId, invalidToken);
            expect(isValid).toBe(false);
        });

        test('should reject token for non-existent session', () => {
            const sessionId = 'non-existent-session';
            const token = 'some-token';

            const isValid = csrfMiddleware.verifyToken(sessionId, token);
            expect(isValid).toBe(false);
        });
    });

    describe('revokeToken', () => {
        test('should revoke existing token', () => {
            const sessionId = 'test-session-123';
            csrfMiddleware.generateToken(sessionId);

            const revoked = csrfMiddleware.revokeToken(sessionId);
            expect(revoked).toBe(true);

            const storedToken = csrfMiddleware.tokenStore.get(sessionId);
            expect(storedToken).toBeUndefined();
        });

        test('should return false for non-existent session', () => {
            const sessionId = 'non-existent-session';

            const revoked = csrfMiddleware.revokeToken(sessionId);
            expect(revoked).toBe(false);
        });
    });

    describe('getSessionId', () => {
        test('should get session ID from sessionID', () => {
            mockReq.sessionID = 'session-123';
            const sessionId = csrfMiddleware.getSessionId(mockReq);
            expect(sessionId).toBe('session-123');
        });

        test('should get session ID from x-session-id header', () => {
            mockReq.sessionID = undefined;
            mockReq.headers['x-session-id'] = 'header-session-123';
            const sessionId = csrfMiddleware.getSessionId(mockReq);
            expect(sessionId).toBe('header-session-123');
        });

        test('should fallback to IP address', () => {
            mockReq.sessionID = undefined;
            mockReq.headers = {};
            const sessionId = csrfMiddleware.getSessionId(mockReq);
            expect(sessionId).toBe('127.0.0.1');
        });
    });

    describe('protect middleware', () => {
        test('should allow GET requests without CSRF token', () => {
            mockReq.method = 'GET';

            csrfMiddleware.protect()(mockReq, mockRes, mockNext);

            expect(mockNext).toHaveBeenCalled();
            expect(mockRes.status).not.toHaveBeenCalled();
        });

        test('should allow HEAD requests without CSRF token', () => {
            mockReq.method = 'HEAD';

            csrfMiddleware.protect()(mockReq, mockRes, mockNext);

            expect(mockNext).toHaveBeenCalled();
            expect(mockRes.status).not.toHaveBeenCalled();
        });

        test('should allow OPTIONS requests without CSRF token', () => {
            mockReq.method = 'OPTIONS';

            csrfMiddleware.protect()(mockReq, mockRes, mockNext);

            expect(mockNext).toHaveBeenCalled();
            expect(mockRes.status).not.toHaveBeenCalled();
        });

        test('should reject POST requests without CSRF token', () => {
            mockReq.method = 'POST';

            csrfMiddleware.protect()(mockReq, mockRes, mockNext);

            expect(mockNext).not.toHaveBeenCalled();
            expect(mockRes.status).toHaveBeenCalledWith(403);
            expect(mockRes.json).toHaveBeenCalledWith({
                errcode: 1,
                error: 'Forbidden',
                errmsg: 'CSRF token missing'
            });
        });

        test('should reject POST requests with invalid CSRF token', () => {
            mockReq.method = 'POST';
            mockReq.headers['x-csrf-token'] = 'invalid-token';

            csrfMiddleware.protect()(mockReq, mockRes, mockNext);

            expect(mockNext).not.toHaveBeenCalled();
            expect(mockRes.status).toHaveBeenCalledWith(403);
            expect(mockRes.json).toHaveBeenCalledWith({
                errcode: 1,
                error: 'Forbidden',
                errmsg: 'Invalid CSRF token'
            });
        });

        test('should allow POST requests with valid CSRF token in header', () => {
            const sessionId = 'test-session-123';
            const token = csrfMiddleware.generateToken(sessionId);

            mockReq.method = 'POST';
            mockReq.headers['x-csrf-token'] = token;
            mockReq.sessionID = sessionId;

            csrfMiddleware.protect()(mockReq, mockRes, mockNext);

            expect(mockNext).toHaveBeenCalled();
            expect(mockRes.status).not.toHaveBeenCalled();
        });

        test('should allow POST requests with valid CSRF token in body', () => {
            const sessionId = 'test-session-123';
            const token = csrfMiddleware.generateToken(sessionId);

            mockReq.method = 'POST';
            mockReq.body._csrf = token;
            mockReq.sessionID = sessionId;

            csrfMiddleware.protect()(mockReq, mockRes, mockNext);

            expect(mockNext).toHaveBeenCalled();
            expect(mockRes.status).not.toHaveBeenCalled();
        });

        test('should allow POST requests with valid CSRF token in query', () => {
            const sessionId = 'test-session-123';
            const token = csrfMiddleware.generateToken(sessionId);

            mockReq.method = 'POST';
            mockReq.query._csrf = token;
            mockReq.sessionID = sessionId;

            csrfMiddleware.protect()(mockReq, mockRes, mockNext);

            expect(mockNext).toHaveBeenCalled();
            expect(mockRes.status).not.toHaveBeenCalled();
        });

        test('should skip CSRF protection for csrf-token endpoint', () => {
            mockReq.method = 'POST';
            mockReq.path = '/api/auth/csrf-token';

            csrfMiddleware.protect()(mockReq, mockRes, mockNext);

            expect(mockNext).toHaveBeenCalled();
            expect(mockRes.status).not.toHaveBeenCalled();
        });
    });

    describe('generateTokenEndpoint', () => {
        test('should generate and return CSRF token', () => {
            const endpoint = csrfMiddleware.generateTokenEndpoint();

            endpoint(mockReq, mockRes);

            expect(mockRes.json).toHaveBeenCalledWith({
                errcode: 0,
                errmsg: 'CSRF token generated successfully',
                csrfToken: expect.any(String),
                sessionId: expect.any(String)
            });
        });
    });

    describe('getStats', () => {
        test('should return token statistics', () => {
            // Generate some tokens
            csrfMiddleware.generateToken('session-1');
            csrfMiddleware.generateToken('session-2');

            const stats = csrfMiddleware.getStats();

            expect(stats).toHaveProperty('activeTokens');
            expect(stats).toHaveProperty('expiredTokens');
            expect(stats).toHaveProperty('totalTokens');
            expect(stats).toHaveProperty('tokenExpiration');
            expect(stats.activeTokens).toBeGreaterThanOrEqual(2);
        });
    });

    describe('cleanupExpiredTokens', () => {
        test('should clean up expired tokens', () => {
            // Generate a token and manually set it as expired
            const sessionId = 'expired-session';
            csrfMiddleware.generateToken(sessionId);

            // Manually set expiration to past
            const tokenData = csrfMiddleware.tokenStore.get(sessionId);
            tokenData.expiresAt = Date.now() - 1000; // 1 second ago
            csrfMiddleware.tokenStore.set(sessionId, tokenData);

            const cleanedCount = csrfMiddleware.cleanupExpiredTokens();

            expect(cleanedCount).toBe(1);
            expect(csrfMiddleware.tokenStore.has(sessionId)).toBe(false);
        });
    });
});
