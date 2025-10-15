# 类型自动推断

## 概述

框架支持**无需泛型、无需 import 具体类**的情况下，自动推断 `getModel` 和 `getManager` 的返回类型！

## 问题背景

在使用 `getModel` 和 `getManager` 时，之前面临两难选择：

### 方案 A：使用泛型（有类型提示，但失去解耦优势）

```typescript
// ❌ 需要 import 具体的类
import { UserModel } from '../models/UserModel';
import { GameManager } from '../managers/GameManager';

const userModel = mf.core.getModel<UserModel>(ModelNames.User);
userModel.name;  // ✅ 有代码补全

const gameManager = mf.core.getManager<GameManager>(ManagerNames.Game);
gameManager.score;  // ✅ 有代码补全
```

**问题：**
- ❌ 必须 import 具体的类
- ❌ Symbol 失去了解耦的意义
- ❌ 手动指定泛型很繁琐

### 方案 B：不使用泛型（解耦但没有类型提示）

```typescript
// ✅ 只需要 import ModelNames 和 ManagerNames
import { ModelNames, ManagerNames } from 'dzkcc-mflow/core';

const userModel = mf.core.getModel(ModelNames.User);
userModel.name;  // ❌ 没有代码补全，类型是 IModel

const gameManager = mf.core.getManager(ManagerNames.Game);
gameManager.score;  // ❌ 没有代码补全，类型是 IManager
```

**问题：**
- ❌ 没有类型提示和代码补全
- ❌ 容易出现运行时错误
- ❌ 开发体验差

## 解决方案：类型映射自动推断

通过 TypeScript 的**声明合并（Declaration Merging）**机制，实现类型自动推断。

### 步骤 1：创建类型映射文件

在项目中创建 `types/core-types.d.ts`：

```typescript
// types/core-types.d.ts
import { UserModel } from '../models/UserModel';
import { GameManager } from '../managers/GameManager';
import { ModelNames, ManagerNames } from 'dzkcc-mflow/core';

declare module 'dzkcc-mflow/core' {
    interface ModelTypeMap {
        [ModelNames.User]: UserModel;
        [ModelNames.Score]: ScoreModel;
        // ... 其他 Model
    }
    
    interface ManagerTypeMap {
        [ManagerNames.Game]: GameManager;
        [ManagerNames.Audio]: AudioManager;
        // ... 其他 Manager
    }
}
```

### 步骤 2：享受自动类型推断

```typescript
import { ModelNames, ManagerNames } from 'dzkcc-mflow/core';

// ✅ 自动推断为 UserModel 类型，无需手动指定泛型
const userModel = mf.core.getModel(ModelNames.User);
userModel.name;  // ✅ 有完整的代码补全

// ✅ 自动推断为 GameManager 类型
const gameManager = mf.core.getManager(ManagerNames.Game);
gameManager.score;  // ✅ 有完整的代码补全
```

## 核心优势

✅ **无需手动指定泛型**：告别 `getModel<UserModel>(...)` 的繁琐写法  
✅ **无需 import 具体类**：只需 import `ModelNames`/`ManagerNames`  
✅ **完整的类型提示**：自动推断出正确的类型，享受完整的代码补全  
✅ **保持 Symbol 的解耦优势**：既解耦，又类型安全  
✅ **编译时类型检查**：TypeScript 会在编译时检查类型错误  

## 维护类型映射

### 方式 1：自动生成（推荐）⭐

框架提供了自动生成脚本，每次新增 Model/Manager 后运行：

```bash
npm run generate:types
```

脚本会自动：
- ✅ 扫描 `src/models/` 和 `src/managers/` 目录
- ✅ 识别所有使用了 `@model()` 和 `@manager()` 的类
- ✅ 自动生成完整的类型映射文件
- ✅ 不会遗漏任何类

### 方式 2：手动维护

每次新增 Model/Manager 时，手动在 `types/core-types.d.ts` 中添加：

```typescript
// 1. 添加 import
import { NewModel } from '../models/NewModel';

// 2. 在接口中添加映射
declare module 'dzkcc-mflow/core' {
    interface ModelTypeMap {
        [ModelNames.New]: NewModel;  // ← 新添加
    }
}
```

### 集成到工作流

可以在构建前自动生成：

```json
// package.json
{
  "scripts": {
    "prebuild": "npm run generate:types",
    "build": "rollup -c"
  }
}
```

或使用 Git 钩子：

```bash
# .husky/pre-commit
npm run generate:types
git add types/core-types.d.ts
```

## 常见问题

### Q: 是否必须创建类型映射文件？

**A:** 不是必须的！类型映射是**可选功能**：

