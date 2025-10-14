import { ICore, IManager, IModel } from "./Api";
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
    abstract initialize(): void;
    dispose(): void;
    protected getModel<T extends IModel>(modelSymbol: symbol): T;
    protected getManager<T extends IManager>(managerSymbol: symbol): T;
}
