import { ICore, IManager, InferModelType, InferManagerType} from "./Api";
import { ServiceLocator } from "./ServiceLocator";
import { getModelClass, getManagerClass } from "./Decorators";

class Container {
    private symbol2ins = new Map<symbol, any>();
    
    reg(sym: symbol, ins: any): void {
        this.symbol2ins.set(sym, ins);
    }
    
    get(sym: symbol): any {
        const ins = this.symbol2ins.get(sym);
        if (!ins) throw new Error(`${sym.toString()} not registered!`);
        return ins;
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
    regModel(modelSymbol: symbol): void {
        const ModelClass = getModelClass<T>(modelSymbol);
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
    getModel<S extends symbol>(modelSymbol: S): InferModelType<S> {
        return this.container.get(modelSymbol);
    }

    // 注册与获取管理器
    regManager(managerSymbol: symbol): void {
        const ManagerClass = getManagerClass<T>(managerSymbol);
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
    getManager<S extends symbol>(managerSymbol: S): InferManagerType<S> {
        return this.container.get(managerSymbol);
    }
}

export abstract class AbstractManager implements IManager {
    abstract initialize(): void

    dispose(): void {
    }

    /**
     * 获取 Model 实例（支持类型自动推断）
     * @param modelSymbol Model 的 Symbol，使用 ModelNames.XXX
     * @returns Model 实例，类型会根据 symbol 自动推断
     */
    protected getModel<S extends symbol>(modelSymbol: S): InferModelType<S> {
        // 保持框架独立性，不与具体应用入口(app类)耦合
        // 框架高内聚，使用ServiceLocator获取core
        return ServiceLocator.getService<ICore>('core').getModel(modelSymbol) as any;
    }

    /**
     * 获取 Manager 实例（支持类型自动推断）
     * @param managerSymbol Manager 的 Symbol，使用 ManagerNames.XXX
     * @returns Manager 实例，类型会根据 symbol 自动推断
     */
    protected getManager<S extends symbol>(managerSymbol: S): InferManagerType<S> {
        return ServiceLocator.getService<ICore>('core').getManager(managerSymbol) as any;
    }
}
