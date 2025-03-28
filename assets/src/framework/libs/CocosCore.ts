import { Component } from "cc";
import { starmaker } from "../core/Core";
import { EventManager } from "./EventManager";
const { ServiceLocator, autoRegister } = starmaker.core

class Core extends starmaker.core.AbstractCore<Core> {
    protected initialize(): void {
        console.log('Core fromework initialize'); 
        // 注册框架基础服务
        ServiceLocator.regService('EventManager', new EventManager());

        // 注册业务模块（通过装饰器自动注册）
        // 推迟到构造函数执行完毕
        queueMicrotask(() => {
            autoRegister(this);
        })
    }
}

export abstract class CocosCore extends Component {
    protected onLoad(): void {
        ServiceLocator.regService('core', new Core());
    }
}