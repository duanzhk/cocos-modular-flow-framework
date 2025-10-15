# 解决 getManager/getModel 无类型提示问题

## 问题现象

在实际应用中使用框架时，发现没有类型提示：

```typescript
import { ManagerNames } from "dzkcc-mflow/core";

const mgr = mf.core.getManager(ManagerNames.HomeMgr);
// ❌ mgr 没有任何代码补全提示
```

## 问题原因

虽然框架支持类型自动推断，但需要在业务项目中创建**类型映射文件**来建立 Symbol 和类型之间的关联。

## 解决方案

### 方法 1：使用自动生成工具（推荐）⭐

框架提供了自动生成类型映射的工具，在 Cocos Creator 编辑器中：

**菜单：开发者 → mflow-tools → generate-types**

工具会自动扫描您的项目并生成类型映射文件。

### 方法 2：手动创建类型映射文件

如果无法使用自动生成工具，可以手动创建：

#### 步骤 1：创建类型声明文件

在您的项目中创建 `assets/src/types/core-types.d.ts` 文件：

```typescript
// assets/src/types/core-types.d.ts

// 导入您的 Manager 和 Model 类
import { HomeMgr } from '../managers/HomeMgr';
import { GameMgr } from '../managers/GameMgr';
import { UserModel } from '../models/UserModel';

// 扩展框架的类型映射接口
declare module 'dzkcc-mflow/core' {
    // Manager 类型映射
    interface ManagerTypeMap {
        'HomeMgr': HomeMgr;      // 注意：这里的 key 是字符串，要和装饰器中的名称一致
        'GameMgr': GameMgr;
    }
    
    // Model 类型映射
    interface ModelTypeMap {
        'UserModel': UserModel;
    }
}
```

#### 步骤 2：确保 TypeScript 能找到该文件

检查项目的 `tsconfig.json`，确保包含了类型声明文件：

```json
{
    "compilerOptions": {
        // ... 其他配置
    },
    "include": [
        "assets/**/*",
        "assets/**/*.d.ts"  // 确保包含 .d.ts 文件
    ]
}
```

#### 步骤 3：重启 TypeScript 语言服务

在 VS Code 中：
1. 按 `Cmd+Shift+P` (Mac) 或 `Ctrl+Shift+P` (Windows)
2. 输入 "TypeScript: Restart TS Server"
3. 选择并执行

### 方法 3：使用显式泛型（临时方案）

如果暂时不想创建类型映射文件，可以手动指定泛型：

```typescript
import { HomeMgr } from '../managers/HomeMgr';
import { ManagerNames } from 'dzkcc-mflow/core';

const mgr = mf.core.getManager<HomeMgr>(ManagerNames.HomeMgr);
// ✅ 现在有类型提示了
```

**缺点：**
- 需要 import 具体的类
- 失去了 Symbol 的解耦优势
- 每次调用都要写泛型

## 类型映射的关键点

### 1. 装饰器名称要匹配

装饰器中使用的名称要和类型映射中的 key 一致：

```typescript
// Manager 类定义
@manager('HomeMgr')  // ← 这个名称
export class HomeMgr extends AbstractManager {
    // ...
}

// 类型映射
declare module 'dzkcc-mflow/core' {
    interface ManagerTypeMap {
        'HomeMgr': HomeMgr;  // ← 必须匹配
    }
}
```

### 2. 如果装饰器没有指定名称，使用类名

```typescript
// Manager 类定义
@manager()  // ← 没有指定名称，使用类名
export class HomeMgr extends AbstractManager {
    // ...
}

// 类型映射
declare module 'dzkcc-mflow/core' {
    interface ManagerTypeMap {
        'HomeMgr': HomeMgr;  // ← 使用类名
    }
}
```

## 完整示例

### 项目结构

```
assets/
  src/
    types/
      core-types.d.ts          ← 类型映射文件
    models/
      UserModel.ts
    managers/
      HomeMgr.ts
      GameMgr.ts
    views/
      HomeView.ts
```

### 1. 定义 Manager

```typescript
// assets/src/managers/HomeMgr.ts
import { AbstractManager, manager } from 'dzkcc-mflow/core';

@manager('HomeMgr')
export class HomeMgr extends AbstractManager {
    initialize(): void {
        console.log('HomeMgr initialized');
    }
    
    public showHome(): void {
        console.log('Showing home');
    }
    
    public hideHome(): void {
        console.log('Hiding home');
    }
}
```

### 2. 创建类型映射

```typescript
// assets/src/types/core-types.d.ts
import { HomeMgr } from '../managers/HomeMgr';
import { GameMgr } from '../managers/GameMgr';
import { UserModel } from '../models/UserModel';

declare module 'dzkcc-mflow/core' {
    // 扩展 ManagerNames 接口，提供代码补全
    interface ManagerNamesType {
        HomeMgr: symbol;
        GameMgr: symbol;
    }
    
    // 扩展 ManagerTypeMap 接口，提供类型推断
    interface ManagerTypeMap {
        'HomeMgr': HomeMgr;
        'GameMgr': GameMgr;
    }
    
    // 扩展 ModelNames 接口，提供代码补全
    interface ModelNamesType {
        UserModel: symbol;
    }
    
    // 扩展 ModelTypeMap 接口，提供类型推断
    interface ModelTypeMap {
        'UserModel': UserModel;
    }
}
```

