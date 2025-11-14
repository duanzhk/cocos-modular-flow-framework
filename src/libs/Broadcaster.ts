import { ObjectUtil } from "../utils/ObjectUtil";
import { StringUtil } from "../utils/StringUtil";

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
export type OnListenerResult<T = any> = (data?: T, callBack?: any) => void

/**
 * 监听器函数
 */
export type OnListener<T = any, K = any> = (value?: T, callBack?: OnListenerResult<K>, ...args: any[]) => void

/**
 * 监听器处理器配置
 */
export type ListenerHandler = {
    /** 事件键 */
    key: keyof IEventMsgKey
    /** 监听函数 */
    listener: OnListener,
    /** 上下文 */
    context?: any,
    /** 额外参数 */
    args?: any[],
}

type ListenerHandlerOptions = ListenerHandler & { once?: boolean }

// 广播参数结构
type BroadcastHandler = {
    key: keyof IEventMsgKey,
    data?: any,
    callback?: OnListenerResult,
    persistence?: boolean
}

/**
 * 事件广播器 - 非泛型版本
 * 提供事件的注册、派发、粘性广播等功能
 */
export class Broadcaster {
    //用于持久化广播事件的数据
    private _persistBrodcastMap!: { [key: string]: any };
    //用于存储监听事件数据
    private _listenerHandlerMap!: { [key: string]: ListenerHandlerOptions[] };
    //用于存储粘性广播的数据
    private _stickBrodcastMap!: { [key: string]: BroadcastHandler[] };
    //对象池复用，用于缓存未使用的储监听事件数据的对象
    private _unuseHandlers!: ListenerHandler[]

    constructor() {
        this.initialize();
    }

    public initialize(): void {
        this._persistBrodcastMap = {};
        this._listenerHandlerMap = {};
        this._stickBrodcastMap = {};
        this._unuseHandlers = [];
    }

    /**
     * 销毁广播系统
     */
    public dispose() {
        //@ts-ignore
        this._listenerHandlerMap = undefined;
        //@ts-ignore
        this._stickBrodcastMap = undefined;
        //@ts-ignore
        this._persistBrodcastMap = undefined;
    }

    /**
     * 回收handler
     * @param handler 
     */
    private _recoverHandler(handler: ListenerHandler) {
        if (!handler) return
        //@ts-ignore
        handler.listener = undefined;
        //@ts-ignore
        handler.key = undefined;
        //@ts-ignore
        handler.args = undefined;
        //@ts-ignore
        handler.context = undefined;
        this._unuseHandlers.push(handler);
    }

    //检查是否有有效的监听器，如果没有就删除这个key
    private _checkListenerValidity(key: string) {
        if (!key) return;
        const handlers = this._listenerHandlerMap[key]
        if (handlers && handlers.length > 0) {
            return;
        }
        delete this._listenerHandlerMap[key];
    }

    /**
     * 添加广播监听，如果有粘性广播就会执行粘性广播
     * @param handler 
     */
    private _addHandler(handler: ListenerHandlerOptions) {
        const handlerMap = this._listenerHandlerMap;
        const msgKey = handler.key as string;
        const handlers = handlerMap[msgKey] || []
        handlers.push(handler);
        handlerMap[msgKey] = handlers;
        //检查是否有粘性广播
        const stickyHandlers = this._stickBrodcastMap[msgKey];
        if (stickyHandlers) {
            //需要把执行过的粘性广播删除，防止注册时再次执行
            this.removeStickyBroadcast(handler.key);
            for (let i = 0; i < stickyHandlers.length; i++) {
                let e: BroadcastHandler = stickyHandlers[i];
                this.dispatch(e.key, e.data, e.callback, e.persistence);
            }
        }
    }

    /**
     * 将广播的数据作为参数，执行广播监听器的逻辑
     * @param handler 广播监听器
     * @param data 广播携带的数据
     * @param callback 回调函数
     */
    private _runHandler(handler: ListenerHandler, data?: any, callback?: OnListenerResult) {
        if (!handler.listener) return;

        let args: any[] = [];
        if (data !== undefined) {
            args.push(data);
        }
        if (callback) {
            args.push(callback);
        }
        //如果有透传参数，则添加到参数列表中
        if (handler.args && handler.args.length > 0) {
            args.push(...handler.args);
        }
        return handler.listener.apply(handler.context, args);
    }