- **不用类型映射**：框架正常工作，但需要手动指定泛型
  ```typescript
  const model = mf.core.getModel<UserModel>(ModelNames.User);
  ```

- **使用类型映射**：自动推断类型，更简洁
  ```typescript
  const model = mf.core.getModel(ModelNames.User);  // 自动推断
  ```

### Q: 忘记更新类型映射会怎样？

**A:** 不会报错，但会失去类型推断的好处：

```typescript
// 没有添加到类型映射
const model = mf.core.getModel(ModelNames.New);
// model 类型是 IModel（基础接口），没有具体类的代码补全
```

**解决方案：** 运行 `npm run generate:types` 补充映射。

### Q: 为什么没有代码补全？

**检查清单：**

1. **是否创建了类型映射文件？**
   ```bash
   npm run generate:types
   ```

2. **是否重启了 TS 语言服务？**
   - VS Code: `Cmd+Shift+P` → "Restart TS Server"

3. **tsconfig.json 是否包含 .d.ts 文件？**
   ```json
   {
     "include": ["src/**/*", "src/**/*.d.ts"]
   }
   ```

4. **类型映射是否正确？**
   ```typescript
   // 检查 Symbol 名称是否匹配
   [ModelNames.User]: UserModel  // ✅ 正确
   [ModelNames.User]: UserMode   // ❌ 类名错误
   ```

### Q: 为什么不能完全自动化？

**A:** TypeScript 的限制：

- **装饰器**在**运行时**注册 Symbol 和类的映射
- **TypeScript 类型系统**在**编译时**工作
- 编译时无法获取运行时的注册信息

所以需要类型映射文件作为**桥梁**，连接运行时和编译时。

### Q: 类型映射文件是否会影响性能？

**A:** **完全不会！**

- 类型映射文件是 `.d.ts` 文件（TypeScript 声明文件）
- 只在**编译时**使用，提供类型信息
- **不会被编译到最终代码**中
- **不会增加打包体积**
- **不会影响运行时性能**

## 工作原理

1. **装饰器注册**：`@model('User')` 注册 Symbol 到运行时
2. **类型映射**：通过 `declare module` 建立 Symbol → Type 的关系
3. **类型推断**：调用时 TypeScript 根据传入的 Symbol 查找对应类型
4. **代码补全**：IDE 获得完整类型信息，提供智能提示

```typescript
// 框架内部实现
export interface ModelTypeMap {}

getModel<S extends symbol>(modelSymbol: S): 
    S extends keyof ModelTypeMap ? ModelTypeMap[S] : IModel
```

## 使用场景

### 在 Manager 中使用

```typescript
import { AbstractManager } from 'dzkcc-mflow/core';
import { ModelNames } from 'dzkcc-mflow/core';

export class GameManager extends AbstractManager {
    initialize(): void {
        // ✅ 自动推断类型
        const userModel = this.getModel(ModelNames.User);
        const scoreModel = this.getModel(ModelNames.Score);
        
        userModel.name;  // ✅ 有代码补全
        scoreModel.score;  // ✅ 有代码补全
    }
}
```

### 在 View 中使用

```typescript
import { BaseView } from 'dzkcc-mflow/libs';
import { ManagerNames } from 'dzkcc-mflow/core';

export class GameView extends BaseView {
    onEnter(): void {
        // ✅ 自动推断类型
        const gameManager = this.getManager(ManagerNames.Game);
        const audioManager = this.getManager(ManagerNames.Audio);
        
        gameManager.startGame();  // ✅ 有代码补全
        audioManager.playBGM();  // ✅ 有代码补全
    }
}
```

## 推荐做法

### 对于新项目

1. **初始化时运行一次**
   ```bash
   npm run generate:types
   ```

2. **每次新增 Model/Manager 后运行**
   ```bash
   npm run generate:types
   ```

3. **可选：添加到构建流程**
   ```json
   {
     "prebuild": "npm run generate:types"
   }
   ```

### 对于现有项目

1. **运行一次生成全部**
   ```bash
   npm run generate:types
   ```

2. **提交到 Git**
   ```bash
   git add types/core-types.d.ts
   git commit -m "feat: add type map"
   ```

3. **团队成员拉取后自动获得类型**

## 总结

这是一个**真正做到既解耦，又类型安全**的解决方案！

```
✅ Symbol 解耦  +  ✅ 类型安全  +  ✅ 代码补全
```

虽然需要维护类型映射，但：
- ✅ **一次配置，长期受益**
- ✅ **自动生成脚本**让维护变得简单
- ✅ **可选功能**，不配置也能正常使用
- ✅ **渐进式采用**，可以只为常用的类添加映射

