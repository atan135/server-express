# WebSocket 支持文档

## 概述

本项目已集成完整的 WebSocket 支持，使用 Socket.IO 实现实时通信功能。支持用户认证、房间管理、消息传递、状态更新等功能。

## 功能特性

- **用户认证**: JWT token 认证保护 WebSocket 连接
- **房间管理**: 支持用户加入/离开房间
- **消息传递**: 支持房间消息和私聊消息
- **状态管理**: 用户在线状态和自定义状态
- **输入指示器**: 实时显示用户输入状态
- **速率限制**: 防止连接滥用
- **错误处理**: 完善的错误处理和日志记录

## 安装和配置

### 依赖包

```bash
npm install socket.io socket.io-client
```

### 环境变量

在 `.env` 文件中添加以下配置：

```env
# WebSocket 配置
CORS_ORIGIN=http://localhost:3000
JWT_SECRET=your-jwt-secret-key
```

## 服务端集成

### 1. 服务器初始化

WebSocket 服务已集成到 `src/server.js` 中：

```javascript
const http = require("http");
const websocketService = require("./services/websocket.service");

// 创建 HTTP 服务器
const server = http.createServer(app);

// 初始化 WebSocket 服务
websocketService.initialize(server, {
  origin: process.env.CORS_ORIGIN || "*",
  methods: ["GET", "POST"],
  credentials: true
});
```

### 2. WebSocket 服务

主要服务文件：`src/services/websocket.service.js`

**核心功能：**
- 连接管理和认证
- 房间管理
- 消息传递
- 用户状态管理

### 3. API 路由

WebSocket 相关 API 路由：`src/routes/websocket.routes.js`

**可用端点：**
- `GET /api/websocket/stats` - 获取 WebSocket 统计信息
- `GET /api/websocket/online-users` - 获取在线用户列表
- `GET /api/websocket/rooms/:roomId/members` - 获取房间成员
- `POST /api/websocket/send-message` - 发送消息给特定用户
- `POST /api/websocket/rooms/:roomId/send-message` - 向房间发送消息
- `POST /api/websocket/broadcast` - 广播消息给所有用户
- `GET /api/websocket/connection-info` - 获取连接信息

## 客户端集成

### 1. 基本连接

```javascript
const WebSocketUtil = require('./src/utils/websocket.util');
const io = require('socket.io-client');

// 创建连接
const socket = WebSocketUtil.createConnection(
  'http://localhost:3000',
  'your-jwt-token',
  {
    transports: ['websocket', 'polling'],
    timeout: 20000
  }
);

// 设置事件监听器
WebSocketUtil.setupEventListeners(socket, {
  onConnect: (data) => {
    console.log('连接成功:', data);
  },
  onDisconnect: (reason) => {
    console.log('连接断开:', reason);
  },
  onMessage: (data) => {
    console.log('收到消息:', data);
  },
  onPrivateMessage: (data) => {
    console.log('收到私聊:', data);
  },
  onUserOnline: (data) => {
    console.log('用户上线:', data);
  },
  onUserOffline: (data) => {
    console.log('用户下线:', data);
  }
});
```

### 2. 房间管理

```javascript
// 加入房间
try {
  await WebSocketUtil.joinRoom(socket, 'room-123');
  console.log('成功加入房间');
} catch (error) {
  console.error('加入房间失败:', error.message);
}

// 离开房间
try {
  await WebSocketUtil.leaveRoom(socket, 'room-123');
  console.log('成功离开房间');
} catch (error) {
  console.error('离开房间失败:', error.message);
}
```

### 3. 消息发送

```javascript
// 发送房间消息
try {
  await WebSocketUtil.sendRoomMessage(
    socket, 
    'room-123', 
    'Hello everyone!', 
    'text'
  );
  console.log('房间消息发送成功');
} catch (error) {
  console.error('发送房间消息失败:', error.message);
}

// 发送私聊消息
try {
  await WebSocketUtil.sendPrivateMessage(
    socket, 
    'user-456', 
    'Hello!', 
    'text'
  );
  console.log('私聊消息发送成功');
} catch (error) {
  console.error('发送私聊消息失败:', error.message);
}
```

### 4. 状态管理

```javascript
// 更新用户状态
WebSocketUtil.updateStatus(socket, 'away', '正在开会');

// 开始输入指示器
WebSocketUtil.startTyping(socket, 'room-123');

// 停止输入指示器
WebSocketUtil.stopTyping(socket, 'room-123');
```

