import { Component, director, input, instantiate, Node, Input, EventTouch, Prefab } from "cc";
import { IView, ServiceLocator, getViewClass, UIOpenConfig } from "../core";
import { addWidget } from "../utils";
import { UIRoot, LayerConfig, ResLoader, UIMaskConfig, UIWaitConfig } from ".";

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

type ICocosView = IView & Component & { __config__: UIOpenConfig | undefined, __exit__(): void }
class UIManager {
    private _cache: Map<string, Node> = new Map();
    private _groupStacks: Map<string, ICocosView[]> = new Map();
    private _view2group: Map<Node, string> = new Map();

    private _inputBlocker: ((event: EventTouch) => void) | null = null;
    private _uiLoadingPromises: Map<string, Promise<ICocosView>> = new Map();
    private _lruOrder: string[] = [];
    private _preloadedViews: Set<string> = new Set();

    private _cacheConfig: UICacheConfig = { maxSize: 10, enableLRU: true };
    private _preloadConfig: UIPreloadConfig = { views: [], delay: 1000 };
    private _openOptions: UIOpenConfig = { showLoading: true, clickToCloseMask: true, layer: 'default' };

    private _uiRoot: UIRoot | null = null;
    private get Root(): UIRoot {
        if (!this._uiRoot) {
            const canvas = director.getScene()!.getChildByPath('Canvas')!;
            director.addPersistRootNode(canvas);
            let uiRootNode = canvas.getChildByName('__UIRoot__');
            if (!uiRootNode) {
                uiRootNode = new Node('__UIRoot__');
                uiRootNode.layer = canvas.layer;
                uiRootNode.setParent(canvas);
                addWidget(uiRootNode);
                this._uiRoot = uiRootNode.addComponent(UIRoot);
            }
        }
        return this._uiRoot!;
    };

