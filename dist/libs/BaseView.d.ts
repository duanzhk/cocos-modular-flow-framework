import { Component } from 'cc';
import { IView, UIOpenConfig } from '../core';
import { Broadcaster, ResLoader } from '.';
export declare abstract class BaseView extends Component implements IView {
    /** @internal */
    private readonly __isIView__;
    private _eventProxy?;
    private _eventHandlers;
    protected get event(): Broadcaster;
    private _loaderProxy?;
    private _loaderHandlers;
    protected get res(): ResLoader;
    private _openConfig;
    /**
     * 打开时传入的配置数据
     * 仅供框架内部使用，业务使用 this.args代替
     */
    /** @internal */
    get __config__(): UIOpenConfig | undefined;
    /**
     * 打开时传入的配置数据
     * 仅供框架内部使用，业务使用 this.args代替
     */
    /** @internal */
    set __config__(config: UIOpenConfig | undefined);
    /**
     * UIOpenConfig.args
     */
    protected get args(): any;
    abstract onPause(): void;
    abstract onResume(): void;
    abstract onEnter(args?: UIOpenConfig): void;
    abstract onExit(): void;
    /**
    * 仅供框架内部使用，业务覆写onExit即可。
    */
    /** @internal */
    __exit__(): void;
    protected onDestroy(): void;
    /**
     * 获取 Model 实例
     * @param modelClass Model 类构造函数
     * @returns Model 实例（类型由泛型参数推断）
     * @example
     * ```typescript
     * const userModel = this.getModel(UserModel);
     * ```
     */
    protected getModel<T extends keyof ModelRegistry>(modelClass: T): InstanceType<ModelRegistry[T]>;
    /**
     * 获取 Manager 实例
     * @param managerClass Manager 类构造函数
     * @returns Manager 实例（类型由泛型参数推断）
     * @example
     * ```typescript
     * const gameManager = this.getManager(GameManager);
     * ```
     */
    protected getManager<T extends keyof ManagerRegistry>(managerClass: T): InstanceType<ManagerRegistry[T]>;
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
    onEnterAnimation(): Promise<void>;
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
    onExitAnimation(): Promise<void>;
}
