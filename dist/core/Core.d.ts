import { ICore, IEventManager, IManager, IModel, IHttpManager, IWebSocketManager } from "./Api";
export declare abstract class AbstractCore<T extends AbstractCore<T>> implements ICore {
    private readonly container;
    constructor();
    protected abstract initialize(): void;
    regModel<T extends IModel>(modelSymbol: symbol): void;
    getModel<T extends IModel>(modelSymbol: symbol): T;
    regManager<T extends IManager>(managerSymbol: symbol): void;
    getManager<T extends IManager>(managerSymbol: symbol): T;
}
export declare abstract class AbstractManager implements IManager {
    private eventManager?;
    abstract initialize(): void;
    dispose(): void;
    protected getModel<T extends IModel>(modelSymbol: symbol): T;
    protected getEventManager(): IEventManager;
    protected getHttpManager(): IHttpManager;
    protected getWebSocketManager(): IWebSocketManager;
    private releaseEventManager;
}
