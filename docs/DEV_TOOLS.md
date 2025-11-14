# 开发工具

框架配套了 Cocos Creator 编辑器插件 `mflow-tools`，用于提升开发效率。

## 功能特性

✨ **自动生成 UI 脚本** - 根据 Prefab 自动生成基础视图类  
✨ **自动引用组件** - 自动设置 `@property` 引用  
✨ **自动挂载脚本** - 自动将脚本挂载到 Prefab  
✨ **命名约定识别** - 通过节点命名自动识别组件类型  

## 命名约定

在 Prefab 中，将需要引用的节点重命名为 `#属性名#组件类型` 格式：

```
#titleLabel#Label      -> 引用 Label 组件
#closeButton#Button    -> 引用 Button 组件
#avatarSprite#Sprite   -> 引用 Sprite 组件
#contentNode           -> 引用 Node 节点（省略组件类型）
#listView#ScrollView   -> 引用 ScrollView 组件
```

### 支持的组件类型

| 命名 | 组件类型 | 示例 |
|------|----------|------|
| `Label` | cc.Label | `#scoreLabel#Label` |
| `Button` | cc.Button | `#startButton#Button` |
| `Sprite` | cc.Sprite | `#iconSprite#Sprite` |
| `Node` | cc.Node | `#containerNode` (可省略) |
| `EditBox` | cc.EditBox | `#inputEdit#EditBox` |
| `ScrollView` | cc.ScrollView | `#listView#ScrollView` |
| `RichText` | cc.RichText | `#contentRich#RichText` |
| `Layout` | cc.Layout | `#gridLayout#Layout` |
| `Toggle` | cc.Toggle | `#soundToggle#Toggle` |
| `Slider` | cc.Slider | `#volumeSlider#Slider` |
| `ProgressBar` | cc.ProgressBar | `#hpBar#ProgressBar` |

## 使用方法

### 步骤 1：设置节点命名

在 Cocos Creator 编辑器中创建 Prefab，将需要引用的节点按照命名约定重命名：

```
HomeView (Prefab 根节点)
├── #titleLabel#Label
├── #contentNode
│   ├── #avatarSprite#Sprite
│   └── #nameLabel#Label
└── #closeButton#Button
```

### 步骤 2：导出脚本

在 Hierarchy 面板中右键点击 Prefab 根节点，选择：
```
MFlow Tools → 导出到脚本
```

### 步骤 3：自动生成

插件会自动生成两个文件：

#### BaseHomeView.ts（基础类，由工具生成）

```typescript
import { _decorator, Label, Node, Sprite, Button } from 'cc';
import { BaseView } from 'dzkcc-mflow/libs';

const { ccclass, property } = _decorator;

/**
 * 此文件由 MFlow Tools 自动生成，请勿手动修改
 * 如需修改，请在 HomeView.ts 中实现
 */
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

#### HomeView.ts（业务类，手动实现）

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
        this.titleLabel.string = '欢迎';
        this.closeButton.node.on('click', this.onCloseClick, this);
    }
    
    onExit(): void {}
    onPause(): void {}
    onResume(): void {}
    
    private onCloseClick(): void {
        mf.gui.close(this);
    }
}
```

### 步骤 4：脚本自动挂载

插件会自动将生成的脚本挂载到 Prefab 上，并设置好所有组件引用。
- ***`ps：这里需要注意，脚本需要在UITransform组件下面才能被正确设置属性。`***

## 完整示例

### 示例 1：简单对话框

Prefab 结构：
```
DialogView
├── Background
├── #titleLabel#Label
├── #contentLabel#Label
└── #confirmButton#Button
```

生成的基类：
```typescript
@ccclass('BaseDialogView')
export abstract class BaseDialogView extends BaseView {
    /** @internal */
    private static readonly __path__: string = 'ui/dialog';
    
    @property(Label) titleLabel: Label = null!;
    @property(Label) contentLabel: Label = null!;
    @property(Button) confirmButton: Button = null!;
    
    abstract onEnter(args?: any): void;
    abstract onExit(): void;
    abstract onPause(): void;
    abstract onResume(): void;
}
```

业务实现：
```typescript
@view('Dialog')
@ccclass('DialogView')
export class DialogView extends BaseDialogView {
    onEnter(args?: any): void {
        this.titleLabel.string = args?.title || '提示';
        this.contentLabel.string = args?.content || '';
        this.confirmButton.node.on('click', this.onConfirm, this);
    }
    
    onExit(): void {}
    onPause(): void {}
    onResume(): void {}
    
    private onConfirm(): void {
        mf.gui.close(this);
    }
}
```

### 示例 2：游戏 HUD

Prefab 结构：
```
GameHUD
├── TopBar
│   ├── #scoreLabel#Label
│   ├── #goldLabel#Label
│   └── #lifeLabel#Label
├── #skillButton1#Button
├── #skillButton2#Button
└── #pauseButton#Button
```

