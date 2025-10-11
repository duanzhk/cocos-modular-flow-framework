import { AssetInfo } from "@cocos/creator-types/editor/packages/asset-db/@types/public";


//name:type
type Props = { [uuid: string]: { key: string, type: string } }

function getProps(uuid: string, result?: Props): Promise<Props> {
    result ??= ({} as Props);
    return Editor.Message.request('scene', 'query-node-tree', uuid).then((data: any) => {
        if (!data) throw new Error('Node tree not found');

        const promises = data.children.map(async (child: any) => {
            const name = child.name as string;
            if (name.startsWith('#')) {
                const arr = name.split('#');
                result![child.uuid] = {
                    key: arr[1],
                    type: arr[2] || 'Node',
                }
            }
            await getProps(child.uuid, result);
        });

        return Promise.all(promises).then(() => result!);
    });
}

async function createScript(info: { url: string, name: string, props: Props }): Promise<any> {
    const basescript = `Base${info.name}`
    const prefix = "db://assets/resources/";
    const __path__ = info.url?.startsWith(prefix) ? info.url?.slice(prefix.length, -".prefab".length) : info.url
    const imports = [...new Set(Object.keys(info.props).map(uuid => info.props[uuid].type))].join(',');
    const defprops = Object.keys(info.props).map((uuid) => {
        const propkey = info.props[uuid].key
        const proptype = info.props[uuid].type
        return `@property({ type: ${proptype} }) ${propkey}:${proptype} = null!;`
    }).join('\n\t');

    //创建base脚本
    let content = `
import { _decorator,Component,${imports} } from 'cc';
import { BaseView } from "dzkcc-mflow/libs";
const { ccclass, property, disallowMultiple } = _decorator;
@disallowMultiple()
export abstract class ${basescript} extends BaseView {
    /** @internal */
    private static readonly __path__: string = "${__path__}";
    ${defprops}
}`;
    const basescripturl = `db://assets/src/views/${basescript}.ts`;
    await Editor.Message.request("asset-db", 'create-asset', basescripturl, content, { overwrite: true })
    await Editor.Message.request('asset-db', 'refresh-asset', basescripturl);
    console.log(`创建脚本成功: ${basescript}.ts`);

    //创建ui脚本
    const assets = await Editor.Message.request('asset-db', 'query-assets', { pattern: `db://assets/**`, ccType: "cc.Script" });
    if (assets.findIndex((asset: any) => asset.name == `${info.name}.ts`) >= 0) {
        console.log(`跳过：${info.name}.ts脚本已存在，直接使用。请确保继承了${basescript}类。`);
        return Promise.resolve();
    }
    content = `
//@ts-ignore
import { ${basescript} } from 'db://assets/src/views/${basescript}';
import { _decorator } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('${info.name}')
export class ${info.name} extends ${basescript} {
    onEnter(args?: any): void { }
    onExit(): void { }
    onPause(): void { }
    onResume(): void { }
}`
    const uiurl = `db://assets/src/game/gui/${info.name}.ts`;
    await Editor.Message.request("asset-db", 'create-asset', uiurl, content)
    await Editor.Message.request('asset-db', 'refresh-asset', uiurl);
    console.log(`创建脚本成功: ${info.name}.ts`);
}

async function createComponent(uuid: string, script: string) {
    const propnodeinfo = await Editor.Message.request('scene', 'query-node-tree', uuid);
    //@ts-ignore
    const components = propnodeinfo.components as { type: string, value: string }[];
    if (components.findIndex((comp: any) => comp.type === script) < 0) {
        try {
            const promise = await Editor.Message.request('scene', 'create-component', {
                uuid: uuid,
                component: script
            });
            console.log(`挂载${script}成功`);
            return promise
        } catch (error) {
            console.log(`挂载${script}失败`, error);
            return Promise.reject(error);
        }
    } else {
        console.log(`跳过：已经挂载了${script}，直接设置属性。请确保继承了Base${script}类。`);
    }
}

