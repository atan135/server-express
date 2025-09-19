const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');
const { logger } = require('../middleware/logger.middleware');
const UserModel = require('../models/user.model');
const NetworkUtil = require('../utils/network.util');

class WebSocketService {
    constructor() {
        this.io = null;
        this.connectedUsers = new Map(); // userId -> socketId
        this.socketUsers = new Map();    // socketId -> userInfo
        this.rooms = new Map();          // roomId -> Set of socketIds
        this.logger = logger('websocket');
    }

    /**
     * Initialize WebSocket server
     * 初始化WebSocket服务器
     * @param {Object} server - HTTP server instance
     * @param {Object} cors - CORS configuration
     */
    initialize(server, cors = {}) {
        this.io = new Server(server, {
            cors: {
                origin: process.env.CORS_ORIGIN || "*",
                methods: ["GET", "POST"],
                credentials: true,
                ...cors
            },
            transports: ['websocket', 'polling'],
            allowEIO3: true
        });

        this.setupMiddleware();
        this.setupEventHandlers();

        this.logger.info('WebSocket service initialized');
        return this.io;
    }

    /**
     * Setup WebSocket middleware
     * 设置WebSocket中间件
     */
    setupMiddleware() {
        // Authentication middleware
        this.io.use(async (socket, next) => {
            try {
                const token = socket.handshake.auth.token || socket.handshake.query.token;

                if (!token) {
                    this.logger.warn('WebSocket connection without token', {
                        socketId: socket.id,
                        ip: socket.handshake.address
                    });
                    return next(new Error('Authentication token required'));
                }

                // Verify JWT token
                const decoded = jwt.verify(token, process.env.JWT_SECRET);
                const user = await UserModel.findById(decoded.userId);

                if (!user) {
                    this.logger.warn('WebSocket connection with invalid user', {
                        socketId: socket.id,
                        userId: decoded.userId
                    });
                    return next(new Error('User not found'));
                }

                // Attach user info to socket
                socket.userId = decoded.userId;
                socket.userInfo = user;

                next();
            } catch (error) {
                this.logger.error('WebSocket authentication error', {
                    error: error.message,
                    socketId: socket.id
                });
                next(new Error('Authentication failed'));
            }
        });

        // Rate limiting middleware
        this.io.use((socket, next) => {
            const clientIP = NetworkUtil.getClientIP(socket.handshake);
            const rateLimitKey = `ws_${clientIP}`;

            // Simple rate limiting (in production, use Redis)
            if (!this.rateLimitMap) {
                this.rateLimitMap = new Map();
            }

            const now = Date.now();
            const windowMs = 60 * 1000; // 1 minute
            const maxConnections = 10;

            if (!this.rateLimitMap.has(rateLimitKey)) {
                this.rateLimitMap.set(rateLimitKey, { count: 1, resetTime: now + windowMs });
            } else {
                const rateLimit = this.rateLimitMap.get(rateLimitKey);
                if (now > rateLimit.resetTime) {
                    rateLimit.count = 1;
                    rateLimit.resetTime = now + windowMs;
                } else if (rateLimit.count >= maxConnections) {
                    this.logger.warn('WebSocket rate limit exceeded', {
                        clientIP,
                        socketId: socket.id
                    });
                    return next(new Error('Rate limit exceeded'));
                } else {
                    rateLimit.count++;
                }
            }

            next();
        });
    }

    /**
     * Setup WebSocket event handlers
     * 设置WebSocket事件处理器
     */
    setupEventHandlers() {
        this.io.on('connection', (socket) => {
            this.handleConnection(socket);
        });
    }

