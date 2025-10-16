# 类型推断完整示例

本文档展示类型自动推断的完整工作流程和示例。

## 工作原理

### 1. 定义 Model/Manager

```typescript
// assets/src/models/UserModel.ts
import { model } from 'dzkcc-mflow/core';

@model('User')
export class UserModel {
    userName: string = '';
    level: number = 0;
    
    addExp(exp: number) {
        console.log(`Adding ${exp} exp`);
    }
}
```

```typescript
// assets/src/managers/GameManager.ts
import { manager } from 'dzkcc-mflow/core';
import { AbstractManager } from 'dzkcc-mflow/core';

@manager('Game')
export class GameManager extends AbstractManager {
    initialize(): void {
        console.log('GameManager initialized');
    }
    
    startGame() {
        console.log('Game started');
    }
}
```

### 2. 生成类型映射文件

在 Cocos Creator 编辑器中：
- 点击菜单：**mflow-tools -> Generate decorator mapping**

这会生成 `assets/types/api-type-hints.d.ts` 文件：

```typescript
/**
 * 自动生成的类型映射文件
 * ⚠️ 请勿手动修改此文件！
 * 重新生成：在 Cocos Creator 编辑器中运行 mflow-tools -> Generate API type hints/生成API类型提示
 */

// Model 导入
import { UserModel } from '../src/models/UserModel';

// Manager 导入
import { GameManager } from '../src/managers/GameManager';

// Names 导入
import { ModelNames, ManagerNames } from 'dzkcc-mflow/core';

declare module 'dzkcc-mflow/core' {
    interface ModelNamesType {
        User: symbol;
    }

    interface ManagerNamesType {
        Game: symbol;
    }

    interface ModelTypeMap {
        'User': UserModel;
    }

    interface ManagerTypeMap {
        'Game': GameManager;
    }
}
```

### 3. 使用（享受完整的类型提示）✨

```typescript
import { Core, ModelNames, ManagerNames } from 'dzkcc-mflow/core';

// ✅ 自动推断为 UserModel 类型
const userModel = core.getModel(ModelNames.User);

// ✅ 完整的代码补全
userModel.userName = 'Player1';  // ✅ 类型安全
userModel.level = 10;             // ✅ 类型安全
userModel.addExp(100);            // ✅ 方法补全

// ✅ 自动推断为 GameManager 类型
const gameManager = core.getManager(ManagerNames.Game);

// ✅ 完整的代码补全
gameManager.startGame();          // ✅ 方法补全
gameManager.initialize();         // ✅ 继承的方法也有补全
```

## 类型推断的实现原理

### 类型推断链

```
ModelNames.User (symbol 值)
    ↓ (GetKeyFromSymbol 类型推断)
'User' (string 字面量)
    ↓ (ModelTypeMap 查找)
UserModel (具体类型)
```

### 核心类型定义

```typescript
// 1. Names 接口（通过生成的文件扩展）
interface ModelNamesType {
    User: symbol;
    Game: symbol;
}

// 2. 类型映射（通过生成的文件扩展）
interface ModelTypeMap {
    'User': UserModel;
    'Game': GameModel;
}

// 3. 类型推断辅助
type GetKeyFromSymbol<S extends symbol, Names extends Record<string, symbol>> = {
    [K in keyof Names]: Names[K] extends S ? K : never
}[keyof Names];

type InferModelType<S extends symbol> = 
    GetKeyFromSymbol<S, typeof ModelNames> extends keyof ModelTypeMap 
        ? ModelTypeMap[GetKeyFromSymbol<S, typeof ModelNames>]
        : IModel;

// 4. 应用到 getModel
getModel<S extends symbol>(modelSymbol: S): InferModelType<S>
```

## 配置文件

如果项目目录结构不同，可以在 `package.json` 中配置：

```json
{
  "mflowTypeGen": {
    "modelDir": "assets/scripts/models",
    "managerDir": "assets/scripts/managers",
    "outputFile": "assets/scripts/types/manager-model-mapping.d.ts",
    "moduleImportPath": "dzkcc-mflow/core"
  }
}
```

或创建 `mflow.config.json`：

```json
{
  "modelDir": "assets/scripts/models",
  "managerDir": "assets/scripts/managers",
  "outputFile": "assets/scripts/types/manager-model-mapping.d.ts",
  "moduleImportPath": "dzkcc-mflow/core"
}
```

## 故障排除

### 问题 1：没有代码提示

**检查清单：**

1. ✅ 确保已生成类型映射文件
   - 文件路径：`assets/types/api-type-hints.d.ts`
   - 或自定义路径

2. ✅ 确保 TypeScript 包含了类型文件
   ```json
   // tsconfig.json
   {
     "include": [
       "assets/**/*",
       "assets/types/**/*"
     ]
   }
   ```

3. ✅ 重启 TypeScript 语言服务
   - VS Code: `Cmd+Shift+P` → "TypeScript: Restart TS Server"

4. ✅ 检查生成的文件格式
   - 应该使用字符串字面量：`'User': UserModel`
   - 而不是：`[ModelNames.User]: UserModel` ❌

### 问题 2：类型不匹配

确保：
- 装饰器名称与生成的映射一致
- 类名正确导出
- 文件路径正确

### 问题 3：新增 Model/Manager 后无提示

**解决方案：**
1. 重新生成类型映射（编辑器菜单：mflow-tools -> Generate decorator mapping）
2. 重启 TS Server

## 最佳实践

1. **保持同步**：每次新增或修改 Model/Manager 后，立即重新生成类型映射

2. **版本控制**：将生成的 `.d.ts` 文件提交到 Git

3. **团队协作**：确保团队成员都知道在修改 Model/Manager 后需要重新生成类型

4. **命名规范**：
   - 装饰器名称使用 PascalCase：`@model('User')`
   - 类名与装饰器名称一致：`class UserModel`

## 相关文档

- [类型推断详解](./TYPE_INFERENCE.md)
- [类型生成工具](./TYPE_GENERATION.md)
- [装饰器系统](./DECORATORS.md)

