import { starmaker } from "./Core";
const { ServiceLocator } = starmaker.core
type IView = starmaker.core.IView;
type IModel = starmaker.core.IModel;
type IManager = starmaker.core.IManager;
type ICore = starmaker.core.ICore;
type IEventManager = starmaker.core.IEventManager;

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
    static readonly gui: any = null;
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