import { Component } from "cc";
import { IUIManager, IView } from "../core";
import { ViewNamesType } from "../core";
type ICocosView = IView & Component;
declare abstract class CcocosUIManager implements IUIManager {
    getTopView(): IView | undefined;
    open(viewKey: keyof ViewNamesType, args?: any): Promise<IView>;
    close(viewKey: keyof ViewNamesType | IView, destory?: boolean): void;
    openAndPush(viewKey: keyof ViewNamesType, group: string, args?: any): Promise<IView>;
    closeAndPop(group: string, destroy?: boolean): void;
    clearStack(group: string, destroy?: boolean): void;
    protected abstract internalOpen(viewKey: string, args?: any): Promise<ICocosView>;
    protected abstract internalClose(viewKey: string | IView, destory?: boolean): void;
    protected abstract internalOpenAndPush(viewKey: string, group: string, args?: any): Promise<ICocosView>;
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
    protected internalOpen(viewKey: string, args?: any): Promise<ICocosView>;
    protected internalClose(viewKey: string | IView, destroy?: boolean): void;
    protected internalOpenAndPush(viewKey: string, group: string, args?: any): Promise<ICocosView>;
    protected internalCloseAndPop(group: string, destroy?: boolean): void;
    protected internalClearStack(group: string, destroy?: boolean): void;
}
export {};
