import 'reflect-metadata';

export namespace starmaker.core {
    //#region 装饰器
    // 通过symbol实现接口标识
    const interfaceSymbols = new Map<Function, symbol>();
    export function getInterface<T extends Function>(ctor: T): symbol {
        let sym = interfaceSymbols.get(ctor);
        if (!sym) throw new Error(`Manager ${ctor.name} not registered! Please use @manager() decorator to register it.`);
        return sym;
    }

    // 装饰器，方便自动注册manager和model
    const modelRegistry: Function[] = [];
    const managerRegistry: Function[] = [];
    function manager() {
        return function (ctor: Function) {
            // 自动生成并注册Symbol
            if (!interfaceSymbols.has(ctor)) {
                interfaceSymbols.set(ctor, Symbol(ctor.name));
            }
            managerRegistry.push(ctor);
        };
    }
    export function model() {
        return function (ctor: Function) {
            modelRegistry.push(ctor);
        };
    }
    export function autoRegister(core: ICore) {
        modelRegistry.forEach(ctor => {
            console.log(`${ctor.name} initialize`);
            core.regModel(new (ctor as new () => IModel)())
        });
        managerRegistry.forEach(ctor => {
            console.log(`${ctor.name} initialize`);
            core.regManager(new (ctor as new () => IManager)())
        });
    }

    const INJECTED_PROPERTIES_KEY = 'injectedProperties';
    function CleanInjectedProperties<T extends { new(...args: any[]): {} }>(constructor: T) {
        return class extends constructor {
            constructor(...args: any[]) {
                super(...args);

                // 递归收集当前类及其所有父类的注入属性
                const collectInjectedProperties = (klass: any): string[] => {
                    if (klass === null || klass === Object) return [];
                    const parentProperties = collectInjectedProperties(Object.getPrototypeOf(klass));
                    const currentProperties = Reflect.getMetadata(INJECTED_PROPERTIES_KEY, klass) || [];
                    return [...parentProperties, ...currentProperties];
                };

                // 合并并去重属性名
                const injectedProperties = [
                    ...new Set(collectInjectedProperties(constructor))
                ];

                // 删除实例上的所有注入属性
                injectedProperties.forEach(prop => {
                    if (this.hasOwnProperty(prop)) {
                        delete (this as any)[prop];
                    }
                });
            }
        };
    }

    export function managedWithClean() {
        return function (ctor: Function) {
            // 先执行清理逻辑
            const decoratedCtor = CleanInjectedProperties(ctor as any);
            // 后执行注册逻辑
            manager()(decoratedCtor);
            return decoratedCtor;
        };
    }

    // 懒加载依赖注入manager
    export function injectManager(sym: symbol) {
        return function (target: IManager, prop: string) {
            const injectionKey = Symbol.for(prop)
            Object.defineProperty(target, prop, {
                get: function () {
                    console.log(`[属性访问] 触发getter：${injectionKey.toString()}`);
                    if (!this[injectionKey]) {
                        this[injectionKey] = ServiceLocator.getService<ICore>('core').getManager(sym);
                    }
                    return this[injectionKey];
                },
                set: function (val) { // 防止意外赋值
                    throw new Error('InjectManager property is read-only');
                },
                enumerable: true,
                configurable: false // 禁止修改属性描述符
            });

            // 2. 将属性名记录到元数据
            const injectedProperties = Reflect.getMetadata(INJECTED_PROPERTIES_KEY, target.constructor) || [];
            if (!injectedProperties.includes(prop)) {
                injectedProperties.push(prop);
            }
            Reflect.defineMetadata(
                INJECTED_PROPERTIES_KEY,
                injectedProperties,
                target.constructor
            );
        };
    }
    //#endregion

    class Container {
        private ctor2ins = new Map<Function, any>();// 使用构造函数作为键
        regByCtor<T>(type: new () => T, ins: T): void {
            this.ctor2ins.set(type, ins);
        }
        getByCtor<T>(type: new () => T): T {
            const ins = this.ctor2ins.get(type);
            if (!ins) throw new Error(`${type.name} not registered!`);
            return ins;
        }

        private symbol2ins = new Map<symbol, any>();
        regBySymbol(ctor: Function, ins: any) {
            const sym = getInterface(ctor);
            this.symbol2ins.set(sym, ins);
        }
        getBySymbol(sym: symbol) {
            const ins = this.symbol2ins.get(sym);
            if (!ins) throw new Error(`${sym.toString()} not registered!`);
            return ins;
        }
    }

