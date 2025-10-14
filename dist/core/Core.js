import { ServiceLocator } from './ServiceLocator.js';
import { getModelClass, getManagerClass } from './Decorators.js';

class Container {
    constructor() {
        this.symbol2ins = new Map();
    }
    reg(sym, ins) {
        this.symbol2ins.set(sym, ins);
    }
    get(sym) {
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
    regModel(modelSymbol) {
        const ModelClass = getModelClass(modelSymbol);
        const model = new ModelClass();
        this.container.reg(modelSymbol, model);
        model.initialize();
    }
    getModel(modelSymbol) {
        return this.container.get(modelSymbol);
    }
    // 注册与获取管理器
    regManager(managerSymbol) {
        const ManagerClass = getManagerClass(managerSymbol);
        const manager = new ManagerClass();
        this.container.reg(managerSymbol, manager);
        manager.initialize();
    }
    getManager(managerSymbol) {
        return this.container.get(managerSymbol);
    }
}
class AbstractManager {
    dispose() {
        this.releaseEventManager();
    }
    getModel(modelSymbol) {
        // 保持框架独立性，不与具体应用入口(app类)耦合
        // 框架高内聚，使用ServiceLocator获取core
        return ServiceLocator.getService('core').getModel(modelSymbol);
    }
    // 事件管理器获取（通过服务定位器解耦）
    getEventManager() {
        if (!this.eventManager) {
            this.eventManager = ServiceLocator.getService('EventManager');
        }
        return this.eventManager;
    }
    // HTTP 管理器获取
    getHttpManager() {
        return ServiceLocator.getService('HttpManager');
    }
    // WebSocket 管理器获取
    getWebSocketManager() {
        return ServiceLocator.getService('WebSocketManager');
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
