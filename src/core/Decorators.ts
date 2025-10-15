import { ICore, IModel, IManager } from "./Api";
import { ServiceLocator } from "./ServiceLocator";
import 'reflect-metadata'

// ============================================================================
// Symbol 注册系统 - Names 对象（提供代码补全和类型推断）
// ============================================================================

/** Model 名称到 Symbol 的映射，用于代码补全和类型推断 */
export const ModelNames = {} as Record<string, symbol>;

/** Manager 名称到 Symbol 的映射，用于代码补全和类型推断 */
export const ManagerNames = {} as Record<string, symbol>;

/** View 名称到 Symbol 的映射，用于代码补全和类型推断 */
export const ViewNames = {} as Record<string, symbol>;

// ============================================================================
// 类型推断辅助（通过 Symbol 自动推断类型）
// ============================================================================

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
export interface ModelTypeMap {}

/** 
 * Symbol 到类型的映射接口，用于类型推断
 * 业务层通过 declare module 扩展此接口来注册类型
 */
export interface ManagerTypeMap {}

/** 
 * Symbol 到类型的映射接口，用于类型推断
 * 业务层通过 declare module 扩展此接口来注册类型
 */
export interface ViewTypeMap {}

// ============================================================================
// 内部注册表
// ============================================================================

// Model 注册表
const modelSymbolRegistry = new Map<symbol, Function>();    // Symbol → 类
const ctorToModelSymbol = new Map<Function, symbol>();      // 类 → Symbol

// Manager 注册表
const managerSymbolRegistry = new Map<symbol, Function>();  // Symbol → 类
const ctorToManagerSymbol = new Map<Function, symbol>();    // 类 → Symbol

// View 注册表
const viewRegistry = new Map<symbol, Function>();           // Symbol → 类

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
        const modelSymbol = Symbol(modelName);
        
        // 注册到映射表
        modelSymbolRegistry.set(modelSymbol, ctor);
        ctorToModelSymbol.set(ctor, modelSymbol);
        (ModelNames as any)[modelName] = modelSymbol;
        
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
 * 通过 Symbol 获取 Model 类构造函数
 * @param modelSymbol Model 的 Symbol 标识
 * @returns Model 类构造函数
 * @throws 如果 Model 未注册则抛出错误
 */
export function getModelClass<T>(modelSymbol: symbol): new () => T {
    const modelClass = modelSymbolRegistry.get(modelSymbol);
    if (!modelClass) {
        throw new Error(`Model not registered! Symbol: ${modelSymbol.toString()}`);
    }
    return modelClass as new () => T;
}

/**
 * 通过类构造函数获取 Model 的 Symbol
 * @param ctor Model 类构造函数
 * @returns Model 的 Symbol
 * @internal 内部使用
 */
export function getModelSymbol(ctor: Function): symbol | undefined {
    return ctorToModelSymbol.get(ctor);
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
        const managerSymbol = Symbol(managerName);
        
        // 注册到映射表
        managerSymbolRegistry.set(managerSymbol, ctor);
        ctorToManagerSymbol.set(ctor, managerSymbol);
        (ManagerNames as any)[managerName] = managerSymbol;
        
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
 * 通过 Symbol 获取 Manager 类构造函数
 * @param managerSymbol Manager 的 Symbol 标识
 * @returns Manager 类构造函数
 * @throws 如果 Manager 未注册则抛出错误
 */
export function getManagerClass<T>(managerSymbol: symbol): new () => T {
    const managerClass = managerSymbolRegistry.get(managerSymbol);
    if (!managerClass) {
        throw new Error(`Manager not registered! Symbol: ${managerSymbol.toString()}`);
    }
    return managerClass as new () => T;
}

/**
 * 通过类构造函数获取 Manager 的 Symbol
 * @param ctor Manager 类构造函数
 * @returns Manager 的 Symbol
 * @internal 内部使用
 */
export function getManagerSymbol(ctor: Function): symbol | undefined {
    return ctorToManagerSymbol.get(ctor);
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
        const viewSymbol = Symbol(viewName);
        
        // 注册到映射表
        viewRegistry.set(viewSymbol, ctor);
        (ViewNames as any)[viewName] = viewSymbol;
        
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
 * 通过 Symbol 获取 View 类构造函数
 * @param viewSymbol View 的 Symbol 标识
 * @returns View 类构造函数
 * @throws 如果 View 未注册则抛出错误
 */
export function getViewClass<T>(viewSymbol: symbol): new () => T {
    const viewClass = viewRegistry.get(viewSymbol);
    if (!viewClass) {
        throw new Error(`View not registered! Symbol: ${viewSymbol.toString()}`);
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
    ctorToModelSymbol.forEach((modelSymbol, ctor) => {
        console.log(`${ctor.name} initialize`);
        core.regModel(modelSymbol);
    });
    
    // 注册所有 Manager
    ctorToManagerSymbol.forEach((managerSymbol, ctor) => {
        console.log(`${ctor.name} initialize`);
        core.regManager(managerSymbol);
    });
}