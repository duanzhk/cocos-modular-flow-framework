import { _decorator, Component, Node } from 'cc';
import { CocosCore } from '../framework/libs/CocosCore';
import { app } from '../framework/core/App';
import { UITest } from './gui/UITest';
const { ccclass, property, disallowMultiple } = _decorator;

@ccclass('Launcher')
@disallowMultiple()
export class Launcher extends CocosCore {
    onLoad() {
        super.onLoad();
    }

    start() {
        app.gui.openAndPush(UITest, "test")
    }
}

