# 类型生成工具使用指南

## 概述

类型生成工具可以自动扫描项目中使用 `@model()` 和 `@manager()` 装饰器的类，并生成 TypeScript 类型映射文件，实现完整的类型推断支持。

## 使用方法

### 方法一：在 Cocos Creator 编辑器中使用（推荐）

1. 在 Cocos Creator 编辑器顶部菜单栏，点击 **项目** 菜单
2. 选择 **生成类型映射** (Generate Type Map)
3. 等待生成完成，会弹出成功或失败的提示

**优点**：
- 可视化操作，简单直观
- 自动集成在编辑器工作流中
- 无需记忆命令行

### 方法二：使用命令行

在项目根目录执行：

```bash
node node_modules/dzkcc-mflow/scripts/generate-type-map.js
```

或者在 package.json 中添加脚本：

```json
{
  "scripts": {
    "generate:types": "node node_modules/dzkcc-mflow/scripts/generate-type-map.js"
  }
}
```

然后运行：

```bash
npm run generate:types
```

## 配置

### 默认配置

工具会使用以下默认配置：

- **Model 目录**: `assets/src/models`
- **Manager 目录**: `assets/src/managers`
- **输出文件**: `assets/types/core-types.d.ts`
- **模块路径**: `dzkcc-mflow/core`

### 自定义配置

如果项目结构不同，可以通过以下两种方式自定义配置：

#### 方式 1：在 package.json 中配置

```json
{
  "name": "your-project",
  "mflowTypeGen": {
    "modelDir": "assets/scripts/models",
    "managerDir": "assets/scripts/managers",
    "outputFile": "assets/scripts/types/core-types.d.ts",
    "moduleImportPath": "dzkcc-mflow/core"
  }
}
```

#### 方式 2：创建 mflow.config.json 文件

在项目根目录创建 `mflow.config.json` 文件：

```json
{
  "modelDir": "assets/scripts/models",
  "managerDir": "assets/scripts/managers",
  "outputFile": "assets/scripts/types/core-types.d.ts",
  "moduleImportPath": "dzkcc-mflow/core"
}
```

## 配置说明

| 字段 | 类型 | 说明 |
|------|------|------|
| `modelDir` | string | Model 类所在的目录，相对于项目根目录 |
| `managerDir` | string | Manager 类所在的目录，相对于项目根目录 |
| `outputFile` | string | 生成的类型文件输出路径，相对于项目根目录 |
| `moduleImportPath` | string | 框架模块的导入路径，一般不需要修改 |

## 工作原理

1. **扫描目录**：递归扫描 Model 和 Manager 目录中的所有 `.ts` 文件
2. **解析装饰器**：识别使用 `@model('Name')` 或 `@manager('Name')` 装饰器的类
3. **生成映射**：创建类型映射接口，将装饰器名称映射到类类型
4. **输出文件**：生成 `.d.ts` 类型定义文件

## 示例

### 装饰器使用

```typescript
// assets/src/models/UserModel.ts
import { model } from 'dzkcc-mflow/core';

@model('User')
export class UserModel {
    userName: string = '';
    level: number = 0;
}
```

```typescript
// assets/src/managers/GameManager.ts
import { manager } from 'dzkcc-mflow/core';

@manager('Game')
export class GameManager {
    start() {
        console.log('Game started');
    }
}
```

### 生成的类型文件

```typescript
// assets/types/core-types.d.ts
/**
 * 自动生成的类型映射文件
 * ⚠️ 请勿手动修改此文件！
 * 重新生成方法：
 *   - 在 Cocos Creator 编辑器中：项目菜单 -> 生成类型映射
 *   - 命令行：node node_modules/dzkcc-mflow/scripts/generate-type-map.js
 */

// Model 导入
import { UserModel } from '../src/models/UserModel';

// Manager 导入
import { GameManager } from '../src/managers/GameManager';

// Names 导入
import { ModelNames, ManagerNames } from 'dzkcc-mflow/core';

declare module 'dzkcc-mflow/core' {
    interface ModelTypeMap {
        [ModelNames.User]: UserModel;
    }

    interface ManagerTypeMap {
        [ManagerNames.Game]: GameManager;
    }
}
```

### 使用类型推断

有了类型映射后，就可以享受完整的类型推断：

```typescript
import { Core, ModelNames, ManagerNames } from 'dzkcc-mflow/core';

// 自动推断为 UserModel 类型
const userModel = Core.getModel(ModelNames.User);
userModel.userName = 'Player1';  // ✅ 类型安全
userModel.level = 10;            // ✅ 类型安全

// 自动推断为 GameManager 类型
const gameManager = Core.getManager(ManagerNames.Game);
gameManager.start();  // ✅ 类型安全
```

## 常见问题

### Q: 生成后提示"未找到任何 Model 或 Manager"

**A:** 检查以下几点：
1. 确保类上正确使用了 `@model('Name')` 或 `@manager('Name')` 装饰器
2. 确保目录路径配置正确
3. 确保装饰器名称用引号包裹，如 `@model('User')`

### Q: 生成的类型文件路径不对

**A:** 在 package.json 或 mflow.config.json 中配置正确的 `outputFile` 路径

### Q: 新增 Model/Manager 后类型推断不生效

**A:** 每次新增或修改装饰器后，需要重新运行类型生成工具

### Q: 可以配置多个目录吗？

**A:** 当前版本仅支持单个 Model 目录和单个 Manager 目录，但可以在这些目录下创建子目录，工具会递归扫描

## 最佳实践

1. **统一目录结构**：建议将所有 Model 放在一个目录下，所有 Manager 放在另一个目录下
2. **规范命名**：装饰器名称建议使用 PascalCase，与类名保持一致
3. **自动化**：可以将类型生成命令添加到 git pre-commit 钩子中，确保类型始终是最新的
4. **版本控制**：生成的类型文件应该提交到版本控制系统中

## 相关文档

- [类型推断详细说明](./TYPE_INFERENCE.md)
- [装饰器使用指南](./DECORATORS.md)
- [核心概念](./CORE_CONCEPTS.md)

