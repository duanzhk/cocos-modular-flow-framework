import { Component } from 'cc';
import { AbstractCore } from '../core/Core.js';
import { autoRegister } from '../core/Decorators.js';
import { ServiceLocator } from '../core/ServiceLocator.js';
import { UIManager } from './UIManager.js';
import { ResLoader } from './ResLoader.js';
import { Broadcaster } from './Broadcaster.js';
import '../App.js';

class Core extends AbstractCore {
    initialize() {
        console.log('Core fromework initialize');
        // 注册框架基础服务
        ServiceLocator.regService('EventManager', new Broadcaster());
        ServiceLocator.regService('ResLoader', new ResLoader());
        ServiceLocator.regService('UIManager', new UIManager());
        // 注册业务模块（通过装饰器自动注册）
        // 推迟到构造函数执行完毕
        queueMicrotask(() => autoRegister(this));
    }
}
class CocosCore extends Component {
    onLoad() {
        ServiceLocator.regService('core', new Core());
    }
}

export { CocosCore };
