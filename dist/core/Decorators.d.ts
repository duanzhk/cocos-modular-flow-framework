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
 * const user = mf.core.getModel(UserModel);
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
 * await mf.ui.open(HomeView);
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