    // regManager/regModel：管理业务领域内的具体实现
    export interface ICore {
        regModel<T extends IModel>(model: T): void;
        getModel<T extends IModel>(ctor: new () => T): T;
        regManager<T extends IManager>(manager: T): void;
        getManager<T extends IManager>(ctor: new () => T): T; // 构造器模式
        getManager<T extends IManager>(symbol: symbol): T; // Symbol模式
    }

    // 管理器与模型基接口
    export interface IManager {
        initialize(): void;
        dispose(): void;
    }

    export interface IModel {
        initialize(): void;
    }

    export interface IView {
        onEnter(args?: any): void;
        onExit(): void;
        onPause(): void;
        onResume(): void;
    }

    // 事件管理器接口（解耦第三方库依赖）
    export interface IEventManager {
        dispatch(eventType: string, data?: any): void;
        on(eventType: string, handler: (data?: any) => void): void;
        off(eventType: string): void;
        clear(): void;
    }

    export interface IUIManager {
        open<T extends IView>(viewType: new () => T, args?: any): Promise<T>;
        close<T extends IView>(viewortype: T | (new () => T), destory?: boolean): void;
        openAndPush<T extends IView>(viewType: new () => T, group: string, args?: any): Promise<T>
        closeAndPop(group: string, destroy?: boolean): void
        getTopView(): IView | undefined
        clearStack(group: string, destroy?: boolean): void
    }

    export interface IResManager {
        load(path: string, type: any): Promise<any>;
        loadPrefab(path: string): Promise<any>;
        loadSpriteFrame(path: string): Promise<any>;
    }

    export abstract class AbstractCore<T extends AbstractCore<T>> implements ICore {
        private readonly container = new Container();
        constructor() {
            this.initialize();
        }
        // 初始化抽象方法
        protected abstract initialize(): void;

        // 注册与获取模型
        regModel<T extends IModel>(model: T): void {
            this.container.regByCtor(Object.getPrototypeOf(model).constructor, model);
            model.initialize();
        }

        getModel<T extends IModel>(ctor: new () => T): T {
            return this.container.getByCtor<T>(ctor);
        }

        // 注册与获取管理器
        regManager<T extends IManager>(manager: T): void {
            const ctor = Object.getPrototypeOf(manager).constructor;
            this.container.regByCtor(ctor, manager);
            this.container.regBySymbol(ctor, manager); // 同时注册Symbol
            manager.initialize();
        }

        getManager<T extends IManager>(indent: (new () => T) | symbol): T {
            if (typeof indent === 'symbol') {
                return this.container.getBySymbol(indent);
            } else {
                return this.container.getByCtor(indent);
            }
        }
    }

    export abstract class AbstractManager implements IManager {
        private eventManager?: IEventManager;

        abstract initialize(): void

        dispose(): void {
            this.releaseEventManager();
        }

        protected getModel<T extends IModel>(ctor: new () => T): T {
            // 保持框架独立性，不与具体应用入口(app类)耦合
            // 框架高内聚，使用ServiceLocator获取core
            return ServiceLocator.getService<ICore>('core').getModel<T>(ctor);
        }

        // 事件管理器获取（通过服务定位器解耦）
        protected getEventManager(): IEventManager {
            if (!this.eventManager) {
                this.eventManager = ServiceLocator.getService<IEventManager>('EventManager');
            }
            return this.eventManager;
        }

        private releaseEventManager(): void {
            if (this.eventManager) {
                // 假设 IEventManager 有销毁逻辑（如第三方库）
                (this.eventManager as any)?.dispose?.();
                this.eventManager = undefined;
            }
        }
    }

    //ServiceLocator：管理跨领域基础服务
    export class ServiceLocator {
        private static services = new Map<string, { factory: Function; instance?: any }>();

        static regService<T>(key: string, provider: T): void {
            if (typeof provider === 'function') {
                // 注册工厂函数（延迟执行）
                this.services.set(key, { factory: provider });
            } else {
                // 直接注册实例
                this.services.set(key, { factory: () => provider, instance: provider });
            }
        }

        static getService<T>(key: string): T {
            const entry = this.services.get(key);
            if (!entry) throw new Error(`Service ${key} not registered!`);

            // 单例模式：若已有实例，直接返回
            if (entry.instance) return entry.instance as T;

            // 执行工厂函数，创建实例并缓存
            const instance = entry.factory();
            entry.instance = instance; // 缓存实例（单例）
            return instance as T;
        }

        static remove(key: string): void {
            this.services.delete(key);
        }

        static clear(): void {
            this.services.clear();
        }
    }

}