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
import { BaseView } from "dzkcc-mflow/libs";
const { ccclass, property, disallowMultiple } = _decorator;
@disallowMultiple()
export abstract class ${basescript} extends BaseView {
    /** @internal */
    private static readonly __path__: string = "${__path__}";
    ${defprops}
}`;
    const basescripturl = `db://assets/src/views/${basescript}.ts`;
    await Editor.Message.request("asset-db", 'create-asset', basescripturl, content, { overwrite: true });
    await Editor.Message.request('asset-db', 'refresh-asset', basescripturl);
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
    const uiurl = `db://assets/src/game/gui/${info.name}.ts`;
    await Editor.Message.request("asset-db", 'create-asset', uiurl, content);
    await Editor.Message.request('asset-db', 'refresh-asset', uiurl);
    console.log(`创建脚本成功: ${info.name}.ts`);
}
async function createComponent(uuid, script) {
    const propnodeinfo = await Editor.Message.request('scene', 'query-node-tree', uuid);
    //@ts-ignore
    const components = propnodeinfo.components;
    if (components.findIndex((comp) => comp.type === script) < 0) {
        try {
            const promise = await Editor.Message.request('scene', 'create-component', {
                uuid: uuid,
                component: script
            });
            console.log(`挂载${script}成功`);
            return promise;
        }
        catch (error) {
            console.log(`挂载${script}失败`, error);
            return Promise.reject(error);
        }
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
        name: assetInfo.name.slice(0, -".prefab".length),
        path: assetInfo.path,
        // assetInfo.url:'db://assets/xxxx.prefab',
        // assetInfo.path:'db://assets/xxxx',
        uuid: assetInfo.uuid,
        originalInfo: assetInfo
    };
}
function onHierarchyMenu(assetInfo) {
    return [
        {
            label: 'i18n:mflow-tools.export',
            enabled: true,
            async click() {
                // const uuid = Editor.Selection.getSelected(Editor.Selection.getLastSelectedType())[0];
                // console.log('uuid:', uuid);
                // const node = await Editor.Message.request('scene', 'query-node', uuid);
                // console.log('node:', node);
                // const script = node.name.value as string
                // const path = await Editor.Message.request('asset-db', 'query-url', node.__prefab__.uuid);
                // console.log('path:', path);
                const assetInfo = await getSelectedAssetInfo();
                // 设置属性等需要打开prefab
                await Editor.Message.request('asset-db', 'open-asset', assetInfo.uuid);
                //场景中节点的 UUID，而不是资源的 UUID
                const uuid = Editor.Selection.getSelected(Editor.Selection.getLastSelectedType())[0];
                console.log('场景中节点的 UUID:', uuid);
                //获取prefab中被指定导出的属性
                const props = await getProps(uuid);
                //创建脚本
                await createScript({ url: assetInfo.path, name: assetInfo.name, props: props });
                //挂载脚本
                await createComponent(uuid, assetInfo.name);
                //设置属性
                await setProps(uuid, props);
                //保存prefab
                await Editor.Message.request('scene', 'save-scene');
                console.log('全部完成');
                // await Editor.Message.request('scene', 'close-scene');
            },
        },
    ];
}
exports.onHierarchyMenu = onHierarchyMenu;
;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaGllcmFyY2h5LW1lbnUuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi9zb3VyY2UvaGllcmFyY2h5LW1lbnUudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7O0FBTUEsU0FBUyxRQUFRLENBQUMsSUFBWSxFQUFFLE1BQWM7SUFDMUMsTUFBTSxhQUFOLE1BQU0sY0FBTixNQUFNLElBQU4sTUFBTSxHQUFNLEVBQVksRUFBQztJQUN6QixPQUFPLE1BQU0sQ0FBQyxPQUFPLENBQUMsT0FBTyxDQUFDLE9BQU8sRUFBRSxpQkFBaUIsRUFBRSxJQUFJLENBQUMsQ0FBQyxJQUFJLENBQUMsQ0FBQyxJQUFTLEVBQUUsRUFBRTtRQUMvRSxJQUFJLENBQUMsSUFBSTtZQUFFLE1BQU0sSUFBSSxLQUFLLENBQUMscUJBQXFCLENBQUMsQ0FBQztRQUVsRCxNQUFNLFFBQVEsR0FBRyxJQUFJLENBQUMsUUFBUSxDQUFDLEdBQUcsQ0FBQyxLQUFLLEVBQUUsS0FBVSxFQUFFLEVBQUU7WUFDcEQsTUFBTSxJQUFJLEdBQUcsS0FBSyxDQUFDLElBQWMsQ0FBQztZQUNsQyxJQUFJLElBQUksQ0FBQyxVQUFVLENBQUMsR0FBRyxDQUFDLEVBQUU7Z0JBQ3RCLE1BQU0sR0FBRyxHQUFHLElBQUksQ0FBQyxLQUFLLENBQUMsR0FBRyxDQUFDLENBQUM7Z0JBQzVCLE1BQU8sQ0FBQyxLQUFLLENBQUMsSUFBSSxDQUFDLEdBQUc7b0JBQ2xCLEdBQUcsRUFBRSxHQUFHLENBQUMsQ0FBQyxDQUFDO29CQUNYLElBQUksRUFBRSxHQUFHLENBQUMsQ0FBQyxDQUFDLElBQUksTUFBTTtpQkFDekIsQ0FBQTthQUNKO1lBQ0QsTUFBTSxRQUFRLENBQUMsS0FBSyxDQUFDLElBQUksRUFBRSxNQUFNLENBQUMsQ0FBQztRQUN2QyxDQUFDLENBQUMsQ0FBQztRQUVILE9BQU8sT0FBTyxDQUFDLEdBQUcsQ0FBQyxRQUFRLENBQUMsQ0FBQyxJQUFJLENBQUMsR0FBRyxFQUFFLENBQUMsTUFBTyxD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QUMsQ0FBQztnQkFFNUMsTUFBTTtnQkFDTixNQUFNLFFBQVEsQ0FBQyxJQUFJLEVBQUUsS0FBSyxDQUFDLENBQUM7Z0JBRTVCLFVBQVU7Z0JBQ1YsTUFBTSxNQUFNLENBQUMsT0FBTyxDQUFDLE9BQU8sQ0FBQyxPQUFPLEVBQUUsWUFBWSxDQUFDLENBQUM7Z0JBQ3BELE9BQU8sQ0FBQyxHQUFHLENBQUMsTUFBTSxDQUFDLENBQUM7Z0JBQ3BCLHdEQUF3RDtZQUM1RCxDQUFDO1NBQ0o7S0FDSixDQUFDO0FBQ04sQ0FBQztBQXhDRCwwQ0F3Q0M7QUFBQSxDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgQXNzZXRJbmZvIH0gZnJvbSBcIkBjb2Nvcy9jcmVhdG9yLXR5cGVzL2VkaXRvci9wYWNrYWdlcy9hc3NldC1kYi9AdHlwZXMvcHVibGljXCI7XG5cblxuLy9uYW1lOnR5cGVcbnR5cGUgUHJvcHMgPSB7IFt1dWlkOiBzdHJpbmddOiB7IGtleTogc3RyaW5nLCB0eXBlOiBzdHJpbmcgfSB9XG5cbmZ1bmN0aW9uIGdldFByb3BzKHV1aWQ6IHN0cmluZywgcmVzdWx0PzogUHJvcHMpOiBQcm9taXNlPFByb3BzPiB7XG4gICAgcmVzdWx0ID8/PSAoe30gYXMgUHJvcHMpO1xuICAgIHJldHVybiBFZGl0b3IuTWVzc2FnZS5yZXF1ZXN0KCdzY2VuZScsICdxdWVyeS1ub2RlLXRyZWUnLCB1dWlkKS50aGVuKChkYXRhOiBhbnkpID0+IHtcbiAgICAgICAgaWYgKCFkYXRhKSB0aHJvdyBuZXcgRXJyb3IoJ05vZGUgdHJlZSBub3QgZm91bmQnKTtcblxuICAgICAgICBjb25zdCBwcm9taXNlcyA9IGRhdGEuY2hpbGRyZW4ubWFwKGFzeW5jIChjaGlsZDogYW55KSA9PiB7XG4gICAgICAgICAgICBjb25zdCBuYW1lID0gY2hpbGQubmFtZSBhcyBzdHJpbmc7XG4gICAgICAgICAgICBpZiAobmFtZS5zdGFydHNXaXRoKCcjJykpIHtcbiAgICAgICAgICAgICAgICBjb25zdCBhcnIgPSBuYW1lLnNwbGl0KCcjJyk7XG4gICAgICAgICAgICAgICAgcmVzdWx0IVtjaGlsZC51dWlkXSA9IHtcbiAgICAgICAgICAgICAgICAgICAga2V5OiBhcnJbMV0sXG4gICAgICAgICAgICAgICAgICAgIHR5cGU6IGFyclsyXSB8fCAnTm9kZScsXG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgYXdhaXQgZ2V0UHJvcHMoY2hpbGQudXVpZCwgcmVzdWx0KTtcbiAgICAgICAgfSk7XG5cbiAgICAgICAgcmV0dXJuIFByb21pc2UuYWxsKHByb21pc2VzKS50aGVuKCgpID0+IHJlc3VsdCEpO1xuICAgIH0pO1xufVxuXG5hc3luYyBmdW5jdGlvbiBjcmVhdGVTY3JpcHQoaW5mbzogeyB1cmw6IHN0cmluZywgbmFtZTogc3RyaW5nLCBwcm9wczogUHJvcHMgfSk6IFByb21pc2U8YW55PiB7XG4gICAgY29uc3QgYmFzZXNjcmlwdCA9IGBCYXNlJHtpbmZvLm5hbWV9YFxuICAgIGNvbnN0IHByZWZpeCA9IFwiZGI6Ly9hc3NldHMvcmVzb3VyY2VzL1wiO1xuICAgIGNvbnN0IF9fcGF0aF9fID0gaW5mby51cmw/LnN0YXJ0c1dpdGgocHJlZml4KSA/IGluZm8udXJsPy5zbGljZShwcmVmaXgubGVuZ3RoLCAtXCIucHJlZmFiXCIubGVuZ3RoKSA6IGluZm8udXJsXG4gICAgY29uc3QgaW1wb3J0cyA9IFsuLi5uZXcgU2V0KE9iamVjdC5rZXlzKGluZm8ucHJvcHMpLm1hcCh1dWlkID0+IGluZm8ucHJvcHNbdXVpZF0udHlwZSkpXS5qb2luKCcsJyk7XG4gICAgY29uc3QgZGVmcHJvcHMgPSBPYmplY3Qua2V5cyhpbmZvLnByb3BzKS5tYXAoKHV1aWQpID0+IHtcbiAgICAgICAgY29uc3QgcHJvcGtleSA9IGluZm8ucHJvcHNbdXVpZF0ua2V5XG4gICAgICAgIGNvbnN0IHByb3B0eXBlID0gaW5mby5wcm9wc1t1dWlkXS50eXBlXG4gICAgICAgIHJldHVybiBgQHByb3BlcnR5KHsgdHlwZTogJHtwcm9wdHlwZX0gfSkgJHtwcm9wa2V5fToke3Byb3B0eXBlfSA9IG51bGwhO2BcbiAgICB9KS5qb2luKCdcXG5cXHQnKTtcblxuICAgIC8v5Yib5bu6YmFzZeiEmuacrFxuICAgIGxldCBjb250ZW50ID0gYFxuaW1wb3J0IHsgX2RlY29yYXRvcixDb21wb25lbnQsJHtpbXBvcnRzfSB9IGZyb20gJ2NjJztcbmltcG9ydCB7IEJhc2VWaWV3IH0gZnJvbSBcImR6a2NjLW1mbG93L2xpYnNcIjtcbmNvbnN0IHsgY2NjbGFzcywgcHJvcGVydHksIGRpc2FsbG93TXVsdGlwbGUgfSA9IF9kZWNvcmF0b3I7XG5AZGlzYWxsb3dNdWx0aXBsZSgpXG5leHBvcnQgYWJzdHJhY3QgY2xhc3MgJHtiYXNlc2NyaXB0fSBleHRlbmRzIEJhc2VWaWV3IHtcbiAgICAvKiogQGludGVybmFsICovXG4gICAgcHJpdmF0ZSBzdGF0aWMgcmVhZG9ubHkgX19wYXRoX186IHN0cmluZyA9IFwiJHtfX3BhdGhfX31cIjtcbiAgICAke2RlZnByb3BzfVxufWA7XG4gICAgY29uc3QgYmFzZXNjcmlwdHVybCA9IGBkYjovL2Fzc2V0cy9zcmMvdmlld3MvJHtiYXNlc2NyaXB0fS50c2A7XG4gICAgYXdhaXQgRWRpdG9yLk1lc3NhZ2UucmVxdWVzdChcImFzc2V0LWRiXCIsICdjcmVhdGUtYXNzZXQnLCBiYXNlc2NyaXB0dXJsLCBjb250ZW50LCB7IG92ZXJ3cml0ZTogdHJ1ZSB9KVxuICAgIGF3YWl0IEVkaXRvci5NZXNzYWdlLnJlcXVlc3QoJ2Fzc2V0LWRiJywgJ3JlZnJlc2gtYXNzZXQnLCBiYXNlc2NyaXB0dXJsKTtcbiAgICBjb25zb2xlLmxvZyhg5Yib5bu66ISa5pys5oiQ5YqfOiAke2Jhc2VzY3JpcHR9LnRzYCk7XG5cbiAgICAvL+WIm+W7unVp6ISa5pysXG4gICAgY29uc3QgYXNzZXRzID0gYXdhaXQgRWRpdG9yLk1lc3NhZ2UucmVxdWVzdCgnYXNzZXQtZGInLCAncXVlcnktYXNzZXRzJywgeyBwYXR0ZXJuOiBgZGI6Ly9hc3NldHMvKipgLCBjY1R5cGU6IFwiY2MuU2NyaXB0XCIgfSk7XG4gICAgaWYgKGFzc2V0cy5maW5kSW5kZXgoKGFzc2V0OiBhbnkpID0+IGFzc2V0Lm5hbWUgPT0gYCR7aW5mby5uYW1lfS50c2ApID49IDApIHtcbiAgICAgICAgY29uc29sZS5sb2coYOi3s+i/h++8miR7aW5mby5uYW1lfS50c+iEmuacrOW3suWtmOWcqO+8jOebtOaOpeS9v+eUqOOAguivt+ehruS/nee7p+aJv+S6hiR7YmFzZXNjcmlwdH3nsbvjgIJgKTtcbiAgICAgICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZSgpO1xuICAgIH1cbiAgICBjb250ZW50ID0gYFxuLy9AdHMtaWdub3JlXG5pbXBvcnQgeyAke2Jhc2VzY3JpcHR9IH0gZnJvbSAnZGI6Ly9hc3NldHMvc3JjL3ZpZXdzLyR7YmFzZXNjcmlwdH0nO1xuaW1wb3J0IHsgX2RlY29yYXRvciB9IGZyb20gJ2NjJztcbmNvbnN0IHsgY2NjbGFzcywgcHJvcGVydHkgfSA9IF9kZWNvcmF0b3I7XG5cbkBjY2NsYXNzKCcke2luZm8ubmFtZX0nKVxuZXhwb3J0IGNsYXNzICR7aW5mby5uYW1lfSBleHRlbmRzICR7YmFzZXNjcmlwdH0ge1xuICAgIG9uRW50ZXIoYXJncz86IGFueSk6IHZvaWQgeyB9XG4gICAgb25FeGl0KCk6IHZvaWQgeyB9XG4gICAgb25QYXVzZSgpOiB2b2lkIHsgfVxuICAgIG9uUmVzdW1lKCk6IHZvaWQgeyB9XG59YFxuICAgIGNvbnN0IHVpdXJsID0gYGRiOi8vYXNzZXRzL3NyYy9nYW1lL2d1aS8ke2luZm8ubmFtZX0udHNgO1xuICAgIGF3YWl0IEVkaXRvci5NZXNzYWdlLnJlcXVlc3QoXCJhc3NldC1kYlwiLCAnY3JlYXRlLWFzc2V0JywgdWl1cmwsIGNvbnRlbnQpXG4gICAgYXdhaXQgRWRpdG9yLk1lc3NhZ2UucmVxdWVzdCgnYXNzZXQtZGInLCAncmVmcmVzaC1hc3NldCcsIHVpdXJsKTtcbiAgICBjb25zb2xlLmxvZyhg5Yib5bu66ISa5pys5oiQ5YqfOiAke2luZm8ubmFtZX0udHNgKTtcbn1cblxuYXN5bmMgZnVuY3Rpb24gY3JlYXRlQ29tcG9uZW50KHV1aWQ6IHN0cmluZywgc2NyaXB0OiBzdHJpbmcpIHtcbiAgICBjb25zdCBwcm9wbm9kZWluZm8gPSBhd2FpdCBFZGl0b3IuTWVzc2FnZS5yZXF1ZXN0KCdzY2VuZScsICdxdWVyeS1ub2RlLXRyZWUnLCB1dWlkKTtcbiAgICAvL0B0cy1pZ25vcmVcbiAgICBjb25zdCBjb21wb25lbnRzID0gcHJvcG5vZGVpbmZvLmNvbXBvbmVudHMgYXMgeyB0eXBlOiBzdHJpbmcsIHZhbHVlOiBzdHJpbmcgfVtdO1xuICAgIGlmIChjb21wb25lbnRzLmZpbmRJbmRleCgoY29tcDogYW55KSA9PiBjb21wLnR5cGUgPT09IHNjcmlwdCkgPCAwKSB7XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgICBjb25zdCBwcm9taXNlID0gYXdhaXQgRWRpdG9yLk1lc3NhZ2UucmVxdWVzdCgnc2NlbmUnLCAnY3JlYXRlLWNvbXBvbmVudCcsIHtcbiAgICAgICAgICAgICAgICB1dWlkOiB1dWlkLFxuICAgICAgICAgICAgICAgIGNvbXBvbmVudDogc2NyaXB0XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKGDmjILovb0ke3NjcmlwdH3miJDlip9gKTtcbiAgICAgICAgICAgIHJldHVybiBwcm9taXNlXG4gICAgICAgIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgICAgICAgICBjb25zb2xlLmxvZyhg5oyC6L29JHtzY3JpcHR95aSx6LSlYCwgZXJyb3IpO1xuICAgICAgICAgICAgcmV0dXJuIFByb21pc2UucmVqZWN0KGVycm9yKTtcbiAgICAgICAgfVxuICAgIH0gZWxzZSB7XG4gICAgICAgIGNvbnNvbGUubG9nKGDot7Pov4fvvJrlt7Lnu4/mjILovb3kuoYke3NjcmlwdH3vvIznm7TmjqXorr7nva7lsZ7mgKfjgILor7fnoa7kv53nu6fmib/kuoZCYXNlJHtzY3JpcHR957G744CCYCk7XG4gICAgfVxufVxuXG5hc3luYyBmdW5jdGlvbiBzZXRQcm9wcyh1dWlkOiBzdHJpbmcsIHByb3BzOiBQcm9wcykge1xuICAgIGNvbnN0IHByb21pc2UgPSBhd2FpdCBQcm9taXNlLmFsbChPYmplY3Qua2V5cyhwcm9wcykubWFwKGFzeW5jIChwcm9wbm9kZXV1aWQpID0+IHtcbiAgICAgICAgY29uc3QgcHJvcGtleSA9IHByb3BzW3Byb3Bub2RldXVpZF0ua2V5XG4gICAgICAgIGNvbnN0IHByb3B0eXBlID0gcHJvcHNbcHJvcG5vZGV1dWlkXS50eXBlXG4gICAgICAgIGxldCBwcm9wY29tcHV1aWQgPSBwcm9wbm9kZXV1aWQ7XG4gICAgICAgIGlmIChwcm9wdHlwZSAhPSAnTm9kZScpIHtcbiAgICAgICAgICAgIGNvbnN0IHByb3Bub2RlaW5mbyA9IGF3YWl0IEVkaXRvci5NZXNzYWdlLnJlcXVlc3QoJ3NjZW5lJywgJ3F1ZXJ5LW5vZGUtdHJlZScsIHByb3Bub2RldXVpZCk7XG4gICAgICAgICAgICAvL0B0cy1pZ25vcmVcbiAgICAgICAgICAgIGNvbnN0IGNvbXBvbmVudHMgPSBwcm9wbm9kZWluZm8uY29tcG9uZW50cyBhcyB7IHR5cGU6IHN0cmluZywgdmFsdWU6IHN0cmluZyB9W107XG4gICAgICAgICAgICBwcm9wY29tcHV1aWQgPSBjb21wb25lbnRzLmZpbmQoKGNvbXA6IGFueSkgPT4gY29tcC50eXBlID09PSBgY2MuJHtwcm9wdHlwZX1gKSEudmFsdWU7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIEVkaXRvci5NZXNzYWdlLnJlcXVlc3QoJ3NjZW5lJywgJ3NldC1wcm9wZXJ0eScsIHtcbiAgICAgICAgICAgIHV1aWQ6IHV1aWQsXG4gICAgICAgICAgICAvL+i/memHjOeahCAxIOihqOekuueahOaYr+W9k+WJjeS9oOimgeiuvue9rueahOe7hOS7tuWcqOaVtOS4quiKgueCueeahOe7hOS7tuWIl+ihqOeahOesrOWHoOS9jeOAglxuICAgICAgICAgICAgLy/lj6/ku6XlhYjpgJrov4cgY29uc3QgaW5kZXggPSBub2RlLmNvbXBvbmVudHMuZmluZEluZGV4KChjb21wOiBhbnkpID0+IGNvbXAudXVpZCA9PT0gYW5pbWF0aW9uQ29tcC51dWlkKTsgXG4gICAgICAgICAgICAvL+exu+S8vOi/meagt++8jOWPquimgeiDveefpemBk+S9oOiuvue9rue7hOS7tuWcqOesrOWHoOS9jeWNs+WPr+OAguebruWJjVByZWZhYuS4iuWPquaciVRyYW5zZm9ybeWSjOiEmuacrOe7hOS7tu+8jOaJgOS7peebtOaOpeWGmeatuzHlsLHlj6/ku6XkuobjgIJcbiAgICAgICAgICAgIHBhdGg6IGBfX2NvbXBzX18uMS4ke3Byb3BrZXl9YCxcbiAgICAgICAgICAgIGR1bXA6IHtcbiAgICAgICAgICAgICAgICB0eXBlOiBgY2MuJHtwcm9wdHlwZX1gLFxuICAgICAgICAgICAgICAgIHZhbHVlOiB7XG4gICAgICAgICAgICAgICAgICAgIC8v6L+Z6YeM5a+55bqU55qE5piv5bGe5oCn57G75Z6L55qEdXVpZCjmr5TlpoJub2Rl5LiK5oyC6L2955qEbGFiZWzjgIFidXR0b27nrYnnu4Tku7bnmoR1dWlkKVxuICAgICAgICAgICAgICAgICAgICAvL+WmguaenOaYr25vZGXnsbvlnovnmoTlsZ7mgKfvvIznm7TmjqXkvKDlhaVub2Rl55qEdXVpZOWNs+WPr+OAglxuICAgICAgICAgICAgICAgICAgICAvL+WmguaenOaYr+e7hOS7tuexu+Wei+eahOWxnuaAp++8jOmcgOimgeWFiOiOt+WPlue7hOS7tueahHV1aWTvvIzlho3kvKDlhaXjgIJcbiAgICAgICAgICAgICAgICAgICAgdXVpZDogcHJvcGNvbXB1dWlkLFxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfSlcbiAgICB9KSlcbiAgICBjb25zb2xlLmxvZygn6K6+572u5bGe5oCn5oiQ5YqfJyk7XG4gICAgcmV0dXJuIHByb21pc2Vcbn1cblxuLy8g6I635Y+W5ZyoQXNzZXRz6Z2i5p2/5Lit6YCJ5oup55qE6LWE5rqQXG5hc3luYyBmdW5jdGlvbiBnZXRTZWxlY3RlZEFzc2V0SW5mbygpIHtcbiAgICAvLyAxLiDojrflj5bpgInkuK3nmoTotYTmupBVVUlEXG4gICAgY29uc3Qgc2VsZWN0ZWRVdWlkcyA9IEVkaXRvci5TZWxlY3Rpb24uZ2V0U2VsZWN0ZWQoJ2Fzc2V0Jyk7XG5cbiAgICBpZiAoc2VsZWN0ZWRVdWlkcy5sZW5ndGggPT09IDApIHtcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKCfmnKrpgInkuK3ku7vkvZXotYTmupAnKTtcbiAgICB9XG5cbiAgICBjb25zdCBhc3NldFV1aWQgPSBzZWxlY3RlZFV1aWRzWzBdO1xuXG4gICAgY29uc29sZS5sb2coJ3NlbGVjdGVkVXVpZDonLCBhc3NldFV1aWQpO1xuXG4gICAgLy8gMi4g6I635Y+W6LWE5rqQ6K+m57uG5L+h5oGvXG4gICAgY29uc3QgYXNzZXRJbmZvID0gYXdhaXQgRWRpdG9yLk1lc3NhZ2UucmVxdWVzdCgnYXNzZXQtZGInLCAncXVlcnktYXNzZXQtaW5mbycsIGFzc2V0VXVpZCk7XG4gICAgaWYgKCFhc3NldEluZm8pIHtcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKCfotYTmupDkuI3lrZjlnKgnKTtcbiAgICB9XG4gICAgY29uc29sZS5sb2coJ2Fzc2V0SW5mbzonLCBhc3NldEluZm8pO1xuXG4gICAgLy8gMy4g5Yik5pat5piv5ZCm5Li6cHJlZmFi57G75Z6LXG4gICAgaWYgKGFzc2V0SW5mby50eXBlICE9PSAnY2MuUHJlZmFiJykge1xuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ+mAieS4reeahOi1hOa6kOS4jeaYr3ByZWZhYuexu+WeiycpO1xuICAgIH1cblxuICAgIC8vIOi/lOWbnue7k+aenFxuICAgIHJldHVybiB7XG4gICAgICAgIG5hbWU6IGFzc2V0SW5mby5uYW1lLnNsaWNlKDAsIC1cIi5wcmVmYWJcIi5sZW5ndGgpLCAvL+WOu+mZpC5wcmVmYWLlkI7nvIBcbiAgICAgICAgcGF0aDogYXNzZXRJbmZvLnBhdGgsXG4gICAgICAgIC8vIGFzc2V0SW5mby51cmw6J2RiOi8vYXNzZXRzL3h4eHgucHJlZmFiJyxcbiAgICAgICAgLy8gYXNzZXRJbmZvLnBhdGg6J2RiOi8vYXNzZXRzL3h4eHgnLFxuICAgICAgICB1dWlkOiBhc3NldEluZm8udXVpZCwgLy/otYTmupB1dWlkXG4gICAgICAgIG9yaWdpbmFsSW5mbzogYXNzZXRJbmZvXG4gICAgfTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIG9uSGllcmFyY2h5TWVudShhc3NldEluZm86IEFzc2V0SW5mbykge1xuICAgIHJldHVybiBbXG4gICAgICAgIHtcbiAgICAgICAgICAgIGxhYmVsOiAnaTE4bjptZmxvdy10b29scy5leHBvcnQnLFxuICAgICAgICAgICAgZW5hYmxlZDogdHJ1ZSxcbiAgICAgICAgICAgIGFzeW5jIGNsaWNrKCkge1xuICAgICAgICAgICAgICAgIC8vIGNvbnN0IHV1aWQgPSBFZGl0b3IuU2VsZWN0aW9uLmdldFNlbGVjdGVkKEVkaXRvci5TZWxlY3Rpb24uZ2V0TGFzdFNlbGVjdGVkVHlwZSgpKVswXTtcbiAgICAgICAgICAgICAgICAvLyBjb25zb2xlLmxvZygndXVpZDonLCB1dWlkKTtcbiAgICAgICAgICAgICAgICAvLyBjb25zdCBub2RlID0gYXdhaXQgRWRpdG9yLk1lc3NhZ2UucmVxdWVzdCgnc2NlbmUnLCAncXVlcnktbm9kZScsIHV1aWQpO1xuICAgICAgICAgICAgICAgIC8vIGNvbnNvbGUubG9nKCdub2RlOicsIG5vZGUpO1xuICAgICAgICAgICAgICAgIC8vIGNvbnN0IHNjcmlwdCA9IG5vZGUubmFtZS52YWx1ZSBhcyBzdHJpbmdcbiAgICAgICAgICAgICAgICAvLyBjb25zdCBwYXRoID0gYXdhaXQgRWRpdG9yLk1lc3NhZ2UucmVxdWVzdCgnYXNzZXQtZGInLCAncXVlcnktdXJsJywgbm9kZS5fX3ByZWZhYl9fLnV1aWQpO1xuICAgICAgICAgICAgICAgIC8vIGNvbnNvbGUubG9nKCdwYXRoOicsIHBhdGgpO1xuICAgICAgICAgICAgICAgIGNvbnN0IGFzc2V0SW5mbyA9IGF3YWl0IGdldFNlbGVjdGVkQXNzZXRJbmZvKCk7XG5cbiAgICAgICAgICAgICAgICAvLyDorr7nva7lsZ7mgKfnrYnpnIDopoHmiZPlvIBwcmVmYWJcbiAgICAgICAgICAgICAgICBhd2FpdCBFZGl0b3IuTWVzc2FnZS5yZXF1ZXN0KCdhc3NldC1kYicsICdvcGVuLWFzc2V0JywgYXNzZXRJbmZvLnV1aWQpO1xuXG4gICAgICAgICAgICAgICAgLy/lnLrmma/kuK3oioLngrnnmoQgVVVJRO+8jOiAjOS4jeaYr+i1hOa6kOeahCBVVUlEXG4gICAgICAgICAgICAgICAgY29uc3QgdXVpZCA9IEVkaXRvci5TZWxlY3Rpb24uZ2V0U2VsZWN0ZWQoRWRpdG9yLlNlbGVjdGlvbi5nZXRMYXN0U2VsZWN0ZWRUeXBlKCkpWzBdO1xuICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKCflnLrmma/kuK3oioLngrnnmoQgVVVJRDonLCB1dWlkKTtcbiAgICAgICAgICAgICAgICAvL+iOt+WPlnByZWZhYuS4reiiq+aMh+WumuWvvOWHuueahOWxnuaAp1xuICAgICAgICAgICAgICAgIGNvbnN0IHByb3BzID0gYXdhaXQgZ2V0UHJvcHModXVpZCk7XG5cbiAgICAgICAgICAgICAgICAvL+WIm+W7uuiEmuacrFxuICAgICAgICAgICAgICAgIGF3YWl0IGNyZWF0ZVNjcmlwdCh7IHVybDogYXNzZXRJbmZvLnBhdGgsIG5hbWU6IGFzc2V0SW5mby5uYW1lLCBwcm9wczogcHJvcHMgfSlcblxuICAgICAgICAgICAgICAgIC8v5oyC6L296ISa5pysXG4gICAgICAgICAgICAgICAgYXdhaXQgY3JlYXRlQ29tcG9uZW50KHV1aWQsIGFzc2V0SW5mby5uYW1lKTtcblxuICAgICAgICAgICAgICAgIC8v6K6+572u5bGe5oCnXG4gICAgICAgICAgICAgICAgYXdhaXQgc2V0UHJvcHModXVpZCwgcHJvcHMpO1xuXG4gICAgICAgICAgICAgICAgLy/kv53lrZhwcmVmYWJcbiAgICAgICAgICAgICAgICBhd2FpdCBFZGl0b3IuTWVzc2FnZS5yZXF1ZXN0KCdzY2VuZScsICdzYXZlLXNjZW5lJyk7XG4gICAgICAgICAgICAgICAgY29uc29sZS5sb2coJ+WFqOmDqOWujOaIkCcpO1xuICAgICAgICAgICAgICAgIC8vIGF3YWl0IEVkaXRvci5NZXNzYWdlLnJlcXVlc3QoJ3NjZW5lJywgJ2Nsb3NlLXNjZW5lJyk7XG4gICAgICAgICAgICB9LFxuICAgICAgICB9LFxuICAgIF07XG59OyJdfQ==