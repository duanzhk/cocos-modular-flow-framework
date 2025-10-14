import { ICore, IEventManager, IManager, IModel, IHttpManager, IWebSocketManager } from "./Api";
import { ServiceLocator } from "./ServiceLocator";
import { getModelClass, getManagerClass } from "./Decorators";

class Container {
    private symbol2ins = new Map<symbol, any>();
    
    reg(sym: symbol, ins: any): void {
        this.symbol2ins.set(sym, ins);
    }
    
    get(sym: symbol): any {
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
    regModel<T extends IModel>(modelSymbol: symbol): void {
        const ModelClass = getModelClass<T>(modelSymbol);
        const model = new ModelClass();
        this.container.reg(modelSymbol, model);
        model.initialize();
    }

    getModel<T extends IModel>(modelSymbol: symbol): T {
        return this.container.get(modelSymbol);
    }

    // 注册与获取管理器
    regManager<T extends IManager>(managerSymbol: symbol): void {
        const ManagerClass = getManagerClass<T>(managerSymbol);
        const manager = new ManagerClass();
        this.container.reg(managerSymbol, manager);
        manager.initialize();
    }

    getManager<T extends IManager>(managerSymbol: symbol): T {
        return this.container.get(managerSymbol);
    }
}

export abstract class AbstractManager implements IManager {
    private eventManager?: IEventManager;

    abstract initialize(): void

    dispose(): void {
        this.releaseEventManager();
    }

    protected getModel<T extends IModel>(modelSymbol: symbol): T {
        // 保持框架独立性，不与具体应用入口(app类)耦合
        // 框架高内聚，使用ServiceLocator获取core
        return ServiceLocator.getService<ICore>('core').getModel<T>(modelSymbol);
    }

    // 事件管理器获取（通过服务定位器解耦）
    protected getEventManager(): IEventManager {
        if (!this.eventManager) {
            this.eventManager = ServiceLocator.getService<IEventManager>('EventManager');
        }
        return this.eventManager;
    }

    // HTTP 管理器获取
    protected getHttpManager(): IHttpManager {
        return ServiceLocator.getService<IHttpManager>('HttpManager');
    }

    // WebSocket 管理器获取
    protected getWebSocketManager(): IWebSocketManager {
        return ServiceLocator.getService<IWebSocketManager>('WebSocketManager');
    }

    private releaseEventManager(): void {
        if (this.eventManager) {
            // 假设 IEventManager 有销毁逻辑（如第三方库）
            (this.eventManager as any)?.dispose?.();
            this.eventManager = undefined;
        }
    }
}
