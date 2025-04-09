import { UIManager } from "../libs/UIManager";
import { starmaker } from "./Core";
const { ServiceLocator } = starmaker.core
type ICore = starmaker.core.ICore;
type IEventManager = starmaker.core.IEventManager;
type IUIManager = starmaker.core.IUIManager;

/**
 * 对外暴露的全局app对像，用于访问基础能力，为上层业务提供了简洁的访问方式
 * 
 * @export
 * @class app
 */

export class app {
    static get core(): ICore {
        return ServiceLocator.getService<ICore>('core');
    }
    static readonly log: any = null;
    static readonly config: any = null;
    static get gui(): UIManager{
        return ServiceLocator.getService<UIManager>('UIManager')
    }
    static readonly http: any = null;
    static readonly socket: any = null;
    static readonly res: any = null;
    static get event(): IEventManager{
        return ServiceLocator.getService<IEventManager>('EventManager')
    }
    static readonly storage: any = null;
    static readonly audio: any = null;
    static readonly timer: any = null;
}