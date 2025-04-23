import { _decorator} from 'cc';
import { UITest } from './gui/UITest';
import { CocosCore } from 'libs';
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

