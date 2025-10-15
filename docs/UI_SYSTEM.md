# UI 系统

## BaseView 基础视图

所有 UI 界面都应该继承 `BaseView` 类。

### 核心特性

- ✅ **自动事件管理** - `this.event` 监听的事件会自动清理
- ✅ **自动资源管理** - `this.res` 加载的资源会自动释放
- ✅ **生命周期方法** - 完整的生命周期钩子
- ✅ **内置访问能力** - 可直接获取 Manager 和 Model

### 基本用法

```typescript
import { view, ViewNames, ManagerNames, ModelNames } from 'dzkcc-mflow/core';
import { BaseView } from 'dzkcc-mflow/libs';
import { _decorator, Sprite, Label } from 'cc';

const { ccclass, property } = _decorator;

@view('Game')
@ccclass('GameView')
export class GameView extends BaseView {
    @property(Label)
    scoreLabel: Label = null!;
    
    @property(Sprite)
    playerSprite: Sprite = null!;
    
    onEnter(args?: any): void {
        // 监听事件（自动清理）
        this.event.on('scoreChanged', this.onScoreChanged, this);
        
        // 加载资源（自动释放）
        this.res.loadSpriteFrame(this.playerSprite, 'textures/player');
        
        // 获取 Manager
        const gameManager = this.getManager(ManagerNames.Game);
        
        // 获取 Model
        const userModel = this.getModel(ModelNames.User);
    }
    
    onExit(): void {
        // 事件监听会自动清理，无需手动 off
    }
    
    onPause(): void {
        // 界面被其他界面覆盖时调用
    }
    
    onResume(): void {
        // 界面从暂停状态恢复时调用
    }
    
    private onScoreChanged(score: number): void {
        this.scoreLabel.string = `分数: ${score}`;
    }
}
```

## 生命周期详解

### 完整生命周期

```typescript
@view('Example')
@ccclass('ExampleView')
export class ExampleView extends BaseView {
    // 1. 界面打开时调用
    onEnter(args?: any): void {
        console.log('界面打开', args);
        // 注册事件监听
        // 初始化界面数据
    }
    
    // 2. 界面被其他界面覆盖时调用（栈模式）
    onPause(): void {
        console.log('界面暂停');
        // 暂停动画
        // 暂停计时器
    }
    
    // 3. 界面从暂停状态恢复时调用（栈模式）
    onResume(): void {
        console.log('界面恢复');
        // 恢复动画
        // 恢复计时器
    }
    
    // 4. 界面关闭时调用
    onExit(): void {
        console.log('界面关闭');
        // 自动清理通过 this.event 注册的事件
        // 可以在这里做额外的清理工作
    }
    
    // 5. 界面销毁时调用（框架自动调用）
    protected onDestroy(): void {
        console.log('界面销毁');
        // 自动释放通过 this.res 加载的资源
        // 可以在这里做额外的清理工作
    }
}
```

### 生命周期调用时机

```
打开界面 → onEnter()
覆盖界面 → onPause()  (栈模式)
恢复界面 → onResume() (栈模式)
关闭界面 → onExit()
销毁界面 → onDestroy()
```

## UIManager 界面管理器

通过 `mf.gui` 访问 UI 管理功能。

### 基本操作

```typescript
import { ViewNames } from 'dzkcc-mflow/core';

// 打开界面
const view = await mf.gui.open(ViewNames.Home);

// 打开界面并传参
await mf.gui.open(ViewNames.Game, { level: 1, difficulty: 'hard' });

// 关闭界面（保留缓存）
mf.gui.close(ViewNames.Home);

// 关闭并销毁界面（释放资源）
mf.gui.close(ViewNames.Home, true);

// 通过视图实例关闭
const view = await mf.gui.open(ViewNames.Settings);
mf.gui.close(view);
```

## 视图栈管理

支持分组的视图栈，适用于关卡、向导等场景。

### 基本用法

```typescript
import { ViewNames } from 'dzkcc-mflow/core';

// 打开视图并入栈
await mf.gui.openAndPush(ViewNames.Level1, 'game', { levelId: 1 });
await mf.gui.openAndPush(ViewNames.Level2, 'game', { levelId: 2 });

// 关闭栈顶视图并弹出（会自动恢复上一个视图）
mf.gui.closeAndPop('game');  // Level2 关闭，Level1 恢复

// 清空整个栈
mf.gui.clearStack('game');  // 所有关卡视图关闭

// 清空栈并销毁
mf.gui.clearStack('game', true);

// 获取栈顶视图
const topView = mf.gui.getTopView();
```

### 应用场景

#### 场景 1：关卡系统

```typescript
// 进入关卡 1
await mf.gui.openAndPush(ViewNames.Level1, 'game');

// 进入关卡 2（关卡 1 暂停）
await mf.gui.openAndPush(ViewNames.Level2, 'game');

// 关卡 2 失败，返回关卡 1（关卡 1 恢复）
mf.gui.closeAndPop('game');

// 退出游戏（清空所有关卡）
mf.gui.clearStack('game', true);
```

#### 场景 2：连续弹窗

使用分组功能，可以实现关闭一个 UI 后自动弹出下一个，适用于登录后的各种活动弹窗。

