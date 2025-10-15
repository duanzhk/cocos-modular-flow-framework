# 完整示例

这个示例展示了一个简单的塔防游戏，演示框架的完整使用流程。

## 项目结构

```
assets/
├── scripts/
│   ├── GameCore.ts              # 游戏入口
│   ├── managers/
│   │   ├── GameManager.ts       # 游戏管理器
│   │   └── AudioManager.ts      # 音频管理器
│   ├── models/
│   │   ├── GameModel.ts         # 游戏数据模型
│   │   └── PlayerModel.ts       # 玩家数据模型
│   ├── views/
│   │   ├── HomeView.ts          # 主界面
│   │   ├── GameView.ts          # 游戏界面
│   │   └── ResultView.ts        # 结算界面
│   └── types/
│       └── core-types.d.ts      # 类型映射
└── resources/
    └── prefabs/
        └── ui/
            ├── home.prefab
            ├── game.prefab
            └── result.prefab
```

## GameCore.ts - 游戏入口

```typescript
import { CocosCore } from 'dzkcc-mflow/libs';
import { _decorator } from 'cc';

// 导入所有模块（使用装饰器后会自动注册）
import './managers/GameManager';
import './managers/AudioManager';
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

## Model 定义

### GameModel.ts

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
    
    spendGold(value: number): boolean {
        if (this._gold >= value) {
            this._gold -= value;
            return true;
        }
        return false;
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

### PlayerModel.ts

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

## Manager 定义

### GameManager.ts

```typescript
import { manager, AbstractManager, ManagerNames, ModelNames } from 'dzkcc-mflow/core';

@manager('Game')
export class GameManager extends AbstractManager {
    initialize(): void {
        console.log('GameManager 初始化');
    }
    
    startGame(level: number): void {
        // 重置游戏数据
        const gameModel = this.getModel(ModelNames.Game);
        gameModel.reset();
        gameModel.level = level;
        
        // 派发游戏开始事件
        this.getEventManager().dispatch('gameStart', { level });
    }
    
    killEnemy(enemyType: string): void {
        const gameModel = this.getModel(ModelNames.Game);
        
        // 增加分数和金币
        const reward = this.getEnemyReward(enemyType);
        gameModel.addScore(reward.score);
        gameModel.addGold(reward.gold);
        
        // 派发事件
        this.getEventManager().dispatch('enemyKilled', {
            enemyType,
            score: gameModel.score,
            gold: gameModel.gold
        });
    }
    
    enemyEscape(): void {
        const gameModel = this.getModel(ModelNames.Game);
        
        // 减少生命
        gameModel.loseLife(1);
        
        // 派发事件
        this.getEventManager().dispatch('lifeChanged', gameModel.life);
        
        // 检查游戏是否结束
        if (gameModel.life <= 0) {
            this.gameOver();
        }
    }
    
    buildTower(towerType: string, cost: number): boolean {
        const gameModel = this.getModel(ModelNames.Game);
        
        // 检查金币是否足够
        if (gameModel.spendGold(cost)) {
            this.getEventManager().dispatch('towerBuilt', { towerType, cost });
            return true;
        }
        
        return false;
    }
    
    private gameOver(): void {
        const gameModel = this.getModel(ModelNames.Game);
        const playerModel = this.getModel(ModelNames.Player);
        
        // 更新最高分
        playerModel.updateHighScore(gameModel.score);
        
        // 派发游戏结束事件
        this.getEventManager().dispatch('gameOver', {
            score: gameModel.score,
            highScore: playerModel.highScore
        });
    }
    
    private getEnemyReward(enemyType: string): { score: number; gold: number } {
        const rewards: Record<string, { score: number; gold: number }> = {
            'small': { score: 10, gold: 5 },
            'medium': { score: 20, gold: 10 },
            'large': { score: 50, gold: 25 }
        };
        return rewards[enemyType] || rewards['small'];
    }
}
```

### AudioManager.ts

```typescript
import { manager, AbstractManager } from 'dzkcc-mflow/core';
import { AudioSource } from 'cc';