    public constructor() {
        // 设置遮罩点击处理器
        this.Root.getUIMask().on(Node.EventType.TOUCH_END, (event: EventTouch) => {
            const view = this._internalGetTopView();
            if (!view) {
                return;
            }

            if (!view.__config__?.clickToCloseMask) {
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

        // 启用预下载
        this._startPreload();
    }

    /**
     * 初始化UI层级配置
     * @param layers 层级配置数组，可以是字符串数组或LayerConfig数组
     */
    public setLayerConfig(layers: (string | LayerConfig)[]) {
        this.Root.createLayers(layers);
    }

    /**
     * 设置遮罩配置
     */
    public setMaskConfig(options: UIMaskConfig): void {
        this.Root.setMaskConfig(options);
    }

    /**
     * 设置等待视图配置
     */
    public setWaitConfig(config: UIWaitConfig): void {
        this.Root.setWaitConfig(config);
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
    public isOpened<T extends keyof UIRegistry>(viewKey: T): boolean {
        const viewType = getViewClass<ICocosView>(viewKey as string);
        return this._cache.has(viewType.name) && this._cache.get(viewType.name)!.parent !== null;
    }

    /**
     * 检查视图是否正在加载
     */
    public isLoading<T extends keyof UIRegistry>(viewKey: T): boolean {
        return this._uiLoadingPromises.has(viewKey);
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
     * 从给定的Node对象上获得IView类型的脚本
     * @param target 
     * @returns 
     */
    private _getIViewFromNode(target: Node): ICocosView | undefined {
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
    }

    /**
     * 通过prefab创建Node对象
     * @param args 
     * @returns Node对象
     */
    private async _generateNode(viewKey: string): Promise<Node> {
        const prefabPath = this._getPrefabPath(getViewClass<ICocosView>(viewKey!));
        const ResMgr = ServiceLocator.getService<ResLoader>('ResLoader');
        const prefabObj = await ResMgr.loadPrefab(prefabPath);
        return instantiate(prefabObj);
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
        const target = await this._generateNode(viewKey);
        target.active = false; // 预加载的视图保持不激活状态
        this._cache.set(viewType.name, target);
        this._updateLRUOrder(viewType.name);
    }

    /**
     * 计算所有层级，获取最顶层的视图
     */
    protected _internalGetTopView(): ICocosView | undefined {
        const topNode = this.Root.getGlobalTopUI()?.node;
        if (!topNode) {
            return undefined;
        }
        return this._getIViewFromNode(topNode);
    }


    //----------------------------------------------------------

    private async _load(viewKey: string): Promise<ICocosView> {
        // 并发控制：如果正在加载同一个视图，返回现有的Promise
        if (this._uiLoadingPromises.has(viewKey)) {
            return this._uiLoadingPromises.get(viewKey)!;
        }

        try {
            const view = this._loadInternal(viewKey);
            this._uiLoadingPromises.set(viewKey, view);
            return await view;
        } finally {
            this._uiLoadingPromises.delete(viewKey);
        }
    }

    private async _loadInternal(viewKey: string): Promise<ICocosView> {
        const viewType = getViewClass<ICocosView>(viewKey);
        let target: Node;

        if (this._cache.has(viewType.name)) {
            target = this._cache.get(viewType.name)!;
        } else {
            target = await this._generateNode(viewKey);
            this._cache.set(viewType.name, target);
        }

        // 更新LRU顺序
        this._updateLRUOrder(viewType.name);

        target.active = true;
        return target.getComponent(viewType)! as ICocosView;
    }

    protected async _internalOpen(viewKey: string, options?: UIOpenConfig): Promise<ICocosView> {
        const op = { ...this._openOptions, ...options };

        // 显示等待视图
        if (op.showLoading) {
            await this.Root.showLoading(op.layer);
        }

        // 打开UI前，阻塞输入事件
        this._blockInput(true);
        try {
            const view = await this._load(viewKey);
            // 添加到指定层级
            this.Root.addUINode(view.node, op.layer);

            view.__config__ = op;
            // 先执行onEnter初始化，再播放动画
            view.onEnter(op.args);

            // 播放打开动画
            await view.onEnterAnimation?.();

            return view;
        } finally {
            // 隐藏等待视图
            if (op.showLoading) {
                this.Root.hideLoading();
            }
            // 打开UI后，解除输入事件阻塞
            this._blockInput(false);
        }
    }

    protected async _internalClose(viewKeyOrInstance: string | IView, destroy?: boolean): Promise<void> {
        this._blockInput(true);
        try {
            await this._remove(viewKeyOrInstance, destroy);
        } finally {
            this._blockInput(false);
        }
    }

    protected async _internalOpenAndPush(viewKey: string, group: string, options?: UIOpenConfig): Promise<ICocosView> {
        const op = { ...this._openOptions, ...options };

        // 显示等待视图
        if (op.showLoading) {
            await this.Root.showLoading(op.layer);
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
                this.Root.removeUINode(top.node);
            }

            // 标记视图所属组并入栈
            this._view2group.set(view.node, group);

            stack.push(view);

            // 添加到指定层级
            this.Root.addUINode(view.node, op.layer);

            view.__config__ = op;
            // 先执行onEnter初始化，再播放动画
            view.onEnter(op.args);

            // 播放打开动画
            await view.onEnterAnimation?.();

            return view;
        } finally {
            // 隐藏等待视图
            if (op.showLoading) {
                this.Root.hideLoading();
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
                // 添加到指定层级
                this.Root.addUINode(top.node, top.__config__?.layer);

                // 播放恢复动画
                await top.onEnterAnimation?.();
            }
        } finally {
            this._blockInput(false);
        }
    }

    /**
     * 按顺序打开一组UI，如果前一个UI正在打开，则等待前一个UI关闭后再打开下一个UI
     * @param queue 要打开的UI队列
     */
    protected _internalOpenQueue(queue: { viewKey: string, options: UIOpenConfig }[], index: number = 0) {
        if (index >= queue.length) {
            return;
        }
        const { viewKey, options } = queue[index];
        const op = {
            ...options,
            onExitCallback: (currentView: ICocosView) => {
                this._internalOpenQueue(queue, index + 1);
            }
        };
        this._internalOpen(viewKey, op);
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
        viewInstance.__exit__();
        this.Root.removeUINode(viewInstance.node);
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
            const ResMgr = ServiceLocator.getService<ResLoader>('ResLoader');
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

        // forEach 方法会按插入顺序遍历所有 初始存在的元素，即使元素在遍历过程中被删除，也不会影响剩余元素的遍历（已删除的元素不会被重复遍历，但未遍历的元素仍会被处理）。
        // 因此可直接在回调中判断并删除目标元素。
        this._view2group.forEach((value, key, map) => {
            if (value === group) {
                map.delete(key);
            }
        });

        // 清空栈中所有视图，不播放动画
        while (stack.length > 0) {
            const view = stack.pop();
            if (view) {
                this._remove(view, destroy, true);
            }
        }
    }

    /**
     * 关闭所有视图，不播放动画
     */
    protected _internalCloseAll(destroy?: boolean) {
        // 使用现有的方法获取所有活跃视图
        const activeViews = this.Root.getAllActiveUINodes();
        // 从后往前遍历，避免删除时索引问题
        for (let i = activeViews.length - 1; i >= 0; i--) {
            const target = activeViews[i];
            const comp = this._getIViewFromNode(target);
            if (comp) {
                this._remove(comp, destroy, true);
            }
        }

        // 清空所有UI组引用
        this._view2group.clear();

        // 清空所有栈
        this._groupStacks.clear();
    }
}

export class CCUIManager extends UIManager {
    getTopView(): IView | undefined {
        return this._internalGetTopView();
    }
    open<T extends keyof UIRegistry>(viewClass: T, args?: UIOpenConfig): Promise<InstanceType<UIRegistry[T]>> {
        return this._internalOpen(viewClass, args) as Promise<InstanceType<UIRegistry[T]>>;
    }
    close<T extends keyof UIRegistry>(viewClass: T): Promise<void> {
        return this._internalClose(viewClass);
    }
    openAndPush<T extends keyof UIRegistry>(viewClass: T, group: string, args?: UIOpenConfig): Promise<InstanceType<UIRegistry[T]>> {
        return this._internalOpenAndPush(viewClass, group, args) as Promise<InstanceType<UIRegistry[T]>>;
    }
    closeAndPop(group: string, destroy?: boolean): Promise<void> {
        return this._internalCloseAndPop(group, destroy);
    }
    openQueue(queue: { viewKey: string, options: UIOpenConfig }[]): void {
        return this._internalOpenQueue(queue, 0);
    }
    clearStack(group: string, destroy?: boolean): void {
        this._internalClearStack(group, destroy);
    }
    closeAll(destroy?: boolean): void {
        this._internalCloseAll(destroy);
    }
}