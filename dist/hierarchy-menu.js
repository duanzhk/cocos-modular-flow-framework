"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.onHierarchyMenu = void 0;
function getProps(uuid, result) {
    result !== null && result !== void 0 ? result : (result = {});
    return Editor.Message.request('scene', 'query-node-tree', uuid).then((data) => {
        if (!data)
            throw new Error('Node tree not found');
        const promises = data.children.map(async (child) => {
            const name = child.name;
            if (name.startsWith('#')) {
                const arr = name.split('#');
                result[child.uuid] = {
                    key: arr[1],
                    type: arr[2] || 'Node',
                };
            }
            await getProps(child.uuid, result);
        });
        return Promise.all(promises).then(() => result);
    });
}
async function createScript(info) {
    var _a, _b;
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
    await Editor.Message.request("asset-db", 'create-asset', `db://assets/src/views/${basescript}.ts`, content, { overwrite: true });
    console.log(`创建脚本成功: ${basescript}.ts`);
    //创建ui脚本
    const assets = await Editor.Message.request('asset-db', 'query-assets', { pattern: `db://assets/**`, ccType: "cc.Script" });
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
    await Editor.Message.request("asset-db", 'create-asset', `db://assets/src/game/gui/${info.name}.ts`, content);
    console.log(`创建脚本成功: ${info.name}.ts`);
}
async function createComponent(uuid, script) {
    const propnodeinfo = await Editor.Message.request('scene', 'query-node-tree', uuid);
    //@ts-ignore
    const components = propnodeinfo.components;
    if (components.findIndex((comp) => comp.type === script) < 0) {
        const promise = await Editor.Message.request('scene', 'create-component', {
            uuid: uuid,
            component: script
        });
        console.log(`挂载${script}成功`);
        return promise;
    }
    else {
        console.log(`跳过：已经挂载了${script}，直接设置属性。请确保继承了Base${script}类。`);
    }
}
async function setProps(uuid, props) {
    const promise = await Promise.all(Object.keys(props).map(async (propnodeuuid) => {
        const propkey = props[propnodeuuid].key;
        const proptype = props[propnodeuuid].type;
        let propcompuuid = propnodeuuid;
        if (proptype != 'Node') {
            const propnodeinfo = await Editor.Message.request('scene', 'query-node-tree', propnodeuuid);
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
    }));
    console.log('设置属性成功');
    return promise;
}
function onHierarchyMenu(assetInfo) {
    return [
        {
            label: 'i18n:mflow-framework.export',
            enabled: true,
            async click() {
                try {
                    const uuid = Editor.Selection.getSelected(Editor.Selection.getLastSelectedType())[0];
                    const node = await Editor.Message.request('scene', 'query-node', uuid);
                    const script = node.name.value;
                    const path = await Editor.Message.request('asset-db', 'query-url', node.__prefab__.uuid);
                    //获取prefab中被指定导出的属性
                    const props = await getProps(uuid);
                    //创建脚本
                    await createScript({ url: path, name: script, props: props });
                    //挂载脚本
                    await createComponent(uuid, script);
                    //设置属性
                    await setProps(uuid, props);
                    //保存prefab
                    await Editor.Message.request('scene', 'save-scene');
                    console.log('全部完成');
                }
                catch (e) {
                    console.error('请选中一个prefab的节点');
                }
            },
        },
    ];
}
exports.onHierarchyMenu = onHierarchyMenu;
;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaGllcmFyY2h5LW1lbnUuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi9zcmMvaGllcmFyY2h5LW1lbnUudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7O0FBTUEsU0FBUyxRQUFRLENBQUMsSUFBWSxFQUFFLE1BQWM7SUFDMUMsTUFBTSxhQUFOLE1BQU0sY0FBTixNQUFNLElBQU4sTUFBTSxHQUFNLEVBQVksRUFBQztJQUN6QixPQUFPLE1BQU0sQ0FBQyxPQUFPLENBQUMsT0FBTyxDQUFDLE9BQU8sRUFBRSxpQkFBaUIsRUFBRSxJQUFJLENBQUMsQ0FBQyxJQUFJLENBQUMsQ0FBQyxJQUFTLEVBQUUsRUFBRTtRQUMvRSxJQUFJLENBQUMsSUFBSTtZQUFFLE1BQU0sSUFBSSxLQUFLLENBQUMscUJBQXFCLENBQUMsQ0FBQztRQUVsRCxNQUFNLFFBQVEsR0FBRyxJQUFJLENBQUMsUUFBUSxDQUFDLEdBQUcsQ0FBQyxLQUFLLEVBQUUsS0FBVSxFQUFFLEVBQUU7WUFDcEQsTUFBTSxJQUFJLEdBQUcsS0FBSyxDQUFDLElBQWMsQ0FBQztZQUNsQyxJQUFJLElBQUksQ0FBQyxVQUFVLENBQUMsR0FBRyxDQUFDLEVBQUU7Z0JBQ3RCLE1BQU0sR0FBRyxHQUFHLElBQUksQ0FBQyxLQUFLLENBQUMsR0FBRyxDQUFDLENBQUM7Z0JBQzVCLE1BQU8sQ0FBQyxLQUFLLENBQUMsSUFBSSxDQUFDLEdBQUc7b0JBQ2xCLEdBQUcsRUFBRSxHQUFHLENBQUMsQ0FBQyxDQUFDO29CQUNYLElBQUksRUFBRSxHQUFHLENBQUMsQ0FBQyxDQUFDLElBQUksTUFBTTtpQkFDekIsQ0FBQTthQUNKO1lBQ0QsTUFBTSxRQUFRLENBQUMsS0FBSyxDQUFDLElBQUksRUFBRSxNQUFNLENBQUMsQ0FBQztRQUN2QyxDQUFDLENBQUMsQ0FBQztRQUVILE9BQU8sT0FBTyxDQUFDLEdBQUcsQ0FBQyxRQUFRLENBQUMsQ0FBQyxJQUFJLENBQUMsR0FBRyxFQUFFLENBQUMsTUFBTyxDQUFDLENBQUM7SUFDckQsQ0FBQyxDQUFDLENBQUM7QUFDUCxDQUFDO0FBRUQsS0FBSyxVQUFVLFlBQVksQ0FBQyxJQUFpRDs7SUFDekUsTUFBTSxVQUFVLEdBQUcsT0FBTyxJQUFJLENBQUMsSUFBSSxFQUFFLENBQUE7SUFDckMsTUFBTSxNQUFNLEdBQUcsd0JBQXdCLENBQUM7SUFDeEMsTUFBTSxRQUFRLEdBQUcsQ0FBQSxNQUFBLElBQUksQ0FBQyxHQUFHLDBDQUFFLFVBQVUsQ0FBQyxNQUFNLENBQUMsRUFBQyxDQUFDLENBQUMsTUFBQSxJQUFJLENBQUMsR0FBRywwQ0FBRSxLQUFLLENBQUMsTUFBTSxDQUFDLE1BQU0sRUFBRSxDQUFDLFNBQVMsQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQTtJQUM1RyxNQUFNLE9BQU8sR0FBRyxDQUFDLEdBQUcsSUFBSSxHQUFHLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxFQUFFLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxJQUFJLENBQUMsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxDQUFDO0lBQ25HLE1BQU0sUUFBUSxHQUFHLE1BQU0sQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLElBQUksRUFBRSxFQUFFO1FBQ2xELE1BQU0sT0FBTyxHQUFHLElBQUksQ0FBQyxLQUFLLENBQUMsSUFBSSxDQUFDLENBQUMsR0FBRyxDQUFBO1FBQ3BDLE1BQU0sUUFBUSxHQUFHLElBQUksQ0FBQyxLQUFLLENBQUMsSUFBSSxDQUFDLENBQUMsSUFBSSxDQUFBO1FBQ3RDLE9BQU8scUJBQXFCLFFBQVEsT0FBTyxPQUFPLElBQUksUUFBUSxXQUFXLENBQUE7SUFDN0UsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxDQUFDO0lBRWhCLFVBQVU7SUFDVixJQUFJLE9BQU8sR0FBRztnQ0FDYyxPQUFPOzs7O3dCQUlmLFVBQVU7O2tEQUVnQixRQUFRO01BQ3BELFFBQVE7RUFDWixDQUFDO0lBQ0MsTUFBTSxNQUFNLENBQUMsT0FBTyxDQUFDLE9BQU8sQ0FBQyxVQUFVLEVBQUUsY0FBYyxFQUFFLHlCQUF5QixVQUFVLEtBQUssRUFBRSxPQUFPLEVBQUUsRUFBRSxTQUFTLEVBQUUsSUFBSSxFQUFFLENBQUMsQ0FBQTtJQUNoSSxPQUFPLENBQUMsR0FBRyxDQUFDLFdBQVcsVUFBVSxLQUFLLENBQUMsQ0FBQztJQUV4QyxRQUFRO0lBQ1IsTUFBTSxNQUFNLEdBQUcsTUFBTSxNQUFNLENBQUMsT0FBTyxDQUFDLE9BQU8sQ0FBQyxVQUFVLEVBQUUsY0FBYyxFQUFFLEVBQUUsT0FBTyxFQUFFLGdCQUFnQixFQUFFLE1BQU0sRUFBRSxXQUFXLEVBQUUsQ0FBQyxDQUFDO0lBQzVILElBQUksTUFBTSxDQUFDLFNBQVMsQ0FBQyxDQUFDLEtBQVUsRUFBRSxFQUFFLENBQUMsS0FBSyxDQUFDLElBQUksSUFBSSxHQUFHLElBQUksQ0FBQyxJQUFJLEtBQUssQ0FBQyxJQUFJLENBQUMsRUFBRTtRQUN4RSxPQUFPLENBQUMsR0FBRyxDQUFDLE1BQU0sSUFBSSxDQUFDLElBQUksdUJBQXVCLFVBQVUsSUFBSSxDQUFDLENBQUM7UUFDbEUsT0FBTyxPQUFPLENBQUMsT0FBTyxFQUFFLENBQUM7S0FDNUI7SUFDRCxPQUFPLEdBQUc7O1dBRUgsVUFBVSxrQ0FBa0MsVUFBVTs7OztZQUlyRCxJQUFJLENBQUMsSUFBSTtlQUNOLElBQUksQ0FBQyxJQUFJLFlBQVksVUFBVTs7Ozs7RUFLNUMsQ0FBQTtJQUNFLE1BQU0sTUFBTSxDQUFDLE9BQU8sQ0FBQyxPQUFPLENBQUMsVUFBVSxFQUFFLGNBQWMsRUFBRSw0QkFBNEIsSUFBSSxDQUFDLElBQUksS0FBSyxFQUFFLE9BQU8sQ0FBQyxDQUFBO0lBQzdHLE9BQU8sQ0FBQyxHQUFHLENBQUMsV0FBVyxJQUFJLENBQUMsSUFBSSxLQUFLLENBQUMsQ0FBQztBQUMzQyxDQUFDO0FBRUQsS0FBSyxVQUFVLGVBQWUsQ0FBQyxJQUFZLEVBQUUsTUFBYztJQUN2RCxNQUFNLFlBQVksR0FBRyxNQUFNLE1BQU0sQ0FBQyxPQUFPLENBQUMsT0FBTyxDQUFDLE9BQU8sRUFBRSxpQkFBaUIsRUFBRSxJQUFJLENBQUMsQ0FBQztJQUNwRixZQUFZO0lBQ1osTUFBTSxVQUFVLEdBQUcsWUFBWSxDQUFDLFVBQStDLENBQUM7SUFDaEYsSUFBSSxVQUFVLENBQUMsU0FBUyxDQUFDLENBQUMsSUFBUyxFQUFFLEVBQUUsQ0FBQyxJQUFJLENBQUMsSUFBSSxLQUFLLE1BQU0sQ0FBQyxHQUFHLENBQUMsRUFBRTtRQUMvRCxNQUFNLE9BQU8sR0FBRyxNQUFNLE1BQU0sQ0FBQyxPQUFPLENBQUMsT0FBTyxDQUFDLE9BQU8sRUFBRSxrQkFBa0IsRUFBRTtZQUN0RSxJQUFJLEVBQUUsSUFBSTtZQUNWLFNBQVMsRUFBRSxNQUFNO1NBQ3BCLENBQUMsQ0FBQztRQUNILE9BQU8sQ0FBQyxHQUFHLENBQUMsS0FBSyxNQUFNLElBQUksQ0FBQyxDQUFDO1FBQzdCLE9BQU8sT0FBTyxDQUFBO0tBQ2pCO1NBQU07UUFDSCxPQUFPLENBQUMsR0FBRyxDQUFDLFdBQVcsTUFBTSxxQkFBcUIsTUFBTSxJQUFJLENBQUMsQ0FBQztLQUNqRTtBQUNMLENBQUM7QUFFRCxLQUFLLFVBQVUsUUFBUSxDQUFDLElBQVksRUFBRSxLQUFZO0lBQzlDLE1BQU0sT0FBTyxHQUFHLE1BQU0sT0FBTyxDQUFDLEdBQUcsQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxDQUFDLEdBQUcsQ0FBQyxLQUFLLEVBQUUsWUFBWSxFQUFFLEVBQUU7UUFDNUUsTUFBTSxPQUFPLEdBQUcsS0FBSyxDQUFDLFlBQVksQ0FBQyxDQUFDLEdBQUcsQ0FBQTtRQUN2QyxNQUFNLFFBQVEsR0FBRyxLQUFLLENBQUMsWUFBWSxDQUFDLENBQUMsSUFBSSxDQUFBO1FBQ3pDLElBQUksWUFBWSxHQUFHLFlBQVksQ0FBQztRQUNoQyxJQUFJLFFBQVEsSUFBSSxNQUFNLEVBQUU7WUFDcEIsTUFBTSxZQUFZLEdBQUcsTUFBTSxNQUFNLENBQUMsT0FBTyxDQUFDLE9BQU8sQ0FBQyxPQUFPLEVBQUUsaUJBQWlCLEVBQUUsWUFBWSxDQUFDLENBQUM7WUFDNUYsWUFBWTtZQUNaLE1BQU0sVUFBVSxHQUFHLFlBQVksQ0FBQyxVQUErQyxDQUFDO1lBQ2hGLFlBQVksR0FBRyxVQUFVLENBQUMsSUFBSSxDQUFDLENBQUMsSUFBUyxFQUFFLEVBQUUsQ0FBQyxJQUFJLENBQUMsSUFBSSxLQUFLLE1BQU0sUUFBUSxFQUFFLENBQUUsQ0FBQyxLQUFLLENBQUM7U0FDeEY7UUFDRCxPQUFPLE1BQU0sQ0FBQyxPQUFPLENBQUMsT0FBTyxDQUFDLE9BQU8sRUFBRSxjQUFjLEVBQUU7WUFDbkQsSUFBSSxFQUFFLElBQUk7WUFDVixvQ0FBb0M7WUFDcEMsa0dBQWtHO1lBQ2xHLDhEQUE4RDtZQUM5RCxJQUFJLEVBQUUsZUFBZSxPQUFPLEVBQUU7WUFDOUIsSUFBSSxFQUFFO2dCQUNGLElBQUksRUFBRSxNQUFNLFFBQVEsRUFBRTtnQkFDdEIsS0FBSyxFQUFFO29CQUNILGlEQUFpRDtvQkFDakQsK0JBQStCO29CQUMvQiw4QkFBOEI7b0JBQzlCLElBQUksRUFBRSxZQUFZO2lCQUNyQjthQUNKO1NBQ0osQ0FBQyxDQUFBO0lBQ04sQ0FBQyxDQUFDLENBQUMsQ0FBQTtJQUNILE9BQU8sQ0FBQyxHQUFHLENBQUMsUUFBUSxDQUFDLENBQUM7SUFDdEIsT0FBTyxPQUFPLENBQUE7QUFDbEIsQ0FBQztBQUVELFNBQWdCLGVBQWUsQ0FBQyxTQUFvQjtJQUNoRCxPQUFPO1FBQ0g7WUFDSSxLQUFLLEVBQUUsNkJBQTZCO1lBQ3BDLE9BQU8sRUFBRSxJQUFJO1lBQ2IsS0FBSyxDQUFDLEtBQUs7Z0JBQ1AsSUFBSTtvQkFDQSxNQUFNLElBQUksR0FBRyxNQUFNLENBQUMsU0FBUyxDQUFDLFdBQVcsQ0FBQyxNQUFNLENBQUMsU0FBUyxDQUFDLG1CQUFtQixFQUFFLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztvQkFDckYsTUFBTSxJQUFJLEdBQUcsTUFBTSxNQUFNLENBQUMsT0FBTyxDQUFDLE9BQU8sQ0FBQyxPQUFPLEVBQUUsWUFBWSxFQUFFLElBQUksQ0FBQyxDQUFDO29CQUN2RSxNQUFNLE1BQU0sR0FBRyxJQUFJLENBQUMsSUFBSSxDQUFDLEtBQWUsQ0FBQTtvQkFDeEMsTUFBTSxJQUFJLEdBQUcsTUFBTSxNQUFNLENBQUMsT0FBTyxDQUFDLE9BQU8sQ0FBQyxVQUFVLEVBQUUsV0FBVyxFQUFFLElBQUksQ0FBQyxVQUFVLENBQUMsSUFBSSxDQUFDLENBQUM7b0JBRXpGLG1CQUFtQjtvQkFDbkIsTUFBTSxLQUFLLEdBQUcsTUFBTSxRQUFRLENBQUMsSUFBSSxDQUFDLENBQUM7b0JBRW5DLE1BQU07b0JBQ04sTUFBTSxZQUFZLENBQUMsRUFBRSxHQUFHLEVBQUUsSUFBSyxFQUFFLElBQUksRUFBRSxNQUFNLEVBQUUsS0FBSyxFQUFFLEtBQUssRUFBRSxDQUFDLENBQUE7b0JBRTlELE1BQU07b0JBQ04sTUFBTSxlQUFlLENBQUMsSUFBSSxFQUFFLE1BQU0sQ0FBQyxDQUFDO29CQUVwQyxNQUFNO29CQUNOLE1BQU0sUUFBUSxDQUFDLElBQUksRUFBRSxLQUFLLENBQUMsQ0FBQztvQkFFNUIsVUFBVTtvQkFDVixNQUFNLE1BQU0sQ0FBQyxPQUFPLENBQUMsT0FBTyxDQUFDLE9BQU8sRUFBRSxZQUFZLENBQUMsQ0FBQztvQkFDcEQsT0FBTyxDQUFDLEdBQUcsQ0FBQyxNQUFNLENBQUMsQ0FBQztpQkFDdkI7Z0JBQUMsT0FBTyxDQUFDLEVBQUU7b0JBQ1IsT0FBTyxDQUFDLEtBQUssQ0FBQyxnQkFBZ0IsQ0FBQyxDQUFDO2lCQUNuQztZQUNMLENBQUM7U0FDSjtLQUNKLENBQUM7QUFDTixDQUFDO0FBakNELDBDQWlDQztBQUFBLENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBBc3NldEluZm8gfSBmcm9tIFwiQGNvY29zL2NyZWF0b3ItdHlwZXMvZWRpdG9yL3BhY2thZ2VzL2Fzc2V0LWRiL0B0eXBlcy9wdWJsaWNcIjtcclxuXHJcblxyXG4vL25hbWU6dHlwZVxyXG50eXBlIFByb3BzID0geyBbdXVpZDogc3RyaW5nXTogeyBrZXk6IHN0cmluZywgdHlwZTogc3RyaW5nIH0gfVxyXG5cclxuZnVuY3Rpb24gZ2V0UHJvcHModXVpZDogc3RyaW5nLCByZXN1bHQ/OiBQcm9wcyk6IFByb21pc2U8UHJvcHM+IHtcclxuICAgIHJlc3VsdCA/Pz0gKHt9IGFzIFByb3BzKTtcclxuICAgIHJldHVybiBFZGl0b3IuTWVzc2FnZS5yZXF1ZXN0KCdzY2VuZScsICdxdWVyeS1ub2RlLXRyZWUnLCB1dWlkKS50aGVuKChkYXRhOiBhbnkpID0+IHtcclxuICAgICAgICBpZiAoIWRhdGEpIHRocm93IG5ldyBFcnJvcignTm9kZSB0cmVlIG5vdCBmb3VuZCcpO1xyXG5cclxuICAgICAgICBjb25zdCBwcm9taXNlcyA9IGRhdGEuY2hpbGRyZW4ubWFwKGFzeW5jIChjaGlsZDogYW55KSA9PiB7XHJcbiAgICAgICAgICAgIGNvbnN0IG5hbWUgPSBjaGlsZC5uYW1lIGFzIHN0cmluZztcclxuICAgICAgICAgICAgaWYgKG5hbWUuc3RhcnRzV2l0aCgnIycpKSB7XHJcbiAgICAgICAgICAgICAgICBjb25zdCBhcnIgPSBuYW1lLnNwbGl0KCcjJyk7XHJcbiAgICAgICAgICAgICAgICByZXN1bHQhW2NoaWxkLnV1aWRdID0ge1xyXG4gICAgICAgICAgICAgICAgICAgIGtleTogYXJyWzFdLFxyXG4gICAgICAgICAgICAgICAgICAgIHR5cGU6IGFyclsyXSB8fCAnTm9kZScsXHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgYXdhaXQgZ2V0UHJvcHMoY2hpbGQudXVpZCwgcmVzdWx0KTtcclxuICAgICAgICB9KTtcclxuXHJcbiAgICAgICAgcmV0dXJuIFByb21pc2UuYWxsKHByb21pc2VzKS50aGVuKCgpID0+IHJlc3VsdCEpO1xyXG4gICAgfSk7XHJcbn1cclxuXHJcbmFzeW5jIGZ1bmN0aW9uIGNyZWF0ZVNjcmlwdChpbmZvOiB7IHVybDogc3RyaW5nLCBuYW1lOiBzdHJpbmcsIHByb3BzOiBQcm9wcyB9KTogUHJvbWlzZTxhbnk+IHtcclxuICAgIGNvbnN0IGJhc2VzY3JpcHQgPSBgQmFzZSR7aW5mby5uYW1lfWBcclxuICAgIGNvbnN0IHByZWZpeCA9IFwiZGI6Ly9hc3NldHMvcmVzb3VyY2VzL1wiO1xyXG4gICAgY29uc3QgX19wYXRoX18gPSBpbmZvLnVybD8uc3RhcnRzV2l0aChwcmVmaXgpID8gaW5mby51cmw/LnNsaWNlKHByZWZpeC5sZW5ndGgsIC1cIi5wcmVmYWJcIi5sZW5ndGgpIDogaW5mby51cmxcclxuICAgIGNvbnN0IGltcG9ydHMgPSBbLi4ubmV3IFNldChPYmplY3Qua2V5cyhpbmZvLnByb3BzKS5tYXAodXVpZCA9PiBpbmZvLnByb3BzW3V1aWRdLnR5cGUpKV0uam9pbignLCcpO1xyXG4gICAgY29uc3QgZGVmcHJvcHMgPSBPYmplY3Qua2V5cyhpbmZvLnByb3BzKS5tYXAoKHV1aWQpID0+IHtcclxuICAgICAgICBjb25zdCBwcm9wa2V5ID0gaW5mby5wcm9wc1t1dWlkXS5rZXlcclxuICAgICAgICBjb25zdCBwcm9wdHlwZSA9IGluZm8ucHJvcHNbdXVpZF0udHlwZVxyXG4gICAgICAgIHJldHVybiBgQHByb3BlcnR5KHsgdHlwZTogJHtwcm9wdHlwZX0gfSkgJHtwcm9wa2V5fToke3Byb3B0eXBlfSA9IG51bGwhO2BcclxuICAgIH0pLmpvaW4oJ1xcblxcdCcpO1xyXG5cclxuICAgIC8v5Yib5bu6YmFzZeiEmuacrFxyXG4gICAgbGV0IGNvbnRlbnQgPSBgXHJcbmltcG9ydCB7IF9kZWNvcmF0b3IsQ29tcG9uZW50LCR7aW1wb3J0c30gfSBmcm9tICdjYyc7XHJcbmltcG9ydCB7IEJhc2VWaWV3IH0gZnJvbSBcIkBtZmxvdy9saWJzXCI7XHJcbmNvbnN0IHsgY2NjbGFzcywgcHJvcGVydHksIGRpc2FsbG93TXVsdGlwbGUgfSA9IF9kZWNvcmF0b3I7XHJcbkBkaXNhbGxvd011bHRpcGxlKClcclxuZXhwb3J0IGFic3RyYWN0IGNsYXNzICR7YmFzZXNjcmlwdH0gZXh0ZW5kcyBCYXNlVmlldyB7XHJcbiAgICAvKiogQGludGVybmFsICovXHJcbiAgICBwcml2YXRlIHN0YXRpYyByZWFkb25seSBfX3BhdGhfXzogc3RyaW5nID0gXCIke19fcGF0aF9ffVwiO1xyXG4gICAgJHtkZWZwcm9wc31cclxufWA7XHJcbiAgICBhd2FpdCBFZGl0b3IuTWVzc2FnZS5yZXF1ZXN0KFwiYXNzZXQtZGJcIiwgJ2NyZWF0ZS1hc3NldCcsIGBkYjovL2Fzc2V0cy9zcmMvdmlld3MvJHtiYXNlc2NyaXB0fS50c2AsIGNvbnRlbnQsIHsgb3ZlcndyaXRlOiB0cnVlIH0pXHJcbiAgICBjb25zb2xlLmxvZyhg5Yib5bu66ISa5pys5oiQ5YqfOiAke2Jhc2VzY3JpcHR9LnRzYCk7XHJcblxyXG4gICAgLy/liJvlu7p1aeiEmuacrFxyXG4gICAgY29uc3QgYXNzZXRzID0gYXdhaXQgRWRpdG9yLk1lc3NhZ2UucmVxdWVzdCgnYXNzZXQtZGInLCAncXVlcnktYXNzZXRzJywgeyBwYXR0ZXJuOiBgZGI6Ly9hc3NldHMvKipgLCBjY1R5cGU6IFwiY2MuU2NyaXB0XCIgfSk7XHJcbiAgICBpZiAoYXNzZXRzLmZpbmRJbmRleCgoYXNzZXQ6IGFueSkgPT4gYXNzZXQubmFtZSA9PSBgJHtpbmZvLm5hbWV9LnRzYCkgPj0gMCkge1xyXG4gICAgICAgIGNvbnNvbGUubG9nKGDot7Pov4fvvJoke2luZm8ubmFtZX0udHPohJrmnKzlt7LlrZjlnKjvvIznm7TmjqXkvb/nlKjjgILor7fnoa7kv53nu6fmib/kuoYke2Jhc2VzY3JpcHR957G744CCYCk7XHJcbiAgICAgICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZSgpO1xyXG4gICAgfVxyXG4gICAgY29udGVudCA9IGBcclxuLy9AdHMtaWdub3JlXHJcbmltcG9ydCB7ICR7YmFzZXNjcmlwdH0gfSBmcm9tICdkYjovL2Fzc2V0cy9zcmMvdmlld3MvJHtiYXNlc2NyaXB0fSc7XHJcbmltcG9ydCB7IF9kZWNvcmF0b3IgfSBmcm9tICdjYyc7XHJcbmNvbnN0IHsgY2NjbGFzcywgcHJvcGVydHkgfSA9IF9kZWNvcmF0b3I7XHJcblxyXG5AY2NjbGFzcygnJHtpbmZvLm5hbWV9JylcclxuZXhwb3J0IGNsYXNzICR7aW5mby5uYW1lfSBleHRlbmRzICR7YmFzZXNjcmlwdH0ge1xyXG4gICAgb25FbnRlcihhcmdzPzogYW55KTogdm9pZCB7IH1cclxuICAgIG9uRXhpdCgpOiB2b2lkIHsgfVxyXG4gICAgb25QYXVzZSgpOiB2b2lkIHsgfVxyXG4gICAgb25SZXN1bWUoKTogdm9pZCB7IH1cclxufWBcclxuICAgIGF3YWl0IEVkaXRvci5NZXNzYWdlLnJlcXVlc3QoXCJhc3NldC1kYlwiLCAnY3JlYXRlLWFzc2V0JywgYGRiOi8vYXNzZXRzL3NyYy9nYW1lL2d1aS8ke2luZm8ubmFtZX0udHNgLCBjb250ZW50KVxyXG4gICAgY29uc29sZS5sb2coYOWIm+W7uuiEmuacrOaIkOWKnzogJHtpbmZvLm5hbWV9LnRzYCk7XHJcbn1cclxuXHJcbmFzeW5jIGZ1bmN0aW9uIGNyZWF0ZUNvbXBvbmVudCh1dWlkOiBzdHJpbmcsIHNjcmlwdDogc3RyaW5nKSB7XHJcbiAgICBjb25zdCBwcm9wbm9kZWluZm8gPSBhd2FpdCBFZGl0b3IuTWVzc2FnZS5yZXF1ZXN0KCdzY2VuZScsICdxdWVyeS1ub2RlLXRyZWUnLCB1dWlkKTtcclxuICAgIC8vQHRzLWlnbm9yZVxyXG4gICAgY29uc3QgY29tcG9uZW50cyA9IHByb3Bub2RlaW5mby5jb21wb25lbnRzIGFzIHsgdHlwZTogc3RyaW5nLCB2YWx1ZTogc3RyaW5nIH1bXTtcclxuICAgIGlmIChjb21wb25lbnRzLmZpbmRJbmRleCgoY29tcDogYW55KSA9PiBjb21wLnR5cGUgPT09IHNjcmlwdCkgPCAwKSB7XHJcbiAgICAgICAgY29uc3QgcHJvbWlzZSA9IGF3YWl0IEVkaXRvci5NZXNzYWdlLnJlcXVlc3QoJ3NjZW5lJywgJ2NyZWF0ZS1jb21wb25lbnQnLCB7XHJcbiAgICAgICAgICAgIHV1aWQ6IHV1aWQsXHJcbiAgICAgICAgICAgIGNvbXBvbmVudDogc2NyaXB0XHJcbiAgICAgICAgfSk7XHJcbiAgICAgICAgY29uc29sZS5sb2coYOaMgui9vSR7c2NyaXB0feaIkOWKn2ApO1xyXG4gICAgICAgIHJldHVybiBwcm9taXNlXHJcbiAgICB9IGVsc2Uge1xyXG4gICAgICAgIGNvbnNvbGUubG9nKGDot7Pov4fvvJrlt7Lnu4/mjILovb3kuoYke3NjcmlwdH3vvIznm7TmjqXorr7nva7lsZ7mgKfjgILor7fnoa7kv53nu6fmib/kuoZCYXNlJHtzY3JpcHR957G744CCYCk7XHJcbiAgICB9XHJcbn1cclxuXHJcbmFzeW5jIGZ1bmN0aW9uIHNldFByb3BzKHV1aWQ6IHN0cmluZywgcHJvcHM6IFByb3BzKSB7XHJcbiAgICBjb25zdCBwcm9taXNlID0gYXdhaXQgUHJvbWlzZS5hbGwoT2JqZWN0LmtleXMocHJvcHMpLm1hcChhc3luYyAocHJvcG5vZGV1dWlkKSA9PiB7XHJcbiAgICAgICAgY29uc3QgcHJvcGtleSA9IHByb3BzW3Byb3Bub2RldXVpZF0ua2V5XHJcbiAgICAgICAgY29uc3QgcHJvcHR5cGUgPSBwcm9wc1twcm9wbm9kZXV1aWRdLnR5cGVcclxuICAgICAgICBsZXQgcHJvcGNvbXB1dWlkID0gcHJvcG5vZGV1dWlkO1xyXG4gICAgICAgIGlmIChwcm9wdHlwZSAhPSAnTm9kZScpIHtcclxuICAgICAgICAgICAgY29uc3QgcHJvcG5vZGVpbmZvID0gYXdhaXQgRWRpdG9yLk1lc3NhZ2UucmVxdWVzdCgnc2NlbmUnLCAncXVlcnktbm9kZS10cmVlJywgcHJvcG5vZGV1dWlkKTtcclxuICAgICAgICAgICAgLy9AdHMtaWdub3JlXHJcbiAgICAgICAgICAgIGNvbnN0IGNvbXBvbmVudHMgPSBwcm9wbm9kZWluZm8uY29tcG9uZW50cyBhcyB7IHR5cGU6IHN0cmluZywgdmFsdWU6IHN0cmluZyB9W107XHJcbiAgICAgICAgICAgIHByb3Bjb21wdXVpZCA9IGNvbXBvbmVudHMuZmluZCgoY29tcDogYW55KSA9PiBjb21wLnR5cGUgPT09IGBjYy4ke3Byb3B0eXBlfWApIS52YWx1ZTtcclxuICAgICAgICB9XHJcbiAgICAgICAgcmV0dXJuIEVkaXRvci5NZXNzYWdlLnJlcXVlc3QoJ3NjZW5lJywgJ3NldC1wcm9wZXJ0eScsIHtcclxuICAgICAgICAgICAgdXVpZDogdXVpZCxcclxuICAgICAgICAgICAgLy/ov5nph4znmoQgMSDooajnpLrnmoTmmK/lvZPliY3kvaDopoHorr7nva7nmoTnu4Tku7blnKjmlbTkuKroioLngrnnmoTnu4Tku7bliJfooajnmoTnrKzlh6DkvY3jgIJcclxuICAgICAgICAgICAgLy/lj6/ku6XlhYjpgJrov4cgY29uc3QgaW5kZXggPSBub2RlLmNvbXBvbmVudHMuZmluZEluZGV4KChjb21wOiBhbnkpID0+IGNvbXAudXVpZCA9PT0gYW5pbWF0aW9uQ29tcC51dWlkKTsgXHJcbiAgICAgICAgICAgIC8v57G75Ly86L+Z5qC377yM5Y+q6KaB6IO955+l6YGT5L2g6K6+572u57uE5Lu25Zyo56ys5Yeg5L2N5Y2z5Y+v44CC55uu5YmNUHJlZmFi5LiK5Y+q5pyJVHJhbnNmb3Jt5ZKM6ISa5pys57uE5Lu277yM5omA5Lul55u05o6l5YaZ5q27MeWwseWPr+S7peS6huOAglxyXG4gICAgICAgICAgICBwYXRoOiBgX19jb21wc19fLjEuJHtwcm9wa2V5fWAsXHJcbiAgICAgICAgICAgIGR1bXA6IHtcclxuICAgICAgICAgICAgICAgIHR5cGU6IGBjYy4ke3Byb3B0eXBlfWAsXHJcbiAgICAgICAgICAgICAgICB2YWx1ZToge1xyXG4gICAgICAgICAgICAgICAgICAgIC8v6L+Z6YeM5a+55bqU55qE5piv5bGe5oCn57G75Z6L55qEdXVpZCjmr5TlpoJub2Rl5LiK5oyC6L2955qEbGFiZWzjgIFidXR0b27nrYnnu4Tku7bnmoR1dWlkKVxyXG4gICAgICAgICAgICAgICAgICAgIC8v5aaC5p6c5pivbm9kZeexu+Wei+eahOWxnuaAp++8jOebtOaOpeS8oOWFpW5vZGXnmoR1dWlk5Y2z5Y+v44CCXHJcbiAgICAgICAgICAgICAgICAgICAgLy/lpoLmnpzmmK/nu4Tku7bnsbvlnovnmoTlsZ7mgKfvvIzpnIDopoHlhYjojrflj5bnu4Tku7bnmoR1dWlk77yM5YaN5Lyg5YWl44CCXHJcbiAgICAgICAgICAgICAgICAgICAgdXVpZDogcHJvcGNvbXB1dWlkLFxyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfSlcclxuICAgIH0pKVxyXG4gICAgY29uc29sZS5sb2coJ+iuvue9ruWxnuaAp+aIkOWKnycpO1xyXG4gICAgcmV0dXJuIHByb21pc2VcclxufVxyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIG9uSGllcmFyY2h5TWVudShhc3NldEluZm86IEFzc2V0SW5mbykge1xyXG4gICAgcmV0dXJuIFtcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIGxhYmVsOiAnaTE4bjptZmxvdy1mcmFtZXdvcmsuZXhwb3J0JyxcclxuICAgICAgICAgICAgZW5hYmxlZDogdHJ1ZSxcclxuICAgICAgICAgICAgYXN5bmMgY2xpY2soKSB7XHJcbiAgICAgICAgICAgICAgICB0cnkge1xyXG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IHV1aWQgPSBFZGl0b3IuU2VsZWN0aW9uLmdldFNlbGVjdGVkKEVkaXRvci5TZWxlY3Rpb24uZ2V0TGFzdFNlbGVjdGVkVHlwZSgpKVswXTtcclxuICAgICAgICAgICAgICAgICAgICBjb25zdCBub2RlID0gYXdhaXQgRWRpdG9yLk1lc3NhZ2UucmVxdWVzdCgnc2NlbmUnLCAncXVlcnktbm9kZScsIHV1aWQpO1xyXG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IHNjcmlwdCA9IG5vZGUubmFtZS52YWx1ZSBhcyBzdHJpbmdcclxuICAgICAgICAgICAgICAgICAgICBjb25zdCBwYXRoID0gYXdhaXQgRWRpdG9yLk1lc3NhZ2UucmVxdWVzdCgnYXNzZXQtZGInLCAncXVlcnktdXJsJywgbm9kZS5fX3ByZWZhYl9fLnV1aWQpO1xyXG5cclxuICAgICAgICAgICAgICAgICAgICAvL+iOt+WPlnByZWZhYuS4reiiq+aMh+WumuWvvOWHuueahOWxnuaAp1xyXG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IHByb3BzID0gYXdhaXQgZ2V0UHJvcHModXVpZCk7XHJcblxyXG4gICAgICAgICAgICAgICAgICAgIC8v5Yib5bu66ISa5pysXHJcbiAgICAgICAgICAgICAgICAgICAgYXdhaXQgY3JlYXRlU2NyaXB0KHsgdXJsOiBwYXRoISwgbmFtZTogc2NyaXB0LCBwcm9wczogcHJvcHMgfSlcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgLy/mjILovb3ohJrmnKxcclxuICAgICAgICAgICAgICAgICAgICBhd2FpdCBjcmVhdGVDb21wb25lbnQodXVpZCwgc2NyaXB0KTtcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgLy/orr7nva7lsZ7mgKdcclxuICAgICAgICAgICAgICAgICAgICBhd2FpdCBzZXRQcm9wcyh1dWlkLCBwcm9wcyk7XHJcblxyXG4gICAgICAgICAgICAgICAgICAgIC8v5L+d5a2YcHJlZmFiXHJcbiAgICAgICAgICAgICAgICAgICAgYXdhaXQgRWRpdG9yLk1lc3NhZ2UucmVxdWVzdCgnc2NlbmUnLCAnc2F2ZS1zY2VuZScpO1xyXG4gICAgICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKCflhajpg6jlrozmiJAnKTtcclxuICAgICAgICAgICAgICAgIH0gY2F0Y2ggKGUpIHtcclxuICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmVycm9yKCfor7fpgInkuK3kuIDkuKpwcmVmYWLnmoToioLngrknKTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfSxcclxuICAgICAgICB9LFxyXG4gICAgXTtcclxufTsiXX0=