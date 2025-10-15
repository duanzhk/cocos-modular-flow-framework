# 红点系统

框架提供了树形结构的红点提示管理系统，通过 `mf.reddot` 访问。

## 基本用法

```typescript
// 设置红点数量
mf.reddot.setCount('main/bag/weapon', 5);
mf.reddot.setCount('main/bag/armor', 3);
mf.reddot.setCount('main/mail', 10);

// 获取红点数量（包含子节点）
const weaponCount = mf.reddot.getCount('main/bag/weapon');  // 5
const bagCount = mf.reddot.getCount('main/bag');            // 8 (weapon + armor)
const mainCount = mf.reddot.getCount('main');                // 18 (bag + mail)

// 增加/减少红点数量
mf.reddot.addCount('main/bag/weapon', 2);   // 增加 2
mf.reddot.addCount('main/bag/weapon', -1);  // 减少 1

// 检查是否有红点
if (mf.reddot.hasRedDot('main/bag')) {
    console.log('背包有新物品');
}

// 清空红点
mf.reddot.clearRedDot('main/mail');
```

## 红点路径规则

红点系统使用树形结构，路径使用 `/` 分隔：

```
main
├── bag
│   ├── weapon
│   ├── armor
│   └── consumable
├── mail
│   ├── system
│   └── friend
└── quest
    ├── main
    └── daily
```

### 特性

- **子节点累加**：子节点的红点会自动累加到父节点
- **任意深度**：支持任意深度的树形结构
- **大小写敏感**：路径区分大小写

### 示例

```typescript
// 设置子节点红点
mf.reddot.setCount('main/bag/weapon', 3);
mf.reddot.setCount('main/bag/armor', 2);
mf.reddot.setCount('main/mail/system', 5);
mf.reddot.setCount('main/mail/friend', 1);

// 获取父节点红点（自动累加）
console.log(mf.reddot.getCount('main/bag'));   // 5 (3 + 2)
console.log(mf.reddot.getCount('main/mail'));  // 6 (5 + 1)
console.log(mf.reddot.getCount('main'));       // 11 (5 + 6)
```

## 监听红点变化

```typescript
// 监听红点变化
mf.reddot.on('main/bag', (totalCount, selfCount) => {
    console.log(`背包红点: ${totalCount} (自身: ${selfCount})`);
    // 更新 UI 显示
});

// 移除监听
const handler = (total, self) => console.log(total, self);
mf.reddot.on('main/bag', handler);
mf.reddot.off('main/bag', handler);
```

### 参数说明

- `totalCount`: 包含所有子节点的总数量
- `selfCount`: 节点自身的数量（不包含子节点）

```typescript
// 设置红点
mf.reddot.setCount('main/bag', 1);        // 背包自身 1 个
mf.reddot.setCount('main/bag/weapon', 5); // 武器 5 个

// 监听回调
mf.reddot.on('main/bag', (total, self) => {
    console.log(total);  // 6 (1 + 5)
    console.log(self);   // 1
});
```

## 在 View 中使用

```typescript
import { view, ViewNames } from 'dzkcc-mflow/core';
import { BaseView } from 'dzkcc-mflow/libs';
import { _decorator, Label, Node } from 'cc';

const { ccclass, property } = _decorator;

@view('Main')
@ccclass('MainView')
export class MainView extends BaseView {
    @property(Label)
    bagRedDot: Label = null!;
    
    @property(Label)
    mailRedDot: Label = null!;
    
    @property(Node)
    bagRedDotNode: Node = null!;
    
    @property(Node)
    mailRedDotNode: Node = null!;
    
    onEnter(): void {
        // 监听红点变化
        mf.reddot.on('main/bag', this.updateBagRedDot.bind(this));
        mf.reddot.on('main/mail', this.updateMailRedDot.bind(this));
        
        // 初始化显示
        this.updateBagRedDot(mf.reddot.getCount('main/bag'), 0);
        this.updateMailRedDot(mf.reddot.getCount('main/mail'), 0);
    }
    
    onExit(): void {
        // 移除监听
        mf.reddot.off('main/bag', this.updateBagRedDot.bind(this));
        mf.reddot.off('main/mail', this.updateMailRedDot.bind(this));
    }
    
    onPause(): void {}
    onResume(): void {}
    
    private updateBagRedDot(totalCount: number): void {
        if (totalCount > 0) {
            this.bagRedDotNode.active = true;
            this.bagRedDot.string = totalCount > 99 ? '99+' : totalCount.toString();
        } else {
            this.bagRedDotNode.active = false;
        }
    }
    
    private updateMailRedDot(totalCount: number): void {
        if (totalCount > 0) {
            this.mailRedDotNode.active = true;
            this.mailRedDot.string = totalCount > 99 ? '99+' : totalCount.toString();
        } else {
            this.mailRedDotNode.active = false;
        }
    }
}
```

