import { Component, Node, Color } from "cc";
import { IUIManager, IView } from "../core";
/**
 * UI遮罩配置选项
 */
export interface UIMaskOptions {
    /** 遮罩颜色 */
    color?: Color;
    /** 是否可点击关闭顶层UI */
    clickToClose?: boolean;
}
/**
 * UI打开选项
 */
export interface UIOpenOptions {
    /** 是否显示等待视图 */
    showLoading?: boolean;
    /** 是否可点击遮罩关闭 */
    clickToClose?: boolean;
    /** 自定义参数 */
    args?: any;
}
/**
 * 等待视图配置
 */
export interface UILoadingConfig {
    /** 是否全局启用等待视图 */
    enabled?: boolean;
    /** 等待视图预制体路径 */
    prefabPath?: string;
    /** 等待视图显示延迟（毫秒） */
    delay?: number;
    /** 最小显示时间（毫秒） */
    minShowTime?: number;
    /** 自定义创建函数（高级用法） */
    createCustomLoading?: () => Node | Promise<Node>;
}
/**
 * LRU缓存配置
 */
export interface UICacheConfig {
    /** 最大缓存数量 */
    maxSize?: number;
    /** 是否启用LRU策略 */
    enableLRU?: boolean;
}
/**
 * 预加载配置
 */
export interface UIPreloadConfig {
    /** 预加载的视图列表 */
    views?: (keyof UIRegistry)[];
    /** 预加载延迟（毫秒） */
    delay?: number;
}
interface IInternalView extends IView {
    __isIView__: boolean;
}
type ICocosView = IInternalView & Component;
declare abstract class CcocosUIManager implements IUIManager {
    getTopView(): IView | undefined;
    open<T extends keyof UIRegistry>(viewClass: T, args?: UIOpenOptions): Promise<InstanceType<UIRegistry[T]>>;
    close<T extends keyof UIRegistry>(viewClass: T): Promise<void>;
    openAndPush<T extends keyof UIRegistry>(viewClass: T, group: string, args?: UIOpenOptions): Promise<InstanceType<UIRegistry[T]>>;
    closeAndPop(group: string, destroy?: boolean): Promise<void>;
    clearStack(group: string, destroy?: boolean): void;
    closeAll(destroy?: boolean): void;
    protected abstract _internalOpen(viewKey: string, args?: UIOpenOptions): Promise<ICocosView>;
    protected abstract _internalClose(viewKey: string | IView, destory?: boolean): Promise<void>;
    protected abstract _internalOpenAndPush(viewKey: string, group: string, args?: UIOpenOptions): Promise<ICocosView>;
    protected abstract _internalCloseAndPop(group: string, destroy?: boolean): Promise<void>;
    protected abstract _internalClearStack(group: string, destroy?: boolean): void;
    protected abstract _internalGetTopView(): ICocosView | undefined;
    protected abstract _internalCloseAll(destroy?: boolean): void;
}
export declare class UIManager extends CcocosUIManager {
    private _cache;
    private _groupStacks;
    private _view2group;
    private _inputBlocker;
    private _loadingView;
    private _loadingPromises;
    private _lruOrder;
    private _preloadedViews;
    private _maskOptions;
    private _loadingConfig;
    private _cacheConfig;
    private _preloadConfig;
    private _openOptions;
    constructor();
    /**
     * 设置遮罩配置
     */
    setMaskConfig(options: UIMaskOptions): void;
    /**
     * 设置等待视图配置
     */
    setLoadingConfig(config: UILoadingConfig): void;
    /**
     * 设置缓存配置
     */
    setCacheConfig(config: UICacheConfig): void;
    /**
     * 设置预加载配置
     */
    setPreloadConfig(config: UIPreloadConfig): void;
    /**
     * 检查指定视图是否已打开
     */
    contains<T extends keyof UIRegistry>(viewKey: T): boolean;
    /**
     * 检查视图是否正在加载
    */
    isLoading<T extends keyof UIRegistry>(viewKey: T): boolean;
    /**
     * 预加载视图（支持单个或多个）
     */
    preload<T extends keyof UIRegistry>(viewKeyOrKeys: T | T[]): Promise<void>;
    private _getPrefabPath;
    /**
     * 获取所有活跃的视图节点（排除遮罩节点）
     */
    private _getActiveViews;
    /**
     * 通过prefab创建Node对象
     * @param args
     * @returns Node对象
     */
    private _generateNode;
    /**
     * 调整遮罩层级：始终保持在最顶层UI的下一层
     */
    private _adjustMaskLayer;
    /**
     * 更新LRU顺序
     */
    private _updateLRUOrder;
    /**
     * 阻塞/解除输入事件
     */
    private _blockInput;
    /**
     * 设置遮罩点击处理器
     */
    private _setupMaskClickHandler;
    /**
    * 显示等待视图
    */
    private _showLoading;
    /**
     * 隐藏等待视图
     */
    private _hideLoading;
    /**
     * 预加载视图
     */
    private _startPreload;
    /**
     * 预加载单个视图
     */
    private _preloadView;
    /**
     * 获取当前最顶层的视图
     */
    protected _internalGetTopView(): ICocosView | undefined;
    private _load;
    private _loadInternal;
    protected _internalOpen(viewKey: string, options?: UIOpenOptions): Promise<ICocosView>;
    protected _internalClose(viewKeyOrInstance: string | IView, destroy?: boolean): Promise<void>;
    protected _internalOpenAndPush(viewKey: string, group: string, options?: UIOpenOptions): Promise<ICocosView>;
    protected _internalCloseAndPop(group: string, destroy?: boolean): Promise<void>;
    /**
     * 移除视图
     */
    private _remove;
    private _releasePrefab;
    protected _internalClearStack(group: string, destroy?: boolean): void;
    /**
     * 关闭所有视图，不播放动画
     */
    protected _internalCloseAll(destroy?: boolean): void;
}
export {};
