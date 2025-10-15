# 快速开始

## 安装

在项目根目录执行：

```bash
npm i dzkcc-mflow@beta
```

## 配置 TypeScript

修改项目的 `tsconfig.json`，添加路径映射：

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

## 创建 Core 入口

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

## 挂载到场景

1. 在 Cocos Creator 编辑器中打开主场景
2. 在 Canvas 节点上添加 `GameCore` 组件
3. 保存场景

## 安装开发工具

**重启 Cocos Creator 编辑器**，框架会自动安装配套的编辑器插件。

## 使用全局对象

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

## 下一步

- 了解[核心概念](./CORE_CONCEPTS.md)
- 学习[装饰器系统](./DECORATORS.md)
- 查看[完整示例](./COMPLETE_EXAMPLE.md)

