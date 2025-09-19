const WebSocketService = require('../src/services/websocket.service');
const jwt = require('jsonwebtoken');

// Mock dependencies
jest.mock('../src/middleware/logger.middleware');
jest.mock('../src/models/user.model');
jest.mock('../src/utils/network.util');

const UserModel = require('../src/models/user.model');
const NetworkUtil = require('../src/utils/network.util');

describe('WebSocketService', () => {
    let mockServer;
    let mockSocket;
    let mockUser;

    beforeEach(() => {
        // Reset the service
        WebSocketService.io = null;
        WebSocketService.connectedUsers.clear();
        WebSocketService.socketUsers.clear();
        WebSocketService.rooms.clear();

        // Mock user data
        mockUser = {
            id: 1,
            username: 'testuser',
            email: 'test@example.com'
        };

        // Mock UserModel
        UserModel.findById.mockResolvedValue(mockUser);

        // Mock NetworkUtil
        NetworkUtil.getClientIP.mockReturnValue('127.0.0.1');

        // Mock server
        mockServer = {
            on: jest.fn()
        };

        // Mock socket
        mockSocket = {
            id: 'socket-123',
            userId: 1,
            userInfo: mockUser,
            handshake: {
                auth: { token: 'valid-token' },
                query: {},
                address: '127.0.0.1'
            },
            join: jest.fn(),
            leave: jest.fn(),
            emit: jest.fn(),
            to: jest.fn().mockReturnThis(),
            broadcast: {
                emit: jest.fn()
            },
            on: jest.fn()
        };

        // Mock JWT
        jest.spyOn(jwt, 'verify').mockReturnValue({ userId: 1 });
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    describe('initialize', () => {
        test('should initialize WebSocket server', () => {
            const io = WebSocketService.initialize(mockServer);

            expect(io).toBeDefined();
            expect(WebSocketService.io).toBe(io);
        });
    });

    describe('generateToken', () => {
        test('should generate a valid CSRF token', () => {
            const sessionId = 'test-session-123';
            const token = WebSocketService.generateToken(sessionId);

            expect(token).toBeDefined();
            expect(typeof token).toBe('string');
            expect(token.length).toBeGreaterThan(0);
        });

        test('should store token in token store', () => {
            const sessionId = 'test-session-123';
            const token = WebSocketService.generateToken(sessionId);

            const storedToken = WebSocketService.tokenStore.get(sessionId);
            expect(storedToken).toBeDefined();
            expect(storedToken.token).toBe(token);
        });
    });

    describe('verifyToken', () => {
        test('should verify valid token', () => {
            const sessionId = 'test-session-123';
            const token = WebSocketService.generateToken(sessionId);

            const isValid = WebSocketService.verifyToken(sessionId, token);
            expect(isValid).toBe(true);
        });

        test('should reject invalid token', () => {
            const sessionId = 'test-session-123';
            const token = WebSocketService.generateToken(sessionId);
            const invalidToken = 'invalid-token';

            const isValid = WebSocketService.verifyToken(sessionId, invalidToken);
            expect(isValid).toBe(false);
        });
    });

    describe('getSessionId', () => {
        test('should get session ID from sessionID', () => {
            const req = { sessionID: 'session-123' };
            const sessionId = WebSocketService.getSessionId(req);
            expect(sessionId).toBe('session-123');
        });

        test('should get session ID from x-session-id header', () => {
            const req = {
                sessionID: undefined,
                headers: { 'x-session-id': 'header-session-123' }
            };
            const sessionId = WebSocketService.getSessionId(req);
            expect(sessionId).toBe('header-session-123');
        });

        test('should fallback to IP address', () => {
            const req = {
                sessionID: undefined,
                headers: {},
                ip: '192.168.1.1'
            };
            const sessionId = WebSocketService.getSessionId(req);
            expect(sessionId).toBe('192.168.1.1');
        });
    });

    describe('handleConnection', () => {
        beforeEach(() => {
            WebSocketService.io = {
                emit: jest.fn(),
                to: jest.fn().mockReturnThis()
            };
        });

        test('should handle new connection', async () => {
            await WebSocketService.handleConnection(mockSocket);

            expect(WebSocketService.connectedUsers.get(1)).toBe('socket-123');
            expect(WebSocketService.socketUsers.get('socket-123')).toBeDefined();
            expect(mockSocket.join).toHaveBeenCalledWith('user_1');
            expect(mockSocket.emit).toHaveBeenCalledWith('connected', expect.any(Object));
        });
    });

    describe('handleJoinRoom', () => {
        beforeEach(() => {
            WebSocketService.io = {
                to: jest.fn().mockReturnThis(),
                emit: jest.fn()
            };
        });

        test('should join user to room', () => {
            WebSocketService.handleJoinRoom(mockSocket, { roomId: 'room-123' });

            expect(mockSocket.join).toHaveBeenCalledWith('room-123');
            expect(WebSocketService.rooms.has('room-123')).toBe(true);
            expect(mockSocket.emit).toHaveBeenCalledWith('joined_room', { roomId: 'room-123' });
        });

        test('should handle missing room ID', () => {
            WebSocketService.handleJoinRoom(mockSocket, {});

            expect(mockSocket.emit).toHaveBeenCalledWith('error', { message: 'Room ID is required' });
        });
    });

    describe('handleLeaveRoom', () => {
        beforeEach(() => {
            WebSocketService.io = {
                to: jest.fn().mockReturnThis(),
                emit: jest.fn()
            };
        });

        test('should leave user from room', () => {
            // First join a room
            WebSocketService.handleJoinRoom(mockSocket, { roomId: 'room-123' });

            // Then leave it
            WebSocketService.handleLeaveRoom(mockSocket, { roomId: 'room-123' });

            expect(mockSocket.leave).toHaveBeenCalledWith('room-123');
            expect(mockSocket.emit).toHaveBeenCalledWith('left_room', { roomId: 'room-123' });
        });
    });

    describe('handleSendMessage', () => {
        beforeEach(() => {
            WebSocketService.io = {
                to: jest.fn().mockReturnThis(),
                emit: jest.fn()
            };
        });

        test('should send message to room', () => {
            WebSocketService.handleSendMessage(mockSocket, {
                roomId: 'room-123',
                message: 'Hello world',
                type: 'text'
            });

            expect(WebSocketService.io.to).toHaveBeenCalledWith('room-123');
            expect(WebSocketService.io.emit).toHaveBeenCalledWith('room_message', expect.objectContaining({
                roomId: 'room-123',
                message: 'Hello world',
                type: 'text'
            }));
        });

        test('should handle missing room ID or message', () => {
            WebSocketService.handleSendMessage(mockSocket, {});

            expect(mockSocket.emit).toHaveBeenCalledWith('error', { message: 'Room ID and message are required' });
        });
    });

    describe('handleSendPrivateMessage', () => {
        beforeEach(() => {
            WebSocketService.io = {
                to: jest.fn().mockReturnThis(),
                emit: jest.fn()
            };
        });

        test('should send private message to online user', () => {
            // Set up target user as online
            WebSocketService.connectedUsers.set(2, 'socket-456');

            WebSocketService.handleSendPrivateMessage(mockSocket, {
                targetUserId: 2,
                message: 'Private message',
                type: 'text'
            });

            expect(WebSocketService.io.to).toHaveBeenCalledWith('socket-456');
            expect(WebSocketService.io.emit).toHaveBeenCalledWith('private_message', expect.objectContaining({
                toUserId: 2,
                message: 'Private message'
            }));
        });

        test('should handle offline target user', () => {
            WebSocketService.handleSendPrivateMessage(mockSocket, {
                targetUserId: 2,
                message: 'Private message',
                type: 'text'
            });

            expect(mockSocket.emit).toHaveBeenCalledWith('error', { message: 'Target user is offline' });
        });
    });

    describe('sendToUser', () => {
        beforeEach(() => {
            WebSocketService.io = {
                to: jest.fn().mockReturnThis(),
                emit: jest.fn()
            };
        });

        test('should send message to online user', () => {
            WebSocketService.connectedUsers.set(2, 'socket-456');

            const result = WebSocketService.sendToUser(2, 'test_event', { data: 'test' });

            expect(result).toBe(true);
            expect(WebSocketService.io.to).toHaveBeenCalledWith('socket-456');
            expect(WebSocketService.io.emit).toHaveBeenCalledWith('test_event', { data: 'test' });
        });

        test('should return false for offline user', () => {
            const result = WebSocketService.sendToUser(2, 'test_event', { data: 'test' });

            expect(result).toBe(false);
        });
    });

    describe('sendToRoom', () => {
        beforeEach(() => {
            WebSocketService.io = {
                to: jest.fn().mockReturnThis(),
                emit: jest.fn()
            };
        });

        test('should send message to room', () => {
            WebSocketService.sendToRoom('room-123', 'test_event', { data: 'test' });

            expect(WebSocketService.io.to).toHaveBeenCalledWith('room-123');
            expect(WebSocketService.io.emit).toHaveBeenCalledWith('test_event', { data: 'test' });
        });
    });

    describe('broadcast', () => {
        beforeEach(() => {
            WebSocketService.io = {
                emit: jest.fn()
            };
        });

        test('should broadcast message to all users', () => {
            WebSocketService.broadcast('test_event', { data: 'test' });

            expect(WebSocketService.io.emit).toHaveBeenCalledWith('test_event', { data: 'test' });
        });
    });

    describe('getConnectedUsersCount', () => {
        test('should return connected users count', () => {
            WebSocketService.connectedUsers.set(1, 'socket-1');
            WebSocketService.connectedUsers.set(2, 'socket-2');

            const count = WebSocketService.getConnectedUsersCount();
            expect(count).toBe(2);
        });
    });

    describe('getOnlineUsers', () => {
        test('should return online users list', () => {
            WebSocketService.socketUsers.set('socket-1', {
                userId: 1,
                userInfo: { username: 'user1' },
                connectedAt: new Date(),
                ip: '127.0.0.1'
            });

            const users = WebSocketService.getOnlineUsers();
            expect(users).toHaveLength(1);
            expect(users[0]).toMatchObject({
                socketId: 'socket-1',
                userId: 1,
                username: 'user1'
            });
        });
    });

    describe('getRoomMembers', () => {
        test('should return room members', () => {
            WebSocketService.rooms.set('room-123', new Set(['socket-1', 'socket-2']));
            WebSocketService.socketUsers.set('socket-1', {
                userId: 1,
                userInfo: { username: 'user1' }
            });
            WebSocketService.socketUsers.set('socket-2', {
                userId: 2,
                userInfo: { username: 'user2' }
            });

            const members = WebSocketService.getRoomMembers('room-123');
            expect(members).toHaveLength(2);
        });

        test('should return empty array for non-existent room', () => {
            const members = WebSocketService.getRoomMembers('non-existent');
            expect(members).toHaveLength(0);
        });
    });

    describe('getStats', () => {
        test('should return statistics', () => {
            WebSocketService.connectedUsers.set(1, 'socket-1');
            WebSocketService.socketUsers.set('socket-1', { userId: 1, userInfo: {} });
            WebSocketService.rooms.set('room-123', new Set(['socket-1']));

            const stats = WebSocketService.getStats();

            expect(stats).toHaveProperty('connectedUsers');
            expect(stats).toHaveProperty('totalSockets');
            expect(stats).toHaveProperty('activeRooms');
            expect(stats).toHaveProperty('uptime');
            expect(stats).toHaveProperty('memoryUsage');
            expect(stats.connectedUsers).toBe(1);
            expect(stats.totalSockets).toBe(1);
            expect(stats.activeRooms).toBe(1);
        });
    });

    describe('generateMessageId', () => {
        test('should generate unique message ID', () => {
            const id1 = WebSocketService.generateMessageId();
            const id2 = WebSocketService.generateMessageId();

            expect(id1).toBeDefined();
            expect(id2).toBeDefined();
            expect(id1).not.toBe(id2);
            expect(id1).toMatch(/^msg_\d+_[a-z0-9]+$/);
        });
    });
});
