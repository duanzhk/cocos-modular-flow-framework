import { __awaiter } from '../_virtual/_tslib.js';
import { director, Node, Sprite, Widget, Input, input, Prefab, instantiate } from 'cc';
import { ServiceLocator } from '../core/ServiceLocator.js';
import { getViewClass } from '../core/Decorators.js';

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
const UIMask = new Proxy({}, {
    get(target, prop) {
        if (!_uiMask) {
            _uiMask = new Node('__UIMask__');
            addChild(_uiMask);
            addWidget(_uiMask);
            _uiMask.setPosition(0, 0);
            _uiMask.addComponent(Sprite).color.set(0, 0, 0, 0.5);
        }
        const value = Reflect.get(_uiMask, prop);
        // 如果是放的话，可能要绑定原始实例上下文
        return typeof value === 'function' ? value.bind(_uiMask) : value;
        // return Reflect.get(_uiMask, prop)
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
        return this.internalGetTopView();
    }
    open(viewClass, args) {
        const className = viewClass.name;
        return this.internalOpen(className, args);
    }
    close(viewClass) {
        const className = viewClass.name;
        this.internalClose(className);
    }
    openAndPush(viewClass, group, args) {
        const className = viewClass.name;
        return this.internalOpenAndPush(className, group, args);
    }
    closeAndPop(group, destroy) {
        this.internalCloseAndPop(group, destroy);
    }
    clearStack(group, destroy) {
        this.internalClearStack(group, destroy);
    }
}
class UIManager extends CcocosUIManager {
    constructor() {
        super();
        this._cache = new Map();
        this._groupStacks = new Map();
        UIMask.on(Node.EventType.TOUCH_END, (event) => {
            let view = this.getTopView();
            if ('__group__' in view) {
                if (view.__group__ != undefined) {
                    this.closeAndPop(view.__group__, false);
                }
                else {
                    // 对于直接关闭视图，我们需要通过内部方法处理
                    this.internalClose(view, false);
                }
            }
        });
    }
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
    // 调整Mask层级
    _adjustMaskLayer() {
        let children = UIRoot.children;
        if (children.length == 1) {
            UIMask.active = false;
            return;
        }
        UIMask.active = true;
        UIMask.setSiblingIndex(Math.max(children.length - 2, 0));
    }
    _blockInput(block) {
        function blocker(event) {
            event.propagationImmediateStopped = true;
        }
        if (block) {
            for (const eventType in Input.EventType) {
                input.on(Input.EventType[eventType], blocker);
            }
        }
        else {
            for (const eventType in Input.EventType) {
                input.off(Input.EventType[eventType], blocker);
            }
        }
    }
    _load(viewKey, args) {
        return __awaiter(this, void 0, void 0, function* () {
            const viewType = getViewClass(viewKey);
            let target;
            if (this._cache.has(viewType.name)) {
                target = this._cache.get(viewType.name);
            }
            else {
                let prefabPath = this._getPrefabPath(viewType);
                const ResMgr = ServiceLocator.getService('ResLoader');
                const prefab = yield ResMgr.loadPrefab(prefabPath);
                target = instantiate(prefab);
                this._cache.set(viewType.name, target);
            }
            target.active = true;
            return target.getComponent(viewType);
        });
    }
    _remove(viewKeyOrInstance, destroy) {
        var _a;
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
            this._remove(viewInstance, destroy);
            return;
        }
        // 处理视图实例
        const viewInstance = viewKeyOrInstance;
        if ('__group__' in viewInstance) {
            viewInstance.__group__ = undefined;
        }
        viewInstance.onExit();
        viewInstance.node.removeFromParent();
        viewInstance.node.active = false;
        if (destroy) {
            let cacheKey = viewInstance.constructor.name;
            (_a = this._cache.get(cacheKey)) === null || _a === void 0 ? void 0 : _a.destroy();
            this._cache.delete(cacheKey);
            // 销毁被克隆出的UI后Node后，尝试释放 Prefab 资源
            try {
                const viewType = viewInstance.constructor;
                const prefabPath = this._getPrefabPath(viewType);
                const ResMgr = ServiceLocator.getService('ResLoader');
                ResMgr.release(prefabPath, Prefab);
            }
            catch (error) {
                console.error(`Failed to release prefab for ${cacheKey}:`, error);
            }
        }
    }
    internalGetTopView() {
        let target = UIRoot.children.reverse()[0];
        if (!target) {
            return undefined;
        }
        const comps = target.components;
        for (let i = 0; i < comps.length; i++) {
            const comp = comps[i];
            if ("__isIView__" in comp) {
                if (comp.__isIView__) {
                    return comp;
                }
            }
        }
        console.warn(`No view found in ${target.name}`);
        return undefined;
    }
    internalOpen(viewKey, args) {
        return __awaiter(this, void 0, void 0, function* () {
            this._blockInput(true);
            let view = yield this._load(viewKey, args);
            addChild(view.node);
            this._adjustMaskLayer();
            view.onEnter(args);
            this._blockInput(false);
            return view;
        });
    }
    internalClose(viewKey, destroy) {
        this._remove(viewKey, destroy);
        this._adjustMaskLayer();
    }
    internalOpenAndPush(viewKey, group, args) {
        return __awaiter(this, void 0, void 0, function* () {
            this._blockInput(true);
            let view = yield this._load(viewKey, args);
            let stack = this._groupStacks.get(group) || [];
            this._groupStacks.set(group, stack);
            let top = stack[stack.length - 1];
            if (top) {
                top.onPause();
                top.node.removeFromParent();
            }
            if ('__group__' in view) {
                view.__group__ = group;
            }
            stack.push(view);
            addChild(view.node);
            this._adjustMaskLayer();
            view.onEnter(args);
            this._blockInput(false);
            return view;
        });
    }
    internalCloseAndPop(group, destroy) {
        let stack = this._groupStacks.get(group);
        if (!stack) {
            console.warn(`No stack found for group ${group}`);
            return;
        }
        if (stack.length == 0) {
            console.warn(`Stack is empty for group ${group}`);
            return;
        }
        this._remove(stack.pop(), destroy);
        let top = stack[stack.length - 1];
        if (top) {
            top.onResume();
            addChild(top.node);
        }
        this._adjustMaskLayer();
    }
    internalClearStack(group, destroy) {
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

export { UIManager };
