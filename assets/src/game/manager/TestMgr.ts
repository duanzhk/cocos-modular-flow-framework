
import { AbstractManager, IManager, injectManager, managedWithClean } from "../../framework/core";
import { IUserMgr } from "./UserMgr";

@managedWithClean()
export class TestMgr extends AbstractManager {

    @injectManager(IUserMgr)
    private userMgr!: IManager & { testUser(): void };

    initialize(): void {
    }

    test(): void {
        console.log(this.hasOwnProperty('userMgr'));
        this.userMgr.testUser();
    }

}