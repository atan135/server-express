/**
 * WebSocket 客户端示例
 * 演示如何使用 WebSocket 功能
 */

const WebSocketUtil = require('../src/utils/websocket.util');
const io = require('socket.io-client');

class WebSocketClient {
    constructor(serverUrl, token) {
        this.serverUrl = serverUrl;
        this.token = token;
        this.socket = null;
        this.isConnected = false;
    }

    /**
     * 连接到 WebSocket 服务器
     */
    async connect() {
        try {
            console.log('正在连接到 WebSocket 服务器...');

            // 创建连接
            this.socket = WebSocketUtil.createConnection(this.serverUrl, this.token, {
                transports: ['websocket', 'polling'],
                timeout: 20000,
                forceNew: true
            });

            // 设置事件监听器
            this.setupEventListeners();

            // 等待连接建立
            await this.waitForConnection();

            console.log('✅ WebSocket 连接成功!');
            this.isConnected = true;

        } catch (error) {
            console.error('❌ WebSocket 连接失败:', error.message);
            throw error;
        }
    }

    /**
     * 设置事件监听器
     */
    setupEventListeners() {
        WebSocketUtil.setupEventListeners(this.socket, {
            onConnect: (data) => {
                console.log('🔗 连接建立:', data);
                this.isConnected = true;
            },

            onDisconnect: (reason) => {
                console.log('🔌 连接断开:', reason);
                this.isConnected = false;
            },

            onError: (error) => {
                console.error('❌ 连接错误:', error.message);
            },

            onMessage: (data) => {
                console.log(`📨 收到房间消息 [${data.roomId}]:`, {
                    from: data.username,
                    message: data.message,
                    time: data.timestamp
                });
            },

            onPrivateMessage: (data) => {
                console.log(`💬 收到私聊消息:`, {
                    from: data.fromUsername,
                    message: data.message,
                    time: data.timestamp
                });
            },

            onUserOnline: (data) => {
                console.log(`🟢 用户上线: ${data.username}`);
            },

            onUserOffline: (data) => {
                console.log(`🔴 用户下线: ${data.username}`);
            },

            onTypingStart: (data) => {
                console.log(`⌨️  ${data.username} 正在输入...`);
            },

            onTypingStop: (data) => {
                console.log(`⌨️  ${data.username} 停止输入`);
            },

            onStatusUpdate: (data) => {
                console.log(`📊 用户状态更新: ${data.username} - ${data.status}`);
            }
        });
    }

    /**
     * 等待连接建立
     */
    waitForConnection() {
        return new Promise((resolve, reject) => {
            const timeout = setTimeout(() => {
                reject(new Error('连接超时'));
            }, 10000);

            this.socket.on('connect', () => {
                clearTimeout(timeout);
                resolve();
            });

            this.socket.on('connect_error', (error) => {
                clearTimeout(timeout);
                reject(error);
            });
        });
    }

    /**
     * 加入房间
     */
    async joinRoom(roomId) {
        try {
            console.log(`🚪 正在加入房间: ${roomId}`);
            await WebSocketUtil.joinRoom(this.socket, roomId);
            console.log(`✅ 成功加入房间: ${roomId}`);
        } catch (error) {
            console.error(`❌ 加入房间失败: ${error.message}`);
            throw error;
        }
    }

    /**
     * 离开房间
     */
    async leaveRoom(roomId) {
        try {
            console.log(`🚪 正在离开房间: ${roomId}`);
            await WebSocketUtil.leaveRoom(this.socket, roomId);
            console.log(`✅ 成功离开房间: ${roomId}`);
        } catch (error) {
            console.error(`❌ 离开房间失败: ${error.message}`);
            throw error;
        }
    }

    /**
     * 发送房间消息
     */
    async sendRoomMessage(roomId, message, type = 'text') {
        try {
            console.log(`📤 发送房间消息到 ${roomId}: ${message}`);
            await WebSocketUtil.sendRoomMessage(this.socket, roomId, message, type);
            console.log(`✅ 房间消息发送成功`);
        } catch (error) {
            console.error(`❌ 发送房间消息失败: ${error.message}`);
            throw error;
        }
    }