### 5. 连接管理

```javascript
// 检查连接状态
if (WebSocketUtil.isConnected(socket)) {
  console.log('已连接');
}

// 获取连接状态
const state = WebSocketUtil.getConnectionState(socket);
console.log('连接状态:', state);

// 发送 ping 测试延迟
try {
  const response = await WebSocketUtil.ping(socket);
  console.log('延迟:', response.latency + 'ms');
} catch (error) {
  console.error('Ping 失败:', error.message);
}

// 断开连接
WebSocketUtil.disconnect(socket);
```

## 事件系统

### 服务器端事件

#### 连接事件
- `connection` - 新用户连接
- `disconnect` - 用户断开连接

#### 房间事件
- `join_room` - 用户加入房间
- `leave_room` - 用户离开房间

#### 消息事件
- `send_message` - 发送房间消息
- `send_private_message` - 发送私聊消息

#### 状态事件
- `update_status` - 更新用户状态
- `typing_start` - 开始输入
- `typing_stop` - 停止输入

### 客户端事件

#### 系统事件
- `connected` - 连接成功
- `disconnect` - 连接断开
- `error` - 发生错误

#### 消息事件
- `room_message` - 收到房间消息
- `private_message` - 收到私聊消息
- `server_message` - 收到服务器消息
- `server_broadcast` - 收到广播消息

#### 状态事件
- `user_online` - 用户上线
- `user_offline` - 用户下线
- `user_status_updated` - 用户状态更新
- `user_typing_start` - 用户开始输入
- `user_typing_stop` - 用户停止输入

## 认证和安全

### JWT 认证

WebSocket 连接使用 JWT token 进行认证：

```javascript
// 连接时提供 token
const socket = io('http://localhost:3000', {
  auth: {
    token: 'your-jwt-token'
  }
});

// 或者在查询参数中提供
const socket = io('http://localhost:3000?token=your-jwt-token');
```

### 速率限制

系统内置速率限制，防止连接滥用：
- 每个 IP 每分钟最多 10 个连接
- 自动清理过期连接

### 错误处理

完善的错误处理机制：
- 认证失败自动断开连接
- 详细的错误日志记录
- 客户端友好的错误消息

## 使用示例

### 1. 聊天应用

```javascript
// 创建聊天应用
class ChatApp {
  constructor(serverUrl, token) {
    this.socket = WebSocketUtil.createConnection(serverUrl, token);
    this.setupEventListeners();
  }

  setupEventListeners() {
    WebSocketUtil.setupEventListeners(this.socket, {
      onConnect: () => {
        console.log('聊天应用已连接');
        this.joinRoom('general');
      },
      onMessage: (data) => {
        this.displayMessage(data);
      },
      onUserOnline: (data) => {
        this.updateUserStatus(data, 'online');
      },
      onUserOffline: (data) => {
        this.updateUserStatus(data, 'offline');
      }
    });
  }

  async joinRoom(roomId) {
    try {
      await WebSocketUtil.joinRoom(this.socket, roomId);
      console.log(`已加入房间: ${roomId}`);
    } catch (error) {
      console.error('加入房间失败:', error);
    }
  }

  async sendMessage(roomId, message) {
    try {
      await WebSocketUtil.sendRoomMessage(this.socket, roomId, message);
    } catch (error) {
      console.error('发送消息失败:', error);
    }
  }

  displayMessage(data) {
    console.log(`${data.username}: ${data.message}`);
  }

  updateUserStatus(data, status) {
    console.log(`${data.username} is ${status}`);
  }
}

// 使用聊天应用
const chatApp = new ChatApp('http://localhost:3000', 'your-jwt-token');
```

### 2. 实时通知系统

```javascript
// 创建通知系统
class NotificationSystem {
  constructor(serverUrl, token) {
    this.socket = WebSocketUtil.createConnection(serverUrl, token);
    this.setupEventListeners();
  }

  setupEventListeners() {
    WebSocketUtil.setupEventListeners(this.socket, {
      onConnect: () => {
        console.log('通知系统已连接');
      },
      onMessage: (data) => {
        this.showNotification(data);
      }
    });
  }

  showNotification(data) {
    // 显示浏览器通知
    if (Notification.permission === 'granted') {
      new Notification(data.title || '新消息', {
        body: data.message,
        icon: data.icon || '/default-icon.png'
      });
    }
  }
}

// 使用通知系统
const notificationSystem = new NotificationSystem('http://localhost:3000', 'your-jwt-token');
```

