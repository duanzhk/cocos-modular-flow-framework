// 扩展框架声明的事件类型
import { IEventMsgKey } from "@core";
declare module "@core" {
    interface IEventMsgKey {
        onregister: "onregister";
        onlogin: "onlogin";
        onlogout: "onlogout";
    }
}