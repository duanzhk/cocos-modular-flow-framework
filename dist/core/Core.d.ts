import { ICore, IEventManager, IManager, IModel } from "./Api";
export declare abstract class AbstractCore<T extends AbstractCore<T>> implements ICore {
    private readonly container;
    constructor();
    protected abstract initialize(): void;
    regModel<T extends IModel>(model: T): void;
    getModel<T extends IModel>(ctor: new () => T): T;
    regManager<T extends IManager>(manager: T): void;
    getManager<T extends IManager>(indent: (new () => T) | symbol): T;
}
export declare abstract class AbstractManager implements IManager {
    private eventManager?;
    abstract initialize(): void;
    dispose(): void;
    protected getModel<T extends IModel>(ctor: new () => T): T;
    protected getEventManager(): IEventManager;
    private releaseEventManager;
}
