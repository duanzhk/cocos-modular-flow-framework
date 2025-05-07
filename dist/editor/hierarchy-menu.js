var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
function getProps(uuid, result) {
    result !== null && result !== void 0 ? result : (result = {});
    return Editor.Message.request('scene', 'query-node-tree', uuid).then((data) => {
        if (!data)
            throw new Error('Node tree not found');
        const promises = data.children.map((child) => __awaiter(this, void 0, void 0, function* () {
            const name = child.name;
            if (name.startsWith('#')) {
                const arr = name.split('#');
                result[child.uuid] = {
                    key: arr[1],
                    type: arr[2] || 'Node',
                };
            }
            yield getProps(child.uuid, result);
        }));
        return Promise.all(promises).then(() => result);
    });
}
function createScript(info) {
    var _a, _b;
    return __awaiter(this, void 0, void 0, function* () {
        const basescript = `Base${info.name}`;
        const prefix = "db://assets/resources/";
        const __path__ = ((_a = info.url) === null || _a === void 0 ? void 0 : _a.startsWith(prefix)) ? (_b = info.url) === null || _b === void 0 ? void 0 : _b.slice(prefix.length, -".prefab".length) : info.url;
        const imports = [...new Set(Object.keys(info.props).map(uuid => info.props[uuid].type))].join(',');
        const defprops = Object.keys(info.props).map((uuid) => {
            const propkey = info.props[uuid].key;
            const proptype = info.props[uuid].type;
            return `@property({ type: ${proptype} }) ${propkey}:${proptype} = null!;`;
        }).join('\n\t');
        //创建base脚本
        let content = `
import { _decorator,Component,${imports} } from 'cc';
import { BaseView } from "@mflow/libs";
const { ccclass, property, disallowMultiple } = _decorator;
@disallowMultiple()
export abstract class ${basescript} extends BaseView {
    /** @internal */
    private static readonly __path__: string = "${__path__}";
    ${defprops}
}`;
        yield Editor.Message.request("asset-db", 'create-asset', `db://assets/src/views/${basescript}.ts`, content, { overwrite: true });
        console.log(`创建脚本成功: ${basescript}.ts`);
        //创建ui脚本
        const assets = yield Editor.Message.request('asset-db', 'query-assets', { pattern: `db://assets/**`, ccType: "cc.Script" });
        if (assets.findIndex((asset) => asset.name == `${info.name}.ts`) >= 0) {
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
}`;
        yield Editor.Message.request("asset-db", 'create-asset', `db://assets/src/game/gui/${info.name}.ts`, content);
        console.log(`创建脚本成功: ${info.name}.ts`);
    });
}
function createComponent(uuid, script) {
    return __awaiter(this, void 0, void 0, function* () {
        const propnodeinfo = yield Editor.Message.request('scene', 'query-node-tree', uuid);
        //@ts-ignore
        const components = propnodeinfo.components;
        if (components.findIndex((comp) => comp.type === script) < 0) {
            const promise = yield Editor.Message.request('scene', 'create-component', {
                uuid: uuid,
                component: script
            });
            console.log(`挂载${script}成功`);
            return promise;
        }
        else {
            console.log(`跳过：已经挂载了${script}，直接设置属性。请确保继承了Base${script}类。`);
        }
    });
}
function setProps(uuid, props) {
    return __awaiter(this, void 0, void 0, function* () {
        const promise = yield Promise.all(Object.keys(props).map((propnodeuuid) => __awaiter(this, void 0, void 0, function* () {
            const propkey = props[propnodeuuid].key;
            const proptype = props[propnodeuuid].type;
            let propcompuuid = propnodeuuid;
            if (proptype != 'Node') {
                const propnodeinfo = yield Editor.Message.request('scene', 'query-node-tree', propnodeuuid);
                //@ts-ignore
                const components = propnodeinfo.components;
                propcompuuid = components.find((comp) => comp.type === `cc.${proptype}`).value;
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
            });
        })));
        console.log('设置属性成功');
        return promise;
    });
}
export function onHierarchyMenu(assetInfo) {
    return [
        {
            label: 'i18n:mflow-framework.export',
            enabled: true,
            click() {
                return __awaiter(this, void 0, void 0, function* () {
                    try {
                        const uuid = Editor.Selection.getSelected(Editor.Selection.getLastSelectedType())[0];
                        const node = yield Editor.Message.request('scene', 'query-node', uuid);
                        const script = node.name.value;
                        const path = yield Editor.Message.request('asset-db', 'query-url', node.__prefab__.uuid);
                        //获取prefab中被指定导出的属性
                        const props = yield getProps(uuid);
                        //创建脚本
                        yield createScript({ url: path, name: script, props: props });
                        //挂载脚本
                        yield createComponent(uuid, script);
                        //设置属性
                        yield setProps(uuid, props);
                        //保存prefab
                        yield Editor.Message.request('scene', 'save-scene');
                        console.log('全部完成');
                    }
                    catch (e) {
                        console.error('请选中一个prefab的节点');
                    }
                });
            },
        },
    ];
}
;
