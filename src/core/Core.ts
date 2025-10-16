import { ICore, IManager, ModelNamesType, ManagerNamesType } from "./Api";
import { ServiceLocator } from "./ServiceLocator";
import { getModelClass, getManagerClass} from "./Decorators";

class Container {
    private key2ins = new Map<string, any>();
    
    reg(key: string, ins: any): void {
        this.key2ins.set(key, ins);
    }
    
    get(key: string): any {
        const ins = this.key2ins.get(key);
        if (!ins) throw new Error(`${key} not registered!`);
        return ins;
    }

    has(key: string): boolean {
        return this.key2ins.has(key);
    }
}

export abstract class AbstractCore<T extends AbstractCore<T>> implements ICore {
    private readonly container = new Container();
    constructor() {
        this.initialize();
    }
    // 初始化抽象方法
    protected abstract initialize(): void;

    // 注册与获取模型
    regModel(modelKey: keyof ModelNamesType): void {
        const modelKeyStr = modelKey as string;
        const ModelClass = getModelClass<any>(modelKeyStr);
        const model = new ModelClass();
        this.container.reg(modelKeyStr, model);
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
    getModel(modelKey: keyof ModelNamesType): any {
        return this.container.get(modelKey as string);
    }

    // 注册与获取管理器
    regManager(managerKey: keyof ManagerNamesType): void {
        const managerKeyStr = managerKey as string;
        const ManagerClass = getManagerClass<any>(managerKeyStr);
        const manager = new ManagerClass();
        this.container.reg(managerKeyStr, manager);
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
    getManager(managerKey: keyof ManagerNamesType): any {
        return this.container.get(managerKey as string);
    }

    /**
     * 检查 Model 是否已注册
     * @param modelKey Model 的 Key
     * @returns 是否已注册
     */
    hasModel(modelKey: keyof ModelNamesType): boolean {
        return this.container.has(modelKey as string);
    }

    /**
     * 检查 Manager 是否已注册
     * @param managerKey Manager 的 Key
     * @returns 是否已注册
     */
    hasManager(managerKey: keyof ManagerNamesType): boolean {
        return this.container.has(managerKey as string);
    }
}

export abstract class AbstractManager implements IManager {
    abstract initialize(): void

    dispose(): void {
    }

    /**
     * 获取 Model 实例
     * @param modelKey Model 的 Key，使用 ModelNames.XXX
     * @returns Model 实例（具体类型由 .d.ts 文件的函数重载推断）
     */
    protected getModel(modelKey: keyof ModelNamesType): any {
        // 保持框架独立性，不与具体应用入口(app类)耦合
        // 框架高内聚，使用ServiceLocator获取core
        return ServiceLocator.getService<ICore>('core').getModel(modelKey);
    }

    /**
     * 获取 Manager 实例
     * @param managerKey Manager 的 Key，使用 ManagerNames.XXX
     * @returns Manager 实例（具体类型由 .d.ts 文件的函数重载推断）
     */
    protected getManager(managerKey: keyof ManagerNamesType): any {
        return ServiceLocator.getService<ICore>('core').getManager(managerKey);
    }
}