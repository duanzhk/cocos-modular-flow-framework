import { IWebSocketManager, WebSocketConfig } from "../core";
/**
 * WebSocket 管理器实现类
 *
 * 功能特性：
 * 1. 自动重连：连接断开后自动尝试重连
 * 2. 心跳检测：定期发送心跳保持连接
 * 3. 事件管理：统一的事件监听和触发
 * 4. 消息队列：连接断开时缓存消息，重连后自动发送
 */
export declare class WebSocketManager implements IWebSocketManager {
    private ws;
    private url;
    private protocols?;
    private reconnect;
    private reconnectInterval;
    private reconnectAttempts;
    private currentReconnectAttempts;
    private heartbeat;
    private heartbeatInterval;
    private heartbeatMessage;
    private heartbeatTimer;
    private eventHandlers;
    private messageQueue;
    private reconnectTimer;
    initialize(): void;
    dispose(): void;
    /**
     * 连接 WebSocket
     */
    connect(url: string, protocols?: string | string[]): void;
    /**
     * 断开连接
     */
    disconnect(code?: number, reason?: string): void;
    /**
     * 发送消息
     * 支持多种数据类型：
     * - string: 直接发送
     * - object: 自动转换为 JSON 字符串
     * - ArrayBuffer: 发送二进制数据
     * - Blob: 发送文件数据
     */
    send(data: string | ArrayBuffer | Blob | object): void;
    /**
     * 检查是否已连接
     */
    isConnected(): boolean;
    /**
     * 获取连接状态
     */
    getReadyState(): number;
    /**
     * 注册事件监听
     */
    on(event: 'open' | 'message' | 'error' | 'close', handler: Function): void;
    /**
     * 移除事件监听
     */
    off(event: 'open' | 'message' | 'error' | 'close', handler?: Function): void;
    /**
     * 配置 WebSocket
     */
    configure(config: Partial<WebSocketConfig>): void;
    /**
     * 创建 WebSocket 连接
     */
    private _createWebSocket;
    /**
     * 连接成功
     */
    private _onOpen;
    /**
     * 收到消息
     */
    private _onMessage;
    /**
     * 连接错误
     */
    private _onError;
    /**
     * 连接关闭
     */
    private _onClose;
    /**
     * 触发事件
     */
    private _emit;
    /**
     * 启动心跳
     */
    private _startHeartbeat;
    /**
     * 停止心跳
     */
    private _stopHeartbeat;
    /**
     * 发送队列中的消息
     */
    private _sendQueuedMessages;
}
