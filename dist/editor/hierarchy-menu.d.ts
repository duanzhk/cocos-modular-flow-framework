import { AssetInfo } from "@cocos/creator-types/editor/packages/asset-db/@types/public";
export declare function onHierarchyMenu(assetInfo: AssetInfo): {
    label: string;
    enabled: boolean;
    click(): Promise<void>;
}[];
