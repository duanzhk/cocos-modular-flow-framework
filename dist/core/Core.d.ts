import { ICore, IManager, ModelNamesType, ManagerNamesType } from "./Api";
export declare abstract class AbstractCore<T extends AbstractCore<T>> implements ICore {
    private readonly container;
    constructor();
    protected abstract initialize(): void;
    regModel(modelKey: keyof ModelNamesType): void;
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
    getModel(modelKey: keyof ModelNamesType): any;
    regManager(managerKey: keyof ManagerNamesType): void;
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
    getManager(managerKey: keyof ManagerNamesType): any;
    /**
     * 检查 Model 是否已注册
     * @param modelKey Model 的 Key
     * @returns 是否已注册
     */
    hasModel(modelKey: keyof ModelNamesType): boolean;
    /**
     * 检查 Manager 是否已注册
     * @param managerKey Manager 的 Key
     * @returns 是否已注册
     */
    hasManager(managerKey: keyof ManagerNamesType): boolean;
}
export declare abstract class AbstractManager implements IManager {
    abstract initialize(): void;
    dispose(): void;
    /**
     * 获取 Model 实例
     * @param modelKey Model 的 Key，使用 ModelNames.XXX
     * @returns Model 实例（具体类型由 .d.ts 文件的函数重载推断）
     */
    protected getModel(modelKey: keyof ModelNamesType): any;
    /**
     * 获取 Manager 实例
     * @param managerKey Manager 的 Key，使用 ManagerNames.XXX
     * @returns Manager 实例（具体类型由 .d.ts 文件的函数重载推断）
     */
    protected getManager(managerKey: keyof ManagerNamesType): any;
}
