import { Component } from "cc";
import { AbstractCore, IEventMsgKey, ServiceLocator } from "../core";
import { UIManager} from "./UIManager";
import { ResLoader} from "./ResLoader";
import { Broadcaster} from "./Broadcaster";
import { HttpManager } from "./HttpManager";
import { WebSocketManager } from "./WebSocketManager";
import { RedDotManager } from "./indicator/RedDotManager";
import '../App'

class Core extends AbstractCore<Core> {
    protected initialize(): void {
        console.log('Core fromework initialize');
        // 注册框架基础服务
        ServiceLocator.regService('EventManager', new Broadcaster<IEventMsgKey>());
        ServiceLocator.regService('ResLoader', new ResLoader());
        ServiceLocator.regService('UIManager', new UIManager());
        ServiceLocator.regService('HttpManager', new HttpManager());
        ServiceLocator.regService('WebSocketManager', new WebSocketManager());
        ServiceLocator.regService('RedDotManager', new RedDotManager());
    }
}

export abstract class CocosCore extends Component {
    protected onLoad(): void {
        ServiceLocator.regService('core', new Core());
    }
}