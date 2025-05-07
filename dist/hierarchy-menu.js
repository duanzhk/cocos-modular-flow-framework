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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaGllcmFyY2h5LW1lbnUuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi9zcmMvaGllcmFyY2h5LW1lbnUudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7O0FBTUEsU0FBUyxRQUFRLENBQUMsSUFBWSxFQUFFLE1BQWM7SUFDMUMsTUFBTSxhQUFOLE1BQU0sY0FBTixNQUFNLElBQU4sTUFBTSxHQUFNLEVBQVksRUFBQztJQUN6QixPQUFPLE1BQU0sQ0FBQyxPQUFPLENBQUMsT0FBTyxDQUFDLE9BQU8sRUFBRSxpQkFBaUIsRUFBRSxJQUFJLENBQUMsQ0FBQyxJQUFJLENBQUMsQ0FBQyxJQUFTLEVBQUUsRUFBRTtRQUMvRSxJQUFJLENBQUMsSUFBSTtZQUFFLE1BQU0sSUFBSSxLQUFLLENBQUMscUJBQXFCLENBQUMsQ0FBQztRQUVsRCxNQUFNLFFBQVEsR0FBRyxJQUFJLENBQUMsUUFBUSxDQUFDLEdBQUcsQ0FBQyxLQUFLLEVBQUUsS0FBVSxFQUFFLEVBQUU7WUFDcEQsTUFBTSxJQUFJLEdBQUcsS0FBSyxDQUFDLElBQWMsQ0FBQztZQUNsQyxJQUFJLElBQUksQ0FBQyxVQUFVLENBQUMsR0FBRyxDQUFDLEVBQUU7Z0JBQ3RCLE1BQU0sR0FBRyxHQUFHLElBQUksQ0FBQyxLQUFLLENBQUMsR0FBRyxDQUFDLENBQUM7Z0JBQzVCLE1BQU8sQ0FBQyxLQUFLLENBQUMsSUFBSSxDQUFDLEdBQUc7b0JBQ2xCLEdBQUcsRUFBRSxHQUFHLENBQUMsQ0FBQyxDQUFDO29CQUNYLElBQUksRUFBRSxHQUFHLENBQUMsQ0FBQyxDQUFDLElBQUksTUFBTTtpQkFDekIsQ0FBQTthQUNKO1lBQ0QsTUFBTSxRQUFRLENBQUMsS0FBSyxDQUFDLElBQUksRUFBRSxNQUFNLENBQUMsQ0FBQztRQUN2QyxDQUFDLENBQUMsQ0FBQztRQUVILE9BQU8sT0FBTyxDQUFDLEdBQUcsQ0FBQyxRQUFRLENBQUMsQ0FBQyxJQUFJLENBQUMsR0FBRyxFQUFFLENBQUMsTUFBTyxDQUFD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LENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztvQkFDckYsTUFBTSxJQUFJLEdBQUcsTUFBTSxNQUFNLENBQUMsT0FBTyxDQUFDLE9BQU8sQ0FBQyxPQUFPLEVBQUUsWUFBWSxFQUFFLElBQUksQ0FBQyxDQUFDO29CQUN2RSxNQUFNLE1BQU0sR0FBRyxJQUFJLENBQUMsSUFBSSxDQUFDLEtBQWUsQ0FBQTtvQkFDeEMsTUFBTSxJQUFJLEdBQUcsTUFBTSxNQUFNLENBQUMsT0FBTyxDQUFDLE9BQU8sQ0FBQyxVQUFVLEVBQUUsV0FBVyxFQUFFLElBQUksQ0FBQyxVQUFVLENBQUMsSUFBSSxDQUFDLENBQUM7b0JBRXpGLG1CQUFtQjtvQkFDbkIsTUFBTSxLQUFLLEdBQUcsTUFBTSxRQUFRLENBQUMsSUFBSSxDQUFDLENBQUM7b0JBRW5DLE1BQU07b0JBQ04sTUFBTSxZQUFZLENBQUMsRUFBRSxHQUFHLEVBQUUsSUFBSyxFQUFFLElBQUksRUFBRSxNQUFNLEVBQUUsS0FBSyxFQUFFLEtBQUssRUFBRSxDQUFDLENBQUE7b0JBRTlELE1BQU07b0JBQ04sTUFBTSxlQUFlLENBQUMsSUFBSSxFQUFFLE1BQU0sQ0FBQyxDQUFDO29CQUVwQyxNQUFNO29CQUNOLE1BQU0sUUFBUSxDQUFDLElBQUksRUFBRSxLQUFLLENBQUMsQ0FBQztvQkFFNUIsVUFBVTtvQkFDVixNQUFNLE1BQU0sQ0FBQyxPQUFPLENBQUMsT0FBTyxDQUFDLE9BQU8sRUFBRSxZQUFZLENBQUMsQ0FBQztvQkFDcEQsT0FBTyxDQUFDLEdBQUcsQ0FBQyxNQUFNLENBQUMsQ0FBQztpQkFDdkI7Z0JBQUMsT0FBTyxDQUFDLEVBQUU7b0JBQ1IsT0FBTyxDQUFDLEtBQUssQ0FBQyxnQkFBZ0IsQ0FBQyxDQUFDO2lCQUNuQztZQUNMLENBQUM7U0FDSjtLQUNKLENBQUM7QUFDTixDQUFDO0FBakNELDBDQWlDQztBQUFBLENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBBc3NldEluZm8gfSBmcm9tIFwiQGNvY29zL2NyZWF0b3ItdHlwZXMvZWRpdG9yL3BhY2thZ2VzL2Fzc2V0LWRiL0B0eXBlcy9wdWJsaWNcIjtcblxuXG4vL25hbWU6dHlwZVxudHlwZSBQcm9wcyA9IHsgW3V1aWQ6IHN0cmluZ106IHsga2V5OiBzdHJpbmcsIHR5cGU6IHN0cmluZyB9IH1cblxuZnVuY3Rpb24gZ2V0UHJvcHModXVpZDogc3RyaW5nLCByZXN1bHQ/OiBQcm9wcyk6IFByb21pc2U8UHJvcHM+IHtcbiAgICByZXN1bHQgPz89ICh7fSBhcyBQcm9wcyk7XG4gICAgcmV0dXJuIEVkaXRvci5NZXNzYWdlLnJlcXVlc3QoJ3NjZW5lJywgJ3F1ZXJ5LW5vZGUtdHJlZScsIHV1aWQpLnRoZW4oKGRhdGE6IGFueSkgPT4ge1xuICAgICAgICBpZiAoIWRhdGEpIHRocm93IG5ldyBFcnJvcignTm9kZSB0cmVlIG5vdCBmb3VuZCcpO1xuXG4gICAgICAgIGNvbnN0IHByb21pc2VzID0gZGF0YS5jaGlsZHJlbi5tYXAoYXN5bmMgKGNoaWxkOiBhbnkpID0+IHtcbiAgICAgICAgICAgIGNvbnN0IG5hbWUgPSBjaGlsZC5uYW1lIGFzIHN0cmluZztcbiAgICAgICAgICAgIGlmIChuYW1lLnN0YXJ0c1dpdGgoJyMnKSkge1xuICAgICAgICAgICAgICAgIGNvbnN0IGFyciA9IG5hbWUuc3BsaXQoJyMnKTtcbiAgICAgICAgICAgICAgICByZXN1bHQhW2NoaWxkLnV1aWRdID0ge1xuICAgICAgICAgICAgICAgICAgICBrZXk6IGFyclsxXSxcbiAgICAgICAgICAgICAgICAgICAgdHlwZTogYXJyWzJdIHx8ICdOb2RlJyxcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBhd2FpdCBnZXRQcm9wcyhjaGlsZC51dWlkLCByZXN1bHQpO1xuICAgICAgICB9KTtcblxuICAgICAgICByZXR1cm4gUHJvbWlzZS5hbGwocHJvbWlzZXMpLnRoZW4oKCkgPT4gcmVzdWx0ISk7XG4gICAgfSk7XG59XG5cbmFzeW5jIGZ1bmN0aW9uIGNyZWF0ZVNjcmlwdChpbmZvOiB7IHVybDogc3RyaW5nLCBuYW1lOiBzdHJpbmcsIHByb3BzOiBQcm9wcyB9KTogUHJvbWlzZTxhbnk+IHtcbiAgICBjb25zdCBiYXNlc2NyaXB0ID0gYEJhc2Uke2luZm8ubmFtZX1gXG4gICAgY29uc3QgcHJlZml4ID0gXCJkYjovL2Fzc2V0cy9yZXNvdXJjZXMvXCI7XG4gICAgY29uc3QgX19wYXRoX18gPSBpbmZvLnVybD8uc3RhcnRzV2l0aChwcmVmaXgpID8gaW5mby51cmw/LnNsaWNlKHByZWZpeC5sZW5ndGgsIC1cIi5wcmVmYWJcIi5sZW5ndGgpIDogaW5mby51cmxcbiAgICBjb25zdCBpbXBvcnRzID0gWy4uLm5ldyBTZXQoT2JqZWN0LmtleXMoaW5mby5wcm9wcykubWFwKHV1aWQgPT4gaW5mby5wcm9wc1t1dWlkXS50eXBlKSldLmpvaW4oJywnKTtcbiAgICBjb25zdCBkZWZwcm9wcyA9IE9iamVjdC5rZXlzKGluZm8ucHJvcHMpLm1hcCgodXVpZCkgPT4ge1xuICAgICAgICBjb25zdCBwcm9wa2V5ID0gaW5mby5wcm9wc1t1dWlkXS5rZXlcbiAgICAgICAgY29uc3QgcHJvcHR5cGUgPSBpbmZvLnByb3BzW3V1aWRdLnR5cGVcbiAgICAgICAgcmV0dXJuIGBAcHJvcGVydHkoeyB0eXBlOiAke3Byb3B0eXBlfSB9KSAke3Byb3BrZXl9OiR7cHJvcHR5cGV9ID0gbnVsbCE7YFxuICAgIH0pLmpvaW4oJ1xcblxcdCcpO1xuXG4gICAgLy/liJvlu7piYXNl6ISa5pysXG4gICAgbGV0IGNvbnRlbnQgPSBgXG5pbXBvcnQgeyBfZGVjb3JhdG9yLENvbXBvbmVudCwke2ltcG9ydHN9IH0gZnJvbSAnY2MnO1xuaW1wb3J0IHsgQmFzZVZpZXcgfSBmcm9tIFwiQG1mbG93L2xpYnNcIjtcbmNvbnN0IHsgY2NjbGFzcywgcHJvcGVydHksIGRpc2FsbG93TXVsdGlwbGUgfSA9IF9kZWNvcmF0b3I7XG5AZGlzYWxsb3dNdWx0aXBsZSgpXG5leHBvcnQgYWJzdHJhY3QgY2xhc3MgJHtiYXNlc2NyaXB0fSBleHRlbmRzIEJhc2VWaWV3IHtcbiAgICAvKiogQGludGVybmFsICovXG4gICAgcHJpdmF0ZSBzdGF0aWMgcmVhZG9ubHkgX19wYXRoX186IHN0cmluZyA9IFwiJHtfX3BhdGhfX31cIjtcbiAgICAke2RlZnByb3BzfVxufWA7XG4gICAgYXdhaXQgRWRpdG9yLk1lc3NhZ2UucmVxdWVzdChcImFzc2V0LWRiXCIsICdjcmVhdGUtYXNzZXQnLCBgZGI6Ly9hc3NldHMvc3JjL3ZpZXdzLyR7YmFzZXNjcmlwdH0udHNgLCBjb250ZW50LCB7IG92ZXJ3cml0ZTogdHJ1ZSB9KVxuICAgIGNvbnNvbGUubG9nKGDliJvlu7rohJrmnKzmiJDlip86ICR7YmFzZXNjcmlwdH0udHNgKTtcblxuICAgIC8v5Yib5bu6dWnohJrmnKxcbiAgICBjb25zdCBhc3NldHMgPSBhd2FpdCBFZGl0b3IuTWVzc2FnZS5yZXF1ZXN0KCdhc3NldC1kYicsICdxdWVyeS1hc3NldHMnLCB7IHBhdHRlcm46IGBkYjovL2Fzc2V0cy8qKmAsIGNjVHlwZTogXCJjYy5TY3JpcHRcIiB9KTtcbiAgICBpZiAoYXNzZXRzLmZpbmRJbmRleCgoYXNzZXQ6IGFueSkgPT4gYXNzZXQubmFtZSA9PSBgJHtpbmZvLm5hbWV9LnRzYCkgPj0gMCkge1xuICAgICAgICBjb25zb2xlLmxvZyhg6Lez6L+H77yaJHtpbmZvLm5hbWV9LnRz6ISa5pys5bey5a2Y5Zyo77yM55u05o6l5L2/55So44CC6K+356Gu5L+d57un5om/5LqGJHtiYXNlc2NyaXB0feexu+OAgmApO1xuICAgICAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKCk7XG4gICAgfVxuICAgIGNvbnRlbnQgPSBgXG4vL0B0cy1pZ25vcmVcbmltcG9ydCB7ICR7YmFzZXNjcmlwdH0gfSBmcm9tICdkYjovL2Fzc2V0cy9zcmMvdmlld3MvJHtiYXNlc2NyaXB0fSc7XG5pbXBvcnQgeyBfZGVjb3JhdG9yIH0gZnJvbSAnY2MnO1xuY29uc3QgeyBjY2NsYXNzLCBwcm9wZXJ0eSB9ID0gX2RlY29yYXRvcjtcblxuQGNjY2xhc3MoJyR7aW5mby5uYW1lfScpXG5leHBvcnQgY2xhc3MgJHtpbmZvLm5hbWV9IGV4dGVuZHMgJHtiYXNlc2NyaXB0fSB7XG4gICAgb25FbnRlcihhcmdzPzogYW55KTogdm9pZCB7IH1cbiAgICBvbkV4aXQoKTogdm9pZCB7IH1cbiAgICBvblBhdXNlKCk6IHZvaWQgeyB9XG4gICAgb25SZXN1bWUoKTogdm9pZCB7IH1cbn1gXG4gICAgYXdhaXQgRWRpdG9yLk1lc3NhZ2UucmVxdWVzdChcImFzc2V0LWRiXCIsICdjcmVhdGUtYXNzZXQnLCBgZGI6Ly9hc3NldHMvc3JjL2dhbWUvZ3VpLyR7aW5mby5uYW1lfS50c2AsIGNvbnRlbnQpXG4gICAgY29uc29sZS5sb2coYOWIm+W7uuiEmuacrOaIkOWKnzogJHtpbmZvLm5hbWV9LnRzYCk7XG59XG5cbmFzeW5jIGZ1bmN0aW9uIGNyZWF0ZUNvbXBvbmVudCh1dWlkOiBzdHJpbmcsIHNjcmlwdDogc3RyaW5nKSB7XG4gICAgY29uc3QgcHJvcG5vZGVpbmZvID0gYXdhaXQgRWRpdG9yLk1lc3NhZ2UucmVxdWVzdCgnc2NlbmUnLCAncXVlcnktbm9kZS10cmVlJywgdXVpZCk7XG4gICAgLy9AdHMtaWdub3JlXG4gICAgY29uc3QgY29tcG9uZW50cyA9IHByb3Bub2RlaW5mby5jb21wb25lbnRzIGFzIHsgdHlwZTogc3RyaW5nLCB2YWx1ZTogc3RyaW5nIH1bXTtcbiAgICBpZiAoY29tcG9uZW50cy5maW5kSW5kZXgoKGNvbXA6IGFueSkgPT4gY29tcC50eXBlID09PSBzY3JpcHQpIDwgMCkge1xuICAgICAgICBjb25zdCBwcm9taXNlID0gYXdhaXQgRWRpdG9yLk1lc3NhZ2UucmVxdWVzdCgnc2NlbmUnLCAnY3JlYXRlLWNvbXBvbmVudCcsIHtcbiAgICAgICAgICAgIHV1aWQ6IHV1aWQsXG4gICAgICAgICAgICBjb21wb25lbnQ6IHNjcmlwdFxuICAgICAgICB9KTtcbiAgICAgICAgY29uc29sZS5sb2coYOaMgui9vSR7c2NyaXB0feaIkOWKn2ApO1xuICAgICAgICByZXR1cm4gcHJvbWlzZVxuICAgIH0gZWxzZSB7XG4gICAgICAgIGNvbnNvbGUubG9nKGDot7Pov4fvvJrlt7Lnu4/mjILovb3kuoYke3NjcmlwdH3vvIznm7TmjqXorr7nva7lsZ7mgKfjgILor7fnoa7kv53nu6fmib/kuoZCYXNlJHtzY3JpcHR957G744CCYCk7XG4gICAgfVxufVxuXG5hc3luYyBmdW5jdGlvbiBzZXRQcm9wcyh1dWlkOiBzdHJpbmcsIHByb3BzOiBQcm9wcykge1xuICAgIGNvbnN0IHByb21pc2UgPSBhd2FpdCBQcm9taXNlLmFsbChPYmplY3Qua2V5cyhwcm9wcykubWFwKGFzeW5jIChwcm9wbm9kZXV1aWQpID0+IHtcbiAgICAgICAgY29uc3QgcHJvcGtleSA9IHByb3BzW3Byb3Bub2RldXVpZF0ua2V5XG4gICAgICAgIGNvbnN0IHByb3B0eXBlID0gcHJvcHNbcHJvcG5vZGV1dWlkXS50eXBlXG4gICAgICAgIGxldCBwcm9wY29tcHV1aWQgPSBwcm9wbm9kZXV1aWQ7XG4gICAgICAgIGlmIChwcm9wdHlwZSAhPSAnTm9kZScpIHtcbiAgICAgICAgICAgIGNvbnN0IHByb3Bub2RlaW5mbyA9IGF3YWl0IEVkaXRvci5NZXNzYWdlLnJlcXVlc3QoJ3NjZW5lJywgJ3F1ZXJ5LW5vZGUtdHJlZScsIHByb3Bub2RldXVpZCk7XG4gICAgICAgICAgICAvL0B0cy1pZ25vcmVcbiAgICAgICAgICAgIGNvbnN0IGNvbXBvbmVudHMgPSBwcm9wbm9kZWluZm8uY29tcG9uZW50cyBhcyB7IHR5cGU6IHN0cmluZywgdmFsdWU6IHN0cmluZyB9W107XG4gICAgICAgICAgICBwcm9wY29tcHV1aWQgPSBjb21wb25lbnRzLmZpbmQoKGNvbXA6IGFueSkgPT4gY29tcC50eXBlID09PSBgY2MuJHtwcm9wdHlwZX1gKSEudmFsdWU7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIEVkaXRvci5NZXNzYWdlLnJlcXVlc3QoJ3NjZW5lJywgJ3NldC1wcm9wZXJ0eScsIHtcbiAgICAgICAgICAgIHV1aWQ6IHV1aWQsXG4gICAgICAgICAgICAvL+i/memHjOeahCAxIOihqOekuueahOaYr+W9k+WJjeS9oOimgeiuvue9rueahOe7hOS7tuWcqOaVtOS4quiKgueCueeahOe7hOS7tuWIl+ihqOeahOesrOWHoOS9jeOAglxuICAgICAgICAgICAgLy/lj6/ku6XlhYjpgJrov4cgY29uc3QgaW5kZXggPSBub2RlLmNvbXBvbmVudHMuZmluZEluZGV4KChjb21wOiBhbnkpID0+IGNvbXAudXVpZCA9PT0gYW5pbWF0aW9uQ29tcC51dWlkKTsgXG4gICAgICAgICAgICAvL+exu+S8vOi/meagt++8jOWPquimgeiDveefpemBk+S9oOiuvue9rue7hOS7tuWcqOesrOWHoOS9jeWNs+WPr+OAguebruWJjVByZWZhYuS4iuWPquaciVRyYW5zZm9ybeWSjOiEmuacrOe7hOS7tu+8jOaJgOS7peebtOaOpeWGmeatuzHlsLHlj6/ku6XkuobjgIJcbiAgICAgICAgICAgIHBhdGg6IGBfX2NvbXBzX18uMS4ke3Byb3BrZXl9YCxcbiAgICAgICAgICAgIGR1bXA6IHtcbiAgICAgICAgICAgICAgICB0eXBlOiBgY2MuJHtwcm9wdHlwZX1gLFxuICAgICAgICAgICAgICAgIHZhbHVlOiB7XG4gICAgICAgICAgICAgICAgICAgIC8v6L+Z6YeM5a+55bqU55qE5piv5bGe5oCn57G75Z6L55qEdXVpZCjmr5TlpoJub2Rl5LiK5oyC6L2955qEbGFiZWzjgIFidXR0b27nrYnnu4Tku7bnmoR1dWlkKVxuICAgICAgICAgICAgICAgICAgICAvL+WmguaenOaYr25vZGXnsbvlnovnmoTlsZ7mgKfvvIznm7TmjqXkvKDlhaVub2Rl55qEdXVpZOWNs+WPr+OAglxuICAgICAgICAgICAgICAgICAgICAvL+WmguaenOaYr+e7hOS7tuexu+Wei+eahOWxnuaAp++8jOmcgOimgeWFiOiOt+WPlue7hOS7tueahHV1aWTvvIzlho3kvKDlhaXjgIJcbiAgICAgICAgICAgICAgICAgICAgdXVpZDogcHJvcGNvbXB1dWlkLFxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfSlcbiAgICB9KSlcbiAgICBjb25zb2xlLmxvZygn6K6+572u5bGe5oCn5oiQ5YqfJyk7XG4gICAgcmV0dXJuIHByb21pc2Vcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIG9uSGllcmFyY2h5TWVudShhc3NldEluZm86IEFzc2V0SW5mbykge1xuICAgIHJldHVybiBbXG4gICAgICAgIHtcbiAgICAgICAgICAgIGxhYmVsOiAnaTE4bjptZmxvdy1mcmFtZXdvcmsuZXhwb3J0JyxcbiAgICAgICAgICAgIGVuYWJsZWQ6IHRydWUsXG4gICAgICAgICAgICBhc3luYyBjbGljaygpIHtcbiAgICAgICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICAgICAgICBjb25zdCB1dWlkID0gRWRpdG9yLlNlbGVjdGlvbi5nZXRTZWxlY3RlZChFZGl0b3IuU2VsZWN0aW9uLmdldExhc3RTZWxlY3RlZFR5cGUoKSlbMF07XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IG5vZGUgPSBhd2FpdCBFZGl0b3IuTWVzc2FnZS5yZXF1ZXN0KCdzY2VuZScsICdxdWVyeS1ub2RlJywgdXVpZCk7XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IHNjcmlwdCA9IG5vZGUubmFtZS52YWx1ZSBhcyBzdHJpbmdcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgcGF0aCA9IGF3YWl0IEVkaXRvci5NZXNzYWdlLnJlcXVlc3QoJ2Fzc2V0LWRiJywgJ3F1ZXJ5LXVybCcsIG5vZGUuX19wcmVmYWJfXy51dWlkKTtcblxuICAgICAgICAgICAgICAgICAgICAvL+iOt+WPlnByZWZhYuS4reiiq+aMh+WumuWvvOWHuueahOWxnuaAp1xuICAgICAgICAgICAgICAgICAgICBjb25zdCBwcm9wcyA9IGF3YWl0IGdldFByb3BzKHV1aWQpO1xuXG4gICAgICAgICAgICAgICAgICAgIC8v5Yib5bu66ISa5pysXG4gICAgICAgICAgICAgICAgICAgIGF3YWl0IGNyZWF0ZVNjcmlwdCh7IHVybDogcGF0aCEsIG5hbWU6IHNjcmlwdCwgcHJvcHM6IHByb3BzIH0pXG5cbiAgICAgICAgICAgICAgICAgICAgLy/mjILovb3ohJrmnKxcbiAgICAgICAgICAgICAgICAgICAgYXdhaXQgY3JlYXRlQ29tcG9uZW50KHV1aWQsIHNjcmlwdCk7XG5cbiAgICAgICAgICAgICAgICAgICAgLy/orr7nva7lsZ7mgKdcbiAgICAgICAgICAgICAgICAgICAgYXdhaXQgc2V0UHJvcHModXVpZCwgcHJvcHMpO1xuXG4gICAgICAgICAgICAgICAgICAgIC8v5L+d5a2YcHJlZmFiXG4gICAgICAgICAgICAgICAgICAgIGF3YWl0IEVkaXRvci5NZXNzYWdlLnJlcXVlc3QoJ3NjZW5lJywgJ3NhdmUtc2NlbmUnKTtcbiAgICAgICAgICAgICAgICAgICAgY29uc29sZS5sb2coJ+WFqOmDqOWujOaIkCcpO1xuICAgICAgICAgICAgICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgICAgICAgICAgICAgICAgY29uc29sZS5lcnJvcign6K+36YCJ5Lit5LiA5LiqcHJlZmFi55qE6IqC54K5Jyk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSxcbiAgICAgICAgfSxcbiAgICBdO1xufTsiXX0=