const { logger } = require("../middleware/logger.middleware");

class NetworkUtil {
    static logger = logger("network");

    /**
     * Extract client IP address from request
     * Handles various proxy configurations and load balancers
     * 从请求中提取客户端IP地址，处理各种代理配置和负载均衡器
     * @param {Object} req - Express request object
     * @returns {string} Client IP address
     */
    static getClientIP(req) {
        try {
            // Check for forwarded IP (from proxies, load balancers, CDNs)
            const forwarded = req.headers['x-forwarded-for'];
            if (forwarded) {
                // X-Forwarded-For can contain multiple IPs, take the first one
                const ip = forwarded.split(',')[0].trim();
                this.logger.debug('IP extracted from X-Forwarded-For', { ip, forwarded });
                return ip;
            }

            // Check for real IP header
            if (req.headers['x-real-ip']) {
                const ip = req.headers['x-real-ip'];
                this.logger.debug('IP extracted from X-Real-IP', { ip });
                return ip;
            }

            // Check for CF-Connecting-IP (Cloudflare)
            if (req.headers['cf-connecting-ip']) {
                const ip = req.headers['cf-connecting-ip'];
                this.logger.debug('IP extracted from CF-Connecting-IP', { ip });
                return ip;
            }

            // Check for X-Client-IP
            if (req.headers['x-client-ip']) {
                const ip = req.headers['x-client-ip'];
                this.logger.debug('IP extracted from X-Client-IP', { ip });
                return ip;
            }

            // Check for X-Forwarded (alternative header)
            if (req.headers['x-forwarded']) {
                const ip = req.headers['x-forwarded'];
                this.logger.debug('IP extracted from X-Forwarded', { ip });
                return ip;
            }

            // Check for Forwarded header (RFC 7239)
            if (req.headers['forwarded']) {
                const forwarded = req.headers['forwarded'];
                const match = forwarded.match(/for=([^;,\s]+)/i);
                if (match) {
                    const ip = match[1].replace(/"/g, '');
                    this.logger.debug('IP extracted from Forwarded header', { ip, forwarded });
                    return ip;
                }
            }

            // Fallback to connection properties
            const ip = req.connection?.remoteAddress ||
                req.socket?.remoteAddress ||
                req.ip ||
                'unknown';

            this.logger.debug('IP extracted from connection properties', { ip });
            return ip;
        } catch (error) {
            this.logger.error('Error extracting client IP', { error: error.message });
            return 'unknown';
        }
    }

    /**
     * Get detailed client information from request
     * 从请求中获取详细的客户端信息
     * @param {Object} req - Express request object
     * @returns {Object} Client information object
     */
    static getClientInfo(req) {
        try {
            const ip = this.getClientIP(req);
            const userAgent = req.get('User-Agent') || 'unknown';

            // Extract basic device info from User-Agent
            const deviceInfo = this.parseUserAgent(userAgent);

            // Get additional headers
            const location = req.get('X-Location') || null;
            const device = req.get('X-Device-Info') || null;
            const network = req.get('X-Network-Info') || null;

            const clientInfo = {
                ipAddress: ip,
                userAgent: userAgent,
                deviceInfo: deviceInfo,
                location: location,
                device: device,
                network: network,
                headers: {
                    'x-forwarded-for': req.headers['x-forwarded-for'],
                    'x-real-ip': req.headers['x-real-ip'],
                    'cf-connecting-ip': req.headers['cf-connecting-ip'],
                    'x-client-ip': req.headers['x-client-ip']
                }
            };

            this.logger.debug('Client info extracted', {
                ipAddress: ip,
                userAgent: userAgent.substring(0, 100) + '...'
            });

            return clientInfo;
        } catch (error) {
            this.logger.error('Error extracting client info', { error: error.message });
            return {
                ipAddress: 'unknown',
                userAgent: 'unknown',
                deviceInfo: {},
                location: null,
                device: null,
                network: null,
                headers: {}
            };
        }
    }

    /**
     * Parse User-Agent string to extract device information
     * 解析User-Agent字符串以提取设备信息
     * @param {string} userAgent - User-Agent string
     * @returns {Object} Parsed device information
     */
    static parseUserAgent(userAgent) {
        try {
            if (!userAgent || userAgent === 'unknown') {
                return {
                    browser: 'unknown',
                    os: 'unknown',
                    device: 'unknown',
                    isMobile: false,
                    isBot: false
                };
            }

            const ua = userAgent.toLowerCase();

            // Detect browser
            let browser = 'unknown';
            if (ua.includes('chrome')) browser = 'Chrome';
            else if (ua.includes('firefox')) browser = 'Firefox';
            else if (ua.includes('safari')) browser = 'Safari';
            else if (ua.includes('edge')) browser = 'Edge';
            else if (ua.includes('opera')) browser = 'Opera';
            else if (ua.includes('msie') || ua.includes('trident')) browser = 'Internet Explorer';

            // Detect OS
            let os = 'unknown';
            if (ua.includes('windows')) os = 'Windows';
            else if (ua.includes('mac os')) os = 'macOS';
            else if (ua.includes('linux')) os = 'Linux';
            else if (ua.includes('android')) os = 'Android';
            else if (ua.includes('ios')) os = 'iOS';

            // Detect device type
            let device = 'desktop';
            const isMobile = ua.includes('mobile') || ua.includes('android') || ua.includes('iphone');
            const isTablet = ua.includes('tablet') || ua.includes('ipad');

            if (isMobile) device = 'mobile';
            else if (isTablet) device = 'tablet';

            // Detect if it's a bot
            const isBot = ua.includes('bot') || ua.includes('crawler') || ua.includes('spider') ||
                ua.includes('scraper') || ua.includes('monitor');

            return {
                browser,
                os,
                device,
                isMobile,
                isTablet,
                isBot,
                raw: userAgent
            };
        } catch (error) {
            this.logger.error('Error parsing user agent', { error: error.message, userAgent });
            return {
                browser: 'unknown',
                os: 'unknown',
                device: 'unknown',
                isMobile: false,
                isTablet: false,
                isBot: false,
                raw: userAgent
            };
        }
    }

    /**
     * Validate IP address format
     * 验证IP地址格式
     * @param {string} ip - IP address to validate
     * @returns {boolean} True if valid IP address
     */
    static isValidIP(ip) {
        try {
            if (!ip || ip === 'unknown') return false;

            // IPv4 regex
            const ipv4Regex = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;

            // IPv6 regex (simplified)
            const ipv6Regex = /^(?:[0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}$|^::1$|^::$/;

            return ipv4Regex.test(ip) || ipv6Regex.test(ip);
        } catch (error) {
            this.logger.error('Error validating IP address', { error: error.message, ip });
            return false;
        }
    }

    /**
     * Get IP address type (IPv4, IPv6, or unknown)
     * 获取IP地址类型（IPv4、IPv6或未知）
     * @param {string} ip - IP address
     * @returns {string} IP address type
     */
    static getIPType(ip) {
        try {
            if (!this.isValidIP(ip)) return 'unknown';

            if (ip.includes(':')) return 'IPv6';
            if (ip.includes('.')) return 'IPv4';

            return 'unknown';
        } catch (error) {
            this.logger.error('Error determining IP type', { error: error.message, ip });
            return 'unknown';
        }
    }

    /**
     * Check if IP is private/local
     * 检查IP是否为私有/本地地址
     * @param {string} ip - IP address
     * @returns {boolean} True if private IP
     */
    static isPrivateIP(ip) {
        try {
            if (!this.isValidIP(ip)) return false;

            // IPv4 private ranges
            const privateRanges = [
                /^10\./,                    // 10.0.0.0/8
                /^172\.(1[6-9]|2[0-9]|3[0-1])\./, // 172.16.0.0/12
                /^192\.168\./,              // 192.168.0.0/16
                /^127\./,                   // 127.0.0.0/8 (localhost)
                /^169\.254\./,              // 169.254.0.0/16 (link-local)
                /^0\./,                     // 0.0.0.0/8
                /^::1$/,                    // IPv6 localhost
                /^fe80:/,                   // IPv6 link-local
                /^fc00:/,                   // IPv6 unique local
                /^fd00:/                    // IPv6 unique local
            ];

            return privateRanges.some(range => range.test(ip));
        } catch (error) {
            this.logger.error('Error checking private IP', { error: error.message, ip });
            return false;
        }
    }

    /**
     * Sanitize IP address for logging (remove sensitive parts)
     * 清理IP地址用于日志记录（移除敏感部分）
     * @param {string} ip - IP address
     * @returns {string} Sanitized IP address
     */
    static sanitizeIP(ip) {
        try {
            if (!ip || ip === 'unknown') return 'unknown';

            // For IPv4, mask the last octet
            if (ip.includes('.') && !ip.includes(':')) {
                const parts = ip.split('.');
                if (parts.length === 4) {
                    return `${parts[0]}.${parts[1]}.${parts[2]}.xxx`;
                }
            }

            // For IPv6, mask the last segment
            if (ip.includes(':')) {
                const parts = ip.split(':');
                if (parts.length > 1) {
                    parts[parts.length - 1] = 'xxxx';
                    return parts.join(':');
                }
            }

            return ip;
        } catch (error) {
            this.logger.error('Error sanitizing IP', { error: error.message, ip });
            return 'unknown';
        }
    }
}

module.exports = NetworkUtil;
