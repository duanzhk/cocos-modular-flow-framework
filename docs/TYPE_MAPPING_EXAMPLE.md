# 类型映射配置示例

这是一个完整的类型映射配置示例，展示如何在业务项目中配置类型映射以获得完整的类型提示。

## 项目结构

```
your-game-project/
  assets/
    src/
      types/
        api-type-hints.d.ts          ← 类型映射文件
      models/
        UserModel.ts
        ScoreModel.ts
      managers/
        HomeMgr.ts
        GameMgr.ts
        AudioMgr.ts
      views/
        HomeView.ts
        GameView.ts
```

## 完整的类型映射文件

```typescript
// assets/src/types/api-type-hints.d.ts

// 1. 导入所有需要类型映射的类
import { HomeMgr } from '../managers/HomeMgr';
import { GameMgr } from '../managers/GameMgr';
import { AudioMgr } from '../managers/AudioMgr';
import { UserModel } from '../models/UserModel';
import { ScoreModel } from '../models/ScoreModel';
import { HomeView } from '../views/HomeView';
import { GameView } from '../views/GameView';

// 2. 扩展框架的类型定义
declare module 'dzkcc-mflow/core' {
    // ========================================
    // ManagerNames 类型定义（提供代码补全）
    // ========================================
    interface ManagerNamesType {
        HomeMgr: symbol;
        GameMgr: symbol;
        AudioMgr: symbol;
    }
    
    // ========================================
    // ManagerTypeMap 类型映射（提供类型推断）
    // ========================================
    interface ManagerTypeMap {
        'HomeMgr': HomeMgr;
        'GameMgr': GameMgr;
        'AudioMgr': AudioMgr;
    }
    
    // ========================================
    // ModelNames 类型定义（提供代码补全）
    // ========================================
    interface ModelNamesType {
        UserModel: symbol;
        ScoreModel: symbol;
    }
    
    // ========================================
    // ModelTypeMap 类型映射（提供类型推断）
    // ========================================
    interface ModelTypeMap {
        'UserModel': UserModel;
        'ScoreModel': ScoreModel;
    }
    
    // ========================================
    // ViewNames 类型定义（提供代码补全）
    // ========================================
    interface ViewNamesType {
        Home: symbol;
        Game: symbol;
    }
}
```

## Manager 示例

```typescript
// assets/src/managers/HomeMgr.ts
import { AbstractManager, manager } from 'dzkcc-mflow/core';

@manager('HomeMgr')  // ← 注意：这里的名称要和类型映射中的 key 一致
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
    
    public getHomeData(): { title: string; level: number } {
        return { title: '首页', level: 1 };
    }
}
```

```typescript
// assets/src/managers/GameMgr.ts
import { AbstractManager, manager, ModelNames } from 'dzkcc-mflow/core';

@manager('GameMgr')
export class GameMgr extends AbstractManager {
    private score: number = 0;
    
    initialize(): void {
        console.log('GameMgr initialized');
    }
    
    public startGame(): void {
        console.log('Game started');
        this.score = 0;
        
        // ✅ 访问 Model 时也有类型推断
        const userModel = this.getModel(ModelNames.UserModel);
        console.log('User name:', userModel.name);
    }
    
    public addScore(points: number): void {
        this.score += points;
    }
    
    public getScore(): number {
        return this.score;
    }
}
```

## Model 示例

```typescript
// assets/src/models/UserModel.ts
import { IModel, model } from 'dzkcc-mflow/core';

@model('UserModel')  // ← 注意：这里的名称要和类型映射中的 key 一致
export class UserModel implements IModel {
    public name: string = '';
    public level: number = 1;
    public exp: number = 0;
    
    initialize(): void {
        console.log('UserModel initialized');
        this.name = 'Player';
    }
    
    public levelUp(): void {
        this.level++;
        this.exp = 0;
    }
}
```

```typescript
// assets/src/models/ScoreModel.ts
import { IModel, model } from 'dzkcc-mflow/core';

@model('ScoreModel')
export class ScoreModel implements IModel {
    public currentScore: number = 0;
    public highScore: number = 0;
    
    initialize(): void {
        console.log('ScoreModel initialized');
        this.loadHighScore();
    }
    
    private loadHighScore(): void {
        // 从本地存储加载最高分
        const saved = localStorage.getItem('highScore');
        this.highScore = saved ? parseInt(saved) : 0;
    }
    
    public updateScore(score: number): void {
        this.currentScore = score;
        if (score > this.highScore) {
            this.highScore = score;
            localStorage.setItem('highScore', score.toString());
        }
    }
}
```

## 使用示例

### 在 View 中使用

```typescript
// assets/src/views/HomeView.ts
import { BaseView, view } from 'dzkcc-mflow/libs';
import { ManagerNames, ModelNames } from 'dzkcc-mflow/core';

@view('Home')
export class HomeView extends BaseView {
    onEnter(args?: any): void {
        // ✅ 完整的类型推断和代码补全
        const homeMgr = mf.core.getManager(ManagerNames.HomeMgr);
        const userModel = mf.core.getModel(ModelNames.UserModel);
        
        // ✅ 所有方法都有代码补全
        homeMgr.showHome();
        const data = homeMgr.getHomeData();
        console.log(data.title, data.level);
        
        // ✅ 所有属性都有代码补全
        console.log('User:', userModel.name, 'Level:', userModel.level);
        
        // ✅ TypeScript 会检查类型错误
        // homeMgr.nonExistentMethod();  // ❌ 编译错误
        // userModel.nonExistentProperty;  // ❌ 编译错误
    }
    
    onExit(): void {
        const homeMgr = mf.core.getManager(ManagerNames.HomeMgr);
        homeMgr.hideHome();
    }
    
    onPause(): void {}
    onResume(): void {}
}
```

