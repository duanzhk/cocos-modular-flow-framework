import { Component } from 'cc';
import { IView, IEventManager, ICocosResManager } from '../core';
export declare abstract class BaseView extends Component implements IView {
    /** @internal */
    private readonly __isIView__;
    /** @internal */
    private __group__;
    private _eventProxy?;
    private _eventHandlers;
    protected get event(): IEventManager;
    private _loaderProxy?;
    private _loaderHandlers;
    protected get res(): ICocosResManager;
    abstract onPause(): void;
    abstract onResume(): void;
    abstract onEnter(args?: any): void;
    onExit(): void;
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
}