@manager('Audio')
export class AudioManager extends AbstractManager {
    private bgmSource: AudioSource = null!;
    private sfxSource: AudioSource = null!;
    private bgmVolume: number = 0.5;
    private sfxVolume: number = 0.8;
    
    initialize(): void {
        console.log('AudioManager 初始化');
        this.loadSettings();
    }
    
    playBGM(clipName: string): void {
        // 加载并播放背景音乐
        mf.res.loadAsset(`audio/${clipName}`, cc.AudioClip).then(clip => {
            if (this.bgmSource) {
                this.bgmSource.clip = clip;
                this.bgmSource.loop = true;
                this.bgmSource.volume = this.bgmVolume;
                this.bgmSource.play();
            }
        });
    }
    
    playSFX(clipName: string): void {
        // 加载并播放音效
        mf.res.loadAsset(`audio/${clipName}`, cc.AudioClip).then(clip => {
            if (this.sfxSource) {
                this.sfxSource.playOneShot(clip, this.sfxVolume);
            }
        });
    }
    
    stopBGM(): void {
        if (this.bgmSource) {
            this.bgmSource.stop();
        }
    }
    
    setBGMVolume(volume: number): void {
        this.bgmVolume = volume;
        if (this.bgmSource) {
            this.bgmSource.volume = volume;
        }
        this.saveSettings();
    }
    
    setSFXVolume(volume: number): void {
        this.sfxVolume = volume;
        this.saveSettings();
    }
    
    private loadSettings(): void {
        const settings = localStorage.getItem('audioSettings');
        if (settings) {
            const parsed = JSON.parse(settings);
            this.bgmVolume = parsed.bgmVolume || 0.5;
            this.sfxVolume = parsed.sfxVolume || 0.8;
        }
    }
    
    private saveSettings(): void {
        localStorage.setItem('audioSettings', JSON.stringify({
            bgmVolume: this.bgmVolume,
            sfxVolume: this.sfxVolume
        }));
    }
    
    dispose(): void {
        this.stopBGM();
    }
}
```

## View 定义

### HomeView.ts

```typescript
import { view, ViewNames, ModelNames, ManagerNames } from 'dzkcc-mflow/core';
import { BaseView } from 'dzkcc-mflow/libs';
import { _decorator, Button, Label } from 'cc';

const { ccclass, property } = _decorator;

@view('Home')
@ccclass('HomeView')
export class HomeView extends BaseView {
    /** @internal */
    private static readonly __path__: string = 'ui/home';
    
    @property(Label)
    welcomeLabel: Label = null!;
    
    @property(Label)
    highScoreLabel: Label = null!;
    
    @property(Button)
    startButton: Button = null!;
    
    onEnter(args?: any): void {
        // 获取 Model
        const playerModel = this.getModel(ModelNames.Player);
        
        // 更新 UI
        this.welcomeLabel.string = `欢迎, ${playerModel.name || '玩家'}!`;
        this.highScoreLabel.string = `最高分: ${playerModel.highScore}`;
        
        // 监听按钮点击
        this.startButton.node.on(Button.EventType.CLICK, this.onStartClick, this);
        
        // 播放背景音乐
        const audioManager = this.getManager(ManagerNames.Audio);
        audioManager.playBGM('menu');
    }
    
    onExit(): void {}
    onPause(): void {}
    onResume(): void {}
    
    private async onStartClick(): Promise<void> {
        // 播放点击音效
        const audioManager = this.getManager(ManagerNames.Audio);
        audioManager.playSFX('click');
        
        // 关闭主界面
        mf.gui.close(ViewNames.Home);
        
        // 打开游戏界面
        await mf.gui.open(ViewNames.Game, { level: 1 });
    }
}
```

### GameView.ts

```typescript
import { view, ViewNames, ManagerNames, ModelNames } from 'dzkcc-mflow/core';
import { BaseView } from 'dzkcc-mflow/libs';
import { _decorator, Label, Node, Button } from 'cc';

const { ccclass, property } = _decorator;

@view('Game')
@ccclass('GameView')
export class GameView extends BaseView {
    /** @internal */
    private static readonly __path__: string = 'ui/game';
    
    @property(Label)
    scoreLabel: Label = null!;
    
