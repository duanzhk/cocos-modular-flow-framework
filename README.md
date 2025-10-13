# Modular Flow Framework

## 1.1 框架概述

Cocos模块化流程框架（Modular Flow Framework）是一个为Cocos Creator引擎开发的模块化设计和流程管理框架。该框架旨在提供解耦和依赖注入的能力，帮助开发者构建更加清晰、可维护的游戏项目。

### 1.2 核心特性

- **模块化设计**：通过Manager和Model模式实现业务逻辑的模块化管理
- **依赖注入**：通过装饰器实现自动依赖注入
- **服务定位器**：统一的服务管理机制
- **UI管理系统**：完整的UI界面管理方案
- **事件系统**：强大的事件广播和监听机制
- **资源加载系统**：统一的资源加载和释放管理
- **HTTP网络请求系统**：简洁易用的HTTP客户端
- **开发工具**：配套的Cocos Creator编辑器插件

### 1.3 安装说明

```bash
npm i dzkcc-mflow@beta
```

安装完成后，重启Cocos Creator引擎。

## 2. 核心概念

### 2.1 Core核心

Core是框架的核心，负责管理所有的Manager和Model实例。它继承自`AbstractCore`类，提供了注册和获取Manager/Model的接口。

```typescript
// 自定义Core需要继承CocosCore
export class GameCore extends CocosCore { }
```

在场景中挂载GameCore组件即可初始化框架。

### 2.2 ServiceLocator服务定位器

ServiceLocator用于管理跨领域的基础服务，如EventManager、ResLoader、UIManager等。

```typescript
// 注册服务
ServiceLocator.regService('serviceKey', serviceInstance);

// 获取服务
const service = ServiceLocator.getService<ServiceType>('serviceKey');
```

### 2.3 Manager管理器

Manager负责管理业务领域内的具体实现，通常处理业务逻辑。Manager需要实现`IManager`接口。

```typescript
export abstract class AbstractManager implements IManager {
    abstract initialize(): void;
    dispose(): void;
}
```

### 2.4 Model模型

Model用于数据管理，实现`IModel`接口。

```typescript
export interface IModel {
    initialize(): void;
}
```

### 2.5 装饰器系统

框架提供了装饰器来简化Manager和Model的注册：

```typescript
// 注册Manager
@manager()
export class GameManager extends AbstractManager {
    // 实现逻辑
}

// 注册Model
@model()
export class GameModel implements IModel {
    initialize(): void {
        // 初始化逻辑
    }
}
```

## 3. UI系统

### 3.1 BaseView基础视图

所有UI界面都应该继承`BaseView`类，它提供了以下特性：

- 自动事件监听管理（自动注册和注销）
- 自动资源加载管理（自动释放）
- 统一的生命周期方法

```typescript
export abstract class BaseView extends Component implements IView {
    abstract onPause(): void;
    abstract onResume(): void;
    abstract onEnter(args?: any): void;
    onExit(): void;
}
```

### 3.2 UIManager界面管理器

UIManager负责管理UI界面的打开、关闭、层级等操作。

```typescript
// 打开界面
const view = await mf.gui.open(ViewType, args);

// 关闭界面
mf.gui.close(viewInstance);

// 带分组的界面管理
const view = await mf.gui.openAndPush(ViewType, 'group', args);
mf.gui.closeAndPop('group');
```

## 4. 事件系统

### 4.1 Broadcaster事件广播器

框架提供了基于类型的事件系统，通过Broadcaster实现。

```typescript
// 监听事件
mf.event.on('eventKey', (data) => {
    // 处理事件
});

// 广播事件
mf.event.dispatch('eventKey', data);

// 一次性监听
mf.event.once('eventKey', (data) => {
    // 只会触发一次
});
```

### 4.2 粘性事件

粘性事件可以在没有监听者时暂存，等有监听者时再触发：

```typescript
// 发送粘性事件
mf.event.dispatchSticky('stickyEvent', data);

// 移除粘性事件
mf.event.removeStickyBroadcast('stickyEvent');
```

## 5. 资源加载系统

### 5.1 ResLoader资源加载器

ResLoader提供了统一的资源加载和释放接口：

```typescript
// 加载预制体
const prefab = await mf.res.loadPrefab('path/to/prefab');

// 加载精灵帧
const spriteFrame = await mf.res.loadSpriteFrame(spriteComponent, 'path/to/sprite');

// 加载Spine动画
const spineData = await mf.res.loadSpine(spineComponent, 'path/to/spine');

// 释放资源
mf.res.release('path/to/asset');
```

## 6. HTTP网络请求系统

### 6.1 HttpManager HTTP管理器

HttpManager提供了简洁易用的HTTP客户端功能，支持常见的HTTP方法：

```typescript
// GET 请求
const userData = await mf.http.get('/api/users/123', { includeProfile: true });

// POST 请求
const newUser = await mf.http.post('/api/users', { 
    name: 'John', 
    email: 'john@example.com' 
});

// PUT 请求
const updatedUser = await mf.http.put('/api/users/123', { 
    name: 'John Doe' 
});

// DELETE 请求
await mf.http.delete('/api/users/123');

// 自定义请求
const result = await mf.http.request({
    url: '/api/upload',
    method: 'POST',
    data: formData,
    headers: {
        'Authorization': 'Bearer token'
    },
    timeout: 30000
});
```

