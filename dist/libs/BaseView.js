import { _decorator, Component } from 'cc';

const { ccclass, property } = _decorator;
class BaseView extends Component {
    constructor() {
        super(...arguments);
        /** @internal */
        this.__isIView__ = true;
        /** @internal */
        this.__group__ = undefined;
        this._eventHandlers = [];
        this._loaderHandlers = [];
    }
    get event() {
        if (!this._eventProxy) {
            this._eventProxy = new Proxy(mf.event, {
                get: (target, prop) => {
                    if (prop === 'on' || prop === 'once') {
                        return (keyOrHandler, listener, context, args) => {
                            const handlers = Array.isArray(keyOrHandler) ? keyOrHandler : [keyOrHandler];
                            handlers.forEach(handler => {
                                if (typeof handler === 'object') {
                                    this._eventHandlers.push({ key: handler.key, listener: handler.listener });
                                }
                                else {
                                    this._eventHandlers.push({ key: keyOrHandler, listener: listener });
                                }
                            });
                            return Reflect.get(target, prop).apply(target, [keyOrHandler, listener, context, args]);
                        };
                    }
                    return Reflect.get(target, prop);
                }
            });
        }
        return this._eventProxy;
    }
    get res() {
        if (!this._loaderProxy) {
            this._loaderProxy = new Proxy(mf.res, {
                get: (target, prop) => {
                    //劫持所有load相关方法
                    if (prop.startsWith('load')) {
                        return (path, type, nameOrUrl) => {
                            return Reflect.get(target, prop).apply(target, [path, type, nameOrUrl]).then((asset) => {
                                this._loaderHandlers.push({ path, asset });
                                return asset;
                            });
                        };
                    }
                    return Reflect.get(target, prop);
                }
            });
        }
        return this._loaderProxy;
    }
    onExit() {
        // 自动清理所有事件监听
        this._eventHandlers.forEach(({ key, listener }) => {
            //@ts-ignore
            mf.event.off(key, listener);
        });
        this._eventHandlers = [];
    }
    onDestroy() {
        // 自动清理加载的资源
        this._loaderHandlers.forEach(({ path, asset }) => {
            mf.res.release(asset);
        });
        this._loaderHandlers = [];
    }
    /**
     * 获取 Model 实例
     * @param modelKey Model 的 Key，使用 ModelNames.XXX
     * @returns Model 实例（具体类型由 .d.ts 文件的函数重载推断）
     * @example
     * ```typescript
     * // 类型由 .d.ts 文件的重载自动推断
     * const userModel = this.getModel(ModelNames.User);
     * ```
     */
    getModel(modelKey) {
        return mf.core.getModel(modelKey);
    }
    /**
     * 获取 Manager 实例
     * @param managerKey Manager 的 Key，使用 ManagerNames.XXX
     * @returns Manager 实例（具体类型由 .d.ts 文件的函数重载推断）
     * @example
     * ```typescript
     * // 类型由 .d.ts 文件的重载自动推断
     * const gameManager = this.getManager(ManagerNames.Game);
     * ```
     */
    getManager(managerKey) {
        return mf.core.getManager(managerKey);
    }
}

export { BaseView };
