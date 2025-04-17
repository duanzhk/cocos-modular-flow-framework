import { ObjectUtil } from "../utils/ObjectUtil";
import { StringUtil } from "../utils/StringUtil";

// 将索引类型转换为任意类型的索引类型
type ToAnyIndexKey<IndexKey, AnyType> = IndexKey extends keyof AnyType ? IndexKey : keyof AnyType;

// 监听方法再回调给广播
type OnListenerResult<T = any> = (data?: T, callBack?: any) => void
// 监听方法
type OnListener<T = any, K = any> = (value?: T, callBack?: OnListenerResult<K>, ...args: any[]) => void
// 监听参数结构
type ListenerHandler<keyType extends keyof any = any, ValueType = any, ResultType = any> = {
    key: keyType
    listener: OnListener<ValueType[ToAnyIndexKey<keyType, ValueType>], ResultType[ToAnyIndexKey<keyType, ResultType>]>,
    context?: any,
    args?: any[],
}
type ListenerHandlerOptions<keyType extends keyof any = any> = ListenerHandler<keyType> & { once?: boolean }
// 广播参数结构
type BroadcastHandler<keyType extends keyof any = any, ValueType = any, ResultType = any> = {
    key: keyType,
    data?: ValueType[ToAnyIndexKey<keyType, ValueType>],
    callback?: OnListenerResult<ResultType[ToAnyIndexKey<keyType, ResultType>]>,
    persistence?: boolean
}

// 消息类型模板
interface IMsgKey { }
interface IMsgValueType { }
interface IResultType { }
interface IBroadcast<MsgKeyType = any, ValueType = any, ResultType = any> {
    // /**
    //  * 消息key
    //  */
    // keys: MsgKeyType; //不暴露了，直接定义在实体类中
    /**
     * 注册事件，可以注册多个
     * @param key 事件名
     * @param listener 监听回调
     * @param context 上下文
     * @param args 透传参数
     * @param once 是否监听一次
     *
     */
    on<keyType extends keyof MsgKeyType = any>(
        handler: keyType | ListenerHandler<keyType, ValueType, ResultType> | ListenerHandler<keyType, ValueType, ResultType>[],
        listener?: OnListener<ValueType[ToAnyIndexKey<keyType, ValueType>], ResultType[ToAnyIndexKey<keyType, ResultType>]>,
        context?: any, once?: boolean, args?: any[]): void;
    /**
     * 有没有这个事件注册
     * @param key 
     */
    has(key: keyof MsgKeyType): boolean;
    /**
     * 注销同一个context的所有监听
     * @param context 
     */
    offAllByContext(context: any): void;
    /**
     * 注销指定事件的所有监听
     * @param key
     */
    offAll(key?: keyof MsgKeyType): void;
    /**
     * 注销监听
     * @param key 
     * @param listener 
     * @param context 
     * @param onceOnly 
     */
    off(key: keyof MsgKeyType, listener?: OnListener, onceOnly?: boolean): this;
    /**
     * 广播
     * @param key 事件名
     * @param value 数据
     * @param callback 回调
     * @param persistence 是否持久化数据
     */
    broadcast<keyType extends keyof MsgKeyType = any>(
        key: keyType, value?: ValueType[ToAnyIndexKey<keyType, ValueType>]
        , callback?: OnListenerResult<ResultType[ToAnyIndexKey<keyType, ResultType>]>, persistence?: boolean): void;
    /**
     * 广播一条 指定 [key] 的粘性消息
     * 如果广播系统中没有注册该类型的接收者，本条信息将被滞留在系统中。一旦有该类型接收者被注册，本条消息将会被立即发送给接收者
     * 如果系统中已经注册有该类型的接收者，本条消息将会被立即发送给接收者。
     *
     * @param key 消息类型
     * @param value 消息携带的数据。可以是任意类型或是null
     * @param callback 能够收到接收器返回的消息
     * @param persistence 是否持久化消息类型。持久化的消息可以在任意时刻通过 value(key) 获取当前消息的数据包。默认情况下，未持久化的消息类型在没有接收者的时候会被移除，而持久化的消息类型则不会。开发者可以通过 [clear] 函数来移除持久化的消息类型。
     */
    broadcastSticky<keyType extends keyof MsgKeyType = any>(
        key: keyType, value?: ValueType[ToAnyIndexKey<keyType, ValueType>],
        callback?: OnListenerResult<ResultType[ToAnyIndexKey<keyType, ResultType>]>, persistence?: boolean): void;
    /**
     * 取值
     * @param key
     */
    value<keyType extends keyof MsgKeyType = any>(key: keyType): ValueType[ToAnyIndexKey<keyType, ValueType>];
    /**
     * 销毁广播系统
     */
    dispose(): void;
}


