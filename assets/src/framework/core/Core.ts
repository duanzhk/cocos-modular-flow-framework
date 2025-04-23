import 'reflect-metadata';
import { ICore, IEventManager, IManager, IModel, getInterface, ServiceLocator } from 'core';

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
