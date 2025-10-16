// ============================================================================
// 内部注册表
// ============================================================================
// Model 注册表
const modelRegistry = new Map(); // Key → 类
// Manager 注册表
const managerRegistry = new Map(); // Key → 类
// View 注册表
const viewRegistry = new Map(); // Key → 类
// ============================================================================
// Model 装饰器
// ============================================================================
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
function model(name) {
    return function (ctor) {
        const modelName = name || ctor.name;
        // 注册到映射表
        modelRegistry.set(modelName, ctor);
        console.log(`Model registered: ${modelName}`);
    };
}
/**
 * 获取所有已注册的 Model 名称
 * @returns Model 名称数组
 */
function getRegisteredModelNames() {
    return Array.from(modelRegistry.keys());
}
/**
 * 通过 Key 获取 Model 类构造函数
 * @param modelKey Model 的 Key 标识
 * @returns Model 类构造函数
 * @throws 如果 Model 未注册则抛出错误
 */
function getModelClass(modelKey) {
    const modelClass = modelRegistry.get(modelKey);
    if (!modelClass) {
        throw new Error(`Model not registered: ${modelKey}`);
    }
    return modelClass;
}
// ============================================================================
// Manager 装饰器
// ============================================================================
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
function manager(name) {
    return function (ctor) {
        const managerName = name || ctor.name;
        // 注册到映射表
        managerRegistry.set(managerName, ctor);
        console.log(`Manager registered: ${managerName}`);
    };
}
/**
 * 获取所有已注册的 Manager 名称
 * @returns Manager 名称数组
 */
function getRegisteredManagerNames() {
    return Array.from(managerRegistry.keys());
}
/**
 * 通过 Key 获取 Manager 类构造函数
 * @param managerKey Manager 的 Key 标识
 * @returns Manager 类构造函数
 * @throws 如果 Manager 未注册则抛出错误
 */
function getManagerClass(managerKey) {
    const managerClass = managerRegistry.get(managerKey);
    if (!managerClass) {
        throw new Error(`Manager not registered: ${managerKey}`);
    }
    return managerClass;
}
// ============================================================================
// View 装饰器
// ============================================================================
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
function view(name) {
    return function (ctor) {
        const viewName = name || ctor.name;
        // 注册到映射表
        viewRegistry.set(viewName, ctor);
        console.log(`View registered: ${viewName}`);
    };
}
/**
 * 获取所有已注册的 View 名称
 * @returns View 名称数组
 */
function getRegisteredViewNames() {
    return Array.from(viewRegistry.keys());
}
/**
 * 通过 Key 获取 View 类构造函数
 * @param viewKey View 的 Key 标识
 * @returns View 类构造函数
 * @throws 如果 View 未注册则抛出错误
 */
function getViewClass(viewKey) {
    const viewClass = viewRegistry.get(viewKey);
    if (!viewClass) {
        throw new Error(`View not registered: ${viewKey}`);
    }
    return viewClass;
}

export { getManagerClass, getModelClass, getRegisteredManagerNames, getRegisteredModelNames, getRegisteredViewNames, getViewClass, manager, model, view };
