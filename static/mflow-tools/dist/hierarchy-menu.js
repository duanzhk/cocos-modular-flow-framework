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
// 获取当前打开场景的根节点
async function getSceneRootNode() {
    try {
        // 调用 query-node-tree 不带参数，返回场景根节点数组
        const nodeTree = await Editor.Message.request('scene', 'query-node-tree');
        if (!nodeTree) {
            throw new Error('无法获取场景根节点');
        }
        console.log('nodeTree:', nodeTree);
        return nodeTree.uuid;
    }
    catch (error) {
        console.error('获取场景根节点失败:', error);
        throw error;
    }
}
function onHierarchyMenu(assetInfo) {
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
                await createScript({ url: assetInfo.path, name: assetInfo.name, props: props });
                //挂载脚本
                await createComponent(rootNodeUuid, assetInfo.name);
                //设置属性
                await setProps(rootNodeUuid, props);
                //保存prefab
                await Editor.Message.request('scene', 'save-scene');
                // 等待场景准备就绪
                // await waitForSceneReady();
                console.log('全部完成');
                // await Editor.Message.request('scene', 'close-scene');
            },
        },
    ];
}
exports.onHierarchyMenu = onHierarchyMenu;
;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaGllcmFyY2h5LW1lbnUuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi9zb3VyY2UvaGllcmFyY2h5LW1lbnUudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7O0FBTUEsU0FBUyxRQUFRLENBQUMsSUFBWSxFQUFFLE1BQWM7SUFDMUMsTUFBTSxhQUFOLE1BQU0sY0FBTixNQUFNLElBQU4sTUFBTSxHQUFNLEVBQVksRUFBQztJQUN6QixPQUFPLE1BQU0sQ0FBQyxPQUFPLENBQUMsT0FBTyxDQUFDLE9BQU8sRUFBRSxpQkFBaUIsRUFBRSxJQUFJLENBQUMsQ0FBQyxJQUFJLENBQUMsQ0FBQyxJQUFTLEVBQUUsRUFBRTtRQUMvRSxJQUFJLENBQUMsSUFBSTtZQUFFLE1BQU0sSUFBSSxLQUFLLENBQUMscUJBQXFCLENBQUMsQ0FBQztRQUVsRCxNQUFNLFFBQVEsR0FBRyxJQUFJLENBQUMsUUFBUSxDQUFDLEdBQUcsQ0FBQyxLQUFLLEVBQUUsS0FBVSxFQUFFLEVBQUU7WUFDcEQsTUFBTSxJQUFJLEdBQUcsS0FBSyxDQUFDLElBQWMsQ0FBQztZQUNsQyxJQUFJLElBQUksQ0FBQyxVQUFVLENBQUMsR0FBRyxDQUFDLEVBQUU7Z0JBQ3RCLE1BQU0sR0FBRyxHQUFHLElBQUksQ0FBQyxLQUFLLENBQUMsR0FBRyxDQUFDLENBQUM7Z0JBQzVCLE1BQU8sQ0FBQyxLQUFLLENBQUMsSUFBSSxDQUFDLEdBQUc7b0JBQ2xCLEdBQUcsRUFBRSxHQUFHLENBQUMsQ0FBQyxDQUFDO29CQUNYLElBQUksRUFBRSxHQUFHLENBQUMsQ0FBQyxDQUFDLElBQUksTUFBTTtpQkFDekIsQ0FBQTthQUNKO1lBQ0QsTUFBTSxRQUFRLENBQUMsS0FBSyxDQUFDLElBQUksRUFBRSxNQUFNLENBQUMsQ0FBQztRQUN2QyxDQUFDLENBQUMsQ0FBQztRQUVILE9BQU8sT0FBTyxDQUFDLEdBQUcsQ0FBQyxRQUFRLENBQUMsQ0FBQyxJQUFJLENBQUMsR0FBRyxFQUFFLENBQUMsTUFBTyxD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QyxPQUFPLEVBQUUsWUFBWSxDQUFDLENBQUM7Z0JBQ3BELFdBQVc7Z0JBQ1gsNkJBQTZCO2dCQUM3QixPQUFPLENBQUMsR0FBRyxDQUFDLE1BQU0sQ0FBQyxDQUFDO2dCQUNwQix3REFBd0Q7WUFDNUQsQ0FBQztTQUNKO0tBQ0osQ0FBQztBQUNOLENBQUM7QUF4Q0QsMENBd0NDO0FBQUEsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IEFzc2V0SW5mbyB9IGZyb20gXCJAY29jb3MvY3JlYXRvci10eXBlcy9lZGl0b3IvcGFja2FnZXMvYXNzZXQtZGIvQHR5cGVzL3B1YmxpY1wiO1xuXG5cbi8vbmFtZTp0eXBlXG50eXBlIFByb3BzID0geyBbdXVpZDogc3RyaW5nXTogeyBrZXk6IHN0cmluZywgdHlwZTogc3RyaW5nIH0gfVxuXG5mdW5jdGlvbiBnZXRQcm9wcyh1dWlkOiBzdHJpbmcsIHJlc3VsdD86IFByb3BzKTogUHJvbWlzZTxQcm9wcz4ge1xuICAgIHJlc3VsdCA/Pz0gKHt9IGFzIFByb3BzKTtcbiAgICByZXR1cm4gRWRpdG9yLk1lc3NhZ2UucmVxdWVzdCgnc2NlbmUnLCAncXVlcnktbm9kZS10cmVlJywgdXVpZCkudGhlbigoZGF0YTogYW55KSA9PiB7XG4gICAgICAgIGlmICghZGF0YSkgdGhyb3cgbmV3IEVycm9yKCdOb2RlIHRyZWUgbm90IGZvdW5kJyk7XG5cbiAgICAgICAgY29uc3QgcHJvbWlzZXMgPSBkYXRhLmNoaWxkcmVuLm1hcChhc3luYyAoY2hpbGQ6IGFueSkgPT4ge1xuICAgICAgICAgICAgY29uc3QgbmFtZSA9IGNoaWxkLm5hbWUgYXMgc3RyaW5nO1xuICAgICAgICAgICAgaWYgKG5hbWUuc3RhcnRzV2l0aCgnIycpKSB7XG4gICAgICAgICAgICAgICAgY29uc3QgYXJyID0gbmFtZS5zcGxpdCgnIycpO1xuICAgICAgICAgICAgICAgIHJlc3VsdCFbY2hpbGQudXVpZF0gPSB7XG4gICAgICAgICAgICAgICAgICAgIGtleTogYXJyWzFdLFxuICAgICAgICAgICAgICAgICAgICB0eXBlOiBhcnJbMl0gfHwgJ05vZGUnLFxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGF3YWl0IGdldFByb3BzKGNoaWxkLnV1aWQsIHJlc3VsdCk7XG4gICAgICAgIH0pO1xuXG4gICAgICAgIHJldHVybiBQcm9taXNlLmFsbChwcm9taXNlcykudGhlbigoKSA9PiByZXN1bHQhKTtcbiAgICB9KTtcbn1cblxuYXN5bmMgZnVuY3Rpb24gY3JlYXRlU2NyaXB0KGluZm86IHsgdXJsOiBzdHJpbmcsIG5hbWU6IHN0cmluZywgcHJvcHM6IFByb3BzIH0pOiBQcm9taXNlPGFueT4ge1xuICAgIGNvbnN0IGJhc2VzY3JpcHQgPSBgQmFzZSR7aW5mby5uYW1lfWBcbiAgICBjb25zdCBwcmVmaXggPSBcImRiOi8vYXNzZXRzL3Jlc291cmNlcy9cIjtcbiAgICBjb25zdCBfX3BhdGhfXyA9IGluZm8udXJsPy5zdGFydHNXaXRoKHByZWZpeCkgPyBpbmZvLnVybD8uc2xpY2UocHJlZml4Lmxlbmd0aCwgLVwiLnByZWZhYlwiLmxlbmd0aCkgOiBpbmZvLnVybFxuICAgIGNvbnN0IGltcG9ydHMgPSBbLi4ubmV3IFNldChPYmplY3Qua2V5cyhpbmZvLnByb3BzKS5tYXAodXVpZCA9PiBpbmZvLnByb3BzW3V1aWRdLnR5cGUpKV0uam9pbignLCcpO1xuICAgIGNvbnN0IGRlZnByb3BzID0gT2JqZWN0LmtleXMoaW5mby5wcm9wcykubWFwKCh1dWlkKSA9PiB7XG4gICAgICAgIGNvbnN0IHByb3BrZXkgPSBpbmZvLnByb3BzW3V1aWRdLmtleVxuICAgICAgICBjb25zdCBwcm9wdHlwZSA9IGluZm8ucHJvcHNbdXVpZF0udHlwZVxuICAgICAgICByZXR1cm4gYEBwcm9wZXJ0eSh7IHR5cGU6ICR7cHJvcHR5cGV9IH0pICR7cHJvcGtleX06JHtwcm9wdHlwZX0gPSBudWxsITtgXG4gICAgfSkuam9pbignXFxuXFx0Jyk7XG5cbiAgICAvL+WIm+W7umJhc2XohJrmnKxcbiAgICBsZXQgY29udGVudCA9IGBcbmltcG9ydCB7IF9kZWNvcmF0b3IsQ29tcG9uZW50LCR7aW1wb3J0c30gfSBmcm9tICdjYyc7XG5pbXBvcnQgeyBCYXNlVmlldyB9IGZyb20gXCJkemtjYy1tZmxvdy9saWJzXCI7XG5jb25zdCB7IGNjY2xhc3MsIHByb3BlcnR5LCBkaXNhbGxvd011bHRpcGxlIH0gPSBfZGVjb3JhdG9yO1xuQGRpc2FsbG93TXVsdGlwbGUoKVxuZXhwb3J0IGFic3RyYWN0IGNsYXNzICR7YmFzZXNjcmlwdH0gZXh0ZW5kcyBCYXNlVmlldyB7XG4gICAgLyoqIEBpbnRlcm5hbCAqL1xuICAgIHByaXZhdGUgc3RhdGljIHJlYWRvbmx5IF9fcGF0aF9fOiBzdHJpbmcgPSBcIiR7X19wYXRoX199XCI7XG4gICAgJHtkZWZwcm9wc31cbn1gO1xuICAgIGNvbnN0IGJhc2VzY3JpcHR1cmwgPSBgZGI6Ly9hc3NldHMvc3JjL3ZpZXdzLyR7YmFzZXNjcmlwdH0udHNgO1xuICAgIGF3YWl0IEVkaXRvci5NZXNzYWdlLnJlcXVlc3QoXCJhc3NldC1kYlwiLCAnY3JlYXRlLWFzc2V0JywgYmFzZXNjcmlwdHVybCwgY29udGVudCwgeyBvdmVyd3JpdGU6IHRydWUgfSlcbiAgICBhd2FpdCBFZGl0b3IuTWVzc2FnZS5yZXF1ZXN0KCdhc3NldC1kYicsICdyZWZyZXNoLWFzc2V0JywgYmFzZXNjcmlwdHVybCk7XG4gICAgY29uc29sZS5sb2coYOWIm+W7uuiEmuacrOaIkOWKnzogJHtiYXNlc2NyaXB0fS50c2ApO1xuXG4gICAgLy/liJvlu7p1aeiEmuacrFxuICAgIGNvbnN0IGFzc2V0cyA9IGF3YWl0IEVkaXRvci5NZXNzYWdlLnJlcXVlc3QoJ2Fzc2V0LWRiJywgJ3F1ZXJ5LWFzc2V0cycsIHsgcGF0dGVybjogYGRiOi8vYXNzZXRzLyoqYCwgY2NUeXBlOiBcImNjLlNjcmlwdFwiIH0pO1xuICAgIGlmIChhc3NldHMuZmluZEluZGV4KChhc3NldDogYW55KSA9PiBhc3NldC5uYW1lID09IGAke2luZm8ubmFtZX0udHNgKSA+PSAwKSB7XG4gICAgICAgIGNvbnNvbGUubG9nKGDot7Pov4fvvJoke2luZm8ubmFtZX0udHPohJrmnKzlt7LlrZjlnKjvvIznm7TmjqXkvb/nlKjjgILor7fnoa7kv53nu6fmib/kuoYke2Jhc2VzY3JpcHR957G744CCYCk7XG4gICAgICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUoKTtcbiAgICB9XG4gICAgY29udGVudCA9IGBcbi8vQHRzLWlnbm9yZVxuaW1wb3J0IHsgJHtiYXNlc2NyaXB0fSB9IGZyb20gJ2RiOi8vYXNzZXRzL3NyYy92aWV3cy8ke2Jhc2VzY3JpcHR9JztcbmltcG9ydCB7IF9kZWNvcmF0b3IgfSBmcm9tICdjYyc7XG5jb25zdCB7IGNjY2xhc3MsIHByb3BlcnR5IH0gPSBfZGVjb3JhdG9yO1xuXG5AY2NjbGFzcygnJHtpbmZvLm5hbWV9JylcbmV4cG9ydCBjbGFzcyAke2luZm8ubmFtZX0gZXh0ZW5kcyAke2Jhc2VzY3JpcHR9IHtcbiAgICBvbkVudGVyKGFyZ3M/OiBhbnkpOiB2b2lkIHsgfVxuICAgIG9uRXhpdCgpOiB2b2lkIHsgfVxuICAgIG9uUGF1c2UoKTogdm9pZCB7IH1cbiAgICBvblJlc3VtZSgpOiB2b2lkIHsgfVxufWBcbiAgICBjb25zdCB1aXVybCA9IGBkYjovL2Fzc2V0cy9zcmMvZ2FtZS9ndWkvJHtpbmZvLm5hbWV9LnRzYDtcbiAgICBhd2FpdCBFZGl0b3IuTWVzc2FnZS5yZXF1ZXN0KFwiYXNzZXQtZGJcIiwgJ2NyZWF0ZS1hc3NldCcsIHVpdXJsLCBjb250ZW50KVxuICAgIGF3YWl0IEVkaXRvci5NZXNzYWdlLnJlcXVlc3QoJ2Fzc2V0LWRiJywgJ3JlZnJlc2gtYXNzZXQnLCB1aXVybCk7XG4gICAgY29uc29sZS5sb2coYOWIm+W7uuiEmuacrOaIkOWKnzogJHtpbmZvLm5hbWV9LnRzYCk7XG59XG5cbmFzeW5jIGZ1bmN0aW9uIGNyZWF0ZUNvbXBvbmVudCh1dWlkOiBzdHJpbmcsIHNjcmlwdDogc3RyaW5nKSB7XG4gICAgY29uc3QgcHJvcG5vZGVpbmZvID0gYXdhaXQgRWRpdG9yLk1lc3NhZ2UucmVxdWVzdCgnc2NlbmUnLCAncXVlcnktbm9kZS10cmVlJywgdXVpZCk7XG4gICAgLy9AdHMtaWdub3JlXG4gICAgY29uc3QgY29tcG9uZW50cyA9IHByb3Bub2RlaW5mby5jb21wb25lbnRzIGFzIHsgdHlwZTogc3RyaW5nLCB2YWx1ZTogc3RyaW5nIH1bXTtcbiAgICBpZiAoY29tcG9uZW50cy5maW5kSW5kZXgoKGNvbXA6IGFueSkgPT4gY29tcC50eXBlID09PSBzY3JpcHQpIDwgMCkge1xuICAgICAgICB0cnkge1xuICAgICAgICAgICAgY29uc3QgcHJvbWlzZSA9IGF3YWl0IEVkaXRvci5NZXNzYWdlLnJlcXVlc3QoJ3NjZW5lJywgJ2NyZWF0ZS1jb21wb25lbnQnLCB7XG4gICAgICAgICAgICAgICAgdXVpZDogdXVpZCxcbiAgICAgICAgICAgICAgICBjb21wb25lbnQ6IHNjcmlwdFxuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICBjb25zb2xlLmxvZyhg5oyC6L29JHtzY3JpcHR95oiQ5YqfYCk7XG4gICAgICAgICAgICByZXR1cm4gcHJvbWlzZVxuICAgICAgICB9IGNhdGNoIChlcnJvcikge1xuICAgICAgICAgICAgY29uc29sZS5sb2coYOaMgui9vSR7c2NyaXB0feWksei0pWAsIGVycm9yKTtcbiAgICAgICAgICAgIHJldHVybiBQcm9taXNlLnJlamVjdChlcnJvcik7XG4gICAgICAgIH1cbiAgICB9IGVsc2Uge1xuICAgICAgICBjb25zb2xlLmxvZyhg6Lez6L+H77ya5bey57uP5oyC6L295LqGJHtzY3JpcHR977yM55u05o6l6K6+572u5bGe5oCn44CC6K+356Gu5L+d57un5om/5LqGQmFzZSR7c2NyaXB0feexu+OAgmApO1xuICAgIH1cbn1cblxuYXN5bmMgZnVuY3Rpb24gc2V0UHJvcHModXVpZDogc3RyaW5nLCBwcm9wczogUHJvcHMpIHtcbiAgICBjb25zdCBwcm9taXNlID0gYXdhaXQgUHJvbWlzZS5hbGwoT2JqZWN0LmtleXMocHJvcHMpLm1hcChhc3luYyAocHJvcG5vZGV1dWlkKSA9PiB7XG4gICAgICAgIGNvbnN0IHByb3BrZXkgPSBwcm9wc1twcm9wbm9kZXV1aWRdLmtleVxuICAgICAgICBjb25zdCBwcm9wdHlwZSA9IHByb3BzW3Byb3Bub2RldXVpZF0udHlwZVxuICAgICAgICBsZXQgcHJvcGNvbXB1dWlkID0gcHJvcG5vZGV1dWlkO1xuICAgICAgICBpZiAocHJvcHR5cGUgIT0gJ05vZGUnKSB7XG4gICAgICAgICAgICBjb25zdCBwcm9wbm9kZWluZm8gPSBhd2FpdCBFZGl0b3IuTWVzc2FnZS5yZXF1ZXN0KCdzY2VuZScsICdxdWVyeS1ub2RlLXRyZWUnLCBwcm9wbm9kZXV1aWQpO1xuICAgICAgICAgICAgLy9AdHMtaWdub3JlXG4gICAgICAgICAgICBjb25zdCBjb21wb25lbnRzID0gcHJvcG5vZGVpbmZvLmNvbXBvbmVudHMgYXMgeyB0eXBlOiBzdHJpbmcsIHZhbHVlOiBzdHJpbmcgfVtdO1xuICAgICAgICAgICAgcHJvcGNvbXB1dWlkID0gY29tcG9uZW50cy5maW5kKChjb21wOiBhbnkpID0+IGNvbXAudHlwZSA9PT0gYGNjLiR7cHJvcHR5cGV9YCkhLnZhbHVlO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBFZGl0b3IuTWVzc2FnZS5yZXF1ZXN0KCdzY2VuZScsICdzZXQtcHJvcGVydHknLCB7XG4gICAgICAgICAgICB1dWlkOiB1dWlkLFxuICAgICAgICAgICAgLy/ov5nph4znmoQgMSDooajnpLrnmoTmmK/lvZPliY3kvaDopoHorr7nva7nmoTnu4Tku7blnKjmlbTkuKroioLngrnnmoTnu4Tku7bliJfooajnmoTnrKzlh6DkvY3jgIJcbiAgICAgICAgICAgIC8v5Y+v5Lul5YWI6YCa6L+HIGNvbnN0IGluZGV4ID0gbm9kZS5jb21wb25lbnRzLmZpbmRJbmRleCgoY29tcDogYW55KSA9PiBjb21wLnV1aWQgPT09IGFuaW1hdGlvbkNvbXAudXVpZCk7IFxuICAgICAgICAgICAgLy/nsbvkvLzov5nmoLfvvIzlj6ropoHog73nn6XpgZPkvaDorr7nva7nu4Tku7blnKjnrKzlh6DkvY3ljbPlj6/jgILnm67liY1QcmVmYWLkuIrlj6rmnIlUcmFuc2Zvcm3lkozohJrmnKznu4Tku7bvvIzmiYDku6Xnm7TmjqXlhpnmrbsx5bCx5Y+v5Lul5LqG44CCXG4gICAgICAgICAgICBwYXRoOiBgX19jb21wc19fLjEuJHtwcm9wa2V5fWAsXG4gICAgICAgICAgICBkdW1wOiB7XG4gICAgICAgICAgICAgICAgdHlwZTogYGNjLiR7cHJvcHR5cGV9YCxcbiAgICAgICAgICAgICAgICB2YWx1ZToge1xuICAgICAgICAgICAgICAgICAgICAvL+i/memHjOWvueW6lOeahOaYr+WxnuaAp+exu+Wei+eahHV1aWQo5q+U5aaCbm9kZeS4iuaMgui9veeahGxhYmVs44CBYnV0dG9u562J57uE5Lu255qEdXVpZClcbiAgICAgICAgICAgICAgICAgICAgLy/lpoLmnpzmmK9ub2Rl57G75Z6L55qE5bGe5oCn77yM55u05o6l5Lyg5YWlbm9kZeeahHV1aWTljbPlj6/jgIJcbiAgICAgICAgICAgICAgICAgICAgLy/lpoLmnpzmmK/nu4Tku7bnsbvlnovnmoTlsZ7mgKfvvIzpnIDopoHlhYjojrflj5bnu4Tku7bnmoR1dWlk77yM5YaN5Lyg5YWl44CCXG4gICAgICAgICAgICAgICAgICAgIHV1aWQ6IHByb3Bjb21wdXVpZCxcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pXG4gICAgfSkpXG4gICAgY29uc29sZS5sb2coJ+iuvue9ruWxnuaAp+aIkOWKnycpO1xuICAgIHJldHVybiBwcm9taXNlXG59XG5cbi8vIOiOt+WPluWcqEFzc2V0c+mdouadv+S4remAieaLqeeahOi1hOa6kFxuYXN5bmMgZnVuY3Rpb24gZ2V0U2VsZWN0ZWRBc3NldEluZm8oKSB7XG4gICAgLy8gMS4g6I635Y+W6YCJ5Lit55qE6LWE5rqQVVVJRFxuICAgIGNvbnN0IHNlbGVjdGVkVXVpZHMgPSBFZGl0b3IuU2VsZWN0aW9uLmdldFNlbGVjdGVkKCdhc3NldCcpO1xuXG4gICAgaWYgKHNlbGVjdGVkVXVpZHMubGVuZ3RoID09PSAwKSB7XG4gICAgICAgIHRocm93IG5ldyBFcnJvcign5pyq6YCJ5Lit5Lu75L2V6LWE5rqQJyk7XG4gICAgfVxuXG4gICAgY29uc3QgYXNzZXRVdWlkID0gc2VsZWN0ZWRVdWlkc1swXTtcblxuICAgIGNvbnNvbGUubG9nKCdzZWxlY3RlZFV1aWQ6JywgYXNzZXRVdWlkKTtcblxuICAgIC8vIDIuIOiOt+WPlui1hOa6kOivpue7huS/oeaBr1xuICAgIGNvbnN0IGFzc2V0SW5mbyA9IGF3YWl0IEVkaXRvci5NZXNzYWdlLnJlcXVlc3QoJ2Fzc2V0LWRiJywgJ3F1ZXJ5LWFzc2V0LWluZm8nLCBhc3NldFV1aWQpO1xuICAgIGlmICghYXNzZXRJbmZvKSB7XG4gICAgICAgIHRocm93IG5ldyBFcnJvcign6LWE5rqQ5LiN5a2Y5ZyoJyk7XG4gICAgfVxuICAgIGNvbnNvbGUubG9nKCdhc3NldEluZm86JywgYXNzZXRJbmZvKTtcblxuICAgIC8vIDMuIOWIpOaWreaYr+WQpuS4unByZWZhYuexu+Wei1xuICAgIGlmIChhc3NldEluZm8udHlwZSAhPT0gJ2NjLlByZWZhYicpIHtcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKCfpgInkuK3nmoTotYTmupDkuI3mmK9wcmVmYWLnsbvlnosnKTtcbiAgICB9XG5cbiAgICAvLyDov5Tlm57nu5PmnpxcbiAgICByZXR1cm4ge1xuICAgICAgICBuYW1lOiBhc3NldEluZm8ubmFtZS5zbGljZSgwLCAtXCIucHJlZmFiXCIubGVuZ3RoKSwgLy/ljrvpmaQucHJlZmFi5ZCO57yAXG4gICAgICAgIHBhdGg6IGFzc2V0SW5mby5wYXRoLFxuICAgICAgICAvLyBhc3NldEluZm8udXJsOidkYjovL2Fzc2V0cy94eHh4LnByZWZhYicsXG4gICAgICAgIC8vIGFzc2V0SW5mby5wYXRoOidkYjovL2Fzc2V0cy94eHh4JyxcbiAgICAgICAgdXVpZDogYXNzZXRJbmZvLnV1aWQsIC8v6LWE5rqQdXVpZFxuICAgICAgICBvcmlnaW5hbEluZm86IGFzc2V0SW5mb1xuICAgIH07XG59XG5cbi8vIOetieW+heWcuuaZr+WHhuWkh+Wwsee7qlxuYXN5bmMgZnVuY3Rpb24gd2FpdEZvclNjZW5lUmVhZHkodGltZW91dE1zOiBudW1iZXIgPSA1MDAwKTogUHJvbWlzZTxib29sZWFuPiB7XG4gICAgY29uc3Qgc3RhcnRUaW1lID0gRGF0ZS5ub3coKTtcbiAgICBcbiAgICB3aGlsZSAoRGF0ZS5ub3coKSAtIHN0YXJ0VGltZSA8IHRpbWVvdXRNcykge1xuICAgICAgICB0cnkge1xuICAgICAgICAgICAgLy8g5L2/55SoIHF1ZXJ5LWlzLXJlYWR5IOajgOafpeWcuuaZr+aYr+WQpuWHhuWkh+WlvVxuICAgICAgICAgICAgY29uc3QgaXNSZWFkeSA9IGF3YWl0IEVkaXRvci5NZXNzYWdlLnJlcXVlc3QoJ3NjZW5lJywgJ3F1ZXJ5LWlzLXJlYWR5Jyk7XG4gICAgICAgICAgICBpZiAoaXNSZWFkeSkge1xuICAgICAgICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICAgICAgfVxuICAgICAgICB9IGNhdGNoIChlcnJvcikge1xuICAgICAgICAgICAgLy8g57un57ut562J5b6FXG4gICAgICAgIH1cbiAgICAgICAgXG4gICAgICAgIC8vIOetieW+hSAxMDBtcyDlkI7ph43or5VcbiAgICAgICAgYXdhaXQgbmV3IFByb21pc2UocmVzb2x2ZSA9PiBzZXRUaW1lb3V0KHJlc29sdmUsIDEwMCkpO1xuICAgIH1cbiAgICBcbiAgICByZXR1cm4gZmFsc2U7XG59XG5cbi8vIOiOt+WPluW9k+WJjeaJk+W8gOWcuuaZr+eahOagueiKgueCuVxuYXN5bmMgZnVuY3Rpb24gZ2V0U2NlbmVSb290Tm9kZSgpOiBQcm9taXNlPHN0cmluZz4ge1xuICAgIHRyeSB7XG4gICAgICAgIC8vIOiwg+eUqCBxdWVyeS1ub2RlLXRyZWUg5LiN5bim5Y+C5pWw77yM6L+U5Zue5Zy65pmv5qC56IqC54K55pWw57uEXG4gICAgICAgIGNvbnN0IG5vZGVUcmVlOiBhbnkgPSBhd2FpdCBFZGl0b3IuTWVzc2FnZS5yZXF1ZXN0KCdzY2VuZScsICdxdWVyeS1ub2RlLXRyZWUnKTtcbiAgICAgICAgaWYgKCFub2RlVHJlZSkge1xuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKCfml6Dms5Xojrflj5blnLrmma/moLnoioLngrknKTtcbiAgICAgICAgfVxuICAgICAgICBjb25zb2xlLmxvZygnbm9kZVRyZWU6Jywgbm9kZVRyZWUpO1xuICAgICAgICByZXR1cm4gbm9kZVRyZWUudXVpZDtcbiAgICB9IGNhdGNoIChlcnJvcikge1xuICAgICAgICBjb25zb2xlLmVycm9yKCfojrflj5blnLrmma/moLnoioLngrnlpLHotKU6JywgZXJyb3IpO1xuICAgICAgICB0aHJvdyBlcnJvcjtcbiAgICB9XG59XG5cblxuZXhwb3J0IGZ1bmN0aW9uIG9uSGllcmFyY2h5TWVudShhc3NldEluZm86IEFzc2V0SW5mbykge1xuICAgIHJldHVybiBbXG4gICAgICAgIHtcbiAgICAgICAgICAgIGxhYmVsOiAnaTE4bjptZmxvdy10b29scy5leHBvcnQnLFxuICAgICAgICAgICAgZW5hYmxlZDogdHJ1ZSxcbiAgICAgICAgICAgIGFzeW5jIGNsaWNrKCkge1xuICAgICAgICAgICAgICAgIGNvbnN0IGFzc2V0SW5mbyA9IGF3YWl0IGdldFNlbGVjdGVkQXNzZXRJbmZvKCk7XG5cbiAgICAgICAgICAgICAgICAvLyDorr7nva7lsZ7mgKfnrYnpnIDopoHmiZPlvIBwcmVmYWJcbiAgICAgICAgICAgICAgICBhd2FpdCBFZGl0b3IuTWVzc2FnZS5yZXF1ZXN0KCdhc3NldC1kYicsICdvcGVuLWFzc2V0JywgYXNzZXRJbmZvLnV1aWQpO1xuXG4gICAgICAgICAgICAgICAgLy8g562J5b6F5Zy65pmv5YeG5aSH5bCx57uqXG4gICAgICAgICAgICAgICAgYXdhaXQgd2FpdEZvclNjZW5lUmVhZHkoKTtcblxuICAgICAgICAgICAgICAgIC8v5Zy65pmv5Lit6IqC54K555qEIFVVSUTvvIzogIzkuI3mmK/otYTmupDnmoQgVVVJRFxuICAgICAgICAgICAgICAgIC8vIGNvbnN0IHJvb3ROb2RlVXVpZCA9IEVkaXRvci5TZWxlY3Rpb24uZ2V0U2VsZWN0ZWQoRWRpdG9yLlNlbGVjdGlvbi5nZXRMYXN0U2VsZWN0ZWRUeXBlKCkpWzBdO1xuICAgICAgICAgICAgICAgIC8vIOeUqHF1ZXJ5LW5vZGUtdHJlZeiOt+WPluWcuuaZr+S4reiKgueCueeahCBVVUlE5pu05LyY6ZuFXG4gICAgICAgICAgICAgICAgY29uc3Qgcm9vdE5vZGVVdWlkID0gYXdhaXQgZ2V0U2NlbmVSb290Tm9kZSgpO1xuICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKCflnLrmma/kuK3oioLngrnnmoQgVVVJRDonLCByb290Tm9kZVV1aWQpO1xuICAgICAgICAgICAgICAgIC8v6I635Y+WcHJlZmFi5Lit6KKr5oyH5a6a5a+85Ye655qE5bGe5oCnXG4gICAgICAgICAgICAgICAgY29uc3QgcHJvcHMgPSBhd2FpdCBnZXRQcm9wcyhyb290Tm9kZVV1aWQpO1xuXG4gICAgICAgICAgICAgICAgLy/liJvlu7rohJrmnKxcbiAgICAgICAgICAgICAgICBhd2FpdCBjcmVhdGVTY3JpcHQoeyB1cmw6IGFzc2V0SW5mby5wYXRoLCBuYW1lOiBhc3NldEluZm8ubmFtZSwgcHJvcHM6IHByb3BzIH0pXG5cbiAgICAgICAgICAgICAgICAvL+aMgui9veiEmuacrFxuICAgICAgICAgICAgICAgIGF3YWl0IGNyZWF0ZUNvbXBvbmVudChyb290Tm9kZVV1aWQsIGFzc2V0SW5mby5uYW1lKTtcblxuICAgICAgICAgICAgICAgIC8v6K6+572u5bGe5oCnXG4gICAgICAgICAgICAgICAgYXdhaXQgc2V0UHJvcHMocm9vdE5vZGVVdWlkLCBwcm9wcyk7XG5cbiAgICAgICAgICAgICAgICAvL+S/neWtmHByZWZhYlxuICAgICAgICAgICAgICAgIGF3YWl0IEVkaXRvci5NZXNzYWdlLnJlcXVlc3QoJ3NjZW5lJywgJ3NhdmUtc2NlbmUnKTtcbiAgICAgICAgICAgICAgICAvLyDnrYnlvoXlnLrmma/lh4blpIflsLHnu6pcbiAgICAgICAgICAgICAgICAvLyBhd2FpdCB3YWl0Rm9yU2NlbmVSZWFkeSgpO1xuICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKCflhajpg6jlrozmiJAnKTtcbiAgICAgICAgICAgICAgICAvLyBhd2FpdCBFZGl0b3IuTWVzc2FnZS5yZXF1ZXN0KCdzY2VuZScsICdjbG9zZS1zY2VuZScpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgfSxcbiAgICBdO1xufTsiXX0=