async function setProps(uuid: string, props: Props) {
    const promise = await Promise.all(Object.keys(props).map(async (propnodeuuid) => {
        const propkey = props[propnodeuuid].key
        const proptype = props[propnodeuuid].type
        let propcompuuid = propnodeuuid;
        if (proptype != 'Node') {
            const propnodeinfo = await Editor.Message.request('scene', 'query-node-tree', propnodeuuid);
            //@ts-ignore
            const components = propnodeinfo.components as { type: string, value: string }[];
            propcompuuid = components.find((comp: any) => comp.type === `cc.${proptype}`)!.value;
        }
        return Editor.Message.request('scene', 'set-property', {
            uuid: uuid,
            //这里的 1 表示的是当前你要设置的组件在整个节点的组件列表的第几位。
            //可以先通过 const index = node.components.findIndex((comp: any) => comp.uuid === animationComp.uuid); 
            //类似这样，只要能知道你设置组件在第几位即可。目前Prefab上只有Transform和脚本组件，所以直接写死1就可以了。
            path: `__comps__.1.${propkey}`,
            dump: {
                type: `cc.${proptype}`,
                value: {
                    //这里对应的是属性类型的uuid(比如node上挂载的label、button等组件的uuid)
                    //如果是node类型的属性，直接传入node的uuid即可。
                    //如果是组件类型的属性，需要先获取组件的uuid，再传入。
                    uuid: propcompuuid,
                }
            }
        })
    }))
    console.log('设置属性成功');
    return promise
}

// 获取在Assets面板中选择的资源
async function getSelectedAssetInfo() {
    // 1. 获取选中的资源UUID
    const selectedUuids = Editor.Selection.getSelected('asset');

    if (selectedUuids.length === 0) {
        throw new Error('未选中任何资源');
    }

    const assetUuid = selectedUuids[0];

    console.log('selectedUuid:', assetUuid);

    // 2. 获取资源详细信息
    const assetInfo = await Editor.Message.request('asset-db', 'query-asset-info', assetUuid);
    if (!assetInfo) {
        throw new Error('资源不存在');
    }
    console.log('assetInfo:', assetInfo);

    // 3. 判断是否为prefab类型
    if (assetInfo.type !== 'cc.Prefab') {
        throw new Error('选中的资源不是prefab类型');
    }

    // 返回结果
    return {
        name: assetInfo.name.slice(0, -".prefab".length), //去除.prefab后缀
        path: assetInfo.path,
        // assetInfo.url:'db://assets/xxxx.prefab',
        // assetInfo.path:'db://assets/xxxx',
        uuid: assetInfo.uuid, //资源uuid
        originalInfo: assetInfo
    };
}

// 等待场景准备就绪
async function waitForSceneReady(timeoutMs: number = 5000): Promise<boolean> {
    const startTime = Date.now();
    
    while (Date.now() - startTime < timeoutMs) {
        try {
            // 使用 query-is-ready 检查场景是否准备好
            const isReady = await Editor.Message.request('scene', 'query-is-ready');
            if (isReady) {
                return true;
            }
        } catch (error) {
            // 继续等待
        }
        
        // 等待 100ms 后重试
        await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    return false;
}

// 获取当前打开场景的根节点
async function getSceneRootNode(): Promise<string> {
    try {
        // 调用 query-node-tree 不带参数，返回场景根节点数组
        const nodeTree: any = await Editor.Message.request('scene', 'query-node-tree');
        if (!nodeTree) {
            throw new Error('无法获取场景根节点');
        }
        console.log('nodeTree:', nodeTree);
        return nodeTree.uuid;
    } catch (error) {
        console.error('获取场景根节点失败:', error);
        throw error;
    }
}


export function onHierarchyMenu(assetInfo: AssetInfo) {
    return [
        {
            label: 'i18n:mflow-tools.export',
            enabled: true,
            async click() {
                const assetInfo = await getSelectedAssetInfo();

                // 设置属性等需要打开prefab
                await Editor.Message.request('asset-db', 'open-asset', assetInfo.uuid);

                // 等待场景准备就绪
                await waitForSceneReady();

                //场景中节点的 UUID，而不是资源的 UUID
                // const rootNodeUuid = Editor.Selection.getSelected(Editor.Selection.getLastSelectedType())[0];
                // 用query-node-tree获取场景中节点的 UUID更优雅
                const rootNodeUuid = await getSceneRootNode();
                console.log('场景中节点的 UUID:', rootNodeUuid);
                //获取prefab中被指定导出的属性
                const props = await getProps(rootNodeUuid);

                //创建脚本
                await createScript({ url: assetInfo.path, name: assetInfo.name, props: props })

                //挂载脚本
                await createComponent(rootNodeUuid, assetInfo.name);

                //设置属性
                await setProps(rootNodeUuid, props);

                //保存prefab
                await Editor.Message.request('scene', 'save-scene');
                console.log('全部完成');
                await Editor.Message.request('scene', 'close-scene');
            },
        },
    ];
};