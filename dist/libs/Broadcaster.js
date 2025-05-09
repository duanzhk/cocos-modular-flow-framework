import { ObjectUtil } from '../utils/ObjectUtil.js';
import { StringUtil } from '../utils/StringUtil.js';

class Broadcaster {
    constructor() {
        this._persistBrodcastMap = {};
        this._listenerHandlerMap = {};
        this._stickBrodcastMap = {};
        this._unuseHandlers = [];
    }
    /**
     * 回收handler
     * @param handler
     */
    _recoverHandler(handler) {
        if (!handler)
            return;
        //@ts-ignore
        handler.listener = undefined;
        handler.key = undefined;
        handler.args = undefined;
        handler.context = undefined;
        this._unuseHandlers.push(handler);
    }
    //检查是否有有效的监听器，如果没有就删除这个key
    _checkListenerValidity(key) {
        if (!key)
            return;
        const handlers = this._listenerHandlerMap[key];
        if (handlers && handlers.length > 0) {
            return;
        }
        delete this._listenerHandlerMap[key];
    }
    /**
     * 添加广播监听，如果有粘性广播就会执行粘性广播
     * @param handler
     */
    _addHandler(handler) {
        const handlerMap = this._listenerHandlerMap;
        const msgKey = handler.key;
        const handlers = handlerMap[msgKey] || [];
        handlers.push(handler);
        handlerMap[msgKey] = handlers;
        //检查是否有粘性广播
        const stickyHandlers = this._stickBrodcastMap[msgKey];
        if (stickyHandlers) {
            //需要把执行过的粘性广播删除，防止注册时再次执行
            this.removeStickyBroadcast(msgKey);
            for (let i = 0; i < stickyHandlers.length; i++) {
                let e = stickyHandlers[i];
                this.dispatch(msgKey, e.data, e.callback, e.persistence);
            }
        }
    }
    /**
     * 将广播的数据作为参数，执行广播监听器的逻辑
     * @param handler 广播监听器
     * @param data 广播携带的数据
     * @param callback 回调函数
     */
    _runHandler(handler, data, callback) {
        if (!handler.listener)
            return;
        let args = [];
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
        return handler.listener.apply(handler.context, args);
    }
    _onHander(keyOrHandler, listener, context, once, args) {
        if (typeof keyOrHandler === "string") {
            if (!listener)
                return;
            let handlerObj = this._unuseHandlers.pop() || {};
            handlerObj.key = keyOrHandler;
            handlerObj.listener = listener;
            handlerObj.context = context;
            handlerObj.once = once;
            handlerObj.args = args;
            this._addHandler(handlerObj);
        }
        else {
            if (ObjectUtil.isArray(keyOrHandler)) {
                const handlers = keyOrHandler;
                for (let i = 0; i < handlers.length; i++) {
                    this._addHandler(handlers[i]);
                }
            }
            else {
                this._addHandler(keyOrHandler);
            }
        }
    }
    on(keyOrHandler, listener, context, args) {
        this._onHander(keyOrHandler, listener, context, false, args);
    }
    once(keyOrHandler, listener, context, args) {
        this._onHander(keyOrHandler, listener, context, true, args);
    }
    /**
     * 注销指定监听
     * @param key 事件名
     * @param listener 监听回调
     * @return this
     */
    off(key, listener) {
        let handlers = this._listenerHandlerMap[key];
        if (!handlers) {
            throw new Error(`没有找到key为${key.toString()}的事件`);
        }
        const index = handlers.findIndex((handler) => handler.listener === listener);
        const handler = handlers.fastRemoveAt(index);
        this._recoverHandler(handler);
        this._checkListenerValidity(key);
        return this;
    }
    offAll(key, context) {
        const handlerMap = this._listenerHandlerMap;
        //指定key或全局清除
        const processHandler = (handlers, msgKey, hasContext) => {
            for (let i = handlers.length - 1; i >= 0; i--) {
                const shouldRemove = !hasContext || handlers[i].context === context;
                shouldRemove && this._recoverHandler(handlers.fastRemoveAt(i));
            }
            this._checkListenerValidity(msgKey);
        };
        if (key) { //清除指定key的所有监听
            if (!handlerMap[key]) {
                throw new Error(`没有找到key为${key.toString()}的事件`);
            }
            processHandler(handlerMap[key], key, false);
        }
        else { //处理全局或上下文清除
            const isGlobalClear = !context;
            Object.keys(handlerMap).forEach((msgKey) => {
                const k = msgKey;
                processHandler(handlerMap[k], k, !isGlobalClear);
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
    dispatch(key, data, callback, persistence) {
        if (StringUtil.isEmptyOrWhiteSpace(key.toString())) {
            throw new Error('广播的key不能为空');
        }
        //持久化
        persistence !== null && persistence !== void 0 ? persistence : (this._persistBrodcastMap[key] = data);
        const handlers = this._listenerHandlerMap[key];
        if (!handlers || handlers.length == 0) {
            console.warn(`没有注册广播：${key.toString()}`);
            return;
        }
        for (let i = handlers.length - 1; i >= 0; i--) {
            let handler = handlers[i];
            this._runHandler(handler, data, callback);
            if (handler.once) {
                this.off(key, handler.listener);
            }
        }
        this._checkListenerValidity(key);
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
    dispatchSticky(key, data, callback, persistence) {
        var _a;
        var _b;
        if (StringUtil.isEmptyOrWhiteSpace(key.toString())) {
            throw new Error('广播的key不能为空');
        }
        //如果已经有了监听者，则直接广播
        if (this._listenerHandlerMap[key]) {
            this.dispatch(key, data, callback, persistence);
            return;
        }
        //注意：??= 在ES2021(TypeScript版本4.4)引入
        ((_a = (_b = this._stickBrodcastMap)[key]) !== null && _a !== void 0 ? _a : (_b[key] = [])).push({
            key: key,
            data: data,
            callback: callback,
            persistence: persistence
        });
        //如果persistence=true需要先持久化，不能等到通过on->broadcast的时候再持久化。
        //因为中途可能会有removeStickyBroadcast操作，那么on就不会调用broadcast，造成持久化无效bug。
        persistence !== null && persistence !== void 0 ? persistence : (this._persistBrodcastMap[key] = data);
    }
    /**
     * 移除指定的粘性广播
     *
     * @param key
     */
    removeStickyBroadcast(key) {
        if (this._stickBrodcastMap[key]) {
            delete this._stickBrodcastMap[key];
        }
    }
    /**
     * 事件注册是否被注册
     * @param key
     */
    isRegistered(key) {
        return !!this._listenerHandlerMap[key];
    }
    /**
     * 获取被持久化的消息。ps:相同key的持久化广播会被覆盖。
     * @param key
     */
    getPersistentValue(key) {
        return this._persistBrodcastMap[key];
    }
    /**
    * 销毁广播系统
    */
    dispose() {
        //@ts-ignore
        this._listenerHandlerMap = undefined;
        //@ts-ignore
        this._stickBrodcastMap = undefined;
        //@ts-ignore
        this._persistBrodcastMap = undefined;
    }
}

export { Broadcaster };
