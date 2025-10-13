import { Component } from "cc";
import { AbstractCore, autoRegister, IEventMsgKey, ServiceLocator } from "../core";
import { UIManager} from "./UIManager";
import { ResLoader} from "./ResLoader";
import { Broadcaster} from "./Broadcaster";
import { HttpManager } from "./HttpManager";
import '../App'

class Core extends AbstractCore<Core> {
    protected initialize(): void {
        console.log('Core fromework initialize');
        // 注册框架基础服务
        ServiceLocator.regService('EventManager', new Broadcaster<IEventMsgKey>());
        ServiceLocator.regService('ResLoader', new ResLoader());
        ServiceLocator.regService('UIManager', new UIManager());
        ServiceLocator.regService('HttpManager', new HttpManager());

        // 注册业务模块（通过装饰器自动注册）
        // 推迟到构造函数执行完毕
        queueMicrotask(() => autoRegister(this))
    }
}

export abstract class CocosCore extends Component {
    protected onLoad(): void {
        ServiceLocator.regService('core', new Core());
    }
}