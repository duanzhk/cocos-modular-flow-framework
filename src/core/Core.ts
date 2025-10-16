import { ICore, IManager } from "./Api";
import { ServiceLocator } from "./ServiceLocator";
import { getModelClass, getManagerClass } from "./Decorators";

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

    /**
     * 获取 Model 实例
     * @param modelClass Model 类构造函数
     * @returns Model 实例（类型由泛型参数推断）
     * @example
     * ```typescript
     * const userModel = core.getModel(UserModel);
     * ```
     */
    getModel<T extends keyof ModelRegistry>(modelClass: T): InstanceType<ModelRegistry[T]> {
        const className = (modelClass as any).name;
        
        // 如果已存在实例，直接返回
        if (this.container.has(className)) {
            return this.container.get(className);
        }
        
        // 创建新实例
        const ModelClass = getModelClass<any>(className);
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
    getManager<T extends keyof ManagerRegistry>(managerClass: T): InstanceType<ManagerRegistry[T]> {
        const className = (managerClass as any).name;
        
        // 如果已存在实例，直接返回
        if (this.container.has(className)) {
            return this.container.get(className);
        }
        
        // 创建新实例
        const ManagerClass = getManagerClass<any>(className);
        const instance = new ManagerClass();
        this.container.reg(className, instance);
        instance.initialize();
        
        return instance;
    }
}

export abstract class AbstractManager implements IManager {
    abstract initialize(): void

    dispose(): void {
    }

    /**
     * 获取 Model 实例
     * @param modelClass Model 类构造函数
     * @returns Model 实例（类型由泛型参数推断）
     */
    protected getModel<T extends keyof ModelRegistry>(modelClass: T): InstanceType<ModelRegistry[T]> {
        // 保持框架独立性，不与具体应用入口(app类)耦合
        // 框架高内聚，使用ServiceLocator获取core
        return ServiceLocator.getService<ICore>('core').getModel(modelClass);
    }

    /**
     * 获取 Manager 实例
     * @param managerClass Manager 类构造函数
     * @returns Manager 实例（类型由泛型参数推断）
     */
    protected getManager<T extends keyof ManagerRegistry>(managerClass: T): InstanceType<ManagerRegistry[T]> {
        return ServiceLocator.getService<ICore>('core').getManager(managerClass);
    }
}