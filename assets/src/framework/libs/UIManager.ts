import { Component, director, input, instantiate, Node, Input, EventTouch, Widget, Sprite } from "cc";
import { IResManager, IUIManager, IView, ServiceLocator } from "@core";

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
const UIMask = new Proxy({} as Node, {
    get(target, prop) {
        if (!_uiMask) {
            _uiMask = new Node('__UIMask__');
            addChild(_uiMask);
            addWidget(_uiMask);
            _uiMask.setPosition(0, 0);
            _uiMask.addComponent(Sprite).color.set(0, 0, 0, 0.5);
        }
        const value = Reflect.get(_uiMask!, prop);
        // 如果是放的话，可能要绑定原始实例上下文
        return typeof value === 'function' ? value.bind(_uiMask) : value;
        // return Reflect.get(_uiMask, prop)
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
    open<T extends IView>(viewType: new () => T, args?: any): Promise<T> {
        let vt = viewType as unknown as new () => ICocosView;
        return this.internalOpen(vt, args) as unknown as Promise<T>;
    }
    close<T extends IView>(viewortype: T | (new () => T), destory?: boolean): void {
        this.internalClose(viewortype as any, destory);
    }
    openAndPush<T extends IView>(viewType: new () => T, group: string, args?: any): Promise<T> {
        let vt = viewType as unknown as new () => ICocosView;
        return this.internalOpenAndPush(vt, group, args) as unknown as Promise<T>;
    }
    closeAndPop(group: string, destroy?: boolean): void {
        this.internalCloseAndPop(group, destroy);
    }
    clearStack(group: string, destroy?: boolean): void {
        this.internalClearStack(group, destroy);
    }

    protected abstract internalOpen<T extends ICocosView>(viewType: new () => T, args?: any): Promise<T>
    protected abstract internalClose<T extends ICocosView>(viewortype: T | (new () => T), destory?: boolean): void
    protected abstract internalOpenAndPush<T extends ICocosView>(viewType: new () => T, group: string, args?: any): Promise<T>
    protected abstract internalCloseAndPop(group: string, destroy?: boolean): void;
    protected abstract internalClearStack(group: string, destroy?: boolean): void
    protected abstract internalGetTopView(): ICocosView | undefined
}

export class UIManager extends CcocosUIManager {
    private _cache: Map<string, Node> = new Map();
    private _groupStacks: Map<string, ICocosView[]> = new Map();

    public constructor() {
        super()
        UIMask.on(Node.EventType.TOUCH_END, (event: EventTouch) => {
            let view = this.getTopView()!
            if ('__group__' in view) {
                if (view.__group__ != undefined) {
                    this.closeAndPop(view.__group__ as string, false);
                } else {
                    this.close(view, false);
                }
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
        throw new Error(`Prefab path not found for ${viewType.constructor.name}`);
    }

    // 调整Mask层级
    private _adjustMaskLayer(): void {
        let children = UIRoot.children;
        if (children.length == 1) {
            UIMask.active = false;
            return;
        }
        UIMask.active = true;
        UIMask.setSiblingIndex(Math.max(children.length - 2, 0));
    }

    private _blockInput(block: boolean) {
        function blocker(event: EventTouch) {
            event.propagationImmediateStopped = true;
        }
        if (block) {
            for (const eventType in Input.EventType) {
                input.on(Input.EventType[eventType as keyof typeof Input.EventType], blocker);
            }
        } else {
            for (const eventType in Input.EventType) {
                input.off(Input.EventType[eventType as keyof typeof Input.EventType], blocker);
            }
        }
    }

    private async _load<T extends ICocosView>(viewType: new () => T, args?: any): Promise<T> {
        let target: Node
        if (this._cache.has(viewType.name)) {
            target = this._cache.get(viewType.name)!;
        } else {
            let prefabPath = this._getPrefabPath(viewType);
            const ResMgr = ServiceLocator.getService<IResManager>('ResLoader');
            const prefab = await ResMgr.loadPrefab(prefabPath)
            target = instantiate(prefab) as Node
            this._cache.set(viewType.name, target);
        }
        return target.getComponent<T>(viewType)!
    }

    private _remove<T extends ICocosView>(viewortype: T | (new () => T), destroy?: boolean): void {
        if (typeof viewortype == 'function') {
            const cached = this._cache.get(viewortype.name);
            if (!cached) {
                console.warn(`No cached view found for ${viewortype.name}`);
                return;
            }
            this._remove(cached.getComponent(viewortype)!, destroy);
            return;
        }
        if ('__group__' in viewortype) {
            viewortype.__group__ = undefined
        }
        viewortype.onExit();
        viewortype.node.removeFromParent();
        if (destroy) {
            let cacheKey = viewortype.constructor.name;
            this._cache.get(cacheKey)?.destroy();
            this._cache.delete(cacheKey);
        }
    }

    protected internalGetTopView(): ICocosView | undefined {
        let target = UIRoot.children.reverse()[0]
        if (!target) {
            return undefined;
        }
        const comps = target.components
        for (let i = 0; i < comps.length; i++) {
            const comp = comps[i];
            if ("__isIView__" in comp) {
                if (comp.__isIView__) {
                    return comp as unknown as ICocosView;
                }
            }
        }
        console.warn(`No view found in ${target.name}`);
        return undefined;
    }

    protected async internalOpen<T extends ICocosView>(viewType: new () => T, args?: any): Promise<T> {
        this._blockInput(true);
        let view = await this._load(viewType, args);
        addChild(view.node)
        this._adjustMaskLayer();
        view.onEnter(args);
        this._blockInput(false);
        return view;
    }

    protected internalClose<T extends ICocosView>(viewortype: T | (new () => T), destroy?: boolean): void {
        this._remove(viewortype, destroy);
        this._adjustMaskLayer();
    }

    protected async internalOpenAndPush<T extends ICocosView>(viewType: new () => T, group: string, args?: any): Promise<T> {
        this._blockInput(true);
        let view = await this._load(viewType, args);
        let stack = this._groupStacks.get(group) || []
        this._groupStacks.set(group, stack);
        let top = stack[stack.length - 1]
        if (top) {
            top.onPause();
            top.node.removeFromParent();
        }
        if ('__group__' in view) {
            view.__group__ = group
        }
        stack.push(view);
        addChild(view.node);
        this._adjustMaskLayer();
        view.onEnter(args);
        this._blockInput(false);
        return view;
    }

    protected internalCloseAndPop(group: string, destroy?: boolean): void {
        let stack = this._groupStacks.get(group)
        if (!stack) {
            console.warn(`No stack found for group ${group}`);
            return;
        }
        if (stack.length == 0) {
            console.warn(`Stack is empty for group ${group}`);
            return
        }
        this._remove(stack.pop()!, destroy);
        let top = stack[stack.length - 1]
        if (top) {
            top.onResume();
            addChild(top.node);
        }
        this._adjustMaskLayer();
    }

    protected internalClearStack(group: string, destroy?: boolean): void {
        let stack = this._groupStacks.get(group);
        if (!stack) {
            console.warn(`No stack found for group ${group}`);
            return;
        }
        while (stack.length > 0) {
            let view = stack.pop();
            if (view) {
                this._remove(view, destroy);
            }
        }
    }

}