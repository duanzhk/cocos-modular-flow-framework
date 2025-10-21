import { __awaiter } from '../_virtual/_tslib.js';
import { director, Node, Sprite, Widget, input, Input, Prefab, instantiate } from 'cc';
import { ServiceLocator } from '../core/ServiceLocator.js';
import { getViewClass } from '../core/Decorators.js';
import '../utils/ArrayExt.js';
import { ImageUtil } from '../utils/ImageUtil.js';
import '../utils/MathUtil.js';

/**
 * 为节点添加全屏Widget组件
 */
function addWidget(node) {
    const widget = node.getComponent(Widget) || node.addComponent(Widget);
    widget.isAlignLeft = widget.isAlignRight = widget.isAlignTop = widget.isAlignBottom = true;
    widget.left = widget.right = widget.top = widget.bottom = 0;
}
let _uiRoot;
const UIRoot = new Proxy({}, {
    get(target, prop) {
        if (!_uiRoot) {
            const canvas = director.getScene().getChildByPath('Canvas');
            director.addPersistRootNode(canvas);
            _uiRoot = new Node('__UIRoot__');
            _uiRoot.layer = canvas.layer;
            _uiRoot.setParent(canvas);
            addWidget(_uiRoot);
        }
        return Reflect.get(_uiRoot, prop);
    }
});
function setLayer(node) {
    node.layer = UIRoot.layer;
    node.children.forEach(child => {
        setLayer(child);
    });
}
function addChild(node) {
    UIRoot.addChild(node);
    setLayer(node);
}
let _uiMask;
/**
 * UI遮罩节点代理
 */
