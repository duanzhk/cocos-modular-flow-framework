import { Component } from "cc";
import { IUIManager, IView } from "../core";
type ICocosView = IView & Component;
declare abstract class CcocosUIManager implements IUIManager {
    getTopView(): IView | undefined;
    open<T extends IView>(viewSymbol: symbol, args?: any): Promise<T>;
    close(viewSymbol: symbol | IView, destory?: boolean): void;
    openAndPush<T extends IView>(viewSymbol: symbol, group: string, args?: any): Promise<T>;
    closeAndPop(group: string, destroy?: boolean): void;
    clearStack(group: string, destroy?: boolean): void;
    protected abstract internalOpen<T extends ICocosView>(viewSymbol: symbol, args?: any): Promise<T>;
    protected abstract internalClose(viewSymbol: symbol | IView, destory?: boolean): void;
    protected abstract internalOpenAndPush<T extends ICocosView>(viewSymbol: symbol, group: string, args?: any): Promise<T>;
    protected abstract internalCloseAndPop(group: string, destroy?: boolean): void;
    protected abstract internalClearStack(group: string, destroy?: boolean): void;
    protected abstract internalGetTopView(): ICocosView | undefined;
}
export declare class UIManager extends CcocosUIManager {
    private _cache;
    private _groupStacks;
    constructor();
    private _getPrefabPath;
    private _adjustMaskLayer;
    private _blockInput;
    private _load;
    private _remove;
    protected internalGetTopView(): ICocosView | undefined;
    protected internalOpen<T extends ICocosView>(viewSymbol: symbol, args?: any): Promise<T>;
    protected internalClose(viewSymbol: symbol | IView, destroy?: boolean): void;
    protected internalOpenAndPush<T extends ICocosView>(viewSymbol: symbol, group: string, args?: any): Promise<T>;
    protected internalCloseAndPop(group: string, destroy?: boolean): void;
    protected internalClearStack(group: string, destroy?: boolean): void;
}
export {};