## 在 Manager 中使用

```typescript
@manager('Bag')
export class BagManager extends AbstractManager {
    initialize(): void {}
    
    addItem(itemType: string, count: number): void {
        // 添加物品
        // ...
        
        // 更新红点
        const path = `main/bag/${itemType}`;
        mf.reddot.addCount(path, count);
        
        // 派发事件
        this.getEventManager().dispatch('itemAdded', { itemType, count });
    }
    
    removeItem(itemType: string, count: number): void {
        // 移除物品
        // ...
        
        // 更新红点
        const path = `main/bag/${itemType}`;
        mf.reddot.addCount(path, -count);
    }
    
    openBagView(): void {
        // 打开背包界面，清空红点
        mf.reddot.clearRedDot('main/bag');
    }
}
```

## 应用场景

### 场景 1：邮件系统

```typescript
@manager('Mail')
export class MailManager extends AbstractManager {
    initialize(): void {
        // 加载邮件数据
        this.loadMails();
    }
    
    private loadMails(): void {
        // 从服务器获取邮件
        const systemMails = this.fetchSystemMails();  // 系统邮件
        const friendMails = this.fetchFriendMails();  // 好友邮件
        
        // 设置红点
        const unreadSystemCount = systemMails.filter(m => !m.read).length;
        const unreadFriendCount = friendMails.filter(m => !m.read).length;
        
        mf.reddot.setCount('main/mail/system', unreadSystemCount);
        mf.reddot.setCount('main/mail/friend', unreadFriendCount);
    }
    
    readMail(mailId: string, type: 'system' | 'friend'): void {
        // 标记邮件为已读
        // ...
        
        // 减少红点
        const path = `main/mail/${type}`;
        mf.reddot.addCount(path, -1);
    }
    
    receiveNewMail(type: 'system' | 'friend'): void {
        // 收到新邮件
        const path = `main/mail/${type}`;
        mf.reddot.addCount(path, 1);
        
        // 派发事件
        this.getEventManager().dispatch('newMail', { type });
    }
}
```

### 场景 2：任务系统

```typescript
@manager('Quest')
export class QuestManager extends AbstractManager {
    initialize(): void {
        this.updateQuestRedDots();
    }
    
    private updateQuestRedDots(): void {
        // 获取可领取奖励的任务数量
        const mainQuestRewards = this.getCompletedMainQuests().length;
        const dailyQuestRewards = this.getCompletedDailyQuests().length;
        
        mf.reddot.setCount('main/quest/main', mainQuestRewards);
        mf.reddot.setCount('main/quest/daily', dailyQuestRewards);
    }
    
    claimReward(questId: string, questType: 'main' | 'daily'): void {
        // 领取奖励
        // ...
        
        // 减少红点
        const path = `main/quest/${questType}`;
        mf.reddot.addCount(path, -1);
    }
    
    completeQuest(questId: string, questType: 'main' | 'daily'): void {
        // 完成任务
        // ...
        
        // 增加红点
        const path = `main/quest/${questType}`;
        mf.reddot.addCount(path, 1);
        
        // 派发事件
        this.getEventManager().dispatch('questCompleted', { questId, questType });
    }
}
```