const UIMask = new Proxy({}, {
    get(target, prop) {
        if (!_uiMask) {
            _uiMask = new Node('__UIMask__');
            addChild(_uiMask);
            _uiMask.setPosition(0, 0);
            _uiMask.addComponent(Sprite).spriteFrame = ImageUtil.createSolidColorSpriteFrame();
            addWidget(_uiMask);
        }
        const value = Reflect.get(_uiMask, prop);
        // 绑定方法到原始实例
        return typeof value === 'function' ? value.bind(_uiMask) : value;
    },
    set(target, p, newValue, receiver) {
        if (p === 'active') {
            _uiMask.active = newValue;
            return true;
        }
        return Reflect.set(_uiMask, p, newValue, receiver);
    }
});
// 接口隔离，实现具体的CcocosUIManager
class CcocosUIManager {
    getTopView() {
        return this._internalGetTopView();
    }
    open(viewClass, args) {
        return this._internalOpen(viewClass, args);
    }
    close(viewClass) {
        return this._internalClose(viewClass);
    }
    openAndPush(viewClass, group, args) {
        return this._internalOpenAndPush(viewClass, group, args);
    }
    closeAndPop(group, destroy) {
        return this._internalCloseAndPop(group, destroy);
    }
    clearStack(group, destroy) {
        this._internalClearStack(group, destroy);
    }
    closeAll(destroy) {
        this._internalCloseAll(destroy);
    }
}
class UIManager extends CcocosUIManager {
    constructor() {
        super();
        this._cache = new Map();
        this._groupStacks = new Map();
        this._view2group = new Map();
        this._inputBlocker = null;
        this._loadingView = null;
        this._loadingPromises = new Map();
        this._lruOrder = [];
        this._preloadedViews = new Set();
        this._maskOptions = { clickToClose: true };
        this._loadingConfig = { enabled: true, delay: 200, minShowTime: 500 };
        this._cacheConfig = { maxSize: 10, enableLRU: true };
        this._preloadConfig = { views: [], delay: 1000 };
        this._openOptions = { showLoading: true, clickToClose: true };
        this._setupMaskClickHandler();
        this._startPreload();
    }
    /**
     * 设置遮罩配置
     */
    setMaskConfig(options) {
        this._maskOptions = Object.assign(Object.assign({}, this._maskOptions), options);
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
    setLoadingConfig(config) {
        this._loadingConfig = Object.assign(Object.assign({}, this._loadingConfig), config);
    }
    /**
     * 设置缓存配置
     */
    setCacheConfig(config) {
        this._cacheConfig = Object.assign(Object.assign({}, this._cacheConfig), config);
    }
    /**
     * 设置预加载配置
     */
    setPreloadConfig(config) {
        this._preloadConfig = Object.assign(Object.assign({}, this._preloadConfig), config);
        this._startPreload();
    }
    /**
     * 检查指定视图是否已打开
     */
    contains(viewKey) {
        const viewType = getViewClass(viewKey);
        return this._cache.has(viewType.name) && this._cache.get(viewType.name).parent !== null;
    }
    /**
     * 检查视图是否正在加载
    */
    isLoading(viewKey) {
        return this._loadingPromises.has(viewKey);
    }
    /**
     * 预加载视图（支持单个或多个）
     */
    preload(viewKeyOrKeys) {
        return __awaiter(this, void 0, void 0, function* () {
            if (Array.isArray(viewKeyOrKeys)) {
                const promises = viewKeyOrKeys.map(key => this._preloadView(key));
                yield Promise.all(promises);
            }
            else {
                yield this._preloadView(viewKeyOrKeys);
            }
        });
    }
    //----------------------------------------------------------
    // ⬇️⬇️⬇️⬇️⬇️ 内部私有方法 ⬇️⬇️⬇️⬇️⬇️
    //----------------------------------------------------------
    _getPrefabPath(viewType) {
        let prototype = Object.getPrototypeOf(viewType);
        // 沿着原型链向上查找直到找到定义__path__的基类。注意通过类只能找到静态属性。
        while (prototype) {
            if (prototype.hasOwnProperty('__path__')) {
                return prototype.__path__;
            }
            prototype = Object.getPrototypeOf(prototype);
        }
        throw new Error(`Prefab path not found for ${viewType.name}`);
    }
    /**
     * 获取所有活跃的视图节点（排除遮罩节点）
     */
    _getActiveViews() {
        return UIRoot.children.filter(child => child !== _uiMask && child.name !== '__UIMask__');
    }
    /**
     * 通过prefab创建Node对象
     * @param args
     * @returns Node对象
     */
    _generateNode(args) {
        return __awaiter(this, void 0, void 0, function* () {
            let prefabPath = args.prefabPath;
            if (!prefabPath) {
                prefabPath = this._getPrefabPath(getViewClass(args.viewKey));
            }
            const ResMgr = ServiceLocator.getService('ResLoader');
            const prefab = yield ResMgr.loadPrefab(prefabPath);
            return instantiate(prefab);
        });
    }
    /**
     * 调整遮罩层级：始终保持在最顶层UI的下一层
     */
    _adjustMaskLayer() {
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
    _updateLRUOrder(viewKey) {
        if (!this._cacheConfig.enableLRU)
            return;
        const index = this._lruOrder.indexOf(viewKey);
        if (index > -1) {
            this._lruOrder.splice(index, 1);
        }
        this._lruOrder.push(viewKey);
        // 检查缓存大小限制
        if (this._lruOrder.length > this._cacheConfig.maxSize) {
            const oldestKey = this._lruOrder.shift();
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
    _blockInput(block) {
        if (block) {
            // 创建并保存阻塞器引用
            if (!this._inputBlocker) {
                this._inputBlocker = (event) => {
                    event.propagationImmediateStopped = true;
                };
            }
            // 只监听常用的触摸和鼠标事件
            input.on(Input.EventType.TOUCH_START, this._inputBlocker, this);
            input.on(Input.EventType.TOUCH_MOVE, this._inputBlocker, this);
            input.on(Input.EventType.TOUCH_END, this._inputBlocker, this);
            input.on(Input.EventType.TOUCH_CANCEL, this._inputBlocker, this);
        }
        else {
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
    _setupMaskClickHandler() {
        UIMask.on(Node.EventType.TOUCH_END, (event) => {
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
            }
            else {
                // 普通UI：直接关闭该视图
                this._internalClose(view, false);
            }
        });
    }
    /**
    * 显示等待视图
    */
    _showLoading() {
        return __awaiter(this, void 0, void 0, function* () {
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
                    this._loadingView = yield this._loadingConfig.createCustomLoading();
                }
                else if (this._loadingConfig.prefabPath) {
                    try {
                        // 从 prefab 创建等待视图
                        this._loadingView = yield this._generateNode({ prefabPath: this._loadingConfig.prefabPath });
                    }
                    catch (error) {
                        throw error;
                    }
                }
                else {
                    // 没有配置等待视图
                    return Promise.resolve();
                }
            }
            // 激活并添加到场景，调整到最顶层
            this._loadingView.active = true;
            UIRoot.parent.addChild(this._loadingView);
        });
    }
    /**
     * 隐藏等待视图
     */
    _hideLoading() {
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
    _startPreload() {
        if (!this._preloadConfig.views || this._preloadConfig.views.length === 0) {
            return;
        }
        setTimeout(() => __awaiter(this, void 0, void 0, function* () {
            for (const viewKey of this._preloadConfig.views) {
                if (!this._preloadedViews.has(viewKey)) {
                    try {
                        yield this._preloadView(viewKey);
                        this._preloadedViews.add(viewKey);
                    }
                    catch (error) {
                        console.warn(`Failed to preload view ${viewKey}:`, error);
                    }
                }
            }
        }), this._preloadConfig.delay || 1000);
    }
    /**
     * 预加载单个视图
     */
    _preloadView(viewKey) {
        return __awaiter(this, void 0, void 0, function* () {
            const viewType = getViewClass(viewKey);
            if (this._cache.has(viewType.name)) {
                return; // 已经缓存
            }
            const target = yield this._generateNode({ viewKey: viewKey });
            target.active = false; // 预加载的视图保持不激活状态
            this._cache.set(viewType.name, target);
            this._updateLRUOrder(viewType.name);
        });
    }
    /**
     * 获取当前最顶层的视图
     */
    _internalGetTopView() {
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
                return comp;
            }
        }
        console.warn(`No view found in ${target.name}`);
        return undefined;
    }
    //----------------------------------------------------------
    _load(viewKey) {
        return __awaiter(this, void 0, void 0, function* () {
            // 并发控制：如果正在加载同一个视图，返回现有的Promise
            if (this._loadingPromises.has(viewKey)) {
                return this._loadingPromises.get(viewKey);
            }
            try {
                const view = this._loadInternal(viewKey);
                this._loadingPromises.set(viewKey, view);
                return yield view;
            }
            finally {
                this._loadingPromises.delete(viewKey);
            }
        });
    }
    _loadInternal(viewKey) {
        return __awaiter(this, void 0, void 0, function* () {
            const viewType = getViewClass(viewKey);
            let target;
            if (this._cache.has(viewType.name)) {
                target = this._cache.get(viewType.name);
            }
            else {
                target = yield this._generateNode({ viewKey: viewKey });
                this._cache.set(viewType.name, target);
            }
            // 更新LRU顺序
            this._updateLRUOrder(viewType.name);
            target.active = true;
            return target.getComponent(viewType);
        });
    }
    _internalOpen(viewKey, options) {
        var _a;
        return __awaiter(this, void 0, void 0, function* () {
            const op = Object.assign(Object.assign({}, this._openOptions), options);
            // 显示等待视图
            if (op.showLoading) {
                yield this._showLoading();
            }
            // 打开UI前，阻塞输入事件
            this._blockInput(true);
            try {
                const view = yield this._load(viewKey);
                addChild(view.node);
                this._adjustMaskLayer();
                // 先执行onEnter初始化，再播放动画
                view.onEnter(op.args);
                // 播放打开动画
                yield ((_a = view.onEnterAnimation) === null || _a === void 0 ? void 0 : _a.call(view));
                return view;
            }
            finally {
                // 隐藏等待视图
                if (op.showLoading) {
                    this._hideLoading();
                }
                // 打开UI后，解除输入事件阻塞
                this._blockInput(false);
            }
        });
    }
    _internalClose(viewKeyOrInstance, destroy) {
        return __awaiter(this, void 0, void 0, function* () {
            this._blockInput(true);
            try {
                yield this._remove(viewKeyOrInstance, destroy);
                this._adjustMaskLayer();
            }
            finally {
                this._blockInput(false);
            }
        });
    }
    _internalOpenAndPush(viewKey, group, options) {
        var _a, _b;
        return __awaiter(this, void 0, void 0, function* () {
            const op = Object.assign(Object.assign({}, this._openOptions), options);
            // 显示等待视图
            if (op.showLoading) {
                yield this._showLoading();
            }
            // 打开UI前，阻塞输入事件
            this._blockInput(true);
            try {
                const view = yield this._load(viewKey);
                let stack = this._groupStacks.get(group);
                if (!stack) {
                    stack = [];
                    this._groupStacks.set(group, stack);
                }
                // 暂停并移除当前栈顶视图
                const top = stack[stack.length - 1];
                if (top) {
                    // 先执行onExit，再播放退出动画
                    yield ((_a = top.onExitAnimation) === null || _a === void 0 ? void 0 : _a.call(top));
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
                yield ((_b = view.onEnterAnimation) === null || _b === void 0 ? void 0 : _b.call(view));
                return view;
            }
            finally {
                // 隐藏等待视图
                if (op.showLoading) {
                    this._hideLoading();
                }
                // 打开UI后，解除输入事件阻塞
                this._blockInput(false);
            }
        });
    }
    _internalCloseAndPop(group, destroy) {
        var _a;
        return __awaiter(this, void 0, void 0, function* () {
            const stack = this._groupStacks.get(group);
            if (!stack || stack.length === 0) {
                console.warn(`No stack or empty stack for group ${group}`);
                return;
            }
            this._blockInput(true);
            try {
                // 移除当前栈顶视图
                const removed = stack.pop();
                this._view2group.delete(removed.node);
                yield this._remove(removed, destroy);
                // 恢复上一个视图
                const top = stack[stack.length - 1];
                if (top) {
                    top.onResume();
                    addChild(top.node);
                    // 播放恢复动画
                    yield ((_a = top.onEnterAnimation) === null || _a === void 0 ? void 0 : _a.call(top));
                }
                // 调整遮罩层级
                this._adjustMaskLayer();
            }
            finally {
                this._blockInput(false);
            }
        });
    }
    /**
     * 移除视图
     */
    _remove(viewKeyOrInstance, destroy, skipAnimation) {
        var _a, _b;
        return __awaiter(this, void 0, void 0, function* () {
            // 如果是 string，从缓存中获取视图实例
            if (typeof viewKeyOrInstance === 'string') {
                const viewType = getViewClass(viewKeyOrInstance);
                const cached = this._cache.get(viewType.name);
                if (!cached) {
                    console.warn(`No cached view found for ${viewType.name}`);
                    return;
                }
                const viewInstance = cached.getComponent(viewType);
                if (!viewInstance) {
                    console.warn(`No view component found on node ${cached.name}`);
                    return;
                }
                yield this._remove(viewInstance, destroy);
                return;
            }
            // 获取视图实例
            const viewInstance = viewKeyOrInstance;
            if (!skipAnimation) {
                // * 播放关闭动画,使用async是必要的，因为：
                // * 确保动画播放完成后再执行onExit和节点移除，不然还没播放动画了，UI就已经没了
                yield ((_a = viewInstance.onExitAnimation) === null || _a === void 0 ? void 0 : _a.call(viewInstance));
            }
            viewInstance.onExit();
            viewInstance.node.removeFromParent();
            viewInstance.node.active = false;
            if (destroy) {
                let cacheKey = viewInstance.constructor.name;
                (_b = this._cache.get(cacheKey)) === null || _b === void 0 ? void 0 : _b.destroy();
                this._cache.delete(cacheKey);
                // 销毁被克隆出的UI后Node后，尝试释放 Prefab 资源
                this._releasePrefab(viewInstance);
            }
        });
    }
    _releasePrefab(viewKey) {
        try {
            let prefabPath;
            if (typeof viewKey === 'string') {
                prefabPath = this._getPrefabPath(getViewClass(viewKey));
            }
            else {
                prefabPath = this._getPrefabPath(viewKey.constructor);
            }
            const ResMgr = ServiceLocator.getService('ResLoader');
            ResMgr.release(prefabPath, Prefab);
        }
        catch (error) {
            console.error(`Failed to release prefab for ${viewKey}:`, error);
        }
    }
    _internalClearStack(group, destroy) {
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
    _internalCloseAll(destroy) {
        const activeViews = this._getActiveViews();
        for (const node of activeViews) {
            const comps = node.components;
            for (let i = 0; i < comps.length; i++) {
                const comp = comps[i];
                if ("__isIView__" in comp && comp.__isIView__) {
                    this._remove(comp, destroy, true);
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

export { UIManager };