    @property(Label)
    goldLabel: Label = null!;
    
    @property(Label)
    lifeLabel: Label = null!;
    
    @property(Node)
    gameContainer: Node = null!;
    
    @property(Button)
    pauseButton: Button = null!;
    
    onEnter(args?: any): void {
        // 获取 Manager
        const gameManager = this.getManager(ManagerNames.Game);
        const audioManager = this.getManager(ManagerNames.Audio);
        
        // 监听游戏事件（会自动清理）
        this.event.on('enemyKilled', this.onEnemyKilled, this);
        this.event.on('lifeChanged', this.onLifeChanged, this);
        this.event.on('gameOver', this.onGameOver, this);
        
        // 监听按钮
        this.pauseButton.node.on(Button.EventType.CLICK, this.onPauseClick, this);
        
        // 开始游戏
        const level = args?.level || 1;
        gameManager.startGame(level);
        
        // 播放游戏音乐
        audioManager.playBGM('game');
        
        // 更新 UI
        this.updateUI();
    }
    
    onExit(): void {}
    onPause(): void {}
    onResume(): void {}
    
    private onEnemyKilled(data: any): void {
        // 播放音效
        const audioManager = this.getManager(ManagerNames.Audio);
        audioManager.playSFX('kill');
        
        // 更新 UI
        this.updateUI();
    }
    
    private onLifeChanged(life: number): void {
        this.lifeLabel.string = `生命: ${life}`;
        
        // 播放音效
        const audioManager = this.getManager(ManagerNames.Audio);
        audioManager.playSFX('damage');
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
    
    private onPauseClick(): void {
        // 暂停游戏逻辑...
        console.log('游戏暂停');
    }
    
    private updateUI(): void {
        const gameModel = this.getModel(ModelNames.Game);
        this.scoreLabel.string = `分数: ${gameModel.score}`;
        this.goldLabel.string = `金币: ${gameModel.gold}`;
        this.lifeLabel.string = `生命: ${gameModel.life}`;
    }
}
```

### ResultView.ts

```typescript
import { view, ViewNames } from 'dzkcc-mflow/core';
import { BaseView } from 'dzkcc-mflow/libs';
import { _decorator, Button, Label } from 'cc';

const { ccclass, property } = _decorator;

@view('Result')
@ccclass('ResultView')
export class ResultView extends BaseView {
    /** @internal */
    private static readonly __path__: string = 'ui/result';
    
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

## 类型映射

### types/core-types.d.ts

```typescript
import { GameModel } from '../models/GameModel';
import { PlayerModel } from '../models/PlayerModel';
import { GameManager } from '../managers/GameManager';
import { AudioManager } from '../managers/AudioManager';
import { ModelNames, ManagerNames } from 'dzkcc-mflow/core';

declare module 'dzkcc-mflow/core' {
    interface ModelTypeMap {
        [ModelNames.Game]: GameModel;
        [ModelNames.Player]: PlayerModel;
    }
    
    interface ManagerTypeMap {
        [ManagerNames.Game]: GameManager;
        [ManagerNames.Audio]: AudioManager;
    }
}
```

## 运行结果

```
GameModel 初始化
PlayerModel 初始化
GameManager 初始化
AudioManager 初始化
=== 打开主界面 ===
欢迎, 玩家!
最高分: 0
=== 开始游戏 ===
游戏开始 - 关卡 1
=== 游戏进行中 ===
击杀敌人: small, 分数: 10, 金币: 505
击杀敌人: medium, 分数: 30, 金币: 515
生命减少: 9
=== 游戏结束 ===
最终分数: 30
最高分: 30
```

## 总结

这个示例展示了：
- ✅ 使用装饰器注册 Model、Manager 和 View
- ✅ 通过事件系统实现模块解耦
- ✅ 使用类型映射实现自动类型推断
- ✅ BaseView 的自动事件管理
- ✅ Manager 中访问 Model 和事件系统
- ✅ View 中访问 Manager 和 Model
- ✅ 数据持久化（LocalStorage）
- ✅ 完整的游戏流程

框架让代码结构清晰，各模块职责明确，易于维护和扩展。