生成的基类：
```typescript
@ccclass('BaseGameHUD')
export abstract class BaseGameHUD extends BaseView {
    /** @internal */
    private static readonly __path__: string = 'ui/game-hud';
    
    @property(Label) scoreLabel: Label = null!;
    @property(Label) goldLabel: Label = null!;
    @property(Label) lifeLabel: Label = null!;
    @property(Button) skillButton1: Button = null!;
    @property(Button) skillButton2: Button = null!;
    @property(Button) pauseButton: Button = null!;
    
    abstract onEnter(args?: any): void;
    abstract onExit(): void;
    abstract onPause(): void;
    abstract onResume(): void;
}
```

业务实现：
```typescript
@view('GameHUD')
@ccclass('GameHUD')
export class GameHUD extends BaseGameHUD {
    onEnter(args?: any): void {
        // 监听游戏事件
        this.event.on('scoreChanged', this.onScoreChanged, this);
        this.event.on('goldChanged', this.onGoldChanged, this);
        this.event.on('lifeChanged', this.onLifeChanged, this);
        
        // 监听按钮点击
        this.skillButton1.node.on('click', this.onSkill1Click, this);
        this.skillButton2.node.on('click', this.onSkill2Click, this);
        this.pauseButton.node.on('click', this.onPauseClick, this);
        
        // 初始化显示
        this.updateUI();
    }
    
    onExit(): void {}
    onPause(): void {}
    onResume(): void {}
    
    private updateUI(): void {
        const gameModel = this.getModel(ModelNames.Game);
        this.scoreLabel.string = `${gameModel.score}`;
        this.goldLabel.string = `${gameModel.gold}`;
        this.lifeLabel.string = `${gameModel.life}`;
    }
    
    private onScoreChanged(score: number): void {
        this.scoreLabel.string = `${score}`;
    }
    
    private onGoldChanged(gold: number): void {
        this.goldLabel.string = `${gold}`;
    }
    
    private onLifeChanged(life: number): void {
        this.lifeLabel.string = `${life}`;
    }
    
    private onSkill1Click(): void {
        const gameManager = this.getManager(ManagerNames.Game);
        gameManager.useSkill(1);
    }
    
    private onSkill2Click(): void {
        const gameManager = this.getManager(ManagerNames.Game);
        gameManager.useSkill(2);
    }
    
    private onPauseClick(): void {
        mf.gui.open(ViewNames.Pause);
    }
}
```

## 工作流程

1. **设计 UI**：在 Cocos Creator 中设计界面
2. **命名节点**：按照约定命名需要引用的节点
3. **导出脚本**：右键选择 "MFlow Tools → 导出到脚本"
4. **实现逻辑**：在生成的业务类中实现逻辑
5. **修改 UI**：UI 改动后，重新导出即可更新基类

## 优势

### 1. 减少重复代码

**不使用工具**：
```typescript
@ccclass('HomeView')
export class HomeView extends BaseView {
    @property(Label) titleLabel: Label = null!;
    @property(Label) nameLabel: Label = null!;
    @property(Label) scoreLabel: Label = null!;
    @property(Button) startButton: Button = null!;
    @property(Button) closeButton: Button = null!;
    @property(Sprite) avatarSprite: Sprite = null!;
    // ... 手动声明所有组件
    
    onEnter(): void { /* 业务逻辑 */ }
    onExit(): void {}
    onPause(): void {}
    onResume(): void {}
}
```

**使用工具**：
```typescript
// BaseHomeView.ts 自动生成，包含所有组件声明

// HomeView.ts 只需要实现业务逻辑
@view('Home')
@ccclass('HomeView')
export class HomeView extends BaseHomeView {
    onEnter(): void {
        // 直接使用，无需声明
        this.titleLabel.string = '标题';
    }
    
    onExit(): void {}
    onPause(): void {}
    onResume(): void {}
}
```

### 2. UI 改动轻松同步

UI 改动后，重新导出即可：
- 新增组件 → 基类自动添加
- 删除组件 → 基类自动移除
- 业务代码不受影响

### 3. 避免手动绑定错误

- 自动设置组件引用
- 避免拼写错误
- 避免忘记绑定

## 注意事项

1. **不要修改基类**：
   - 基类由工具生成，手动修改会被覆盖
   - 所有业务逻辑在业务类中实现

2. **命名规范**：
   - 节点命名必须符合约定
   - 属性名使用驼峰命名法
   - 避免使用保留字

3. **Prefab 路径**：
   - 生成的 `__path__` 基于 Prefab 在 resources 中的路径
   - 确保路径正确，否则无法加载

4. **重新生成**：
   - UI 改动后需要重新导出
   - 业务类不会被覆盖
   - 只有基类会被重新生成

## 配置

插件配置文件在 `mflow-tools/config.json`：

```json
{
  "outputDir": "assets/scripts/views",
  "baseClassSuffix": "Base",
  "autoMount": true,
  "autoReference": true
}
```

- `outputDir`: 生成脚本的输出目录
- `baseClassSuffix`: 基类后缀名
- `autoMount`: 是否自动挂载脚本
- `autoReference`: 是否自动设置组件引用

