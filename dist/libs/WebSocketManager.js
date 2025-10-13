/**
 * WebSocket 管理器实现类
 *
 * 功能特性：
 * 1. 自动重连：连接断开后自动尝试重连
 * 2. 心跳检测：定期发送心跳保持连接
 * 3. 事件管理：统一的事件监听和触发
 * 4. 消息队列：连接断开时缓存消息，重连后自动发送
 */
class WebSocketManager {
    constructor() {
        this.ws = null;
        this.url = '';
        // 配置项
        this.reconnect = true; // 是否自动重连
        this.reconnectInterval = 3000; // 重连间隔（毫秒）
        this.reconnectAttempts = 5; // 最大重连次数
        this.currentReconnectAttempts = 0; // 当前重连次数
        this.heartbeat = true; // 是否启用心跳
        this.heartbeatInterval = 30000; // 心跳间隔（毫秒）
        this.heartbeatMessage = 'ping'; // 心跳消息
        this.heartbeatTimer = null; // 心跳定时器
        // 事件监听器
        this.eventHandlers = new Map();
        // 消息队列（连接断开时缓存消息）
        this.messageQueue = [];
        // 重连定时器
        this.reconnectTimer = null;
    }
    initialize() {
        console.log('WebSocketManager 初始化');
    }
    dispose() {
        this.disconnect();
        this.eventHandlers.clear();
        this.messageQueue = [];
        console.log('WebSocketManager 已清理');
    }
    /**
     * 连接 WebSocket
     */
    connect(url, protocols) {
        if (this.ws && this.ws.readyState === WebSocket.OPEN) {
            console.warn('WebSocket 已连接');
            return;
        }
        this.url = url;
        this.protocols = protocols;
        this.currentReconnectAttempts = 0;
        this._createWebSocket();
    }
    /**
     * 断开连接
     */
    disconnect(code, reason) {
        this.reconnect = false; // 禁止自动重连
        if (this.reconnectTimer) {
            clearTimeout(this.reconnectTimer);
            this.reconnectTimer = null;
        }
        this._stopHeartbeat();
        if (this.ws) {
            this.ws.close(code || 1000, reason || 'Normal closure');
            this.ws = null;
        }
    }
    /**
     * 发送消息
     * 支持多种数据类型：
     * - string: 直接发送
     * - object: 自动转换为 JSON 字符串
     * - ArrayBuffer: 发送二进制数据
     * - Blob: 发送文件数据
     */
    send(data) {
        let sendData;
        // 自动处理对象类型，转换为 JSON 字符串
        if (typeof data === 'object' && !(data instanceof ArrayBuffer) && !(data instanceof Blob)) {
            sendData = JSON.stringify(data);
        }
        else {
            sendData = data;
        }
        if (this.ws && this.ws.readyState === WebSocket.OPEN) {
            this.ws.send(sendData);
        }
        else {
            console.warn('WebSocket 未连接，消息已加入队列');
            this.messageQueue.push(sendData);
        }
    }
    /**
     * 检查是否已连接
     */
    isConnected() {
        return this.ws !== null && this.ws.readyState === WebSocket.OPEN;
    }
    /**
     * 获取连接状态
     */
    getReadyState() {
        return this.ws ? this.ws.readyState : WebSocket.CLOSED;
    }
    /**
     * 注册事件监听
     */
    on(event, handler) {
        if (!this.eventHandlers.has(event)) {
            this.eventHandlers.set(event, new Set());
        }
        this.eventHandlers.get(event).add(handler);
    }
    /**
     * 移除事件监听
     */
    off(event, handler) {
        if (!handler) {
            // 移除该事件的所有监听器
            this.eventHandlers.delete(event);
        }
        else {
            // 移除特定监听器
            const handlers = this.eventHandlers.get(event);
            if (handlers) {
                handlers.delete(handler);
            }
        }
    }
    /**
     * 配置 WebSocket
     */
    configure(config) {
        if (config.reconnect !== undefined) {
            this.reconnect = config.reconnect;
        }
        if (config.reconnectInterval !== undefined) {
            this.reconnectInterval = config.reconnectInterval;
        }
        if (config.reconnectAttempts !== undefined) {
            this.reconnectAttempts = config.reconnectAttempts;
        }
        if (config.heartbeat !== undefined) {
            this.heartbeat = config.heartbeat;
        }
        if (config.heartbeatInterval !== undefined) {
            this.heartbeatInterval = config.heartbeatInterval;
        }
        if (config.heartbeatMessage !== undefined) {
            this.heartbeatMessage = config.heartbeatMessage;
        }
    }
    /**
     * 创建 WebSocket 连接
     */
    _createWebSocket() {
        try {
            this.ws = this.protocols
                ? new WebSocket(this.url, this.protocols)
                : new WebSocket(this.url);
            this.ws.onopen = this._onOpen.bind(this);
            this.ws.onmessage = this._onMessage.bind(this);
            this.ws.onerror = this._onError.bind(this);
            this.ws.onclose = this._onClose.bind(this);
            console.log(`🔌 正在连接 WebSocket: ${this.url}`);
        }
        catch (error) {
            console.error('创建 WebSocket 失败:', error);
            this._emit('error', error);
        }
    }
    /**
     * 连接成功
     */
    _onOpen(event) {
        console.log('✅ WebSocket 连接成功');
        this.currentReconnectAttempts = 0;
        // 启动心跳
        if (this.heartbeat) {
            this._startHeartbeat();
        }
        // 发送队列中的消息
        this._sendQueuedMessages();
        // 触发 open 事件
        this._emit('open', event);
    }
    /**
     * 收到消息
     */
    _onMessage(event) {
        console.log('📨 收到消息:', event.data);
        this._emit('message', event);
    }
    /**
     * 连接错误
     */
    _onError(event) {
        console.error('❌ WebSocket 错误:', event);
        this._emit('error', event);
    }
    /**
     * 连接关闭
     */
    _onClose(event) {
        console.log(`🔌 WebSocket 连接关闭: code=${event.code}, reason=${event.reason}`);
        this._stopHeartbeat();
        // 触发 close 事件
        this._emit('close', event);
        // 尝试重连
        if (this.reconnect && this.currentReconnectAttempts < this.reconnectAttempts) {
            this.currentReconnectAttempts++;
            console.log(`🔄 尝试重连 (${this.currentReconnectAttempts}/${this.reconnectAttempts})...`);
            this.reconnectTimer = setTimeout(() => {
                this._createWebSocket();
            }, this.reconnectInterval);
        }
        else if (this.currentReconnectAttempts >= this.reconnectAttempts) {
            console.error('❌ 达到最大重连次数，停止重连');
        }
    }
    /**
     * 触发事件
     */
    _emit(event, data) {
        const handlers = this.eventHandlers.get(event);
        if (handlers) {
            handlers.forEach(handler => {
                try {
                    handler(data);
                }
                catch (error) {
                    console.error(`事件处理器错误 [${event}]:`, error);
                }
            });
        }
    }
    /**
     * 启动心跳
     */
    _startHeartbeat() {
        this._stopHeartbeat();
        this.heartbeatTimer = setInterval(() => {
            if (this.isConnected()) {
                console.log('💓 发送心跳');
                this.send(this.heartbeatMessage);
            }
        }, this.heartbeatInterval);
    }
    /**
     * 停止心跳
     */
    _stopHeartbeat() {
        if (this.heartbeatTimer) {
            clearInterval(this.heartbeatTimer);
            this.heartbeatTimer = null;
        }
    }
    /**
     * 发送队列中的消息
     */
    _sendQueuedMessages() {
        if (this.messageQueue.length > 0) {
            console.log(`📤 发送队列中的 ${this.messageQueue.length} 条消息`);
            while (this.messageQueue.length > 0) {
                const message = this.messageQueue.shift();
                if (message) {
                    this.send(message);
                }
            }
        }
    }
}

export { WebSocketManager };
