import { _decorator, Component, Node } from 'cc';
import { CocosCore } from '../framework/libs/CocosCore';
import { app } from '../framework/core/App';
import { TestMgr } from './TestMgr';
const { ccclass, property } = _decorator;

@ccclass('Launcher')
export class Launcher extends CocosCore {
    onLoad() {
        super.onLoad();
    }

    start() {
        app.core.getManager(TestMgr).test();
    }
}

