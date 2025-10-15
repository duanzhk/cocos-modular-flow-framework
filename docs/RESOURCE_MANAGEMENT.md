# 资源管理

框架提供了统一的资源加载和释放管理，通过 `mf.res` 访问。

## 基本用法

```typescript
import { Prefab, SpriteFrame } from 'cc';

// 加载 Prefab
const prefab = await mf.res.loadPrefab('prefabs/enemy');
const node = instantiate(prefab);

// 加载 SpriteFrame（自动设置到 Sprite 组件）
const sprite = this.node.getComponent(Sprite)!;
await mf.res.loadSpriteFrame(sprite, 'textures/player');

// 加载 Spine 动画（自动设置到 Skeleton 组件）
const skeleton = this.node.getComponent(sp.Skeleton)!;
await mf.res.loadSpine(skeleton, 'spine/hero');

// 加载通用资源
const asset = await mf.res.loadAsset('path/to/asset', AssetType);
```

## 释放资源

```typescript
// 通过路径释放
mf.res.release('prefabs/enemy', Prefab);

// 通过资源对象释放
mf.res.release(asset);

// 强制释放（立即销毁，不管引用计数）
mf.res.release(asset, true);
```

## 在 View 中自动管理资源

`BaseView` 提供了自动资源管理：

```typescript
@view('Game')
@ccclass('GameView')
export class GameView extends BaseView {
    @property(Sprite)
    avatarSprite: Sprite = null!;
    
    @property(Sprite)
    weaponSprite: Sprite = null!;
    
    onEnter(): void {
        // 使用 this.res 加载，会在界面销毁时自动释放
        this.res.loadSpriteFrame(this.avatarSprite, 'textures/avatar');
        this.res.loadSpriteFrame(this.weaponSprite, 'textures/sword');
        
        // 加载多个资源
        this.res.loadPrefab('prefabs/item1');
        this.res.loadPrefab('prefabs/item2');
    }
    
    // 界面销毁时，所有通过 this.res 加载的资源会自动释放
}
```

## Bundle 资源包

支持从不同的 Bundle 加载资源：

```typescript
// 从 resources Bundle 加载（默认）
await mf.res.loadPrefab('prefabs/ui');

// 从自定义 Bundle 加载
await mf.res.loadPrefab('prefabs/level1', 'game-bundle');

// 加载 SpriteFrame 从自定义 Bundle
await mf.res.loadSpriteFrame(sprite, 'textures/bg', 'ui-bundle');
```

### Bundle 管理

```typescript
// 加载 Bundle
const bundle = await assetManager.loadBundle('game-assets');

// 从 Bundle 加载资源
await mf.res.loadPrefab('prefabs/enemy', 'game-assets');

// 卸载 Bundle
assetManager.removeBundle(bundle);
```

## 资源引用计数

框架使用 Cocos Creator 的引用计数系统：

- `loadAsset()` 会自动 `addRef()`
- `release()` 会自动 `decRef()`
- 引用计数为 0 时自动销毁资源

```typescript
// 多次加载同一资源，共享同一实例，引用计数累加
const asset1 = await mf.res.loadPrefab('prefabs/common');  // refCount = 1
const asset2 = await mf.res.loadPrefab('prefabs/common');  // refCount = 2

// 释放资源，引用计数递减
mf.res.release(asset1);  // refCount = 1
mf.res.release(asset2);  // refCount = 0，资源被销毁
```

## 加载不同类型的资源

### 加载 Prefab

```typescript
const prefab = await mf.res.loadPrefab('prefabs/player');
const node = instantiate(prefab);
this.node.addChild(node);
```

### 加载 SpriteFrame

```typescript
// 方式 1：自动设置到 Sprite 组件
const sprite = this.node.getComponent(Sprite)!;
await mf.res.loadSpriteFrame(sprite, 'textures/icon');

// 方式 2：手动加载
const spriteFrame = await mf.res.loadAsset<SpriteFrame>('textures/icon', SpriteFrame);
sprite.spriteFrame = spriteFrame;
```

### 加载 Spine 动画

```typescript
const skeleton = this.node.getComponent(sp.Skeleton)!;
await mf.res.loadSpine(skeleton, 'spine/hero');

// 播放动画
skeleton.setAnimation(0, 'run', true);
```

### 加载音频

```typescript
import { AudioClip } from 'cc';

const bgm = await mf.res.loadAsset<AudioClip>('audio/bgm', AudioClip);
audioSource.clip = bgm;
audioSource.play();
```

### 加载 JSON

```typescript
import { JsonAsset } from 'cc';

const config = await mf.res.loadAsset<JsonAsset>('config/levels', JsonAsset);
const data = config.json;
```

