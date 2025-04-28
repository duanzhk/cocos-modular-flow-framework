
//@ts-ignore
import { BaseUITest } from 'db://assets/src/views/BaseUITest';
import { _decorator } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('UITest')
export class UITest extends BaseUITest {
    onEnter(args?: any): void { }
    onExit(): void { }
    onPause(): void { }
    onResume(): void { }
}