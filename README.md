# Modular Flow Framework

## 1.1 框架概述

Cocos模块化流程框架（Modular Flow Framework）是一个为Cocos Creator引擎开发的模块化设计和流程管理框架。该框架旨在提供解耦和依赖注入的能力，帮助开发者构建更加清晰、可维护的游戏项目。

### 1.2 核心特性

- **模块化设计**：通过Manager和Model模式实现业务逻辑的模块化管理
- **依赖注入**：通过装饰器实现自动依赖注入
- **服务定位器**：统一的服务管理机制
- **UI管理系统**：完整的UI界面管理方案
- **事件系统**：强大的事件广播和监听机制
- **资源加载系统**：统一的资源加载和释放管理
- **HTTP网络请求系统**：简洁易用的HTTP客户端
- **WebSocket实时通信**：支持自动重连、心跳检测的WebSocket客户端
- **开发工具**：配套的Cocos Creator编辑器插件

### 1.3 安装说明

```bash
npm i dzkcc-mflow@beta
```

安装完成后，重启Cocos Creator引擎。

## 2. 核心概念

### 2.1 Core核心

Core是框架的核心，负责管理所有的Manager和Model实例。它继承自`AbstractCore`类，提供了注册和获取Manager/Model的接口。

```typescript
// 自定义Core需要继承CocosCore
export class GameCore extends CocosCore { }
```

在场景中挂载GameCore组件即可初始化框架。

### 2.2 ServiceLocator服务定位器

ServiceLocator用于管理跨领域的基础服务，如EventManager、ResLoader、UIManager等。

```typescript
// 注册服务
ServiceLocator.regService('serviceKey', serviceInstance);

// 获取服务
const service = ServiceLocator.getService<ServiceType>('serviceKey');
```

### 2.3 Manager管理器

Manager负责管理业务领域内的具体实现，通常处理业务逻辑。Manager需要实现`IManager`接口。

```typescript
export abstract class AbstractManager implements IManager {
    abstract initialize(): void;
    dispose(): void;
}
```

### 2.4 Model模型

Model用于数据管理，实现`IModel`接口。

```typescript
export interface IModel {
    initialize(): void;
}
```

### 2.5 装饰器系统

框架提供了装饰器来简化Manager和Model的注册：

```typescript
// 注册Manager
@manager()
export class GameManager extends AbstractManager {
    // 实现逻辑
}

// 注册Model
@model()
export class GameModel implements IModel {
    initialize(): void {
        // 初始化逻辑
    }
}
```

## 3. UI系统

### 3.1 BaseView基础视图

所有UI界面都应该继承`BaseView`类，它提供了以下特性：

- 自动事件监听管理（自动注册和注销）
- 自动资源加载管理（自动释放）
- 统一的生命周期方法

```typescript
export abstract class BaseView extends Component implements IView {
    abstract onPause(): void;
    abstract onResume(): void;
    abstract onEnter(args?: any): void;
    onExit(): void;
}
```

### 3.2 UIManager界面管理器

UIManager负责管理UI界面的打开、关闭、层级等操作。

```typescript
// 打开界面
const view = await mf.gui.open(ViewType, args);

// 关闭界面
mf.gui.close(viewInstance);

// 带分组的界面管理
const view = await mf.gui.openAndPush(ViewType, 'group', args);
mf.gui.closeAndPop('group');
```

## 4. 事件系统

### 4.1 Broadcaster事件广播器

框架提供了基于类型的事件系统，通过Broadcaster实现。

```typescript
// 监听事件
mf.event.on('eventKey', (data) => {
    // 处理事件
});

// 广播事件
mf.event.dispatch('eventKey', data);

// 一次性监听
mf.event.once('eventKey', (data) => {
    // 只会触发一次
});
```

### 4.2 粘性事件

粘性事件可以在没有监听者时暂存，等有监听者时再触发：

```typescript
// 发送粘性事件
mf.event.dispatchSticky('stickyEvent', data);

// 移除粘性事件
mf.event.removeStickyBroadcast('stickyEvent');
```

## 5. 资源加载系统

### 5.1 ResLoader资源加载器

ResLoader提供了统一的资源加载和释放接口：