    /**
     * Handle new WebSocket connection
     * 处理新的WebSocket连接
     * @param {Object} socket - Socket instance
     */
    async handleConnection(socket) {
        const userId = socket.userId;
        const userInfo = socket.userInfo;
        const clientIP = NetworkUtil.getClientIP(socket.handshake);

        // Store user connection
        this.connectedUsers.set(userId, socket.id);
        this.socketUsers.set(socket.id, {
            userId,
            userInfo,
            connectedAt: new Date(),
            ip: clientIP
        });

        this.logger.info('User connected via WebSocket', {
            userId,
            username: userInfo.username,
            socketId: socket.id,
            ip: clientIP
        });

        // Join user to their personal room
        socket.join(`user_${userId}`);

        // Send connection confirmation
        socket.emit('connected', {
            message: 'Successfully connected to WebSocket',
            userId,
            username: userInfo.username,
            socketId: socket.id
        });

        // Notify other users about online status
        socket.broadcast.emit('user_online', {
            userId,
            username: userInfo.username
        });

        // Setup event listeners
        this.setupSocketEventListeners(socket);

        // Handle disconnection
        socket.on('disconnect', (reason) => {
            this.handleDisconnection(socket, reason);
        });
    }

    /**
     * Setup socket event listeners
     * 设置socket事件监听器
     * @param {Object} socket - Socket instance
     */
    setupSocketEventListeners(socket) {
        const userId = socket.userId;
        const userInfo = socket.userInfo;

        // Join room
        socket.on('join_room', (data) => {
            this.handleJoinRoom(socket, data);
        });

        // Leave room
        socket.on('leave_room', (data) => {
            this.handleLeaveRoom(socket, data);
        });

        // Send message to room
        socket.on('send_message', (data) => {
            this.handleSendMessage(socket, data);
        });

        // Send private message
        socket.on('send_private_message', (data) => {
            this.handleSendPrivateMessage(socket, data);
        });

        // Typing indicators
        socket.on('typing_start', (data) => {
            this.handleTypingStart(socket, data);
        });

        socket.on('typing_stop', (data) => {
            this.handleTypingStop(socket, data);
        });

        // User status updates
        socket.on('update_status', (data) => {
            this.handleUpdateStatus(socket, data);
        });

        // Ping/Pong for connection health
        socket.on('ping', () => {
            socket.emit('pong', { timestamp: Date.now() });
        });

        // Error handling
        socket.on('error', (error) => {
            this.logger.error('Socket error', {
                socketId: socket.id,
                userId,
                error: error.message
            });
        });
    }

    /**
     * Handle user joining a room
     * 处理用户加入房间
     * @param {Object} socket - Socket instance
     * @param {Object} data - Room data
     */
    handleJoinRoom(socket, data) {
        const { roomId } = data;
        const userId = socket.userId;

        if (!roomId) {
            socket.emit('error', { message: 'Room ID is required' });
            return;
        }

        socket.join(roomId);

        // Track room membership
        if (!this.rooms.has(roomId)) {
            this.rooms.set(roomId, new Set());
        }
        this.rooms.get(roomId).add(socket.id);

        this.logger.info('User joined room', {
            userId,
            roomId,
            socketId: socket.id
        });

        socket.emit('joined_room', { roomId });
        socket.to(roomId).emit('user_joined_room', {
            userId,
            username: socket.userInfo.username,
            roomId
        });
    }

    /**
     * Handle user leaving a room
     * 处理用户离开房间
     * @param {Object} socket - Socket instance
     * @param {Object} data - Room data
     */
    handleLeaveRoom(socket, data) {
        const { roomId } = data;
        const userId = socket.userId;

        if (!roomId) {
            socket.emit('error', { message: 'Room ID is required' });
            return;
        }

        socket.leave(roomId);

        // Update room membership
        if (this.rooms.has(roomId)) {
            this.rooms.get(roomId).delete(socket.id);
            if (this.rooms.get(roomId).size === 0) {
                this.rooms.delete(roomId);
            }
        }

        this.logger.info('User left room', {
            userId,
            roomId,
            socketId: socket.id
        });

        socket.emit('left_room', { roomId });
        socket.to(roomId).emit('user_left_room', {
            userId,
            username: socket.userInfo.username,
            roomId
        });
    }

