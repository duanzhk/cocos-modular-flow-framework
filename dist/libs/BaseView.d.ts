import { Component } from 'cc';
import { IView, IEventManager, ICocosResManager } from '../core';
import { ModelNamesType, ManagerNamesType } from '../core';
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
     * @param modelKey Model 的 Key，使用 ModelNames.XXX
     * @returns Model 实例（具体类型由 .d.ts 文件的函数重载推断）
     * @example
     * ```typescript
     * // 类型由 .d.ts 文件的重载自动推断
     * const userModel = this.getModel(ModelNames.User);
     * ```
     */
    protected getModel<T extends keyof ModelNamesType>(modelKey: T): any;
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
    protected getManager<T extends keyof ManagerNamesType>(managerKey: T): any;
}
