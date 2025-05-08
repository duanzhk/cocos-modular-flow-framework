import { ICore, IManager } from "./Api";
import 'reflect-metadata';
export declare function getInterface<T extends Function>(ctor: T): symbol;
export declare function model(): (ctor: Function) => void;
export declare function autoRegister(core: ICore): void;
export declare function managedWithClean(): (ctor: Function) => any;
export declare function injectManager(sym: symbol): (target: IManager, prop: string) => void;