```typescript
// 加载预制体
const prefab = await mf.res.loadPrefab('path/to/prefab');

// 加载精灵帧
const spriteFrame = await mf.res.loadSpriteFrame(spriteComponent, 'path/to/sprite');

// 加载Spine动画
const spineData = await mf.res.loadSpine(spineComponent, 'path/to/spine');

// 释放资源
mf.res.release('path/to/asset');
```

## 6. HTTP网络请求系统

### 6.1 HttpManager HTTP管理器

HttpManager提供了简洁易用的HTTP客户端功能，支持常见的HTTP方法：

```typescript
// GET 请求
const userData = await mf.http.get('/api/users/123', { includeProfile: true });

// POST 请求
const newUser = await mf.http.post('/api/users', { 
    name: 'John', 
    email: 'john@example.com' 
});

// PUT 请求
const updatedUser = await mf.http.put('/api/users/123', { 
    name: 'John Doe' 
});

// DELETE 请求
await mf.http.delete('/api/users/123');

// 自定义请求
const result = await mf.http.request({
    url: '/api/upload',
    method: 'POST',
    data: formData,
    headers: {
        'Authorization': 'Bearer token'
    },
    timeout: 30000
});
```

### 6.2 功能特性

1. **Promise-based API**：所有请求都返回Promise，支持async/await
2. **超时控制**：默认10秒超时，可自定义
3. **自动JSON解析**：自动解析JSON响应
4. **错误处理**：统一的错误处理机制
5. **请求拦截**：支持自定义请求头
6. **URL参数处理**：自动处理GET请求的查询参数

### 6.3 使用示例

```typescript
// 在Manager中使用
@manager()
export class UserManager extends AbstractManager {
    async getUserProfile(userId: string): Promise<any> {
        try {
            const profile = await mf.http.get(`/api/users/${userId}/profile`);
            return profile;
        } catch (error) {
            console.error('Failed to fetch user profile:', error);
            throw error;
        }
    }
    
    async updateUser(userId: string, data: any): Promise<any> {
        try {
            const result = await mf.http.put(`/api/users/${userId}`, data, {
                'Authorization': `Bearer ${this.getAuthToken()}`
            });
            return result;
        } catch (error) {
            console.error('Failed to update user:', error);
            throw error;
        }
    }
    
    private getAuthToken(): string {
        // 获取认证令牌的逻辑
        return 'your-auth-token';
    }
}
```

## 7. WebSocket 实时通信系统

### 7.1 WebSocketManager WebSocket管理器

WebSocketManager提供了完整的 WebSocket 客户端功能，支持：

```typescript
// 连接 WebSocket 服务器
mf.socket.connect('ws://localhost:8080/game');

// 或使用安全连接
mf.socket.connect('wss://game-server.example.com/ws');

// 配置自动重连和心跳
mf.socket.configure({
    reconnect: true,              // 启用自动重连
    reconnectInterval: 3000,      // 重连间隔 3 秒
    reconnectAttempts: 5,         // 最多重连 5 次
    heartbeat: true,              // 启用心跳
    heartbeatInterval: 30000,     // 心跳间隔 30 秒
    heartbeatMessage: 'ping'      // 心跳消息
});

// 监听事件
mf.socket.on('open', (event) => {
    console.log('连接成功');
});

mf.socket.on('message', (event) => {
    console.log('收到消息:', event.data);
});

mf.socket.on('error', (event) => {
    console.error('连接错误:', event);
});

mf.socket.on('close', (event) => {
    console.log('连接关闭');
});

// 发送消息（支持多种数据类型）
// 1. 发送对象（自动转换为 JSON）
mf.socket.send({ type: 'move', x: 100, y: 200 });

// 2. 发送字符串
mf.socket.send('Hello Server');

// 检查连接状态
if (mf.socket.isConnected()) {
    // 已连接
}

// 断开连接
mf.socket.disconnect();
```

### 7.2 发送不同类型的数据

WebSocket 支持多种数据类型的发送：

