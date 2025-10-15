# 最佳实践

## 设计原则

### 单一职责原则

每个 Manager/Model 只负责一个特定领域。

```typescript
// ✅ 好的设计
@manager('User')
export class UserManager extends AbstractManager {
    // 只处理用户相关逻辑
    login() {}
    logout() {}
    updateProfile() {}
}

@manager('Game')
export class GameManager extends AbstractManager {
    // 只处理游戏相关逻辑
    startGame() {}
    pauseGame() {}
    endGame() {}
}

// ❌ 不好的设计
@manager('App')
export class AppManager extends AbstractManager {
    // 包含了太多职责
    login() {}
    startGame() {}
    playAudio() {}
    saveData() {}
}
```

### 依赖注入

使用装饰器自动注入依赖，避免硬编码。

```typescript
// ✅ 好的方式：使用 Symbol
@manager('Game')
export class GameManager extends AbstractManager {
    initialize(): void {
        const userModel = this.getModel(ModelNames.User);
    }
}

// ❌ 不好的方式：直接 import 和实例化
import { UserModel } from '../models/UserModel';

@manager('Game')
export class GameManager extends AbstractManager {
    private userModel = new UserModel();  // ❌ 硬编码
}
```

### 事件驱动

通过事件系统实现模块解耦。

```typescript
// ✅ 好的方式：使用事件通信
@manager('Game')
export class GameManager extends AbstractManager {
    killEnemy(): void {
        // 处理击杀逻辑
        // 派发事件，其他模块可以监听
        this.getEventManager().dispatch('enemyKilled', { reward: 100 });
    }
}

@manager('Quest')
export class QuestManager extends AbstractManager {
    initialize(): void {
        // 监听事件
        this.getEventManager().on('enemyKilled', this.onEnemyKilled, this);
    }
    
    private onEnemyKilled(data: any): void {
        // 更新任务进度
    }
}

// ❌ 不好的方式：直接调用
@manager('Game')
export class GameManager extends AbstractManager {
    killEnemy(): void {
        // 直接获取并调用其他 Manager
        const questManager = this.getManager(ManagerNames.Quest);
        questManager.updateProgress();  // ❌ 紧耦合
    }
}
```

### 资源管理

使用 BaseView 自动管理资源生命周期。

```typescript
// ✅ 好的方式：使用 this.res
@view('Game')
export class GameView extends BaseView {
    onEnter(): void {
        this.res.loadSpriteFrame(this.sprite, 'textures/bg');
        // onDestroy 时自动释放
    }
}

// ❌ 不好的方式：手动管理
@view('Game')
export class GameView extends BaseView {
    private assets: any[] = [];
    
    onEnter(): void {
        const asset = await mf.res.loadSpriteFrame(this.sprite, 'textures/bg');
        this.assets.push(asset);
    }
    
    onDestroy(): void {
        // 容易忘记释放
        this.assets.forEach(asset => mf.res.release(asset));
    }
}
```

## 命名规范

### 类命名

- **Manager**: 以 `Manager` 结尾
- **Model**: 以 `Model` 结尾
- **View**: 以 `View` 结尾

```typescript
// ✅ 好的命名
GameManager
UserModel
HomeView

// ❌ 不好的命名
Game
User
Home
```

### 装饰器名称

使用简短清晰的名称。

```typescript
// ✅ 好的命名
@manager('Game')
@model('User')
@view('Home')

// ❌ 不好的命名
@manager('GameManager')  // 重复
@model('user_model')     // 不符合规范
@view('home_view_ui')    // 太长
```

### 事件命名

使用动词 + 名词的形式。

```typescript
// ✅ 好的命名
'gameStart'
'userLogin'
'scoreChanged'
'itemCollected'

// ❌ 不好的命名
'start'      // 太简单
'login'      // 不够明确
'change'     // 不知道什么改变了
```

## 项目结构

推荐的项目结构：

