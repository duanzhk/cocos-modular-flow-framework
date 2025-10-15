# 网络通信

## HTTP 请求

框架提供了简洁易用的 HTTP 客户端，通过 `mf.http` 访问。

### 基本用法

```typescript
// GET 请求
const userData = await mf.http.get('/api/users/123');

// GET 请求带参数
const list = await mf.http.get('/api/users', { page: 1, size: 20 });

// POST 请求
const newUser = await mf.http.post('/api/users', {
    name: 'Alice',
    email: 'alice@example.com'
});

// PUT 请求
const updated = await mf.http.put('/api/users/123', {
    name: 'Alice Updated'
});

// DELETE 请求
await mf.http.delete('/api/users/123');

// 自定义请求
const result = await mf.http.request({
    url: '/api/upload',
    method: 'POST',
    data: formData,
    headers: {
        'Authorization': 'Bearer token123'
    },
    timeout: 30000
});
```

### 在 Manager 中使用

```typescript
@manager('User')
export class UserManager extends AbstractManager {
    initialize(): void {}
    
    async login(username: string, password: string): Promise<any> {
        try {
            // 通过 getHttpManager() 获取 HTTP 管理器
            const result = await this.getHttpManager().post('/api/auth/login', {
                username,
                password
            });
            
            // 登录成功，派发事件
            this.getEventManager().dispatch('userLogin', result);
            return result;
        } catch (error) {
            console.error('登录失败:', error);
            throw error;
        }
    }
    
    async getUserProfile(userId: number): Promise<any> {
        const token = this.getAuthToken();
        return await this.getHttpManager().get(`/api/users/${userId}`, {}, {
            'Authorization': `Bearer ${token}`
        });
    }
    
    private getAuthToken(): string {
        // 从本地存储获取 token
        return localStorage.getItem('token') || '';
    }
}
```

### 设置全局配置

```typescript
// 设置 baseURL
mf.http.setBaseURL('https://api.example.com');

// 设置全局请求头
mf.http.setHeaders({
    'Content-Type': 'application/json',
    'Authorization': 'Bearer token123'
});

// 设置超时时间
mf.http.setTimeout(10000);  // 10 秒
```

### 请求拦截器

```typescript
// 请求前拦截
mf.http.interceptRequest((config) => {
    // 添加 token
    const token = localStorage.getItem('token');
    if (token) {
        config.headers = config.headers || {};
        config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
});

// 响应后拦截
mf.http.interceptResponse((response) => {
    // 统一处理响应
    if (response.code !== 0) {
        console.error('请求失败:', response.message);
        throw new Error(response.message);
    }
    return response.data;
});
```

### 错误处理

```typescript
try {
    const data = await mf.http.get('/api/users/123');
    console.log('用户数据:', data);
} catch (error) {
    if (error.code === 404) {
        console.error('用户不存在');
    } else if (error.code === 401) {
        console.error('未授权');
        // 跳转到登录页
    } else {
        console.error('请求失败:', error.message);
    }
}
```

## WebSocket 实时通信

框架提供了功能完整的 WebSocket 客户端，支持自动重连、心跳检测等特性。

### 基本用法

```typescript
// 连接服务器
mf.socket.connect('wss://game-server.com/ws');

// 配置连接参数
mf.socket.configure({
    reconnect: true,           // 启用自动重连
    reconnectInterval: 3000,   // 重连间隔 3 秒
    reconnectAttempts: 5,      // 最多重连 5 次
    heartbeat: true,           // 启用心跳
    heartbeatInterval: 30000,  // 心跳间隔 30 秒
    heartbeatMessage: 'ping'   // 心跳消息
});

// 监听事件
mf.socket.on('open', (event) => {
    console.log('WebSocket 连接成功');
});

mf.socket.on('message', (event) => {
    const data = JSON.parse(event.data);
    console.log('收到消息:', data);
});

mf.socket.on('error', (event) => {
    console.error('WebSocket 错误:', event);
});

mf.socket.on('close', (event) => {
    console.log('WebSocket 连接关闭');
});

// 发送消息
mf.socket.send({ type: 'move', x: 100, y: 200 });

// 检查连接状态
if (mf.socket.isConnected()) {
    console.log('已连接');
}

// 断开连接
mf.socket.disconnect();
```

