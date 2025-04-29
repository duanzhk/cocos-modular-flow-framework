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
import { BaseView } from "@libs";
const { ccclass, property, disallowMultiple } = _decorator;
@disallowMultiple()
export abstract class ${basescript} extends BaseView {
    /** @internal */
    private static readonly __path__: string = "${__path__}";
    ${defprops}
}`;
    await Editor.Message.request("asset-db", 'create-asset', `db://assets/src/views/${basescript}.ts`, content, { overwrite: true })
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
    await Editor.Message.request("asset-db", 'create-asset', `db://assets/src/game/gui/${info.name}.ts`, content)
    console.log(`创建脚本成功: ${info.name}.ts`);
}

async function createComponent(uuid: string, script: string) {
    const propnodeinfo = await Editor.Message.request('scene', 'query-node-tree', uuid);
    //@ts-ignore
    const components = propnodeinfo.components as { type: string, value: string }[];
    if (components.findIndex((comp: any) => comp.type === script) < 0) {
        const promise = await Editor.Message.request('scene', 'create-component', {
            uuid: uuid,
            component: script
        });
        console.log(`挂载${script}成功`);
        return promise
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

export function onHierarchyMenu(assetInfo: AssetInfo) {
    return [
        {
            label: 'i18n:mflow-framework.export',
            enabled: true,
            async click() {
                try {
                    const uuid = Editor.Selection.getSelected(Editor.Selection.getLastSelectedType())[0];
                    const node = await Editor.Message.request('scene', 'query-node', uuid);
                    const script = node.name.value as string
                    const path = await Editor.Message.request('asset-db', 'query-url', node.__prefab__.uuid);

                    //获取prefab中被指定导出的属性
                    const props = await getProps(uuid);

                    //创建脚本
                    await createScript({ url: path!, name: script, props: props })

                    //挂载脚本
                    await createComponent(uuid, script);

                    //设置属性
                    await setProps(uuid, props);

                    //保存prefab
                    await Editor.Message.request('scene', 'save-scene');
                    console.log('全部完成');
                } catch (e) {
                    console.error('请选中一个prefab的节点');
                }
            },
        },
    ];
};