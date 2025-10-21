import { Component, director, input, instantiate, Node, Input, EventTouch, Widget, Sprite, Prefab, Color } from "cc";
import { ICocosResManager, IUIManager, IView, ServiceLocator, getViewClass } from "../core";
import { ImageUtil } from "../utils";

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

/**
 * 为节点添加全屏Widget组件
 */
function addWidget(node: Node) {
    const widget = node.getComponent(Widget) || node.addComponent(Widget);
    widget.isAlignLeft = widget.isAlignRight = widget.isAlignTop = widget.isAlignBottom = true;
    widget.left = widget.right = widget.top = widget.bottom = 0;
}

let _uiRoot: Node | undefined
const UIRoot = new Proxy({} as Node, {
    get(target, prop) {
        if (!_uiRoot) {
            const canvas = director.getScene()!.getChildByPath('Canvas')!;
            director.addPersistRootNode(canvas);
            _uiRoot = new Node('__UIRoot__')
            _uiRoot.layer = canvas.layer
            _uiRoot.setParent(canvas);
            addWidget(_uiRoot);
        }
        return Reflect.get(_uiRoot, prop)
    }
})

function setLayer(node: Node) {
    node.layer = UIRoot.layer;
    node.children.forEach(child => {
        setLayer(child);
    });
}

function addChild(node: Node) {
    UIRoot.addChild(node)
    setLayer(node);
}

let _uiMask: Node | undefined
/**
 * UI遮罩节点代理
 */
const UIMask = new Proxy({} as Node, {
    get(target, prop) {
        if (!_uiMask) {
            _uiMask = new Node('__UIMask__');
            addChild(_uiMask);
            _uiMask.setPosition(0, 0);
            _uiMask.addComponent(Sprite).spriteFrame = ImageUtil.createSolidColorSpriteFrame();
            addWidget(_uiMask);
        }
        const value = Reflect.get(_uiMask!, prop);
        // 绑定方法到原始实例
        return typeof value === 'function' ? value.bind(_uiMask) : value;
    },
    set(target: Node, p: string | symbol, newValue: any, receiver: any): boolean {
        if (p === 'active') {
            _uiMask!.active = newValue;
            return true;
        }
        return Reflect.set(_uiMask!, p, newValue, receiver);
    }
})

// 用于BaseView的内部接口，仅供 UIManager 使用
interface IInternalView extends IView {
    __isIView__: boolean;
}
type ICocosView = IInternalView & Component

// 接口隔离，实现具体的CcocosUIManager
abstract class CcocosUIManager implements IUIManager {
    getTopView(): IView | undefined {
        return this._internalGetTopView();
    }
    open<T extends keyof UIRegistry>(viewClass: T, args?: UIOpenOptions): Promise<InstanceType<UIRegistry[T]>> {
        return this._internalOpen(viewClass, args) as Promise<InstanceType<UIRegistry[T]>>;
    }
    close<T extends keyof UIRegistry>(viewClass: T): Promise<void> {
        return this._internalClose(viewClass);
    }
    openAndPush<T extends keyof UIRegistry>(viewClass: T, group: string, args?: UIOpenOptions): Promise<InstanceType<UIRegistry[T]>> {
        return this._internalOpenAndPush(viewClass, group, args) as Promise<InstanceType<UIRegistry[T]>>;
    }
    closeAndPop(group: string, destroy?: boolean): Promise<void> {
        return this._internalCloseAndPop(group, destroy);
    }
    clearStack(group: string, destroy?: boolean): void {
        this._internalClearStack(group, destroy);
    }
    closeAll(destroy?: boolean): void {
        this._internalCloseAll(destroy);
    }
    protected abstract _internalOpen(viewKey: string, args?: UIOpenOptions): Promise<ICocosView>
    protected abstract _internalClose(viewKey: string | IView, destory?: boolean): Promise<void>
    protected abstract _internalOpenAndPush(viewKey: string, group: string, args?: UIOpenOptions): Promise<ICocosView>
    protected abstract _internalCloseAndPop(group: string, destroy?: boolean): Promise<void>;
    protected abstract _internalClearStack(group: string, destroy?: boolean): void
    protected abstract _internalGetTopView(): ICocosView | undefined
    protected abstract _internalCloseAll(destroy?: boolean): void
}

export class UIManager extends CcocosUIManager {
    private _cache: Map<string, Node> = new Map();
    private _groupStacks: Map<string, ICocosView[]> = new Map();
    private _view2group: Map<Node, string> = new Map();