### 支持的数据类型

```typescript
// 1. JSON 对象（推荐）
mf.socket.send({ type: 'chat', message: 'Hello' });

// 2. 字符串
mf.socket.send('ping');

// 3. 二进制数据（ArrayBuffer）
const buffer = new ArrayBuffer(8);
const view = new DataView(buffer);
view.setInt32(0, 12345);
mf.socket.send(buffer);

// 4. Blob（文件数据）
const blob = new Blob(['data'], { type: 'text/plain' });
mf.socket.send(blob);
```

### 在 Manager 中使用

```typescript
@manager('Network')
export class NetworkManager extends AbstractManager {
    initialize(): void {
        // 通过 getWebSocketManager() 获取 WebSocket 管理器
        const socket = this.getWebSocketManager();
        
        // 配置 WebSocket
        socket.configure({
            reconnect: true,
            reconnectInterval: 3000,
            reconnectAttempts: 10,
            heartbeat: true,
            heartbeatInterval: 30000
        });
        
        // 监听事件
        socket.on('open', this.onConnected.bind(this));
        socket.on('message', this.onMessage.bind(this));
        socket.on('error', this.onError.bind(this));
        socket.on('close', this.onClose.bind(this));
    }
    
    connect(token: string): void {
        const wsUrl = `wss://game-server.com/ws?token=${token}`;
        this.getWebSocketManager().connect(wsUrl);
    }
    
    sendGameAction(action: string, data: any): void {
        this.getWebSocketManager().send({
            type: action,
            data,
            timestamp: Date.now()
        });
    }
    
    private onConnected(event: Event): void {
        console.log('WebSocket 连接成功');
        this.getEventManager().dispatch('socketConnected');
    }
    
    private onMessage(event: MessageEvent): void {
        try {
            const data = JSON.parse(event.data);
            // 通过事件系统分发消息
            this.getEventManager().dispatch(`socket_${data.type}`, data);
        } catch (error) {
            console.error('解析消息失败:', error);
        }
    }
    
    private onError(event: Event): void {
        console.error('WebSocket 错误');
    }
    
    private onClose(event: CloseEvent): void {
        console.log('WebSocket 连接关闭');
        this.getEventManager().dispatch('socketClosed');
    }
    
    dispose(): void {
        this.getWebSocketManager().disconnect();
    }
}
```

### 消息协议设计

```typescript
// 定义消息类型
interface GameMessage {
    type: string;
    data: any;
    timestamp: number;
}

// 发送消息
const message: GameMessage = {
    type: 'playerMove',
    data: { x: 100, y: 200 },
    timestamp: Date.now()
};
mf.socket.send(message);

// 接收消息
mf.socket.on('message', (event) => {
    const message: GameMessage = JSON.parse(event.data);
    
    switch (message.type) {
        case 'playerMove':
            this.handlePlayerMove(message.data);
            break;
        case 'enemySpawn':
            this.handleEnemySpawn(message.data);
            break;
        default:
            console.warn('未知消息类型:', message.type);
    }
});
```

### 自动重连机制

```typescript
// 配置自动重连
mf.socket.configure({
    reconnect: true,           // 启用自动重连
    reconnectInterval: 3000,   // 重连间隔 3 秒
    reconnectAttempts: 5,      // 最多重连 5 次
});

// 监听重连事件
mf.socket.on('reconnecting', (attempt) => {
    console.log(`正在重连... (第 ${attempt} 次)`);
});

mf.socket.on('reconnected', () => {
    console.log('重连成功');
});

mf.socket.on('reconnectFailed', () => {
    console.error('重连失败，已达到最大重试次数');
    // 提示用户检查网络
});
```

### 心跳检测

```typescript
// 配置心跳
mf.socket.configure({
    heartbeat: true,           // 启用心跳
    heartbeatInterval: 30000,  // 每 30 秒发送一次
    heartbeatMessage: 'ping'   // 心跳消息内容
});

// 服务端需要响应 pong
mf.socket.on('message', (event) => {
    const data = JSON.parse(event.data);
    if (data === 'pong') {
        console.log('心跳正常');
    }
});
```

## 完整示例

### HTTP 示例

```typescript
@manager('API')
export class APIManager extends AbstractManager {
    private baseURL: string = 'https://api.example.com';
    
