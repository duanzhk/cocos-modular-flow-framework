import { _decorator, Component } from 'cc';
import { IView, IManager, IModel, IEventManager, IResManager } from '@core';
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
            this._eventProxy = new Proxy(app.event, {
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
    private _loaderProxy?: IResManager
    private _loaderHandlers: any = null;
    protected get loader(): any {
        return app.res;
    }

    abstract onPause(): void
    abstract onResume(): void
    abstract onEnter(args?: any): void
    onExit(): void {
        // 自动清理所有事件监听
        this._eventHandlers.forEach(({ key, listener }) => {
            app.event.off(key, listener as any);
        });
        this._eventHandlers = [];

        // 清理loader
        this._loaderHandlers.forEach(() => {
        });
        this._loaderHandlers = [];
    }

    protected getManager<T extends IManager>(ctor: new () => T): T {
        // 业务组件避免直接依赖底层服务定位器，所以使用app.core统一对外接口，方便后续架构演进
        return app.core.getManager<T>(ctor);
    }

    protected getModel<T extends IModel>(ctor: new () => T): T {
        // 业务组件避免直接依赖底层服务定位器，所以使用app.core统一对外接口，方便后续架构演进
        return app.core.getModel<T>(ctor);
    }

}