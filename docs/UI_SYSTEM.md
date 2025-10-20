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
await mf.gui.close(ViewNames.Home);

// 关闭并销毁界面（释放资源）
await mf.gui.close(ViewNames.Home, true);

// 通过视图实例关闭
const view = await mf.gui.open(ViewNames.Settings);
await mf.gui.close(view);
```

### 高级功能

#### 等待视图（Loading）

UIManager 支持在打开 UI 时显示等待视图，提升用户体验。

```typescript
// 全局配置等待视图
mf.gui.setLoadingConfig({
    enabled: true,                    // 启用等待视图
    prefabPath: 'ui/loading',        // 自定义等待视图预制体路径
    delay: 200,                      // 延迟显示时间（毫秒）
    minShowTime: 500                 // 最小显示时间（毫秒）
});

// 打开 UI 时显示等待视图
await mf.gui.open(ViewNames.Game, { 
    showLoading: true,               // 单独控制是否显示等待视图
    args: { level: 1 } 
});

// 打开 UI 时不显示等待视图
await mf.gui.open(ViewNames.Settings, { 
    showLoading: false 
});
```

#### 遮罩点击关闭配置

可以全局或单独控制是否允许点击遮罩关闭 UI。

```typescript
// 全局配置遮罩
mf.gui.setMaskOptions({
    clickToClose: true,              // 允许点击遮罩关闭
    color: new Color(0, 0, 0, 150)  // 遮罩颜色
});

// 打开 UI 时单独控制遮罩行为
await mf.gui.open(ViewNames.Dialog, { 
    clickToClose: false,             // 禁止点击遮罩关闭
    args: { message: '重要提示' } 
});
```

#### UI 动画支持

`BaseView` 提供了默认的打开和关闭动画效果。你可以通过覆盖 `onEnterAnimation()` 和 `onExitAnimation()` 方法来自定义动画。

**默认动画效果：**
- **打开动画**：缩放（从 0.8 到 1.0）+ 淡入（从透明到不透明），使用 `backOut` 缓动
- **关闭动画**：缩放（从 1.0 到 0.8）+ 淡出（从不透明到透明），使用 `backIn` 缓动

```typescript
@view('CustomPopup')
@ccclass('CustomPopupView')
export class CustomPopupView extends BaseView {
    /** @internal */
    private static readonly __path__: string = 'ui/custom-popup';

    // 自定义打开动画：滑动进入 + 淡入
    async onEnterAnimation(): Promise<void> {
        const node = this.node;

        // 初始状态：从屏幕上方滑入
        node.setPosition(0, 500, 0);
        node.setScale(0.5, 0.5, 1);

        let uiOpacity = node.getComponent(UIOpacity);
        if (uiOpacity) {
            uiOpacity.opacity = 0;
        }

        return new Promise<void>((resolve) => {
            // 同时执行滑动和缩放动画
            tween(node)
                .parallel(
                    tween().to(0.4, { position: new Vec3(0, 0, 0) }, { easing: 'quartOut' }),
                    tween().to(0.4, { scale: new Vec3(1, 1, 1) }, { easing: 'backOut' })
                )
                .start();

            // 淡入动画
            if (uiOpacity) {
                tween(uiOpacity)
                    .to(0.4, { opacity: 255 }, { easing: 'quadOut' })
                    .start();
            }

            // 动画完成后调用 resolve
            setTimeout(() => resolve(), 400);
        });
    }

    // 自定义关闭动画：旋转退出 + 淡出
    async onExitAnimation(): Promise<void> {
        const node = this.node;
        const uiOpacity = node.getComponent(UIOpacity);

        return new Promise<void>((resolve) => {
            // 同时执行旋转和淡出动画
            tween(node)
                .parallel(
                    tween().to(0.3, { rotation: new Vec3(0, 0, 180) }, { easing: 'backIn' }),
                    tween().to(0.3, { scale: new Vec3(0.8, 0.8, 1) }, { easing: 'backIn' })
                )
                .start();

            if (uiOpacity) {
                tween(uiOpacity)
                    .to(0.3, { opacity: 0 }, { easing: 'quadIn' })
                    .start();
            }

            // 动画完成后调用 resolve
            setTimeout(() => resolve(), 300);
        });
    }

    onEnter(args?: any): void {
        console.log('弹窗打开，参数:', args);
    }

    onExit(): void {
        console.log('弹窗关闭');
    }

    onPause(): void {}
    onResume(): void {}
}
```

#### 并发控制

防止同一视图被重复打开，提升性能。

```typescript
// 检查视图是否正在加载
if (mf.gui.isLoading(ViewNames.Game)) {
    console.log('游戏界面正在加载中...');
    return;
}

