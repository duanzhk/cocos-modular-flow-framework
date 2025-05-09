import { ListenerHandler, ToAnyIndexKey, OnListenerResult, IEventManager, OnListener, IEventMsgKey } from "../core/Api";
export declare class Broadcaster<MsgKeyType extends IEventMsgKey, ValueType = any, ResultType = any> implements IEventManager<MsgKeyType, ValueType, ResultType> {
    private _persistBrodcastMap;
    private _listenerHandlerMap;
    private _stickBrodcastMap;
    private _unuseHandlers;
    constructor();
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
    on<keyType extends keyof MsgKeyType>(key: keyType, listener: OnListener<ValueType[ToAnyIndexKey<keyType, ValueType>], ResultType[ToAnyIndexKey<keyType, ResultType>]>, context?: any, args?: any[]): void;
    on<keyType extends keyof MsgKeyType>(handler: ListenerHandler<keyType, ValueType, ResultType> | ListenerHandler<keyType, ValueType, ResultType>[]): void;
    /**
     * 注册事件，只监听一次
     * @param key 事件名
     * @param listener 监听回调
     * @param context 上下文
     * @param args 透传参数
     *
     */
    once<keyType extends keyof MsgKeyType>(key: keyType, listener: OnListener<ValueType[ToAnyIndexKey<keyType, ValueType>], ResultType[ToAnyIndexKey<keyType, ResultType>]>, context?: any, args?: any[]): void;
    once<keyType extends keyof MsgKeyType>(handler: ListenerHandler<keyType, ValueType, ResultType> | ListenerHandler<keyType, ValueType, ResultType>[]): void;
    /**
     * 注销指定监听
     * @param key 事件名
     * @param listener 监听回调
     * @return this
     */
    off<keyType extends keyof MsgKeyType>(key: keyType, listener: OnListener<ValueType[ToAnyIndexKey<keyType, ValueType>], ResultType[ToAnyIndexKey<keyType, ResultType>]>): this;
    /**
     * 注销所有监听
     * @param key
     * @param context
     */
    offAll(): void;
    offAll<keyType extends keyof MsgKeyType>(key: keyType): void;
    offAll(context: any): void;
    /**
     * 广播
     *
     * @param key 消息类型
     * @param data 消息携带的数据
     * @param callback
     * @param persistence 是否持久化消息类型。持久化的消息可以在任意时刻通过 getPersistentValue(key) 获取最后一次被持久化的数据。
     */
    dispatch<keyType extends keyof MsgKeyType>(key: keyType, data?: ValueType[ToAnyIndexKey<keyType, ValueType>], callback?: OnListenerResult<ResultType[ToAnyIndexKey<keyType, ResultType>]>, persistence?: boolean): void;
    /**
     * 广播一条粘性消息。如果广播系统中没有注册该类型的接收者，本条信息将被滞留在系统中，否则等效dispatch方法。
     * 可以使用removeStickyBroadcast移除存在的粘性广播。
     *
     * @param key 消息类型
     * @param data 消息携带的数据
     * @param callback
     * @param persistence 是否持久化消息类型。持久化的消息可以在任意时刻通过 getPersistentValue(key) 获取最后一次被持久化的数据。
     */
    dispatchSticky<keyType extends keyof MsgKeyType>(key: keyType, data?: ValueType[ToAnyIndexKey<keyType, ValueType>], callback?: OnListenerResult<ResultType[ToAnyIndexKey<keyType, ResultType>]>, persistence?: boolean): void;
    /**
     * 移除指定的粘性广播
     *
     * @param key
     */
    removeStickyBroadcast(key: keyof MsgKeyType): void;
    /**
     * 事件注册是否被注册
     * @param key
     */
    isRegistered(key: keyof MsgKeyType): boolean;
    /**
     * 获取被持久化的消息。ps:相同key的持久化广播会被覆盖。
     * @param key
     */
    getPersistentValue<keyType extends keyof MsgKeyType>(key: keyType): ValueType[ToAnyIndexKey<keyType, ValueType>] | undefined;
    /**
    * 销毁广播系统
    */
    dispose(): void;
}