export class Broadcaster<MsgKeyType extends IMsgKey, ValueType = any, ResultType = any>
    /*implements IBroadcast<MsgKeyType, ValueType, ResultType>*/ {

    //用于持久化广播事件的数据
    private _persistBrodcastMap: { [key in keyof MsgKeyType]: any };
    //用于存储监听事件数据
    private _listenerHandlerMap: { [key in keyof MsgKeyType]: ListenerHandlerOptions[] };
    //用于存储粘性广播的数据
    private _stickBrodcastMap: { [key in keyof MsgKeyType]: BroadcastHandler[] };
    //对象池复用，用于缓存未使用的储监听事件数据的对象
    private _unuseHandlers: ListenerHandler[]

    constructor() {
        this._persistBrodcastMap = {} as any;
        this._listenerHandlerMap = {} as any;
        this._stickBrodcastMap = {} as any;
        this._unuseHandlers = [];
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
        handler.args = undefined;
        handler.context = undefined;
        this._unuseHandlers.push(handler);
    }

    //检查是否有有效的监听器，如果没有就删除这个key
    private _checkLintenerValidity(key: keyof MsgKeyType) {
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
        const msgKey = handler.key as keyof MsgKeyType;
        const handlers = handlerMap[msgKey] || []
        handlers.push(handler);
        handlerMap[msgKey] = handlers;
        //检查是否有粘性广播
        const stickyHandlers = this._stickBrodcastMap[msgKey];
        if (stickyHandlers) {
            //需要把执行过的粘性广播删除，防止注册时再次执行
            this.removeStickyBroadcast(msgKey);
            for (let i = 0; i < stickyHandlers.length; i++) {
                let e: BroadcastHandler = stickyHandlers[i];
                this.broadcast(msgKey, e.data, e.callback, e.persistence);
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
        if (data) {
            args.push(data);
        }
        if (callback) {
            data.push(callback);
        }
        //如果有透传参数，则添加到参数列表中
        if (handler.args && handler.args.length > 0) {
            args.push(...handler.args);
        }
        return handler.listener.apply(handler.context, args);;
    }

    private _onHander<keyType extends keyof MsgKeyType>(
        keyOrHandler: keyType | ListenerHandler<keyType, ValueType, ResultType> | ListenerHandler<keyType, ValueType, ResultType>[],
        listener?: OnListener<ValueType[ToAnyIndexKey<keyType, ValueType>], ResultType[ToAnyIndexKey<keyType, ResultType>]>,
        context?: any,
        once?: boolean,
        args?: any[]
    ) {
        if (typeof keyOrHandler === "string") {
            if (!listener) return;
            let handlerObj: ListenerHandlerOptions = this._unuseHandlers.pop() || ({} as ListenerHandlerOptions)
            handlerObj.key = keyOrHandler;
            handlerObj.listener = listener;
            handlerObj.context = context;
            handlerObj.once = once;
            handlerObj.args = args;
            this._addHandler(handlerObj);
        } else {
            if (ObjectUtil.isArray(keyOrHandler)) {
                const handlers: ListenerHandler[] = keyOrHandler as any;
                for (let i = 0; i < handlers.length; i++) {
                    this._addHandler(handlers[i]);
                }
            } else {
                this._addHandler(keyOrHandler as any);
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
    public on<keyType extends keyof MsgKeyType>(
        key: keyType,
        listener: OnListener<ValueType[ToAnyIndexKey<keyType, ValueType>], ResultType[ToAnyIndexKey<keyType, ResultType>]>,
        context?: any,
        args?: any[]
    ): void
    public on<keyType extends keyof MsgKeyType>(
        handler: ListenerHandler<keyType, ValueType, ResultType> | ListenerHandler<keyType, ValueType, ResultType>[]
    ): void
    public on<keyType extends keyof MsgKeyType>(
        keyOrHandler: keyType | ListenerHandler<keyType, ValueType, ResultType> | ListenerHandler<keyType, ValueType, ResultType>[],
        listener?: OnListener<ValueType[ToAnyIndexKey<keyType, ValueType>], ResultType[ToAnyIndexKey<keyType, ResultType>]>,
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
    public once<keyType extends keyof MsgKeyType>(
        key: keyType,
        listener: OnListener<ValueType[ToAnyIndexKey<keyType, ValueType>], ResultType[ToAnyIndexKey<keyType, ResultType>]>,
        context?: any,
        args?: any[]
    ): void
    public once<keyType extends keyof MsgKeyType>(
        handler: ListenerHandler<keyType, ValueType, ResultType> | ListenerHandler<keyType, ValueType, ResultType>[]
    ): void
    public once<keyType extends keyof MsgKeyType>(
        keyOrHandler: keyType | ListenerHandler<keyType, ValueType, ResultType> | ListenerHandler<keyType, ValueType, ResultType>[],
        listener?: OnListener<ValueType[ToAnyIndexKey<keyType, ValueType>], ResultType[ToAnyIndexKey<keyType, ResultType>]>,
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
    public off<keyType extends keyof MsgKeyType>(
        key: keyType,
        listener: OnListener<ValueType[ToAnyIndexKey<keyType, ValueType>], ResultType[ToAnyIndexKey<keyType, ResultType>]>
    ) {
        let handlers: ListenerHandler[] = this._listenerHandlerMap[key]
        if (!handlers) {
            throw new Error(`没有找到key为${key.toString()}的事件`);
        }

        const index = handlers.findIndex((handler: ListenerHandler) => handler.listener === listener)
        const handler = handlers.fastRemoveAt(index)
        this._recoverHandler(handler)

        this._checkLintenerValidity(key);
        return this;
    }

    /**
     * 注销所有监听
     * @param key 
     * @param context 
     */
    public offAll(): void
    public offAll<keyType extends keyof MsgKeyType>(key: keyType): void
    public offAll(context: any): void
    public offAll<keyType extends keyof MsgKeyType>(key?: keyType, context?: any) {
        const handlerMap = this._listenerHandlerMap;
        //指定key或全局清除
        const processHandler = (
            handlers: ListenerHandler[],
            msgKey: keyType,
            hasContext: boolean
        ) => {
            for (let i = handlers.length - 1; i >= 0; i--) {
                const shouldRemove = !hasContext || handlers[i].context === context;
                shouldRemove && this._recoverHandler(handlers.fastRemoveAt(i));
            }
            this._checkLintenerValidity(msgKey);
        };

        if (key) { //清除指定key的所有监听
            if (!handlerMap[key]) {
                throw new Error(`没有找到key为${key.toString()}的事件`);
            }
            processHandler(handlerMap[key], key, false);
        } else { //处理全局或上下文清除
            const isGlobalClear = !context;
            Object.keys(handlerMap).forEach((msgKey) => {
                const k = msgKey as keyType;
                processHandler(handlerMap[k], k, !isGlobalClear);
            });

            isGlobalClear && (this._listenerHandlerMap = {} as any);
        }
    }

    /**
     * 广播
     * 
     * @param key 消息类型
     * @param data 消息携带的数据
     * @param callback 能够收到接收器返回的消息
     * @param persistence 是否持久化消息类型。持久化的消息可以在任意时刻通过 value(key) 获取当前消息的数据包。
     * 默认情况下，未持久化的消息类型在没有接收者的时候会被移除，而持久化的消息类型则不会。可以通过 [clear] 函数来移除持久化的消息类型。
     */
    public broadcast<keyType extends keyof MsgKeyType>(
        key: keyType,
        data?: ValueType[ToAnyIndexKey<keyType, ValueType>],
        callback?: OnListenerResult<ResultType[ToAnyIndexKey<keyType, ResultType>]>,
        persistence?: boolean
    ) {
        if (StringUtil.isEmptyOrWhiteSpace(key.toString())) {
            throw new Error('广播的key不能为空');
        }
        //持久化
        persistence ?? (this._persistBrodcastMap[key] = data)

        const handlers = this._listenerHandlerMap[key];
        if (!handlers || handlers.length == 0) {
            console.warn(`没有注册广播：${key.toString()}`);
            return
        };
        for (let i = handlers.length - 1; i >= 0; i--) {
            let handler: ListenerHandlerOptions = handlers[i];
            this._runHandler(handler, data, callback)
            if (handler.once) {
                this.off(key, handler.listener)
            }
        }
        this._checkLintenerValidity(key);
    }

    /**
     * 广播一条粘性消息。如果广播系统中没有注册该类型的接收者，本条信息将被滞留在系统中，否则等效broadcast。
     * 
     * @param key 消息类型
     * @param data 消息携带的数据
     * @param callback 能够收到接收器返回的消息
     * @param persistence 是否持久化消息类型。持久化的消息可以在任意时刻通过 value(key) 获取当前消息的数据包。
     * 默认情况下，未持久化的消息类型在没有接收者的时候会被移除，而持久化的消息类型则不会。可以通过 [clear] 函数来移除持久化的消息类型。
     */
    public broadcastSticky<keyType extends keyof MsgKeyType>(
        key: keyType,
        data?: ValueType[ToAnyIndexKey<keyType, ValueType>],
        callback?: OnListenerResult<ResultType[ToAnyIndexKey<keyType, ResultType>]>,
        persistence?: boolean
    ) {
        if (StringUtil.isEmptyOrWhiteSpace(key.toString())) {
            throw new Error('广播的key不能为空');
        }
        //如果已经有了监听者，则直接广播
        if (this._listenerHandlerMap[key]) {
            this.broadcast(key, data, callback, persistence);
            return
        }
        //注意：??= 在ES2021(TypeScript版本4.4)引入
        (this._stickBrodcastMap[key] ??= []).push({
            key: key,
            data: data,
            callback: callback,
            persistence: persistence
        });
        //如果persistence=true需要先持久化，不能等到通过on->broadcast的时候再持久化。
        //因为中途可能会有removeStickyBroadcast操作，那么on就不会调用broadcast，造成持久化无效bug。
        persistence ?? (this._persistBrodcastMap[key] = data)
    }

    /**
     * 移除指定的粘性广播
     *
     * @param key 
     */
    public removeStickyBroadcast(key: keyof MsgKeyType) {
        if (this._stickBrodcastMap[key]) {
            delete this._stickBrodcastMap[key];
        }
    }

    /**
     * 事件注册是否被注册
     * @param key
     */
    public isRegistered(key: keyof MsgKeyType) {
        return !!this._listenerHandlerMap[key]
    }

    /**
     * 获取被持久化的消息
     * @param key 
     */
    public getPersistentValue<keyType extends keyof MsgKeyType>(key: keyType): ValueType[ToAnyIndexKey<keyType, ValueType>] | undefined {
        return this._persistBrodcastMap[key];
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

}