    private _onHander(
        keyOrHandler: keyof IEventMsgKey | ListenerHandler | ListenerHandler[],
        listener?: OnListener,
        context?: any,
        once?: boolean,
        args?: any[]
    ) {
        if (typeof keyOrHandler === "string") {
            if (!listener) return;
            let handlerObj: ListenerHandlerOptions = this._unuseHandlers.pop() || ({} as ListenerHandlerOptions)
            handlerObj.key = keyOrHandler as keyof IEventMsgKey;
            handlerObj.listener = listener;
            handlerObj.context = context;
            handlerObj.once = once;
            handlerObj.args = args;
            this._addHandler(handlerObj);
        } else {
            if (ObjectUtil.isArray(keyOrHandler)) {
                const handlers: ListenerHandler[] = keyOrHandler as ListenerHandler[];
                for (let i = 0; i < handlers.length; i++) {
                    this._addHandler(handlers[i]);
                }
            } else {
                this._addHandler(keyOrHandler as ListenerHandler);
            }
        }
    }

    /**
     * 注册事件
     * @param key 事件名
     * @param listener 监听回调
     * @param context 上下文
     * @param args 透传参数
     * 
     */
    public on<K extends keyof IEventMsgKey>(
        key: K,
        listener: OnListener,
        context?: any,
        args?: any[]
    ): void
    public on(
        handler: ListenerHandler | ListenerHandler[]
    ): void
    public on(
        keyOrHandler: keyof IEventMsgKey | ListenerHandler | ListenerHandler[],
        listener?: OnListener,
        context?: any,
        args?: any[]
    ) {
        this._onHander(keyOrHandler, listener, context, false, args);
    }

    /**
     * 注册事件，只监听一次
     * @param key 事件名
     * @param listener 监听回调
     * @param context 上下文
     * @param args 透传参数
     * 
     */
    public once<K extends keyof IEventMsgKey>(
        key: K,
        listener: OnListener,
        context?: any,
        args?: any[]
    ): void
    public once(
        handler: ListenerHandler | ListenerHandler[]
    ): void
    public once(
        keyOrHandler: keyof IEventMsgKey | ListenerHandler | ListenerHandler[],
        listener?: OnListener,
        context?: any,
        args?: any[]
    ) {
        this._onHander(keyOrHandler, listener, context, true, args);
    }

    /**
     * 注销指定监听
     * @param key 事件名
     * @param listener 监听回调
     * @return this
     */
    public off<K extends keyof IEventMsgKey>(
        key: K,
        listener: OnListener
    ) {
        let handlers: ListenerHandler[] = this._listenerHandlerMap[key as string]
        if (!handlers) {
            throw new Error(`没有找到key为${key.toString()}的事件`);
        }

        const index = handlers.findIndex((handler: ListenerHandler) => handler.listener === listener)
        const handler = handlers.fastRemoveAt(index)
        this._recoverHandler(handler)

        this._checkListenerValidity(key as string);
        return this;
    }

    /**
     * 注销所有监听
     * @param key 
     * @param context 
     */
    public offAll(): void
    public offAll<K extends keyof IEventMsgKey>(key: K): void
    public offAll(context: any): void
    public offAll(key?: keyof IEventMsgKey, context?: any) {
        const handlerMap = this._listenerHandlerMap;
        //指定key或全局清除
        const processHandler = (
            handlers: ListenerHandler[],
            msgKey: string,
            hasContext: boolean
        ) => {
            for (let i = handlers.length - 1; i >= 0; i--) {
                const shouldRemove = !hasContext || handlers[i].context === context;
                shouldRemove && this._recoverHandler(handlers.fastRemoveAt(i));
            }
            this._checkListenerValidity(msgKey);
        };

        if (key) { //清除指定key的所有监听
            const keyStr = key as string;
            if (!handlerMap[keyStr]) {
                throw new Error(`没有找到key为${key.toString()}的事件`);
            }
            processHandler(handlerMap[keyStr], keyStr, false);
        } else { //处理全局或上下文清除
            const isGlobalClear = !context;
            Object.keys(handlerMap).forEach((msgKey) => {
                processHandler(handlerMap[msgKey], msgKey, !isGlobalClear);
            });

            isGlobalClear && (this._listenerHandlerMap = {});
        }
    }

