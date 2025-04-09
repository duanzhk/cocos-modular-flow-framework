import { _decorator, Component, Node } from 'cc';
import { BaseUITest } from '../../views/BaseUITest';
const { ccclass, property } = _decorator;

@ccclass('UITest')
export class UITest extends BaseUITest {
    protected onLoad(): void {
        console.log('UITest onLoad');
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