```typescript
// ==================== 1. 发送 JSON 对象（推荐）====================
// 自动序列化为 JSON 字符串
mf.socket.send({
    type: 'player_move',
    position: { x: 100, y: 200 },
    timestamp: Date.now()
});

// ==================== 2. 发送纯文本 ====================
mf.socket.send('ping');

// ==================== 3. 发送二进制数据（ArrayBuffer）====================
// 适用场景：发送游戏状态快照、地图数据等需要高效传输的场景
function sendBinaryData() {
    // 创建 ArrayBuffer（8 字节）
    const buffer = new ArrayBuffer(8);
    const view = new DataView(buffer);
    
    // 写入玩家 ID（4 字节整数）
    view.setInt32(0, 12345, true);
    
    // 写入玩家位置（2 个 2 字节整数）
    view.setInt16(4, 100, true); // x 坐标
    view.setInt16(6, 200, true); // y 坐标
    
    // 发送二进制数据
    mf.socket.send(buffer);
}

// 接收二进制数据示例
mf.socket.on('message', (event: MessageEvent) => {
    if (event.data instanceof ArrayBuffer) {
        const view = new DataView(event.data);
        const playerId = view.getInt32(0, true);
        const x = view.getInt16(4, true);
        const y = view.getInt16(6, true);
        console.log(`玩家 ${playerId} 移动到 (${x}, ${y})`);
    }
});

// ==================== 4. 发送文件（Blob）====================
// 适用场景：上传截图、录像回放、自定义地图等
async function sendScreenshot() {
    // 方式 1：从 Canvas 获取 Blob
    const canvas = document.querySelector('canvas') as HTMLCanvasElement;
    canvas.toBlob((blob) => {
        if (blob) {
            mf.socket.send(blob);
        }
    }, 'image/png');
    
    // 方式 2：从文件选择器获取
    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    const file = fileInput.files?.[0];
    if (file) {
        mf.socket.send(file);
    }
    
    // 方式 3：创建自定义 Blob
    const data = new Blob(['自定义数据内容'], { type: 'text/plain' });
    mf.socket.send(data);
}

// 接收 Blob 数据示例
mf.socket.on('message', async (event: MessageEvent) => {
    if (event.data instanceof Blob) {
        // 读取 Blob 数据
        const text = await event.data.text();
        console.log('收到文件数据:', text);
        
        // 或者作为 ArrayBuffer 读取
        const buffer = await event.data.arrayBuffer();
        console.log('文件大小:', buffer.byteLength, '字节');
    }
});

// ==================== 5. 发送 TypedArray（Uint8Array 等）====================
// 适用场景：发送图像数据、音频流等
function sendImageData() {
    // 创建一个 256 字节的数据
    const imageData = new Uint8Array(256);
    for (let i = 0; i < imageData.length; i++) {
        imageData[i] = i;
    }
    
    // 发送 TypedArray（会自动转换为 ArrayBuffer）
    mf.socket.send(imageData.buffer);
}
```


### 7.3 功能特性

1. **自动重连**：连接断开后自动尝试重连，可配置重连次数和间隔
2. **心跳检测**：定期发送心跳消息保持连接
3. **消息队列**：连接断开时缓存消息，重连后自动发送
4. **事件管理**：统一的事件监听和触发机制
5. **连接状态管理**：实时获取连接状态
6. **自动序列化**：对象类型自动转换为 JSON 字符串
7. **多数据类型支持**：支持 string、object、ArrayBuffer、Blob 等

### 7.4 实战案例：多人对战游戏