```
assets/scripts/
├── GameCore.ts           # 游戏入口
├── managers/             # 业务管理器
│   ├── GameManager.ts
│   ├── AudioManager.ts
│   └── NetworkManager.ts
├── models/               # 数据模型
│   ├── UserModel.ts
│   ├── ConfigModel.ts
│   └── InventoryModel.ts
├── views/                # UI 视图
│   ├── HomeView.ts
│   ├── BattleView.ts
│   └── SettingsView.ts
├── components/           # 可复用组件
│   ├── ItemSlot.ts
│   └── HealthBar.ts
├── utils/                # 工具函数
│   ├── MathUtil.ts
│   └── StringUtil.ts
└── types/                # 类型定义
    └── core-types.d.ts
```

## 代码组织

### Manager 组织

```typescript
@manager('Game')
export class GameManager extends AbstractManager {
    // 1. 私有属性
    private isPlaying: boolean = false;
    private enemyCount: number = 0;
    
    // 2. 生命周期方法
    initialize(): void {
        this.setupEventListeners();
    }
    
    dispose(): void {
        this.cleanup();
    }
    
    // 3. 公共方法
    startGame(): void {}
    pauseGame(): void {}
    endGame(): void {}
    
    // 4. 私有方法
    private setupEventListeners(): void {}
    private cleanup(): void {}
}
```

### View 组织

```typescript
@view('Game')
@ccclass('GameView')
export class GameView extends BaseView {
    // 1. 组件引用
    @property(Label)
    scoreLabel: Label = null!;
    
    // 2. 私有属性
    private gameManager: GameManager = null!;
    
    // 3. 生命周期方法
    onEnter(args?: any): void {
        this.setupUI();
        this.setupEventListeners();
    }
    
    onExit(): void {}
    onPause(): void {}
    onResume(): void {}
    
    // 4. UI 设置方法
    private setupUI(): void {}
    
    // 5. 事件处理方法
    private setupEventListeners(): void {}
    private onButtonClick(): void {}
    
    // 6. 私有方法
    private updateUI(): void {}
}
```

## 性能优化

### 1. 避免频繁的 getModel/getManager

```typescript
// ✅ 好的方式：缓存引用
@manager('Game')
export class GameManager extends AbstractManager {
    private userModel: UserModel = null!;
    
    initialize(): void {
        this.userModel = this.getModel(ModelNames.User);
    }
    
    someMethod(): void {
        // 直接使用缓存的引用
        this.userModel.name;
    }
}

// ❌ 不好的方式：每次都获取
@manager('Game')
export class GameManager extends AbstractManager {
    someMethod(): void {
        // 每次都调用 getModel
        this.getModel(ModelNames.User).name;
    }
}
```

### 2. 合理使用事件监听

```typescript
// ✅ 好的方式：及时清理
@manager('Game')
export class GameManager extends AbstractManager {
    initialize(): void {
        this.getEventManager().on('test', this.onTest, this);
    }
    
    dispose(): void {
        this.getEventManager().offAll(undefined, this);
    }
}

// ❌ 不好的方式：不清理
@manager('Game')
export class GameManager extends AbstractManager {
    initialize(): void {
        this.getEventManager().on('test', this.onTest, this);
    }
    // 忘记清理，造成内存泄漏
}
```

### 3. 资源预加载

```typescript
// ✅ 好的方式：预加载常用资源
@manager('Resource')
export class ResourceManager extends AbstractManager {
    async initialize(): Promise<void> {
        // 预加载公共资源
        await Promise.all([
            mf.res.loadPrefab('prefabs/common-ui'),
            mf.res.loadAsset('textures/atlas', cc.SpriteAtlas)
        ]);
    }
}

// 使用时直接获取，无需等待
const prefab = await mf.res.loadPrefab('prefabs/common-ui');  // 立即返回
```

### 4. 批量操作

