const { logger } = require("../middleware/logger.middleware");

class WebSocketUtil {
    static logger = logger("websocket-util");

    /**
     * Create WebSocket client connection
     * 创建WebSocket客户端连接
     * @param {string} serverUrl - Server URL
     * @param {string} token - JWT token for authentication
     * @param {Object} options - Connection options
     * @returns {Object} Socket.IO client instance
     */
    static createConnection(serverUrl, token, options = {}) {
        try {
            const io = require('socket.io-client');

            const defaultOptions = {
                auth: {
                    token: token
                },
                transports: ['websocket', 'polling'],
                timeout: 20000,
                forceNew: true,
                ...options
            };

            const socket = io(serverUrl, defaultOptions);

            this.logger.debug('WebSocket client created', {
                serverUrl,
                hasToken: !!token
            });

            return socket;
        } catch (error) {
            this.logger.error('Error creating WebSocket connection', {
                error: error.message,
                serverUrl
            });
            throw error;
        }
    }

    /**
     * Setup common event listeners
     * 设置通用事件监听器
     * @param {Object} socket - Socket instance
     * @param {Object} callbacks - Event callbacks
     */
    static setupEventListeners(socket, callbacks = {}) {
        const {
            onConnect = () => { },
            onDisconnect = () => { },
            onError = () => { },
            onMessage = () => { },
            onPrivateMessage = () => { },
            onUserOnline = () => { },
            onUserOffline = () => { },
            onTypingStart = () => { },
            onTypingStop = () => { },
            onStatusUpdate = () => { }
        } = callbacks;

        // Connection events
        socket.on('connect', () => {
            this.logger.debug('WebSocket connected', { socketId: socket.id });
            onConnect();
        });

        socket.on('disconnect', (reason) => {
            this.logger.debug('WebSocket disconnected', {
                socketId: socket.id,
                reason
            });
            onDisconnect(reason);
        });

        socket.on('connect_error', (error) => {
            this.logger.error('WebSocket connection error', {
                error: error.message,
                socketId: socket.id
            });
            onError(error);
        });

        // Authentication events
        socket.on('connected', (data) => {
            this.logger.debug('WebSocket authentication successful', {
                userId: data.userId,
                username: data.username
            });
            onConnect(data);
        });

        // Message events
        socket.on('room_message', (data) => {
            this.logger.debug('Room message received', {
                roomId: data.roomId,
                fromUserId: data.userId,
                messageLength: data.message.length
            });
            onMessage(data);
        });

        socket.on('private_message', (data) => {
            this.logger.debug('Private message received', {
                fromUserId: data.fromUserId,
                toUserId: data.toUserId,
                messageLength: data.message.length
            });
            onPrivateMessage(data);
        });

        // User status events
        socket.on('user_online', (data) => {
            this.logger.debug('User came online', {
                userId: data.userId,
                username: data.username
            });
            onUserOnline(data);
        });

        socket.on('user_offline', (data) => {
            this.logger.debug('User went offline', {
                userId: data.userId,
                username: data.username
            });
            onUserOffline(data);
        });

        socket.on('user_status_updated', (data) => {
            this.logger.debug('User status updated', {
                userId: data.userId,
                status: data.status
            });
            onStatusUpdate(data);
        });

        // Typing events
        socket.on('user_typing_start', (data) => {
            this.logger.debug('User started typing', {
                userId: data.userId,
                roomId: data.roomId
            });
            onTypingStart(data);
        });

        socket.on('user_typing_stop', (data) => {
            this.logger.debug('User stopped typing', {
                userId: data.userId,
                roomId: data.roomId
            });
            onTypingStop(data);
        });

        // Server events
        socket.on('server_message', (data) => {
            this.logger.debug('Server message received', {
                fromUserId: data.fromUserId,
                messageLength: data.message.length
            });
            onMessage(data);
        });

        socket.on('server_room_message', (data) => {
            this.logger.debug('Server room message received', {
                roomId: data.roomId,
                fromUserId: data.fromUserId,
                messageLength: data.message.length
            });
            onMessage(data);
        });

        socket.on('server_broadcast', (data) => {
            this.logger.debug('Server broadcast received', {
                fromUserId: data.fromUserId,
                messageLength: data.message.length
            });
            onMessage(data);
        });

        // Error events
        socket.on('error', (error) => {
            this.logger.error('WebSocket error', {
                error: error.message,
                socketId: socket.id
            });
            onError(error);
        });
    }