    initialize(): void {
        const http = this.getHttpManager();
        http.setBaseURL(this.baseURL);
        
        // 请求拦截器
        http.interceptRequest((config) => {
            const token = this.getToken();
            if (token) {
                config.headers = config.headers || {};
                config.headers['Authorization'] = `Bearer ${token}`;
            }
            return config;
        });
        
        // 响应拦截器
        http.interceptResponse((response) => {
            if (response.code !== 200) {
                throw new Error(response.message);
            }
            return response.data;
        });
    }
    
    async login(username: string, password: string): Promise<any> {
        const data = await this.getHttpManager().post('/auth/login', {
            username,
            password
        });
        
        // 保存 token
        this.saveToken(data.token);
        return data;
    }
    
    async getUserInfo(): Promise<any> {
        return await this.getHttpManager().get('/user/info');
    }
    
    private getToken(): string {
        return localStorage.getItem('token') || '';
    }
    
    private saveToken(token: string): void {
        localStorage.setItem('token', token);
    }
}
```

### WebSocket 示例

```typescript
@manager('Realtime')
export class RealtimeManager extends AbstractManager {
    private reconnectAttempts: number = 0;
    private maxReconnectAttempts: number = 5;
    
    initialize(): void {
        const socket = this.getWebSocketManager();
        
        socket.configure({
            reconnect: true,
            reconnectInterval: 3000,
            reconnectAttempts: this.maxReconnectAttempts,
            heartbeat: true,
            heartbeatInterval: 30000,
            heartbeatMessage: JSON.stringify({ type: 'ping' })
        });
        
        socket.on('open', this.onOpen.bind(this));
        socket.on('message', this.onMessage.bind(this));
        socket.on('error', this.onError.bind(this));
        socket.on('close', this.onClose.bind(this));
    }
    
    connect(): void {
        const token = localStorage.getItem('token');
        const wsUrl = `wss://game-server.com/ws?token=${token}`;
        this.getWebSocketManager().connect(wsUrl);
    }
    
    private onOpen(event: Event): void {
        console.log('WebSocket 连接成功');
        this.reconnectAttempts = 0;
        
        // 发送认证消息
        this.send('auth', {
            token: localStorage.getItem('token')
        });
    }
    
    private onMessage(event: MessageEvent): void {
        try {
            const message = JSON.parse(event.data);
            this.handleMessage(message);
        } catch (error) {
            console.error('解析消息失败:', error);
        }
    }
    
    private handleMessage(message: any): void {
        const { type, data } = message;
        
        switch (type) {
            case 'pong':
                // 心跳响应
                break;
            case 'authSuccess':
                console.log('认证成功');
                this.getEventManager().dispatch('realtimeReady');
                break;
            case 'gameUpdate':
                this.getEventManager().dispatch('gameUpdate', data);
                break;
            default:
                console.warn('未知消息类型:', type);
        }
    }
    
    private onError(event: Event): void {
        console.error('WebSocket 错误:', event);
    }
    
    private onClose(event: CloseEvent): void {
        console.log('WebSocket 连接关闭');
        
        if (this.reconnectAttempts < this.maxReconnectAttempts) {
            this.reconnectAttempts++;
            console.log(`尝试重连 (${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
        } else {
            console.error('重连失败，请检查网络');
            this.getEventManager().dispatch('realtimeDisconnected');
        }
    }
    
    send(type: string, data: any): void {
        const message = {
            type,
            data,
            timestamp: Date.now()
        };
        this.getWebSocketManager().send(message);
    }
    
    dispose(): void {
        this.getWebSocketManager().disconnect();
    }
}
```

## 注意事项

### HTTP

1. **超时设置**：合理设置请求超时时间
2. **错误处理**：处理网络错误和业务错误
3. **请求取消**：长时间请求支持取消
4. **并发控制**：避免同时发起过多请求

### WebSocket

1. **连接状态**：始终检查连接状态再发送消息
2. **消息队列**：连接断开时，消息可以缓存到队列
3. **心跳机制**：避免连接被服务器强制断开
4. **消息格式**：统一消息格式，便于解析
5. **场景切换**：记得断开连接，避免内存泄漏

