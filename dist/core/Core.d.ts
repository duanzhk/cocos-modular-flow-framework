import { ICore, IManager } from "./Api";
export declare abstract class AbstractCore<T extends AbstractCore<T>> implements ICore {
    private readonly container;
    constructor();
    protected abstract initialize(): void;
    regModel(modelSymbol: symbol): void;
    /**
     * 获取 Model 实例
     * @param modelSymbol Model 的 Symbol，使用 ModelNames.XXX
     * @returns Model 实例（具体类型由 .d.ts 文件的函数重载推断）
     * @example
     * ```typescript
     * // 类型由 .d.ts 文件的重载自动推断
     * const userModel = core.getModel(ModelNames.User);
     * ```
     */
    getModel(modelSymbol: symbol): any;
    regManager(managerSymbol: symbol): void;
    /**
     * 获取 Manager 实例
     * @param managerSymbol Manager 的 Symbol，使用 ManagerNames.XXX
     * @returns Manager 实例（具体类型由 .d.ts 文件的函数重载推断）
     * @example
     * ```typescript
     * // 类型由 .d.ts 文件的重载自动推断
     * const gameManager = core.getManager(ManagerNames.Game);
     * ```
     */
    getManager(managerSymbol: symbol): any;
}
export declare abstract class AbstractManager implements IManager {
    abstract initialize(): void;
    dispose(): void;
    /**
     * 获取 Model 实例
     * @param modelSymbol Model 的 Symbol，使用 ModelNames.XXX
     * @returns Model 实例（具体类型由 .d.ts 文件的函数重载推断）
     */
    protected getModel(modelSymbol: symbol): any;
    /**
     * 获取 Manager 实例
     * @param managerSymbol Manager 的 Symbol，使用 ManagerNames.XXX
     * @returns Manager 实例（具体类型由 .d.ts 文件的函数重载推断）
     */
    protected getManager(managerSymbol: symbol): any;
}