    /**
     * Join a room
     * 加入房间
     * @param {Object} socket - Socket instance
     * @param {string} roomId - Room ID
     * @returns {Promise} Promise that resolves when joined
     */
    static joinRoom(socket, roomId) {
        return new Promise((resolve, reject) => {
            if (!socket || !socket.connected) {
                reject(new Error('Socket not connected'));
                return;
            }

            socket.emit('join_room', { roomId });

            socket.once('joined_room', (data) => {
                this.logger.debug('Successfully joined room', {
                    roomId: data.roomId,
                    socketId: socket.id
                });
                resolve(data);
            });

            socket.once('error', (error) => {
                this.logger.error('Error joining room', {
                    error: error.message,
                    roomId
                });
                reject(error);
            });

            // Timeout after 5 seconds
            setTimeout(() => {
                reject(new Error('Join room timeout'));
            }, 5000);
        });
    }

    /**
     * Leave a room
     * 离开房间
     * @param {Object} socket - Socket instance
     * @param {string} roomId - Room ID
     * @returns {Promise} Promise that resolves when left
     */
    static leaveRoom(socket, roomId) {
        return new Promise((resolve, reject) => {
            if (!socket || !socket.connected) {
                reject(new Error('Socket not connected'));
                return;
            }

            socket.emit('leave_room', { roomId });

            socket.once('left_room', (data) => {
                this.logger.debug('Successfully left room', {
                    roomId: data.roomId,
                    socketId: socket.id
                });
                resolve(data);
            });

            socket.once('error', (error) => {
                this.logger.error('Error leaving room', {
                    error: error.message,
                    roomId
                });
                reject(error);
            });

            // Timeout after 5 seconds
            setTimeout(() => {
                reject(new Error('Leave room timeout'));
            }, 5000);
        });
    }

    /**
     * Send message to room
     * 向房间发送消息
     * @param {Object} socket - Socket instance
     * @param {string} roomId - Room ID
     * @param {string} message - Message content
     * @param {string} type - Message type
     * @returns {Promise} Promise that resolves when sent
     */
    static sendRoomMessage(socket, roomId, message, type = 'text') {
        return new Promise((resolve, reject) => {
            if (!socket || !socket.connected) {
                reject(new Error('Socket not connected'));
                return;
            }

            socket.emit('send_message', { roomId, message, type });

            socket.once('message_sent', (data) => {
                this.logger.debug('Room message sent successfully', {
                    messageId: data.messageId,
                    roomId,
                    messageLength: message.length
                });
                resolve(data);
            });

            socket.once('error', (error) => {
                this.logger.error('Error sending room message', {
                    error: error.message,
                    roomId
                });
                reject(error);
            });

            // Timeout after 10 seconds
            setTimeout(() => {
                reject(new Error('Send message timeout'));
            }, 10000);
        });
    }

    /**
     * Send private message
     * 发送私聊消息
     * @param {Object} socket - Socket instance
     * @param {string} targetUserId - Target user ID
     * @param {string} message - Message content
     * @param {string} type - Message type
     * @returns {Promise} Promise that resolves when sent
     */
    static sendPrivateMessage(socket, targetUserId, message, type = 'text') {
        return new Promise((resolve, reject) => {
            if (!socket || !socket.connected) {
                reject(new Error('Socket not connected'));
                return;
            }

            socket.emit('send_private_message', { targetUserId, message, type });

            socket.once('private_message_sent', (data) => {
                this.logger.debug('Private message sent successfully', {
                    messageId: data.messageId,
                    targetUserId,
                    messageLength: message.length
                });
                resolve(data);
            });

            socket.once('error', (error) => {
                this.logger.error('Error sending private message', {
                    error: error.message,
                    targetUserId
                });
                reject(error);
            });

            // Timeout after 10 seconds
            setTimeout(() => {
                reject(new Error('Send private message timeout'));
            }, 10000);
        });
    }

