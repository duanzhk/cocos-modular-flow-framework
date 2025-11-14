import { Component } from 'cc';
import { AbstractCore } from '../core/Core.js';
import { ServiceLocator } from '../core/ServiceLocator.js';
import './BaseView.js';
import { Broadcaster } from './Broadcaster.js';
import { ResLoader } from './ResLoader.js';
import { CCUIManager } from './UIManager.js';
import './UIRoot.js';
import { HttpManager } from './HttpManager.js';
import { WebSocketManager } from './WebSocketManager.js';
import { RedDotManager } from './indicator/RedDotManager.js';
import './indicator/UIRedDot.js';
import '../App.js';

class Core extends AbstractCore {
    initialize() {
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
class CocosCore extends Component {
    onLoad() {
        ServiceLocator.regService('core', new Core());
    }
}

export { CocosCore };
