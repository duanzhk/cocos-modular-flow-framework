/**
 * 事件消息键类型（由业务层扩展）
 * 使用字符串索引定义事件名和对应的数据类型
 *
 * @example
 * ```typescript
 * // 在项目中扩展事件类型
 * import 'dzkcc-mflow/libs';  // 👈 这一行很重要！没有这行表示重定义，这行表示扩展
 * declare module 'dzkcc-mflow/libs' {
 *     interface IEventMsgKey {
 *         'gameStart': { level: number };
 *         'scoreChanged': number;
 *         'userLogin': { userId: number; name: string };
 *     }
 * }
 *
 * // 使用时会有类型检查
 * mf.event.on('gameStart', (data) => {
 *     console.log(data.level); // ✅ 有类型提示
 * });
 *
 * mf.event.dispatch('scoreChanged', 100); // ✅ 正确
 * mf.event.dispatch('unknownEvent', {}); // ❌ 类型错误：事件名不存在
 * ```
 */
export interface IEventMsgKey {
    [eventName: string]: any;
}
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
export type ListenerHandler = {
    /** 事件键 */
    key: keyof IEventMsgKey;
    /** 监听函数 */
    listener: OnListener;
    /** 上下文 */
    context?: any;
    /** 额外参数 */
    args?: any[];
};
/**
 * 事件广播器 - 非泛型版本
 * 提供事件的注册、派发、粘性广播等功能
 */
export declare class Broadcaster {
    private _persistBrodcastMap;
    private _listenerHandlerMap;
    private _stickBrodcastMap;
    private _unuseHandlers;
    constructor();
    initialize(): void;
    /**
     * 销毁广播系统
     */
    dispose(): void;
    /**
     * 回收handler
     * @param handler
     */
    private _recoverHandler;
    private _checkListenerValidity;
    /**
     * 添加广播监听，如果有粘性广播就会执行粘性广播
     * @param handler
     */
    private _addHandler;
    /**
     * 将广播的数据作为参数，执行广播监听器的逻辑
     * @param handler 广播监听器
     * @param data 广播携带的数据
     * @param callback 回调函数
     */
    private _runHandler;
    private _onHander;
    /**
     * 注册事件
     * @param key 事件名
     * @param listener 监听回调
     * @param context 上下文
     * @param args 透传参数
     *
     */
    on<K extends keyof IEventMsgKey>(key: K, listener: OnListener, context?: any, args?: any[]): void;
    on(handler: ListenerHandler | ListenerHandler[]): void;
    /**
     * 注册事件，只监听一次
     * @param key 事件名
     * @param listener 监听回调
     * @param context 上下文
     * @param args 透传参数
     *
     */
    once<K extends keyof IEventMsgKey>(key: K, listener: OnListener, context?: any, args?: any[]): void;
    once(handler: ListenerHandler | ListenerHandler[]): void;
    /**
     * 注销指定监听
     * @param key 事件名
     * @param listener 监听回调
     * @return this
     */
    off<K extends keyof IEventMsgKey>(key: K, listener: OnListener): this;
    /**
     * 注销所有监听
     * @param key
     * @param context
     */
    offAll(): void;
    offAll<K extends keyof IEventMsgKey>(key: K): void;
    offAll(context: any): void;
    /**
     * 广播
     *
     * @param key 消息类型
     * @param data 消息携带的数据
     * @param callback
     * @param persistence 是否持久化消息类型。持久化的消息可以在任意时刻通过 getPersistentValue(key) 获取最后一次被持久化的数据。
     */
    dispatch<K extends keyof IEventMsgKey>(key: K, data?: any, callback?: OnListenerResult, persistence?: boolean): void;
    /**
     * 广播一条粘性消息。如果广播系统中没有注册该类型的接收者，本条信息将被滞留在系统中，否则等效dispatch方法。
     * 可以使用removeStickyBroadcast移除存在的粘性广播。
     *
     * @param key 消息类型
     * @param data 消息携带的数据
     * @param callback
     * @param persistence 是否持久化消息类型。持久化的消息可以在任意时刻通过 getPersistentValue(key) 获取最后一次被持久化的数据。
     */
    dispatchSticky<K extends keyof IEventMsgKey>(key: K, data?: any, callback?: OnListenerResult, persistence?: boolean): void;
    /**
     * 移除指定的粘性广播
     *
     * @param key
     */
    removeStickyBroadcast<K extends keyof IEventMsgKey>(key: K): void;
    /**
     * 事件注册是否被注册
     * @param key
     */
    isRegistered<K extends keyof IEventMsgKey>(key: K): boolean;
    /**
     * 获取被持久化的消息。ps:相同key的持久化广播会被覆盖。
     * @param key
     */
    getPersistentValue<K extends keyof IEventMsgKey>(key: K): any | undefined;
}