### 3. 在代码中使用

```typescript
// assets/src/views/HomeView.ts
import { BaseView, view } from 'dzkcc-mflow/libs';
import { ManagerNames } from 'dzkcc-mflow/core';

@view('Home')
export class HomeView extends BaseView {
    onEnter(): void {
        // ✅ 自动推断为 HomeMgr 类型
        const homeMgr = mf.core.getManager(ManagerNames.HomeMgr);
        
        // ✅ 完整的代码补全和类型检查
        homeMgr.showHome();
        homeMgr.hideHome();
    }
}
```

## 验证类型推断是否生效

### 测试 1：悬停查看类型

将鼠标悬停在 `mgr` 变量上，应该看到：

```typescript
const mgr: HomeMgr  // ✅ 正确
// 而不是
const mgr: IManager  // ❌ 说明类型映射未生效
```

### 测试 2：代码补全

输入 `mgr.` 后，应该能看到 `HomeMgr` 类的所有方法。

### 测试 3：类型检查

```typescript
const mgr = mf.core.getManager(ManagerNames.HomeMgr);
mgr.nonExistentMethod();  // ❌ TypeScript 应该报错
```

## 常见问题排查

### Q1: 仍然没有类型提示

**检查清单：**

1. ✅ 已创建 `core-types.d.ts` 文件
2. ✅ 文件中正确导入了所有类
3. ✅ `declare module` 语法正确
4. ✅ 装饰器名称和映射 key 匹配
5. ✅ `tsconfig.json` 包含了 `.d.ts` 文件
6. ✅ 重启了 TypeScript 语言服务

### Q2: 提示 "找不到模块 'dzkcc-mflow/core'"

确保在业务项目中正确安装了框架：

```bash
npm install dzkcc-mflow
```

### Q3: 某些 Manager 有类型提示，某些没有

检查是否所有 Manager 都添加到了类型映射中：

```typescript
declare module 'dzkcc-mflow/core' {
    interface ManagerTypeMap {
        'HomeMgr': HomeMgr;     // ✅ 有类型提示
        'GameMgr': GameMgr;     // ✅ 有类型提示
        // 'AudioMgr': AudioMgr;  // ❌ 忘记添加，没有类型提示
    }
}
```

## 最佳实践

### 1. 使用自动生成工具

不要手动维护类型映射，使用框架提供的自动生成工具：

**编辑器菜单：开发者 → mflow-tools → generate-types**

### 2. 提交到版本控制

将生成的类型映射文件提交到 Git：

```bash
git add assets/src/types/core-types.d.ts
git commit -m "chore: update type mappings"
```

### 3. 定期更新

在以下情况下重新生成类型映射：
- 新增 Model/Manager
- 删除 Model/Manager
- 修改装饰器名称

### 4. 团队协作

确保团队成员都知道：
- 新增 Model/Manager 后要运行 generate-types
- 拉取代码后如果发现类型错误，运行 generate-types

## 技术原理

### 为什么需要类型映射？

1. **装饰器在运行时工作**
   ```typescript
   @manager('HomeMgr')  // 运行时注册
   ```

2. **TypeScript 类型系统在编译时工作**
   ```typescript
   const mgr = getManager(...);  // 编译时需要知道类型
   ```

3. **类型映射是桥梁**
   ```typescript
   declare module 'dzkcc-mflow/core' {
       interface ManagerTypeMap {
           'HomeMgr': HomeMgr;  // 编译时类型信息
       }
   }
   ```

### 框架的类型推断实现

```typescript
// 框架内部的实现（简化版）
export interface ManagerTypeMap extends Record<string, any> {}
export interface ManagerNamesType extends Record<string, symbol> {}

type InferManagerType<S extends symbol> = 
    GetKeyFromSymbol<S, ManagerNamesType> extends keyof ManagerTypeMap 
        ? ManagerTypeMap[GetKeyFromSymbol<S, ManagerNamesType>]
        : IManager;

export interface ICore {
    getManager<S extends symbol>(managerSymbol: S): InferManagerType<S>;
}
```

当您扩展了 `ManagerTypeMap` 和 `ManagerNamesType` 接口后，TypeScript 会自动完成类型推断。

## 总结

要让 `mf.core.getManager()` 有类型提示，关键是：

1. ✅ **创建类型映射文件**（推荐使用自动生成工具）
2. ✅ **正确映射 Symbol 名称和类型**
3. ✅ **重启 TypeScript 语言服务**

这样就能同时享受：
- ✅ Symbol 的解耦优势
- ✅ 完整的类型提示和代码补全
- ✅ TypeScript 的编译时类型检查