    private _inputBlocker: ((event: EventTouch) => void) | null = null;
    private _loadingView: Node | null = null;
    private _loadingPromises: Map<string, Promise<ICocosView>> = new Map();
    private _lruOrder: string[] = [];
    private _preloadedViews: Set<string> = new Set();

    private _maskOptions: UIMaskOptions = { clickToClose: true };
    private _loadingConfig: UILoadingConfig = { enabled: true, delay: 200, minShowTime: 500 };
    private _cacheConfig: UICacheConfig = { maxSize: 10, enableLRU: true };
    private _preloadConfig: UIPreloadConfig = { views: [], delay: 1000 };
    private _openOptions: UIOpenOptions = { showLoading: true, clickToClose: true };

    public constructor() {
        super();
        this._setupMaskClickHandler();
        this._startPreload();
    }


    /**
     * 设置遮罩配置
     */
    public setMaskConfig(options: UIMaskOptions): void {
        this._maskOptions = { ...this._maskOptions, ...options };
        if (options.color && UIMask) {
            const sprite = UIMask.getComponent(Sprite);
            if (sprite) {
                sprite.color = options.color;
            }
        }
    }

    /**
     * 设置等待视图配置
     */
    public setLoadingConfig(config: UILoadingConfig): void {
        this._loadingConfig = { ...this._loadingConfig, ...config };
    }

    /**
     * 设置缓存配置
     */
    public setCacheConfig(config: UICacheConfig): void {
        this._cacheConfig = { ...this._cacheConfig, ...config };
    }

    /**
     * 设置预加载配置
     */
    public setPreloadConfig(config: UIPreloadConfig): void {
        this._preloadConfig = { ...this._preloadConfig, ...config };
        this._startPreload();
    }

    /**
     * 检查指定视图是否已打开
     */
    public contains<T extends keyof UIRegistry>(viewKey: T): boolean {
        const viewType = getViewClass<ICocosView>(viewKey as string);
        return this._cache.has(viewType.name) && this._cache.get(viewType.name)!.parent !== null;
    }

    /**
     * 检查视图是否正在加载
    */
    public isLoading<T extends keyof UIRegistry>(viewKey: T): boolean {
        return this._loadingPromises.has(viewKey);
    }

    /**
     * 预加载视图（支持单个或多个）
     */
    public async preload<T extends keyof UIRegistry>(viewKeyOrKeys: T | T[]): Promise<void> {
        if (Array.isArray(viewKeyOrKeys)) {
            const promises = viewKeyOrKeys.map(key => this._preloadView(key));
            await Promise.all(promises);
        } else {
            await this._preloadView(viewKeyOrKeys);
        }
    }

    //----------------------------------------------------------
    // ⬇️⬇️⬇️⬇️⬇️ 内部私有方法 ⬇️⬇️⬇️⬇️⬇️
    //----------------------------------------------------------

    private _getPrefabPath<T extends ICocosView>(viewType: new () => T): string {
        let prototype = Object.getPrototypeOf(viewType);
        // 沿着原型链向上查找直到找到定义__path__的基类。注意通过类只能找到静态属性。
        while (prototype) {
            if (prototype.hasOwnProperty('__path__')) {
                return prototype.__path__ as string;
            }
            prototype = Object.getPrototypeOf(prototype);
        }
        throw new Error(`Prefab path not found for ${viewType.name}`);
    }

    /**
     * 获取所有活跃的视图节点（排除遮罩节点）
     */
    private _getActiveViews(): Node[] {
        return UIRoot.children.filter(child => child !== _uiMask && child.name !== '__UIMask__');
    }

    /**
     * 通过prefab创建Node对象
     * @param args 
     * @returns Node对象
     */
    private async _generateNode(args: { viewKey?: string, prefabPath?: string }): Promise<Node> {
        let prefabPath = args.prefabPath!;
        if (!prefabPath) {
            prefabPath = this._getPrefabPath(getViewClass<ICocosView>(args.viewKey!));
        }
        const ResMgr = ServiceLocator.getService<ICocosResManager>('ResLoader');
        const prefab = await ResMgr.loadPrefab(prefabPath);
        return instantiate(prefab);
    }

    /**
     * 调整遮罩层级：始终保持在最顶层UI的下一层
     */
    private _adjustMaskLayer(): void {
        const activeViews = this._getActiveViews();

        // 没有活跃视图时隐藏遮罩
        if (activeViews.length === 0) {
            UIMask.active = false;
            return;
        }

        // 有视图时显示遮罩并调整到倒数第二层
        UIMask.active = true;
        const targetIndex = Math.max(UIRoot.children.length - 2, 0);
        UIMask.setSiblingIndex(targetIndex);
    }

