import { Component } from "cc";
import { IView, UIOpenConfig } from "../core";
import { LayerConfig, UIMaskConfig, UIWaitConfig } from ".";
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
type ICocosView = IView & Component & {
    __config__: UIOpenConfig | undefined;
    __exit__(): void;
};
declare class UIManager {
    private _cache;
    private _groupStacks;
    private _view2group;
    private _inputBlocker;
    private _uiLoadingPromises;
    private _lruOrder;
    private _preloadedViews;
    private _cacheConfig;
    private _preloadConfig;
    private _openOptions;
    private _uiRoot;
    private get Root();
    constructor();
    /**
     * 初始化UI层级配置
     * @param layers 层级配置数组，可以是字符串数组或LayerConfig数组
     */
    setLayerConfig(layers: (string | LayerConfig)[]): void;
    /**
     * 设置遮罩配置
     */
    setMaskConfig(options: UIMaskConfig): void;
    /**
     * 设置等待视图配置
     */
    setWaitConfig(config: UIWaitConfig): void;
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
    isOpened<T extends keyof UIRegistry>(viewKey: T): boolean;
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
     * 从给定的Node对象上获得IView类型的脚本
     * @param target
     * @returns
     */
    private _getIViewFromNode;
    /**
     * 通过prefab创建Node对象
     * @param args
     * @returns Node对象
     */
    private _generateNode;
    /**
     * 更新LRU顺序
     */
    private _updateLRUOrder;
    /**
     * 阻塞/解除输入事件
     */
    private _blockInput;
    /**
     * 预加载视图
     */
    private _startPreload;
    /**
     * 预加载单个视图
     */
    private _preloadView;
    /**
     * 计算所有层级，获取最顶层的视图
     */
    protected _internalGetTopView(): ICocosView | undefined;
    private _load;
    private _loadInternal;
    protected _internalOpen(viewKey: string, options?: UIOpenConfig): Promise<ICocosView>;
    protected _internalClose(viewKeyOrInstance: string | IView, destroy?: boolean): Promise<void>;
    protected _internalOpenAndPush(viewKey: string, group: string, options?: UIOpenConfig): Promise<ICocosView>;
    protected _internalCloseAndPop(group: string, destroy?: boolean): Promise<void>;
    /**
     * 按顺序打开一组UI，如果前一个UI正在打开，则等待前一个UI关闭后再打开下一个UI
     * @param queue 要打开的UI队列
     */
    protected _internalOpenQueue(queue: {
        viewKey: string;
        options: UIOpenConfig;
    }[], index?: number): void;
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
export declare class CCUIManager extends UIManager {
    getTopView(): IView | undefined;
    open<T extends keyof UIRegistry>(viewClass: T, args?: UIOpenConfig): Promise<InstanceType<UIRegistry[T]>>;
    close<T extends keyof UIRegistry>(viewClass: T): Promise<void>;
    openAndPush<T extends keyof UIRegistry>(viewClass: T, group: string, args?: UIOpenConfig): Promise<InstanceType<UIRegistry[T]>>;
    closeAndPop(group: string, destroy?: boolean): Promise<void>;
    openQueue(queue: {
        viewKey: string;
        options: UIOpenConfig;
    }[]): void;
    clearStack(group: string, destroy?: boolean): void;
    closeAll(destroy?: boolean): void;
}
export {};
