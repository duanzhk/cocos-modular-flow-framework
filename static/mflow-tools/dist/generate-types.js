"use strict";
/**
 * @en Generate type map file for the classes decorated with @model(), @manager() or @view()
 * @zh 为被装饰器装饰(@model()、@manager()或@view())的类生成类型映射文件，实现完整的类型推断支持。
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.onGenerateTypes = exports.generateTypes = void 0;
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
// 扫描目录获取所有 .ts 文件
function scanDirectory(dir) {
    if (!fs.existsSync(dir)) {
        console.warn(`⚠️  目录不存在: ${dir}`);
        return [];
    }
    const files = [];
    const items = fs.readdirSync(dir);
    for (const item of items) {
        const fullPath = path.join(dir, item);
        const stat = fs.statSync(fullPath);
        if (stat.isDirectory()) {
            files.push(...scanDirectory(fullPath));
        }
        else if (item.endsWith('.ts') && !item.endsWith('.d.ts')) {
            files.push(fullPath);
        }
    }
    return files;
}
// 解析文件获取装饰器信息
function parseFile(filePath) {
    const content = fs.readFileSync(filePath, 'utf-8');
    const fileName = path.basename(filePath, '.ts');
    // 匹配 @model('Name') 或 @model()
    const modelMatch = content.match(/@model\s*\(\s*['"](\w+)['"]\s*\)/);
    if (modelMatch) {
        return {
            type: 'model',
            decoratorName: modelMatch[1],
            className: fileName,
            filePath: filePath
        };
    }
    // 匹配 @manager('Name') 或 @manager()
    const managerMatch = content.match(/@manager\s*\(\s*['"](\w+)['"]\s*\)/);
    if (managerMatch) {
        return {
            type: 'manager',
            decoratorName: managerMatch[1],
            className: fileName,
            filePath: filePath
        };
    }
    // 匹配 @view('Name') 或 @view()
    const viewMatch = content.match(/@view\s*\(\s*['"](\w+)['"]\s*\)/);
    if (viewMatch) {
        return {
            type: 'view',
            decoratorName: viewMatch[1],
            className: fileName,
            filePath: filePath
        };
    }
    // 如果没有指定名称，使用类名
    if (content.includes('@model()')) {
        return {
            type: 'model',
            decoratorName: fileName,
            className: fileName,
            filePath: filePath
        };
    }
    if (content.includes('@manager()')) {
        return {
            type: 'manager',
            decoratorName: fileName,
            className: fileName,
            filePath: filePath
        };
    }
    if (content.includes('@view()')) {
        return {
            type: 'view',
            decoratorName: fileName,
            className: fileName,
            filePath: filePath
        };
    }
    return null;
}
// 生成类型映射代码
function generateTypeMap(models, managers, views, config) {
    const lines = [];
    // 文件头注释
    lines.push('/**');
    lines.push(' * 自动生成的类型映射文件');
    lines.push(' * ⚠️ 请勿手动修改此文件！');
    lines.push(' * 重新生成：在 Cocos Creator 编辑器中运行 mflow-tools -> Generate API type hints/生成API类型提示');
    lines.push(' */');
    lines.push('');
    // 导入 Model
    if (models.length > 0) {
        lines.push('// Model 导入');
        for (const model of models) {
            const relativePath = path.relative(path.dirname(config.outputFile), model.filePath).replace(/\\/g, '/').replace('.ts', '');
            lines.push(`import type { ${model.className} } from '${relativePath}';`);
        }
        lines.push('');
    }
    // 导入 Manager
    if (managers.length > 0) {
        lines.push('// Manager 导入');
        for (const manager of managers) {
            const relativePath = path.relative(path.dirname(config.outputFile), manager.filePath).replace(/\\/g, '/').replace('.ts', '');
            lines.push(`import type { ${manager.className} } from '${relativePath}';`);
        }
        lines.push('');
    }
    // 导入 View
    if (views.length > 0) {
        lines.push('// View 导入');
        for (const view of views) {
            const relativePath = path.relative(path.dirname(config.outputFile), view.filePath).replace(/\\/g, '/').replace('.ts', '');
            lines.push(`import type { ${view.className} } from '${relativePath}';`);
        }
        lines.push('');
    }
    // 导入 Names（用于函数重载）
    const needModelNames = models.length > 0;
    const needManagerNames = managers.length > 0;
    const needViewNames = views.length > 0;
    if (needModelNames || needManagerNames || needViewNames) {
        const imports = [];
        if (needModelNames)
            imports.push('ModelNames');
        if (needManagerNames)
            imports.push('ManagerNames');
        if (needViewNames)
            imports.push('ViewNames', 'IView');
        lines.push(`import type { ${imports.join(', ')} } from '${config.moduleImportPath}';`);
        lines.push('');
    }
    // 声明模块
    lines.push(`declare module '${config.moduleImportPath}' {`);
    // 扩展 NamesType 接口，将每个属性定义为字符串字面量类型
    if (models.length > 0) {
        lines.push('    // 扩展 ModelNamesType，将每个属性定义为字符串字面量');
        lines.push('    interface ModelNamesType {');
        for (const model of models) {
            lines.push(`        readonly ${model.decoratorName}: '${model.decoratorName}';`);
        }
        lines.push('    }');
        lines.push('');
    }
    if (managers.length > 0) {
        lines.push('    // 扩展 ManagerNamesType，将每个属性定义为字符串字面量');
        lines.push('    interface ManagerNamesType {');
        for (const manager of managers) {
            lines.push(`        readonly ${manager.decoratorName}: '${manager.decoratorName}';`);
        }
        lines.push('    }');
        lines.push('');
    }
    if (views.length > 0) {
        lines.push('    // 扩展 ViewNamesType，将每个属性定义为字符串字面量');
        lines.push('    interface ViewNamesType {');
        for (const view of views) {
            lines.push(`        readonly ${view.decoratorName}: '${view.decoratorName}';`);
        }
        lines.push('    }');
        lines.push('');
    }
    // 生成严格的字符串字面量联合类型
    if (models.length > 0) {
        const modelKeys = models.map(m => `'${m.decoratorName}'`).join(' | ');
        lines.push('    // 严格的 Model 键类型');
        lines.push(`    type ModelKey = ${modelKeys};`);
        lines.push('');
    }
    if (managers.length > 0) {
        const managerKeys = managers.map(m => `'${m.decoratorName}'`).join(' | ');
        lines.push('    // 严格的 Manager 键类型');
        lines.push(`    type ManagerKey = ${managerKeys};`);
        lines.push('');
    }
    if (views.length > 0) {
        const viewKeys = views.map(v => `'${v.decoratorName}'`).join(' | ');
        lines.push('    // 严格的 View 键类型');
        lines.push(`    type ViewKey = ${viewKeys};`);
        lines.push('');
    }
    // ICore 接口扩展（使用函数重载提供精确的类型推断）
    if (models.length > 0 || managers.length > 0) {
        lines.push('    // 扩展 ICore 接口，添加精确的类型重载');
        lines.push('    interface ICore {');
        // 为每个 Model 添加 getModel 重载
        if (models.length > 0) {
            for (const model of models) {
                lines.push(`        getModel(modelKey: '${model.decoratorName}'): ${model.className};`);
            }
        }
        // 为每个 Manager 添加 getManager 重载
        if (managers.length > 0) {
            for (const manager of managers) {
                lines.push(`        getManager(managerKey: '${manager.decoratorName}'): ${manager.className};`);
            }
        }
        lines.push('    }');
        lines.push('');
    }
    // IUIManager 接口扩展（为 View 提供类型推断）
    if (views.length > 0) {
        lines.push('    // 扩展 IUIManager 接口，添加 View 类型重载');
        lines.push('    interface IUIManager {');
        // 为每个 View 添加 open 重载
        for (const view of views) {
            lines.push(`        open(viewKey: '${view.decoratorName}', args?: any): Promise<${view.className}>;`);
        }
        // 为每个 View 添加 openAndPush 重载
        for (const view of views) {
            lines.push(`        openAndPush(viewKey: '${view.decoratorName}', group: string, args?: any): Promise<${view.className}>;`);
        }
        // 为每个 View 添加 close 重载
        for (const view of views) {
            lines.push(`        close(viewKey: '${view.decoratorName}' | IView, destory?: boolean): void;`);
        }
        lines.push('    }');
    }
    lines.push('}');
    lines.push('');
    return lines.join('\n');
}
// 主函数
function generateTypes(config) {
    try {
        console.log('🚀 开始生成类型映射文件...\n');
        // 扫描 Model 目录
        console.log(`📂 扫描 Model 目录: ${config.modelDir}`);
        const modelFiles = scanDirectory(config.modelDir);
        const models = modelFiles
            .map(parseFile)
            .filter((item) => item !== null && item.type === 'model');
        console.log(`   找到 ${models.length} 个 Model\n`);
        // 扫描 Manager 目录
        console.log(`📂 扫描 Manager 目录: ${config.managerDir}`);
        const managerFiles = scanDirectory(config.managerDir);
        const managers = managerFiles
            .map(parseFile)
            .filter((item) => item !== null && item.type === 'manager');
        console.log(`   找到 ${managers.length} 个 Manager\n`);
        // 扫描 View 目录
        console.log(`📂 扫描 View 目录: ${config.viewDir}`);
        const viewFiles = scanDirectory(config.viewDir);
        const views = viewFiles
            .map(parseFile)
            .filter((item) => item !== null && item.type === 'view');
        console.log(`   找到 ${views.length} 个 View\n`);
        if (models.length === 0 && managers.length === 0 && views.length === 0) {
            return {
                success: false,
                message: '⚠️  未找到任何 Model、Manager 或 View，跳过生成'
            };
        }
        // 生成类型映射
        const content = generateTypeMap(models, managers, views, config);
        // 确保输出目录存在
        const outputDir = path.dirname(config.outputFile);
        if (!fs.existsSync(outputDir)) {
            fs.mkdirSync(outputDir, { recursive: true });
        }
        // 写入文件
        fs.writeFileSync(config.outputFile, content, 'utf-8');
        let message = `✅ 类型映射文件已生成: ${config.outputFile}\n\n`;
        message += '📋 生成的映射:\n';
        if (models.length > 0) {
            message += '   Models:\n';
            models.forEach(m => message += `     - ${m.decoratorName} → ${m.className}\n`);
        }
        if (managers.length > 0) {
            message += '   Managers:\n';
            managers.forEach(m => message += `     - ${m.decoratorName} → ${m.className}\n`);
        }
        if (views.length > 0) {
            message += '   Views:\n';
            views.forEach(v => message += `     - ${v.decoratorName} → ${v.className}\n`);
        }
        message += '\n🎉 完成！';
        console.log(message);
        return { success: true, message };
    }
    catch (error) {
        const errorMessage = `❌ 生成失败: ${error instanceof Error ? error.message : String(error)}`;
        console.error(errorMessage);
        return { success: false, message: errorMessage };
    }
}
exports.generateTypes = generateTypes;
// 从项目配置文件读取配置
function loadConfigFromProject(projectPath) {
    const defaultConfig = {
        modelDir: 'assets/src/game/models',
        managerDir: 'assets/src/game/managers',
        viewDir: 'assets/src/game/gui',
        outputFile: 'assets/types/api-type-hints.d.ts',
        moduleImportPath: 'dzkcc-mflow/core'
    };
    // 规范化配置：将相对路径转换为绝对路径
    const normalizeConfig = (config) => ({
        modelDir: path.resolve(projectPath, config.modelDir || defaultConfig.modelDir),
        managerDir: path.resolve(projectPath, config.managerDir || defaultConfig.managerDir),
        viewDir: path.resolve(projectPath, config.viewDir || defaultConfig.viewDir),
        outputFile: path.resolve(projectPath, config.outputFile || defaultConfig.outputFile),
        moduleImportPath: config.moduleImportPath || defaultConfig.moduleImportPath
    });
    // 从单独的配置文件读取
    const configPath = path.join(projectPath, 'mflow.config.json');
    if (fs.existsSync(configPath)) {
        try {
            const config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
            return normalizeConfig(config);
        }
        catch (error) {
            console.warn('无法读取 mflow.config.json 配置');
        }
    }
    // 使用默认配置
    return normalizeConfig({});
}
// 编辑器扩展入口
async function onGenerateTypes() {
    try {
        // 获取项目路径
        const projectPath = Editor.Project.path;
        console.log('项目路径:', projectPath);
        // 加载配置
        const config = loadConfigFromProject(projectPath);
        if (!config) {
            throw new Error('无法加载配置');
        }
        console.log('使用配置:', config);
        // 生成类型映射
        const result = generateTypes(config);
        if (result.success) {
            await Editor.Dialog.info('类型映射生成成功！', {
                detail: result.message,
                buttons: ['确定']
            });
        }
        else {
            await Editor.Dialog.warn('类型映射生成失败', {
                detail: result.message,
                buttons: ['确定']
            });
        }
    }
    catch (error) {
        console.error('生成类型映射失败:', error);
        await Editor.Dialog.error('生成类型映射失败', {
            detail: error instanceof Error ? error.message : String(error),
            buttons: ['确定']
        });
    }
}
exports.onGenerateTypes = onGenerateTypes;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZ2VuZXJhdGUtdHlwZXMuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi9zb3VyY2UvZ2VuZXJhdGUtdHlwZXMudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IjtBQUFBOzs7R0FHRzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFFSCx1Q0FBeUI7QUFDekIsMkNBQTZCO0FBbUI3QixrQkFBa0I7QUFDbEIsU0FBUyxhQUFhLENBQUMsR0FBVztJQUM5QixJQUFJLENBQUMsRUFBRSxDQUFDLFVBQVUsQ0FBQyxHQUFHLENBQUMsRUFBRTtRQUNyQixPQUFPLENBQUMsSUFBSSxDQUFDLGNBQWMsR0FBRyxFQUFFLENBQUMsQ0FBQztRQUNsQyxPQUFPLEVBQUUsQ0FBQztLQUNiO0lBRUQsTUFBTSxLQUFLLEdBQWEsRUFBRSxDQUFDO0lBQzNCLE1BQU0sS0FBSyxHQUFHLEVBQUUsQ0FBQyxXQUFXLENBQUMsR0FBRyxDQUFDLENBQUM7SUFFbEMsS0FBSyxNQUFNLElBQUksSUFBSSxLQUFLLEVBQUU7UUFDdEIsTUFBTSxRQUFRLEdBQUcsSUFBSSxDQUFDLElBQUksQ0FBQyxHQUFHLEVBQUUsSUFBSSxDQUFDLENBQUM7UUFDdEMsTUFBTSxJQUFJLEdBQUcsRUFBRSxDQUFDLFFBQVEsQ0FBQyxRQUFRLENBQUMsQ0FBQztRQUVuQyxJQUFJLElBQUksQ0FBQyxXQUFXLEVBQUUsRUFBRTtZQUNwQixLQUFLLENBQUMsSUFBSSxDQUFDLEdBQUcsYUFBYSxDQUFDLFFBQVEsQ0FBQyxDQUFDLENBQUM7U0FDMUM7YUFBTSxJQUFJLElBQUksQ0FBQyxRQUFRLENBQUMsS0FBSyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsUUFBUSxDQUFDLE9BQU8sQ0FBQyxFQUFFO1lBQ3hELEtBQUssQ0FBQyxJQUFJLENBQUMsUUFBUSxDQUFDLENBQUM7U0FDeEI7S0FDSjtJQUVELE9BQU8sS0FBSyxDQUFDO0FBQ2pCLENBQUM7QUFFRCxjQUFjO0FBQ2QsU0FBUyxTQUFTLENBQUMsUUFB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QUFNLEdBQUcscUJBQXFCLENBQUMsV0FBVyxDQUFDLENBQUM7UUFDbEQsSUFBSSxDQUFDLE1BQU0sRUFBRTtZQUNULE1BQU0sSUFBSSxLQUFLLENBQUMsUUFBUSxDQUFDLENBQUM7U0FDN0I7UUFFRCxPQUFPLENBQUMsR0FBRyxDQUFDLE9BQU8sRUFBRSxNQUFNLENBQUMsQ0FBQztRQUU3QixTQUFTO1FBQ1QsTUFBTSxNQUFNLEdBQUcsYUFBYSxDQUFDLE1BQU0sQ0FBQyxDQUFDO1FBRXJDLElBQUksTUFBTSxDQUFDLE9BQU8sRUFBRTtZQUNoQixNQUFNLE1BQU0sQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDLFdBQVcsRUFBRTtnQkFDbEMsTUFBTSxFQUFFLE1BQU0sQ0FBQyxPQUFPO2dCQUN0QixPQUFPLEVBQUUsQ0FBQyxJQUFJLENBQUM7YUFDbEIsQ0FBQyxDQUFDO1NBQ047YUFBTTtZQUNILE1BQU0sTUFBTSxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsVUFBVSxFQUFFO2dCQUNqQyxNQUFNLEVBQUUsTUFBTSxDQUFDLE9BQU87Z0JBQ3RCLE9BQU8sRUFBRSxDQUFDLElBQUksQ0FBQzthQUNsQixDQUFDLENBQUM7U0FDTjtLQUNKO0lBQUMsT0FBTyxLQUFLLEVBQUU7UUFDWixPQUFPLENBQUMsS0FBSyxDQUFDLFdBQVcsRUFBRSxLQUFLLENBQUMsQ0FBQztRQUNsQyxNQUFNLE1BQU0sQ0FBQyxNQUFNLENBQUMsS0FBSyxDQUFDLFVBQVUsRUFBRTtZQUNsQyxNQUFNLEVBQUUsS0FBSyxZQUFZLEtBQUssQ0FBQyxDQUFDLENBQUMsS0FBSyxDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUMsTUFBTSxDQUFDLEtBQUssQ0FBQztZQUM5RCxPQUFPLEVBQUUsQ0FBQyxJQUFJLENBQUM7U0FDbEIsQ0FBQyxDQUFDO0tBQ047QUFDTCxDQUFDO0FBbkNELDBDQW1DQyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQGVuIEdlbmVyYXRlIHR5cGUgbWFwIGZpbGUgZm9yIHRoZSBjbGFzc2VzIGRlY29yYXRlZCB3aXRoIEBtb2RlbCgpLCBAbWFuYWdlcigpIG9yIEB2aWV3KClcbiAqIEB6aCDkuLrooqvoo4XppbDlmajoo4XppbAoQG1vZGVsKCnjgIFAbWFuYWdlcigp5oiWQHZpZXcoKSnnmoTnsbvnlJ/miJDnsbvlnovmmKDlsITmlofku7bvvIzlrp7njrDlrozmlbTnmoTnsbvlnovmjqjmlq3mlK/mjIHjgIJcbiAqL1xuXG5pbXBvcnQgKiBhcyBmcyBmcm9tICdmcyc7XG5pbXBvcnQgKiBhcyBwYXRoIGZyb20gJ3BhdGgnO1xuXG4vLyDphY3nva7mjqXlj6NcbmludGVyZmFjZSBUeXBlR2VuQ29uZmlnIHtcbiAgICBtb2RlbERpcjogc3RyaW5nO1xuICAgIG1hbmFnZXJEaXI6IHN0cmluZztcbiAgICB2aWV3RGlyOiBzdHJpbmc7XG4gICAgb3V0cHV0RmlsZTogc3RyaW5nO1xuICAgIG1vZHVsZUltcG9ydFBhdGg6IHN0cmluZztcbn1cblxuLy8g6Kej5p6Q57uT5p6c5o6l5Y+jXG5pbnRlcmZhY2UgUGFyc2VkSXRlbSB7XG4gICAgdHlwZTogJ21vZGVsJyB8ICdtYW5hZ2VyJyB8ICd2aWV3JztcbiAgICBkZWNvcmF0b3JOYW1lOiBzdHJpbmc7XG4gICAgY2xhc3NOYW1lOiBzdHJpbmc7XG4gICAgZmlsZVBhdGg6IHN0cmluZztcbn1cblxuLy8g5omr5o+P55uu5b2V6I635Y+W5omA5pyJIC50cyDmlofku7ZcbmZ1bmN0aW9uIHNjYW5EaXJlY3RvcnkoZGlyOiBzdHJpbmcpOiBzdHJpbmdbXSB7XG4gICAgaWYgKCFmcy5leGlzdHNTeW5jKGRpcikpIHtcbiAgICAgICAgY29uc29sZS53YXJuKGDimqDvuI8gIOebruW9leS4jeWtmOWcqDogJHtkaXJ9YCk7XG4gICAgICAgIHJldHVybiBbXTtcbiAgICB9XG5cbiAgICBjb25zdCBmaWxlczogc3RyaW5nW10gPSBbXTtcbiAgICBjb25zdCBpdGVtcyA9IGZzLnJlYWRkaXJTeW5jKGRpcik7XG5cbiAgICBmb3IgKGNvbnN0IGl0ZW0gb2YgaXRlbXMpIHtcbiAgICAgICAgY29uc3QgZnVsbFBhdGggPSBwYXRoLmpvaW4oZGlyLCBpdGVtKTtcbiAgICAgICAgY29uc3Qgc3RhdCA9IGZzLnN0YXRTeW5jKGZ1bGxQYXRoKTtcblxuICAgICAgICBpZiAoc3RhdC5pc0RpcmVjdG9yeSgpKSB7XG4gICAgICAgICAgICBmaWxlcy5wdXNoKC4uLnNjYW5EaXJlY3RvcnkoZnVsbFBhdGgpKTtcbiAgICAgICAgfSBlbHNlIGlmIChpdGVtLmVuZHNXaXRoKCcudHMnKSAmJiAhaXRlbS5lbmRzV2l0aCgnLmQudHMnKSkge1xuICAgICAgICAgICAgZmlsZXMucHVzaChmdWxsUGF0aCk7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICByZXR1cm4gZmlsZXM7XG59XG5cbi8vIOino+aekOaWh+S7tuiOt+WPluijhemlsOWZqOS/oeaBr1xuZnVuY3Rpb24gcGFyc2VGaWxlKGZpbGVQYXRoOiBzdHJpbmcpOiBQYXJzZWRJdGVtIHwgbnVsbCB7XG4gICAgY29uc3QgY29udGVudCA9IGZzLnJlYWRGaWxlU3luYyhmaWxlUGF0aCwgJ3V0Zi04Jyk7XG4gICAgY29uc3QgZmlsZU5hbWUgPSBwYXRoLmJhc2VuYW1lKGZpbGVQYXRoLCAnLnRzJyk7XG5cbiAgICAvLyDljLnphY0gQG1vZGVsKCdOYW1lJykg5oiWIEBtb2RlbCgpXG4gICAgY29uc3QgbW9kZWxNYXRjaCA9IGNvbnRlbnQubWF0Y2goL0Btb2RlbFxccypcXChcXHMqWydcIl0oXFx3KylbJ1wiXVxccypcXCkvKTtcbiAgICBpZiAobW9kZWxNYXRjaCkge1xuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgdHlwZTogJ21vZGVsJyxcbiAgICAgICAgICAgIGRlY29yYXRvck5hbWU6IG1vZGVsTWF0Y2hbMV0sXG4gICAgICAgICAgICBjbGFzc05hbWU6IGZpbGVOYW1lLFxuICAgICAgICAgICAgZmlsZVBhdGg6IGZpbGVQYXRoXG4gICAgICAgIH07XG4gICAgfVxuXG4gICAgLy8g5Yy56YWNIEBtYW5hZ2VyKCdOYW1lJykg5oiWIEBtYW5hZ2VyKClcbiAgICBjb25zdCBtYW5hZ2VyTWF0Y2ggPSBjb250ZW50Lm1hdGNoKC9AbWFuYWdlclxccypcXChcXHMqWydcIl0oXFx3KylbJ1wiXVxccypcXCkvKTtcbiAgICBpZiAobWFuYWdlck1hdGNoKSB7XG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICB0eXBlOiAnbWFuYWdlcicsXG4gICAgICAgICAgICBkZWNvcmF0b3JOYW1lOiBtYW5hZ2VyTWF0Y2hbMV0sXG4gICAgICAgICAgICBjbGFzc05hbWU6IGZpbGVOYW1lLFxuICAgICAgICAgICAgZmlsZVBhdGg6IGZpbGVQYXRoXG4gICAgICAgIH07XG4gICAgfVxuXG4gICAgLy8g5Yy56YWNIEB2aWV3KCdOYW1lJykg5oiWIEB2aWV3KClcbiAgICBjb25zdCB2aWV3TWF0Y2ggPSBjb250ZW50Lm1hdGNoKC9Admlld1xccypcXChcXHMqWydcIl0oXFx3KylbJ1wiXVxccypcXCkvKTtcbiAgICBpZiAodmlld01hdGNoKSB7XG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICB0eXBlOiAndmlldycsXG4gICAgICAgICAgICBkZWNvcmF0b3JOYW1lOiB2aWV3TWF0Y2hbMV0sXG4gICAgICAgICAgICBjbGFzc05hbWU6IGZpbGVOYW1lLFxuICAgICAgICAgICAgZmlsZVBhdGg6IGZpbGVQYXRoXG4gICAgICAgIH07XG4gICAgfVxuXG4gICAgLy8g5aaC5p6c5rKh5pyJ5oyH5a6a5ZCN56ew77yM5L2/55So57G75ZCNXG4gICAgaWYgKGNvbnRlbnQuaW5jbHVkZXMoJ0Btb2RlbCgpJykpIHtcbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgIHR5cGU6ICdtb2RlbCcsXG4gICAgICAgICAgICBkZWNvcmF0b3JOYW1lOiBmaWxlTmFtZSxcbiAgICAgICAgICAgIGNsYXNzTmFtZTogZmlsZU5hbWUsXG4gICAgICAgICAgICBmaWxlUGF0aDogZmlsZVBhdGhcbiAgICAgICAgfTtcbiAgICB9XG5cbiAgICBpZiAoY29udGVudC5pbmNsdWRlcygnQG1hbmFnZXIoKScpKSB7XG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICB0eXBlOiAnbWFuYWdlcicsXG4gICAgICAgICAgICBkZWNvcmF0b3JOYW1lOiBmaWxlTmFtZSxcbiAgICAgICAgICAgIGNsYXNzTmFtZTogZmlsZU5hbWUsXG4gICAgICAgICAgICBmaWxlUGF0aDogZmlsZVBhdGhcbiAgICAgICAgfTtcbiAgICB9XG5cbiAgICBpZiAoY29udGVudC5pbmNsdWRlcygnQHZpZXcoKScpKSB7XG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICB0eXBlOiAndmlldycsXG4gICAgICAgICAgICBkZWNvcmF0b3JOYW1lOiBmaWxlTmFtZSxcbiAgICAgICAgICAgIGNsYXNzTmFtZTogZmlsZU5hbWUsXG4gICAgICAgICAgICBmaWxlUGF0aDogZmlsZVBhdGhcbiAgICAgICAgfTtcbiAgICB9XG5cbiAgICByZXR1cm4gbnVsbDtcbn1cblxuLy8g55Sf5oiQ57G75Z6L5pig5bCE5Luj56CBXG5mdW5jdGlvbiBnZW5lcmF0ZVR5cGVNYXAobW9kZWxzOiBQYXJzZWRJdGVtW10sIG1hbmFnZXJzOiBQYXJzZWRJdGVtW10sIHZpZXdzOiBQYXJzZWRJdGVtW10sIGNvbmZpZzogVHlwZUdlbkNvbmZpZyk6IHN0cmluZyB7XG4gICAgY29uc3QgbGluZXM6IHN0cmluZ1tdID0gW107XG5cbiAgICAvLyDmlofku7blpLTms6jph4pcbiAgICBsaW5lcy5wdXNoKCcvKionKTtcbiAgICBsaW5lcy5wdXNoKCcgKiDoh6rliqjnlJ/miJDnmoTnsbvlnovmmKDlsITmlofku7YnKTtcbiAgICBsaW5lcy5wdXNoKCcgKiDimqDvuI8g6K+35Yu/5omL5Yqo5L+u5pS55q2k5paH5Lu277yBJyk7XG4gICAgbGluZXMucHVzaCgnICog6YeN5paw55Sf5oiQ77ya5ZyoIENvY29zIENyZWF0b3Ig57yW6L6R5Zmo5Lit6L+Q6KGMIG1mbG93LXRvb2xzIC0+IEdlbmVyYXRlIEFQSSB0eXBlIGhpbnRzL+eUn+aIkEFQSeexu+Wei+aPkOekuicpO1xuICAgIGxpbmVzLnB1c2goJyAqLycpO1xuICAgIGxpbmVzLnB1c2goJycpO1xuXG4gICAgLy8g5a+85YWlIE1vZGVsXG4gICAgaWYgKG1vZGVscy5sZW5ndGggPiAwKSB7XG4gICAgICAgIGxpbmVzLnB1c2goJy8vIE1vZGVsIOWvvOWFpScpO1xuICAgICAgICBmb3IgKGNvbnN0IG1vZGVsIG9mIG1vZGVscykge1xuICAgICAgICAgICAgY29uc3QgcmVsYXRpdmVQYXRoID0gcGF0aC5yZWxhdGl2ZShcbiAgICAgICAgICAgICAgICBwYXRoLmRpcm5hbWUoY29uZmlnLm91dHB1dEZpbGUpLFxuICAgICAgICAgICAgICAgIG1vZGVsLmZpbGVQYXRoXG4gICAgICAgICAgICApLnJlcGxhY2UoL1xcXFwvZywgJy8nKS5yZXBsYWNlKCcudHMnLCAnJyk7XG4gICAgICAgICAgICBsaW5lcy5wdXNoKGBpbXBvcnQgdHlwZSB7ICR7bW9kZWwuY2xhc3NOYW1lfSB9IGZyb20gJyR7cmVsYXRpdmVQYXRofSc7YCk7XG4gICAgICAgIH1cbiAgICAgICAgbGluZXMucHVzaCgnJyk7XG4gICAgfVxuXG4gICAgLy8g5a+85YWlIE1hbmFnZXJcbiAgICBpZiAobWFuYWdlcnMubGVuZ3RoID4gMCkge1xuICAgICAgICBsaW5lcy5wdXNoKCcvLyBNYW5hZ2VyIOWvvOWFpScpO1xuICAgICAgICBmb3IgKGNvbnN0IG1hbmFnZXIgb2YgbWFuYWdlcnMpIHtcbiAgICAgICAgICAgIGNvbnN0IHJlbGF0aXZlUGF0aCA9IHBhdGgucmVsYXRpdmUoXG4gICAgICAgICAgICAgICAgcGF0aC5kaXJuYW1lKGNvbmZpZy5vdXRwdXRGaWxlKSxcbiAgICAgICAgICAgICAgICBtYW5hZ2VyLmZpbGVQYXRoXG4gICAgICAgICAgICApLnJlcGxhY2UoL1xcXFwvZywgJy8nKS5yZXBsYWNlKCcudHMnLCAnJyk7XG4gICAgICAgICAgICBsaW5lcy5wdXNoKGBpbXBvcnQgdHlwZSB7ICR7bWFuYWdlci5jbGFzc05hbWV9IH0gZnJvbSAnJHtyZWxhdGl2ZVBhdGh9JztgKTtcbiAgICAgICAgfVxuICAgICAgICBsaW5lcy5wdXNoKCcnKTtcbiAgICB9XG5cbiAgICAvLyDlr7zlhaUgVmlld1xuICAgIGlmICh2aWV3cy5sZW5ndGggPiAwKSB7XG4gICAgICAgIGxpbmVzLnB1c2goJy8vIFZpZXcg5a+85YWlJyk7XG4gICAgICAgIGZvciAoY29uc3QgdmlldyBvZiB2aWV3cykge1xuICAgICAgICAgICAgY29uc3QgcmVsYXRpdmVQYXRoID0gcGF0aC5yZWxhdGl2ZShcbiAgICAgICAgICAgICAgICBwYXRoLmRpcm5hbWUoY29uZmlnLm91dHB1dEZpbGUpLFxuICAgICAgICAgICAgICAgIHZpZXcuZmlsZVBhdGhcbiAgICAgICAgICAgICkucmVwbGFjZSgvXFxcXC9nLCAnLycpLnJlcGxhY2UoJy50cycsICcnKTtcbiAgICAgICAgICAgIGxpbmVzLnB1c2goYGltcG9ydCB0eXBlIHsgJHt2aWV3LmNsYXNzTmFtZX0gfSBmcm9tICcke3JlbGF0aXZlUGF0aH0nO2ApO1xuICAgICAgICB9XG4gICAgICAgIGxpbmVzLnB1c2goJycpO1xuICAgIH1cblxuICAgIC8vIOWvvOWFpSBOYW1lc++8iOeUqOS6juWHveaVsOmHjei9ve+8iVxuICAgIGNvbnN0IG5lZWRNb2RlbE5hbWVzID0gbW9kZWxzLmxlbmd0aCA+IDA7XG4gICAgY29uc3QgbmVlZE1hbmFnZXJOYW1lcyA9IG1hbmFnZXJzLmxlbmd0aCA+IDA7XG4gICAgY29uc3QgbmVlZFZpZXdOYW1lcyA9IHZpZXdzLmxlbmd0aCA+IDA7XG4gICAgaWYgKG5lZWRNb2RlbE5hbWVzIHx8IG5lZWRNYW5hZ2VyTmFtZXMgfHwgbmVlZFZpZXdOYW1lcykge1xuICAgICAgICBjb25zdCBpbXBvcnRzOiBzdHJpbmdbXSA9IFtdO1xuICAgICAgICBpZiAobmVlZE1vZGVsTmFtZXMpIGltcG9ydHMucHVzaCgnTW9kZWxOYW1lcycpO1xuICAgICAgICBpZiAobmVlZE1hbmFnZXJOYW1lcykgaW1wb3J0cy5wdXNoKCdNYW5hZ2VyTmFtZXMnKTtcbiAgICAgICAgaWYgKG5lZWRWaWV3TmFtZXMpIGltcG9ydHMucHVzaCgnVmlld05hbWVzJywgJ0lWaWV3Jyk7XG4gICAgICAgIGxpbmVzLnB1c2goYGltcG9ydCB0eXBlIHsgJHtpbXBvcnRzLmpvaW4oJywgJyl9IH0gZnJvbSAnJHtjb25maWcubW9kdWxlSW1wb3J0UGF0aH0nO2ApO1xuICAgICAgICBsaW5lcy5wdXNoKCcnKTtcbiAgICB9XG5cbiAgICAvLyDlo7DmmI7mqKHlnZdcbiAgICBsaW5lcy5wdXNoKGBkZWNsYXJlIG1vZHVsZSAnJHtjb25maWcubW9kdWxlSW1wb3J0UGF0aH0nIHtgKTtcblxuICAgIC8vIOaJqeWxlSBOYW1lc1R5cGUg5o6l5Y+j77yM5bCG5q+P5Liq5bGe5oCn5a6a5LmJ5Li65a2X56ym5Liy5a2X6Z2i6YeP57G75Z6LXG4gICAgaWYgKG1vZGVscy5sZW5ndGggPiAwKSB7XG4gICAgICAgIGxpbmVzLnB1c2goJyAgICAvLyDmianlsZUgTW9kZWxOYW1lc1R5cGXvvIzlsIbmr4/kuKrlsZ7mgKflrprkuYnkuLrlrZfnrKbkuLLlrZfpnaLph48nKTtcbiAgICAgICAgbGluZXMucHVzaCgnICAgIGludGVyZmFjZSBNb2RlbE5hbWVzVHlwZSB7Jyk7XG4gICAgICAgIGZvciAoY29uc3QgbW9kZWwgb2YgbW9kZWxzKSB7XG4gICAgICAgICAgICBsaW5lcy5wdXNoKGAgICAgICAgIHJlYWRvbmx5ICR7bW9kZWwuZGVjb3JhdG9yTmFtZX06ICcke21vZGVsLmRlY29yYXRvck5hbWV9JztgKTtcbiAgICAgICAgfVxuICAgICAgICBsaW5lcy5wdXNoKCcgICAgfScpO1xuICAgICAgICBsaW5lcy5wdXNoKCcnKTtcbiAgICB9XG5cbiAgICBpZiAobWFuYWdlcnMubGVuZ3RoID4gMCkge1xuICAgICAgICBsaW5lcy5wdXNoKCcgICAgLy8g5omp5bGVIE1hbmFnZXJOYW1lc1R5cGXvvIzlsIbmr4/kuKrlsZ7mgKflrprkuYnkuLrlrZfnrKbkuLLlrZfpnaLph48nKTtcbiAgICAgICAgbGluZXMucHVzaCgnICAgIGludGVyZmFjZSBNYW5hZ2VyTmFtZXNUeXBlIHsnKTtcbiAgICAgICAgZm9yIChjb25zdCBtYW5hZ2VyIG9mIG1hbmFnZXJzKSB7XG4gICAgICAgICAgICBsaW5lcy5wdXNoKGAgICAgICAgIHJlYWRvbmx5ICR7bWFuYWdlci5kZWNvcmF0b3JOYW1lfTogJyR7bWFuYWdlci5kZWNvcmF0b3JOYW1lfSc7YCk7XG4gICAgICAgIH1cbiAgICAgICAgbGluZXMucHVzaCgnICAgIH0nKTtcbiAgICAgICAgbGluZXMucHVzaCgnJyk7XG4gICAgfVxuXG4gICAgaWYgKHZpZXdzLmxlbmd0aCA+IDApIHtcbiAgICAgICAgbGluZXMucHVzaCgnICAgIC8vIOaJqeWxlSBWaWV3TmFtZXNUeXBl77yM5bCG5q+P5Liq5bGe5oCn5a6a5LmJ5Li65a2X56ym5Liy5a2X6Z2i6YePJyk7XG4gICAgICAgIGxpbmVzLnB1c2goJyAgICBpbnRlcmZhY2UgVmlld05hbWVzVHlwZSB7Jyk7XG4gICAgICAgIGZvciAoY29uc3QgdmlldyBvZiB2aWV3cykge1xuICAgICAgICAgICAgbGluZXMucHVzaChgICAgICAgICByZWFkb25seSAke3ZpZXcuZGVjb3JhdG9yTmFtZX06ICcke3ZpZXcuZGVjb3JhdG9yTmFtZX0nO2ApO1xuICAgICAgICB9XG4gICAgICAgIGxpbmVzLnB1c2goJyAgICB9Jyk7XG4gICAgICAgIGxpbmVzLnB1c2goJycpO1xuICAgIH1cblxuICAgIC8vIOeUn+aIkOS4peagvOeahOWtl+espuS4suWtl+mdoumHj+iBlOWQiOexu+Wei1xuICAgIGlmIChtb2RlbHMubGVuZ3RoID4gMCkge1xuICAgICAgICBjb25zdCBtb2RlbEtleXMgPSBtb2RlbHMubWFwKG0gPT4gYCcke20uZGVjb3JhdG9yTmFtZX0nYCkuam9pbignIHwgJyk7XG4gICAgICAgIGxpbmVzLnB1c2goJyAgICAvLyDkuKXmoLznmoQgTW9kZWwg6ZSu57G75Z6LJyk7XG4gICAgICAgIGxpbmVzLnB1c2goYCAgICB0eXBlIE1vZGVsS2V5ID0gJHttb2RlbEtleXN9O2ApO1xuICAgICAgICBsaW5lcy5wdXNoKCcnKTtcbiAgICB9XG5cbiAgICBpZiAobWFuYWdlcnMubGVuZ3RoID4gMCkge1xuICAgICAgICBjb25zdCBtYW5hZ2VyS2V5cyA9IG1hbmFnZXJzLm1hcChtID0+IGAnJHttLmRlY29yYXRvck5hbWV9J2ApLmpvaW4oJyB8ICcpO1xuICAgICAgICBsaW5lcy5wdXNoKCcgICAgLy8g5Lil5qC855qEIE1hbmFnZXIg6ZSu57G75Z6LJyk7XG4gICAgICAgIGxpbmVzLnB1c2goYCAgICB0eXBlIE1hbmFnZXJLZXkgPSAke21hbmFnZXJLZXlzfTtgKTtcbiAgICAgICAgbGluZXMucHVzaCgnJyk7XG4gICAgfVxuXG4gICAgaWYgKHZpZXdzLmxlbmd0aCA+IDApIHtcbiAgICAgICAgY29uc3Qgdmlld0tleXMgPSB2aWV3cy5tYXAodiA9PiBgJyR7di5kZWNvcmF0b3JOYW1lfSdgKS5qb2luKCcgfCAnKTtcbiAgICAgICAgbGluZXMucHVzaCgnICAgIC8vIOS4peagvOeahCBWaWV3IOmUruexu+WeiycpO1xuICAgICAgICBsaW5lcy5wdXNoKGAgICAgdHlwZSBWaWV3S2V5ID0gJHt2aWV3S2V5c307YCk7XG4gICAgICAgIGxpbmVzLnB1c2goJycpO1xuICAgIH1cblxuICAgIC8vIElDb3JlIOaOpeWPo+aJqeWxle+8iOS9v+eUqOWHveaVsOmHjei9veaPkOS+m+eyvuehrueahOexu+Wei+aOqOaWre+8iVxuICAgIGlmIChtb2RlbHMubGVuZ3RoID4gMCB8fCBtYW5hZ2Vycy5sZW5ndGggPiAwKSB7XG4gICAgICAgIGxpbmVzLnB1c2goJyAgICAvLyDmianlsZUgSUNvcmUg5o6l5Y+j77yM5re75Yqg57K+56Gu55qE57G75Z6L6YeN6L29Jyk7XG4gICAgICAgIGxpbmVzLnB1c2goJyAgICBpbnRlcmZhY2UgSUNvcmUgeycpO1xuXG4gICAgICAgIC8vIOS4uuavj+S4qiBNb2RlbCDmt7vliqAgZ2V0TW9kZWwg6YeN6L29XG4gICAgICAgIGlmIChtb2RlbHMubGVuZ3RoID4gMCkge1xuICAgICAgICAgICAgZm9yIChjb25zdCBtb2RlbCBvZiBtb2RlbHMpIHtcbiAgICAgICAgICAgICAgICBsaW5lcy5wdXNoKGAgICAgICAgIGdldE1vZGVsKG1vZGVsS2V5OiAnJHttb2RlbC5kZWNvcmF0b3JOYW1lfScpOiAke21vZGVsLmNsYXNzTmFtZX07YCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICAvLyDkuLrmr4/kuKogTWFuYWdlciDmt7vliqAgZ2V0TWFuYWdlciDph43ovb1cbiAgICAgICAgaWYgKG1hbmFnZXJzLmxlbmd0aCA+IDApIHtcbiAgICAgICAgICAgIGZvciAoY29uc3QgbWFuYWdlciBvZiBtYW5hZ2Vycykge1xuICAgICAgICAgICAgICAgIGxpbmVzLnB1c2goYCAgICAgICAgZ2V0TWFuYWdlcihtYW5hZ2VyS2V5OiAnJHttYW5hZ2VyLmRlY29yYXRvck5hbWV9Jyk6ICR7bWFuYWdlci5jbGFzc05hbWV9O2ApO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgbGluZXMucHVzaCgnICAgIH0nKTtcbiAgICAgICAgbGluZXMucHVzaCgnJyk7XG4gICAgfVxuXG4gICAgLy8gSVVJTWFuYWdlciDmjqXlj6PmianlsZXvvIjkuLogVmlldyDmj5Dkvpvnsbvlnovmjqjmlq3vvIlcbiAgICBpZiAodmlld3MubGVuZ3RoID4gMCkge1xuICAgICAgICBsaW5lcy5wdXNoKCcgICAgLy8g5omp5bGVIElVSU1hbmFnZXIg5o6l5Y+j77yM5re75YqgIFZpZXcg57G75Z6L6YeN6L29Jyk7XG4gICAgICAgIGxpbmVzLnB1c2goJyAgICBpbnRlcmZhY2UgSVVJTWFuYWdlciB7Jyk7XG5cbiAgICAgICAgLy8g5Li65q+P5LiqIFZpZXcg5re75YqgIG9wZW4g6YeN6L29XG4gICAgICAgIGZvciAoY29uc3QgdmlldyBvZiB2aWV3cykge1xuICAgICAgICAgICAgbGluZXMucHVzaChgICAgICAgICBvcGVuKHZpZXdLZXk6ICcke3ZpZXcuZGVjb3JhdG9yTmFtZX0nLCBhcmdzPzogYW55KTogUHJvbWlzZTwke3ZpZXcuY2xhc3NOYW1lfT47YCk7XG4gICAgICAgIH1cblxuICAgICAgICAvLyDkuLrmr4/kuKogVmlldyDmt7vliqAgb3BlbkFuZFB1c2gg6YeN6L29XG4gICAgICAgIGZvciAoY29uc3QgdmlldyBvZiB2aWV3cykge1xuICAgICAgICAgICAgbGluZXMucHVzaChgICAgICAgICBvcGVuQW5kUHVzaCh2aWV3S2V5OiAnJHt2aWV3LmRlY29yYXRvck5hbWV9JywgZ3JvdXA6IHN0cmluZywgYXJncz86IGFueSk6IFByb21pc2U8JHt2aWV3LmNsYXNzTmFtZX0+O2ApO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8g5Li65q+P5LiqIFZpZXcg5re75YqgIGNsb3NlIOmHjei9vVxuICAgICAgICBmb3IgKGNvbnN0IHZpZXcgb2Ygdmlld3MpIHtcbiAgICAgICAgICAgIGxpbmVzLnB1c2goYCAgICAgICAgY2xvc2Uodmlld0tleTogJyR7dmlldy5kZWNvcmF0b3JOYW1lfScgfCBJVmlldywgZGVzdG9yeT86IGJvb2xlYW4pOiB2b2lkO2ApO1xuICAgICAgICB9XG5cbiAgICAgICAgbGluZXMucHVzaCgnICAgIH0nKTtcbiAgICB9XG5cbiAgICBsaW5lcy5wdXNoKCd9Jyk7XG4gICAgbGluZXMucHVzaCgnJyk7XG5cbiAgICByZXR1cm4gbGluZXMuam9pbignXFxuJyk7XG59XG5cbi8vIOS4u+WHveaVsFxuZXhwb3J0IGZ1bmN0aW9uIGdlbmVyYXRlVHlwZXMoY29uZmlnOiBUeXBlR2VuQ29uZmlnKTogeyBzdWNjZXNzOiBib29sZWFuOyBtZXNzYWdlOiBzdHJpbmcgfSB7XG4gICAgdHJ5IHtcbiAgICAgICAgY29uc29sZS5sb2coJ/CfmoAg5byA5aeL55Sf5oiQ57G75Z6L5pig5bCE5paH5Lu2Li4uXFxuJyk7XG5cbiAgICAgICAgLy8g5omr5o+PIE1vZGVsIOebruW9lVxuICAgICAgICBjb25zb2xlLmxvZyhg8J+TgiDmiavmj48gTW9kZWwg55uu5b2VOiAke2NvbmZpZy5tb2RlbERpcn1gKTtcbiAgICAgICAgY29uc3QgbW9kZWxGaWxlcyA9IHNjYW5EaXJlY3RvcnkoY29uZmlnLm1vZGVsRGlyKTtcbiAgICAgICAgY29uc3QgbW9kZWxzID0gbW9kZWxGaWxlc1xuICAgICAgICAgICAgLm1hcChwYXJzZUZpbGUpXG4gICAgICAgICAgICAuZmlsdGVyKChpdGVtKTogaXRlbSBpcyBQYXJzZWRJdGVtID0+IGl0ZW0gIT09IG51bGwgJiYgaXRlbS50eXBlID09PSAnbW9kZWwnKTtcbiAgICAgICAgY29uc29sZS5sb2coYCAgIOaJvuWIsCAke21vZGVscy5sZW5ndGh9IOS4qiBNb2RlbFxcbmApO1xuXG4gICAgICAgIC8vIOaJq+aPjyBNYW5hZ2VyIOebruW9lVxuICAgICAgICBjb25zb2xlLmxvZyhg8J+TgiDmiavmj48gTWFuYWdlciDnm67lvZU6ICR7Y29uZmlnLm1hbmFnZXJEaXJ9YCk7XG4gICAgICAgIGNvbnN0IG1hbmFnZXJGaWxlcyA9IHNjYW5EaXJlY3RvcnkoY29uZmlnLm1hbmFnZXJEaXIpO1xuICAgICAgICBjb25zdCBtYW5hZ2VycyA9IG1hbmFnZXJGaWxlc1xuICAgICAgICAgICAgLm1hcChwYXJzZUZpbGUpXG4gICAgICAgICAgICAuZmlsdGVyKChpdGVtKTogaXRlbSBpcyBQYXJzZWRJdGVtID0+IGl0ZW0gIT09IG51bGwgJiYgaXRlbS50eXBlID09PSAnbWFuYWdlcicpO1xuICAgICAgICBjb25zb2xlLmxvZyhgICAg5om+5YiwICR7bWFuYWdlcnMubGVuZ3RofSDkuKogTWFuYWdlclxcbmApO1xuXG4gICAgICAgIC8vIOaJq+aPjyBWaWV3IOebruW9lVxuICAgICAgICBjb25zb2xlLmxvZyhg8J+TgiDmiavmj48gVmlldyDnm67lvZU6ICR7Y29uZmlnLnZpZXdEaXJ9YCk7XG4gICAgICAgIGNvbnN0IHZpZXdGaWxlcyA9IHNjYW5EaXJlY3RvcnkoY29uZmlnLnZpZXdEaXIpO1xuICAgICAgICBjb25zdCB2aWV3cyA9IHZpZXdGaWxlc1xuICAgICAgICAgICAgLm1hcChwYXJzZUZpbGUpXG4gICAgICAgICAgICAuZmlsdGVyKChpdGVtKTogaXRlbSBpcyBQYXJzZWRJdGVtID0+IGl0ZW0gIT09IG51bGwgJiYgaXRlbS50eXBlID09PSAndmlldycpO1xuICAgICAgICBjb25zb2xlLmxvZyhgICAg5om+5YiwICR7dmlld3MubGVuZ3RofSDkuKogVmlld1xcbmApO1xuXG4gICAgICAgIGlmIChtb2RlbHMubGVuZ3RoID09PSAwICYmIG1hbmFnZXJzLmxlbmd0aCA9PT0gMCAmJiB2aWV3cy5sZW5ndGggPT09IDApIHtcbiAgICAgICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICAgICAgc3VjY2VzczogZmFsc2UsXG4gICAgICAgICAgICAgICAgbWVzc2FnZTogJ+KaoO+4jyAg5pyq5om+5Yiw5Lu75L2VIE1vZGVs44CBTWFuYWdlciDmiJYgVmlld++8jOi3s+i/h+eUn+aIkCdcbiAgICAgICAgICAgIH07XG4gICAgICAgIH1cblxuICAgICAgICAvLyDnlJ/miJDnsbvlnovmmKDlsIRcbiAgICAgICAgY29uc3QgY29udGVudCA9IGdlbmVyYXRlVHlwZU1hcChtb2RlbHMsIG1hbmFnZXJzLCB2aWV3cywgY29uZmlnKTtcblxuICAgICAgICAvLyDnoa7kv53ovpPlh7rnm67lvZXlrZjlnKhcbiAgICAgICAgY29uc3Qgb3V0cHV0RGlyID0gcGF0aC5kaXJuYW1lKGNvbmZpZy5vdXRwdXRGaWxlKTtcbiAgICAgICAgaWYgKCFmcy5leGlzdHNTeW5jKG91dHB1dERpcikpIHtcbiAgICAgICAgICAgIGZzLm1rZGlyU3luYyhvdXRwdXREaXIsIHsgcmVjdXJzaXZlOiB0cnVlIH0pO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8g5YaZ5YWl5paH5Lu2XG4gICAgICAgIGZzLndyaXRlRmlsZVN5bmMoY29uZmlnLm91dHB1dEZpbGUsIGNvbnRlbnQsICd1dGYtOCcpO1xuXG4gICAgICAgIGxldCBtZXNzYWdlID0gYOKchSDnsbvlnovmmKDlsITmlofku7blt7LnlJ/miJA6ICR7Y29uZmlnLm91dHB1dEZpbGV9XFxuXFxuYDtcbiAgICAgICAgbWVzc2FnZSArPSAn8J+TiyDnlJ/miJDnmoTmmKDlsIQ6XFxuJztcbiAgICAgICAgaWYgKG1vZGVscy5sZW5ndGggPiAwKSB7XG4gICAgICAgICAgICBtZXNzYWdlICs9ICcgICBNb2RlbHM6XFxuJztcbiAgICAgICAgICAgIG1vZGVscy5mb3JFYWNoKG0gPT4gbWVzc2FnZSArPSBgICAgICAtICR7bS5kZWNvcmF0b3JOYW1lfSDihpIgJHttLmNsYXNzTmFtZX1cXG5gKTtcbiAgICAgICAgfVxuICAgICAgICBpZiAobWFuYWdlcnMubGVuZ3RoID4gMCkge1xuICAgICAgICAgICAgbWVzc2FnZSArPSAnICAgTWFuYWdlcnM6XFxuJztcbiAgICAgICAgICAgIG1hbmFnZXJzLmZvckVhY2gobSA9PiBtZXNzYWdlICs9IGAgICAgIC0gJHttLmRlY29yYXRvck5hbWV9IOKGkiAke20uY2xhc3NOYW1lfVxcbmApO1xuICAgICAgICB9XG4gICAgICAgIGlmICh2aWV3cy5sZW5ndGggPiAwKSB7XG4gICAgICAgICAgICBtZXNzYWdlICs9ICcgICBWaWV3czpcXG4nO1xuICAgICAgICAgICAgdmlld3MuZm9yRWFjaCh2ID0+IG1lc3NhZ2UgKz0gYCAgICAgLSAke3YuZGVjb3JhdG9yTmFtZX0g4oaSICR7di5jbGFzc05hbWV9XFxuYCk7XG4gICAgICAgIH1cbiAgICAgICAgbWVzc2FnZSArPSAnXFxu8J+OiSDlrozmiJDvvIEnO1xuXG4gICAgICAgIGNvbnNvbGUubG9nKG1lc3NhZ2UpO1xuICAgICAgICByZXR1cm4geyBzdWNjZXNzOiB0cnVlLCBtZXNzYWdlIH07XG5cbiAgICB9IGNhdGNoIChlcnJvcikge1xuICAgICAgICBjb25zdCBlcnJvck1lc3NhZ2UgPSBg4p2MIOeUn+aIkOWksei0pTogJHtlcnJvciBpbnN0YW5jZW9mIEVycm9yID8gZXJyb3IubWVzc2FnZSA6IFN0cmluZyhlcnJvcil9YDtcbiAgICAgICAgY29uc29sZS5lcnJvcihlcnJvck1lc3NhZ2UpO1xuICAgICAgICByZXR1cm4geyBzdWNjZXNzOiBmYWxzZSwgbWVzc2FnZTogZXJyb3JNZXNzYWdlIH07XG4gICAgfVxufVxuXG4vLyDku47pobnnm67phY3nva7mlofku7bor7vlj5bphY3nva5cbmZ1bmN0aW9uIGxvYWRDb25maWdGcm9tUHJvamVjdChwcm9qZWN0UGF0aDogc3RyaW5nKTogVHlwZUdlbkNvbmZpZyB8IG51bGwge1xuICAgIGNvbnN0IGRlZmF1bHRDb25maWcgPSB7XG4gICAgICAgIG1vZGVsRGlyOiAnYXNzZXRzL3NyYy9nYW1lL21vZGVscycsXG4gICAgICAgIG1hbmFnZXJEaXI6ICdhc3NldHMvc3JjL2dhbWUvbWFuYWdlcnMnLFxuICAgICAgICB2aWV3RGlyOiAnYXNzZXRzL3NyYy9nYW1lL2d1aScsXG4gICAgICAgIG91dHB1dEZpbGU6ICdhc3NldHMvdHlwZXMvYXBpLXR5cGUtaGludHMuZC50cycsXG4gICAgICAgIG1vZHVsZUltcG9ydFBhdGg6ICdkemtjYy1tZmxvdy9jb3JlJ1xuICAgIH07XG5cbiAgICAvLyDop4TojIPljJbphY3nva7vvJrlsIbnm7jlr7not6/lvoTovazmjaLkuLrnu53lr7not6/lvoRcbiAgICBjb25zdCBub3JtYWxpemVDb25maWcgPSAoY29uZmlnOiBQYXJ0aWFsPFR5cGVHZW5Db25maWc+KTogVHlwZUdlbkNvbmZpZyA9PiAoe1xuICAgICAgICBtb2RlbERpcjogcGF0aC5yZXNvbHZlKHByb2plY3RQYXRoLCBjb25maWcubW9kZWxEaXIgfHwgZGVmYXVsdENvbmZpZy5tb2RlbERpciksXG4gICAgICAgIG1hbmFnZXJEaXI6IHBhdGgucmVzb2x2ZShwcm9qZWN0UGF0aCwgY29uZmlnLm1hbmFnZXJEaXIgfHwgZGVmYXVsdENvbmZpZy5tYW5hZ2VyRGlyKSxcbiAgICAgICAgdmlld0RpcjogcGF0aC5yZXNvbHZlKHByb2plY3RQYXRoLCBjb25maWcudmlld0RpciB8fCBkZWZhdWx0Q29uZmlnLnZpZXdEaXIpLFxuICAgICAgICBvdXRwdXRGaWxlOiBwYXRoLnJlc29sdmUocHJvamVjdFBhdGgsIGNvbmZpZy5vdXRwdXRGaWxlIHx8IGRlZmF1bHRDb25maWcub3V0cHV0RmlsZSksXG4gICAgICAgIG1vZHVsZUltcG9ydFBhdGg6IGNvbmZpZy5tb2R1bGVJbXBvcnRQYXRoIHx8IGRlZmF1bHRDb25maWcubW9kdWxlSW1wb3J0UGF0aFxuICAgIH0pO1xuXG4gICAgLy8g5LuO5Y2V54us55qE6YWN572u5paH5Lu26K+75Y+WXG4gICAgY29uc3QgY29uZmlnUGF0aCA9IHBhdGguam9pbihwcm9qZWN0UGF0aCwgJ21mbG93LmNvbmZpZy5qc29uJyk7XG4gICAgaWYgKGZzLmV4aXN0c1N5bmMoY29uZmlnUGF0aCkpIHtcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIGNvbnN0IGNvbmZpZyA9IEpTT04ucGFyc2UoZnMucmVhZEZpbGVTeW5jKGNvbmZpZ1BhdGgsICd1dGYtOCcpKTtcbiAgICAgICAgICAgIHJldHVybiBub3JtYWxpemVDb25maWcoY29uZmlnKTtcbiAgICAgICAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICAgICAgICAgIGNvbnNvbGUud2Fybign5peg5rOV6K+75Y+WIG1mbG93LmNvbmZpZy5qc29uIOmFjee9ricpO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgLy8g5L2/55So6buY6K6k6YWN572uXG4gICAgcmV0dXJuIG5vcm1hbGl6ZUNvbmZpZyh7fSk7XG59XG5cbi8vIOe8lui+keWZqOaJqeWxleWFpeWPo1xuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIG9uR2VuZXJhdGVUeXBlcygpIHtcbiAgICB0cnkge1xuICAgICAgICAvLyDojrflj5bpobnnm67ot6/lvoRcbiAgICAgICAgY29uc3QgcHJvamVjdFBhdGggPSBFZGl0b3IuUHJvamVjdC5wYXRoO1xuICAgICAgICBjb25zb2xlLmxvZygn6aG555uu6Lev5b6EOicsIHByb2plY3RQYXRoKTtcblxuICAgICAgICAvLyDliqDovb3phY3nva5cbiAgICAgICAgY29uc3QgY29uZmlnID0gbG9hZENvbmZpZ0Zyb21Qcm9qZWN0KHByb2plY3RQYXRoKTtcbiAgICAgICAgaWYgKCFjb25maWcpIHtcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcign5peg5rOV5Yqg6L296YWN572uJyk7XG4gICAgICAgIH1cblxuICAgICAgICBjb25zb2xlLmxvZygn5L2/55So6YWN572uOicsIGNvbmZpZyk7XG5cbiAgICAgICAgLy8g55Sf5oiQ57G75Z6L5pig5bCEXG4gICAgICAgIGNvbnN0IHJlc3VsdCA9IGdlbmVyYXRlVHlwZXMoY29uZmlnKTtcblxuICAgICAgICBpZiAocmVzdWx0LnN1Y2Nlc3MpIHtcbiAgICAgICAgICAgIGF3YWl0IEVkaXRvci5EaWFsb2cuaW5mbygn57G75Z6L5pig5bCE55Sf5oiQ5oiQ5Yqf77yBJywge1xuICAgICAgICAgICAgICAgIGRldGFpbDogcmVzdWx0Lm1lc3NhZ2UsXG4gICAgICAgICAgICAgICAgYnV0dG9uczogWyfnoa7lrponXVxuICAgICAgICAgICAgfSk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBhd2FpdCBFZGl0b3IuRGlhbG9nLndhcm4oJ+exu+Wei+aYoOWwhOeUn+aIkOWksei0pScsIHtcbiAgICAgICAgICAgICAgICBkZXRhaWw6IHJlc3VsdC5tZXNzYWdlLFxuICAgICAgICAgICAgICAgIGJ1dHRvbnM6IFsn56Gu5a6aJ11cbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9XG4gICAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICAgICAgY29uc29sZS5lcnJvcign55Sf5oiQ57G75Z6L5pig5bCE5aSx6LSlOicsIGVycm9yKTtcbiAgICAgICAgYXdhaXQgRWRpdG9yLkRpYWxvZy5lcnJvcign55Sf5oiQ57G75Z6L5pig5bCE5aSx6LSlJywge1xuICAgICAgICAgICAgZGV0YWlsOiBlcnJvciBpbnN0YW5jZW9mIEVycm9yID8gZXJyb3IubWVzc2FnZSA6IFN0cmluZyhlcnJvciksXG4gICAgICAgICAgICBidXR0b25zOiBbJ+ehruWumiddXG4gICAgICAgIH0pO1xuICAgIH1cbn1cblxuIl19