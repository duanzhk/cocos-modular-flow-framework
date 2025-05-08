import { ICore, IUIManager, IEventManager, ICocosResManager } from "./core";
/**
 * 对外暴露的全局app对像，用于访问基础能力，为上层业务提供了简洁的访问方式
 *
 * @class App
 */
export declare class App {
    static get core(): ICore;
    static readonly log: any;
    static readonly config: any;
    static get gui(): IUIManager;
    static readonly http: any;
    static readonly socket: any;
    static get res(): ICocosResManager;
    static get event(): IEventManager;
    static readonly storage: any;
    static readonly audio: any;
    static readonly timer: any;
}
declare global {
    var mf: typeof App;
}
