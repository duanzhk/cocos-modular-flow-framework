import 'reflect-metadata';

/** Model 名称到 Symbol 的映射，用于代码补全和类型推断 */
const ModelNames = {};
/** Manager 名称到 Symbol 的映射，用于代码补全和类型推断 */
const ManagerNames = {};
/** View 名称到 Symbol 的映射，用于代码补全和类型推断 */
const ViewNames = {};
// ============================================================================
// 内部注册表
// ============================================================================
// Model 注册表
const modelSymbolRegistry = new Map(); // Symbol → 类
const ctorToModelSymbol = new Map(); // 类 → Symbol
// Manager 注册表
const managerSymbolRegistry = new Map(); // Symbol → 类
const ctorToManagerSymbol = new Map(); // 类 → Symbol
// View 注册表
const viewRegistry = new Map(); // Symbol → 类
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
function model(name) {
    return function (ctor) {
        const modelName = name || ctor.name;
        const modelSymbol = Symbol(modelName);
        // 注册到映射表
        modelSymbolRegistry.set(modelSymbol, ctor);
        ctorToModelSymbol.set(ctor, modelSymbol);
        ModelNames[modelName] = modelSymbol;
        console.log(`Model registered: ${modelName}`);
    };
}
/**
 * 获取所有已注册的 Model 名称
 * @returns Model 名称数组
 */
function getRegisteredModelNames() {
    return Object.keys(ModelNames);
}
/**
 * 通过 Symbol 获取 Model 类构造函数
 * @param modelSymbol Model 的 Symbol 标识
 * @returns Model 类构造函数
 * @throws 如果 Model 未注册则抛出错误
 */
function getModelClass(modelSymbol) {
    const modelClass = modelSymbolRegistry.get(modelSymbol);
    if (!modelClass) {
        throw new Error(`Model not registered! Symbol: ${modelSymbol.toString()}`);
    }
    return modelClass;
}
/**
 * 通过类构造函数获取 Model 的 Symbol
 * @param ctor Model 类构造函数
 * @returns Model 的 Symbol
 * @internal 内部使用
 */
function getModelSymbol(ctor) {
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
function manager(name) {
    return function (ctor) {
        const managerName = name || ctor.name;
        const managerSymbol = Symbol(managerName);
        // 注册到映射表
        managerSymbolRegistry.set(managerSymbol, ctor);
        ctorToManagerSymbol.set(ctor, managerSymbol);
        ManagerNames[managerName] = managerSymbol;
        console.log(`Manager registered: ${managerName}`);
    };
}
/**
 * 获取所有已注册的 Manager 名称
 * @returns Manager 名称数组
 */
function getRegisteredManagerNames() {
    return Object.keys(ManagerNames);
}
/**
 * 通过 Symbol 获取 Manager 类构造函数
 * @param managerSymbol Manager 的 Symbol 标识
 * @returns Manager 类构造函数
 * @throws 如果 Manager 未注册则抛出错误
 */
function getManagerClass(managerSymbol) {
    const managerClass = managerSymbolRegistry.get(managerSymbol);
    if (!managerClass) {
        throw new Error(`Manager not registered! Symbol: ${managerSymbol.toString()}`);
    }
    return managerClass;
}
/**
 * 通过类构造函数获取 Manager 的 Symbol
 * @param ctor Manager 类构造函数
 * @returns Manager 的 Symbol
 * @internal 内部使用
 */
function getManagerSymbol(ctor) {
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
function view(name) {
    return function (ctor) {
        const viewName = name || ctor.name;
        const viewSymbol = Symbol(viewName);
        // 注册到映射表
        viewRegistry.set(viewSymbol, ctor);
        ViewNames[viewName] = viewSymbol;
        console.log(`View registered: ${viewName}`);
    };
}
/**
 * 获取所有已注册的 View 名称
 * @returns View 名称数组
 */
function getRegisteredViewNames() {
    return Object.keys(ViewNames);
}
/**
 * 通过 Symbol 获取 View 类构造函数
 * @param viewSymbol View 的 Symbol 标识
 * @returns View 类构造函数
 * @throws 如果 View 未注册则抛出错误
 */
function getViewClass(viewSymbol) {
    const viewClass = viewRegistry.get(viewSymbol);
    if (!viewClass) {
        throw new Error(`View not registered! Symbol: ${viewSymbol.toString()}`);
    }
    return viewClass;
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
function autoRegister(core) {
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

export { ManagerNames, ModelNames, ViewNames, autoRegister, getManagerClass, getManagerSymbol, getModelClass, getModelSymbol, getRegisteredManagerNames, getRegisteredModelNames, getRegisteredViewNames, getViewClass, manager, model, view };