```typescript
// ==================== 案例 1：实时对战位置同步 ====================
// 使用二进制数据传输，减少带宽占用
class BattleNetworkManager {
    // 发送玩家位置（二进制，只需 12 字节）
    sendPlayerPosition(playerId: number, x: number, y: number, rotation: number) {
        const buffer = new ArrayBuffer(12);
        const view = new DataView(buffer);
        
        view.setInt32(0, playerId, true);     // 玩家 ID（4 字节）
        view.setFloat32(4, x, true);          // X 坐标（4 字节）
        view.setFloat32(8, y, true);          // Y 坐标（4 字节）
        
        mf.socket.send(buffer);
    }
    
    // 接收其他玩家位置
    setupPositionReceiver() {
        mf.socket.on('message', (event: MessageEvent) => {
            if (event.data instanceof ArrayBuffer) {
                const view = new DataView(event.data);
                const playerId = view.getInt32(0, true);
                const x = view.getFloat32(4, true);
                const y = view.getFloat32(8, true);
                
                // 更新其他玩家位置
                this.updateOtherPlayerPosition(playerId, x, y);
            }
        });
    }
    
    private updateOtherPlayerPosition(playerId: number, x: number, y: number) {
        // 更新游戏中其他玩家的位置
        console.log(`玩家 ${playerId} 移动到 (${x}, ${y})`);
    }
}

// ==================== 案例 2：截图分享功能 ====================
// 使用 Blob 上传游戏截图
class ScreenshotManager {
    async captureAndSend() {
        // 获取游戏 Canvas
        const canvas = document.querySelector('canvas') as HTMLCanvasElement;
        
        // 转换为 Blob
        canvas.toBlob((blob) => {
            if (blob) {
                // 发送截图到服务器
                mf.socket.send(blob);
                console.log(`发送截图，大小: ${blob.size} 字节`);
            }
        }, 'image/jpeg', 0.8); // JPEG 格式，80% 质量
    }
    
    // 接收其他玩家的截图
    setupScreenshotReceiver() {
        mf.socket.on('message', async (event: MessageEvent) => {
            if (event.data instanceof Blob) {
                // 创建图片 URL
                const imageUrl = URL.createObjectURL(event.data);
                
                // 显示图片
                const img = new Image();
                img.src = imageUrl;
                document.body.appendChild(img);
                
                console.log('收到截图');
            }
        });
    }
}

// ==================== 案例 3：混合数据类型 ====================
// 根据消息类型选择最优传输方式
class SmartNetworkManager {
    send(messageType: string, data: any) {
        switch (messageType) {
            case 'chat':
                // 聊天消息：使用 JSON
                mf.socket.send({
                    type: 'chat',
                    message: data.message,
                    playerId: data.playerId
                });
                break;
                
            case 'position':
                // 位置更新：使用二进制（高频更新）
                this.sendPositionBinary(data);
                break;
                
            case 'screenshot':
                // 截图：使用 Blob
                mf.socket.send(data.blob);
                break;
                
            case 'skill':
                // 技能释放：使用 JSON
                mf.socket.send({
                    type: 'skill',
                    skillId: data.skillId,
                    targetId: data.targetId,
                    timestamp: Date.now()
                });
                break;
        }
    }
    
    private sendPositionBinary(data: any) {
        const buffer = new ArrayBuffer(12);
        const view = new DataView(buffer);
        view.setInt32(0, data.playerId, true);
        view.setFloat32(4, data.x, true);
        view.setFloat32(8, data.y, true);
        mf.socket.send(buffer);
    }
}
```

### 7.5 Manager 集成示例

```typescript
// 在Manager中使用
@manager()
export class GameNetworkManager extends AbstractManager {
    initialize() {
        // 配置 WebSocket
        mf.socket.configure({
            reconnect: true,
            reconnectInterval: 3000,
            reconnectAttempts: 10,
            heartbeat: true,
            heartbeatInterval: 30000
        });
        
        // 设置事件监听
        mf.socket.on('open', this.onConnected.bind(this));
        mf.socket.on('message', this.onMessage.bind(this));
        mf.socket.on('error', this.onError.bind(this));
        mf.socket.on('close', this.onClose.bind(this));
    }
    
    connect(token: string) {
        const wsUrl = `wss://game-server.example.com/ws?token=${token}`;
        mf.socket.connect(wsUrl);
    }
    
    private onConnected(event: Event) {
        console.log('连接成功');
        this.sendLogin();
    }
    
    private onMessage(event: MessageEvent) {
        const data = JSON.parse(event.data);
        // 处理服务器消息
        this.handleServerMessage(data);
    }
    
    private onError(event: Event) {
        console.error('连接错误');
    }
    
    private onClose(event: CloseEvent) {
        console.log('连接关闭');
    }
    
    sendPlayerMove(x: number, y: number) {
        // 直接发送对象，自动序列化为 JSON
        mf.socket.send({
            type: 'player_move',
            position: { x, y },
            timestamp: Date.now()
        });
    }
    
    private sendLogin() {
        // 直接发送对象，自动序列化为 JSON
        mf.socket.send({
            type: 'login',
            userId: this.getUserId()
        });
    }
    
    private handleServerMessage(data: any) {
        // 使用事件系统分发消息
        mf.event.dispatch(`server_${data.type}`, data);
    }
}
```

## 8. 开发工具

框架配套了Cocos Creator编辑器插件`mflow-tools`，可以：

1. 自动生成UI脚本
2. 自动引用Prefab上需要操作的元素
3. 自动挂载脚本组件

### 8.1 使用方法

1. 在Prefab中，将需要引用的节点重命名为`#属性名#组件类型`格式，例如：
   - `#titleLabel#Label` 表示引用Label组件
   - `#closeButton#Button` 表示引用Button组件
   - `#contentNode` 表示引用Node节点