```typescript
// 添加多个弹窗到同一组
await mf.gui.openAndPush(ViewNames.Activity1, 'popups', { order: 1 });
await mf.gui.openAndPush(ViewNames.Activity2, 'popups', { order: 2 });
await mf.gui.openAndPush(ViewNames.SignIn, 'popups', { order: 3 });

// 关闭当前弹窗，自动显示下一个
mf.gui.closeAndPop('popups');  // Activity1 关闭，Activity2 显示
mf.gui.closeAndPop('popups');  // Activity2 关闭，SignIn 显示
mf.gui.closeAndPop('popups');  // SignIn 关闭，所有弹窗完成
```

## Prefab 路径配置

视图需要配置 Prefab 路径，框架提供了开发工具自动生成。

### 手动配置

```typescript
@view('Home')
@ccclass('HomeView')
export class HomeView extends BaseView {
    /** @internal */
    private static readonly __path__: string = 'ui/home';  // Prefab 路径
    
    onEnter(): void {}
    onPause(): void {}
    onResume(): void {}
}
```

### 推荐：使用开发工具自动生成

详见 [开发工具](./DEV_TOOLS.md)

## 自动事件管理

`BaseView` 提供了自动清理的事件监听：

```typescript
@view('Game')
@ccclass('GameView')
export class GameView extends BaseView {
    onEnter(): void {
        // 使用 this.event 监听，会在 onExit 时自动清理
        this.event.on('scoreChanged', this.updateScore, this);
        this.event.on('levelUp', this.onLevelUp, this);
        this.event.once('gameOver', this.onGameOver, this);
    }
    
    onExit(): void {
        // 自动清理所有通过 this.event 监听的事件
        // 无需手动 off
    }
    
    private updateScore(score: number): void {
        console.log('分数更新:', score);
    }
    
    private onLevelUp(level: number): void {
        console.log('等级提升:', level);
    }
    
    private onGameOver(): void {
        console.log('游戏结束');
    }
}
```

## 自动资源管理

`BaseView` 提供了自动资源释放：

```typescript
@view('Game')
@ccclass('GameView')
export class GameView extends BaseView {
    @property(Sprite)
    avatarSprite: Sprite = null!;
    
    onEnter(): void {
        // 使用 this.res 加载，会在界面销毁时自动释放
        this.res.loadSpriteFrame(this.avatarSprite, 'textures/avatar');
        
        // 加载多个资源
        this.res.loadPrefab('prefabs/item1');
        this.res.loadPrefab('prefabs/item2');
        this.res.loadSpine(skeleton, 'spine/hero');
    }
    
    // 界面销毁时，所有通过 this.res 加载的资源会自动释放
}
```

## 完整示例

```typescript
import { view, ViewNames, ManagerNames, ModelNames } from 'dzkcc-mflow/core';
import { BaseView } from 'dzkcc-mflow/libs';
import { _decorator, Button, Label, Sprite } from 'cc';

const { ccclass, property } = _decorator;

@view('Home')
@ccclass('HomeView')
export class HomeView extends BaseView {
    /** @internal */
    private static readonly __path__: string = 'ui/home';
    
    @property(Label)
    welcomeLabel: Label = null!;
    
    @property(Label)
    scoreLabel: Label = null!;
    
    @property(Sprite)
    avatarSprite: Sprite = null!;
    
    @property(Button)
    startButton: Button = null!;
    
    onEnter(args?: any): void {
        // 获取 Model 和 Manager
        const userModel = this.getModel(ModelNames.User);
        const gameManager = this.getManager(ManagerNames.Game);
        
        // 监听事件（自动清理）
        this.event.on('scoreChanged', this.onScoreChanged, this);
        
        // 加载资源（自动释放）
        this.res.loadSpriteFrame(this.avatarSprite, 'textures/avatar');
        
        // 更新 UI
        this.welcomeLabel.string = `欢迎, ${userModel.name}!`;
        this.scoreLabel.string = `分数: ${userModel.score}`;
        
        // 监听按钮点击
        this.startButton.node.on(Button.EventType.CLICK, this.onStartClick, this);
    }
    
    onExit(): void {
        // 自动清理事件和资源
    }
    
    onPause(): void {
        console.log('界面暂停');
    }
    
    onResume(): void {
        console.log('界面恢复');
    }
    
    private onScoreChanged(score: number): void {
        this.scoreLabel.string = `分数: ${score}`;
    }
    
    private async onStartClick(): Promise<void> {
        mf.gui.close(ViewNames.Home);
        await mf.gui.open(ViewNames.Game);
    }
}
```

## 注意事项

1. **生命周期方法必须实现**：
   - `onEnter(args?: any): void`
   - `onExit(): void`
   - `onPause(): void`
   - `onResume(): void`

2. **事件清理**：
   - 使用 `this.event` 监听的事件会自动清理
   - 使用 `mf.event` 或其他方式监听的需要手动清理

3. **资源释放**：
   - 使用 `this.res` 加载的资源会自动释放
   - 使用 `mf.res` 或其他方式加载的需要手动释放

4. **异步操作**：
   - UI 打开/关闭是异步操作，注意使用 `await`
   - 避免在异步操作中访问已销毁的节点

