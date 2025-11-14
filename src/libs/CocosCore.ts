import { Component } from "cc";
import { AbstractCore, ServiceLocator } from "../core";
import { CCUIManager, ResLoader, Broadcaster, HttpManager, WebSocketManager, RedDotManager } from ".";
import '../App'

class Core extends AbstractCore<Core> {
    protected initialize(): void {
        console.log('Core fromework initialize');
        // 注册框架基础服务
        ServiceLocator.regService('EventManager', new Broadcaster());
        ServiceLocator.regService('ResLoader', new ResLoader());
        ServiceLocator.regService('UIManager', new CCUIManager());
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