    /**
     * Handle sending message to room
     * 处理向房间发送消息
     * @param {Object} socket - Socket instance
     * @param {Object} data - Message data
     */
    handleSendMessage(socket, data) {
        const { roomId, message, type = 'text' } = data;
        const userId = socket.userId;
        const userInfo = socket.userInfo;

        if (!roomId || !message) {
            socket.emit('error', { message: 'Room ID and message are required' });
            return;
        }

        const messageData = {
            id: this.generateMessageId(),
            roomId,
            userId,
            username: userInfo.username,
            message,
            type,
            timestamp: new Date(),
            socketId: socket.id
        };

        this.logger.info('Message sent to room', {
            userId,
            roomId,
            messageId: messageData.id,
            messageLength: message.length
        });

        // Send to all users in the room
        this.io.to(roomId).emit('room_message', messageData);

        // Send confirmation to sender
        socket.emit('message_sent', { messageId: messageData.id });
    }

    /**
     * Handle sending private message
     * 处理发送私聊消息
     * @param {Object} socket - Socket instance
     * @param {Object} data - Message data
     */
    handleSendPrivateMessage(socket, data) {
        const { targetUserId, message, type = 'text' } = data;
        const userId = socket.userId;
        const userInfo = socket.userInfo;

        if (!targetUserId || !message) {
            socket.emit('error', { message: 'Target user ID and message are required' });
            return;
        }

        // Check if target user is online
        const targetSocketId = this.connectedUsers.get(targetUserId);
        if (!targetSocketId) {
            socket.emit('error', { message: 'Target user is offline' });
            return;
        }

        const messageData = {
            id: this.generateMessageId(),
            fromUserId: userId,
            fromUsername: userInfo.username,
            toUserId: targetUserId,
            message,
            type,
            timestamp: new Date(),
            socketId: socket.id
        };

        this.logger.info('Private message sent', {
            fromUserId: userId,
            toUserId: targetUserId,
            messageId: messageData.id
        });

        // Send to target user
        this.io.to(targetSocketId).emit('private_message', messageData);

        // Send confirmation to sender
        socket.emit('private_message_sent', { messageId: messageData.id });
    }

    /**
     * Handle typing start
     * 处理开始输入
     * @param {Object} socket - Socket instance
     * @param {Object} data - Typing data
     */
    handleTypingStart(socket, data) {
        const { roomId, targetUserId } = data;
        const userId = socket.userId;
        const userInfo = socket.userInfo;

        const typingData = {
            userId,
            username: userInfo.username,
            roomId,
            targetUserId,
            timestamp: new Date()
        };

        if (roomId) {
            socket.to(roomId).emit('user_typing_start', typingData);
        } else if (targetUserId) {
            const targetSocketId = this.connectedUsers.get(targetUserId);
            if (targetSocketId) {
                this.io.to(targetSocketId).emit('user_typing_start', typingData);
            }
        }
    }

    /**
     * Handle typing stop
     * 处理停止输入
     * @param {Object} socket - Socket instance
     * @param {Object} data - Typing data
     */
    handleTypingStop(socket, data) {
        const { roomId, targetUserId } = data;
        const userId = socket.userId;
        const userInfo = socket.userInfo;

        const typingData = {
            userId,
            username: userInfo.username,
            roomId,
            targetUserId,
            timestamp: new Date()
        };

        if (roomId) {
            socket.to(roomId).emit('user_typing_stop', typingData);
        } else if (targetUserId) {
            const targetSocketId = this.connectedUsers.get(targetUserId);
            if (targetSocketId) {
                this.io.to(targetSocketId).emit('user_typing_stop', typingData);
            }
        }
    }

