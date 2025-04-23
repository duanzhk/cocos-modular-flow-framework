import { AssetManager, assetManager, Prefab, resources } from "cc";
import { IResManager } from "core";

export class ResLoader implements IResManager {
    load(path: string, type: any): Promise<any> {
        throw new Error("Method not implemented.");
    }
    loadPrefab(path: string): Promise<Prefab> {
        return new Promise((resolve, reject) => {
            assetManager.loadBundle("resources", (err: Error | null, bundle: AssetManager.Bundle) => {
                if (err) {
                    reject(err);
                } else {
                    bundle.load(path, Prefab, (err: Error | null, data: Prefab) => {
                        if (err) {
                            reject(err);
                        } else {
                            resolve(data);
                        }
                    });
                }
            })
        });
    }
    loadSpriteFrame(path: string): Promise<any> {
        throw new Error("Method not implemented.");
    }


}