## API 参考

### WebSocket 服务方法

#### `initialize(server, cors)`
初始化 WebSocket 服务

**参数：**
- `server` - HTTP 服务器实例
- `cors` - CORS 配置对象

#### `sendToUser(userId, event, data)`
向特定用户发送消息

**参数：**
- `userId` - 目标用户 ID
- `event` - 事件名称
- `data` - 消息数据

**返回：** `boolean` - 发送是否成功

#### `sendToRoom(roomId, event, data)`
向房间发送消息

**参数：**
- `roomId` - 房间 ID
- `event` - 事件名称
- `data` - 消息数据

#### `broadcast(event, data)`
向所有用户广播消息

**参数：**
- `event` - 事件名称
- `data` - 消息数据

#### `getConnectedUsersCount()`
获取连接用户数量

**返回：** `number` - 连接用户数量

#### `getOnlineUsers()`
获取在线用户列表

**返回：** `Array` - 在线用户数组

#### `getRoomMembers(roomId)`
获取房间成员

**参数：**
- `roomId` - 房间 ID

**返回：** `Array` - 房间成员数组

#### `getStats()`
获取统计信息

**返回：** `Object` - 统计信息对象

### WebSocket 工具方法

#### `createConnection(serverUrl, token, options)`
创建 WebSocket 连接

**参数：**
- `serverUrl` - 服务器 URL
- `token` - JWT token
- `options` - 连接选项

**返回：** `Object` - Socket.IO 客户端实例

#### `setupEventListeners(socket, callbacks)`
设置事件监听器

**参数：**
- `socket` - Socket 实例
- `callbacks` - 回调函数对象

#### `joinRoom(socket, roomId)`
加入房间

**参数：**
- `socket` - Socket 实例
- `roomId` - 房间 ID

**返回：** `Promise` - 加入结果

#### `leaveRoom(socket, roomId)`
离开房间

**参数：**
- `socket` - Socket 实例
- `roomId` - 房间 ID

**返回：** `Promise` - 离开结果

#### `sendRoomMessage(socket, roomId, message, type)`
发送房间消息

**参数：**
- `socket` - Socket 实例
- `roomId` - 房间 ID
- `message` - 消息内容
- `type` - 消息类型

**返回：** `Promise` - 发送结果

#### `sendPrivateMessage(socket, targetUserId, message, type)`
发送私聊消息

**参数：**
- `socket` - Socket 实例
- `targetUserId` - 目标用户 ID
- `message` - 消息内容
- `type` - 消息类型

**返回：** `Promise` - 发送结果

## 测试

运行 WebSocket 测试：

```bash
npm test websocket.service.test.js
```

测试覆盖：
- 连接管理
- 房间操作
- 消息传递
- 状态管理
- 错误处理

## 部署注意事项

### 生产环境配置

1. **CORS 设置**：配置正确的 CORS 源
2. **SSL 支持**：使用 HTTPS 和 WSS
3. **负载均衡**：配置 Sticky Sessions
4. **监控**：监控连接数和性能

### 环境变量

```env
# 生产环境配置
CORS_ORIGIN=https://yourdomain.com
JWT_SECRET=your-production-secret
NODE_ENV=production
```

### 性能优化

1. **连接池管理**：合理设置连接限制
2. **内存管理**：定期清理过期连接
3. **日志级别**：生产环境使用适当的日志级别

## 故障排除

### 常见问题

1. **连接失败**
   - 检查 JWT token 是否有效
   - 确认服务器地址和端口
   - 检查网络连接

2. **认证失败**
   - 验证 JWT token 格式
   - 检查 token 是否过期
   - 确认用户是否存在

3. **消息发送失败**
   - 检查目标用户是否在线
   - 验证房间 ID 是否正确
   - 查看服务器日志

### 调试技巧

1. **启用调试日志**：设置日志级别为 debug
2. **监控连接状态**：使用 `getStats()` 方法
3. **检查网络**：使用 `ping()` 方法测试延迟

## 最佳实践

1. **错误处理**：始终处理连接和消息错误
2. **重连机制**：实现自动重连逻辑
3. **状态管理**：保持连接状态同步
4. **资源清理**：及时清理不需要的连接
5. **安全考虑**：验证所有输入数据

这个 WebSocket 实现提供了完整的实时通信功能，支持各种应用场景，包括聊天、通知、协作等。通过合理的配置和使用，可以构建强大的实时应用程序。
