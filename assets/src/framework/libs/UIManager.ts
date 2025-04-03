import { Component, director, input, instantiate, Node, Input, EventTouch, Widget, Sprite } from "cc";
import { starmaker } from "../core/Core";
const { ServiceLocator } = starmaker.core

type IView = starmaker.core.IView & Component

let _uiRoot: Node | undefined
const UIRoot = new Proxy({} as Node, {
    get(target, prop) {
        if (!_uiRoot) {
            const canvas = director.getScene()!.getChildByPath('Canvas')!;
            _uiRoot = new Node('__UIRoot__')
            _uiRoot.setParent(canvas);
        }
        return Reflect.get(_uiRoot, prop)
    }
})

let _uiMask: Node | undefined
const UIMask = new Proxy({} as Node, {
    get(target, prop) {
        if (!_uiMask) {
            _uiMask = new Node('__Mask__');
            UIRoot.addChild(_uiMask);
            _uiMask.setPosition(0, 0);
            const widget = _uiMask.addComponent(Widget);
            widget.isAlignLeft = widget.isAlignRight = widget.isAlignTop = widget.isAlignBottom = true;
            widget.left = widget.right = widget.top = widget.bottom = 0;
            let sp = _uiMask.addComponent(Sprite);
            sp.color.set(0, 0, 0, 0.5);
        }
        return Reflect.get(_uiMask, prop)
    }
})

export class UIManager implements starmaker.core.IUIManager {
    private _cache: Map<string, Node> = new Map();
    private _groupStacks: Map<string, IView[]> = new Map();

    public constructor() {
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

    private _getPrefabPath<T extends IView>(viewType: new () => T): string {
        let constructor = viewType//viewType instanceof Function ? viewType : viewType.constructor as new () => IView;
        // 通过原型链查找基类
        while (constructor) {
            const parent = Object.getPrototypeOf(constructor);
            if (parent.hasOwnProperty('prefabPath')) {
                return parent.prefabPath as string;
            }
            if (parent === Function.prototype) break;
            constructor = Object.getPrototypeOf(parent);
        }
        throw new Error(`Prefab path not found for ${viewType.constructor.name}`);
    }

    // 调整Mask层级
    private _adjustMaskLayer(): void {
        let children = UIRoot.children;
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

    private async _load<T extends IView>(viewType: new () => T, args?: any): Promise<T> {
        let target: Node
        if (this._cache.has(viewType.name)) {
            target = this._cache.get(viewType.name)!;
        } else {
            let prefabPath = this._getPrefabPath(viewType);
            const ResMgr = ServiceLocator.getService<starmaker.core.IResManager>('ResLoader');
            const prefab = await ResMgr.loadPrefab(prefabPath)
            target = instantiate(prefab) as Node
            this._cache.set(viewType.name, target);
        }
        return target.getComponent<T>(viewType)!
    }

    private _remove<T extends IView>(viewortype: T | (new () => T), destroy?: boolean): void {
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

    public getTopView(): IView | undefined {
        let target = UIRoot.children.reverse()[0]
        if (!target) {
            return undefined;
        }
        target.components.forEach((comp) => {
            if ("__isIView__" in comp) {
                if (comp.__isIView__) {
                    return comp;
                }
            }
        });
        console.warn(`No view found in ${target.name}`);
        return undefined;
    }


    async open<T extends IView>(viewType: new () => T, args?: any): Promise<T> {
        this._blockInput(true);
        let view = await this._load(viewType, args);
        // 设置父节点为UI根节点
        UIRoot.addChild(view.node)
        this._adjustMaskLayer();
        view.onEnter(args);
        this._blockInput(false);
        return view;
    }

    close<T extends IView>(viewortype: T | (new () => T), destroy?: boolean): void {
        this._remove(viewortype, destroy);
        this._adjustMaskLayer();
    }

    async openAndPush<T extends IView>(viewType: new () => T, group: string, args?: any): Promise<T> {
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
        UIRoot.addChild(view.node);
        this._adjustMaskLayer();
        view.onEnter(args);
        this._blockInput(false);
        return view;
    }

    closeAndPop(group: string, destroy?: boolean): void {
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
            UIRoot.addChild(top.node);
        }
        this._adjustMaskLayer();
    }

    clearStack(group: string, destroy?: boolean): void {
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