2. 在Hierarchy面板中右键点击Prefab节点，选择"导出到脚本"

3. 插件会自动生成基础脚本和业务脚本，并自动设置引用关系

## 9. 完整示例

### 9.1 创建Manager

```typescript
@manager()
export class GameManager extends AbstractManager {
    private _score: number = 0;
    
    initialize(): void {
        console.log('GameManager initialized');
    }
    
    get score(): number {
        return this._score;
    }
    
    addScore(value: number): void {
        this._score += value;
        // 广播分数变化事件
        this.getEventManager().dispatch('scoreChanged', this._score);
    }
}
```

### 9.2 创建Model

```typescript
@model()
export class GameModel implements IModel {
    private _playerName: string = '';
    
    initialize(): void {
        console.log('GameModel initialized');
    }
    
    get playerName(): string {
        return this._playerName;
    }
    
    set playerName(name: string) {
        this._playerName = name;
    }
}
```

### 9.3 创建UI界面

```typescript
// BaseHomeView.ts (由工具自动生成)
import { _decorator, Component, Label, Button } from 'cc';
import { BaseView } from "dzkcc-mflow/libs";

const { ccclass, property, disallowMultiple } = _decorator;

@disallowMultiple()
export abstract class BaseHomeView extends BaseView {
    /** @internal */
    private static readonly __path__: string = "ui/home";
    
    @property({ type: Label }) titleLabel: Label = null!;
    @property({ type: Button }) startButton: Button = null!;
}

// HomeView.ts (业务实现)
import { BaseHomeView } from './BaseHomeView';
import { _decorator } from 'cc';

const { ccclass, property } = _decorator;

@ccclass('HomeView')
export class HomeView extends BaseHomeView {
    onEnter(args?: any): void {
        // 监听按钮点击
        this.startButton.node.on(Button.EventType.CLICK, this.onStartClick, this);
        
        // 监听分数变化
        this.event.on('scoreChanged', this.onScoreChanged, this);
    }
    
    onExit(): void {
        // BaseView会自动清理事件监听
    }
    
    onPause(): void {
        // 界面暂停时的处理
    }
    
    onResume(): void {
        // 界面恢复时的处理
    }
    
    private onStartClick(): void {
        // 获取GameManager并调用方法
        const gameManager = this.getManager(GameManager);
        gameManager.addScore(10);
    }
    
    private onScoreChanged(score: number): void {
        this.titleLabel.string = `分数: ${score}`;
    }
}
```

### 9.4 在场景中使用

```typescript
// 在游戏启动时
export class GameApp extends Component {
    start(): void {
        // 打开主界面
        mf.gui.open(HomeView);
    }
}
```

## 10. 最佳实践

1. **模块化设计**：将相关的业务逻辑封装在对应的Manager中
2. **数据驱动**：使用Model管理数据状态
3. **事件解耦**：通过事件系统实现模块间通信
4. **资源管理**：使用BaseView自动管理资源加载和释放
5. **依赖注入**：使用装饰器简化依赖管理
6. **网络请求**：使用HttpManager统一管理网络请求
7. **实时通信**：使用WebSocketManager处理实时消息，配合事件系统分发
8. **工具辅助**：使用mflow-tools提高开发效率

## 11. 注意事项

1. 确保在使用框架功能前Core已经初始化
2. 注意资源的正确加载和释放，避免内存泄漏
3. 合理使用事件系统，避免事件监听过多影响性能
4. 使用BaseView的子类时，确保正确实现所有抽象方法
5. 网络请求时注意错误处理和超时设置
6. WebSocket 连接时记得在场景切换时断开连接，避免内存泄漏
7. 合理配置心跳和重连参数，平衡连接稳定性和服务器压力