    /**
     * 广播
     * 
     * @param key 消息类型
     * @param data 消息携带的数据
     * @param callback 
     * @param persistence 是否持久化消息类型。持久化的消息可以在任意时刻通过 getPersistentValue(key) 获取最后一次被持久化的数据。
     */
    public dispatch<K extends keyof IEventMsgKey>(
        key: K,
        data?: any,
        callback?: OnListenerResult,
        persistence?: boolean
    ) {
        const keyStr = key as string;
        if (StringUtil.isEmptyOrWhiteSpace(keyStr)) {
            throw new Error('广播的key不能为空');
        }
        //持久化
        if (persistence) {
            this._persistBrodcastMap[keyStr] = data;
        }

        const handlers = this._listenerHandlerMap[keyStr];
        if (!handlers || handlers.length == 0) {
            console.warn(`没有注册广播：${keyStr}`);
            return
        };
        for (let i = handlers.length - 1; i >= 0; i--) {
            let handler: ListenerHandlerOptions = handlers[i];
            this._runHandler(handler, data, callback)
            if (handler.once) {
                this.off(key, handler.listener)
            }
        }
        this._checkListenerValidity(keyStr);
    }

    /**
     * 广播一条粘性消息。如果广播系统中没有注册该类型的接收者，本条信息将被滞留在系统中，否则等效dispatch方法。
     * 可以使用removeStickyBroadcast移除存在的粘性广播。
     * 
     * @param key 消息类型
     * @param data 消息携带的数据
     * @param callback 
     * @param persistence 是否持久化消息类型。持久化的消息可以在任意时刻通过 getPersistentValue(key) 获取最后一次被持久化的数据。
     */
    public dispatchSticky<K extends keyof IEventMsgKey>(
        key: K,
        data?: any,
        callback?: OnListenerResult,
        persistence?: boolean
    ) {
        const keyStr = key as string;
        if (StringUtil.isEmptyOrWhiteSpace(keyStr)) {
            throw new Error('广播的key不能为空');
        }
        //如果已经有了监听者，则直接广播
        if (this._listenerHandlerMap[keyStr]) {
            this.dispatch(key, data, callback, persistence);
            return
        }
        //注意：??= 在ES2021(TypeScript版本4.4)引入
        (this._stickBrodcastMap[keyStr] ??= []).push({
            key: key,
            data: data,
            callback: callback,
            persistence: persistence
        });
        //如果persistence=true需要先持久化，不能等到通过on->broadcast的时候再持久化。
        //因为中途可能会有removeStickyBroadcast操作，那么on就不会调用broadcast，造成持久化无效bug。
        if (persistence) {
            this._persistBrodcastMap[keyStr] = data;
        }
    }

    /**
     * 移除指定的粘性广播
     *
     * @param key 
     */
    public removeStickyBroadcast<K extends keyof IEventMsgKey>(key: K) {
        const keyStr = key as string;
        if (this._stickBrodcastMap[keyStr]) {
            delete this._stickBrodcastMap[keyStr];
        }
    }

    /**
     * 事件注册是否被注册
     * @param key
     */
    public isRegistered<K extends keyof IEventMsgKey>(key: K) {
        return !!this._listenerHandlerMap[key as string]
    }

    /**
     * 获取被持久化的消息。ps:相同key的持久化广播会被覆盖。
     * @param key 
     */
    public getPersistentValue<K extends keyof IEventMsgKey>(key: K): any | undefined {
        return this._persistBrodcastMap[key as string];
    }

}