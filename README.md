# Modular Flow Framework

一个专为 Cocos Creator 引擎开发的模块化设计与流程管理框架。
- github地址：https://github.com/duanzhk/cocos-modular-flow-framework

## 📚 目录

- [1. 框架概述](#1-框架概述)
- [2. 快速开始](#2-快速开始)
- [3. 核心概念](#3-核心概念)
- [4. 装饰器系统](#4-装饰器系统)
- [5. UI 系统](#5-ui-系统)
- [6. 事件系统](#6-事件系统)
- [7. 资源管理](#7-资源管理)
- [8. 网络通信](#8-网络通信)
- [9. 红点系统](#9-红点系统)
- [10. 开发工具](#10-开发工具)
- [11. 完整示例](#11-完整示例)
- [12. 最佳实践](#12-最佳实践)

---

## 1. 框架概述

### 1.1 简介

Modular Flow Framework (MF) 是一个为 Cocos Creator 引擎开发的模块化设计和流程管理框架。该框架旨在提供解耦和依赖注入的能力，帮助开发者构建更加清晰、可维护的游戏项目。

### 1.2 核心特性

✨ **模块化设计** - 通过 Manager 和 Model 模式实现业务逻辑的模块化管理  
✨ **依赖注入** - 基于装饰器的自动依赖注入和 Symbol 映射  
✨ **服务定位器** - 统一的服务管理机制，实现服务解耦  
✨ **UI 管理系统** - 完整的 UI 界面管理方案，支持视图栈和分组  
✨ **事件系统** - 强大的事件广播和监听机制，支持粘性事件  
✨ **资源加载系统** - 统一的资源加载和自动释放管理  
✨ **HTTP 网络** - 简洁易用的 HTTP 客户端，支持 RESTful API  
✨ **WebSocket 实时通信** - 支持自动重连、心跳检测的 WebSocket 客户端  
✨ **红点系统** - 树形结构的红点提示管理系统  
✨ **开发工具** - 配套的 Cocos Creator 编辑器插件

### 1.3 安装

创建自己的cocos项目，在项目根目录执行如下命令：

```bash
npm i dzkcc-mflow@beta
```
安装完成后，修改自己项目的tsconfig.json，关键添加内容 **"dzkcc-mflow/*": ["./node_modules/dzkcc-mflow/dist/*"]**
```
{
  /* Base configuration. Do not edit this field. */
  "extends": "./temp/tsconfig.cocos.json",

  /* Add your custom configuration here. */
  "compilerOptions": {
    "strict": false,
    "paths": {
      "dzkcc-mflow/*": ["./node_modules/dzkcc-mflow/dist/*"] //cocos不解析，仅为了vscode提示
    }
  }
}
```

之后，**重启 Cocos Creator 编辑器**，框架会自动安装配套的编辑器插件。

---

## 2. 快速开始

### 2.1 创建 Core 入口

在项目中创建一个继承自 `CocosCore` 的类：

```typescript
// GameCore.ts
import { CocosCore } from 'dzkcc-mflow/libs';
import { _decorator } from 'cc';

const { ccclass } = _decorator;

@ccclass('GameCore')
export class GameCore extends CocosCore {
    // CocosCore 会自动初始化框架
}
```

### 2.2 挂载到场景

1. 在 Cocos Creator 编辑器中打开主场景
2. 在 Canvas 节点上添加 `GameCore` 组件
3. 保存场景


### 2.3 使用全局对象

框架提供了全局对象 `mf`（Modular Flow 的缩写）用于访问框架功能：

```typescript
// 访问 Manager
const gameManager = mf.core.getManager(ManagerNames.GameManager);

// 访问 Model
const userModel = mf.core.getModel(ModelNames.UserModel);

// 打开 UI
await mf.gui.open(ViewNames.HomeView);

// 发送事件
mf.event.dispatch('gameStart');

// 加载资源
const prefab = await mf.res.loadPrefab('prefabs/player');

// HTTP 请求
const data = await mf.http.get('/api/user/profile');

// WebSocket 连接
mf.socket.connect('wss://game-server.com/ws');

// 红点提示
mf.reddot.setCount('main/bag', 5);
```

## 3. 核心概念

### 3.1 架构图

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

### 3.2 Core 核心容器

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

### 3.3 ServiceLocator 服务定位器

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

### 3.4 Manager 管理器

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

### 3.5 Model 数据模型

Model 用于数据管理，遵循单一职责原则。

**接口：** `IModel`

**生命周期：**
- `initialize()` - 在注册时被调用

### 3.6 View 视图

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

### 3.7 Symbol 映射系统

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

## 4. 装饰器系统

框架提供了三个核心装饰器，用于注册 Manager、Model 和 View。

### 4.1 @manager() - Manager 装饰器

用于注册 Manager 到全局注册表。

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
const gameManager = mf.core.getManager(ManagerNames.Game);
gameManager.addScore(10);
```

### 4.2 @model() - Model 装饰器

用于注册 Model 到全局注册表。

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
const userModel = mf.core.getModel(ModelNames.User);
userModel.playerName = 'Alice';
userModel.levelUp();
```

### 4.3 @view() - View 装饰器

用于注册 View 到全局注册表，配合 `ViewNames` 使用。

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

// 使用 - 通过 Symbol 打开视图
await mf.gui.open(ViewNames.Home, { userId: 123 });

// 关闭视图
mf.gui.close(ViewNames.Home);  // 关闭但保留缓存
mf.gui.close(ViewNames.Home, true);  // 关闭并销毁
```

### 4.4 装饰器参数

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

### 4.5 Names 对象代码补全

装饰器注册后，对应的 Names 对象会自动添加属性，IDE 会提供代码补全：

```typescript
// ManagerNames 自动包含所有注册的 Manager
ManagerNames.Game
ManagerNames.Player
ManagerNames.Audio

// ModelNames 自动包含所有注册的 Model
ModelNames.User
ModelNames.Inventory
ModelNames.Config

// ViewNames 自动包含所有注册的 View
ViewNames.Home
ViewNames.Game
ViewNames.Settings
```

---

## 5. UI 系统

### 5.1 BaseView 基础视图

所有 UI 界面都应该继承 `BaseView` 类。

**核心特性：**
- ✅ 自动事件管理 - `this.event` 监听的事件会自动清理
- ✅ 自动资源管理 - `this.res` 加载的资源会自动释放
- ✅ 生命周期方法 - 完整的生命周期钩子
- ✅ 内置访问能力 - 可直接获取 Manager 和 Model

**基本用法：**

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

### 5.2 UIManager 界面管理器

通过 `mf.gui` 访问 UI 管理功能。

**基本操作：**

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

### 5.3 视图栈管理

支持分组的视图栈，适用于关卡、向导等场景。

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

### 5.4 视图生命周期详解

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

### 5.5 Prefab 路径配置

视图需要配置 Prefab 路径，框架提供了开发工具自动生成。

**手动配置方式：**

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

**推荐：使用开发工具自动生成**（见第 10 章）

---

## 6. 事件系统

框架提供了强大的事件广播和监听机制，基于 `Broadcaster` 实现。

### 6.1 基本用法

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

### 6.2 粘性事件

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

### 6.3 在 View 中使用事件

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

### 6.4 在 Manager 中使用事件

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

### 6.5 带回调的事件

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

### 6.6 类型安全的事件（可选）

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

---

## 7. 资源管理

框架提供了统一的资源加载和释放管理，通过 `mf.res` 访问。

### 7.1 基本用法

```typescript
import { Prefab, SpriteFrame } from 'cc';

// 加载 Prefab
const prefab = await mf.res.loadPrefab('prefabs/enemy');
const node = instantiate(prefab);

// 加载 SpriteFrame（自动设置到 Sprite 组件）
const sprite = this.node.getComponent(Sprite)!;
await mf.res.loadSpriteFrame(sprite, 'textures/player');

// 加载 Spine 动画（自动设置到 Skeleton 组件）
const skeleton = this.node.getComponent(sp.Skeleton)!;
await mf.res.loadSpine(skeleton, 'spine/hero');

// 加载通用资源
const asset = await mf.res.loadAsset('path/to/asset', AssetType);
```

### 7.2 释放资源

```typescript
// 通过路径释放
mf.res.release('prefabs/enemy', Prefab);

// 通过资源对象释放
mf.res.release(asset);

// 强制释放（立即销毁，不管引用计数）
mf.res.release(asset, true);
```

### 7.3 在 View 中自动管理资源

`BaseView` 提供了自动资源管理：

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
    }
    
    // 界面销毁时，所有通过 this.res 加载的资源会自动释放
}
```

### 7.4 Bundle 资源包

支持从不同的 Bundle 加载资源：

```typescript
// 从 resources Bundle 加载（默认）
await mf.res.loadPrefab('prefabs/ui');

// 从自定义 Bundle 加载
await mf.res.loadPrefab('prefabs/level1', 'game-bundle');

// 加载 SpriteFrame 从自定义 Bundle
await mf.res.loadSpriteFrame(sprite, 'textures/bg', 'ui-bundle');
```

### 7.5 资源引用计数

框架使用 Cocos Creator 的引用计数系统：

- `loadAsset()` 会自动 `addRef()`
- `release()` 会自动 `decRef()`
- 引用计数为 0 时自动销毁资源

```typescript
// 多次加载同一资源，共享同一实例，引用计数累加
const asset1 = await mf.res.loadPrefab('prefabs/common');  // refCount = 1
const asset2 = await mf.res.loadPrefab('prefabs/common');  // refCount = 2

// 释放资源，引用计数递减
mf.res.release(asset1);  // refCount = 1
mf.res.release(asset2);  // refCount = 0，资源被销毁
```

## 8. 网络通信

### 8.1 HTTP 请求

框架提供了简洁易用的 HTTP 客户端，通过 `mf.http` 访问。

**基本用法：**

```typescript
// GET 请求
const userData = await mf.http.get('/api/users/123');

// GET 请求带参数
const list = await mf.http.get('/api/users', { page: 1, size: 20 });

// POST 请求
const newUser = await mf.http.post('/api/users', {
    name: 'Alice',
    email: 'alice@example.com'
});

// PUT 请求
const updated = await mf.http.put('/api/users/123', {
    name: 'Alice Updated'
});

// DELETE 请求
await mf.http.delete('/api/users/123');

// 自定义请求
const result = await mf.http.request({
    url: '/api/upload',
    method: 'POST',
    data: formData,
    headers: {
        'Authorization': 'Bearer token123'
    },
    timeout: 30000
});
```

**在 Manager 中使用：**

```typescript
@manager('User')
export class UserManager extends AbstractManager {
    initialize(): void {}
    
    async login(username: string, password: string): Promise<any> {
        try {
            // 通过 getHttpManager() 获取 HTTP 管理器
            const result = await this.getHttpManager().post('/api/auth/login', {
                username,
                password
            });
            
            // 登录成功，派发事件
            this.getEventManager().dispatch('userLogin', result);
            return result;
        } catch (error) {
            console.error('登录失败:', error);
            throw error;
        }
    }
    
    async getUserProfile(userId: number): Promise<any> {
        const token = this.getAuthToken();
        return await this.getHttpManager().get(`/api/users/${userId}`, {}, {
            'Authorization': `Bearer ${token}`
        });
    }
    
    private getAuthToken(): string {
        // 从本地存储获取 token
        return localStorage.getItem('token') || '';
    }
}
```

### 8.2 WebSocket 实时通信

框架提供了功能完整的 WebSocket 客户端，支持自动重连、心跳检测等特性。

**基本用法：**

```typescript
// 连接服务器
mf.socket.connect('wss://game-server.com/ws');

// 配置连接参数
mf.socket.configure({
    reconnect: true,           // 启用自动重连
    reconnectInterval: 3000,   // 重连间隔 3 秒
    reconnectAttempts: 5,      // 最多重连 5 次
    heartbeat: true,           // 启用心跳
    heartbeatInterval: 30000,  // 心跳间隔 30 秒
    heartbeatMessage: 'ping'   // 心跳消息
});

// 监听事件
mf.socket.on('open', (event) => {
    console.log('WebSocket 连接成功');
});

mf.socket.on('message', (event) => {
    const data = JSON.parse(event.data);
    console.log('收到消息:', data);
});

mf.socket.on('error', (event) => {
    console.error('WebSocket 错误:', event);
});

mf.socket.on('close', (event) => {
    console.log('WebSocket 连接关闭');
});

// 发送消息
mf.socket.send({ type: 'move', x: 100, y: 200 });

// 检查连接状态
if (mf.socket.isConnected()) {
    console.log('已连接');
}

// 断开连接
mf.socket.disconnect();
```

**支持的数据类型：**

```typescript
// 1. JSON 对象（推荐）
mf.socket.send({ type: 'chat', message: 'Hello' });

// 2. 字符串
mf.socket.send('ping');

// 3. 二进制数据（ArrayBuffer）
const buffer = new ArrayBuffer(8);
const view = new DataView(buffer);
view.setInt32(0, 12345);
mf.socket.send(buffer);

// 4. Blob（文件数据）
const blob = new Blob(['data'], { type: 'text/plain' });
mf.socket.send(blob);
```

**在 Manager 中使用：**

```typescript
@manager('Network')
export class NetworkManager extends AbstractManager {
    initialize(): void {
        // 通过 getWebSocketManager() 获取 WebSocket 管理器
        const socket = this.getWebSocketManager();
        
        // 配置 WebSocket
        socket.configure({
            reconnect: true,
            reconnectInterval: 3000,
            reconnectAttempts: 10,
            heartbeat: true,
            heartbeatInterval: 30000
        });
        
        // 监听事件
        socket.on('open', this.onConnected.bind(this));
        socket.on('message', this.onMessage.bind(this));
        socket.on('error', this.onError.bind(this));
        socket.on('close', this.onClose.bind(this));
    }
    
    connect(token: string): void {
        const wsUrl = `wss://game-server.com/ws?token=${token}`;
        this.getWebSocketManager().connect(wsUrl);
    }
    
    sendGameAction(action: string, data: any): void {
        this.getWebSocketManager().send({
            type: action,
            data,
            timestamp: Date.now()
        });
    }
    
    private onConnected(event: Event): void {
        console.log('WebSocket 连接成功');
        this.getEventManager().dispatch('socketConnected');
    }
    
    private onMessage(event: MessageEvent): void {
        try {
            const data = JSON.parse(event.data);
            // 通过事件系统分发消息
            this.getEventManager().dispatch(`socket_${data.type}`, data);
        } catch (error) {
            console.error('解析消息失败:', error);
        }
    }
    
    private onError(event: Event): void {
        console.error('WebSocket 错误');
    }
    
    private onClose(event: CloseEvent): void {
        console.log('WebSocket 连接关闭');
        this.getEventManager().dispatch('socketClosed');
    }
    
    dispose(): void {
        this.getWebSocketManager().disconnect();
    }
}
```

## 9. 红点系统

框架提供了树形结构的红点提示管理系统，通过 `mf.reddot` 访问。

### 9.1 基本用法

```typescript
// 设置红点数量
mf.reddot.setCount('main/bag/weapon', 5);
mf.reddot.setCount('main/bag/armor', 3);
mf.reddot.setCount('main/mail', 10);

// 获取红点数量（包含子节点）
const weaponCount = mf.reddot.getCount('main/bag/weapon');  // 5
const bagCount = mf.reddot.getCount('main/bag');            // 8 (weapon + armor)
const mainCount = mf.reddot.getCount('main');                // 18 (bag + mail)

// 增加/减少红点数量
mf.reddot.addCount('main/bag/weapon', 2);   // 增加 2
mf.reddot.addCount('main/bag/weapon', -1);  // 减少 1

// 检查是否有红点
if (mf.reddot.hasRedDot('main/bag')) {
    console.log('背包有新物品');
}

// 清空红点
mf.reddot.clearRedDot('main/mail');
```

### 9.2 监听红点变化

```typescript
// 监听红点变化
mf.reddot.on('main/bag', (totalCount, selfCount) => {
    console.log(`背包红点: ${totalCount} (自身: ${selfCount})`);
    // 更新 UI 显示
});

// 移除监听
const handler = (total, self) => console.log(total, self);
mf.reddot.on('main/bag', handler);
mf.reddot.off('main/bag', handler);
```

### 9.3 在 View 中使用

```typescript
import { view, ViewNames } from 'dzkcc-mflow/core';
import { BaseView } from 'dzkcc-mflow/libs';
import { _decorator, Label } from 'cc';

const { ccclass, property } = _decorator;

@view('Main')
@ccclass('MainView')
export class MainView extends BaseView {
    @property(Label)
    bagRedDot: Label = null!;
    
    @property(Label)
    mailRedDot: Label = null!;
    
    onEnter(): void {
        // 监听红点变化
        mf.reddot.on('main/bag', this.updateBagRedDot.bind(this));
        mf.reddot.on('main/mail', this.updateMailRedDot.bind(this));
    }
    
    onExit(): void {
        // 移除监听
        mf.reddot.off('main/bag', this.updateBagRedDot.bind(this));
        mf.reddot.off('main/mail', this.updateMailRedDot.bind(this));
    }
    
    private updateBagRedDot(totalCount: number): void {
        this.bagRedDot.string = totalCount > 0 ? totalCount.toString() : '';
        this.bagRedDot.node.active = totalCount > 0;
    }
    
    private updateMailRedDot(totalCount: number): void {
        this.mailRedDot.string = totalCount > 0 ? totalCount.toString() : '';
        this.mailRedDot.node.active = totalCount > 0;
    }
    
    onPause(): void {}
    onResume(): void {}
}
```

### 9.4 红点路径规则

红点系统使用树形结构，路径使用 `/` 分隔：

```
main
├── bag
│   ├── weapon
│   ├── armor
│   └── consumable
├── mail
│   ├── system
│   └── friend
└── quest
    ├── main
    └── daily
```

**特性：**
- 子节点的红点会自动累加到父节点
- 支持任意深度的树形结构
- 路径大小写敏感

---

## 10. 开发工具

框架配套了 Cocos Creator 编辑器插件 `mflow-tools`，用于提升开发效率。

### 10.1 功能特性

✨ **自动生成 UI 脚本** - 根据 Prefab 自动生成基础视图类  
✨ **自动引用组件** - 自动设置 `@property` 引用  
✨ **自动挂载脚本** - 自动将脚本挂载到 Prefab  
✨ **命名约定识别** - 通过节点命名自动识别组件类型  

### 10.2 命名约定

在 Prefab 中，将需要引用的节点重命名为 `#属性名#组件类型` 格式：

```
#titleLabel#Label      -> 引用 Label 组件
#closeButton#Button    -> 引用 Button 组件
#avatarSprite#Sprite   -> 引用 Sprite 组件
#contentNode           -> 引用 Node 节点（省略组件类型）
#listView#ScrollView   -> 引用 ScrollView 组件
```

### 10.3 使用方法

1. **设置节点命名**

在 Cocos Creator 编辑器中创建 Prefab，将需要引用的节点按照命名约定重命名：

![节点命名示例]
```
HomeView (Prefab 根节点)
├── #titleLabel#Label
├── #contentNode
│   ├── #avatarSprite#Sprite
│   └── #nameLabel#Label
└── #closeButton#Button
```

2. **导出脚本**

在 Hierarchy 面板中右键点击 Prefab 根节点，选择 **"MFlow Tools → 导出到脚本"**

3. **自动生成**

插件会自动生成两个文件：

**BaseHomeView.ts**（基础类，由工具生成，不要手动修改）
```typescript
import { _decorator, Label, Node, Sprite, Button } from 'cc';
import { BaseView } from 'dzkcc-mflow/libs';

const { ccclass, property } = _decorator;

@ccclass('BaseHomeView')
export abstract class BaseHomeView extends BaseView {
    /** @internal */
    private static readonly __path__: string = 'ui/home';
    
    @property(Label) titleLabel: Label = null!;
    @property(Node) contentNode: Node = null!;
    @property(Sprite) avatarSprite: Sprite = null!;
    @property(Label) nameLabel: Label = null!;
    @property(Button) closeButton: Button = null!;
    
    // 抽象方法由子类实现
    abstract onEnter(args?: any): void;
    abstract onExit(): void;
    abstract onPause(): void;
    abstract onResume(): void;
}
```

**HomeView.ts**（业务类，手动实现业务逻辑）
```typescript
import { _decorator } from 'cc';
import { BaseHomeView } from './BaseHomeView';
import { view } from 'dzkcc-mflow/core';

const { ccclass } = _decorator;

@view('Home')
@ccclass('HomeView')
export class HomeView extends BaseHomeView {
    onEnter(args?: any): void {
        // 实现业务逻辑
    }
    
    onExit(): void {}
    onPause(): void {}
    onResume(): void {}
}
```

4. **脚本自动挂载**

插件会自动将生成的脚本挂载到 Prefab 上，并设置好所有组件引用。

---

## 11. 完整示例

下面是一个简单的塔防游戏示例，展示框架的完整使用流程。

### 11.1 项目结构

```
assets/
├── scripts/
│   ├── GameCore.ts              # 游戏入口
│   ├── managers/
│   │   ├── GameManager.ts       # 游戏管理器
│   │   ├── EnemyManager.ts      # 敌人管理器
│   │   └── TowerManager.ts      # 塔管理器
│   ├── models/
│   │   ├── GameModel.ts         # 游戏数据模型
│   │   └── PlayerModel.ts       # 玩家数据模型
│   └── views/
│       ├── HomeView.ts          # 主界面
│       ├── GameView.ts          # 游戏界面
│       └── ResultView.ts        # 结算界面
└── resources/
    └── prefabs/
        ├── ui/
        │   ├── home.prefab
        │   ├── game.prefab
        │   └── result.prefab
        └── entities/
            ├── tower.prefab
            └── enemy.prefab
```

### 11.2 GameCore.ts - 游戏入口

```typescript
import { CocosCore } from 'dzkcc-mflow/libs';
import { _decorator } from 'cc';

// 导入所有模块（使用装饰器后会自动注册）
import './managers/GameManager';
import './managers/EnemyManager';
import './managers/TowerManager';
import './models/GameModel';
import './models/PlayerModel';
import './views/HomeView';
import './views/GameView';
import './views/ResultView';

const { ccclass } = _decorator;

@ccclass('GameCore')
export class GameCore extends CocosCore {
    protected onLoad(): void {
        super.onLoad();
        
        // 框架初始化完成后，打开主界面
        this.scheduleOnce(() => {
            mf.gui.open(ViewNames.Home);
        }, 0);
    }
}
```

### 11.3 GameModel.ts - 游戏数据模型

```typescript
import { model, IModel } from 'dzkcc-mflow/core';

@model('Game')
export class GameModel implements IModel {
    private _level: number = 1;
    private _score: number = 0;
    private _gold: number = 500;
    private _life: number = 10;
    
    initialize(): void {
        console.log('GameModel 初始化');
    }
    
    get level(): number {
        return this._level;
    }
    
    set level(value: number) {
        this._level = value;
    }
    
    get score(): number {
        return this._score;
    }
    
    addScore(value: number): void {
        this._score += value;
    }
    
    get gold(): number {
        return this._gold;
    }
    
    addGold(value: number): void {
        this._gold += value;
    }
    
    get life(): number {
        return this._life;
    }
    
    loseLife(value: number = 1): void {
        this._life = Math.max(0, this._life - value);
    }
    
    reset(): void {
        this._level = 1;
        this._score = 0;
        this._gold = 500;
        this._life = 10;
    }
}
```

### 11.4 PlayerModel.ts - 玩家数据模型

```typescript
import { model, IModel } from 'dzkcc-mflow/core';

@model('Player')
export class PlayerModel implements IModel {
    private _name: string = '';
    private _highScore: number = 0;
    
    initialize(): void {
        console.log('PlayerModel 初始化');
        this.loadFromStorage();
    }
    
    get name(): string {
        return this._name;
    }
    
    set name(value: string) {
        this._name = value;
        this.saveToStorage();
    }
    
    get highScore(): number {
        return this._highScore;
    }
    
    updateHighScore(score: number): void {
        if (score > this._highScore) {
            this._highScore = score;
            this.saveToStorage();
        }
    }
    
    private loadFromStorage(): void {
        const data = localStorage.getItem('playerData');
        if (data) {
            const parsed = JSON.parse(data);
            this._name = parsed.name || '';
            this._highScore = parsed.highScore || 0;
        }
    }
    
    private saveToStorage(): void {
        localStorage.setItem('playerData', JSON.stringify({
            name: this._name,
            highScore: this._highScore
        }));
    }
}
```

### 11.5 GameManager.ts - 游戏管理器

```typescript
import { manager, AbstractManager, ManagerNames, ModelNames } from 'dzkcc-mflow/core';
import { GameModel } from '../models/GameModel';
import { PlayerModel } from '../models/PlayerModel';

@manager('Game')
export class GameManager extends AbstractManager {
    private gameModel: GameModel = null!;
    private playerModel: PlayerModel = null!;
    
    initialize(): void {
        console.log('GameManager 初始化');
        
        // 获取 Model
        this.gameModel = this.getModel<GameModel>(ModelNames.Game);
        this.playerModel = this.getModel<PlayerModel>(ModelNames.Player);
    }
    
    startGame(level: number): void {
        // 重置游戏数据
        this.gameModel.reset();
        this.gameModel.level = level;
        
        // 派发游戏开始事件
        this.getEventManager().dispatch('gameStart', { level });
    }
    
    killEnemy(enemyType: string): void {
        // 增加分数和金币
        const reward = this.getEnemyReward(enemyType);
        this.gameModel.addScore(reward.score);
        this.gameModel.addGold(reward.gold);
        
        // 派发事件
        this.getEventManager().dispatch('enemyKilled', {
            enemyType,
            score: this.gameModel.score,
            gold: this.gameModel.gold
        });
    }
    
    enemyEscape(): void {
        // 减少生命
        this.gameModel.loseLife(1);
        
        // 派发事件
        this.getEventManager().dispatch('lifeChanged', this.gameModel.life);
        
        // 检查游戏是否结束
        if (this.gameModel.life <= 0) {
            this.gameOver();
        }
    }
    
    private gameOver(): void {
        // 更新最高分
        this.playerModel.updateHighScore(this.gameModel.score);
        
        // 派发游戏结束事件
        this.getEventManager().dispatch('gameOver', {
            score: this.gameModel.score,
            highScore: this.playerModel.highScore
        });
    }
    
    private getEnemyReward(enemyType: string): { score: number; gold: number } {
        // 根据敌人类型返回奖励
        const rewards: Record<string, { score: number; gold: number }> = {
            'small': { score: 10, gold: 5 },
            'medium': { score: 20, gold: 10 },
            'large': { score: 50, gold: 25 }
        };
        return rewards[enemyType] || rewards['small'];
    }
}
```

### 11.6 HomeView.ts - 主界面

```typescript
import { view, ViewNames, ModelNames } from 'dzkcc-mflow/core';
import { BaseView } from 'dzkcc-mflow/libs';
import { _decorator, Button, Label } from 'cc';
import { PlayerModel } from '../models/PlayerModel';

const { ccclass, property } = _decorator;

@view('Home')
@ccclass('HomeView')
export class HomeView extends BaseView {
    @property(Label)
    welcomeLabel: Label = null!;
    
    @property(Label)
    highScoreLabel: Label = null!;
    
    @property(Button)
    startButton: Button = null!;
    
    private playerModel: PlayerModel = null!;
    
    onEnter(args?: any): void {
        // 获取 Model
        this.playerModel = this.getModel<PlayerModel>(ModelNames.Player);
        
        // 更新 UI
        this.welcomeLabel.string = `欢迎, ${this.playerModel.name || '玩家'}!`;
        this.highScoreLabel.string = `最高分: ${this.playerModel.highScore}`;
        
        // 监听按钮点击
        this.startButton.node.on(Button.EventType.CLICK, this.onStartClick, this);
    }
    
    onExit(): void {
        // BaseView 会自动清理事件监听
    }
    
    onPause(): void {}
    onResume(): void {}
    
    private async onStartClick(): Promise<void> {
        // 关闭主界面
        mf.gui.close(ViewNames.Home);
        
        // 打开游戏界面
        await mf.gui.open(ViewNames.Game, { level: 1 });
    }
}
```

### 11.7 GameView.ts - 游戏界面

```typescript
import { view, ViewNames, ManagerNames, ModelNames } from 'dzkcc-mflow/core';
import { BaseView } from 'dzkcc-mflow/libs';
import { _decorator, Label, Node } from 'cc';
import { GameManager } from '../managers/GameManager';
import { GameModel } from '../models/GameModel';

const { ccclass, property } = _decorator;

@view('Game')
@ccclass('GameView')
export class GameView extends BaseView {
    @property(Label)
    scoreLabel: Label = null!;
    
    @property(Label)
    goldLabel: Label = null!;
    
    @property(Label)
    lifeLabel: Label = null!;
    
    @property(Node)
    gameContainer: Node = null!;
    
    private gameManager: GameManager = null!;
    private gameModel: GameModel = null!;
    
    onEnter(args?: any): void {
        // 获取 Manager 和 Model
        this.gameManager = this.getManager<GameManager>(ManagerNames.Game);
        this.gameModel = this.getModel<GameModel>(ModelNames.Game);
        
        // 监听游戏事件（会自动清理）
        this.event.on('enemyKilled', this.onEnemyKilled, this);
        this.event.on('lifeChanged', this.onLifeChanged, this);
        this.event.on('gameOver', this.onGameOver, this);
        
        // 开始游戏
        const level = args?.level || 1;
        this.gameManager.startGame(level);
        
        // 更新 UI
        this.updateUI();
    }
    
    onExit(): void {
        // BaseView 会自动清理事件监听
    }
    
    onPause(): void {}
    onResume(): void {}
    
    private onEnemyKilled(data: any): void {
        this.updateUI();
    }
    
    private onLifeChanged(life: number): void {
        this.lifeLabel.string = `生命: ${life}`;
    }
    
    private async onGameOver(data: any): Promise<void> {
        // 关闭游戏界面
        mf.gui.close(ViewNames.Game);
        
        // 打开结算界面
        await mf.gui.open(ViewNames.Result, {
            score: data.score,
            highScore: data.highScore
        });
    }
    
    private updateUI(): void {
        this.scoreLabel.string = `分数: ${this.gameModel.score}`;
        this.goldLabel.string = `金币: ${this.gameModel.gold}`;
        this.lifeLabel.string = `生命: ${this.gameModel.life}`;
    }
}
```

### 11.8 ResultView.ts - 结算界面

```typescript
import { view, ViewNames } from 'dzkcc-mflow/core';
import { BaseView } from 'dzkcc-mflow/libs';
import { _decorator, Button, Label } from 'cc';

const { ccclass, property } = _decorator;

@view('Result')
@ccclass('ResultView')
export class ResultView extends BaseView {
    @property(Label)
    scoreLabel: Label = null!;
    
    @property(Label)
    highScoreLabel: Label = null!;
    
    @property(Button)
    restartButton: Button = null!;
    
    @property(Button)
    homeButton: Button = null!;
    
    onEnter(args?: any): void {
        // 显示分数
        this.scoreLabel.string = `本局分数: ${args?.score || 0}`;
        this.highScoreLabel.string = `最高分: ${args?.highScore || 0}`;
        
        // 监听按钮点击
        this.restartButton.node.on(Button.EventType.CLICK, this.onRestartClick, this);
        this.homeButton.node.on(Button.EventType.CLICK, this.onHomeClick, this);
    }
    
    onExit(): void {}
    onPause(): void {}
    onResume(): void {}
    
    private async onRestartClick(): Promise<void> {
        mf.gui.close(ViewNames.Result);
        await mf.gui.open(ViewNames.Game, { level: 1 });
    }
    
    private async onHomeClick(): Promise<void> {
        mf.gui.close(ViewNames.Result);
        await mf.gui.open(ViewNames.Home);
    }
}
```

---

## 12. 最佳实践

### 12.1 设计原则

✅ **单一职责** - 每个 Manager/Model 只负责一个特定领域  
✅ **依赖注入** - 使用装饰器自动注入依赖  
✅ **事件驱动** - 通过事件系统实现模块解耦  
✅ **资源管理** - 使用 BaseView 自动管理资源生命周期  

### 12.2 命名规范

- **Manager**: 以 `Manager` 结尾，如 `GameManager`、`AudioManager`
- **Model**: 以 `Model` 结尾，如 `UserModel`、`ConfigModel`
- **View**: 以 `View` 结尾，如 `HomeView`、`GameView`
- **装饰器名称**: 简短清晰，如 `@manager('Game')`、`@model('User')`

### 12.3 项目结构

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
└── utils/                # 工具函数
    ├── MathUtil.ts
    └── StringUtil.ts
```

### 12.4 注意事项

⚠️ **避免循环依赖** - Manager 不应该相互依赖，通过事件系统通信  
⚠️ **资源释放** - 使用 `BaseView` 的自动资源管理，避免内存泄漏  
⚠️ **事件清理** - 在 Manager 的 `dispose()` 中清理事件监听  
⚠️ **异步处理** - 注意 UI 打开/关闭的异步操作，使用 `await`  
⚠️ **WebSocket 连接** - 在场景切换时记得断开连接  

---

## 13. License

MIT License

Copyright (c) 2024 duanzhk

---

## 14. 支持与反馈

- **GitHub**: [cocos-modular-flow-framework](https://github.com/duanzhk/cocos-modular-flow-framework)
- **文档**: [在线文档](https://github.com/duanzhk/cocos-modular-flow-framework/blob/main/README.md)
- **问题反馈**: [Issues](https://github.com/duanzhk/cocos-modular-flow-framework/issues)

---

Made with ❤️ by duanzhk