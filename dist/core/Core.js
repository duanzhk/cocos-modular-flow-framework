import { ServiceLocator } from './ServiceLocator.js';
import { getModelClass, getManagerClass } from './Decorators.js';

class Container {
    constructor() {
        this.key2ins = new Map();
    }
    reg(key, ins) {
        this.key2ins.set(key, ins);
    }
    get(key) {
        const ins = this.key2ins.get(key);
        if (!ins)
            throw new Error(`${key} not registered!`);
        return ins;
    }
}
class AbstractCore {
    constructor() {
        this.container = new Container();
        this.initialize();
    }
    // 注册与获取模型
    regModel(modelKey) {
        const ModelClass = getModelClass(modelKey);
        const model = new ModelClass();
        this.container.reg(modelKey, model);
        model.initialize();
    }
    /**
     * 获取 Model 实例
     * @param modelKey Model 的 Key，使用 ModelNames.XXX
     * @returns Model 实例（具体类型由 .d.ts 文件的函数重载推断）
     * @example
     * ```typescript
     * // 类型由 .d.ts 文件的重载自动推断
     * const userModel = core.getModel(ModelNames.User);
     * ```
     */
    getModel(modelKey) {
        return this.container.get(modelKey);
    }
    // 注册与获取管理器
    regManager(managerKey) {
        const ManagerClass = getManagerClass(managerKey);
        const manager = new ManagerClass();
        this.container.reg(managerKey, manager);
        manager.initialize();
    }
    /**
     * 获取 Manager 实例
     * @param managerKey Manager 的 Key，使用 ManagerNames.XXX
     * @returns Manager 实例（具体类型由 .d.ts 文件的函数重载推断）
     * @example
     * ```typescript
     * // 类型由 .d.ts 文件的重载自动推断
     * const gameManager = core.getManager(ManagerNames.Game);
     * ```
     */
    getManager(managerKey) {
        return this.container.get(managerKey);
    }
}
class AbstractManager {
    dispose() {
    }
    /**
     * 获取 Model 实例
     * @param modelKey Model 的 Key，使用 ModelNames.XXX
     * @returns Model 实例（具体类型由 .d.ts 文件的函数重载推断）
     */
    getModel(modelKey) {
        // 保持框架独立性，不与具体应用入口(app类)耦合
        // 框架高内聚，使用ServiceLocator获取core
        return ServiceLocator.getService('core').getModel(modelKey);
    }
    /**
     * 获取 Manager 实例
     * @param managerKey Manager 的 Key，使用 ManagerNames.XXX
     * @returns Manager 实例（具体类型由 .d.ts 文件的函数重载推断）
     */
    getManager(managerKey) {
        return ServiceLocator.getService('core').getManager(managerKey);
    }
}

export { AbstractCore, AbstractManager };
