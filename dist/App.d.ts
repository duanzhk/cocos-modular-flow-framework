import { ICore } from "./core";
import { CCUIManager, HttpManager, WebSocketManager, ResLoader, RedDotManager, Broadcaster } from "./libs";
/**
 * 对外暴露的全局app对像，用于访问基础能力，为上层业务提供了简洁的访问方式
 *
 * @class App
 */
export declare class App {
    static get core(): ICore;
    static readonly log: any;
    static readonly config: any;
    static get gui(): CCUIManager;
    static get http(): HttpManager;
    static get socket(): WebSocketManager;
    static get res(): ResLoader;
    static get event(): Broadcaster;
    static get reddot(): RedDotManager;
    static readonly storage: any;
    static readonly audio: any;
    static readonly timer: any;
}
declare global {
    var mf: typeof App;
}
