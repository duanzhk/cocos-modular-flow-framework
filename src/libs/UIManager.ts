import { Component, director, input, instantiate, Node, Input, EventTouch, Widget, Sprite, Prefab, SpriteFrame, Texture2D, Color, Rect } from "cc";
import { ICocosResManager, IUIManager, IView, ServiceLocator, getViewClass } from "../core";

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
 * 为节点添加全屏Widget组件
 */
function addWidget(node: Node) {
    const widget = node.getComponent(Widget) || node.addComponent(Widget);
    widget.isAlignLeft = widget.isAlignRight = widget.isAlignTop = widget.isAlignBottom = true;
    widget.left = widget.right = widget.top = widget.bottom = 0;
}

/**
 * 创建纯色SpriteFrame用于遮罩
 */
function createSolidColorSpriteFrame(color: Color = new Color(0, 0, 0, 125)): SpriteFrame {
    // 创建一个1x1像素的纯色纹理
    const texture = new Texture2D();
    texture.reset({
        width: 1,
        height: 1,
        format: Texture2D.PixelFormat.RGBA8888
    });
    
    // 设置像素数据
    const pixelData = new Uint8Array(4);
    pixelData[0] = color.r;
    pixelData[1] = color.g;
    pixelData[2] = color.b;
    pixelData[3] = color.a;
    
    texture.uploadData(pixelData);
    
    // 创建SpriteFrame
    const spriteFrame = new SpriteFrame();
    spriteFrame.texture = texture;
    spriteFrame.rect = new Rect(0, 0, 1, 1);
    
    return spriteFrame;
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
            _uiMask.addComponent(Sprite).spriteFrame = createSolidColorSpriteFrame();
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

type ICocosView = IView & Component
// 接口隔离，实现具体的CcocosUIManager
abstract class CcocosUIManager implements IUIManager {
    getTopView(): IView | undefined {
        return this.internalGetTopView();
    }
    open<T extends keyof UIRegistry>(viewClass: T, args?: any): Promise<InstanceType<UIRegistry[T]>> {
        return this.internalOpen(viewClass, args) as Promise<InstanceType<UIRegistry[T]>>;
    }
    close<T extends keyof UIRegistry>(viewClass: T): void {
        this.internalClose(viewClass);
    }
    openAndPush<T extends keyof UIRegistry>(viewClass: T, group: string, args?: any): Promise<InstanceType<UIRegistry[T]>> {
        return this.internalOpenAndPush(viewClass, group, args) as Promise<InstanceType<UIRegistry[T]>>;
    }
    closeAndPop(group: string, destroy?: boolean): void {
        this.internalCloseAndPop(group, destroy);
    }
    clearStack(group: string, destroy?: boolean): void {
        this.internalClearStack(group, destroy);
    }

    protected abstract internalOpen(viewKey: string, args?: any): Promise<ICocosView>
    protected abstract internalClose(viewKey: string | IView, destory?: boolean): void
    protected abstract internalOpenAndPush(viewKey: string, group: string, args?: any): Promise<ICocosView>
    protected abstract internalCloseAndPop(group: string, destroy?: boolean): void;
    protected abstract internalClearStack(group: string, destroy?: boolean): void
    protected abstract internalGetTopView(): ICocosView | undefined
}

export class UIManager extends CcocosUIManager {
    private _cache: Map<string, Node> = new Map();
    private _groupStacks: Map<string, ICocosView[]> = new Map();
    private _inputBlocker: ((event: EventTouch) => void) | null = null;
    private _maskOptions: UIMaskOptions = { clickToClose: true };

    public constructor() {
        super();
        this._setupMaskClickHandler();
    }

    /**
     * 设置遮罩配置
     */
    public setMaskOptions(options: UIMaskOptions): void {
        this._maskOptions = { ...this._maskOptions, ...options };
        if (options.color && _uiMask) {
            const sprite = _uiMask.getComponent(Sprite);
            if (sprite) {
                sprite.spriteFrame = createSolidColorSpriteFrame(options.color);
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
            const view = this.getTopView();
            if (!view) {
                return;
            }
            
            // 区分两种情况处理：
            // 1. 如果视图有 __group__ 属性且不为 undefined，说明是通过 openAndPush 打开的栈式UI
            // 2. 否则是通过 open 打开的普通 UI
            if ('__group__' in view && view.__group__ !== undefined) {
                // 栈式UI：调用 closeAndPop 来处理返回逻辑
                this.closeAndPop(view.__group__ as string, false);
            } else {
                // 普通UI：直接关闭该视图
                this.internalClose(view, false);
            }
        });
    }

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

    private async _load(viewKey: string, args?: any): Promise<ICocosView> {
        const viewType = getViewClass<ICocosView>(viewKey);
        let target: Node
        if (this._cache.has(viewType.name)) {
            target = this._cache.get(viewType.name)!;
        } else {
            let prefabPath = this._getPrefabPath(viewType);
            const ResMgr = ServiceLocator.getService<ICocosResManager>('ResLoader');
            const prefab = await ResMgr.loadPrefab(prefabPath)
            target = instantiate(prefab) as Node
            this._cache.set(viewType.name, target);
        }
        target.active = true;
        return target.getComponent(viewType)! as ICocosView;
    }

    private _remove(viewKeyOrInstance: string | IView, destroy?: boolean): void {
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
            this._remove(viewInstance as IView, destroy);
            return;
        }

        // 处理视图实例
        const viewInstance = viewKeyOrInstance as ICocosView;
        if ('__group__' in viewInstance) {
            viewInstance.__group__ = undefined
        }
        viewInstance.onExit();
        viewInstance.node.removeFromParent();
        viewInstance.node.active = false;

        if (destroy) {
            let cacheKey = viewInstance.constructor.name;
            this._cache.get(cacheKey)?.destroy();
            this._cache.delete(cacheKey);

            // 销毁被克隆出的UI后Node后，尝试释放 Prefab 资源
            try {
                const viewType = viewInstance.constructor as new () => ICocosView;
                const prefabPath = this._getPrefabPath(viewType);
                const ResMgr = ServiceLocator.getService<ICocosResManager>('ResLoader');
                ResMgr.release(prefabPath, Prefab);
            } catch (error) {
                console.error(`Failed to release prefab for ${cacheKey}:`, error);
            }
        }
    }

    /**
     * 获取当前最顶层的视图
     */
    protected internalGetTopView(): ICocosView | undefined {
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
                return comp as unknown as ICocosView;
            }
        }
        
        console.warn(`No view found in ${target.name}`);
        return undefined;
    }

    protected async internalOpen(viewKey: string, args?: any): Promise<ICocosView> {
        this._blockInput(true);
        try {
            const view = await this._load(viewKey, args);
            addChild(view.node);
            this._adjustMaskLayer();
            view.onEnter(args);
            return view;
        } finally {
            this._blockInput(false);
        }
    }

    protected internalClose(viewKey: string | IView, destroy?: boolean): void {
        this._remove(viewKey, destroy);
        this._adjustMaskLayer();
    }

    protected async internalOpenAndPush(viewKey: string, group: string, args?: any): Promise<ICocosView> {
        this._blockInput(true);
        try {
            const view = await this._load(viewKey, args);
            let stack = this._groupStacks.get(group);
            if (!stack) {
                stack = [];
                this._groupStacks.set(group, stack);
            }
            
            // 暂停并移除当前栈顶视图
            const top = stack[stack.length - 1];
            if (top) {
                top.onPause();
                top.node.removeFromParent();
            }
            
            // 标记视图所属组并入栈
            if ('__group__' in view) {
                view.__group__ = group;
            }
            stack.push(view);
            
            addChild(view.node);
            this._adjustMaskLayer();
            view.onEnter(args);
            return view;
        } finally {
            this._blockInput(false);
        }
    }

    protected internalCloseAndPop(group: string, destroy?: boolean): void {
        const stack = this._groupStacks.get(group);
        if (!stack || stack.length === 0) {
            console.warn(`No stack or empty stack for group ${group}`);
            return;
        }
        
        // 移除当前栈顶视图
        this._remove(stack.pop()!, destroy);
        
        // 恢复上一个视图
        const top = stack[stack.length - 1];
        if (top) {
            top.onResume();
            addChild(top.node);
        }
        
        // 调整遮罩层级
        this._adjustMaskLayer();
    }

    protected internalClearStack(group: string, destroy?: boolean): void {
        const stack = this._groupStacks.get(group);
        if (!stack) {
            console.warn(`No stack found for group ${group}`);
            return;
        }
        
        // 清空栈中所有视图
        while (stack.length > 0) {
            const view = stack.pop();
            if (view) {
                this._remove(view, destroy);
            }
        }
        
        // 调整遮罩层级
        this._adjustMaskLayer();
    }

    /**
     * 检查指定视图是否已打开
     */
    public contains<T extends keyof UIRegistry>(viewKey: T): boolean {
        const viewType = getViewClass<ICocosView>(viewKey as string);
        return this._cache.has(viewType.name) && this._cache.get(viewType.name)!.parent !== null;
    }

    /**
     * 查看指定组的栈顶视图（不移除）
     */
    public peek(group: string): IView | undefined {
        const stack = this._groupStacks.get(group);
        if (!stack || stack.length === 0) {
            return undefined;
        }
        return stack[stack.length - 1];
    }

    /**
     * 获取指定组的栈深度
     */
    public getStackDepth(group: string): number {
        const stack = this._groupStacks.get(group);
        return stack ? stack.length : 0;
    }

    /**
     * 获取所有打开的视图数量
     */
    public getOpenViewCount(): number {
        return this._getActiveViews().length;
    }

    /**
     * 关闭所有视图
     */
    public closeAll(destroy?: boolean): void {
        const activeViews = this._getActiveViews();
        activeViews.forEach(node => {
            const comps = node.components;
            for (let i = 0; i < comps.length; i++) {
                const comp = comps[i];
                if ("__isIView__" in comp && comp.__isIView__) {
                    this._remove(comp as unknown as ICocosView, destroy);
                    break;
                }
            }
        });
        
        // 清空所有栈
        this._groupStacks.clear();
        
        // 调整遮罩
        this._adjustMaskLayer();
    }

}