/**
 * 全局类型声明 - 由业务层通过 .d.ts 扩展
 * 用于泛型约束的类型推断
 */
declare global {
    interface ModelRegistry {
    }
    interface ManagerRegistry {
    }
    interface UIRegistry {
    }
}
/**
 * 核心接口 - 管理 Model 和 Manager 的生命周期
 *
 * 类型推断由业务层的全局类型声明提供
 */
export interface ICore {
    /**
     * 获取 Model 实例
     * @param modelClass Model 类构造函数
     * @returns Model 实例（类型由泛型参数推断）
     * @example
     * ```typescript
     * const userModel = core.getModel(UserModel);
     * ```
     */
    getModel<T extends keyof ModelRegistry>(modelClass: T): InstanceType<ModelRegistry[T]>;
    /**
     * 获取 Manager 实例
     * @param managerClass Manager 类构造函数
     * @returns Manager 实例（类型由泛型参数推断）
     * @example
     * ```typescript
     * const gameManager = core.getManager(GameManager);
     * ```
     */
    getManager<T extends keyof ManagerRegistry>(managerClass: T): InstanceType<ManagerRegistry[T]>;
}
/**
 * Model 基接口 - 数据模型
 */
export interface IModel {
    /** 初始化 */
    initialize(): void;
}
/**
 * Manager 基接口 - 业务逻辑管理器
 */
export interface IManager {
    /** 初始化 */
    initialize(): void;
    /** 销毁 */
    dispose(): void;
}
/**
 * UI打开选项
 */
export interface UIOpenConfig {
    /** 是否显示等待视图 */
    showLoading?: boolean;
    /** 是否可点击遮罩关闭 */
    clickToCloseMask?: boolean;
    /** 自定义参数 */
    args?: any;
}
/**
 * View 基接口 - 视图生命周期
 */
export interface IView {
    /** 进入视图 */
    onEnter(args?: UIOpenConfig): void;
    /** 退出视图 */
    onExit(): void;
    /** 暂停视图（被其他视图覆盖） */
    onPause(): void;
    /** 恢复视图（从暂停状态恢复） */
    onResume(): void;
    /** 进入动画（可选） */
    onEnterAnimation?(): Promise<void>;
    /** 退出动画（可选） */
    onExitAnimation?(): Promise<void>;
}
/**
 * UI 管理器接口 - 管理视图的打开、关闭和栈操作
 *
 * 注意：open 和 openAndPush 的返回类型由全局类型声明提供
 */
export interface IUIManager {
    /** 打开视图 */
    open<T extends keyof UIRegistry>(viewClass: T, args?: any): Promise<InstanceType<UIRegistry[T]>>;
    /** 关闭视图 */
    close<T extends keyof UIRegistry>(viewClass: T): Promise<void>;
    /** 打开视图并入栈 */
    openAndPush<T extends keyof UIRegistry>(viewClass: T, group: string, args?: any): Promise<InstanceType<UIRegistry[T]>>;
    /** 关闭栈顶视图并弹出 */
    closeAndPop(group: string, destroy?: boolean): Promise<void>;
    /** 获取栈顶视图 */
    getTopView(): IView | undefined;
    /** 清空视图栈 */
    clearStack(group: string, destroy?: boolean): void;
    /** 关闭所有视图 */
    closeAll(destroy?: boolean): void;
}
/**
 * 资源管理器接口
 */
export interface IResManager {
}
/**
 * HTTP 请求配置
 */
export interface HttpRequestOptions {
    /** 请求 URL */
    url: string;
    /** HTTP 方法 */
    method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH' | 'HEAD' | 'OPTIONS';
    /** 请求头 */
    headers?: Record<string, string>;
    /** URL 参数 */
    params?: Record<string, any>;
    /** 请求体数据 */
    data?: any;
    /** 超时时间（毫秒） */
    timeout?: number;
}
/**
 * HTTP 管理器接口 - 处理 HTTP 请求
 */
export interface IHttpManager extends IManager {
    /** GET 请求 */
    get<T = any>(url: string, params?: Record<string, any>, headers?: Record<string, string>): Promise<T>;
    /** POST 请求 */
    post<T = any>(url: string, data?: any, headers?: Record<string, string>): Promise<T>;
    /** PUT 请求 */
    put<T = any>(url: string, data?: any, headers?: Record<string, string>): Promise<T>;
    /** DELETE 请求 */
    delete<T = any>(url: string, params?: Record<string, any>, headers?: Record<string, string>): Promise<T>;
    /** 通用请求 */
    request<T = any>(options: HttpRequestOptions): Promise<T>;
}
/**
 * WebSocket 配置
 */
export interface WebSocketConfig {
    /** WebSocket URL */
    url: string;
    /** 协议 */
    protocols?: string | string[];
    /** 是否自动重连 */
    reconnect?: boolean;
    /** 重连间隔（毫秒） */
    reconnectInterval?: number;
    /** 重连尝试次数 */
    reconnectAttempts?: number;
    /** 是否启用心跳 */
    heartbeat?: boolean;
    /** 心跳间隔（毫秒） */
    heartbeatInterval?: number;
    /** 心跳消息 */
    heartbeatMessage?: string;
}
/**
 * WebSocket 管理器接口 - 管理 WebSocket 连接
 */
