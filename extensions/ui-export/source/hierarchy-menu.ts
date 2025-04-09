import { AssetInfo } from "@cocos/creator-types/editor/packages/asset-db/@types/public";
import { Component, Game, JsonAsset, Node, _decorator, director, game, screen, sys } from "cc";

export function onHierarchyMenu(assetInfo: AssetInfo) {
    return [
        {
            label: 'i18n:export',
            enabled: true,
            async click() {
                try {
                    const type = Editor.Selection.getLastSelectedType();
                    const uuids = Editor.Selection.getSelected(type);
                    console.log("type:", type, uuids);
                    const uuid = uuids[0];
                    const node = await Editor.Message.request('scene', 'query-node', uuid);
                    const nodeName = node.name.value
                    console.log("node:", node);
                    const url = await Editor.Message.request('asset-db', 'query-url', node.__prefab__.uuid);
                    const prefix = "db://assets/resources/";
                    const suffix = ".prefab";
                    let __path__ = url?.startsWith(prefix) ? url?.slice(prefix.length, -suffix.length) : url
                    const content = `
    import { _decorator, Component, Node } from 'cc';
    import { BaseView } from "../framework/libs/BaseView";
    const { ccclass, property, disallowMultiple } = _decorator;
    @disallowMultiple()
    export abstract class Base${nodeName} extends BaseView {
        /** @internal */
        private static readonly __path__: string = "${__path__}";

        abstract onEnter(args?: any): void
        abstract onExit(): void
        abstract onPause(): void
        abstract onResume(): void
    }`;
                    await Editor.Message.request("asset-db", 'create-asset', `db://assets/src/views/Base${nodeName}.ts`, content)
                } catch (e) {
                    console.error('请选中一个prefab的节点');
                }
            },

        },
    ];
};
