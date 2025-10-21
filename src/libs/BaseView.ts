import { _decorator, Asset, Component, tween, Vec3, UIOpacity } from 'cc';
import { IView, IEventManager, ICocosResManager, UIOpenConfig } from '../core';
const { ccclass, property } = _decorator;

export abstract class BaseView extends Component implements IView {
    /** @internal */
    private readonly __isIView__: boolean = true;

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

    private _openConfig: UIOpenConfig | undefined;
    /**
     * 打开时传入的配置数据
     * 仅供框架内部使用，业务使用 this.args代替
     */
    /** @internal */
    public get __config__(): UIOpenConfig | undefined {
        return this._openConfig
    }
    /**
     * 打开时传入的配置数据
     * 仅供框架内部使用，业务使用 this.args代替
     */
    /** @internal */
    public set __config__(config: UIOpenConfig | undefined) {
        this._openConfig = config
    }

    /**
     * UIOpenConfig.args
     */
    protected get args(): any {
        return this._openConfig?.args
    }

    abstract onPause(): void
    abstract onResume(): void
    abstract onEnter(args?: UIOpenConfig): void
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
     * @param modelClass Model 类构造函数
     * @returns Model 实例（类型由泛型参数推断）
     * @example
     * ```typescript
     * const userModel = this.getModel(UserModel);
     * ```
     */
    protected getModel<T extends keyof ModelRegistry>(modelClass: T): InstanceType<ModelRegistry[T]> {
        return mf.core.getModel(modelClass);
    }

    /**
     * 获取 Manager 实例
     * @param managerClass Manager 类构造函数
     * @returns Manager 实例（类型由泛型参数推断）
     * @example
     * ```typescript
     * const gameManager = this.getManager(GameManager);
     * ```
     */
    protected getManager<T extends keyof ManagerRegistry>(managerClass: T): InstanceType<ManagerRegistry[T]> {
        return mf.core.getManager(managerClass);
    }

    /**
     * 进入动画（可被子类覆盖以实现自定义动画）
     * 默认实现：缩放+淡入效果
     * @returns 返回 Promise 以支持异步动画
     * @example
     * ```typescript
     * async onEnterAnimation(): Promise<void> {
     *     // 自定义动画实现
     *     return new Promise<void>((resolve) => {
     *         tween(this.node)
     *             .to(0.5, { scale: new Vec3(1, 1, 1) })
     *             .call(() => resolve())
     *             .start();
     *     });
     * }
     * ```
     */
    async onEnterAnimation(): Promise<void> {
        const node = this.node;
        node.setScale(0.8, 0.8, 1);

        let uiOpacity = node.getComponent(UIOpacity);
        if (uiOpacity) {
            uiOpacity.opacity = 0;
        }

        return new Promise<void>((resolve) => {
            const tweenNode = tween(node).to(0.3, { scale: new Vec3(1, 1, 1) }, { easing: 'backOut' });

            if (uiOpacity) {
                tween(uiOpacity)
                    .to(0.3, { opacity: 255 })
                    .start();
            }

            tweenNode
                .call(() => resolve())
                .start();
        });
    }

    /**
     * 退出动画（可被子类覆盖以实现自定义动画）
     * 默认实现：缩放+淡出效果
     * @returns 返回 Promise 以支持异步动画
     * @example
     * ```typescript
     * async onExitAnimation(): Promise<void> {
     *     // 自定义动画实现
     *     return new Promise<void>((resolve) => {
     *         tween(this.node)
     *             .to(0.3, { scale: new Vec3(0, 0, 1) })
     *             .call(() => resolve())
     *             .start();
     *     });
     * }
     * ```
     */
    async onExitAnimation(): Promise<void> {
        const node = this.node;
        const uiOpacity = node.getComponent(UIOpacity);

        return new Promise<void>((resolve) => {
            const tweenNode = tween(node).to(0.2, { scale: new Vec3(0.8, 0.8, 1) }, { easing: 'backIn' });

            if (uiOpacity) {
                tween(uiOpacity)
                    .to(0.2, { opacity: 0 })
                    .start();
            }

            tweenNode
                .call(() => resolve())
                .start();
        });
    }

}