# Modular Flow Framework

一个专为 Cocos Creator 引擎开发的模块化设计与流程管理框架。

- **GitHub**: https://github.com/duanzhk/cocos-modular-flow-framework

## 核心特性

✨ **模块化设计** - 通过 Manager 和 Model 模式实现业务逻辑的模块化管理  
✨ **依赖注入** - 基于装饰器的自动依赖注入和 Symbol 映射  
✨ **服务定位器** - 统一的服务管理机制，实现服务解耦  
✨ **UI 管理系统** - 完整的 UI 界面管理方案，支持视图栈和分组  
✨ **事件系统** - 强大的事件广播和监听机制，支持粘性事件  
✨ **资源加载系统** - 统一的资源加载和自动释放管理  
✨ **HTTP 网络** - 简洁易用的 HTTP 客户端，支持 RESTful API  
✨ **WebSocket 实时通信** - 支持自动重连、心跳检测的 WebSocket 客户端  
✨ **红点系统** - 树形结构的红点提示管理系统  
✨ **类型自动推断** - 无需泛型即可享受完整的类型提示  
✨ **开发工具** - 配套的 Cocos Creator 编辑器插件

## 快速开始

### 安装

```bash
npm i dzkcc-mflow@beta
```

### 配置 TypeScript

修改项目的 `tsconfig.json`：

```json
{
  "extends": "./temp/tsconfig.cocos.json",
  "compilerOptions": {
    "strict": false,
    "paths": {
      "dzkcc-mflow/*": ["./node_modules/dzkcc-mflow/dist/*"]
    }
  }
}
```

### 创建入口

```typescript
import { CocosCore } from 'dzkcc-mflow/libs';
import { _decorator } from 'cc';

const { ccclass } = _decorator;

@ccclass('GameCore')
export class GameCore extends CocosCore {
    // CocosCore 会自动初始化框架
}
```

📖 **详细指南**: [快速开始](./docs/QUICK_START.md)

## 核心功能模块

### 1. 核心概念

了解框架的基础架构、Core 容器、ServiceLocator、Manager、Model、View 和 Symbol 映射系统。

📖 **查看文档**: [核心概念](./docs/CORE_CONCEPTS.md)

### 2. 装饰器系统

使用 `@manager()`、`@model()`、`@view()` 装饰器注册组件，实现自动依赖注入。

```typescript
@manager('Game')
export class GameManager extends AbstractManager {}

@model('User')
export class UserModel implements IModel {}

@view('Home')
@ccclass('HomeView')
export class HomeView extends BaseView {}
```

📖 **查看文档**: [装饰器系统](./docs/DECORATORS.md)

### 3. UI 系统

完整的 UI 界面管理，支持生命周期、视图栈、自动事件清理和资源释放。

```typescript
// 打开界面
await mf.gui.open(ViewNames.Home, { data: 'value' });

// 视图栈管理
await mf.gui.openAndPush(ViewNames.Level1, 'game');
mf.gui.closeAndPop('game');
```

📖 **查看文档**: [UI 系统](./docs/UI_SYSTEM.md)

### 4. 事件系统

强大的事件广播和监听机制，支持粘性事件和类型安全。

```typescript
// 监听事件
mf.event.on('gameStart', (data) => {
    console.log('游戏开始', data);
});

// 派发事件
mf.event.dispatch('gameStart', { level: 1 });
```

📖 **查看文档**: [事件系统](./docs/EVENT_SYSTEM.md)

### 5. 资源管理

统一的资源加载和释放管理，支持自动资源管理。

```typescript
// 加载资源
const prefab = await mf.res.loadPrefab('prefabs/player');

// View 中自动管理
this.res.loadSpriteFrame(this.sprite, 'textures/icon');
// onDestroy 时自动释放
```

📖 **查看文档**: [资源管理](./docs/RESOURCE_MANAGEMENT.md)

### 6. 网络通信

简洁易用的 HTTP 和 WebSocket 客户端。

```typescript
// HTTP 请求
const data = await mf.http.get('/api/user/profile');
await mf.http.post('/api/login', { username, password });

// WebSocket 连接
mf.socket.connect('wss://game-server.com/ws');
mf.socket.send({ type: 'move', x: 100, y: 200 });
```