    /**
     * 更新LRU顺序
     */
    private _updateLRUOrder(viewKey: string): void {
        if (!this._cacheConfig.enableLRU) return;

        const index = this._lruOrder.indexOf(viewKey);
        if (index > -1) {
            this._lruOrder.splice(index, 1);
        }
        this._lruOrder.push(viewKey);

        // 检查缓存大小限制
        if (this._lruOrder.length > this._cacheConfig.maxSize!) {
            const oldestKey = this._lruOrder.shift()!;
            const oldestNode = this._cache.get(oldestKey);
            // 只清理未激活的视图（不在场景树中的）
            if (oldestNode && !oldestNode.parent) {
                this._cache.delete(oldestKey);
                // LRU清理不需要走框架的remove机制，因为：
                // 1. 这些节点已经不在场景树中（已通过_remove移除）
                // 2. onExit等生命周期已在_remove中调用过
                // 3. 直接销毁节点释放内存即可
                oldestNode.destroy();

                // 尝试释放对应的Prefab资源
                this._releasePrefab(oldestKey);
            }
        }
    }

    /**
     * 阻塞/解除输入事件
     */
    private _blockInput(block: boolean): void {
        if (block) {
            // 创建并保存阻塞器引用
            if (!this._inputBlocker) {
                this._inputBlocker = (event: EventTouch) => {
                    event.propagationImmediateStopped = true;
                };
            }
            // 只监听常用的触摸和鼠标事件
            input.on(Input.EventType.TOUCH_START, this._inputBlocker, this);
            input.on(Input.EventType.TOUCH_MOVE, this._inputBlocker, this);
            input.on(Input.EventType.TOUCH_END, this._inputBlocker, this);
            input.on(Input.EventType.TOUCH_CANCEL, this._inputBlocker, this);
        } else {
            // 使用保存的引用解除监听
            if (this._inputBlocker) {
                input.off(Input.EventType.TOUCH_START, this._inputBlocker, this);
                input.off(Input.EventType.TOUCH_MOVE, this._inputBlocker, this);
                input.off(Input.EventType.TOUCH_END, this._inputBlocker, this);
                input.off(Input.EventType.TOUCH_CANCEL, this._inputBlocker, this);
            }
        }
    }

    /**
     * 设置遮罩点击处理器
     */
    private _setupMaskClickHandler(): void {
        UIMask.on(Node.EventType.TOUCH_END, (event: EventTouch) => {
            if (!this._maskOptions.clickToClose) {
                return;
            }
            const view = this._internalGetTopView();
            if (!view) {
                return;
            }

            const group = this._view2group.get(view.node);
            if (group && group.trim() != "") {
                // 栈式UI：调用 _internalCloseAndPop 来处理返回逻辑
                this._internalCloseAndPop(group, false);
            } else {
                // 普通UI：直接关闭该视图
                this._internalClose(view, false);
            }
        });
    }

    /**
    * 显示等待视图
    */
    private async _showLoading(): Promise<void> {
        if (!this._loadingConfig.enabled) {
            return Promise.resolve();
        }

        // 如果已经显示了等待视图，直接返回
        if (this._loadingView && this._loadingView.activeInHierarchy) {
            return Promise.resolve();
        }

        // 首次加载或创建等待视图
        if (!this._loadingView) {
            if (this._loadingConfig.createCustomLoading) {
                // 使用自定义创建函数
                this._loadingView = await this._loadingConfig.createCustomLoading();
            } else if (this._loadingConfig.prefabPath) {
                try {
                    // 从 prefab 创建等待视图
                    this._loadingView = await this._generateNode({ prefabPath: this._loadingConfig.prefabPath });
                } catch (error) {
                    throw error;
                }
            } else {
                // 没有配置等待视图
                return Promise.resolve();
            }
        }

        // 激活并添加到场景，调整到最顶层
        this._loadingView.active = true;
        UIRoot.parent!.addChild(this._loadingView);
    }

    /**
     * 隐藏等待视图
     */
    private _hideLoading(): void {
        if (this._loadingView && this._loadingView.activeInHierarchy) {
            this._loadingView.active = false;
            if (this._loadingView.parent) {
                this._loadingView.removeFromParent();
            }
        }
    }

    /**
     * 预加载视图
     */
    private _startPreload(): void {
        if (!this._preloadConfig.views || this._preloadConfig.views.length === 0) {
            return;
        }

        setTimeout(async () => {
            for (const viewKey of this._preloadConfig.views!) {
                if (!this._preloadedViews.has(viewKey)) {
                    try {
                        await this._preloadView(viewKey);
                        this._preloadedViews.add(viewKey);
                    } catch (error) {
                        console.warn(`Failed to preload view ${viewKey}:`, error);
                    }
                }
            }
        }, this._preloadConfig.delay || 1000);
    }

