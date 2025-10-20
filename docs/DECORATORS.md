# 装饰器系统

框架提供了三个核心装饰器，用于注册 Manager、Model 和 View。

## @manager() - Manager 装饰器

用于注册 Manager 到全局注册表。

### 基本用法

```typescript
import { manager, AbstractManager, ManagerNames } from 'dzkcc-mflow/core';

@manager('Game')  // 指定名称为 'Game'
export class GameManager extends AbstractManager {
    private score: number = 0;
    
    initialize(): void {
        console.log('GameManager 初始化');
    }
    
    dispose(): void {
        console.log('GameManager 销毁');
    }
    
    addScore(value: number): void {
        this.score += value;
        this.getEventManager().dispatch('scoreChanged', this.score);
    }
}

// 使用
const gameManager = mf.core.getManager('GameManager');
gameManager.addScore(10);
```

### Manager 生命周期

- `initialize()` - 在注册时被调用，用于初始化
- `dispose()` - 在销毁时被调用，用于清理资源

### Manager 内置能力

```typescript
@manager('Example')
export class ExampleManager extends AbstractManager {
    initialize(): void {
        // 获取 Model
        const userModel = this.getModel('UserModel');

        // 获取其他 Manager
        const gameManager = this.getManager('GameManager');
        
        // 获取事件管理器
        const eventMgr = this.getEventManager();
        eventMgr.on('someEvent', this.onEvent, this);
        
        // 获取 HTTP 管理器
        const httpMgr = this.getHttpManager();
        
        // 获取 WebSocket 管理器
        const socketMgr = this.getWebSocketManager();
    }
    
    private onEvent(data: any): void {
        console.log('收到事件', data);
    }
    
    dispose(): void {
        // 清理事件监听
        this.getEventManager().offAll(undefined, this);
    }
}
```

## @model() - Model 装饰器

用于注册 Model 到全局注册表。

### 基本用法

```typescript
import { model, IModel, ModelNames } from 'dzkcc-mflow/core';

@model('User')  // 指定名称为 'User'
export class UserModel implements IModel {
    private _playerName: string = '';
    private _level: number = 1;
    
    initialize(): void {
        console.log('UserModel 初始化');
    }
    
    get playerName(): string {
        return this._playerName;
    }
    
    set playerName(name: string) {
        this._playerName = name;
    }
    
    get level(): number {
        return this._level;
    }
    
    levelUp(): void {
        this._level++;
    }
}

// 使用
const userModel = mf.core.getModel('UserModel');
userModel.playerName = 'Alice';
userModel.levelUp();
```

### Model 生命周期

- `initialize()` - 在注册时被调用，用于初始化数据

### Model 设计原则

- **单一职责**：每个 Model 只管理一类数据
- **纯数据**：不包含业务逻辑，只负责数据存储和访问
- **无状态依赖**：Model 之间不应该相互依赖

## @view() - View 装饰器

用于注册 View 到全局注册表。

### 基本用法

```typescript
import { view, ViewNames } from 'dzkcc-mflow/core';
import { BaseView } from 'dzkcc-mflow/libs';
import { _decorator, Button, Label } from 'cc';

const { ccclass, property } = _decorator;

@view('Home')  // 注册为 'Home'
@ccclass('HomeView')
export class HomeView extends BaseView {
    @property(Label)
    titleLabel: Label = null!;
    
    @property(Button)
    startButton: Button = null!;
    
    onEnter(args?: any): void {
        console.log('HomeView 打开', args);
        this.startButton.node.on('click', this.onStartClick, this);
    }
    
    onExit(): void {
        // 自动清理事件监听
    }
    
    onPause(): void {
        console.log('HomeView 暂停');
    }
    
    onResume(): void {
        console.log('HomeView 恢复');
    }
    
    private onStartClick(): void {
        mf.gui.open(ViewNames.Game);
    }
}

// 使用 - 通过字符串打开视图
await mf.gui.open('HomeView', { userId: 123 });

// 关闭视图
mf.gui.close('HomeView');  // 关闭但保留缓存
mf.gui.close('HomeView', true);  // 关闭并销毁
```

### View 生命周期

详见 [UI 系统](./UI_SYSTEM.md)

## 装饰器参数

所有装饰器都支持可选的 `name` 参数：

```typescript
// 指定名称
@manager('Game')
@model('User')
@view('Home')

// 不指定名称时，自动使用类名
@manager()  // 使用 'GameManager'
@model()    // 使用 'UserModel'
@view()     // 使用 'HomeView'
```

## 字符串标识符

装饰器注册后，使用类名作为字符串标识符：

```typescript
// 使用字符串直接访问
'GameManager'      // Manager 类名
'UserModel'        // Model 类名
'HomeView'         // View 类名
```

## 完整示例

```typescript
// 1. 定义 Model
@model('GameData')
export class GameDataModel implements IModel {
    score: number = 0;
    level: number = 1;
    
    initialize(): void {
        console.log('GameDataModel 初始化');
    }
}

// 2. 定义 Manager
@manager('Game')
export class GameManager extends AbstractManager {
    initialize(): void {
        console.log('GameManager 初始化');
        
        // 获取 Model
        const gameData = this.getModel('GameDataModel');
        console.log('当前关卡:', gameData.level);
    }
    
    startGame(): void {
        const gameData = this.getModel('GameDataModel');
        gameData.score = 0;
        
        // 派发事件
        this.getEventManager().dispatch('gameStart');
    }
    
    dispose(): void {
        console.log('GameManager 销毁');
    }
}

// 3. 定义 View
@view('Game')
@ccclass('GameView')
export class GameView extends BaseView {
    @property(Label)
    scoreLabel: Label = null!;
    
    onEnter(args?: any): void {
        // 监听事件
        this.event.on('gameStart', this.onGameStart, this);
        
        // 获取 Manager
        const gameManager = this.getManager('GameManager');
        gameManager.startGame();
    }
    
    onExit(): void {}
    onPause(): void {}
    onResume(): void {}
    
    private onGameStart(): void {
        console.log('游戏开始');
    }
}

// 4. 使用
const gameManager = mf.core.getManager('GameManager');
const gameData = mf.core.getModel('GameDataModel');
await mf.gui.open('GameView');
```

## 注意事项

1. **装饰器顺序**：
   - View 需要同时使用 `@view()` 和 `@ccclass()`
   - `@view()` 必须在 `@ccclass()` 之前

2. **命名规范**：
   - Manager 以 `Manager` 结尾，如 `GameManager`
   - Model 以 `Model` 结尾，如 `UserModel`
   - View 以 `View` 结尾，如 `HomeView`

3. **导入模块**：
   - 使用装饰器后，需要在入口文件导入模块以触发注册

```typescript
// 入口文件
import './models/UserModel';
import './models/GameDataModel';
import './managers/GameManager';
import './views/GameView';
```

