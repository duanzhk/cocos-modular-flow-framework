"use strict";
/**
 * @en Generate base ui script, and automatically reference the elements that need to be operated on the prefab.
 * @zh 生成预置体脚本，并自动引用prefab上需要操作的元素。
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.onGenerateBaseUI = void 0;
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
    const basescript = `Base${info.name}`;
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
    private static readonly __path__: string = "${info.url}";
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
import { view } from 'dzkcc-mflow/core';
const { ccclass, property } = _decorator;

@view()
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
// 等待场景准备就绪
async function waitForSceneReady(timeoutMs = 5000) {
    const startTime = Date.now();
    while (Date.now() - startTime < timeoutMs) {
        try {
            // 使用 query-is-ready 检查场景是否准备好
            const isReady = await Editor.Message.request('scene', 'query-is-ready');
            if (isReady) {
                return true;
            }
        }
        catch (error) {
            // 继续等待
        }
        // 等待 100ms 后重试
        await new Promise(resolve => setTimeout(resolve, 100));
    }
    return false;
}
function onGenerateBaseUI(assetInfo) {
    return [
        {
            label: 'i18n:mflow-tools.generate-base-ui',
            enabled: true,
            async click() {
                const assetInfo = await getSelectedAssetInfo();
                // 设置属性等需要打开prefab
                await Editor.Message.request('asset-db', 'open-asset', assetInfo.uuid);
                // 等待场景准备就绪
                await waitForSceneReady();
                // 场景中节点的 UUID，而不是资源的 UUID;通过资源UUID获取场景中节点的UUID
                const nodeUuids = await Editor.Message.request('scene', 'query-nodes-by-asset-uuid', assetInfo.uuid);
                if (!nodeUuids || nodeUuids.length === 0) {
                    throw new Error('未找到打开的prefab节点');
                }
                console.log('场景中节点的 UUIDs:', nodeUuids);
                const rootNodeUuid = nodeUuids[0];
                //获取prefab中被指定导出的属性
                const props = await getProps(rootNodeUuid);
                //创建脚本
                await createScript({ url: assetInfo.path, name: assetInfo.name, props: props });
                //挂载脚本
                await createComponent(rootNodeUuid, assetInfo.name);
                //设置属性
                await setProps(rootNodeUuid, props);
                //保存prefab
                await Editor.Message.request('scene', 'save-scene');
                // 等待场景准备就绪
                await waitForSceneReady();
                await Editor.Message.request('scene', 'close-scene');
                console.log('全部完成');
            },
        },
    ];
}
exports.onGenerateBaseUI = onGenerateBaseUI;
;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZ2VuZXJhdGUtYmFzZS11aS5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uL3NvdXJjZS9nZW5lcmF0ZS1iYXNlLXVpLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7QUFBQTs7O0dBR0c7OztBQVFILFNBQVMsUUFBUSxDQUFDLElBQVksRUFBRSxNQUFjO0lBQzFDLE1BQU0sYUFBTixNQUFNLGNBQU4sTUFBTSxJQUFOLE1BQU0sR0FBTSxFQUFZLEVBQUM7SUFDekIsT0FBTyxNQUFNLENBQUMsT0FBTyxDQUFDLE9BQU8sQ0FBQyxPQUFPLEVBQUUsaUJBQWlCLEVBQUUsSUFBSSxDQUFDLENBQUMsSUFBSSxDQUFDLENBQUMsSUFBUyxFQUFFLEVBQUU7UUFDL0UsSUFBSSxDQUFDLElBQUk7WUFBRSxNQUFNLElBQUksS0FBSyxDQUFDLHFCQUFxQixDQUFDLENBQUM7UUFFbEQsTUFBTSxRQUFRLEdBQUcsSUFBSSxDQUFDLFFBQVEsQ0FBQyxHQUFHLENBQUMsS0FBSyxFQUFFLEtBQVUsRUFBRSxFQUFFO1lBQ3BELE1BQU0sSUFBSSxHQUFHLEtBQUssQ0FBQyxJQUFjLENBQUM7WUFDbEMsSUFBSSxJQUFJLENBQUMsVUFBVSxDQUFDLEdBQUcsQ0FBQyxFQUFFO2dCQUN0QixNQUFNLEdBQUcsR0FBRyxJQUFJLENBQUMsS0FBSyxDQUFDLEdBQUcsQ0FBQyxDQUFDO2dCQUM1QixNQUFPLENBQUMsS0FBSyxDQUFDLElBQUksQ0FBQyxHQUFHO29CQUNsQixHQUFHLEVBQUUsR0FBRyxDQUFDLENBQUMsQ0FBQztvQkFDWCxJQUFJLEVBQUUsR0FBRyxDQUFDLENBQUMsQ0FBQyxJQUFJLE1BQU07aUJBQ3pCLENBQUE7YUFDSjtZQUNELE1BQU0sUUFBUSxDQUFDLEtBQUssQ0FBQyxJQUFJLEVBQUUsTUFBTSxDQUFDLENBQUM7UUFDdkMsQ0FBQyxDQUFDLENBQUM7UUFFSCxPQUFPLE9BQU8sQ0FBQyxHQUFHLENBQUMsUUFBUSxDQUFDLENBQUMsSUFBSSxDQUFDLEdBQUcs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aUJBQ3JDO2dCQUNELE9BQU8sQ0FBQyxHQUFHLENBQUMsZUFBZSxFQUFFLFNBQVMsQ0FBQyxDQUFDO2dCQUN4QyxNQUFNLFlBQVksR0FBRyxTQUFTLENBQUMsQ0FBQyxDQUFDLENBQUM7Z0JBQ2xDLG1CQUFtQjtnQkFDbkIsTUFBTSxLQUFLLEdBQUcsTUFBTSxRQUFRLENBQUMsWUFBWSxDQUFDLENBQUM7Z0JBRTNDLE1BQU07Z0JBQ04sTUFBTSxZQUFZLENBQUMsRUFBRSxHQUFHLEVBQUUsU0FBUyxDQUFDLElBQUksRUFBRSxJQUFJLEVBQUUsU0FBUyxDQUFDLElBQUksRUFBRSxLQUFLLEVBQUUsS0FBSyxFQUFFLENBQUMsQ0FBQTtnQkFFL0UsTUFBTTtnQkFDTixNQUFNLGVBQWUsQ0FBQyxZQUFZLEVBQUUsU0FBUyxDQUFDLElBQUksQ0FBQyxDQUFDO2dCQUVwRCxNQUFNO2dCQUNOLE1BQU0sUUFBUSxDQUFDLFlBQVksRUFBRSxLQUFLLENBQUMsQ0FBQztnQkFFcEMsVUFBVTtnQkFDVixNQUFNLE1BQU0sQ0FBQyxPQUFPLENBQUMsT0FBTyxDQUFDLE9BQU8sRUFBRSxZQUFZLENBQUMsQ0FBQztnQkFFcEQsV0FBVztnQkFDWCxNQUFNLGlCQUFpQixFQUFFLENBQUM7Z0JBRTFCLE1BQU0sTUFBTSxDQUFDLE9BQU8sQ0FBQyxPQUFPLENBQUMsT0FBTyxFQUFFLGFBQWEsQ0FBQyxDQUFDO2dCQUVyRCxPQUFPLENBQUMsR0FBRyxDQUFDLE1BQU0sQ0FBQyxDQUFDO1lBQ3hCLENBQUM7U0FDSjtLQUNKLENBQUM7QUFDTixDQUFDO0FBN0NELDRDQTZDQztBQUFBLENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEBlbiBHZW5lcmF0ZSBiYXNlIHVpIHNjcmlwdCwgYW5kIGF1dG9tYXRpY2FsbHkgcmVmZXJlbmNlIHRoZSBlbGVtZW50cyB0aGF0IG5lZWQgdG8gYmUgb3BlcmF0ZWQgb24gdGhlIHByZWZhYi5cbiAqIEB6aCDnlJ/miJDpooTnva7kvZPohJrmnKzvvIzlubboh6rliqjlvJXnlKhwcmVmYWLkuIrpnIDopoHmk43kvZznmoTlhYPntKDjgIJcbiAqL1xuXG5pbXBvcnQgeyBBc3NldEluZm8gfSBmcm9tIFwiQGNvY29zL2NyZWF0b3ItdHlwZXMvZWRpdG9yL3BhY2thZ2VzL2Fzc2V0LWRiL0B0eXBlcy9wdWJsaWNcIjtcblxuXG4vL25hbWU6dHlwZVxudHlwZSBQcm9wcyA9IHsgW3V1aWQ6IHN0cmluZ106IHsga2V5OiBzdHJpbmcsIHR5cGU6IHN0cmluZyB9IH1cblxuZnVuY3Rpb24gZ2V0UHJvcHModXVpZDogc3RyaW5nLCByZXN1bHQ/OiBQcm9wcyk6IFByb21pc2U8UHJvcHM+IHtcbiAgICByZXN1bHQgPz89ICh7fSBhcyBQcm9wcyk7XG4gICAgcmV0dXJuIEVkaXRvci5NZXNzYWdlLnJlcXVlc3QoJ3NjZW5lJywgJ3F1ZXJ5LW5vZGUtdHJlZScsIHV1aWQpLnRoZW4oKGRhdGE6IGFueSkgPT4ge1xuICAgICAgICBpZiAoIWRhdGEpIHRocm93IG5ldyBFcnJvcignTm9kZSB0cmVlIG5vdCBmb3VuZCcpO1xuXG4gICAgICAgIGNvbnN0IHByb21pc2VzID0gZGF0YS5jaGlsZHJlbi5tYXAoYXN5bmMgKGNoaWxkOiBhbnkpID0+IHtcbiAgICAgICAgICAgIGNvbnN0IG5hbWUgPSBjaGlsZC5uYW1lIGFzIHN0cmluZztcbiAgICAgICAgICAgIGlmIChuYW1lLnN0YXJ0c1dpdGgoJyMnKSkge1xuICAgICAgICAgICAgICAgIGNvbnN0IGFyciA9IG5hbWUuc3BsaXQoJyMnKTtcbiAgICAgICAgICAgICAgICByZXN1bHQhW2NoaWxkLnV1aWRdID0ge1xuICAgICAgICAgICAgICAgICAgICBrZXk6IGFyclsxXSxcbiAgICAgICAgICAgICAgICAgICAgdHlwZTogYXJyWzJdIHx8ICdOb2RlJyxcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBhd2FpdCBnZXRQcm9wcyhjaGlsZC51dWlkLCByZXN1bHQpO1xuICAgICAgICB9KTtcblxuICAgICAgICByZXR1cm4gUHJvbWlzZS5hbGwocHJvbWlzZXMpLnRoZW4oKCkgPT4gcmVzdWx0ISk7XG4gICAgfSk7XG59XG5cbmFzeW5jIGZ1bmN0aW9uIGNyZWF0ZVNjcmlwdChpbmZvOiB7IHVybDogc3RyaW5nLCBuYW1lOiBzdHJpbmcsIHByb3BzOiBQcm9wcyB9KTogUHJvbWlzZTxhbnk+IHtcbiAgICBjb25zdCBiYXNlc2NyaXB0ID0gYEJhc2Uke2luZm8ubmFtZX1gXG4gICAgY29uc3QgaW1wb3J0cyA9IFsuLi5uZXcgU2V0KE9iamVjdC5rZXlzKGluZm8ucHJvcHMpLm1hcCh1dWlkID0+IGluZm8ucHJvcHNbdXVpZF0udHlwZSkpXS5qb2luKCcsJyk7XG4gICAgY29uc3QgZGVmcHJvcHMgPSBPYmplY3Qua2V5cyhpbmZvLnByb3BzKS5tYXAoKHV1aWQpID0+IHtcbiAgICAgICAgY29uc3QgcHJvcGtleSA9IGluZm8ucHJvcHNbdXVpZF0ua2V5XG4gICAgICAgIGNvbnN0IHByb3B0eXBlID0gaW5mby5wcm9wc1t1dWlkXS50eXBlXG4gICAgICAgIHJldHVybiBgQHByb3BlcnR5KHsgdHlwZTogJHtwcm9wdHlwZX0gfSkgJHtwcm9wa2V5fToke3Byb3B0eXBlfSA9IG51bGwhO2BcbiAgICB9KS5qb2luKCdcXG5cXHQnKTtcblxuICAgIC8v5Yib5bu6YmFzZeiEmuacrFxuICAgIGxldCBjb250ZW50ID0gYFxuaW1wb3J0IHsgX2RlY29yYXRvcixDb21wb25lbnQsJHtpbXBvcnRzfSB9IGZyb20gJ2NjJztcbmltcG9ydCB7IEJhc2VWaWV3IH0gZnJvbSBcImR6a2NjLW1mbG93L2xpYnNcIjtcbmNvbnN0IHsgY2NjbGFzcywgcHJvcGVydHksIGRpc2FsbG93TXVsdGlwbGUgfSA9IF9kZWNvcmF0b3I7XG5AZGlzYWxsb3dNdWx0aXBsZSgpXG5leHBvcnQgYWJzdHJhY3QgY2xhc3MgJHtiYXNlc2NyaXB0fSBleHRlbmRzIEJhc2VWaWV3IHtcbiAgICAvKiogQGludGVybmFsICovXG4gICAgcHJpdmF0ZSBzdGF0aWMgcmVhZG9ubHkgX19wYXRoX186IHN0cmluZyA9IFwiJHtpbmZvLnVybH1cIjtcbiAgICAke2RlZnByb3BzfVxufWA7XG4gICAgY29uc3QgYmFzZXNjcmlwdHVybCA9IGBkYjovL2Fzc2V0cy9zcmMvdmlld3MvJHtiYXNlc2NyaXB0fS50c2A7XG4gICAgYXdhaXQgRWRpdG9yLk1lc3NhZ2UucmVxdWVzdChcImFzc2V0LWRiXCIsICdjcmVhdGUtYXNzZXQnLCBiYXNlc2NyaXB0dXJsLCBjb250ZW50LCB7IG92ZXJ3cml0ZTogdHJ1ZSB9KVxuICAgIGF3YWl0IEVkaXRvci5NZXNzYWdlLnJlcXVlc3QoJ2Fzc2V0LWRiJywgJ3JlZnJlc2gtYXNzZXQnLCBiYXNlc2NyaXB0dXJsKTtcbiAgICBjb25zb2xlLmxvZyhg5Yib5bu66ISa5pys5oiQ5YqfOiAke2Jhc2VzY3JpcHR9LnRzYCk7XG5cbiAgICAvL+WIm+W7unVp6ISa5pysXG4gICAgY29uc3QgYXNzZXRzID0gYXdhaXQgRWRpdG9yLk1lc3NhZ2UucmVxdWVzdCgnYXNzZXQtZGInLCAncXVlcnktYXNzZXRzJywgeyBwYXR0ZXJuOiBgZGI6Ly9hc3NldHMvKipgLCBjY1R5cGU6IFwiY2MuU2NyaXB0XCIgfSk7XG4gICAgaWYgKGFzc2V0cy5maW5kSW5kZXgoKGFzc2V0OiBhbnkpID0+IGFzc2V0Lm5hbWUgPT0gYCR7aW5mby5uYW1lfS50c2ApID49IDApIHtcbiAgICAgICAgY29uc29sZS5sb2coYOi3s+i/h++8miR7aW5mby5uYW1lfS50c+iEmuacrOW3suWtmOWcqO+8jOebtOaOpeS9v+eUqOOAguivt+ehruS/nee7p+aJv+S6hiR7YmFzZXNjcmlwdH3nsbvjgIJgKTtcbiAgICAgICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZSgpO1xuICAgIH1cbiAgICBjb250ZW50ID0gYFxuLy9AdHMtaWdub3JlXG5pbXBvcnQgeyAke2Jhc2VzY3JpcHR9IH0gZnJvbSAnZGI6Ly9hc3NldHMvc3JjL3ZpZXdzLyR7YmFzZXNjcmlwdH0nO1xuaW1wb3J0IHsgX2RlY29yYXRvciB9IGZyb20gJ2NjJztcbmltcG9ydCB7IHZpZXcgfSBmcm9tICdkemtjYy1tZmxvdy9jb3JlJztcbmNvbnN0IHsgY2NjbGFzcywgcHJvcGVydHkgfSA9IF9kZWNvcmF0b3I7XG5cbkB2aWV3KClcbkBjY2NsYXNzKCcke2luZm8ubmFtZX0nKVxuZXhwb3J0IGNsYXNzICR7aW5mby5uYW1lfSBleHRlbmRzICR7YmFzZXNjcmlwdH0ge1xuICAgIG9uRW50ZXIoYXJncz86IGFueSk6IHZvaWQgeyB9XG4gICAgb25FeGl0KCk6IHZvaWQgeyB9XG4gICAgb25QYXVzZSgpOiB2b2lkIHsgfVxuICAgIG9uUmVzdW1lKCk6IHZvaWQgeyB9XG59YFxuICAgIGNvbnN0IHVpdXJsID0gYGRiOi8vYXNzZXRzL3NyYy9nYW1lL2d1aS8ke2luZm8ubmFtZX0udHNgO1xuICAgIGF3YWl0IEVkaXRvci5NZXNzYWdlLnJlcXVlc3QoXCJhc3NldC1kYlwiLCAnY3JlYXRlLWFzc2V0JywgdWl1cmwsIGNvbnRlbnQpXG4gICAgYXdhaXQgRWRpdG9yLk1lc3NhZ2UucmVxdWVzdCgnYXNzZXQtZGInLCAncmVmcmVzaC1hc3NldCcsIHVpdXJsKTtcbiAgICBjb25zb2xlLmxvZyhg5Yib5bu66ISa5pys5oiQ5YqfOiAke2luZm8ubmFtZX0udHNgKTtcbn1cblxuYXN5bmMgZnVuY3Rpb24gY3JlYXRlQ29tcG9uZW50KHV1aWQ6IHN0cmluZywgc2NyaXB0OiBzdHJpbmcpIHtcbiAgICBjb25zdCBwcm9wbm9kZWluZm8gPSBhd2FpdCBFZGl0b3IuTWVzc2FnZS5yZXF1ZXN0KCdzY2VuZScsICdxdWVyeS1ub2RlLXRyZWUnLCB1dWlkKTtcbiAgICAvL0B0cy1pZ25vcmVcbiAgICBjb25zdCBjb21wb25lbnRzID0gcHJvcG5vZGVpbmZvLmNvbXBvbmVudHMgYXMgeyB0eXBlOiBzdHJpbmcsIHZhbHVlOiBzdHJpbmcgfVtdO1xuICAgIGlmIChjb21wb25lbnRzLmZpbmRJbmRleCgoY29tcDogYW55KSA9PiBjb21wLnR5cGUgPT09IHNjcmlwdCkgPCAwKSB7XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgICBjb25zdCBwcm9taXNlID0gYXdhaXQgRWRpdG9yLk1lc3NhZ2UucmVxdWVzdCgnc2NlbmUnLCAnY3JlYXRlLWNvbXBvbmVudCcsIHtcbiAgICAgICAgICAgICAgICB1dWlkOiB1dWlkLFxuICAgICAgICAgICAgICAgIGNvbXBvbmVudDogc2NyaXB0XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKGDmjILovb0ke3NjcmlwdH3miJDlip9gKTtcbiAgICAgICAgICAgIHJldHVybiBwcm9taXNlXG4gICAgICAgIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgICAgICAgICBjb25zb2xlLmxvZyhg5oyC6L29JHtzY3JpcHR95aSx6LSlYCwgZXJyb3IpO1xuICAgICAgICAgICAgcmV0dXJuIFByb21pc2UucmVqZWN0KGVycm9yKTtcbiAgICAgICAgfVxuICAgIH0gZWxzZSB7XG4gICAgICAgIGNvbnNvbGUubG9nKGDot7Pov4fvvJrlt7Lnu4/mjILovb3kuoYke3NjcmlwdH3vvIznm7TmjqXorr7nva7lsZ7mgKfjgILor7fnoa7kv53nu6fmib/kuoZCYXNlJHtzY3JpcHR957G744CCYCk7XG4gICAgfVxufVxuXG5hc3luYyBmdW5jdGlvbiBzZXRQcm9wcyh1dWlkOiBzdHJpbmcsIHByb3BzOiBQcm9wcykge1xuICAgIGNvbnN0IHByb21pc2UgPSBhd2FpdCBQcm9taXNlLmFsbChPYmplY3Qua2V5cyhwcm9wcykubWFwKGFzeW5jIChwcm9wbm9kZXV1aWQpID0+IHtcbiAgICAgICAgY29uc3QgcHJvcGtleSA9IHByb3BzW3Byb3Bub2RldXVpZF0ua2V5XG4gICAgICAgIGNvbnN0IHByb3B0eXBlID0gcHJvcHNbcHJvcG5vZGV1dWlkXS50eXBlXG4gICAgICAgIGxldCBwcm9wY29tcHV1aWQgPSBwcm9wbm9kZXV1aWQ7XG4gICAgICAgIGlmIChwcm9wdHlwZSAhPSAnTm9kZScpIHtcbiAgICAgICAgICAgIGNvbnN0IHByb3Bub2RlaW5mbyA9IGF3YWl0IEVkaXRvci5NZXNzYWdlLnJlcXVlc3QoJ3NjZW5lJywgJ3F1ZXJ5LW5vZGUtdHJlZScsIHByb3Bub2RldXVpZCk7XG4gICAgICAgICAgICAvL0B0cy1pZ25vcmVcbiAgICAgICAgICAgIGNvbnN0IGNvbXBvbmVudHMgPSBwcm9wbm9kZWluZm8uY29tcG9uZW50cyBhcyB7IHR5cGU6IHN0cmluZywgdmFsdWU6IHN0cmluZyB9W107XG4gICAgICAgICAgICBwcm9wY29tcHV1aWQgPSBjb21wb25lbnRzLmZpbmQoKGNvbXA6IGFueSkgPT4gY29tcC50eXBlID09PSBgY2MuJHtwcm9wdHlwZX1gKSEudmFsdWU7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIEVkaXRvci5NZXNzYWdlLnJlcXVlc3QoJ3NjZW5lJywgJ3NldC1wcm9wZXJ0eScsIHtcbiAgICAgICAgICAgIHV1aWQ6IHV1aWQsXG4gICAgICAgICAgICAvL+i/memHjOeahCAxIOihqOekuueahOaYr+W9k+WJjeS9oOimgeiuvue9rueahOe7hOS7tuWcqOaVtOS4quiKgueCueeahOe7hOS7tuWIl+ihqOeahOesrOWHoOS9jeOAglxuICAgICAgICAgICAgLy/lj6/ku6XlhYjpgJrov4cgY29uc3QgaW5kZXggPSBub2RlLmNvbXBvbmVudHMuZmluZEluZGV4KChjb21wOiBhbnkpID0+IGNvbXAudXVpZCA9PT0gYW5pbWF0aW9uQ29tcC51dWlkKTsgXG4gICAgICAgICAgICAvL+exu+S8vOi/meagt++8jOWPquimgeiDveefpemBk+S9oOiuvue9rue7hOS7tuWcqOesrOWHoOS9jeWNs+WPr+OAguebruWJjVByZWZhYuS4iuWPquaciVRyYW5zZm9ybeWSjOiEmuacrOe7hOS7tu+8jOaJgOS7peebtOaOpeWGmeatuzHlsLHlj6/ku6XkuobjgIJcbiAgICAgICAgICAgIHBhdGg6IGBfX2NvbXBzX18uMS4ke3Byb3BrZXl9YCxcbiAgICAgICAgICAgIGR1bXA6IHtcbiAgICAgICAgICAgICAgICB0eXBlOiBgY2MuJHtwcm9wdHlwZX1gLFxuICAgICAgICAgICAgICAgIHZhbHVlOiB7XG4gICAgICAgICAgICAgICAgICAgIC8v6L+Z6YeM5a+55bqU55qE5piv5bGe5oCn57G75Z6L55qEdXVpZCjmr5TlpoJub2Rl5LiK5oyC6L2955qEbGFiZWzjgIFidXR0b27nrYnnu4Tku7bnmoR1dWlkKVxuICAgICAgICAgICAgICAgICAgICAvL+WmguaenOaYr25vZGXnsbvlnovnmoTlsZ7mgKfvvIznm7TmjqXkvKDlhaVub2Rl55qEdXVpZOWNs+WPr+OAglxuICAgICAgICAgICAgICAgICAgICAvL+WmguaenOaYr+e7hOS7tuexu+Wei+eahOWxnuaAp++8jOmcgOimgeWFiOiOt+WPlue7hOS7tueahHV1aWTvvIzlho3kvKDlhaXjgIJcbiAgICAgICAgICAgICAgICAgICAgdXVpZDogcHJvcGNvbXB1dWlkLFxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfSlcbiAgICB9KSlcbiAgICBjb25zb2xlLmxvZygn6K6+572u5bGe5oCn5oiQ5YqfJyk7XG4gICAgcmV0dXJuIHByb21pc2Vcbn1cblxuLy8g6I635Y+W5ZyoQXNzZXRz6Z2i5p2/5Lit6YCJ5oup55qE6LWE5rqQXG5hc3luYyBmdW5jdGlvbiBnZXRTZWxlY3RlZEFzc2V0SW5mbygpIHtcbiAgICAvLyAxLiDojrflj5bpgInkuK3nmoTotYTmupBVVUlEXG4gICAgY29uc3Qgc2VsZWN0ZWRVdWlkcyA9IEVkaXRvci5TZWxlY3Rpb24uZ2V0U2VsZWN0ZWQoJ2Fzc2V0Jyk7XG5cbiAgICBpZiAoc2VsZWN0ZWRVdWlkcy5sZW5ndGggPT09IDApIHtcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKCfmnKrpgInkuK3ku7vkvZXotYTmupAnKTtcbiAgICB9XG5cbiAgICBjb25zdCBhc3NldFV1aWQgPSBzZWxlY3RlZFV1aWRzWzBdO1xuXG4gICAgY29uc29sZS5sb2coJ3NlbGVjdGVkVXVpZDonLCBhc3NldFV1aWQpO1xuXG4gICAgLy8gMi4g6I635Y+W6LWE5rqQ6K+m57uG5L+h5oGvXG4gICAgY29uc3QgYXNzZXRJbmZvID0gYXdhaXQgRWRpdG9yLk1lc3NhZ2UucmVxdWVzdCgnYXNzZXQtZGInLCAncXVlcnktYXNzZXQtaW5mbycsIGFzc2V0VXVpZCk7XG4gICAgaWYgKCFhc3NldEluZm8pIHtcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKCfotYTmupDkuI3lrZjlnKgnKTtcbiAgICB9XG4gICAgY29uc29sZS5sb2coJ2Fzc2V0SW5mbzonLCBhc3NldEluZm8pO1xuXG4gICAgLy8gMy4g5Yik5pat5piv5ZCm5Li6cHJlZmFi57G75Z6LXG4gICAgaWYgKGFzc2V0SW5mby50eXBlICE9PSAnY2MuUHJlZmFiJykge1xuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ+mAieS4reeahOi1hOa6kOS4jeaYr3ByZWZhYuexu+WeiycpO1xuICAgIH1cblxuICAgIC8vIOi/lOWbnue7k+aenFxuICAgIHJldHVybiB7XG4gICAgICAgIG5hbWU6IGFzc2V0SW5mby5uYW1lLnNsaWNlKDAsIC1cIi5wcmVmYWJcIi5sZW5ndGgpLCAvL+WOu+mZpC5wcmVmYWLlkI7nvIBcbiAgICAgICAgcGF0aDogYXNzZXRJbmZvLnBhdGgsXG4gICAgICAgIC8vIGFzc2V0SW5mby51cmw6J2RiOi8vYXNzZXRzL3h4eHgucHJlZmFiJyxcbiAgICAgICAgLy8gYXNzZXRJbmZvLnBhdGg6J2RiOi8vYXNzZXRzL3h4eHgnLFxuICAgICAgICB1dWlkOiBhc3NldEluZm8udXVpZCwgLy/otYTmupB1dWlkXG4gICAgICAgIG9yaWdpbmFsSW5mbzogYXNzZXRJbmZvXG4gICAgfTtcbn1cblxuLy8g562J5b6F5Zy65pmv5YeG5aSH5bCx57uqXG5hc3luYyBmdW5jdGlvbiB3YWl0Rm9yU2NlbmVSZWFkeSh0aW1lb3V0TXM6IG51bWJlciA9IDUwMDApOiBQcm9taXNlPGJvb2xlYW4+IHtcbiAgICBjb25zdCBzdGFydFRpbWUgPSBEYXRlLm5vdygpO1xuXG4gICAgd2hpbGUgKERhdGUubm93KCkgLSBzdGFydFRpbWUgPCB0aW1lb3V0TXMpIHtcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIC8vIOS9v+eUqCBxdWVyeS1pcy1yZWFkeSDmo4Dmn6XlnLrmma/mmK/lkKblh4blpIflpb1cbiAgICAgICAgICAgIGNvbnN0IGlzUmVhZHkgPSBhd2FpdCBFZGl0b3IuTWVzc2FnZS5yZXF1ZXN0KCdzY2VuZScsICdxdWVyeS1pcy1yZWFkeScpO1xuICAgICAgICAgICAgaWYgKGlzUmVhZHkpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICAgICAgICAgIC8vIOe7p+e7reetieW+hVxuICAgICAgICB9XG5cbiAgICAgICAgLy8g562J5b6FIDEwMG1zIOWQjumHjeivlVxuICAgICAgICBhd2FpdCBuZXcgUHJvbWlzZShyZXNvbHZlID0+IHNldFRpbWVvdXQocmVzb2x2ZSwgMTAwKSk7XG4gICAgfVxuXG4gICAgcmV0dXJuIGZhbHNlO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gb25HZW5lcmF0ZUJhc2VVSShhc3NldEluZm86IEFzc2V0SW5mbykge1xuICAgIHJldHVybiBbXG4gICAgICAgIHtcbiAgICAgICAgICAgIGxhYmVsOiAnaTE4bjptZmxvdy10b29scy5nZW5lcmF0ZS1iYXNlLXVpJyxcbiAgICAgICAgICAgIGVuYWJsZWQ6IHRydWUsXG4gICAgICAgICAgICBhc3luYyBjbGljaygpIHtcbiAgICAgICAgICAgICAgICBjb25zdCBhc3NldEluZm8gPSBhd2FpdCBnZXRTZWxlY3RlZEFzc2V0SW5mbygpO1xuXG4gICAgICAgICAgICAgICAgLy8g6K6+572u5bGe5oCn562J6ZyA6KaB5omT5byAcHJlZmFiXG4gICAgICAgICAgICAgICAgYXdhaXQgRWRpdG9yLk1lc3NhZ2UucmVxdWVzdCgnYXNzZXQtZGInLCAnb3Blbi1hc3NldCcsIGFzc2V0SW5mby51dWlkKTtcblxuICAgICAgICAgICAgICAgIC8vIOetieW+heWcuuaZr+WHhuWkh+Wwsee7qlxuICAgICAgICAgICAgICAgIGF3YWl0IHdhaXRGb3JTY2VuZVJlYWR5KCk7XG5cbiAgICAgICAgICAgICAgICAvLyDlnLrmma/kuK3oioLngrnnmoQgVVVJRO+8jOiAjOS4jeaYr+i1hOa6kOeahCBVVUlEO+mAmui/h+i1hOa6kFVVSUTojrflj5blnLrmma/kuK3oioLngrnnmoRVVUlEXG4gICAgICAgICAgICAgICAgY29uc3Qgbm9kZVV1aWRzID0gYXdhaXQgRWRpdG9yLk1lc3NhZ2UucmVxdWVzdCgnc2NlbmUnLCAncXVlcnktbm9kZXMtYnktYXNzZXQtdXVpZCcsIGFzc2V0SW5mby51dWlkKTtcbiAgICAgICAgICAgICAgICBpZiAoIW5vZGVVdWlkcyB8fCBub2RlVXVpZHMubGVuZ3RoID09PSAwKSB7XG4gICAgICAgICAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcign5pyq5om+5Yiw5omT5byA55qEcHJlZmFi6IqC54K5Jyk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKCflnLrmma/kuK3oioLngrnnmoQgVVVJRHM6Jywgbm9kZVV1aWRzKTtcbiAgICAgICAgICAgICAgICBjb25zdCByb290Tm9kZVV1aWQgPSBub2RlVXVpZHNbMF07XG4gICAgICAgICAgICAgICAgLy/ojrflj5ZwcmVmYWLkuK3ooqvmjIflrprlr7zlh7rnmoTlsZ7mgKdcbiAgICAgICAgICAgICAgICBjb25zdCBwcm9wcyA9IGF3YWl0IGdldFByb3BzKHJvb3ROb2RlVXVpZCk7XG5cbiAgICAgICAgICAgICAgICAvL+WIm+W7uuiEmuacrFxuICAgICAgICAgICAgICAgIGF3YWl0IGNyZWF0ZVNjcmlwdCh7IHVybDogYXNzZXRJbmZvLnBhdGgsIG5hbWU6IGFzc2V0SW5mby5uYW1lLCBwcm9wczogcHJvcHMgfSlcblxuICAgICAgICAgICAgICAgIC8v5oyC6L296ISa5pysXG4gICAgICAgICAgICAgICAgYXdhaXQgY3JlYXRlQ29tcG9uZW50KHJvb3ROb2RlVXVpZCwgYXNzZXRJbmZvLm5hbWUpO1xuXG4gICAgICAgICAgICAgICAgLy/orr7nva7lsZ7mgKdcbiAgICAgICAgICAgICAgICBhd2FpdCBzZXRQcm9wcyhyb290Tm9kZVV1aWQsIHByb3BzKTtcblxuICAgICAgICAgICAgICAgIC8v5L+d5a2YcHJlZmFiXG4gICAgICAgICAgICAgICAgYXdhaXQgRWRpdG9yLk1lc3NhZ2UucmVxdWVzdCgnc2NlbmUnLCAnc2F2ZS1zY2VuZScpO1xuXG4gICAgICAgICAgICAgICAgLy8g562J5b6F5Zy65pmv5YeG5aSH5bCx57uqXG4gICAgICAgICAgICAgICAgYXdhaXQgd2FpdEZvclNjZW5lUmVhZHkoKTtcblxuICAgICAgICAgICAgICAgIGF3YWl0IEVkaXRvci5NZXNzYWdlLnJlcXVlc3QoJ3NjZW5lJywgJ2Nsb3NlLXNjZW5lJyk7XG5cbiAgICAgICAgICAgICAgICBjb25zb2xlLmxvZygn5YWo6YOo5a6M5oiQJyk7XG4gICAgICAgICAgICB9LFxuICAgICAgICB9LFxuICAgIF07XG59OyJdfQ==