```typescript
// ✅ 好的方式：批量处理
private updateItems(items: Item[]): void {
    items.forEach(item => {
        // 批量处理
    });
    // 一次性更新 UI
    this.updateUI();
}

// ❌ 不好的方式：逐个处理
private updateItems(items: Item[]): void {
    items.forEach(item => {
        // 每次都更新 UI
        this.updateUI();  // ❌ 频繁更新
    });
}
```

## 错误处理

### 1. 异步操作错误处理

```typescript
// ✅ 好的方式
async loadData(): Promise<void> {
    try {
        const data = await mf.http.get('/api/data');
        this.processData(data);
    } catch (error) {
        console.error('加载数据失败:', error);
        // 显示错误提示
        mf.gui.open(ViewNames.ErrorDialog, { error });
    }
}
```

### 2. 资源加载错误处理

```typescript
// ✅ 好的方式
async loadAssets(): Promise<void> {
    try {
        const prefab = await mf.res.loadPrefab('prefabs/item');
        return prefab;
    } catch (error) {
        console.error('资源加载失败:', error);
        // 使用默认资源
        return await mf.res.loadPrefab('prefabs/default');
    }
}
```

## 调试技巧

### 1. 使用日志

```typescript
@manager('Game')
export class GameManager extends AbstractManager {
    startGame(): void {
        console.log('[GameManager] 游戏开始');
        // ...
    }
}
```

### 2. 监控所有事件

```typescript
// 开发环境下监听所有事件
if (CC_DEV) {
    mf.event.on('*', (eventName, ...args) => {
        console.log(`[Event] ${eventName}`, args);
    });
}
```

### 3. 内存监控

```typescript
// 定期检查内存使用
if (CC_DEV) {
    setInterval(() => {
        console.log('资源数量:', cc.assetManager.assets.count);
    }, 5000);
}
```

## 注意事项

### ⚠️ 避免循环依赖

```typescript
// ❌ 不好：循环依赖
@manager('A')
export class AManager extends AbstractManager {
    initialize(): void {
        const b = this.getManager(ManagerNames.B);
        b.doSomething();
    }
}

@manager('B')
export class BManager extends AbstractManager {
    initialize(): void {
        const a = this.getManager(ManagerNames.A);
        a.doSomething();  // ❌ 循环依赖
    }
}

// ✅ 好：使用事件解耦
@manager('A')
export class AManager extends AbstractManager {
    initialize(): void {
        this.getEventManager().dispatch('aReady');
    }
}

@manager('B')
export class BManager extends AbstractManager {
    initialize(): void {
        this.getEventManager().on('aReady', () => {
            // 响应事件
        });
    }
}
```

### ⚠️ 异步操作注意

```typescript
// ✅ 好的方式：使用 await
async onStartClick(): Promise<void> {
    mf.gui.close(ViewNames.Home);
    await mf.gui.open(ViewNames.Game);  // 等待打开完成
    // 继续后续操作
}

// ❌ 不好的方式：不等待
onStartClick(): void {
    mf.gui.close(ViewNames.Home);
    mf.gui.open(ViewNames.Game);  // 不等待
    // 可能出现时序问题
}
```

### ⚠️ WebSocket 连接管理

```typescript
// ✅ 好的方式：场景切换时断开
@manager('Network')
export class NetworkManager extends AbstractManager {
    dispose(): void {
        mf.socket.disconnect();
    }
}

// ❌ 不好的方式：不断开连接
// 可能导致内存泄漏
```

### ⚠️ 事件清理

```typescript
// ✅ 好的方式：View 使用 this.event
@view('Game')
export class GameView extends BaseView {
    onEnter(): void {
        this.event.on('test', this.onTest, this);  // 自动清理
    }
}

// ⚠️ 注意：Manager 需要手动清理
@manager('Game')
export class GameManager extends AbstractManager {
    dispose(): void {
        this.getEventManager().offAll(undefined, this);  // 手动清理
    }
}
```

## 总结

遵循这些最佳实践，可以让你的代码：
- ✅ 结构清晰
- ✅ 易于维护
- ✅ 性能良好
- ✅ 不易出错

