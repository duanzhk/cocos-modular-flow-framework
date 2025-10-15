import { ICore, IManager, IModel } from "./Api";
import { ModelTypeMap, ManagerTypeMap, ModelNames, ManagerNames } from "./Decorators";
/**
 * 从 symbol 推断对应的字符串 key
 * @example ModelNames.User -> 'User'
 */
type GetKeyFromSymbol<S extends symbol, Names extends Record<string, symbol>> = {
    [K in keyof Names]: Names[K] extends S ? K : never;
}[keyof Names];
/**
 * 从 Model Symbol 推断类型
 */
type InferModelType<S extends symbol> = GetKeyFromSymbol<S, typeof ModelNames> extends keyof ModelTypeMap ? ModelTypeMap[GetKeyFromSymbol<S, typeof ModelNames>] : IModel;
/**
 * 从 Manager Symbol 推断类型
 */
type InferManagerType<S extends symbol> = GetKeyFromSymbol<S, typeof ManagerNames> extends keyof ManagerTypeMap ? ManagerTypeMap[GetKeyFromSymbol<S, typeof ManagerNames>] : IManager;
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
    getModel<S extends symbol>(modelSymbol: S): InferModelType<S>;
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
    getManager<S extends symbol>(managerSymbol: S): InferManagerType<S>;
}
export declare abstract class AbstractManager implements IManager {
    abstract initialize(): void;
    dispose(): void;
    /**
     * 获取 Model 实例（支持类型自动推断）
     * @param modelSymbol Model 的 Symbol，使用 ModelNames.XXX
     * @returns Model 实例，类型会根据 symbol 自动推断
     */
    protected getModel<S extends symbol>(modelSymbol: S): InferModelType<S>;
    /**
     * 获取 Manager 实例（支持类型自动推断）
     * @param managerSymbol Manager 的 Symbol，使用 ManagerNames.XXX
     * @returns Manager 实例，类型会根据 symbol 自动推断
     */
    protected getManager<S extends symbol>(managerSymbol: S): InferManagerType<S>;
}
export {};
