import { _decorator, Component } from 'cc';
import { starmaker } from "../core/Core";
import { app } from '../core/App';
const { ccclass, property } = _decorator;
type IView = starmaker.core.IView;
type IModel = starmaker.core.IModel;
type IManager = starmaker.core.IManager;

export abstract class BaseView extends Component implements IView {
    /** @internal */
    readonly __isIView__: boolean = true;
    /** @internal */
    __group__: string | undefined = undefined;
    onEnter(args?: any): void {
        throw new Error('Method not implemented.');
    }
    onExit(): void {
        throw new Error('Method not implemented.');
    }
    onPause(): void {
        throw new Error('Method not implemented.');
    }
    onResume(): void {
        throw new Error('Method not implemented.');
    }

    protected getManager<T extends IManager>(ctor: new () => T): T {
        // 业务组件避免直接依赖底层服务定位器，所以使用app.core统一对外接口，方便后续架构演进
        return app.core.getManager<T>(ctor);
    }

    protected getModel<T extends IModel>(ctor: new () => T): T {
        // 业务组件避免直接依赖底层服务定位器，所以使用app.core统一对外接口，方便后续架构演进
        return app.core.getModel<T>(ctor);
    }

}