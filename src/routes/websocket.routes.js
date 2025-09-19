const express = require("express");
const websocketService = require("../services/websocket.service");
const { authenticate } = require("../middleware/auth.middleware");
const { logger } = require("../middleware/logger.middleware");
const router = express.Router();
const wsLogger = logger("websocket-routes");

/**
 * Get WebSocket statistics
 * 获取WebSocket统计信息
 */
router.get("/stats", authenticate, (req, res) => {
    try {
        const stats = websocketService.getStats();
        wsLogger.info("WebSocket stats requested", { userId: req.user.id });

        res.json({
            errcode: 0,
            errmsg: "WebSocket statistics retrieved successfully",
            stats
        });
    } catch (error) {
        wsLogger.error("Error getting WebSocket stats", { error: error.message });
        res.status(500).json({
            errcode: 1,
            error: "Internal Server Error",
            errmsg: "Failed to get WebSocket statistics"
        });
    }
});

/**
 * Get online users list
 * 获取在线用户列表
 */
router.get("/online-users", authenticate, (req, res) => {
    try {
        const onlineUsers = websocketService.getOnlineUsers();
        wsLogger.info("Online users requested", {
            userId: req.user.id,
            count: onlineUsers.length
        });

        res.json({
            errcode: 0,
            errmsg: "Online users retrieved successfully",
            users: onlineUsers
        });
    } catch (error) {
        wsLogger.error("Error getting online users", { error: error.message });
        res.status(500).json({
            errcode: 1,
            error: "Internal Server Error",
            errmsg: "Failed to get online users"
        });
    }
});

/**
 * Get room members
 * 获取房间成员
 */
router.get("/rooms/:roomId/members", authenticate, (req, res) => {
    try {
        const { roomId } = req.params;
        const members = websocketService.getRoomMembers(roomId);

        wsLogger.info("Room members requested", {
            userId: req.user.id,
            roomId,
            memberCount: members.length
        });

        res.json({
            errcode: 0,
            errmsg: "Room members retrieved successfully",
            roomId,
            members
        });
    } catch (error) {
        wsLogger.error("Error getting room members", {
            error: error.message,
            roomId: req.params.roomId
        });
        res.status(500).json({
            errcode: 1,
            error: "Internal Server Error",
            errmsg: "Failed to get room members"
        });
    }
});

/**
 * Send message to specific user
 * 向特定用户发送消息
 */
router.post("/send-message", authenticate, (req, res) => {
    try {
        const { targetUserId, message, type = 'text' } = req.body;

        if (!targetUserId || !message) {
            return res.status(400).json({
                errcode: 1,
                error: "Bad Request",
                errmsg: "Target user ID and message are required"
            });
        }

        const success = websocketService.sendToUser(targetUserId, 'server_message', {
            fromUserId: req.user.id,
            fromUsername: req.user.username,
            message,
            type,
            timestamp: new Date()
        });

        if (success) {
            wsLogger.info("Message sent via API", {
                fromUserId: req.user.id,
                toUserId: targetUserId,
                messageLength: message.length
            });

            res.json({
                errcode: 0,
                errmsg: "Message sent successfully"
            });
        } else {
            res.status(404).json({
                errcode: 1,
                error: "Not Found",
                errmsg: "Target user is offline"
            });
        }
    } catch (error) {
        wsLogger.error("Error sending message via API", { error: error.message });
        res.status(500).json({
            errcode: 1,
            error: "Internal Server Error",
            errmsg: "Failed to send message"
        });
    }
});

/**
 * Send message to room
 * 向房间发送消息
 */
router.post("/rooms/:roomId/send-message", authenticate, (req, res) => {
    try {
        const { roomId } = req.params;
        const { message, type = 'text' } = req.body;

        if (!message) {
            return res.status(400).json({
                errcode: 1,
                error: "Bad Request",
                errmsg: "Message is required"
            });
        }

        websocketService.sendToRoom(roomId, 'server_room_message', {
            fromUserId: req.user.id,
            fromUsername: req.user.username,
            roomId,
            message,
            type,
            timestamp: new Date()
        });

        wsLogger.info("Room message sent via API", {
            fromUserId: req.user.id,
            roomId,
            messageLength: message.length
        });

        res.json({
            errcode: 0,
            errmsg: "Room message sent successfully"
        });
    } catch (error) {
        wsLogger.error("Error sending room message via API", {
            error: error.message,
            roomId: req.params.roomId
        });
        res.status(500).json({
            errcode: 1,
            error: "Internal Server Error",
            errmsg: "Failed to send room message"
        });
    }
});

/**
 * Broadcast message to all users
 * 向所有用户广播消息
 */
router.post("/broadcast", authenticate, (req, res) => {
    try {
        const { message, type = 'text' } = req.body;

        if (!message) {
            return res.status(400).json({
                errcode: 1,
                error: "Bad Request",
                errmsg: "Message is required"
            });
        }

        websocketService.broadcast('server_broadcast', {
            fromUserId: req.user.id,
            fromUsername: req.user.username,
            message,
            type,
            timestamp: new Date()
        });

        wsLogger.info("Broadcast message sent via API", {
            fromUserId: req.user.id,
            messageLength: message.length
        });

        res.json({
            errcode: 0,
            errmsg: "Broadcast message sent successfully"
        });
    } catch (error) {
        wsLogger.error("Error sending broadcast message via API", { error: error.message });
        res.status(500).json({
            errcode: 1,
            error: "Internal Server Error",
            errmsg: "Failed to send broadcast message"
        });
    }
});

/**
 * Get WebSocket connection info
 * 获取WebSocket连接信息
 */
router.get("/connection-info", authenticate, (req, res) => {
    try {
        const userId = req.user.id;
        const onlineUsers = websocketService.getOnlineUsers();
        const userInfo = onlineUsers.find(user => user.userId === userId);

        res.json({
            errcode: 0,
            errmsg: "Connection info retrieved successfully",
            isConnected: !!userInfo,
            connectionInfo: userInfo || null,
            totalOnlineUsers: onlineUsers.length
        });
    } catch (error) {
        wsLogger.error("Error getting connection info", { error: error.message });
        res.status(500).json({
            errcode: 1,
            error: "Internal Server Error",
            errmsg: "Failed to get connection info"
        });
    }
});

module.exports = router;
