import { ICore, IManager } from "./Api";
export declare abstract class AbstractCore<T extends AbstractCore<T>> implements ICore {
    private readonly container;
    constructor();
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
    getModel<T extends keyof ModelRegistry>(modelClass: T): InstanceType<ModelRegistry[T]>;
    /**
     * 获取 Manager 实例
     * @param managerClass Manager 类构造函数
     * @returns Manager 实例（类型由泛型参数推断）
     * @example
     * ```typescript
     * const gameManager = core.getManager(GameManager);
     * ```
     */
    getManager<T extends keyof ManagerRegistry>(managerClass: T): InstanceType<ManagerRegistry[T]>;
}
export declare abstract class AbstractManager implements IManager {
    abstract initialize(): void;
    dispose(): void;
    /**
     * 获取 Model 实例
     * @param modelClass Model 类构造函数
     * @returns Model 实例（类型由泛型参数推断）
     */
    protected getModel<T extends keyof ModelRegistry>(modelClass: T): InstanceType<ModelRegistry[T]>;
    /**
     * 获取 Manager 实例
     * @param managerClass Manager 类构造函数
     * @returns Manager 实例（类型由泛型参数推断）
     */
    protected getManager<T extends keyof ManagerRegistry>(managerClass: T): InstanceType<ManagerRegistry[T]>;
}
