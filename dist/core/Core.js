import { ServiceLocator } from './ServiceLocator.js';
import { getInterface } from './Decorators.js';

class Container {
    constructor() {
        this.ctor2ins = new Map(); // 使用构造函数作为键
        this.symbol2ins = new Map();
    }
    regByCtor(type, ins) {
        this.ctor2ins.set(type, ins);
    }
    getByCtor(type) {
        const ins = this.ctor2ins.get(type);
        if (!ins)
            throw new Error(`${type.name} not registered!`);
        return ins;
    }
    regBySymbol(ctor, ins) {
        const sym = getInterface(ctor);
        this.symbol2ins.set(sym, ins);
    }
    getBySymbol(sym) {
        const ins = this.symbol2ins.get(sym);
        if (!ins)
            throw new Error(`${sym.toString()} not registered!`);
        return ins;
    }
}
class AbstractCore {
    constructor() {
        this.container = new Container();
        this.initialize();
    }
    // 注册与获取模型
    regModel(model) {
        this.container.regByCtor(Object.getPrototypeOf(model).constructor, model);
        model.initialize();
    }
    getModel(ctor) {
        return this.container.getByCtor(ctor);
    }
    // 注册与获取管理器
    regManager(manager) {
        const ctor = Object.getPrototypeOf(manager).constructor;
        this.container.regByCtor(ctor, manager);
        this.container.regBySymbol(ctor, manager); // 同时注册Symbol
        manager.initialize();
    }
    getManager(indent) {
        if (typeof indent === 'symbol') {
            return this.container.getBySymbol(indent);
        }
        else {
            return this.container.getByCtor(indent);
        }
    }
}
class AbstractManager {
    dispose() {
        this.releaseEventManager();
    }
    getModel(ctor) {
        // 保持框架独立性，不与具体应用入口(app类)耦合
        // 框架高内聚，使用ServiceLocator获取core
        return ServiceLocator.getService('core').getModel(ctor);
    }
    // 事件管理器获取（通过服务定位器解耦）
    getEventManager() {
        if (!this.eventManager) {
            this.eventManager = ServiceLocator.getService('EventManager');
        }
        return this.eventManager;
    }
    releaseEventManager() {
        var _a, _b;
        if (this.eventManager) {
            // 假设 IEventManager 有销毁逻辑（如第三方库）
            (_b = (_a = this.eventManager) === null || _a === void 0 ? void 0 : _a.dispose) === null || _b === void 0 ? void 0 : _b.call(_a);
            this.eventManager = undefined;
        }
    }
}

export { AbstractCore, AbstractManager };
