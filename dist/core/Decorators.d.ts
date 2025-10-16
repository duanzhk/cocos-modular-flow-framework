import { ICore, ModelNamesType, ManagerNamesType, ViewNamesType } from "./Api";
/** Model 名称常量对象，用于代码补全和类型推断 */
export declare const ModelNames: ModelNamesType;
/** Manager 名称常量对象，用于代码补全和类型推断 */
export declare const ManagerNames: ManagerNamesType;
/** View 名称常量对象，用于代码补全和类型推断 */
export declare const ViewNames: ViewNamesType;
/**
 * Model 装饰器，用于注册 Model 到全局注册表
 * @param name 可选的 Model 名称，如果不提供则使用类名
 * @example
 * ```typescript
 * @model('User')
 * export class UserModel implements IModel {
 *     initialize(): void { }
 * }
 *
 * // 使用
 * const user = mf.core.getModel(ModelNames.User);
 * ```
 */
export declare function model(name?: string): (ctor: Function) => void;
/**
 * 获取所有已注册的 Model 名称
 * @returns Model 名称数组
 */
export declare function getRegisteredModelNames(): string[];
/**
 * 通过 Key 获取 Model 类构造函数
 * @param modelKey Model 的 Key 标识
 * @returns Model 类构造函数
 * @throws 如果 Model 未注册则抛出错误
 */
export declare function getModelClass<T>(modelKey: string): new () => T;
/**
 * 通过类构造函数获取 Model 的 Key
 * @param ctor Model 类构造函数
 * @returns Model 的 Key
 * @internal 内部使用
 */
export declare function getModelKey(ctor: Function): string | undefined;
/**
 * Manager 装饰器，用于注册 Manager 到全局注册表
 * @param name 可选的 Manager 名称，如果不提供则使用类名
 * @example
 * ```typescript
 * @manager('Game')
 * export class GameManager extends AbstractManager {
 *     initialize(): void { }
 * }
 * ```
 */
export declare function manager(name?: string): (ctor: Function) => void;
/**
 * 获取所有已注册的 Manager 名称
 * @returns Manager 名称数组
 */
export declare function getRegisteredManagerNames(): string[];
/**
 * 通过 Key 获取 Manager 类构造函数
 * @param managerKey Manager 的 Key 标识
 * @returns Manager 类构造函数
 * @throws 如果 Manager 未注册则抛出错误
 */
export declare function getManagerClass<T>(managerKey: string): new () => T;
/**
 * 通过类构造函数获取 Manager 的 Key
 * @param ctor Manager 类构造函数
 * @returns Manager 的 Key
 * @internal 内部使用
 */
export declare function getManagerKey(ctor: Function): string | undefined;
/**
 * View 装饰器，用于注册 View 到全局注册表
 * @param name 可选的 View 名称，如果不提供则使用类名
 * @example
 * ```typescript
 * @view('Home')
 * @ccclass('HomeView')
 * export class HomeView extends BaseView {
 *     onEnter(): void { }
 *     onPause(): void { }
 *     onResume(): void { }
 * }
 *
 * // 使用
 * await mf.ui.open(ViewNames.Home);
 * ```
 */
export declare function view(name?: string): (ctor: Function) => void;
/**
 * 获取所有已注册的 View 名称
 * @returns View 名称数组
 */
export declare function getRegisteredViewNames(): string[];
/**
 * 通过 Key 获取 View 类构造函数
 * @param viewKey View 的 Key 标识
 * @returns View 类构造函数
 * @throws 如果 View 未注册则抛出错误
 */
export declare function getViewClass<T>(viewKey: string): new () => T;
/**
 * 自动注册所有使用装饰器标记的 Model 和 Manager
 * @param core Core 实例
 * @param options 注册选项
 * @example
 * ```typescript
 * // 导入所有 Model 和 Manager
 * import '@/models/UserModel';
 * import '@/managers/GameManager';
 *
 * // 自动注册
 * autoRegister(mf.core);
 *
 * // 带选项的自动注册
 * autoRegister(mf.core, {
 *   skipExisting: true,  // 跳过已注册的
 *   verbose: false       // 静默模式
 * });
 * ```
 */
export declare function autoRegister(core: ICore, options?: {
    skipExisting?: boolean;
    verbose?: boolean;
}): void;