// 多次调用只会加载一次
const promise1 = mf.gui.open(ViewNames.Game);
const promise2 = mf.gui.open(ViewNames.Game); // 返回同一个 Promise
```

#### LRU 缓存策略

自动管理视图缓存，防止内存溢出。

```typescript
// 配置缓存策略
mf.gui.setCacheConfig({
    maxSize: 10,                     // 最大缓存数量
    enableLRU: true                  // 启用 LRU 策略
});

// 获取缓存统计信息
const stats = mf.gui.getCacheStats();
console.log(`缓存大小: ${stats.size}/${stats.maxSize}`);
console.log('LRU 顺序:', stats.lruOrder);

// 手动清理缓存
mf.gui.clearCache();
```

#### 视图预加载

提前加载常用视图，减少用户等待时间。

```typescript
// 配置预加载
mf.gui.setPreloadConfig({
    views: [ViewNames.Home, ViewNames.Game, ViewNames.Settings],
    delay: 1000                      // 延迟预加载时间（毫秒）
});

// 手动预加载视图
await mf.gui.preload(ViewNames.Shop);  // 单个视图
await mf.gui.preload([ViewNames.Inventory, ViewNames.Profile]);  // 多个视图
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
await mf.gui.closeAndPop('game');  // Level2 关闭，Level1 恢复

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
await mf.gui.closeAndPop('game');

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
await mf.gui.closeAndPop('popups');  // Activity1 关闭，Activity2 显示
await mf.gui.closeAndPop('popups');  // Activity2 关闭，SignIn 显示
await mf.gui.closeAndPop('popups');  // SignIn 关闭，所有弹窗完成
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

### 基础示例

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
        await mf.gui.close(ViewNames.Home);
        await mf.gui.open(ViewNames.Game);
    }
}
```

### 高级功能示例

```typescript
import { view, ViewNames } from 'dzkcc-mflow/core';
import { BaseView } from 'dzkcc-mflow/libs';
import { _decorator, Button, Label } from 'cc';

const { ccclass, property } = _decorator;

@view('Game')
@ccclass('GameView')
export class GameView extends BaseView {
    /** @internal */
    private static readonly __path__: string = 'ui/game';
    
    @property(Label)
    scoreLabel: Label = null!;
    
    @property(Button)
    pauseButton: Button = null!;
    
    @property(Button)
    shopButton: Button = null!;
    
    onEnter(args?: any): void {
        console.log('游戏界面打开，参数:', args);
        
        // 监听按钮事件
        this.pauseButton.node.on(Button.EventType.CLICK, this.onPauseClick, this);
        this.shopButton.node.on(Button.EventType.CLICK, this.onShopClick, this);
    }
    
    onExit(): void {
        console.log('游戏界面关闭');
    }
    
    private async onPauseClick(): Promise<void> {
        // 打开暂停菜单（使用默认动画效果）
        await mf.gui.open(ViewNames.PauseMenu, {
            showLoading: false,  // 暂停菜单不需要等待视图
            clickToClose: true   // 允许点击遮罩关闭
        });
        // 动画效果在 PauseMenuView 的 onEnterAnimation() 中定义
    }
    
    private async onShopClick(): Promise<void> {
        // 打开商店（带等待视图，使用自定义动画效果）
        await mf.gui.open(ViewNames.Shop, {
            showLoading: true,   // 显示等待视图
            clickToClose: false, // 禁止点击遮罩关闭
            args: {
                category: 'weapons',
                highlight: 'sword'
            }
        });
        // 自定义动画效果在 ShopView 的 onEnterAnimation() 中定义
    }
}
```

### 初始化配置示例

```typescript
// 游戏启动时的 UI 配置
export class GameBootstrap {
    static async initialize(): Promise<void> {
        const uiManager = mf.gui;
        
        // 配置等待视图
        uiManager.setLoadingConfig({
            enabled: true,
            prefabPath: 'ui/loading',  // 使用自定义等待视图
            delay: 200,
            minShowTime: 500
        });
        
        // 配置遮罩
        uiManager.setMaskOptions({
            clickToClose: true,
            color: new Color(0, 0, 0, 150)
        });
        
        // 配置缓存策略
        uiManager.setCacheConfig({
            maxSize: 15,
            enableLRU: true
        });
        
        // 配置预加载
        uiManager.setPreloadConfig({
            views: [
                ViewNames.Home,
                ViewNames.Game,
                ViewNames.Shop,
                ViewNames.Settings
            ],
            delay: 2000  // 2秒后开始预加载
        });
        
        // 预加载关键视图
        await uiManager.preload([
            ViewNames.Home,
            ViewNames.Game
        ]);
        
        console.log('UI 系统初始化完成');
    }
}
```

### 性能监控示例

```typescript
// 性能监控工具
export class UIPerformanceMonitor {
    static logStats(): void {
        const stats = mf.gui.getCacheStats();
        console.log('=== UI 缓存统计 ===');
        console.log(`缓存大小: ${stats.size}/${stats.maxSize}`);
        console.log(`LRU 顺序: ${stats.lruOrder.join(' -> ')}`);
        console.log(`等待视图状态: ${mf.gui.isShowingLoading() ? '显示中' : '隐藏'}`);
        console.log(`当前打开视图数: ${mf.gui.getOpenViewCount()}`);
    }
    