### 6.2 功能特性

1. **Promise-based API**：所有请求都返回Promise，支持async/await
2. **超时控制**：默认10秒超时，可自定义
3. **自动JSON解析**：自动解析JSON响应
4. **错误处理**：统一的错误处理机制
5. **请求拦截**：支持自定义请求头
6. **URL参数处理**：自动处理GET请求的查询参数

### 6.3 使用示例

```typescript
// 在Manager中使用
@manager()
export class UserManager extends AbstractManager {
    async getUserProfile(userId: string): Promise<any> {
        try {
            const profile = await mf.http.get(`/api/users/${userId}/profile`);
            return profile;
        } catch (error) {
            console.error('Failed to fetch user profile:', error);
            throw error;
        }
    }
    
    async updateUser(userId: string, data: any): Promise<any> {
        try {
            const result = await mf.http.put(`/api/users/${userId}`, data, {
                'Authorization': `Bearer ${this.getAuthToken()}`
            });
            return result;
        } catch (error) {
            console.error('Failed to update user:', error);
            throw error;
        }
    }
    
    private getAuthToken(): string {
        // 获取认证令牌的逻辑
        return 'your-auth-token';
    }
}
```

## 7. 开发工具

框架配套了Cocos Creator编辑器插件`mflow-tools`，可以：

1. 自动生成UI脚本
2. 自动引用Prefab上需要操作的元素
3. 自动挂载脚本组件

### 7.1 使用方法

1. 在Prefab中，将需要引用的节点重命名为`#属性名#组件类型`格式，例如：
   - `#titleLabel#Label` 表示引用Label组件
   - `#closeButton#Button` 表示引用Button组件
   - `#contentNode` 表示引用Node节点

2. 在Hierarchy面板中右键点击Prefab节点，选择"导出到脚本"

3. 插件会自动生成基础脚本和业务脚本，并自动设置引用关系

## 8. 完整示例

### 8.1 创建Manager

```typescript
@manager()
export class GameManager extends AbstractManager {
    private _score: number = 0;
    
    initialize(): void {
        console.log('GameManager initialized');
    }
    
    get score(): number {
        return this._score;
    }
    
    addScore(value: number): void {
        this._score += value;
        // 广播分数变化事件
        this.getEventManager().dispatch('scoreChanged', this._score);
    }
}
```

### 8.2 创建Model

```typescript
@model()
export class GameModel implements IModel {
    private _playerName: string = '';
    
    initialize(): void {
        console.log('GameModel initialized');
    }
    
    get playerName(): string {
        return this._playerName;
    }
    
    set playerName(name: string) {
        this._playerName = name;
    }
}
```

### 8.3 创建UI界面

```typescript
// BaseHomeView.ts (由工具自动生成)
import { _decorator, Component, Label, Button } from 'cc';
import { BaseView } from "dzkcc-mflow/libs";

const { ccclass, property, disallowMultiple } = _decorator;

@disallowMultiple()
export abstract class BaseHomeView extends BaseView {
    /** @internal */
    private static readonly __path__: string = "ui/home";
    
    @property({ type: Label }) titleLabel: Label = null!;
    @property({ type: Button }) startButton: Button = null!;
}

// HomeView.ts (业务实现)
import { BaseHomeView } from './BaseHomeView';
import { _decorator } from 'cc';

const { ccclass, property } = _decorator;

@ccclass('HomeView')
export class HomeView extends BaseHomeView {
    onEnter(args?: any): void {
        // 监听按钮点击
        this.startButton.node.on(Button.EventType.CLICK, this.onStartClick, this);
        
        // 监听分数变化
        this.event.on('scoreChanged', this.onScoreChanged, this);
    }
    
    onExit(): void {
        // BaseView会自动清理事件监听
    }
    
    onPause(): void {
        // 界面暂停时的处理
    }
    
    onResume(): void {
        // 界面恢复时的处理
    }
    
    private onStartClick(): void {
        // 获取GameManager并调用方法
        const gameManager = this.getManager(GameManager);
        gameManager.addScore(10);
    }
    
    private onScoreChanged(score: number): void {
        this.titleLabel.string = `分数: ${score}`;
    }
}
```

### 8.4 在场景中使用

```typescript
// 在游戏启动时
export class GameApp extends Component {
    start(): void {
        // 打开主界面
        mf.gui.open(HomeView);
    }
}
```

## 9. 最佳实践

1. **模块化设计**：将相关的业务逻辑封装在对应的Manager中
2. **数据驱动**：使用Model管理数据状态
3. **事件解耦**：通过事件系统实现模块间通信
4. **资源管理**：使用BaseView自动管理资源加载和释放
5. **依赖注入**：使用装饰器简化依赖管理
6. **网络请求**：使用HttpManager统一管理网络请求
7. **工具辅助**：使用mflow-tools提高开发效率

## 10. 注意事项

1. 确保在使用框架功能前Core已经初始化
2. 注意资源的正确加载和释放，避免内存泄漏
3. 合理使用事件系统，避免事件监听过多影响性能
4. 使用BaseView的子类时，确保正确实现所有抽象方法
5. 网络请求时注意错误处理和超时设置