export interface IWebSocketManager extends IManager {
    /** 连接 WebSocket */
    connect(url: string, protocols?: string | string[]): void;
    /** 断开连接 */
    disconnect(code?: number, reason?: string): void;
    /** 发送数据 */
    send(data: string | ArrayBuffer | Blob | object): void;
    /** 是否已连接 */
    isConnected(): boolean;
    /** 监听事件 */
    on(event: 'open' | 'message' | 'error' | 'close', handler: Function): void;
    /** 移除事件监听 */
    off(event: 'open' | 'message' | 'error' | 'close', handler?: Function): void;
    /** 获取连接状态 */
    getReadyState(): number;
    /** 配置 WebSocket */
    configure(config: Partial<WebSocketConfig>): void;
}
/**
 * 事件消息键类型（由业务层扩展）
 */
export interface IEventMsgKey {
}
/**
 * 将索引类型转换为任意类型的索引类型
 */
export type ToAnyIndexKey<IndexKey, AnyType> = IndexKey extends keyof AnyType ? IndexKey : keyof AnyType;
/**
 * 监听器结果回调
 */
export type OnListenerResult<T = any> = (data?: T, callBack?: any) => void;
/**
 * 监听器函数
 */
export type OnListener<T = any, K = any> = (value?: T, callBack?: OnListenerResult<K>, ...args: any[]) => void;
/**
 * 监听器处理器配置
 */
export type ListenerHandler<keyType extends keyof any = any, ValueType = any, ResultType = any> = {
    /** 事件键 */
    key: keyType;
    /** 监听函数 */
    listener: OnListener<ValueType[ToAnyIndexKey<keyType, ValueType>], ResultType[ToAnyIndexKey<keyType, ResultType>]>;
    /** 上下文 */
    context?: any;
    /** 额外参数 */
    args?: any[];
};
/**
 * 事件管理器接口 - 事件的发布订阅
 */
export interface IEventManager<MsgKeyType extends IEventMsgKey = IEventMsgKey, ValueType = any, ResultType = any> {
    /** 监听事件 */
    on<keyType extends keyof MsgKeyType>(keyOrHandler: keyType | ListenerHandler<keyType, ValueType, ResultType> | ListenerHandler<keyType, ValueType, ResultType>[], listener?: OnListener<ValueType[ToAnyIndexKey<keyType, ValueType>], ResultType[ToAnyIndexKey<keyType, ResultType>]>, context?: any, args?: any[]): void;
    /** 监听一次事件 */
    once<keyType extends keyof MsgKeyType>(keyOrHandler: keyType | ListenerHandler<keyType, ValueType, ResultType> | ListenerHandler<keyType, ValueType, ResultType>[], listener?: OnListener<ValueType[ToAnyIndexKey<keyType, ValueType>], ResultType[ToAnyIndexKey<keyType, ResultType>]>, context?: any, args?: any[]): void;
    /** 移除事件监听 */
    off<keyType extends keyof MsgKeyType>(key: keyType, listener: OnListener<ValueType[ToAnyIndexKey<keyType, ValueType>], ResultType[ToAnyIndexKey<keyType, ResultType>]>): void;
    /** 移除所有事件监听 */
    offAll<keyType extends keyof MsgKeyType>(key?: keyType, context?: any): void;
    /** 派发事件 */
    dispatch<keyType extends keyof MsgKeyType>(key: keyType, data?: ValueType[ToAnyIndexKey<keyType, ValueType>], callback?: OnListenerResult<ResultType[ToAnyIndexKey<keyType, ResultType>]>, persistence?: boolean): void;
    /** 派发粘性事件（自动保存） */
    dispatchSticky<keyType extends keyof MsgKeyType>(key: keyType, data?: ValueType[ToAnyIndexKey<keyType, ValueType>], callback?: OnListenerResult<ResultType[ToAnyIndexKey<keyType, ResultType>]>, persistence?: boolean): void;
    /** 移除粘性广播 */
    removeStickyBroadcast(key: keyof MsgKeyType): void;
    /** 检查事件是否已注册 */
    isRegistered(key: keyof MsgKeyType): boolean;
    /** 获取持久化的值 */
    getPersistentValue<keyType extends keyof MsgKeyType>(key: keyType): ValueType[ToAnyIndexKey<keyType, ValueType>] | undefined;
    /** 销毁 */
    dispose(): void;
}
/**
 * 红点管理器接口 - 管理 UI 红点提示
 */
export interface IRedDotManager extends IManager {
    /** 设置红点数量 */
    setCount(nodeId: string, count: number): void;
    /** 获取红点数量 */
    getCount(nodeId: string): number;
    /** 监听红点变化 */
    on(path: string, listener: Function): void;
    /** 移除红点监听 */
    off(path: string, listener: Function): void;
}