    /**
     * Handle status update
     * 处理状态更新
     * @param {Object} socket - Socket instance
     * @param {Object} data - Status data
     */
    handleUpdateStatus(socket, data) {
        const { status, customStatus } = data;
        const userId = socket.userId;
        const userInfo = socket.userInfo;

        const statusData = {
            userId,
            username: userInfo.username,
            status,
            customStatus,
            timestamp: new Date()
        };

        this.logger.info('User status updated', {
            userId,
            status,
            customStatus
        });

        // Broadcast to all connected users
        this.io.emit('user_status_updated', statusData);
    }

    /**
     * Handle user disconnection
     * 处理用户断开连接
     * @param {Object} socket - Socket instance
     * @param {string} reason - Disconnection reason
     */
    handleDisconnection(socket, reason) {
        const userId = socket.userId;
        const userInfo = socket.userInfo;

        // Remove from connected users
        this.connectedUsers.delete(userId);
        this.socketUsers.delete(socket.id);

        // Remove from all rooms
        for (const [roomId, socketIds] of this.rooms.entries()) {
            socketIds.delete(socket.id);
            if (socketIds.size === 0) {
                this.rooms.delete(roomId);
            }
        }

        this.logger.info('User disconnected from WebSocket', {
            userId,
            username: userInfo?.username,
            socketId: socket.id,
            reason
        });

        // Notify other users about offline status
        socket.broadcast.emit('user_offline', {
            userId,
            username: userInfo?.username
        });
    }

    /**
     * Send message to specific user
     * 向特定用户发送消息
     * @param {string} userId - Target user ID
     * @param {string} event - Event name
     * @param {Object} data - Message data
     */
    sendToUser(userId, event, data) {
        const socketId = this.connectedUsers.get(userId);
        if (socketId) {
            this.io.to(socketId).emit(event, data);
            return true;
        }
        return false;
    }

    /**
     * Send message to room
     * 向房间发送消息
     * @param {string} roomId - Room ID
     * @param {string} event - Event name
     * @param {Object} data - Message data
     */
    sendToRoom(roomId, event, data) {
        this.io.to(roomId).emit(event, data);
    }

    /**
     * Broadcast message to all users
     * 向所有用户广播消息
     * @param {string} event - Event name
     * @param {Object} data - Message data
     */
    broadcast(event, data) {
        this.io.emit(event, data);
    }

    /**
     * Get connected users count
     * 获取连接用户数量
     * @returns {number} Connected users count
     */
    getConnectedUsersCount() {
        return this.connectedUsers.size;
    }

    /**
     * Get online users list
     * 获取在线用户列表
     * @returns {Array} Online users list
     */
    getOnlineUsers() {
        const onlineUsers = [];
        for (const [socketId, userData] of this.socketUsers.entries()) {
            onlineUsers.push({
                socketId,
                userId: userData.userId,
                username: userData.userInfo.username,
                connectedAt: userData.connectedAt,
                ip: userData.ip
            });
        }
        return onlineUsers;
    }

    /**
     * Get room members
     * 获取房间成员
     * @param {string} roomId - Room ID
     * @returns {Array} Room members
     */
    getRoomMembers(roomId) {
        const socketIds = this.rooms.get(roomId) || new Set();
        const members = [];

        for (const socketId of socketIds) {
            const userData = this.socketUsers.get(socketId);
            if (userData) {
                members.push({
                    socketId,
                    userId: userData.userId,
                    username: userData.userInfo.username
                });
            }
        }

        return members;
    }

    /**
     * Generate unique message ID
     * 生成唯一消息ID
     * @returns {string} Message ID
     */
    generateMessageId() {
        return `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    /**
     * Get WebSocket statistics
     * 获取WebSocket统计信息
     * @returns {Object} Statistics
     */
    getStats() {
        return {
            connectedUsers: this.connectedUsers.size,
            totalSockets: this.socketUsers.size,
            activeRooms: this.rooms.size,
            uptime: process.uptime(),
            memoryUsage: process.memoryUsage()
        };
    }
}

module.exports = new WebSocketService();
