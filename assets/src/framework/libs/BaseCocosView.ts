import { _decorator, Component } from 'cc';
import { starmaker } from "../core/Core";
import { app } from '../core/App';
const { ccclass, property } = _decorator;
type IView = starmaker.core.IView;
type IModel = starmaker.core.IModel;
type IManager = starmaker.core.IManager;

export abstract class BaseCocosView extends Component implements IView {
    abstract onOpened(args?: any): void;

    protected getManager<T extends IManager>(ctor: new () => T): T {
        // 业务组件避免直接依赖底层服务定位器，所以使用app.core统一对外接口，方便后续架构演进
        return app.core.getManager<T>(ctor);
    }

    protected getModel<T extends IModel>(ctor: new () => T): T {
        // 业务组件避免直接依赖底层服务定位器，所以使用app.core统一对外接口，方便后续架构演进
        return app.core.getModel<T>(ctor);
    }

}