    /**
     * Start typing indicator
     * 开始输入指示器
     * @param {Object} socket - Socket instance
     * @param {string} roomId - Room ID (optional)
     * @param {string} targetUserId - Target user ID (optional)
     */
    static startTyping(socket, roomId = null, targetUserId = null) {
        if (!socket || !socket.connected) {
            this.logger.warn('Cannot start typing: socket not connected');
            return;
        }

        socket.emit('typing_start', { roomId, targetUserId });
        this.logger.debug('Typing started', { roomId, targetUserId });
    }

    /**
     * Stop typing indicator
     * 停止输入指示器
     * @param {Object} socket - Socket instance
     * @param {string} roomId - Room ID (optional)
     * @param {string} targetUserId - Target user ID (optional)
     */
    static stopTyping(socket, roomId = null, targetUserId = null) {
        if (!socket || !socket.connected) {
            this.logger.warn('Cannot stop typing: socket not connected');
            return;
        }

        socket.emit('typing_stop', { roomId, targetUserId });
        this.logger.debug('Typing stopped', { roomId, targetUserId });
    }

    /**
     * Update user status
     * 更新用户状态
     * @param {Object} socket - Socket instance
     * @param {string} status - Status (online, away, busy, offline)
     * @param {string} customStatus - Custom status message
     */
    static updateStatus(socket, status, customStatus = null) {
        if (!socket || !socket.connected) {
            this.logger.warn('Cannot update status: socket not connected');
            return;
        }

        socket.emit('update_status', { status, customStatus });
        this.logger.debug('Status updated', { status, customStatus });
    }

    /**
     * Send ping to check connection
     * 发送ping检查连接
     * @param {Object} socket - Socket instance
     * @returns {Promise} Promise that resolves with pong response
     */
    static ping(socket) {
        return new Promise((resolve, reject) => {
            if (!socket || !socket.connected) {
                reject(new Error('Socket not connected'));
                return;
            }

            const startTime = Date.now();
            socket.emit('ping');

            socket.once('pong', (data) => {
                const latency = Date.now() - startTime;
                this.logger.debug('Pong received', {
                    latency: `${latency}ms`,
                    timestamp: data.timestamp
                });
                resolve({ latency, timestamp: data.timestamp });
            });

            // Timeout after 5 seconds
            setTimeout(() => {
                reject(new Error('Ping timeout'));
            }, 5000);
        });
    }

    /**
     * Disconnect socket
     * 断开socket连接
     * @param {Object} socket - Socket instance
     */
    static disconnect(socket) {
        if (socket && socket.connected) {
            socket.disconnect();
            this.logger.debug('Socket disconnected manually');
        }
    }

    /**
     * Check if socket is connected
     * 检查socket是否已连接
     * @param {Object} socket - Socket instance
     * @returns {boolean} True if connected
     */
    static isConnected(socket) {
        return socket && socket.connected;
    }

    /**
     * Get connection state
     * 获取连接状态
     * @param {Object} socket - Socket instance
     * @returns {Object} Connection state information
     */
    static getConnectionState(socket) {
        if (!socket) {
            return { connected: false, state: 'not_initialized' };
        }

        return {
            connected: socket.connected,
            state: socket.connected ? 'connected' : 'disconnected',
            socketId: socket.id,
            transport: socket.io.engine.transport.name
        };
    }
}

module.exports = WebSocketUtil;
