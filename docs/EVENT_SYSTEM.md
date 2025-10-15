# 事件系统

框架提供了强大的事件广播和监听机制，基于 `Broadcaster` 实现。

## 基本用法

```typescript
// 监听事件
mf.event.on('gameStart', (data) => {
    console.log('游戏开始', data);
});

// 派发事件
mf.event.dispatch('gameStart', { level: 1 });

// 一次性监听
mf.event.once('gameOver', (score) => {
    console.log('游戏结束，分数:', score);
});

// 移除监听
const handler = (data) => console.log(data);
mf.event.on('test', handler);
mf.event.off('test', handler);

// 移除所有监听
mf.event.offAll('test');
```

## 粘性事件

粘性事件会保存最后一次派发的数据，新的监听者会立即收到。

```typescript
// 派发粘性事件
mf.event.dispatchSticky('userLogin', { userId: 123, name: 'Alice' });

// 即使在派发之后才监听，也能立即收到数据
setTimeout(() => {
    mf.event.on('userLogin', (userData) => {
        console.log('用户登录信息:', userData);  // 立即触发
    });
}, 1000);

// 移除粘性事件
mf.event.removeStickyBroadcast('userLogin');
```

### 应用场景

粘性事件适用于：
- 用户登录状态
- 配置信息加载完成
- 关键初始化完成的标记

```typescript
// 登录成功后派发粘性事件
mf.event.dispatchSticky('userLoggedIn', { userId: 123, token: 'xxx' });

// 任何时候监听都能获取到登录信息
// 即使在登录之后才注册的模块也能收到
mf.event.on('userLoggedIn', (userData) => {
    console.log('用户已登录:', userData);
});
```

## 在 View 中使用事件

`BaseView` 提供了自动清理的事件监听：

```typescript
@view('Game')
@ccclass('GameView')
export class GameView extends BaseView {
    onEnter(): void {
        // 使用 this.event 监听，会在 onExit 时自动清理
        this.event.on('scoreChanged', this.updateScore, this);
        this.event.on('levelUp', this.onLevelUp, this);
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
}
```

## 在 Manager 中使用事件

```typescript
@manager('Game')
export class GameManager extends AbstractManager {
    private score: number = 0;
    
    initialize(): void {
        // 在 Manager 中获取事件管理器
        const eventMgr = this.getEventManager();
        
        eventMgr.on('enemyKilled', this.onEnemyKilled, this);
    }
    
    addScore(value: number): void {
        this.score += value;
        // 派发事件
        this.getEventManager().dispatch('scoreChanged', this.score);
    }
    
    private onEnemyKilled(enemyData: any): void {
        this.addScore(enemyData.reward);
    }
    
    dispose(): void {
        // Manager 销毁时清理事件监听
        this.getEventManager().offAll(undefined, this);
    }
}
```

## 带回调的事件

事件支持回调机制，用于双向通信：

```typescript
// 监听事件并提供回调
mf.event.on('requestData', (params, callback) => {
    const result = fetchData(params);
    callback?.(result);  // 回调返回结果
});

// 派发事件并接收回调
mf.event.dispatch('requestData', { id: 123 }, (result) => {
    console.log('收到结果:', result);
});
```

### 应用场景

```typescript
// 场景：请求数据
// 监听方
@manager('Data')
export class DataManager extends AbstractManager {
    initialize(): void {
        this.getEventManager().on('getUserInfo', this.handleGetUserInfo, this);
    }
    
    private handleGetUserInfo(userId: number, callback?: Function): void {
        // 获取用户信息
        const userInfo = this.fetchUserInfo(userId);
        // 通过回调返回
        callback?.(userInfo);
    }
}

// 请求方
@view('Profile')
export class ProfileView extends BaseView {
    onEnter(): void {
        // 请求数据并接收回调
        this.event.dispatch('getUserInfo', 123, (userInfo) => {
            console.log('用户信息:', userInfo);
            this.updateUI(userInfo);
        });
    }
}
```

## 类型安全的事件（可选）

可以扩展 `IEventMsgKey` 接口实现类型安全：

