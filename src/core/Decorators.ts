import { ICore, IModel, IManager } from "./Api";
import { ServiceLocator } from "./ServiceLocator";
import 'reflect-metadata'

// 通过symbol实现接口标识
const interfaceSymbols = new Map<Function, symbol>();
// 装饰器，方便自动注册manager和model
const modelRegistry: Function[] = [];
const managerRegistry: Function[] = [];
export function getInterface<T extends Function>(ctor: T): symbol {
    let sym = interfaceSymbols.get(ctor);
    if (!sym) throw new Error(`Manager ${ctor.name} not registered! Please use @manager() decorator to register it.`);
    return sym;
}

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

// 依赖注入
// ------------------------------------------------------------------------------------
const INJECTED_PROPERTIES_KEY = 'injectedProperties';
// 因为明文定义的属性会覆盖injectManager（通过defineProperty定义）注入的属性，所以需要在编译时删除明文定义的属性
function CleanInjectedProperties<T extends { new(...args: any[]): {} }>(constructor: T) {
    return class extends constructor {
        constructor(...args: any[]) {
            super(...args);

            // 递归收集当前类及其所有父类的注入属性
            const collectInjectedProperties = (klass: any): string[] => {
                if (klass === null || klass === Object) return [];
                const parentProperties = collectInjectedProperties(Object.getPrototypeOf(klass));
                const currentProperties = Reflect.getMetadata(INJECTED_PROPERTIES_KEY, klass) || [];
                // const currentProperties :any[] = []
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