📖 **查看文档**: [网络通信](./docs/NETWORK.md)

### 7. 红点系统

树形结构的红点提示管理，支持自动累加和变化监听。

```typescript
// 设置红点
mf.reddot.setCount('main/bag/weapon', 5);

// 监听变化
mf.reddot.on('main/bag', (totalCount) => {
    this.updateUI(totalCount);
});
```

📖 **查看文档**: [红点系统](./docs/REDDOT_SYSTEM.md)

### 8. 类型自动推断 ⭐

无需泛型、无需 import 具体类，自动推断 `getModel` 和 `getManager` 的返回类型！

```typescript
// 只需要一次性配置类型映射
// types/core-types.d.ts
declare module 'dzkcc-mflow/core' {
    interface ModelTypeMap {
        [ModelNames.User]: UserModel;
    }
}

// 使用时自动推断类型
const userModel = mf.core.getModel(ModelNames.User);
userModel.name;  // ✅ 有完整的代码补全
```

**维护类型映射**：

```bash
npm run generate:types  # 自动生成类型映射
```

📖 **查看文档**: [类型自动推断](./docs/TYPE_INFERENCE.md)

### 9. 开发工具

Cocos Creator 编辑器插件，自动生成 UI 脚本，自动设置组件引用。

**使用方法**：
1. 按命名约定重命名节点（如 `#titleLabel#Label`）
2. 右键选择 "MFlow Tools → 导出到脚本"
3. 自动生成基类和业务类

📖 **查看文档**: [开发工具](./docs/DEV_TOOLS.md)

## 完整示例

查看一个完整的塔防游戏示例，了解如何使用框架的各个功能。

📖 **查看示例**: [完整示例](./docs/COMPLETE_EXAMPLE.md)

## 最佳实践

了解设计原则、命名规范、项目结构、性能优化和常见注意事项。

📖 **查看文档**: [最佳实践](./docs/BEST_PRACTICES.md)

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

## 使用全局对象

框架提供了全局对象 `mf` 用于访问所有功能：

```typescript
// 访问 Manager
mf.core.getManager(ManagerNames.GameManager);

// 访问 Model
mf.core.getModel(ModelNames.UserModel);

// UI 管理
mf.gui.open(ViewNames.HomeView);

// 事件系统
mf.event.dispatch('gameStart');

// 资源加载
mf.res.loadPrefab('prefabs/player');

// HTTP 请求
mf.http.get('/api/user/profile');

// WebSocket
mf.socket.connect('wss://server.com/ws');

// 红点系统
mf.reddot.setCount('main/bag', 5);
```

## 文档索引

| 文档 | 说明 |
|------|------|
| [快速开始](./docs/QUICK_START.md) | 安装和基本使用 |
| [核心概念](./docs/CORE_CONCEPTS.md) | 框架核心概念和架构 |
| [装饰器系统](./docs/DECORATORS.md) | @manager、@model、@view 使用 |
| [UI 系统](./docs/UI_SYSTEM.md) | 界面管理和生命周期 |
| [事件系统](./docs/EVENT_SYSTEM.md) | 事件广播和监听 |
| [资源管理](./docs/RESOURCE_MANAGEMENT.md) | 资源加载和释放 |
| [网络通信](./docs/NETWORK.md) | HTTP 和 WebSocket |
| [红点系统](./docs/REDDOT_SYSTEM.md) | 红点提示管理 |
| [类型自动推断](./docs/TYPE_INFERENCE.md) | 类型映射和自动推断 |
| [开发工具](./docs/DEV_TOOLS.md) | 编辑器插件使用 |
| [完整示例](./docs/COMPLETE_EXAMPLE.md) | 塔防游戏示例 |
| [最佳实践](./docs/BEST_PRACTICES.md) | 设计原则和规范 |

## License

MIT License

Copyright (c) 2024 duanzhk

## 支持与反馈

- **GitHub**: [cocos-modular-flow-framework](https://github.com/duanzhk/cocos-modular-flow-framework)
- **问题反馈**: [Issues](https://github.com/duanzhk/cocos-modular-flow-framework/issues)

---

Made with ❤️ by duanzhk
