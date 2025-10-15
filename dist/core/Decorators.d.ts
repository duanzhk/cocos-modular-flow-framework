import { ICore } from "./Api";
import 'reflect-metadata';
/** Model 名称到 Symbol 的映射，用于代码补全和类型推断 */
export declare const ModelNames: Record<string, symbol>;
/** Manager 名称到 Symbol 的映射，用于代码补全和类型推断 */
export declare const ManagerNames: Record<string, symbol>;
/** View 名称到 Symbol 的映射，用于代码补全和类型推断 */
export declare const ViewNames: Record<string, symbol>;
/**
 * Symbol 到类型的映射接口，用于类型推断
 * 业务层通过 declare module 扩展此接口来注册类型
 * @example
 * ```typescript
 * declare module '@/core/Decorators' {
 *   interface ModelTypeMap {
 *     [ModelNames.User]: UserModel;
 *   }
 * }
 * ```
 */
export interface ModelTypeMap {
}
/**
 * Symbol 到类型的映射接口，用于类型推断
 * 业务层通过 declare module 扩展此接口来注册类型
 */
export interface ManagerTypeMap {
}
/**
 * Symbol 到类型的映射接口，用于类型推断
 * 业务层通过 declare module 扩展此接口来注册类型
 */
export interface ViewTypeMap {
}
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
 * 通过 Symbol 获取 Model 类构造函数
 * @param modelSymbol Model 的 Symbol 标识
 * @returns Model 类构造函数
 * @throws 如果 Model 未注册则抛出错误
 */
export declare function getModelClass<T>(modelSymbol: symbol): new () => T;
/**
 * 通过类构造函数获取 Model 的 Symbol
 * @param ctor Model 类构造函数
 * @returns Model 的 Symbol
 * @internal 内部使用
 */
export declare function getModelSymbol(ctor: Function): symbol | undefined;
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
 * 通过 Symbol 获取 Manager 类构造函数
 * @param managerSymbol Manager 的 Symbol 标识
 * @returns Manager 类构造函数
 * @throws 如果 Manager 未注册则抛出错误
 */
export declare function getManagerClass<T>(managerSymbol: symbol): new () => T;
/**
 * 通过类构造函数获取 Manager 的 Symbol
 * @param ctor Manager 类构造函数
 * @returns Manager 的 Symbol
 * @internal 内部使用
 */
export declare function getManagerSymbol(ctor: Function): symbol | undefined;
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
 * 通过 Symbol 获取 View 类构造函数
 * @param viewSymbol View 的 Symbol 标识
 * @returns View 类构造函数
 * @throws 如果 View 未注册则抛出错误
 */
export declare function getViewClass<T>(viewSymbol: symbol): new () => T;
/**
 * 自动注册所有使用装饰器标记的 Model 和 Manager
 * @param core Core 实例
 * @example
 * ```typescript
 * // 导入所有 Model 和 Manager
 * import '@/models/UserModel';
 * import '@/managers/GameManager';
 *
 * // 自动注册
 * autoRegister(mf.core);
 * ```
 */
export declare function autoRegister(core: ICore): void;