    /**
     * 发送私聊消息
     */
    async sendPrivateMessage(targetUserId, message, type = 'text') {
        try {
            console.log(`📤 发送私聊消息给用户 ${targetUserId}: ${message}`);
            await WebSocketUtil.sendPrivateMessage(this.socket, targetUserId, message, type);
            console.log(`✅ 私聊消息发送成功`);
        } catch (error) {
            console.error(`❌ 发送私聊消息失败: ${error.message}`);
            throw error;
        }
    }

    /**
     * 开始输入指示器
     */
    startTyping(roomId = null, targetUserId = null) {
        WebSocketUtil.startTyping(this.socket, roomId, targetUserId);
        console.log('⌨️  开始输入指示器');
    }

    /**
     * 停止输入指示器
     */
    stopTyping(roomId = null, targetUserId = null) {
        WebSocketUtil.stopTyping(this.socket, roomId, targetUserId);
        console.log('⌨️  停止输入指示器');
    }

    /**
     * 更新状态
     */
    updateStatus(status, customStatus = null) {
        WebSocketUtil.updateStatus(this.socket, status, customStatus);
        console.log(`📊 状态更新: ${status}${customStatus ? ` - ${customStatus}` : ''}`);
    }

    /**
     * 测试连接延迟
     */
    async testLatency() {
        try {
            console.log('🏓 测试连接延迟...');
            const response = await WebSocketUtil.ping(this.socket);
            console.log(`✅ 延迟: ${response.latency}ms`);
            return response.latency;
        } catch (error) {
            console.error(`❌ 延迟测试失败: ${error.message}`);
            throw error;
        }
    }

    /**
     * 获取连接状态
     */
    getConnectionState() {
        const state = WebSocketUtil.getConnectionState(this.socket);
        console.log('📊 连接状态:', state);
        return state;
    }

    /**
     * 断开连接
     */
    disconnect() {
        console.log('🔌 正在断开连接...');
        WebSocketUtil.disconnect(this.socket);
        this.isConnected = false;
        console.log('✅ 连接已断开');
    }

    /**
     * 检查是否已连接
     */
    isConnectedToServer() {
        return WebSocketUtil.isConnected(this.socket);
    }
}

// 使用示例
async function main() {
    try {
        // 配置
        const serverUrl = 'http://localhost:4000';
        const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjYsImlhdCI6MTc1ODI3MzcwMywiZXhwIjoxNzU4MzYwMTAzfQ.JKYb8d65yyTp8zCunGxlnkMu_zf768suQCG__CovMPY'; // 使用提供的 JWT token

        // 创建客户端
        const client = new WebSocketClient(serverUrl, token);

        // 连接到服务器
        await client.connect();

        // 获取连接状态
        client.getConnectionState();

        // 测试延迟
        await client.testLatency();

        // 更新状态
        client.updateStatus('online', '正在使用示例客户端');

        // 加入房间
        await client.joinRoom('general');

        // 发送消息
        await client.sendRoomMessage('general', 'Hello everyone! 这是一条测试消息');

        // 模拟输入指示器
        client.startTyping('general');
        setTimeout(() => {
            client.stopTyping('general');
        }, 2000);

        // 等待一段时间
        console.log('⏳ 等待 5 秒...');
        await new Promise(resolve => setTimeout(resolve, 5000));

        // 发送私聊消息（需要有效的用户 ID）
        // await client.sendPrivateMessage('user-123', 'Hello! 这是私聊消息');

        // 离开房间
        await client.leaveRoom('general');

        // 断开连接
        client.disconnect();

    } catch (error) {
        console.error('❌ 示例运行失败:', error.message);
        process.exit(1);
    }
}

// 如果直接运行此文件，则执行示例
if (require.main === module) {
    console.log('🚀 WebSocket 客户端示例');
    console.log('请确保：');
    console.log('1. 服务器正在运行 (npm start)');
    console.log('2. 已获得有效的 JWT token');
    console.log('3. 更新 token 变量');
    console.log('');

    main().catch(console.error);
}

module.exports = WebSocketClient;
