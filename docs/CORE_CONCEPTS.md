# 核心概念

## 架构图

```
┌─────────────────────────────────────────────────┐
│                    全局对象 mf                    │
│  (统一访问入口，暴露所有框架能力)                   │
└──────────────────┬──────────────────────────────┘
                   │
    ┌──────────────┼──────────────┐
    │              │              │
    ▼              ▼              ▼
┌─────────┐  ┌──────────┐  ┌──────────┐
│  Core   │  │ Services │  │  Views   │
│(核心容器)│  │(基础服务) │  │ (UI界面)  │
└─────────┘  └──────────┘  └──────────┘
    │              │              │
    ├─ Manager ─┐  ├─ UIManager  ├─ BaseView
    │           │  ├─ ResLoader  └─ 自动资源管理
    ├─ Model ───┤  ├─ EventMgr     自动事件清理
    │           │  ├─ HttpMgr
    └─ Symbol ──┘  ├─ SocketMgr
       映射系统    └─ RedDotMgr
```

## Core 核心容器

`Core` 是框架的核心，负责管理所有 Manager 和 Model 实例。

**核心职责：**
- 注册和实例化 Manager
- 注册和实例化 Model
- 提供统一的访问接口
- 自动调用初始化方法

**使用方式：**

```typescript
// 获取 Manager
const gameManager = mf.core.getManager(ManagerNames.GameManager);

// 获取 Model
const userModel = mf.core.getModel(ModelNames.UserModel);
```

## ServiceLocator 服务定位器

`ServiceLocator` 用于管理跨领域的基础服务，实现解耦。

**内置服务：**
- `core` - Core 实例
- `EventManager` - 事件管理器
- `UIManager` - UI 管理器
- `ResLoader` - 资源加载器
- `HttpManager` - HTTP 管理器
- `WebSocketManager` - WebSocket 管理器
- `RedDotManager` - 红点管理器

**自定义服务：**

```typescript
import { ServiceLocator } from 'dzkcc-mflow/core';

// 注册服务
ServiceLocator.regService('MyService', new MyService());

// 获取服务
const myService = ServiceLocator.getService<MyService>('MyService');

// 移除服务
ServiceLocator.remove('MyService');
```

## Manager 管理器

Manager 负责处理特定领域的业务逻辑。

**基类：** `AbstractManager`

**生命周期：**
1. `initialize()` - 在注册时被调用
2. `dispose()` - 在销毁时被调用

**内置能力：**
- 获取 Model：`this.getModel(modelSymbol)`
- 获取事件管理器：`this.getEventManager()`
- 获取 HTTP 管理器：`this.getHttpManager()`
- 获取 WebSocket 管理器：`this.getWebSocketManager()`

**示例：**

```typescript
import { manager, AbstractManager, ModelNames } from 'dzkcc-mflow/core';

@manager('Game')
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
```

## Model 数据模型

Model 用于数据管理，遵循单一职责原则。

**接口：** `IModel`

**生命周期：**
- `initialize()` - 在注册时被调用

**示例：**

```typescript
import { model, IModel } from 'dzkcc-mflow/core';

@model('User')
export class UserModel implements IModel {
    private _name: string = '';
    private _level: number = 1;
    
    initialize(): void {
        console.log('UserModel 初始化');
    }
    
    get name(): string {
        return this._name;
    }
    
    set name(value: string) {
        this._name = value;
    }
    
    levelUp(): void {
        this._level++;
    }
}
```

## View 视图

View 是 UI 界面的基类，提供完整的生命周期管理。

**基类：** `BaseView`

**生命周期：**
1. `onEnter(args?)` - 界面打开时调用
2. `onPause()` - 界面被覆盖时调用（栈模式）
3. `onResume()` - 界面恢复显示时调用（栈模式）
4. `onExit()` - 界面关闭时调用（自动清理事件）
5. `onDestroy()` - 界面销毁时调用（自动释放资源）

**内置能力：**
- 自动事件管理：通过 `this.event` 监听的事件会自动清理
- 自动资源管理：通过 `this.res` 加载的资源会自动释放
- 获取 Manager：`this.getManager(managerSymbol)`
- 获取 Model：`this.getModel(modelSymbol)`

**示例：**

```typescript
import { view, ViewNames, ManagerNames } from 'dzkcc-mflow/core';
import { BaseView } from 'dzkcc-mflow/libs';
import { _decorator, Label } from 'cc';

const { ccclass, property } = _decorator;

@view('Game')
@ccclass('GameView')
export class GameView extends BaseView {
    @property(Label)
    scoreLabel: Label = null!;
    
    onEnter(args?: any): void {
        // 监听事件（自动清理）
        this.event.on('scoreChanged', this.onScoreChanged, this);
        
        // 获取 Manager
        const gameManager = this.getManager(ManagerNames.Game);
    }
    
    onExit(): void {
        // 事件监听会自动清理，无需手动 off
    }
    
    onPause(): void {}
    onResume(): void {}
    
    private onScoreChanged(score: number): void {
        this.scoreLabel.string = `分数: ${score}`;
    }
}
```

## Symbol 映射系统

框架使用 Symbol 作为标识符，配合 Names 对象实现类型安全和代码补全。

**三种 Names 对象：**
- `ModelNames` - Model 的 Symbol 映射
- `ManagerNames` - Manager 的 Symbol 映射
- `ViewNames` - View 的 Symbol 映射

**优势：**
- ✅ IDE 代码补全
- ✅ 类型安全
- ✅ 避免字符串拼写错误
- ✅ 便于重构

**示例：**

```typescript
// 装饰器注册后，Names 对象会自动添加属性
ManagerNames.Game      // Symbol('Game')
ModelNames.User        // Symbol('User')
ViewNames.Home         // Symbol('Home')
```

