import { _decorator, Component } from 'cc';
import { IView, IManager, IModel } from '../core';
const { ccclass, property } = _decorator;

export abstract class BaseView extends Component implements IView {
    /** @internal */
    private readonly __isIView__: boolean = true;
    /** @internal */
    private __group__: string | undefined = undefined;

    abstract onEnter(args?: any): void 
    abstract onExit(): void 
    abstract onPause(): void 
    abstract onResume(): void 

    protected getManager<T extends IManager>(ctor: new () => T): T {
        // 业务组件避免直接依赖底层服务定位器，所以使用app.core统一对外接口，方便后续架构演进
        return app.core.getManager<T>(ctor);
    }

    protected getModel<T extends IModel>(ctor: new () => T): T {
        // 业务组件避免直接依赖底层服务定位器，所以使用app.core统一对外接口，方便后续架构演进
        return app.core.getModel<T>(ctor);
    }

}