### 在 Manager 中使用

```typescript
// assets/src/managers/GameMgr.ts
import { AbstractManager, manager, ManagerNames, ModelNames } from 'dzkcc-mflow/core';

@manager('GameMgr')
export class GameMgr extends AbstractManager {
    initialize(): void {}
    
    public startNewGame(): void {
        // ✅ 访问其他 Manager 时有类型推断
        const audioMgr = this.getManager(ManagerNames.AudioMgr);
        audioMgr.playBGM('game');
        
        // ✅ 访问 Model 时有类型推断
        const userModel = this.getModel(ModelNames.UserModel);
        const scoreModel = this.getModel(ModelNames.ScoreModel);
        
        console.log(`${userModel.name} (Lv.${userModel.level}) started new game`);
        scoreModel.updateScore(0);
    }
    
    public onGameOver(): void {
        const audioMgr = this.getManager(ManagerNames.AudioMgr);
        audioMgr.stopBGM();
        
        const scoreModel = this.getModel(ModelNames.ScoreModel);
        console.log('Final score:', scoreModel.currentScore);
        console.log('High score:', scoreModel.highScore);
    }
}
```

### 全局访问

```typescript
// 在任何地方都可以通过 mf 全局对象访问

// ✅ 有完整的类型推断
const homeMgr = mf.core.getManager(ManagerNames.HomeMgr);
const gameMgr = mf.core.getManager(ManagerNames.GameMgr);
const userModel = mf.core.getModel(ModelNames.UserModel);

// ✅ 所有方法都有代码补全
homeMgr.showHome();
gameMgr.startGame();
userModel.levelUp();
```

## 关键点总结

### 1. 装饰器名称必须匹配

```typescript
// Manager 类
@manager('HomeMgr')  // ← 这个名称
export class HomeMgr extends AbstractManager {}

// 类型映射
interface ManagerTypeMap {
    'HomeMgr': HomeMgr;  // ← 必须完全匹配
}
```

### 2. 如果装饰器不指定名称，使用类名

```typescript
// Manager 类
@manager()  // ← 没有指定名称
export class HomeMgr extends AbstractManager {}

// 类型映射（使用类名）
interface ManagerTypeMap {
    'HomeMgr': HomeMgr;  // ← 使用类名
}
```

### 3. 类型映射提供两种功能

```typescript
// 功能 1：代码补全（输入 ManagerNames. 时显示所有 Manager）
interface ManagerNamesType {
    HomeMgr: symbol;  // ← 提供 ManagerNames.HomeMgr 的代码补全
}

// 功能 2：类型推断（getManager 返回具体类型）
interface ManagerTypeMap {
    'HomeMgr': HomeMgr;  // ← 让 getManager(ManagerNames.HomeMgr) 返回 HomeMgr 类型
}
```

## 自动生成

不要手动维护类型映射文件！使用框架提供的自动生成工具：

**Cocos Creator 编辑器菜单：mflow-tools → Generate API type hints/生成API类型提示**

工具会自动：
- ✅ 扫描所有使用 `@manager()`、`@model()`、`@view()` 的类
- ✅ 生成完整的类型映射文件
- ✅ 自动处理装饰器名称匹配
- ✅ 不会遗漏任何类

## 常见错误

### 错误 1：名称不匹配

```typescript
// ❌ 错误
@manager('Home')  // 装饰器用的是 'Home'
export class HomeMgr extends AbstractManager {}

interface ManagerTypeMap {
    'HomeMgr': HomeMgr;  // 类型映射用的是 'HomeMgr'
}

// ✅ 正确（两边保持一致）
@manager('HomeMgr')
export class HomeMgr extends AbstractManager {}

interface ManagerTypeMap {
    'HomeMgr': HomeMgr;
}
```

### 错误 2：忘记导入类

```typescript
// ❌ 错误
declare module 'dzkcc-mflow/core' {
    interface ManagerTypeMap {
        'HomeMgr': HomeMgr;  // ❌ HomeMgr 未定义
    }
}

// ✅ 正确
import { HomeMgr } from '../managers/HomeMgr';  // ← 先导入

declare module 'dzkcc-mflow/core' {
    interface ManagerTypeMap {
        'HomeMgr': HomeMgr;  // ✅ 正确
    }
}
```

### 错误 3：忘记重启 TS 服务

修改类型映射文件后，需要重启 TypeScript 语言服务：

**VS Code**: `Cmd+Shift+P` → "TypeScript: Restart TS Server"

## 验证类型推断

### 测试 1：悬停查看类型

```typescript
const mgr = mf.core.getManager(ManagerNames.HomeMgr);
//    ↑ 悬停在 mgr 上，应该显示 "const mgr: HomeMgr"
```

### 测试 2：代码补全

```typescript
const mgr = mf.core.getManager(ManagerNames.HomeMgr);
mgr.  // ← 输入点后，应该显示 HomeMgr 的所有方法
```

### 测试 3：类型检查

```typescript
const mgr = mf.core.getManager(ManagerNames.HomeMgr);
mgr.nonExistentMethod();  // ❌ TypeScript 应该报错
```

## 总结

配置类型映射后，您将获得：

✅ **自动类型推断** - 无需手动指定泛型  
✅ **完整代码补全** - IDE 提供智能提示  
✅ **编译时类型检查** - 在编译时发现错误  
✅ **更好的重构支持** - 重命名时自动更新  
✅ **保持代码解耦** - 无需 import 具体的类

最重要的是：**使用自动生成工具，不要手动维护！**

