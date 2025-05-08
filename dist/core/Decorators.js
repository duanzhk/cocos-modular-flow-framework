import { ServiceLocator } from './ServiceLocator.js';
import 'reflect-metadata';

// 通过symbol实现接口标识
const interfaceSymbols = new Map();
// 装饰器，方便自动注册manager和model
const modelRegistry = [];
const managerRegistry = [];
function getInterface(ctor) {
    let sym = interfaceSymbols.get(ctor);
    if (!sym)
        throw new Error(`Manager ${ctor.name} not registered! Please use @manager() decorator to register it.`);
    return sym;
}
function manager() {
    return function (ctor) {
        // 自动生成并注册Symbol
        if (!interfaceSymbols.has(ctor)) {
            interfaceSymbols.set(ctor, Symbol(ctor.name));
        }
        managerRegistry.push(ctor);
    };
}
function model() {
    return function (ctor) {
        modelRegistry.push(ctor);
    };
}
function autoRegister(core) {
    modelRegistry.forEach(ctor => {
        console.log(`${ctor.name} initialize`);
        core.regModel(new ctor());
    });
    managerRegistry.forEach(ctor => {
        console.log(`${ctor.name} initialize`);
        core.regManager(new ctor());
    });
}
// 依赖注入
// ------------------------------------------------------------------------------------
const INJECTED_PROPERTIES_KEY = 'injectedProperties';
// 因为明文定义的属性会覆盖injectManager（通过defineProperty定义）注入的属性，所以需要在编译时删除明文定义的属性
function CleanInjectedProperties(constructor) {
    return class extends constructor {
        constructor(...args) {
            super(...args);
            // 递归收集当前类及其所有父类的注入属性
            const collectInjectedProperties = (klass) => {
                if (klass === null || klass === Object)
                    return [];
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
                    delete this[prop];
                }
            });
        }
    };
}
function managedWithClean() {
    return function (ctor) {
        // 先执行清理逻辑
        const decoratedCtor = CleanInjectedProperties(ctor);
        // 后执行注册逻辑
        manager()(decoratedCtor);
        return decoratedCtor;
    };
}
// 懒加载依赖注入manager
function injectManager(sym) {
    return function (target, prop) {
        const injectionKey = Symbol.for(prop);
        Object.defineProperty(target, prop, {
            get: function () {
                console.log(`[属性访问] 触发getter：${injectionKey.toString()}`);
                if (!this[injectionKey]) {
                    this[injectionKey] = ServiceLocator.getService('core').getManager(sym);
                }
                return this[injectionKey];
            },
            set: function (val) {
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
        Reflect.defineMetadata(INJECTED_PROPERTIES_KEY, injectedProperties, target.constructor);
    };
}

export { autoRegister, getInterface, injectManager, managedWithClean, model };