### 场景 3：商店系统

```typescript
@manager('Shop')
export class ShopManager extends AbstractManager {
    initialize(): void {
        this.checkNewItems();
    }
    
    private checkNewItems(): void {
        // 检查新上架的商品
        const newWeapons = this.getNewItems('weapon');
        const newArmors = this.getNewItems('armor');
        const newConsumables = this.getNewItems('consumable');
        
        mf.reddot.setCount('main/shop/weapon', newWeapons.length);
        mf.reddot.setCount('main/shop/armor', newArmors.length);
        mf.reddot.setCount('main/shop/consumable', newConsumables.length);
    }
    
    markItemAsViewed(itemId: string, category: string): void {
        // 标记商品为已查看
        // ...
        
        // 减少红点
        const path = `main/shop/${category}`;
        mf.reddot.addCount(path, -1);
    }
}
```

## UI 组件封装

可以封装一个通用的红点组件：

```typescript
import { _decorator, Component, Label, Node } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('RedDotComponent')
export class RedDotComponent extends Component {
    @property(Label)
    countLabel: Label = null!;
    
    @property
    redDotPath: string = '';
    
    @property
    showNumber: boolean = true;  // 是否显示数字
    
    @property
    maxNumber: number = 99;  // 最大显示数字
    
    private handler: Function = null!;
    
    onLoad(): void {
        if (this.redDotPath) {
            this.bindRedDot(this.redDotPath);
        }
    }
    
    bindRedDot(path: string): void {
        this.redDotPath = path;
        
        // 移除旧的监听
        if (this.handler) {
            mf.reddot.off(this.redDotPath, this.handler);
        }
        
        // 添加新的监听
        this.handler = this.updateRedDot.bind(this);
        mf.reddot.on(path, this.handler);
        
        // 初始化显示
        const count = mf.reddot.getCount(path);
        this.updateRedDot(count, 0);
    }
    
    private updateRedDot(totalCount: number): void {
        if (totalCount > 0) {
            this.node.active = true;
            
            if (this.showNumber && this.countLabel) {
                if (totalCount > this.maxNumber) {
                    this.countLabel.string = `${this.maxNumber}+`;
                } else {
                    this.countLabel.string = totalCount.toString();
                }
            }
        } else {
            this.node.active = false;
        }
    }
    
    onDestroy(): void {
        if (this.handler && this.redDotPath) {
            mf.reddot.off(this.redDotPath, this.handler);
        }
    }
}
```

## 最佳实践

### 1. 统一管理红点路径

```typescript
// RedDotPaths.ts
export class RedDotPaths {
    static readonly BAG_WEAPON = 'main/bag/weapon';
    static readonly BAG_ARMOR = 'main/bag/armor';
    static readonly MAIL_SYSTEM = 'main/mail/system';
    static readonly MAIL_FRIEND = 'main/mail/friend';
    static readonly QUEST_MAIN = 'main/quest/main';
    static readonly QUEST_DAILY = 'main/quest/daily';
}

// 使用
mf.reddot.setCount(RedDotPaths.BAG_WEAPON, 5);
```

### 2. 初始化时加载红点数据

```typescript
@manager('RedDot')
export class RedDotManager extends AbstractManager {
    async initialize(): Promise<void> {
        // 从服务器加载红点数据
        const redDotData = await this.fetchRedDotData();
        
        // 批量设置红点
        for (const [path, count] of Object.entries(redDotData)) {
            mf.reddot.setCount(path, count);
        }
    }
}
```

### 3. 及时清理红点

```typescript
// 打开界面时清理对应的红点
@view('Bag')
export class BagView extends BaseView {
    onEnter(): void {
        // 清空背包红点
        mf.reddot.clearRedDot('main/bag');
    }
}
```

## 注意事项

1. **路径规范**：使用统一的路径命名规则
2. **及时更新**：数据变化时及时更新红点
3. **内存泄漏**：记得移除红点监听
4. **性能优化**：避免频繁更新红点（可以使用节流）

