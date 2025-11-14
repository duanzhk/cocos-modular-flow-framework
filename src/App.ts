import { ICore, ServiceLocator } from "./core";
import { CCUIManager, HttpManager, WebSocketManager, ResLoader, RedDotManager, Broadcaster } from "./libs";
/**
 * 对外暴露的全局app对像，用于访问基础能力，为上层业务提供了简洁的访问方式
 * 
 * @class App
 */
export class App {
    static get core(): ICore {
        return ServiceLocator.getService<ICore>('core');
    }
    static readonly log: any = null;
    static readonly config: any = null;
    static get gui(): CCUIManager {
        return ServiceLocator.getService<CCUIManager>('UIManager');
    }
    static get http(): HttpManager {
        return ServiceLocator.getService<HttpManager>('HttpManager');
    }
    static get socket(): WebSocketManager {
        return ServiceLocator.getService<WebSocketManager>('WebSocketManager');
    }
    static get res(): ResLoader {
        return ServiceLocator.getService<ResLoader>('ResLoader');
    }
    static get event(): Broadcaster {
        return ServiceLocator.getService<Broadcaster>('EventManager');
    }
    static get reddot(): RedDotManager {
        return ServiceLocator.getService<RedDotManager>('ReddotManager');
    }
    static readonly storage: any = null;
    static readonly audio: any = null;
    static readonly timer: any = null;
}

declare global {
    var mf: typeof App;
}
//例挂载到全局对象
globalThis.mf = App;