import { ICore, IManager, IModel } from "./Api";
import { ModelTypeMap, ManagerTypeMap } from "./Decorators";
export declare abstract class AbstractCore<T extends AbstractCore<T>> implements ICore {
    private readonly container;
    constructor();
    protected abstract initialize(): void;
    regModel(modelSymbol: symbol): void;
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
    getModel<S extends symbol>(modelSymbol: S): S extends keyof ModelTypeMap ? ModelTypeMap[S] : IModel;
    regManager(managerSymbol: symbol): void;
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
    getManager<S extends symbol>(managerSymbol: S): S extends keyof ManagerTypeMap ? ManagerTypeMap[S] : IManager;
}
export declare abstract class AbstractManager implements IManager {
    abstract initialize(): void;
    dispose(): void;
    /**
     * 获取 Model 实例（支持类型自动推断）
     * @param modelSymbol Model 的 Symbol，使用 ModelNames.XXX
     * @returns Model 实例，类型会根据 symbol 自动推断
     */
    protected getModel<S extends symbol>(modelSymbol: S): S extends keyof ModelTypeMap ? ModelTypeMap[S] : IModel;
    /**
     * 获取 Manager 实例（支持类型自动推断）
     * @param managerSymbol Manager 的 Symbol，使用 ManagerNames.XXX
     * @returns Manager 实例，类型会根据 symbol 自动推断
     */
    protected getManager<S extends symbol>(managerSymbol: S): S extends keyof ManagerTypeMap ? ManagerTypeMap[S] : IManager;
}