```typescript
// 定义事件消息键类型
declare module 'dzkcc-mflow/core' {
    interface IEventMsgKey {
        'gameStart': { level: number };
        'scoreChanged': number;
        'userLogin': { userId: number; name: string };
    }
}

// 现在事件会有类型提示
mf.event.dispatch('scoreChanged', 100);  // ✅ 正确
mf.event.dispatch('scoreChanged', 'abc');  // ❌ 类型错误
```

### 完整示例

```typescript
// types/event-types.d.ts
import 'dzkcc-mflow/core';

declare module 'dzkcc-mflow/core' {
    interface IEventMsgKey {
        // 游戏事件
        'gameStart': { level: number; difficulty: string };
        'gameOver': { score: number; time: number };
        'scoreChan ged': number;
        'levelUp': { newLevel: number };
        
        // 用户事件
        'userLogin': { userId: number; name: string; token: string };
        'userLogout': void;
        
        // UI 事件
        'showDialog': { title: string; content: string };
        'closeDialog': void;
    }
}

// 使用时有类型检查和代码补全
mf.event.dispatch('gameStart', { level: 1, difficulty: 'hard' });  // ✅
mf.event.dispatch('gameStart', { level: 1 });  // ❌ 缺少 difficulty
mf.event.dispatch('scoreChanged', 100);  // ✅
mf.event.dispatch('scoreChanged', '100');  // ❌ 类型错误
```

## 事件命名规范

推荐的事件命名规范：

```typescript
// ✅ 推荐：使用动词 + 名词
'gameStart'      // 游戏开始
'scoreChanged'   // 分数改变
'userLogin'      // 用户登录
'itemCollected'  // 物品收集

// ✅ 推荐：使用命名空间
'game:start'
'user:login'
'ui:show'

// ❌ 不推荐：过于简单
'start'
'login'
'show'
```

## 常见模式

### 模式 1：数据变化通知

```typescript
// Model 数据变化时通知
@model('Score')
export class ScoreModel implements IModel {
    private _score: number = 0;
    
    get score(): number {
        return this._score;
    }
    
    addScore(value: number): void {
        this._score += value;
        // 通知分数变化
        mf.event.dispatch('scoreChanged', this._score);
    }
}

// View 监听数据变化
@view('HUD')
export class HUDView extends BaseView {
    onEnter(): void {
        this.event.on('scoreChanged', (score) => {
            this.scoreLabel.string = `${score}`;
        });
    }
}
```

### 模式 2：跨模块通信

```typescript
// Manager A 派发事件
@manager('Battle')
export class BattleManager extends AbstractManager {
    enemyKilled(): void {
        this.getEventManager().dispatch('enemyKilled', {
            enemyId: 123,
            reward: 100
        });
    }
}

// Manager B 监听事件
@manager('Quest')
export class QuestManager extends AbstractManager {
    initialize(): void {
        this.getEventManager().on('enemyKilled', this.onEnemyKilled, this);
    }
    
    private onEnemyKilled(data: any): void {
        // 更新任务进度
        this.updateQuestProgress(data.enemyId);
    }
}
```

### 模式 3：生命周期事件

```typescript
// 派发生命周期事件
@manager('Game')
export class GameManager extends AbstractManager {
    startGame(): void {
        this.getEventManager().dispatch('game:beforeStart');
        // 游戏初始化
        this.getEventManager().dispatch('game:started');
    }
    
    endGame(): void {
        this.getEventManager().dispatch('game:beforeEnd');
        // 游戏清理
        this.getEventManager().dispatch('game:ended');
    }
}

// 多个模块监听生命周期
@manager('Audio')
export class AudioManager extends AbstractManager {
    initialize(): void {
        const event = this.getEventManager();
        event.on('game:started', () => this.playBGM());
        event.on('game:ended', () => this.stopBGM());
    }
}
```

## 注意事项

1. **避免过度使用**：
   - 事件适用于松耦合的模块间通信
   - 紧密关联的模块可以直接调用

2. **事件清理**：
   - View 中使用 `this.event` 会自动清理
   - Manager 中需要在 `dispose()` 中手动清理
   - 避免内存泄漏

3. **循环依赖**：
   - 避免 A 监听 B 的事件，B 又监听 A 的事件
   - 可能导致无限循环

4. **调试技巧**：
   ```typescript
   // 打印所有事件
   mf.event.on('*', (eventName, ...args) => {
       console.log('Event:', eventName, args);
   });
   ```

