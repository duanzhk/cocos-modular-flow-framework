import { _decorator, Asset, Component } from 'cc';
import { IView, IEventManager, ICocosResManager } from '../core';
const { ccclass, property } = _decorator;

export abstract class BaseView extends Component implements IView {
    /** @internal */
    private readonly __isIView__: boolean = true;
    /** @internal */
    private __group__: string | undefined = undefined;

    //broadcast代理对象
    private _eventProxy?: IEventManager;
    private _eventHandlers: { key: any; listener: Function }[] = [];
    protected get event(): IEventManager {
        if (!this._eventProxy) {
            this._eventProxy = new Proxy(mf.event, {
                get: (target, prop) => {
                    if (prop === 'on' || prop === 'once') {
                        return (keyOrHandler: any, listener?: any, context?: any, args?: any[]) => {
                            const handlers = Array.isArray(keyOrHandler) ? keyOrHandler : [keyOrHandler];
                            handlers.forEach(handler => {
                                if (typeof handler === 'object') {
                                    this._eventHandlers.push({ key: handler.key, listener: handler.listener });
                                } else {
                                    this._eventHandlers.push({ key: keyOrHandler, listener: listener });
                                }
                            });
                            return Reflect.get(target, prop).apply(target, [keyOrHandler, listener, context, args]);
                        };
                    }
                    return Reflect.get(target, prop);
                }
            })
        }
        return this._eventProxy;
    }

    //loader代理对象
    private _loaderProxy?: ICocosResManager
    private _loaderHandlers: { path: string, asset: Asset }[] = [];
    protected get res(): ICocosResManager {
        if (!this._loaderProxy) {
            this._loaderProxy = new Proxy(mf.res, {
                get: (target, prop: string) => {
                    //劫持所有load相关方法
                    if (prop.startsWith('load')) {
                        return (path: string, type: any, nameOrUrl?: string) => {
                            return Reflect.get(target, prop).apply(target, [path, type, nameOrUrl]).then((asset: Asset) => {
                                this._loaderHandlers.push({ path, asset });
                                return asset;
                            })
                        }
                    }
                    return Reflect.get(target, prop);
                }
            })
        }
        return this._loaderProxy;
    }

    abstract onPause(): void
    abstract onResume(): void
    abstract onEnter(args?: any): void
    onExit(): void {
        // 自动清理所有事件监听
        this._eventHandlers.forEach(({ key, listener }) => {
            //@ts-ignore
            mf.event.off(key, listener as any);
        });
        this._eventHandlers = [];
    }

    protected onDestroy(): void {
        // 自动清理加载的资源
        this._loaderHandlers.forEach(({ path, asset }) => {
            mf.res.release(asset);
        });
        this._loaderHandlers = []
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
    protected getModel(modelKey: string): any {
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
    protected getManager(managerKey: string): any {
        return mf.core.getManager(managerKey);
    }

}