    /**
     * 预加载单个视图
     */
    private async _preloadView(viewKey: string): Promise<void> {
        const viewType = getViewClass<ICocosView>(viewKey);
        if (this._cache.has(viewType.name)) {
            return; // 已经缓存
        }
        const target = await this._generateNode({ viewKey: viewKey });
        target.active = false; // 预加载的视图保持不激活状态
        this._cache.set(viewType.name, target);
        this._updateLRUOrder(viewType.name);
    }

    /**
     * 获取当前最顶层的视图
     */
    protected _internalGetTopView(): ICocosView | undefined {
        const activeViews = this._getActiveViews();
        if (activeViews.length === 0) {
            return undefined;
        }

        // 获取最后一个视图节点（最顶层）
        const target = activeViews[activeViews.length - 1];
        const comps = target.components;

        for (let i = 0; i < comps.length; i++) {
            const comp = comps[i];
            if ("__isIView__" in comp && comp.__isIView__) {
                /**
                 * 这里需要注意：
                 * 1、_view2group中存储的是通过getComponent获取的。
                 * 2、这里是通过所node.components获取的。
                 * 3、这俩种方式获得的引用可能是不同的(_view2group.get(comp) == undefined)
                 * 4、所以这里需要通过comp.constructor来获取视图类型，然后通过getComponent获取引用，确保一致。
                 * 5、但我选择了_view2group使用node当作key，这样更稳定。
                */
                // const viewType = comp.constructor as new () => ICocosView;
                // return target.getComponent(viewType) as ICocosView;
                return comp as unknown as ICocosView;
            }
        }

        console.warn(`No view found in ${target.name}`);
        return undefined;
    }


    //----------------------------------------------------------

    private async _load(viewKey: string): Promise<ICocosView> {
        // 并发控制：如果正在加载同一个视图，返回现有的Promise
        if (this._loadingPromises.has(viewKey)) {
            return this._loadingPromises.get(viewKey)!;
        }

        try {
            const view = this._loadInternal(viewKey);
            this._loadingPromises.set(viewKey, view);
            return await view;
        } finally {
            this._loadingPromises.delete(viewKey);
        }
    }

    private async _loadInternal(viewKey: string): Promise<ICocosView> {
        const viewType = getViewClass<ICocosView>(viewKey);
        let target: Node;

        if (this._cache.has(viewType.name)) {
            target = this._cache.get(viewType.name)!;
        } else {
            target = await this._generateNode({ viewKey: viewKey });
            this._cache.set(viewType.name, target);
        }

        // 更新LRU顺序
        this._updateLRUOrder(viewType.name);

        target.active = true;
        return target.getComponent(viewType)! as ICocosView;
    }

    protected async _internalOpen(viewKey: string, options?: UIOpenOptions): Promise<ICocosView> {
        const op = { ...this._openOptions, ...options };

        // 显示等待视图
        if (op.showLoading) {
            await this._showLoading();
        }

        // 打开UI前，阻塞输入事件
        this._blockInput(true);
        try {
            const view = await this._load(viewKey);
            addChild(view.node);
            this._adjustMaskLayer();

            // 先执行onEnter初始化，再播放动画
            view.onEnter(op.args);

            // 播放打开动画
            await view.onEnterAnimation?.();

            return view;
        } finally {
            // 隐藏等待视图
            if (op.showLoading) {
                this._hideLoading();
            }
            // 打开UI后，解除输入事件阻塞
            this._blockInput(false);
        }
    }

    protected async _internalClose(viewKeyOrInstance: string | IView, destroy?: boolean): Promise<void> {
        this._blockInput(true);
        try {
            await this._remove(viewKeyOrInstance, destroy);
            this._adjustMaskLayer();
        } finally {
            this._blockInput(false);
        }
    }

    protected async _internalOpenAndPush(viewKey: string, group: string, options?: UIOpenOptions): Promise<ICocosView> {
        const op = { ...this._openOptions, ...options };

        // 显示等待视图
        if (op.showLoading) {
            await this._showLoading();
        }

        // 打开UI前，阻塞输入事件
        this._blockInput(true);
        try {
            const view = await this._load(viewKey);
            let stack = this._groupStacks.get(group);
            if (!stack) {
                stack = [];
                this._groupStacks.set(group, stack);
            }

            // 暂停并移除当前栈顶视图
            const top = stack[stack.length - 1];
            if (top) {
                // 先执行onExit，再播放退出动画
                await top.onExitAnimation?.();

                top.onPause();
                top.node.removeFromParent();
            }

            // 标记视图所属组并入栈
            this._view2group.set(view.node, group);

            stack.push(view);

            addChild(view.node);
            this._adjustMaskLayer();

            // 先执行onEnter初始化，再播放动画
            view.onEnter(op.args);

            // 播放打开动画
            await view.onEnterAnimation?.();

            return view;
        } finally {
            // 隐藏等待视图
            if (op.showLoading) {
                this._hideLoading();
            }
            // 打开UI后，解除输入事件阻塞
            this._blockInput(false);
        }
    }

