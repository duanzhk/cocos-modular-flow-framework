import { ICore, IUIManager, ServiceLocator, IEventMsgKey, IEventManager, ICocosResManager } from "@mflow/api";

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
    static get gui(): IUIManager {
        return ServiceLocator.getService<IUIManager>('UIManager')
    }
    static readonly http: any = null;
    static readonly socket: any = null;
    static get res(): ICocosResManager {
        return ServiceLocator.getService<ICocosResManager>('ResLoader')
    }
    static get event(): IEventManager {
        return ServiceLocator.getService<IEventManager>('EventManager')
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