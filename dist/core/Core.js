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
    /**
     * 获取 Model 实例（支持类型自动推断）
     * @param modelSymbol Model 的 Symbol，使用 ModelNames.XXX
     * @returns Model 实例，类型会根据 symbol 自动推断
     * @example
     * ```typescript
     * // 自动推断为 UserModel 类型，无需手动指定泛型
     * const userModel = core.getModel(ModelNames.User);
     * ```
     */
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
    /**
     * 获取 Manager 实例（支持类型自动推断）
     * @param managerSymbol Manager 的 Symbol，使用 ManagerNames.XXX
     * @returns Manager 实例，类型会根据 symbol 自动推断
     * @example
     * ```typescript
     * // 自动推断为 GameManager 类型，无需手动指定泛型
     * const gameManager = core.getManager(ManagerNames.Game);
     * ```
     */
    getManager(managerSymbol) {
        return this.container.get(managerSymbol);
    }
}
class AbstractManager {
    dispose() {
    }
    /**
     * 获取 Model 实例（支持类型自动推断）
     * @param modelSymbol Model 的 Symbol，使用 ModelNames.XXX
     * @returns Model 实例，类型会根据 symbol 自动推断
     */
    getModel(modelSymbol) {
        // 保持框架独立性，不与具体应用入口(app类)耦合
        // 框架高内聚，使用ServiceLocator获取core
        return ServiceLocator.getService('core').getModel(modelSymbol);
    }
    /**
     * 获取 Manager 实例（支持类型自动推断）
     * @param managerSymbol Manager 的 Symbol，使用 ManagerNames.XXX
     * @returns Manager 实例，类型会根据 symbol 自动推断
     */
    getManager(managerSymbol) {
        return ServiceLocator.getService('core').getManager(managerSymbol);
    }
}

export { AbstractCore, AbstractManager };
