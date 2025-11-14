// ============================================================================
// 内部注册表
// ============================================================================

// Model 注册表
const modelRegistry = new Map<string, Function>();    // Key → 类

// Manager 注册表
const managerRegistry = new Map<string, Function>();  // Key → 类

// View 注册表
const viewRegistry = new Map<string, Function>();     // Key → 类

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
export function model(name?: string) {
    return function (ctor: Function) {
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
export function getRegisteredModelNames(): string[] {
    return Array.from(modelRegistry.keys());
}

/**
 * 通过 Key 获取 Model 类构造函数
 * @param modelKey Model 的 Key 标识
 * @returns Model 类构造函数
 * @throws 如果 Model 未注册则抛出错误
 */
export function getModelClass<T>(modelKey: string): new () => T {
    const modelClass = modelRegistry.get(modelKey);
    if (!modelClass) {
        throw new Error(`Model not registered: ${modelKey}`);
    }
    return modelClass as new () => T;
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
export function manager(name?: string) {
    return function (ctor: Function) {
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
export function getRegisteredManagerNames(): string[] {
    return Array.from(managerRegistry.keys());
}

/**
 * 通过 Key 获取 Manager 类构造函数
 * @param managerKey Manager 的 Key 标识
 * @returns Manager 类构造函数
 * @throws 如果 Manager 未注册则抛出错误
 */
export function getManagerClass<T>(managerKey: string): new () => T {
    const managerClass = managerRegistry.get(managerKey);
    if (!managerClass) {
        throw new Error(`Manager not registered: ${managerKey}`);
    }
    return managerClass as new () => T;
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
export function view(name?: string) {
    return function (ctor: Function) {
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
export function getRegisteredViewNames(): string[] {
    return Array.from(viewRegistry.keys());
}

/**
 * 通过 Key 获取 View 类构造函数
 * @param viewKey View 的 Key 标识
 * @returns View 类构造函数
 * @throws 如果 View 未注册则抛出错误
 */
export function getViewClass<T>(viewKey: string): new () => T {
    const viewClass = viewRegistry.get(viewKey);
    if (!viewClass) {
        throw new Error(`View not registered: ${viewKey}`);
    }
    return viewClass as new () => T;
}