## 预加载资源

```typescript
// 预加载资源（不阻塞，后台加载）
mf.res.preloadPrefab('prefabs/enemy');
mf.res.preloadAsset('textures/bg', SpriteFrame);

// 使用时直接获取（如果已加载完成）
const prefab = await mf.res.loadPrefab('prefabs/enemy');  // 立即返回
```

## 批量加载资源

```typescript
// 加载多个资源
const resources = [
    'prefabs/player',
    'prefabs/enemy',
    'prefabs/bullet'
];

for (const path of resources) {
    await mf.res.loadPrefab(path);
}

// 或使用 Promise.all 并行加载
await Promise.all(resources.map(path => mf.res.loadPrefab(path)));
```

## 资源加载进度

```typescript
// 监听加载进度
assetManager.loadBundle('game-assets', (finished, total) => {
    const progress = finished / total * 100;
    console.log(`加载进度: ${progress}%`);
}, (err, bundle) => {
    if (err) {
        console.error('加载失败', err);
        return;
    }
    console.log('加载完成');
});
```

## 内存管理最佳实践

### 1. 及时释放资源

```typescript
@view('Battle')
export class BattleView extends BaseView {
    private enemyPrefab: Prefab = null!;
    
    async onEnter(): Promise<void> {
        // 加载资源
        this.enemyPrefab = await this.res.loadPrefab('prefabs/enemy');
    }
    
    // onExit 时自动释放通过 this.res 加载的资源
}
```

### 2. 长驻资源使用全局加载

```typescript
// 对于整个游戏都需要的资源，使用 mf.res
@manager('Resource')
export class ResourceManager extends AbstractManager {
    async initialize(): Promise<void> {
        // 加载公共资源
        await mf.res.loadPrefab('prefabs/common-ui');
        await mf.res.loadPrefab('prefabs/effects');
    }
    
    dispose(): void {
        // 手动释放
        mf.res.release('prefabs/common-ui');
        mf.res.release('prefabs/effects');
    }
}
```

### 3. 避免重复加载

```typescript
// ❌ 不好：每次都加载
async spawnEnemy(): Promise<void> {
    const prefab = await mf.res.loadPrefab('prefabs/enemy');
    const node = instantiate(prefab);
}

// ✅ 好：缓存 Prefab
private enemyPrefab: Prefab = null!;

async onEnter(): Promise<void> {
    this.enemyPrefab = await this.res.loadPrefab('prefabs/enemy');
}

spawnEnemy(): void {
    const node = instantiate(this.enemyPrefab);
}
```

### 4. 场景切换时清理资源

```typescript
@manager('Scene')
export class SceneManager extends AbstractManager {
    async loadScene(sceneName: string): Promise<void> {
        // 清理当前场景资源
        mf.gui.clearStack('', true);  // 关闭并销毁所有界面
        
        // 释放特定资源
        mf.res.release('prefabs/level1');
        
        // 加载新场景资源
        await mf.res.loadBundle(`scene-${sceneName}`);
    }
}
```

## 常见问题

### Q: 什么时候使用 this.res，什么时候使用 mf.res？

**A:**
- **`this.res`**：View 中使用，自动管理生命周期
- **`mf.res`**：Manager 或其他地方使用，需要手动管理

```typescript
// View 中
@view('Game')
export class GameView extends BaseView {
    onEnter(): void {
        this.res.loadPrefab('prefabs/ui');  // 自动释放
    }
}

// Manager 中
@manager('Resource')
export class ResourceManager extends AbstractManager {
    async loadCommon(): Promise<void> {
        await mf.res.loadPrefab('prefabs/common');  // 需要手动释放
    }
    
    dispose(): void {
        mf.res.release('prefabs/common');
    }
}
```

### Q: 如何避免内存泄漏？

**A:**
1. View 中使用 `this.res` 加载资源
2. Manager 中及时调用 `mf.res.release()`
3. 场景切换时清理资源
4. 避免循环引用

### Q: 资源加载失败怎么处理？

**A:**
```typescript
try {
    const prefab = await mf.res.loadPrefab('prefabs/player');
} catch (error) {
    console.error('资源加载失败:', error);
    // 显示错误提示
    // 或使用默认资源
}
```

## 注意事项

1. **Bundle 命名**：Bundle 名称要与资源包名称一致
2. **路径格式**：使用相对于 Bundle 的路径，不要包含扩展名
3. **内存监控**：定期检查内存使用情况，及时释放不需要的资源
4. **引用计数**：确保每次 `loadAsset` 都有对应的 `release`

