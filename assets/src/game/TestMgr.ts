import { starmaker } from "../framework/core/Core";
import { IUserMgr } from "./UserMgr";
const { injectManager, managedWithClean } = starmaker.core;

@managedWithClean()
export class TestMgr extends starmaker.core.AbstractManager {

    @injectManager(IUserMgr)
    private userMgr!: starmaker.core.IManager & { testUser(): void };

    initialize(): void {
    }

    test(): void {
        console.log(this.hasOwnProperty('userMgr'));
        this.userMgr.testUser();
    }

}