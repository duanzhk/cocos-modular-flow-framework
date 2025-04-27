import { _decorator, Component, Node } from 'cc';
import { BaseUITest } from '../../views/BaseUITest';
const { ccclass, property } = _decorator;

@ccclass('UITest')
export class UITest extends BaseUITest {
    protected onLoad(): void {
        // console.log('UITest onLoad');
        // let msg = new Broadcaster()
        // msg.broadcast("onlogout")
        // msg
        // // msg.on('onregister',(data) => {
        // //     console.log('onlogin', data);
        // // })
        // // msg.on({
        // //     key: 'onlogin',
        // //     listener: (data) => {
        // //         console.log('onlogin', data);
        // //     }
        // // })

        // msg.on({
        //     key: 'onlogout',
        //     listener: (value?: any, callback?: (data?: any, callBack?: any) => void, ...args: any[]) => {
        //         console.log('onlogout', value);
        //         if (callback) {
        //             callback(0, 0);
        //         }
        //     }
        // })
    }
    protected start(): void {
        
        console.log('UITest start');
    }
    protected onDisable(): void {
        console.log('UITest onDisable');
    }
    protected onDestroy(): void {
        console.log('UITest onDestroy');
    }

    onEnter(args?: any): void {
        console.log('UITest onEnter');
    }
    onExit(): void {
        console.log('UITest onExit');
    }
    onPause(): void {
        console.log('UITest onPause');
    }
    onResume(): void {
        console.log('UITest onResume');
    }
}

