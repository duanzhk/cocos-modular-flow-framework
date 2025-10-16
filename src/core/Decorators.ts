import { ICore, ModelNamesType, ManagerNamesType, ViewNamesType } from "./Api";


// ============================================================================
// Key 注册系统 - Names 对象（提供代码补全和类型推断）
// ============================================================================

/** Model 名称常量对象，用于代码补全和类型推断 */
export const ModelNames = {} as ModelNamesType;

/** Manager 名称常量对象，用于代码补全和类型推断 */
export const ManagerNames = {} as ManagerNamesType;

/** View 名称常量对象，用于代码补全和类型推断 */
export const ViewNames = {} as ViewNamesType;

// ============================================================================
// 内部注册表
// ============================================================================

// Model 注册表
const modelRegistry = new Map<string, Function>();    // Key → 类
const ctorToModelKey = new Map<Function, string>();   // 类 → Key

// Manager 注册表
const managerRegistry = new Map<string, Function>();  // Key → 类
const ctorToManagerKey = new Map<Function, string>(); // 类 → Key

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
 * const user = mf.core.getModel(ModelNames.User);
 * ```
 */
export function model(name?: string) {
    return function (ctor: Function) {
        const modelName = name || ctor.name;

        // 注册到映射表
        modelRegistry.set(modelName, ctor);
        ctorToModelKey.set(ctor, modelName);
        (ModelNames as any)[modelName] = modelName;

        console.log(`Model registered: ${modelName}`);
    };
}

/**
 * 获取所有已注册的 Model 名称
 * @returns Model 名称数组
 */
export function getRegisteredModelNames(): string[] {
    return Object.keys(ModelNames);
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

/**
 * 通过类构造函数获取 Model 的 Key
 * @param ctor Model 类构造函数
 * @returns Model 的 Key
 * @internal 内部使用
 */
export function getModelKey(ctor: Function): string | undefined {
    return ctorToModelKey.get(ctor);
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
        ctorToManagerKey.set(ctor, managerName);
        (ManagerNames as any)[managerName] = managerName;

        console.log(`Manager registered: ${managerName}`);
    };
}

/**
 * 获取所有已注册的 Manager 名称
 * @returns Manager 名称数组
 */
export function getRegisteredManagerNames(): string[] {
    return Object.keys(ManagerNames);
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

/**
 * 通过类构造函数获取 Manager 的 Key
 * @param ctor Manager 类构造函数
 * @returns Manager 的 Key
 * @internal 内部使用
 */
export function getManagerKey(ctor: Function): string | undefined {
    return ctorToManagerKey.get(ctor);
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
 * await mf.ui.open(ViewNames.Home);
 * ```
 */
export function view(name?: string) {
    return function (ctor: Function) {
        const viewName = name || ctor.name;

        // 注册到映射表
        viewRegistry.set(viewName, ctor);
        (ViewNames as any)[viewName] = viewName;

        console.log(`View registered: ${viewName}`);
    };
}

/**
 * 获取所有已注册的 View 名称
 * @returns View 名称数组
 */
export function getRegisteredViewNames(): string[] {
    return Object.keys(ViewNames);
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


// ============================================================================
// 自动注册
// ============================================================================

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
export function autoRegister(core: ICore) {
    // 注册所有 Model
    ctorToModelKey.forEach((modelKey, ctor) => {
        console.log(`${ctor.name} initialize`);
        core.regModel(modelKey as keyof ModelNamesType);
    });

    // 注册所有 Manager
    ctorToManagerKey.forEach((managerKey, ctor) => {
        console.log(`${ctor.name} initialize`);
        core.regManager(managerKey as keyof ManagerNamesType);
    });
}