import { Component } from 'cc';
import { IView, IManager, IModel, IEventManager, ICocosResManager } from '../core';
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
    protected getManager<T extends IManager>(ctor: new () => T): T;
    protected getModel<T extends IModel>(ctor: new () => T): T;
}