    protected async _internalCloseAndPop(group: string, destroy?: boolean): Promise<void> {
        const stack = this._groupStacks.get(group);
        if (!stack || stack.length === 0) {
            console.warn(`No stack or empty stack for group ${group}`);
            return;
        }

        this._blockInput(true);
        try {
            // 移除当前栈顶视图
            const removed = stack.pop()!;
            this._view2group.delete(removed.node);
            await this._remove(removed, destroy);

            // 恢复上一个视图
            const top = stack[stack.length - 1];
            if (top) {
                top.onResume();
                addChild(top.node);

                // 播放恢复动画
                await top.onEnterAnimation?.();
            }

            // 调整遮罩层级
            this._adjustMaskLayer();

        } finally {
            this._blockInput(false);
        }
    }

    /**
     * 移除视图
     */
    private async _remove(viewKeyOrInstance: string | IView, destroy?: boolean, skipAnimation?: boolean): Promise<void> {
        // 如果是 string，从缓存中获取视图实例
        if (typeof viewKeyOrInstance === 'string') {
            const viewType = getViewClass<ICocosView>(viewKeyOrInstance);
            const cached = this._cache.get(viewType.name);
            if (!cached) {
                console.warn(`No cached view found for ${viewType.name}`);
                return;
            }
            const viewInstance = cached.getComponent(viewType as any) as ICocosView;
            if (!viewInstance) {
                console.warn(`No view component found on node ${cached.name}`);
                return;
            }
            await this._remove(viewInstance as IView, destroy);
            return;
        }

        // 获取视图实例
        const viewInstance = viewKeyOrInstance as ICocosView;

        if (!skipAnimation) {
            // * 播放关闭动画,使用async是必要的，因为：
            // * 确保动画播放完成后再执行onExit和节点移除，不然还没播放动画了，UI就已经没了
            await viewInstance.onExitAnimation?.();
        }

        viewInstance.onExit();
        viewInstance.node.removeFromParent();
        viewInstance.node.active = false;

        if (destroy) {
            let cacheKey = viewInstance.constructor.name;
            this._cache.get(cacheKey)?.destroy();
            this._cache.delete(cacheKey);

            // 销毁被克隆出的UI后Node后，尝试释放 Prefab 资源
            this._releasePrefab(viewInstance);
        }
    }

    private _releasePrefab(viewKey: string | ICocosView): void {
        try {
            let prefabPath: string;
            if (typeof viewKey === 'string') {
                prefabPath = this._getPrefabPath(getViewClass<ICocosView>(viewKey));
            } else {
                prefabPath = this._getPrefabPath(viewKey.constructor as new () => ICocosView);
            }
            const ResMgr = ServiceLocator.getService<ICocosResManager>('ResLoader');
            ResMgr.release(prefabPath, Prefab);
        } catch (error) {
            console.error(`Failed to release prefab for ${viewKey}:`, error);
        }
    }

    protected _internalClearStack(group: string, destroy?: boolean): void {
        const stack = this._groupStacks.get(group);
        if (!stack) {
            console.warn(`No stack found for group ${group}`);
            return;
        }

        // 清空栈中所有视图，不播放动画
        while (stack.length > 0) {
            const view = stack.pop();
            if (view) {
                this._remove(view, destroy, true);
            }
        }

        for (const view of this._view2group.keys()) {
            this._view2group.delete(view);
        }

        // 调整遮罩层级
        this._adjustMaskLayer();
    }

    /**
     * 关闭所有视图，不播放动画
     */
    protected _internalCloseAll(destroy?: boolean) {
        const activeViews = this._getActiveViews();
        for (const node of activeViews) {
            const comps = node.components;
            for (let i = 0; i < comps.length; i++) {
                const comp = comps[i];
                if ("__isIView__" in comp && comp.__isIView__) {
                    this._remove(comp as unknown as ICocosView, destroy, true);
                    break;
                }
            }
        }
        
        for (const view of this._view2group.keys()) {
            this._view2group.delete(view);
        }

        // 清空所有栈
        this._groupStacks.clear();

        // 调整遮罩
        this._adjustMaskLayer();
    }

}