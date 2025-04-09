"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.onHierarchyMenu = void 0;
function onHierarchyMenu(assetInfo) {
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
                    const nodeName = node.name.value;
                    console.log("node:", node);
                    const url = await Editor.Message.request('asset-db', 'query-url', node.__prefab__.uuid);
                    const prefix = "db://assets/resources/";
                    const suffix = ".prefab";
                    let __path__ = (url === null || url === void 0 ? void 0 : url.startsWith(prefix)) ? url === null || url === void 0 ? void 0 : url.slice(prefix.length, -suffix.length) : url;
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
                    await Editor.Message.request("asset-db", 'create-asset', `db://assets/src/views/Base${nodeName}.ts`, content);
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaGllcmFyY2h5LW1lbnUuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi9zb3VyY2UvaGllcmFyY2h5LW1lbnUudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7O0FBR0EsU0FBZ0IsZUFBZSxDQUFDLFNBQW9CO0lBQ2hELE9BQU87UUFDSDtZQUNJLEtBQUssRUFBRSxhQUFhO1lBQ3BCLE9BQU8sRUFBRSxJQUFJO1lBQ2IsS0FBSyxDQUFDLEtBQUs7Z0JBQ1AsSUFBSTtvQkFDQSxNQUFNLElBQUksR0FBRyxNQUFNLENBQUMsU0FBUyxDQUFDLG1CQUFtQixFQUFFLENBQUM7b0JBQ3BELE1BQU0sS0FBSyxHQUFHLE1BQU0sQ0FBQyxTQUFTLENBQUMsV0FBVyxDQUFDLElBQUksQ0FBQyxDQUFDO29CQUNqRCxPQUFPLENBQUMsR0FBRyxDQUFDLE9BQU8sRUFBRSxJQUFJLEVBQUUsS0FBSyxDQUFDLENBQUM7b0JBQ2xDLE1BQU0sSUFBSSxHQUFHLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQztvQkFDdEIsTUFBTSxJQUFJLEdBQUcsTUFBTSxNQUFNLENBQUMsT0FBTyxDQUFDLE9BQU8sQ0FBQyxPQUFPLEVBQUUsWUFBWSxFQUFFLElBQUksQ0FBQyxDQUFDO29CQUN2RSxNQUFNLFFBQVEsR0FBRyxJQUFJLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQTtvQkFDaEMsT0FBTyxDQUFDLEdBQUcsQ0FBQyxPQUFPLEVBQUUsSUFBSSxDQUFDLENBQUM7b0JBQzNCLE1BQU0sR0FBRyxHQUFHLE1BQU0sTUFBTSxDQUFDLE9BQU8sQ0FBQyxPQUFPLENBQUMsVUFBVSxFQUFFLFdBQVcsRUFBRSxJQUFJLENBQUMsVUFBVSxDQUFDLElBQUksQ0FBQyxDQUFDO29CQUN4RixNQUFNLE1BQU0sR0FBRyx3QkFBd0IsQ0FBQztvQkFDeEMsTUFBTSxNQUFNLEdBQUcsU0FBUyxDQUFDO29CQUN6QixJQUFJLFFBQVEsR0FBRyxDQUFBLEdBQUcsYUFBSCxHQUFHLHVCQUFILEdBQUcsQ0FBRSxVQUFVLENBQUMsTUFBTSxDQUFDLEVBQUMsQ0FBQyxDQUFDLEdBQUcsYUFBSCxHQUFHLHVCQUFILEdBQUcsQ0FBRSxLQUFLLENBQUMsTUFBTSxDQUFDLE1BQU0sRUFBRSxDQUFDLE1BQU0sQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFBO29CQUN4RixNQUFNLE9BQU8sR0FBRzs7Ozs7Z0NBS0osUUFBUTs7c0RBRWMsUUFBUTs7Ozs7O01BTXhELENBQUM7b0JBQ2EsTUFBTSxNQUFNLENBQUMsT0FBTyxDQUFDLE9BQU8sQ0FBQyxVQUFVLEVBQUUsY0FBYyxFQUFFLDZCQUE2QixRQUFRLEtBQUssRUFBRSxPQUFPLENBQUMsQ0FBQTtpQkFDaEg7Z0JBQUMsT0FBTyxDQUFDLEVBQUU7b0JBQ1IsT0FBTyxDQUFDLEtBQUssQ0FBQyxnQkFBZ0IsQ0FBQyxDQUFDO2lCQUNuQztZQUNMLENBQUM7U0FFSjtLQUNKLENBQUM7QUFDTixDQUFDO0FBeENELDBDQXdDQztBQUFBLENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBBc3NldEluZm8gfSBmcm9tIFwiQGNvY29zL2NyZWF0b3ItdHlwZXMvZWRpdG9yL3BhY2thZ2VzL2Fzc2V0LWRiL0B0eXBlcy9wdWJsaWNcIjtcbmltcG9ydCB7IENvbXBvbmVudCwgR2FtZSwgSnNvbkFzc2V0LCBOb2RlLCBfZGVjb3JhdG9yLCBkaXJlY3RvciwgZ2FtZSwgc2NyZWVuLCBzeXMgfSBmcm9tIFwiY2NcIjtcblxuZXhwb3J0IGZ1bmN0aW9uIG9uSGllcmFyY2h5TWVudShhc3NldEluZm86IEFzc2V0SW5mbykge1xuICAgIHJldHVybiBbXG4gICAgICAgIHtcbiAgICAgICAgICAgIGxhYmVsOiAnaTE4bjpleHBvcnQnLFxuICAgICAgICAgICAgZW5hYmxlZDogdHJ1ZSxcbiAgICAgICAgICAgIGFzeW5jIGNsaWNrKCkge1xuICAgICAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IHR5cGUgPSBFZGl0b3IuU2VsZWN0aW9uLmdldExhc3RTZWxlY3RlZFR5cGUoKTtcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgdXVpZHMgPSBFZGl0b3IuU2VsZWN0aW9uLmdldFNlbGVjdGVkKHR5cGUpO1xuICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyhcInR5cGU6XCIsIHR5cGUsIHV1aWRzKTtcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgdXVpZCA9IHV1aWRzWzBdO1xuICAgICAgICAgICAgICAgICAgICBjb25zdCBub2RlID0gYXdhaXQgRWRpdG9yLk1lc3NhZ2UucmVxdWVzdCgnc2NlbmUnLCAncXVlcnktbm9kZScsIHV1aWQpO1xuICAgICAgICAgICAgICAgICAgICBjb25zdCBub2RlTmFtZSA9IG5vZGUubmFtZS52YWx1ZVxuICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyhcIm5vZGU6XCIsIG5vZGUpO1xuICAgICAgICAgICAgICAgICAgICBjb25zdCB1cmwgPSBhd2FpdCBFZGl0b3IuTWVzc2FnZS5yZXF1ZXN0KCdhc3NldC1kYicsICdxdWVyeS11cmwnLCBub2RlLl9fcHJlZmFiX18udXVpZCk7XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IHByZWZpeCA9IFwiZGI6Ly9hc3NldHMvcmVzb3VyY2VzL1wiO1xuICAgICAgICAgICAgICAgICAgICBjb25zdCBzdWZmaXggPSBcIi5wcmVmYWJcIjtcbiAgICAgICAgICAgICAgICAgICAgbGV0IF9fcGF0aF9fID0gdXJsPy5zdGFydHNXaXRoKHByZWZpeCkgPyB1cmw/LnNsaWNlKHByZWZpeC5sZW5ndGgsIC1zdWZmaXgubGVuZ3RoKSA6IHVybFxuICAgICAgICAgICAgICAgICAgICBjb25zdCBjb250ZW50ID0gYFxuICAgIGltcG9ydCB7IF9kZWNvcmF0b3IsIENvbXBvbmVudCwgTm9kZSB9IGZyb20gJ2NjJztcbiAgICBpbXBvcnQgeyBCYXNlVmlldyB9IGZyb20gXCIuLi9mcmFtZXdvcmsvbGlicy9CYXNlVmlld1wiO1xuICAgIGNvbnN0IHsgY2NjbGFzcywgcHJvcGVydHksIGRpc2FsbG93TXVsdGlwbGUgfSA9IF9kZWNvcmF0b3I7XG4gICAgQGRpc2FsbG93TXVsdGlwbGUoKVxuICAgIGV4cG9ydCBhYnN0cmFjdCBjbGFzcyBCYXNlJHtub2RlTmFtZX0gZXh0ZW5kcyBCYXNlVmlldyB7XG4gICAgICAgIC8qKiBAaW50ZXJuYWwgKi9cbiAgICAgICAgcHJpdmF0ZSBzdGF0aWMgcmVhZG9ubHkgX19wYXRoX186IHN0cmluZyA9IFwiJHtfX3BhdGhfX31cIjtcblxuICAgICAgICBhYnN0cmFjdCBvbkVudGVyKGFyZ3M/OiBhbnkpOiB2b2lkXG4gICAgICAgIGFic3RyYWN0IG9uRXhpdCgpOiB2b2lkXG4gICAgICAgIGFic3RyYWN0IG9uUGF1c2UoKTogdm9pZFxuICAgICAgICBhYnN0cmFjdCBvblJlc3VtZSgpOiB2b2lkXG4gICAgfWA7XG4gICAgICAgICAgICAgICAgICAgIGF3YWl0IEVkaXRvci5NZXNzYWdlLnJlcXVlc3QoXCJhc3NldC1kYlwiLCAnY3JlYXRlLWFzc2V0JywgYGRiOi8vYXNzZXRzL3NyYy92aWV3cy9CYXNlJHtub2RlTmFtZX0udHNgLCBjb250ZW50KVxuICAgICAgICAgICAgICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgICAgICAgICAgICAgICAgY29uc29sZS5lcnJvcign6K+36YCJ5Lit5LiA5LiqcHJlZmFi55qE6IqC54K5Jyk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSxcblxuICAgICAgICB9LFxuICAgIF07XG59O1xuIl19