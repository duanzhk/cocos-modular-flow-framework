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
            imports.push('ViewNames');
        lines.push(`import { ${imports.join(', ')} } from '${config.moduleImportPath}';`);
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
    // ICore 接口扩展（使用函数重载提供精确的类型推断）
    if (models.length > 0 || managers.length > 0) {
        lines.push('    // 扩展 ICore 接口，添加精确的类型重载');
        lines.push('    interface ICore {');
        // 为每个 Model 添加 getModel 重载
        if (models.length > 0) {
            for (const model of models) {
                lines.push(`        getModel<T extends '${model.decoratorName}'>(modelKey: T): ${model.className};`);
            }
        }
        // 为每个 Manager 添加 getManager 重载
        if (managers.length > 0) {
            for (const manager of managers) {
                lines.push(`        getManager<T extends '${manager.decoratorName}'>(managerKey: T): ${manager.className};`);
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
            lines.push(`        open<T extends '${view.decoratorName}'>(viewKey: T, args?: any): Promise<${view.className}>;`);
        }
        // 为每个 View 添加 openAndPush 重载
        for (const view of views) {
            lines.push(`        openAndPush<T extends '${view.decoratorName}'>(viewKey: T, group: string, args?: any): Promise<${view.className}>;`);
        }
        // 为每个 View 添加 close 重载
        for (const view of views) {
            lines.push(`        close<T extends '${view.decoratorName}'>(viewKey: T | IView, destory?: boolean): void;`);
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZ2VuZXJhdGUtdHlwZXMuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi9zb3VyY2UvZ2VuZXJhdGUtdHlwZXMudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IjtBQUFBOzs7R0FHRzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFFSCx1Q0FBeUI7QUFDekIsMkNBQTZCO0FBbUI3QixrQkFBa0I7QUFDbEIsU0FBUyxhQUFhLENBQUMsR0FBVztJQUM5QixJQUFJLENBQUMsRUFBRSxDQUFDLFVBQVUsQ0FBQyxHQUFHLENBQUMsRUFBRTtRQUNyQixPQUFPLENBQUMsSUFBSSxDQUFDLGNBQWMsR0FBRyxFQUFFLENBQUMsQ0FBQztRQUNsQyxPQUFPLEVBQUUsQ0FBQztLQUNiO0lBRUQsTUFBTSxLQUFLLEdBQWEsRUFBRSxDQUFDO0lBQzNCLE1BQU0sS0FBSyxHQUFHLEVBQUUsQ0FBQyxXQUFXLENBQUMsR0FBRyxDQUFDLENBQUM7SUFFbEMsS0FBSyxNQUFNLElBQUksSUFBSSxLQUFLLEVBQUU7UUFDdEIsTUFBTSxRQUFRLEdBQUcsSUFBSSxDQUFDLElBQUksQ0FBQyxHQUFHLEVBQUUsSUFBSSxDQUFDLENBQUM7UUFDdEMsTUFBTSxJQUFJLEdBQUcsRUFBRSxDQUFDLFFBQVEsQ0FBQyxRQUFRLENBQUMsQ0FBQztRQUVuQyxJQUFJLElBQUksQ0FBQyxXQUFXLEVBQUUsRUFBRTtZQUNwQixLQUFLLENBQUMsSUFBSSxDQUFDLEdBQUcsYUFBYSxDQUFDLFFBQVEsQ0FBQyxDQUFDLENBQUM7U0FDMUM7YUFBTSxJQUFJLElBQUksQ0FBQyxRQUFRLENBQUMsS0FBSyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsUUFBUSxDQUFDLE9BQU8sQ0FBQyxFQUFFO1lBQ3hELEtBQUssQ0FBQyxJQUFJLENBQUMsUUFBUSxDQUFDLENBQUM7U0FDeEI7S0FDSjtJQUVELE9BQU8sS0FBSyxDQUFDO0FBQ2pCLENBQUM7QUFFRCxjQUFjO0FBQ2QsU0FBUyxTQUFTLENBQUMsUUFB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QUM7UUFDbEQsSUFBSSxDQUFDLE1BQU0sRUFBRTtZQUNULE1BQU0sSUFBSSxLQUFLLENBQUMsUUFBUSxDQUFDLENBQUM7U0FDN0I7UUFFRCxPQUFPLENBQUMsR0FBRyxDQUFDLE9BQU8sRUFBRSxNQUFNLENBQUMsQ0FBQztRQUU3QixTQUFTO1FBQ1QsTUFBTSxNQUFNLEdBQUcsYUFBYSxDQUFDLE1BQU0sQ0FBQyxDQUFDO1FBRXJDLElBQUksTUFBTSxDQUFDLE9BQU8sRUFBRTtZQUNoQixNQUFNLE1BQU0sQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDLFdBQVcsRUFBRTtnQkFDbEMsTUFBTSxFQUFFLE1BQU0sQ0FBQyxPQUFPO2dCQUN0QixPQUFPLEVBQUUsQ0FBQyxJQUFJLENBQUM7YUFDbEIsQ0FBQyxDQUFDO1NBQ047YUFBTTtZQUNILE1BQU0sTUFBTSxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsVUFBVSxFQUFFO2dCQUNqQyxNQUFNLEVBQUUsTUFBTSxDQUFDLE9BQU87Z0JBQ3RCLE9BQU8sRUFBRSxDQUFDLElBQUksQ0FBQzthQUNsQixDQUFDLENBQUM7U0FDTjtLQUNKO0lBQUMsT0FBTyxLQUFLLEVBQUU7UUFDWixPQUFPLENBQUMsS0FBSyxDQUFDLFdBQVcsRUFBRSxLQUFLLENBQUMsQ0FBQztRQUNsQyxNQUFNLE1BQU0sQ0FBQyxNQUFNLENBQUMsS0FBSyxDQUFDLFVBQVUsRUFBRTtZQUNsQyxNQUFNLEVBQUUsS0FBSyxZQUFZLEtBQUssQ0FBQyxDQUFDLENBQUMsS0FBSyxDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUMsTUFBTSxDQUFDLEtBQUssQ0FBQztZQUM5RCxPQUFPLEVBQUUsQ0FBQyxJQUFJLENBQUM7U0FDbEIsQ0FBQyxDQUFDO0tBQ047QUFDTCxDQUFDO0FBbkNELDBDQW1DQyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQGVuIEdlbmVyYXRlIHR5cGUgbWFwIGZpbGUgZm9yIHRoZSBjbGFzc2VzIGRlY29yYXRlZCB3aXRoIEBtb2RlbCgpLCBAbWFuYWdlcigpIG9yIEB2aWV3KClcbiAqIEB6aCDkuLrooqvoo4XppbDlmajoo4XppbAoQG1vZGVsKCnjgIFAbWFuYWdlcigp5oiWQHZpZXcoKSnnmoTnsbvnlJ/miJDnsbvlnovmmKDlsITmlofku7bvvIzlrp7njrDlrozmlbTnmoTnsbvlnovmjqjmlq3mlK/mjIHjgIJcbiAqL1xuXG5pbXBvcnQgKiBhcyBmcyBmcm9tICdmcyc7XG5pbXBvcnQgKiBhcyBwYXRoIGZyb20gJ3BhdGgnO1xuXG4vLyDphY3nva7mjqXlj6NcbmludGVyZmFjZSBUeXBlR2VuQ29uZmlnIHtcbiAgICBtb2RlbERpcjogc3RyaW5nO1xuICAgIG1hbmFnZXJEaXI6IHN0cmluZztcbiAgICB2aWV3RGlyOiBzdHJpbmc7XG4gICAgb3V0cHV0RmlsZTogc3RyaW5nO1xuICAgIG1vZHVsZUltcG9ydFBhdGg6IHN0cmluZztcbn1cblxuLy8g6Kej5p6Q57uT5p6c5o6l5Y+jXG5pbnRlcmZhY2UgUGFyc2VkSXRlbSB7XG4gICAgdHlwZTogJ21vZGVsJyB8ICdtYW5hZ2VyJyB8ICd2aWV3JztcbiAgICBkZWNvcmF0b3JOYW1lOiBzdHJpbmc7XG4gICAgY2xhc3NOYW1lOiBzdHJpbmc7XG4gICAgZmlsZVBhdGg6IHN0cmluZztcbn1cblxuLy8g5omr5o+P55uu5b2V6I635Y+W5omA5pyJIC50cyDmlofku7ZcbmZ1bmN0aW9uIHNjYW5EaXJlY3RvcnkoZGlyOiBzdHJpbmcpOiBzdHJpbmdbXSB7XG4gICAgaWYgKCFmcy5leGlzdHNTeW5jKGRpcikpIHtcbiAgICAgICAgY29uc29sZS53YXJuKGDimqDvuI8gIOebruW9leS4jeWtmOWcqDogJHtkaXJ9YCk7XG4gICAgICAgIHJldHVybiBbXTtcbiAgICB9XG5cbiAgICBjb25zdCBmaWxlczogc3RyaW5nW10gPSBbXTtcbiAgICBjb25zdCBpdGVtcyA9IGZzLnJlYWRkaXJTeW5jKGRpcik7XG5cbiAgICBmb3IgKGNvbnN0IGl0ZW0gb2YgaXRlbXMpIHtcbiAgICAgICAgY29uc3QgZnVsbFBhdGggPSBwYXRoLmpvaW4oZGlyLCBpdGVtKTtcbiAgICAgICAgY29uc3Qgc3RhdCA9IGZzLnN0YXRTeW5jKGZ1bGxQYXRoKTtcblxuICAgICAgICBpZiAoc3RhdC5pc0RpcmVjdG9yeSgpKSB7XG4gICAgICAgICAgICBmaWxlcy5wdXNoKC4uLnNjYW5EaXJlY3RvcnkoZnVsbFBhdGgpKTtcbiAgICAgICAgfSBlbHNlIGlmIChpdGVtLmVuZHNXaXRoKCcudHMnKSAmJiAhaXRlbS5lbmRzV2l0aCgnLmQudHMnKSkge1xuICAgICAgICAgICAgZmlsZXMucHVzaChmdWxsUGF0aCk7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICByZXR1cm4gZmlsZXM7XG59XG5cbi8vIOino+aekOaWh+S7tuiOt+WPluijhemlsOWZqOS/oeaBr1xuZnVuY3Rpb24gcGFyc2VGaWxlKGZpbGVQYXRoOiBzdHJpbmcpOiBQYXJzZWRJdGVtIHwgbnVsbCB7XG4gICAgY29uc3QgY29udGVudCA9IGZzLnJlYWRGaWxlU3luYyhmaWxlUGF0aCwgJ3V0Zi04Jyk7XG4gICAgY29uc3QgZmlsZU5hbWUgPSBwYXRoLmJhc2VuYW1lKGZpbGVQYXRoLCAnLnRzJyk7XG5cbiAgICAvLyDljLnphY0gQG1vZGVsKCdOYW1lJykg5oiWIEBtb2RlbCgpXG4gICAgY29uc3QgbW9kZWxNYXRjaCA9IGNvbnRlbnQubWF0Y2goL0Btb2RlbFxccypcXChcXHMqWydcIl0oXFx3KylbJ1wiXVxccypcXCkvKTtcbiAgICBpZiAobW9kZWxNYXRjaCkge1xuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgdHlwZTogJ21vZGVsJyxcbiAgICAgICAgICAgIGRlY29yYXRvck5hbWU6IG1vZGVsTWF0Y2hbMV0sXG4gICAgICAgICAgICBjbGFzc05hbWU6IGZpbGVOYW1lLFxuICAgICAgICAgICAgZmlsZVBhdGg6IGZpbGVQYXRoXG4gICAgICAgIH07XG4gICAgfVxuXG4gICAgLy8g5Yy56YWNIEBtYW5hZ2VyKCdOYW1lJykg5oiWIEBtYW5hZ2VyKClcbiAgICBjb25zdCBtYW5hZ2VyTWF0Y2ggPSBjb250ZW50Lm1hdGNoKC9AbWFuYWdlclxccypcXChcXHMqWydcIl0oXFx3KylbJ1wiXVxccypcXCkvKTtcbiAgICBpZiAobWFuYWdlck1hdGNoKSB7XG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICB0eXBlOiAnbWFuYWdlcicsXG4gICAgICAgICAgICBkZWNvcmF0b3JOYW1lOiBtYW5hZ2VyTWF0Y2hbMV0sXG4gICAgICAgICAgICBjbGFzc05hbWU6IGZpbGVOYW1lLFxuICAgICAgICAgICAgZmlsZVBhdGg6IGZpbGVQYXRoXG4gICAgICAgIH07XG4gICAgfVxuXG4gICAgLy8g5Yy56YWNIEB2aWV3KCdOYW1lJykg5oiWIEB2aWV3KClcbiAgICBjb25zdCB2aWV3TWF0Y2ggPSBjb250ZW50Lm1hdGNoKC9Admlld1xccypcXChcXHMqWydcIl0oXFx3KylbJ1wiXVxccypcXCkvKTtcbiAgICBpZiAodmlld01hdGNoKSB7XG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICB0eXBlOiAndmlldycsXG4gICAgICAgICAgICBkZWNvcmF0b3JOYW1lOiB2aWV3TWF0Y2hbMV0sXG4gICAgICAgICAgICBjbGFzc05hbWU6IGZpbGVOYW1lLFxuICAgICAgICAgICAgZmlsZVBhdGg6IGZpbGVQYXRoXG4gICAgICAgIH07XG4gICAgfVxuXG4gICAgLy8g5aaC5p6c5rKh5pyJ5oyH5a6a5ZCN56ew77yM5L2/55So57G75ZCNXG4gICAgaWYgKGNvbnRlbnQuaW5jbHVkZXMoJ0Btb2RlbCgpJykpIHtcbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgIHR5cGU6ICdtb2RlbCcsXG4gICAgICAgICAgICBkZWNvcmF0b3JOYW1lOiBmaWxlTmFtZSxcbiAgICAgICAgICAgIGNsYXNzTmFtZTogZmlsZU5hbWUsXG4gICAgICAgICAgICBmaWxlUGF0aDogZmlsZVBhdGhcbiAgICAgICAgfTtcbiAgICB9XG5cbiAgICBpZiAoY29udGVudC5pbmNsdWRlcygnQG1hbmFnZXIoKScpKSB7XG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICB0eXBlOiAnbWFuYWdlcicsXG4gICAgICAgICAgICBkZWNvcmF0b3JOYW1lOiBmaWxlTmFtZSxcbiAgICAgICAgICAgIGNsYXNzTmFtZTogZmlsZU5hbWUsXG4gICAgICAgICAgICBmaWxlUGF0aDogZmlsZVBhdGhcbiAgICAgICAgfTtcbiAgICB9XG5cbiAgICBpZiAoY29udGVudC5pbmNsdWRlcygnQHZpZXcoKScpKSB7XG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICB0eXBlOiAndmlldycsXG4gICAgICAgICAgICBkZWNvcmF0b3JOYW1lOiBmaWxlTmFtZSxcbiAgICAgICAgICAgIGNsYXNzTmFtZTogZmlsZU5hbWUsXG4gICAgICAgICAgICBmaWxlUGF0aDogZmlsZVBhdGhcbiAgICAgICAgfTtcbiAgICB9XG5cbiAgICByZXR1cm4gbnVsbDtcbn1cblxuLy8g55Sf5oiQ57G75Z6L5pig5bCE5Luj56CBXG5mdW5jdGlvbiBnZW5lcmF0ZVR5cGVNYXAobW9kZWxzOiBQYXJzZWRJdGVtW10sIG1hbmFnZXJzOiBQYXJzZWRJdGVtW10sIHZpZXdzOiBQYXJzZWRJdGVtW10sIGNvbmZpZzogVHlwZUdlbkNvbmZpZyk6IHN0cmluZyB7XG4gICAgY29uc3QgbGluZXM6IHN0cmluZ1tdID0gW107XG5cbiAgICAvLyDmlofku7blpLTms6jph4pcbiAgICBsaW5lcy5wdXNoKCcvKionKTtcbiAgICBsaW5lcy5wdXNoKCcgKiDoh6rliqjnlJ/miJDnmoTnsbvlnovmmKDlsITmlofku7YnKTtcbiAgICBsaW5lcy5wdXNoKCcgKiDimqDvuI8g6K+35Yu/5omL5Yqo5L+u5pS55q2k5paH5Lu277yBJyk7XG4gICAgbGluZXMucHVzaCgnICog6YeN5paw55Sf5oiQ77ya5ZyoIENvY29zIENyZWF0b3Ig57yW6L6R5Zmo5Lit6L+Q6KGMIG1mbG93LXRvb2xzIC0+IEdlbmVyYXRlIEFQSSB0eXBlIGhpbnRzL+eUn+aIkEFQSeexu+Wei+aPkOekuicpO1xuICAgIGxpbmVzLnB1c2goJyAqLycpO1xuICAgIGxpbmVzLnB1c2goJycpO1xuXG4gICAgLy8g5a+85YWlIE1vZGVsXG4gICAgaWYgKG1vZGVscy5sZW5ndGggPiAwKSB7XG4gICAgICAgIGxpbmVzLnB1c2goJy8vIE1vZGVsIOWvvOWFpScpO1xuICAgICAgICBmb3IgKGNvbnN0IG1vZGVsIG9mIG1vZGVscykge1xuICAgICAgICAgICAgY29uc3QgcmVsYXRpdmVQYXRoID0gcGF0aC5yZWxhdGl2ZShcbiAgICAgICAgICAgICAgICBwYXRoLmRpcm5hbWUoY29uZmlnLm91dHB1dEZpbGUpLFxuICAgICAgICAgICAgICAgIG1vZGVsLmZpbGVQYXRoXG4gICAgICAgICAgICApLnJlcGxhY2UoL1xcXFwvZywgJy8nKS5yZXBsYWNlKCcudHMnLCAnJyk7XG4gICAgICAgICAgICBsaW5lcy5wdXNoKGBpbXBvcnQgdHlwZSB7ICR7bW9kZWwuY2xhc3NOYW1lfSB9IGZyb20gJyR7cmVsYXRpdmVQYXRofSc7YCk7XG4gICAgICAgIH1cbiAgICAgICAgbGluZXMucHVzaCgnJyk7XG4gICAgfVxuXG4gICAgLy8g5a+85YWlIE1hbmFnZXJcbiAgICBpZiAobWFuYWdlcnMubGVuZ3RoID4gMCkge1xuICAgICAgICBsaW5lcy5wdXNoKCcvLyBNYW5hZ2VyIOWvvOWFpScpO1xuICAgICAgICBmb3IgKGNvbnN0IG1hbmFnZXIgb2YgbWFuYWdlcnMpIHtcbiAgICAgICAgICAgIGNvbnN0IHJlbGF0aXZlUGF0aCA9IHBhdGgucmVsYXRpdmUoXG4gICAgICAgICAgICAgICAgcGF0aC5kaXJuYW1lKGNvbmZpZy5vdXRwdXRGaWxlKSxcbiAgICAgICAgICAgICAgICBtYW5hZ2VyLmZpbGVQYXRoXG4gICAgICAgICAgICApLnJlcGxhY2UoL1xcXFwvZywgJy8nKS5yZXBsYWNlKCcudHMnLCAnJyk7XG4gICAgICAgICAgICBsaW5lcy5wdXNoKGBpbXBvcnQgdHlwZSB7ICR7bWFuYWdlci5jbGFzc05hbWV9IH0gZnJvbSAnJHtyZWxhdGl2ZVBhdGh9JztgKTtcbiAgICAgICAgfVxuICAgICAgICBsaW5lcy5wdXNoKCcnKTtcbiAgICB9XG5cbiAgICAvLyDlr7zlhaUgVmlld1xuICAgIGlmICh2aWV3cy5sZW5ndGggPiAwKSB7XG4gICAgICAgIGxpbmVzLnB1c2goJy8vIFZpZXcg5a+85YWlJyk7XG4gICAgICAgIGZvciAoY29uc3QgdmlldyBvZiB2aWV3cykge1xuICAgICAgICAgICAgY29uc3QgcmVsYXRpdmVQYXRoID0gcGF0aC5yZWxhdGl2ZShcbiAgICAgICAgICAgICAgICBwYXRoLmRpcm5hbWUoY29uZmlnLm91dHB1dEZpbGUpLFxuICAgICAgICAgICAgICAgIHZpZXcuZmlsZVBhdGhcbiAgICAgICAgICAgICkucmVwbGFjZSgvXFxcXC9nLCAnLycpLnJlcGxhY2UoJy50cycsICcnKTtcbiAgICAgICAgICAgIGxpbmVzLnB1c2goYGltcG9ydCB0eXBlIHsgJHt2aWV3LmNsYXNzTmFtZX0gfSBmcm9tICcke3JlbGF0aXZlUGF0aH0nO2ApO1xuICAgICAgICB9XG4gICAgICAgIGxpbmVzLnB1c2goJycpO1xuICAgIH1cblxuICAgIC8vIOWvvOWFpSBOYW1lc++8iOeUqOS6juWHveaVsOmHjei9ve+8iVxuICAgIGNvbnN0IG5lZWRNb2RlbE5hbWVzID0gbW9kZWxzLmxlbmd0aCA+IDA7XG4gICAgY29uc3QgbmVlZE1hbmFnZXJOYW1lcyA9IG1hbmFnZXJzLmxlbmd0aCA+IDA7XG4gICAgY29uc3QgbmVlZFZpZXdOYW1lcyA9IHZpZXdzLmxlbmd0aCA+IDA7XG4gICAgaWYgKG5lZWRNb2RlbE5hbWVzIHx8IG5lZWRNYW5hZ2VyTmFtZXMgfHwgbmVlZFZpZXdOYW1lcykge1xuICAgICAgICBjb25zdCBpbXBvcnRzOiBzdHJpbmdbXSA9IFtdO1xuICAgICAgICBpZiAobmVlZE1vZGVsTmFtZXMpIGltcG9ydHMucHVzaCgnTW9kZWxOYW1lcycpO1xuICAgICAgICBpZiAobmVlZE1hbmFnZXJOYW1lcykgaW1wb3J0cy5wdXNoKCdNYW5hZ2VyTmFtZXMnKTtcbiAgICAgICAgaWYgKG5lZWRWaWV3TmFtZXMpIGltcG9ydHMucHVzaCgnVmlld05hbWVzJyk7XG4gICAgICAgIGxpbmVzLnB1c2goYGltcG9ydCB7ICR7aW1wb3J0cy5qb2luKCcsICcpfSB9IGZyb20gJyR7Y29uZmlnLm1vZHVsZUltcG9ydFBhdGh9JztgKTtcbiAgICAgICAgbGluZXMucHVzaCgnJyk7XG4gICAgfVxuXG4gICAgLy8g5aOw5piO5qih5Z2XXG4gICAgbGluZXMucHVzaChgZGVjbGFyZSBtb2R1bGUgJyR7Y29uZmlnLm1vZHVsZUltcG9ydFBhdGh9JyB7YCk7XG5cbiAgICAvLyDmianlsZUgTmFtZXNUeXBlIOaOpeWPo++8jOWwhuavj+S4quWxnuaAp+WumuS5ieS4uuWtl+espuS4suWtl+mdoumHj+exu+Wei1xuICAgIGlmIChtb2RlbHMubGVuZ3RoID4gMCkge1xuICAgICAgICBsaW5lcy5wdXNoKCcgICAgLy8g5omp5bGVIE1vZGVsTmFtZXNUeXBl77yM5bCG5q+P5Liq5bGe5oCn5a6a5LmJ5Li65a2X56ym5Liy5a2X6Z2i6YePJyk7XG4gICAgICAgIGxpbmVzLnB1c2goJyAgICBpbnRlcmZhY2UgTW9kZWxOYW1lc1R5cGUgeycpO1xuICAgICAgICBmb3IgKGNvbnN0IG1vZGVsIG9mIG1vZGVscykge1xuICAgICAgICAgICAgbGluZXMucHVzaChgICAgICAgICByZWFkb25seSAke21vZGVsLmRlY29yYXRvck5hbWV9OiAnJHttb2RlbC5kZWNvcmF0b3JOYW1lfSc7YCk7XG4gICAgICAgIH1cbiAgICAgICAgbGluZXMucHVzaCgnICAgIH0nKTtcbiAgICAgICAgbGluZXMucHVzaCgnJyk7XG4gICAgfVxuXG4gICAgaWYgKG1hbmFnZXJzLmxlbmd0aCA+IDApIHtcbiAgICAgICAgbGluZXMucHVzaCgnICAgIC8vIOaJqeWxlSBNYW5hZ2VyTmFtZXNUeXBl77yM5bCG5q+P5Liq5bGe5oCn5a6a5LmJ5Li65a2X56ym5Liy5a2X6Z2i6YePJyk7XG4gICAgICAgIGxpbmVzLnB1c2goJyAgICBpbnRlcmZhY2UgTWFuYWdlck5hbWVzVHlwZSB7Jyk7XG4gICAgICAgIGZvciAoY29uc3QgbWFuYWdlciBvZiBtYW5hZ2Vycykge1xuICAgICAgICAgICAgbGluZXMucHVzaChgICAgICAgICByZWFkb25seSAke21hbmFnZXIuZGVjb3JhdG9yTmFtZX06ICcke21hbmFnZXIuZGVjb3JhdG9yTmFtZX0nO2ApO1xuICAgICAgICB9XG4gICAgICAgIGxpbmVzLnB1c2goJyAgICB9Jyk7XG4gICAgICAgIGxpbmVzLnB1c2goJycpO1xuICAgIH1cblxuICAgIGlmICh2aWV3cy5sZW5ndGggPiAwKSB7XG4gICAgICAgIGxpbmVzLnB1c2goJyAgICAvLyDmianlsZUgVmlld05hbWVzVHlwZe+8jOWwhuavj+S4quWxnuaAp+WumuS5ieS4uuWtl+espuS4suWtl+mdoumHjycpO1xuICAgICAgICBsaW5lcy5wdXNoKCcgICAgaW50ZXJmYWNlIFZpZXdOYW1lc1R5cGUgeycpO1xuICAgICAgICBmb3IgKGNvbnN0IHZpZXcgb2Ygdmlld3MpIHtcbiAgICAgICAgICAgIGxpbmVzLnB1c2goYCAgICAgICAgcmVhZG9ubHkgJHt2aWV3LmRlY29yYXRvck5hbWV9OiAnJHt2aWV3LmRlY29yYXRvck5hbWV9JztgKTtcbiAgICAgICAgfVxuICAgICAgICBsaW5lcy5wdXNoKCcgICAgfScpO1xuICAgICAgICBsaW5lcy5wdXNoKCcnKTtcbiAgICB9XG5cbiAgICAvLyBJQ29yZSDmjqXlj6PmianlsZXvvIjkvb/nlKjlh73mlbDph43ovb3mj5Dkvpvnsr7noa7nmoTnsbvlnovmjqjmlq3vvIlcbiAgICBpZiAobW9kZWxzLmxlbmd0aCA+IDAgfHwgbWFuYWdlcnMubGVuZ3RoID4gMCkge1xuICAgICAgICBsaW5lcy5wdXNoKCcgICAgLy8g5omp5bGVIElDb3JlIOaOpeWPo++8jOa3u+WKoOeyvuehrueahOexu+Wei+mHjei9vScpO1xuICAgICAgICBsaW5lcy5wdXNoKCcgICAgaW50ZXJmYWNlIElDb3JlIHsnKTtcbiAgICAgICAgXG4gICAgICAgIC8vIOS4uuavj+S4qiBNb2RlbCDmt7vliqAgZ2V0TW9kZWwg6YeN6L29XG4gICAgICAgIGlmIChtb2RlbHMubGVuZ3RoID4gMCkge1xuICAgICAgICAgICAgZm9yIChjb25zdCBtb2RlbCBvZiBtb2RlbHMpIHtcbiAgICAgICAgICAgICAgICBsaW5lcy5wdXNoKGAgICAgICAgIGdldE1vZGVsPFQgZXh0ZW5kcyAnJHttb2RlbC5kZWNvcmF0b3JOYW1lfSc+KG1vZGVsS2V5OiBUKTogJHttb2RlbC5jbGFzc05hbWV9O2ApO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIFxuICAgICAgICAvLyDkuLrmr4/kuKogTWFuYWdlciDmt7vliqAgZ2V0TWFuYWdlciDph43ovb1cbiAgICAgICAgaWYgKG1hbmFnZXJzLmxlbmd0aCA+IDApIHtcbiAgICAgICAgICAgIGZvciAoY29uc3QgbWFuYWdlciBvZiBtYW5hZ2Vycykge1xuICAgICAgICAgICAgICAgIGxpbmVzLnB1c2goYCAgICAgICAgZ2V0TWFuYWdlcjxUIGV4dGVuZHMgJyR7bWFuYWdlci5kZWNvcmF0b3JOYW1lfSc+KG1hbmFnZXJLZXk6IFQpOiAke21hbmFnZXIuY2xhc3NOYW1lfTtgKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBcbiAgICAgICAgbGluZXMucHVzaCgnICAgIH0nKTtcbiAgICAgICAgbGluZXMucHVzaCgnJyk7XG4gICAgfVxuXG4gICAgLy8gSVVJTWFuYWdlciDmjqXlj6PmianlsZXvvIjkuLogVmlldyDmj5Dkvpvnsbvlnovmjqjmlq3vvIlcbiAgICBpZiAodmlld3MubGVuZ3RoID4gMCkge1xuICAgICAgICBsaW5lcy5wdXNoKCcgICAgLy8g5omp5bGVIElVSU1hbmFnZXIg5o6l5Y+j77yM5re75YqgIFZpZXcg57G75Z6L6YeN6L29Jyk7XG4gICAgICAgIGxpbmVzLnB1c2goJyAgICBpbnRlcmZhY2UgSVVJTWFuYWdlciB7Jyk7XG4gICAgICAgIFxuICAgICAgICAvLyDkuLrmr4/kuKogVmlldyDmt7vliqAgb3BlbiDph43ovb1cbiAgICAgICAgZm9yIChjb25zdCB2aWV3IG9mIHZpZXdzKSB7XG4gICAgICAgICAgICBsaW5lcy5wdXNoKGAgICAgICAgIG9wZW48VCBleHRlbmRzICcke3ZpZXcuZGVjb3JhdG9yTmFtZX0nPih2aWV3S2V5OiBULCBhcmdzPzogYW55KTogUHJvbWlzZTwke3ZpZXcuY2xhc3NOYW1lfT47YCk7XG4gICAgICAgIH1cbiAgICAgICAgXG4gICAgICAgIC8vIOS4uuavj+S4qiBWaWV3IOa3u+WKoCBvcGVuQW5kUHVzaCDph43ovb1cbiAgICAgICAgZm9yIChjb25zdCB2aWV3IG9mIHZpZXdzKSB7XG4gICAgICAgICAgICBsaW5lcy5wdXNoKGAgICAgICAgIG9wZW5BbmRQdXNoPFQgZXh0ZW5kcyAnJHt2aWV3LmRlY29yYXRvck5hbWV9Jz4odmlld0tleTogVCwgZ3JvdXA6IHN0cmluZywgYXJncz86IGFueSk6IFByb21pc2U8JHt2aWV3LmNsYXNzTmFtZX0+O2ApO1xuICAgICAgICB9XG4gICAgICAgIFxuICAgICAgICAvLyDkuLrmr4/kuKogVmlldyDmt7vliqAgY2xvc2Ug6YeN6L29XG4gICAgICAgIGZvciAoY29uc3QgdmlldyBvZiB2aWV3cykge1xuICAgICAgICAgICAgbGluZXMucHVzaChgICAgICAgICBjbG9zZTxUIGV4dGVuZHMgJyR7dmlldy5kZWNvcmF0b3JOYW1lfSc+KHZpZXdLZXk6IFQgfCBJVmlldywgZGVzdG9yeT86IGJvb2xlYW4pOiB2b2lkO2ApO1xuICAgICAgICB9XG4gICAgICAgIFxuICAgICAgICBsaW5lcy5wdXNoKCcgICAgfScpO1xuICAgIH1cblxuICAgIGxpbmVzLnB1c2goJ30nKTtcbiAgICBsaW5lcy5wdXNoKCcnKTtcblxuICAgIHJldHVybiBsaW5lcy5qb2luKCdcXG4nKTtcbn1cblxuLy8g5Li75Ye95pWwXG5leHBvcnQgZnVuY3Rpb24gZ2VuZXJhdGVUeXBlcyhjb25maWc6IFR5cGVHZW5Db25maWcpOiB7IHN1Y2Nlc3M6IGJvb2xlYW47IG1lc3NhZ2U6IHN0cmluZyB9IHtcbiAgICB0cnkge1xuICAgICAgICBjb25zb2xlLmxvZygn8J+agCDlvIDlp4vnlJ/miJDnsbvlnovmmKDlsITmlofku7YuLi5cXG4nKTtcblxuICAgICAgICAvLyDmiavmj48gTW9kZWwg55uu5b2VXG4gICAgICAgIGNvbnNvbGUubG9nKGDwn5OCIOaJq+aPjyBNb2RlbCDnm67lvZU6ICR7Y29uZmlnLm1vZGVsRGlyfWApO1xuICAgICAgICBjb25zdCBtb2RlbEZpbGVzID0gc2NhbkRpcmVjdG9yeShjb25maWcubW9kZWxEaXIpO1xuICAgICAgICBjb25zdCBtb2RlbHMgPSBtb2RlbEZpbGVzXG4gICAgICAgICAgICAubWFwKHBhcnNlRmlsZSlcbiAgICAgICAgICAgIC5maWx0ZXIoKGl0ZW0pOiBpdGVtIGlzIFBhcnNlZEl0ZW0gPT4gaXRlbSAhPT0gbnVsbCAmJiBpdGVtLnR5cGUgPT09ICdtb2RlbCcpO1xuICAgICAgICBjb25zb2xlLmxvZyhgICAg5om+5YiwICR7bW9kZWxzLmxlbmd0aH0g5LiqIE1vZGVsXFxuYCk7XG5cbiAgICAgICAgLy8g5omr5o+PIE1hbmFnZXIg55uu5b2VXG4gICAgICAgIGNvbnNvbGUubG9nKGDwn5OCIOaJq+aPjyBNYW5hZ2VyIOebruW9lTogJHtjb25maWcubWFuYWdlckRpcn1gKTtcbiAgICAgICAgY29uc3QgbWFuYWdlckZpbGVzID0gc2NhbkRpcmVjdG9yeShjb25maWcubWFuYWdlckRpcik7XG4gICAgICAgIGNvbnN0IG1hbmFnZXJzID0gbWFuYWdlckZpbGVzXG4gICAgICAgICAgICAubWFwKHBhcnNlRmlsZSlcbiAgICAgICAgICAgIC5maWx0ZXIoKGl0ZW0pOiBpdGVtIGlzIFBhcnNlZEl0ZW0gPT4gaXRlbSAhPT0gbnVsbCAmJiBpdGVtLnR5cGUgPT09ICdtYW5hZ2VyJyk7XG4gICAgICAgIGNvbnNvbGUubG9nKGAgICDmib7liLAgJHttYW5hZ2Vycy5sZW5ndGh9IOS4qiBNYW5hZ2VyXFxuYCk7XG5cbiAgICAgICAgLy8g5omr5o+PIFZpZXcg55uu5b2VXG4gICAgICAgIGNvbnNvbGUubG9nKGDwn5OCIOaJq+aPjyBWaWV3IOebruW9lTogJHtjb25maWcudmlld0Rpcn1gKTtcbiAgICAgICAgY29uc3Qgdmlld0ZpbGVzID0gc2NhbkRpcmVjdG9yeShjb25maWcudmlld0Rpcik7XG4gICAgICAgIGNvbnN0IHZpZXdzID0gdmlld0ZpbGVzXG4gICAgICAgICAgICAubWFwKHBhcnNlRmlsZSlcbiAgICAgICAgICAgIC5maWx0ZXIoKGl0ZW0pOiBpdGVtIGlzIFBhcnNlZEl0ZW0gPT4gaXRlbSAhPT0gbnVsbCAmJiBpdGVtLnR5cGUgPT09ICd2aWV3Jyk7XG4gICAgICAgIGNvbnNvbGUubG9nKGAgICDmib7liLAgJHt2aWV3cy5sZW5ndGh9IOS4qiBWaWV3XFxuYCk7XG5cbiAgICAgICAgaWYgKG1vZGVscy5sZW5ndGggPT09IDAgJiYgbWFuYWdlcnMubGVuZ3RoID09PSAwICYmIHZpZXdzLmxlbmd0aCA9PT0gMCkge1xuICAgICAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgICAgICBzdWNjZXNzOiBmYWxzZSxcbiAgICAgICAgICAgICAgICBtZXNzYWdlOiAn4pqg77iPICDmnKrmib7liLDku7vkvZUgTW9kZWzjgIFNYW5hZ2VyIOaIliBWaWV377yM6Lez6L+H55Sf5oiQJ1xuICAgICAgICAgICAgfTtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIOeUn+aIkOexu+Wei+aYoOWwhFxuICAgICAgICBjb25zdCBjb250ZW50ID0gZ2VuZXJhdGVUeXBlTWFwKG1vZGVscywgbWFuYWdlcnMsIHZpZXdzLCBjb25maWcpO1xuXG4gICAgICAgIC8vIOehruS/nei+k+WHuuebruW9leWtmOWcqFxuICAgICAgICBjb25zdCBvdXRwdXREaXIgPSBwYXRoLmRpcm5hbWUoY29uZmlnLm91dHB1dEZpbGUpO1xuICAgICAgICBpZiAoIWZzLmV4aXN0c1N5bmMob3V0cHV0RGlyKSkge1xuICAgICAgICAgICAgZnMubWtkaXJTeW5jKG91dHB1dERpciwgeyByZWN1cnNpdmU6IHRydWUgfSk7XG4gICAgICAgIH1cblxuICAgICAgICAvLyDlhpnlhaXmlofku7ZcbiAgICAgICAgZnMud3JpdGVGaWxlU3luYyhjb25maWcub3V0cHV0RmlsZSwgY29udGVudCwgJ3V0Zi04Jyk7XG5cbiAgICAgICAgbGV0IG1lc3NhZ2UgPSBg4pyFIOexu+Wei+aYoOWwhOaWh+S7tuW3sueUn+aIkDogJHtjb25maWcub3V0cHV0RmlsZX1cXG5cXG5gO1xuICAgICAgICBtZXNzYWdlICs9ICfwn5OLIOeUn+aIkOeahOaYoOWwhDpcXG4nO1xuICAgICAgICBpZiAobW9kZWxzLmxlbmd0aCA+IDApIHtcbiAgICAgICAgICAgIG1lc3NhZ2UgKz0gJyAgIE1vZGVsczpcXG4nO1xuICAgICAgICAgICAgbW9kZWxzLmZvckVhY2gobSA9PiBtZXNzYWdlICs9IGAgICAgIC0gJHttLmRlY29yYXRvck5hbWV9IOKGkiAke20uY2xhc3NOYW1lfVxcbmApO1xuICAgICAgICB9XG4gICAgICAgIGlmIChtYW5hZ2Vycy5sZW5ndGggPiAwKSB7XG4gICAgICAgICAgICBtZXNzYWdlICs9ICcgICBNYW5hZ2VyczpcXG4nO1xuICAgICAgICAgICAgbWFuYWdlcnMuZm9yRWFjaChtID0+IG1lc3NhZ2UgKz0gYCAgICAgLSAke20uZGVjb3JhdG9yTmFtZX0g4oaSICR7bS5jbGFzc05hbWV9XFxuYCk7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKHZpZXdzLmxlbmd0aCA+IDApIHtcbiAgICAgICAgICAgIG1lc3NhZ2UgKz0gJyAgIFZpZXdzOlxcbic7XG4gICAgICAgICAgICB2aWV3cy5mb3JFYWNoKHYgPT4gbWVzc2FnZSArPSBgICAgICAtICR7di5kZWNvcmF0b3JOYW1lfSDihpIgJHt2LmNsYXNzTmFtZX1cXG5gKTtcbiAgICAgICAgfVxuICAgICAgICBtZXNzYWdlICs9ICdcXG7wn46JIOWujOaIkO+8gSc7XG5cbiAgICAgICAgY29uc29sZS5sb2cobWVzc2FnZSk7XG4gICAgICAgIHJldHVybiB7IHN1Y2Nlc3M6IHRydWUsIG1lc3NhZ2UgfTtcblxuICAgIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgICAgIGNvbnN0IGVycm9yTWVzc2FnZSA9IGDinYwg55Sf5oiQ5aSx6LSlOiAke2Vycm9yIGluc3RhbmNlb2YgRXJyb3IgPyBlcnJvci5tZXNzYWdlIDogU3RyaW5nKGVycm9yKX1gO1xuICAgICAgICBjb25zb2xlLmVycm9yKGVycm9yTWVzc2FnZSk7XG4gICAgICAgIHJldHVybiB7IHN1Y2Nlc3M6IGZhbHNlLCBtZXNzYWdlOiBlcnJvck1lc3NhZ2UgfTtcbiAgICB9XG59XG5cbi8vIOS7jumhueebrumFjee9ruaWh+S7tuivu+WPlumFjee9rlxuZnVuY3Rpb24gbG9hZENvbmZpZ0Zyb21Qcm9qZWN0KHByb2plY3RQYXRoOiBzdHJpbmcpOiBUeXBlR2VuQ29uZmlnIHwgbnVsbCB7XG4gICAgY29uc3QgZGVmYXVsdENvbmZpZyA9IHtcbiAgICAgICAgbW9kZWxEaXI6ICdhc3NldHMvc3JjL2dhbWUvbW9kZWxzJyxcbiAgICAgICAgbWFuYWdlckRpcjogJ2Fzc2V0cy9zcmMvZ2FtZS9tYW5hZ2VycycsXG4gICAgICAgIHZpZXdEaXI6ICdhc3NldHMvc3JjL2dhbWUvZ3VpJyxcbiAgICAgICAgb3V0cHV0RmlsZTogJ2Fzc2V0cy90eXBlcy9hcGktdHlwZS1oaW50cy5kLnRzJyxcbiAgICAgICAgbW9kdWxlSW1wb3J0UGF0aDogJ2R6a2NjLW1mbG93L2NvcmUnXG4gICAgfTtcblxuICAgIC8vIOinhOiMg+WMlumFjee9ru+8muWwhuebuOWvuei3r+W+hOi9rOaNouS4uue7neWvuei3r+W+hFxuICAgIGNvbnN0IG5vcm1hbGl6ZUNvbmZpZyA9IChjb25maWc6IFBhcnRpYWw8VHlwZUdlbkNvbmZpZz4pOiBUeXBlR2VuQ29uZmlnID0+ICh7XG4gICAgICAgIG1vZGVsRGlyOiBwYXRoLnJlc29sdmUocHJvamVjdFBhdGgsIGNvbmZpZy5tb2RlbERpciB8fCBkZWZhdWx0Q29uZmlnLm1vZGVsRGlyKSxcbiAgICAgICAgbWFuYWdlckRpcjogcGF0aC5yZXNvbHZlKHByb2plY3RQYXRoLCBjb25maWcubWFuYWdlckRpciB8fCBkZWZhdWx0Q29uZmlnLm1hbmFnZXJEaXIpLFxuICAgICAgICB2aWV3RGlyOiBwYXRoLnJlc29sdmUocHJvamVjdFBhdGgsIGNvbmZpZy52aWV3RGlyIHx8IGRlZmF1bHRDb25maWcudmlld0RpciksXG4gICAgICAgIG91dHB1dEZpbGU6IHBhdGgucmVzb2x2ZShwcm9qZWN0UGF0aCwgY29uZmlnLm91dHB1dEZpbGUgfHwgZGVmYXVsdENvbmZpZy5vdXRwdXRGaWxlKSxcbiAgICAgICAgbW9kdWxlSW1wb3J0UGF0aDogY29uZmlnLm1vZHVsZUltcG9ydFBhdGggfHwgZGVmYXVsdENvbmZpZy5tb2R1bGVJbXBvcnRQYXRoXG4gICAgfSk7XG5cbiAgICAvLyDku47ljZXni6znmoTphY3nva7mlofku7bor7vlj5ZcbiAgICBjb25zdCBjb25maWdQYXRoID0gcGF0aC5qb2luKHByb2plY3RQYXRoLCAnbWZsb3cuY29uZmlnLmpzb24nKTtcbiAgICBpZiAoZnMuZXhpc3RzU3luYyhjb25maWdQYXRoKSkge1xuICAgICAgICB0cnkge1xuICAgICAgICAgICAgY29uc3QgY29uZmlnID0gSlNPTi5wYXJzZShmcy5yZWFkRmlsZVN5bmMoY29uZmlnUGF0aCwgJ3V0Zi04JykpO1xuICAgICAgICAgICAgcmV0dXJuIG5vcm1hbGl6ZUNvbmZpZyhjb25maWcpO1xuICAgICAgICB9IGNhdGNoIChlcnJvcikge1xuICAgICAgICAgICAgY29uc29sZS53YXJuKCfml6Dms5Xor7vlj5YgbWZsb3cuY29uZmlnLmpzb24g6YWN572uJyk7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICAvLyDkvb/nlKjpu5jorqTphY3nva5cbiAgICByZXR1cm4gbm9ybWFsaXplQ29uZmlnKHt9KTtcbn1cblxuLy8g57yW6L6R5Zmo5omp5bGV5YWl5Y+jXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gb25HZW5lcmF0ZVR5cGVzKCkge1xuICAgIHRyeSB7XG4gICAgICAgIC8vIOiOt+WPlumhueebrui3r+W+hFxuICAgICAgICBjb25zdCBwcm9qZWN0UGF0aCA9IEVkaXRvci5Qcm9qZWN0LnBhdGg7XG4gICAgICAgIGNvbnNvbGUubG9nKCfpobnnm67ot6/lvoQ6JywgcHJvamVjdFBhdGgpO1xuXG4gICAgICAgIC8vIOWKoOi9vemFjee9rlxuICAgICAgICBjb25zdCBjb25maWcgPSBsb2FkQ29uZmlnRnJvbVByb2plY3QocHJvamVjdFBhdGgpO1xuICAgICAgICBpZiAoIWNvbmZpZykge1xuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKCfml6Dms5XliqDovb3phY3nva4nKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGNvbnNvbGUubG9nKCfkvb/nlKjphY3nva46JywgY29uZmlnKTtcblxuICAgICAgICAvLyDnlJ/miJDnsbvlnovmmKDlsIRcbiAgICAgICAgY29uc3QgcmVzdWx0ID0gZ2VuZXJhdGVUeXBlcyhjb25maWcpO1xuXG4gICAgICAgIGlmIChyZXN1bHQuc3VjY2Vzcykge1xuICAgICAgICAgICAgYXdhaXQgRWRpdG9yLkRpYWxvZy5pbmZvKCfnsbvlnovmmKDlsITnlJ/miJDmiJDlip/vvIEnLCB7XG4gICAgICAgICAgICAgICAgZGV0YWlsOiByZXN1bHQubWVzc2FnZSxcbiAgICAgICAgICAgICAgICBidXR0b25zOiBbJ+ehruWumiddXG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGF3YWl0IEVkaXRvci5EaWFsb2cud2Fybign57G75Z6L5pig5bCE55Sf5oiQ5aSx6LSlJywge1xuICAgICAgICAgICAgICAgIGRldGFpbDogcmVzdWx0Lm1lc3NhZ2UsXG4gICAgICAgICAgICAgICAgYnV0dG9uczogWyfnoa7lrponXVxuICAgICAgICAgICAgfSk7XG4gICAgICAgIH1cbiAgICB9IGNhdGNoIChlcnJvcikge1xuICAgICAgICBjb25zb2xlLmVycm9yKCfnlJ/miJDnsbvlnovmmKDlsITlpLHotKU6JywgZXJyb3IpO1xuICAgICAgICBhd2FpdCBFZGl0b3IuRGlhbG9nLmVycm9yKCfnlJ/miJDnsbvlnovmmKDlsITlpLHotKUnLCB7XG4gICAgICAgICAgICBkZXRhaWw6IGVycm9yIGluc3RhbmNlb2YgRXJyb3IgPyBlcnJvci5tZXNzYWdlIDogU3RyaW5nKGVycm9yKSxcbiAgICAgICAgICAgIGJ1dHRvbnM6IFsn56Gu5a6aJ11cbiAgICAgICAgfSk7XG4gICAgfVxufVxuXG4iXX0=