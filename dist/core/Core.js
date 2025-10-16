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
    has(key) {
        return this.key2ins.has(key);
    }
}
class AbstractCore {
    constructor() {
        this.container = new Container();
        this.initialize();
    }
    /**
     * 获取 Model 实例
     * @param modelClass Model 类构造函数
     * @returns Model 实例（类型由泛型参数推断）
     * @example
     * ```typescript
     * const userModel = core.getModel(UserModel);
     * ```
     */
    getModel(modelClass) {
        const className = modelClass;
        // 如果已存在实例，直接返回
        if (this.container.has(className)) {
            return this.container.get(className);
        }
        // 创建新实例
        const ModelClass = getModelClass(className);
        const instance = new ModelClass();
        this.container.reg(className, instance);
        instance.initialize();
        return instance;
    }
    /**
     * 获取 Manager 实例
     * @param managerClass Manager 类构造函数
     * @returns Manager 实例（类型由泛型参数推断）
     * @example
     * ```typescript
     * const gameManager = core.getManager(GameManager);
     * ```
     */
    getManager(managerClass) {
        const className = managerClass;
        // 如果已存在实例，直接返回
        if (this.container.has(className)) {
            return this.container.get(className);
        }
        // 创建新实例
        const ManagerClass = getManagerClass(className);
        const instance = new ManagerClass();
        this.container.reg(className, instance);
        instance.initialize();
        return instance;
    }
}
class AbstractManager {
    dispose() {
    }
    /**
     * 获取 Model 实例
     * @param modelClass Model 类构造函数
     * @returns Model 实例（类型由泛型参数推断）
     */
    getModel(modelClass) {
        // 保持框架独立性，不与具体应用入口(app类)耦合
        // 框架高内聚，使用ServiceLocator获取core
        return ServiceLocator.getService('core').getModel(modelClass);
    }
    /**
     * 获取 Manager 实例
     * @param managerClass Manager 类构造函数
     * @returns Manager 实例（类型由泛型参数推断）
     */
    getManager(managerClass) {
        return ServiceLocator.getService('core').getManager(managerClass);
    }
}

export { AbstractCore, AbstractManager };