    static checkLoadingStatus(viewKey: string): void {
        if (mf.gui.isLoading(viewKey)) {
            console.log(`${viewKey} 正在加载中...`);
        } else {
            console.log(`${viewKey} 未在加载`);
        }
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

5. **等待视图配置**：
   - 等待视图会在延迟时间后显示，避免闪烁
   - 最小显示时间确保用户能看到等待视图
   - 可以自定义等待视图预制体

6. **动画实现**：
   - 在 `onEnterAnimation()` 和 `onExitAnimation()` 中实现动画逻辑
   - 动画方法必须返回 `Promise<void>` 以确保正确的执行顺序
   - 避免同时播放过多动画，建议保持动画时长在 200-500ms
   - 复杂动画可能影响性能，建议使用简单的缓动函数

7. **缓存管理**：
   - LRU 策略会自动清理最少使用的视图
   - 定期检查缓存统计，避免内存泄漏
   - 预加载的视图不会立即显示

8. **并发控制**：
   - 同一视图多次打开会返回同一个 Promise
   - 使用 `isLoading()` 检查加载状态
   - 避免在加载中重复调用

## 最佳实践

### 1. 合理使用等待视图

```typescript
// ✅ 好的做法：重要界面使用等待视图
await mf.gui.open(ViewNames.Game, { showLoading: true });

// ✅ 好的做法：快速界面不使用等待视图
await mf.gui.open(ViewNames.Tooltip, { showLoading: false });

// ❌ 避免：所有界面都使用等待视图
await mf.gui.open(ViewNames.SmallDialog, { showLoading: true });
```

### 2. 优化动画使用

```typescript
// ✅ 好的做法：简单快速的动画（在视图类中实现）
@view('FastPopup')
@ccclass('FastPopupView')
export class FastPopupView extends BaseView {
    async onEnterAnimation(): Promise<void> {
        // 快速的缩放动画，200ms完成
        return new Promise<void>((resolve) => {
            tween(this.node)
                .to(0.2, { scale: new Vec3(1, 1, 1) }, { easing: 'quadOut' })
                .call(() => resolve())
                .start();
        });
    }
}

// ❌ 避免：过于复杂的动画（在视图类中实现）
@view('ComplexPopup')
@ccclass('ComplexPopupView')
export class ComplexPopupView extends BaseView {
    async onEnterAnimation(): Promise<void> {
        // 过于复杂的动画会影响性能
        return new Promise<void>((resolve) => {
            tween(this.node)
                .to(2.0, { scale: new Vec3(1, 1, 1) }, { easing: 'elasticOut' })
                .call(() => resolve())
                .start();
        });
    }
}
```

### 3. 合理配置缓存

```typescript
// ✅ 好的做法：根据设备性能配置
const isLowEndDevice = /* 检测设备性能 */;
mf.gui.setCacheConfig({
    maxSize: isLowEndDevice ? 5 : 15,
    enableLRU: true
});

// ❌ 避免：缓存过大导致内存问题
mf.gui.setCacheConfig({
    maxSize: 100,  // 太大了
    enableLRU: false  // 不启用 LRU
});
```

### 4. 预加载策略

```typescript
// ✅ 好的做法：预加载用户可能访问的界面
mf.gui.setPreloadConfig({
    views: [
        ViewNames.Home,      // 主界面
        ViewNames.Game,      // 游戏界面
        ViewNames.Shop       // 商店界面
    ],
    delay: 3000  // 游戏启动后 3 秒开始预加载
});

// ❌ 避免：预加载所有界面
mf.gui.setPreloadConfig({
    views: getAllViewNames(),  // 预加载所有界面
    delay: 0  // 立即预加载
});
```

### 5. 错误处理

```typescript
// ✅ 好的做法：处理 UI 打开失败
try {
    await mf.gui.open(ViewNames.Game);
} catch (error) {
    console.error('打开游戏界面失败:', error);
    // 显示错误提示或回退到其他界面
}

// ✅ 好的做法：检查加载状态
if (mf.gui.isLoading(ViewNames.Game)) {
    console.log('游戏界面正在加载，请稍候...');
    return;
}
```

### 6. 性能监控

```typescript
// ✅ 好的做法：定期检查性能
setInterval(() => {
    const stats = mf.gui.getCacheStats();
    if (stats.size > stats.maxSize * 0.8) {
        console.warn('UI 缓存使用率过高:', stats.size, '/', stats.maxSize);
    }
}, 30000);  // 每 30 秒检查一次
```

