import { starmaker } from "../core/Core";

export class ResLoader implements starmaker.core.IResManager {
    load(path: string, type: any): Promise<any> {
        throw new Error("Method not implemented.");
    }
    loadPrefab(path: string): Promise<any> {
        throw new Error("Method not implemented.");
    }
    loadSpriteFrame(path: string): Promise<any> {
        throw new Error("Method not implemented.");
    }
   

}