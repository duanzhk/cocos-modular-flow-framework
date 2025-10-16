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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZ2VuZXJhdGUtdHlwZXMuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi9zb3VyY2UvZ2VuZXJhdGUtdHlwZXMudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IjtBQUFBOzs7R0FHRzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFFSCx1Q0FBeUI7QUFDekIsMkNBQTZCO0FBbUI3QixrQkFBa0I7QUFDbEIsU0FBUyxhQUFhLENBQUMsR0FBVztJQUM5QixJQUFJLENBQUMsRUFBRSxDQUFDLFVBQVUsQ0FBQyxHQUFHLENBQUMsRUFBRTtRQUNyQixPQUFPLENBQUMsSUFBSSxDQUFDLGNBQWMsR0FBRyxFQUFFLENBQUMsQ0FBQztRQUNsQyxPQUFPLEVBQUUsQ0FBQztLQUNiO0lBRUQsTUFBTSxLQUFLLEdBQWEsRUFBRSxDQUFDO0lBQzNCLE1BQU0sS0FBSyxHQUFHLEVBQUUsQ0FBQyxXQUFXLENBQUMsR0FBRyxDQUFDLENBQUM7SUFFbEMsS0FBSyxNQUFNLElBQUksSUFBSSxLQUFLLEVBQUU7UUFDdEIsTUFBTSxRQUFRLEdBQUcsSUFBSSxDQUFDLElBQUksQ0FBQyxHQUFHLEVBQUUsSUFBSSxDQUFDLENBQUM7UUFDdEMsTUFBTSxJQUFJLEdBQUcsRUFBRSxDQUFDLFFBQVEsQ0FBQyxRQUFRLENBQUMsQ0FBQztRQUVuQyxJQUFJLElBQUksQ0FBQyxXQUFXLEVBQUUsRUFBRTtZQUNwQixLQUFLLENBQUMsSUFBSSxDQUFDLEdBQUcsYUFBYSxDQUFDLFFBQVEsQ0FBQyxDQUFDLENBQUM7U0FDMUM7YUFBTSxJQUFJLElBQUksQ0FBQyxRQUFRLENBQUMsS0FBSyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsUUFBUSxDQUFDLE9BQU8sQ0FBQyxFQUFFO1lBQ3hELEtBQUssQ0FBQyxJQUFJLENBQUMsUUFBUSxDQUFDLENBQUM7U0FDeEI7S0FDSjtJQUVELE9BQU8sS0FBSyxDQUFDO0FBQ2pCLENBQUM7QUFFRCxjQUFjO0FBQ2QsU0FBUyxTQUFTLENBQUMsUUFB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QztRQUU3QixTQUFTO1FBQ1QsTUFBTSxNQUFNLEdBQUcsYUFBYSxDQUFDLE1BQU0sQ0FBQyxDQUFDO1FBRXJDLElBQUksTUFBTSxDQUFDLE9BQU8sRUFBRTtZQUNoQixNQUFNLE1BQU0sQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDLFdBQVcsRUFBRTtnQkFDbEMsTUFBTSxFQUFFLE1BQU0sQ0FBQyxPQUFPO2dCQUN0QixPQUFPLEVBQUUsQ0FBQyxJQUFJLENBQUM7YUFDbEIsQ0FBQyxDQUFDO1NBQ047YUFBTTtZQUNILE1BQU0sTUFBTSxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsVUFBVSxFQUFFO2dCQUNqQyxNQUFNLEVBQUUsTUFBTSxDQUFDLE9BQU87Z0JBQ3RCLE9BQU8sRUFBRSxDQUFDLElBQUksQ0FBQzthQUNsQixDQUFDLENBQUM7U0FDTjtLQUNKO0lBQUMsT0FBTyxLQUFLLEVBQUU7UUFDWixPQUFPLENBQUMsS0FBSyxDQUFDLFdBQVcsRUFBRSxLQUFLLENBQUMsQ0FBQztRQUNsQyxNQUFNLE1BQU0sQ0FBQyxNQUFNLENBQUMsS0FBSyxDQUFDLFVBQVUsRUFBRTtZQUNsQyxNQUFNLEVBQUUsS0FBSyxZQUFZLEtBQUssQ0FBQyxDQUFDLENBQUMsS0FBSyxDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUMsTUFBTSxDQUFDLEtBQUssQ0FBQztZQUM5RCxPQUFPLEVBQUUsQ0FBQyxJQUFJLENBQUM7U0FDbEIsQ0FBQyxDQUFDO0tBQ047QUFDTCxDQUFDO0FBbkNELDBDQW1DQyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQGVuIEdlbmVyYXRlIHR5cGUgbWFwIGZpbGUgZm9yIHRoZSBjbGFzc2VzIGRlY29yYXRlZCB3aXRoIEBtb2RlbCgpLCBAbWFuYWdlcigpIG9yIEB2aWV3KClcbiAqIEB6aCDkuLrooqvoo4XppbDlmajoo4XppbAoQG1vZGVsKCnjgIFAbWFuYWdlcigp5oiWQHZpZXcoKSnnmoTnsbvnlJ/miJDnsbvlnovmmKDlsITmlofku7bvvIzlrp7njrDlrozmlbTnmoTnsbvlnovmjqjmlq3mlK/mjIHjgIJcbiAqL1xuXG5pbXBvcnQgKiBhcyBmcyBmcm9tICdmcyc7XG5pbXBvcnQgKiBhcyBwYXRoIGZyb20gJ3BhdGgnO1xuXG4vLyDphY3nva7mjqXlj6NcbmludGVyZmFjZSBUeXBlR2VuQ29uZmlnIHtcbiAgICBtb2RlbERpcjogc3RyaW5nO1xuICAgIG1hbmFnZXJEaXI6IHN0cmluZztcbiAgICB2aWV3RGlyOiBzdHJpbmc7XG4gICAgb3V0cHV0RmlsZTogc3RyaW5nO1xuICAgIG1vZHVsZUltcG9ydFBhdGg6IHN0cmluZztcbn1cblxuLy8g6Kej5p6Q57uT5p6c5o6l5Y+jXG5pbnRlcmZhY2UgUGFyc2VkSXRlbSB7XG4gICAgdHlwZTogJ21vZGVsJyB8ICdtYW5hZ2VyJyB8ICd2aWV3JztcbiAgICBkZWNvcmF0b3JOYW1lOiBzdHJpbmc7XG4gICAgY2xhc3NOYW1lOiBzdHJpbmc7XG4gICAgZmlsZVBhdGg6IHN0cmluZztcbn1cblxuLy8g5omr5o+P55uu5b2V6I635Y+W5omA5pyJIC50cyDmlofku7ZcbmZ1bmN0aW9uIHNjYW5EaXJlY3RvcnkoZGlyOiBzdHJpbmcpOiBzdHJpbmdbXSB7XG4gICAgaWYgKCFmcy5leGlzdHNTeW5jKGRpcikpIHtcbiAgICAgICAgY29uc29sZS53YXJuKGDimqDvuI8gIOebruW9leS4jeWtmOWcqDogJHtkaXJ9YCk7XG4gICAgICAgIHJldHVybiBbXTtcbiAgICB9XG5cbiAgICBjb25zdCBmaWxlczogc3RyaW5nW10gPSBbXTtcbiAgICBjb25zdCBpdGVtcyA9IGZzLnJlYWRkaXJTeW5jKGRpcik7XG5cbiAgICBmb3IgKGNvbnN0IGl0ZW0gb2YgaXRlbXMpIHtcbiAgICAgICAgY29uc3QgZnVsbFBhdGggPSBwYXRoLmpvaW4oZGlyLCBpdGVtKTtcbiAgICAgICAgY29uc3Qgc3RhdCA9IGZzLnN0YXRTeW5jKGZ1bGxQYXRoKTtcblxuICAgICAgICBpZiAoc3RhdC5pc0RpcmVjdG9yeSgpKSB7XG4gICAgICAgICAgICBmaWxlcy5wdXNoKC4uLnNjYW5EaXJlY3RvcnkoZnVsbFBhdGgpKTtcbiAgICAgICAgfSBlbHNlIGlmIChpdGVtLmVuZHNXaXRoKCcudHMnKSAmJiAhaXRlbS5lbmRzV2l0aCgnLmQudHMnKSkge1xuICAgICAgICAgICAgZmlsZXMucHVzaChmdWxsUGF0aCk7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICByZXR1cm4gZmlsZXM7XG59XG5cbi8vIOino+aekOaWh+S7tuiOt+WPluijhemlsOWZqOS/oeaBr1xuZnVuY3Rpb24gcGFyc2VGaWxlKGZpbGVQYXRoOiBzdHJpbmcpOiBQYXJzZWRJdGVtIHwgbnVsbCB7XG4gICAgY29uc3QgY29udGVudCA9IGZzLnJlYWRGaWxlU3luYyhmaWxlUGF0aCwgJ3V0Zi04Jyk7XG4gICAgY29uc3QgZmlsZU5hbWUgPSBwYXRoLmJhc2VuYW1lKGZpbGVQYXRoLCAnLnRzJyk7XG5cbiAgICAvLyDljLnphY0gQG1vZGVsKCdOYW1lJykg5oiWIEBtb2RlbCgpXG4gICAgY29uc3QgbW9kZWxNYXRjaCA9IGNvbnRlbnQubWF0Y2goL0Btb2RlbFxccypcXChcXHMqWydcIl0oXFx3KylbJ1wiXVxccypcXCkvKTtcbiAgICBpZiAobW9kZWxNYXRjaCkge1xuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgdHlwZTogJ21vZGVsJyxcbiAgICAgICAgICAgIGRlY29yYXRvck5hbWU6IG1vZGVsTWF0Y2hbMV0sXG4gICAgICAgICAgICBjbGFzc05hbWU6IGZpbGVOYW1lLFxuICAgICAgICAgICAgZmlsZVBhdGg6IGZpbGVQYXRoXG4gICAgICAgIH07XG4gICAgfVxuXG4gICAgLy8g5Yy56YWNIEBtYW5hZ2VyKCdOYW1lJykg5oiWIEBtYW5hZ2VyKClcbiAgICBjb25zdCBtYW5hZ2VyTWF0Y2ggPSBjb250ZW50Lm1hdGNoKC9AbWFuYWdlclxccypcXChcXHMqWydcIl0oXFx3KylbJ1wiXVxccypcXCkvKTtcbiAgICBpZiAobWFuYWdlck1hdGNoKSB7XG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICB0eXBlOiAnbWFuYWdlcicsXG4gICAgICAgICAgICBkZWNvcmF0b3JOYW1lOiBtYW5hZ2VyTWF0Y2hbMV0sXG4gICAgICAgICAgICBjbGFzc05hbWU6IGZpbGVOYW1lLFxuICAgICAgICAgICAgZmlsZVBhdGg6IGZpbGVQYXRoXG4gICAgICAgIH07XG4gICAgfVxuXG4gICAgLy8g5Yy56YWNIEB2aWV3KCdOYW1lJykg5oiWIEB2aWV3KClcbiAgICBjb25zdCB2aWV3TWF0Y2ggPSBjb250ZW50Lm1hdGNoKC9Admlld1xccypcXChcXHMqWydcIl0oXFx3KylbJ1wiXVxccypcXCkvKTtcbiAgICBpZiAodmlld01hdGNoKSB7XG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICB0eXBlOiAndmlldycsXG4gICAgICAgICAgICBkZWNvcmF0b3JOYW1lOiB2aWV3TWF0Y2hbMV0sXG4gICAgICAgICAgICBjbGFzc05hbWU6IGZpbGVOYW1lLFxuICAgICAgICAgICAgZmlsZVBhdGg6IGZpbGVQYXRoXG4gICAgICAgIH07XG4gICAgfVxuXG4gICAgLy8g5aaC5p6c5rKh5pyJ5oyH5a6a5ZCN56ew77yM5L2/55So57G75ZCNXG4gICAgaWYgKGNvbnRlbnQuaW5jbHVkZXMoJ0Btb2RlbCgpJykpIHtcbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgIHR5cGU6ICdtb2RlbCcsXG4gICAgICAgICAgICBkZWNvcmF0b3JOYW1lOiBmaWxlTmFtZSxcbiAgICAgICAgICAgIGNsYXNzTmFtZTogZmlsZU5hbWUsXG4gICAgICAgICAgICBmaWxlUGF0aDogZmlsZVBhdGhcbiAgICAgICAgfTtcbiAgICB9XG5cbiAgICBpZiAoY29udGVudC5pbmNsdWRlcygnQG1hbmFnZXIoKScpKSB7XG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICB0eXBlOiAnbWFuYWdlcicsXG4gICAgICAgICAgICBkZWNvcmF0b3JOYW1lOiBmaWxlTmFtZSxcbiAgICAgICAgICAgIGNsYXNzTmFtZTogZmlsZU5hbWUsXG4gICAgICAgICAgICBmaWxlUGF0aDogZmlsZVBhdGhcbiAgICAgICAgfTtcbiAgICB9XG5cbiAgICBpZiAoY29udGVudC5pbmNsdWRlcygnQHZpZXcoKScpKSB7XG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICB0eXBlOiAndmlldycsXG4gICAgICAgICAgICBkZWNvcmF0b3JOYW1lOiBmaWxlTmFtZSxcbiAgICAgICAgICAgIGNsYXNzTmFtZTogZmlsZU5hbWUsXG4gICAgICAgICAgICBmaWxlUGF0aDogZmlsZVBhdGhcbiAgICAgICAgfTtcbiAgICB9XG5cbiAgICByZXR1cm4gbnVsbDtcbn1cblxuLy8g55Sf5oiQ57G75Z6L5pig5bCE5Luj56CBXG5mdW5jdGlvbiBnZW5lcmF0ZVR5cGVNYXAobW9kZWxzOiBQYXJzZWRJdGVtW10sIG1hbmFnZXJzOiBQYXJzZWRJdGVtW10sIHZpZXdzOiBQYXJzZWRJdGVtW10sIGNvbmZpZzogVHlwZUdlbkNvbmZpZyk6IHN0cmluZyB7XG4gICAgY29uc3QgbGluZXM6IHN0cmluZ1tdID0gW107XG5cbiAgICAvLyDmlofku7blpLTms6jph4pcbiAgICBsaW5lcy5wdXNoKCcvKionKTtcbiAgICBsaW5lcy5wdXNoKCcgKiDoh6rliqjnlJ/miJDnmoTnsbvlnovmmKDlsITmlofku7YnKTtcbiAgICBsaW5lcy5wdXNoKCcgKiDimqDvuI8g6K+35Yu/5omL5Yqo5L+u5pS55q2k5paH5Lu277yBJyk7XG4gICAgbGluZXMucHVzaCgnICog6YeN5paw55Sf5oiQ77ya5ZyoIENvY29zIENyZWF0b3Ig57yW6L6R5Zmo5Lit6L+Q6KGMIG1mbG93LXRvb2xzIC0+IEdlbmVyYXRlIEFQSSB0eXBlIGhpbnRzL+eUn+aIkEFQSeexu+Wei+aPkOekuicpO1xuICAgIGxpbmVzLnB1c2goJyAqLycpO1xuICAgIGxpbmVzLnB1c2goJycpO1xuXG4gICAgLy8g5a+85YWlIE1vZGVsXG4gICAgaWYgKG1vZGVscy5sZW5ndGggPiAwKSB7XG4gICAgICAgIGxpbmVzLnB1c2goJy8vIE1vZGVsIOWvvOWFpScpO1xuICAgICAgICBmb3IgKGNvbnN0IG1vZGVsIG9mIG1vZGVscykge1xuICAgICAgICAgICAgY29uc3QgcmVsYXRpdmVQYXRoID0gcGF0aC5yZWxhdGl2ZShcbiAgICAgICAgICAgICAgICBwYXRoLmRpcm5hbWUoY29uZmlnLm91dHB1dEZpbGUpLFxuICAgICAgICAgICAgICAgIG1vZGVsLmZpbGVQYXRoXG4gICAgICAgICAgICApLnJlcGxhY2UoL1xcXFwvZywgJy8nKS5yZXBsYWNlKCcudHMnLCAnJyk7XG4gICAgICAgICAgICBsaW5lcy5wdXNoKGBpbXBvcnQgdHlwZSB7ICR7bW9kZWwuY2xhc3NOYW1lfSB9IGZyb20gJyR7cmVsYXRpdmVQYXRofSc7YCk7XG4gICAgICAgIH1cbiAgICAgICAgbGluZXMucHVzaCgnJyk7XG4gICAgfVxuXG4gICAgLy8g5a+85YWlIE1hbmFnZXJcbiAgICBpZiAobWFuYWdlcnMubGVuZ3RoID4gMCkge1xuICAgICAgICBsaW5lcy5wdXNoKCcvLyBNYW5hZ2VyIOWvvOWFpScpO1xuICAgICAgICBmb3IgKGNvbnN0IG1hbmFnZXIgb2YgbWFuYWdlcnMpIHtcbiAgICAgICAgICAgIGNvbnN0IHJlbGF0aXZlUGF0aCA9IHBhdGgucmVsYXRpdmUoXG4gICAgICAgICAgICAgICAgcGF0aC5kaXJuYW1lKGNvbmZpZy5vdXRwdXRGaWxlKSxcbiAgICAgICAgICAgICAgICBtYW5hZ2VyLmZpbGVQYXRoXG4gICAgICAgICAgICApLnJlcGxhY2UoL1xcXFwvZywgJy8nKS5yZXBsYWNlKCcudHMnLCAnJyk7XG4gICAgICAgICAgICBsaW5lcy5wdXNoKGBpbXBvcnQgdHlwZSB7ICR7bWFuYWdlci5jbGFzc05hbWV9IH0gZnJvbSAnJHtyZWxhdGl2ZVBhdGh9JztgKTtcbiAgICAgICAgfVxuICAgICAgICBsaW5lcy5wdXNoKCcnKTtcbiAgICB9XG5cbiAgICAvLyDlr7zlhaUgVmlld1xuICAgIGlmICh2aWV3cy5sZW5ndGggPiAwKSB7XG4gICAgICAgIGxpbmVzLnB1c2goJy8vIFZpZXcg5a+85YWlJyk7XG4gICAgICAgIGZvciAoY29uc3QgdmlldyBvZiB2aWV3cykge1xuICAgICAgICAgICAgY29uc3QgcmVsYXRpdmVQYXRoID0gcGF0aC5yZWxhdGl2ZShcbiAgICAgICAgICAgICAgICBwYXRoLmRpcm5hbWUoY29uZmlnLm91dHB1dEZpbGUpLFxuICAgICAgICAgICAgICAgIHZpZXcuZmlsZVBhdGhcbiAgICAgICAgICAgICkucmVwbGFjZSgvXFxcXC9nLCAnLycpLnJlcGxhY2UoJy50cycsICcnKTtcbiAgICAgICAgICAgIGxpbmVzLnB1c2goYGltcG9ydCB0eXBlIHsgJHt2aWV3LmNsYXNzTmFtZX0gfSBmcm9tICcke3JlbGF0aXZlUGF0aH0nO2ApO1xuICAgICAgICB9XG4gICAgICAgIGxpbmVzLnB1c2goJycpO1xuICAgIH1cblxuICAgIC8vIOWvvOWFpSBOYW1lc++8iOeUqOS6juWHveaVsOmHjei9ve+8iVxuICAgIGNvbnN0IG5lZWRNb2RlbE5hbWVzID0gbW9kZWxzLmxlbmd0aCA+IDA7XG4gICAgY29uc3QgbmVlZE1hbmFnZXJOYW1lcyA9IG1hbmFnZXJzLmxlbmd0aCA+IDA7XG4gICAgY29uc3QgbmVlZFZpZXdOYW1lcyA9IHZpZXdzLmxlbmd0aCA+IDA7XG4gICAgaWYgKG5lZWRNb2RlbE5hbWVzIHx8IG5lZWRNYW5hZ2VyTmFtZXMgfHwgbmVlZFZpZXdOYW1lcykge1xuICAgICAgICBjb25zdCBpbXBvcnRzOiBzdHJpbmdbXSA9IFtdO1xuICAgICAgICBpZiAobmVlZE1vZGVsTmFtZXMpIGltcG9ydHMucHVzaCgnTW9kZWxOYW1lcycpO1xuICAgICAgICBpZiAobmVlZE1hbmFnZXJOYW1lcykgaW1wb3J0cy5wdXNoKCdNYW5hZ2VyTmFtZXMnKTtcbiAgICAgICAgaWYgKG5lZWRWaWV3TmFtZXMpIGltcG9ydHMucHVzaCgnVmlld05hbWVzJyk7XG4gICAgICAgIGxpbmVzLnB1c2goYGltcG9ydCB7ICR7aW1wb3J0cy5qb2luKCcsICcpfSB9IGZyb20gJyR7Y29uZmlnLm1vZHVsZUltcG9ydFBhdGh9JztgKTtcbiAgICAgICAgbGluZXMucHVzaCgnJyk7XG4gICAgfVxuXG4gICAgLy8g5aOw5piO5qih5Z2XXG4gICAgbGluZXMucHVzaChgZGVjbGFyZSBtb2R1bGUgJyR7Y29uZmlnLm1vZHVsZUltcG9ydFBhdGh9JyB7YCk7XG5cbiAgICAvLyDmianlsZUgTmFtZXNUeXBlIOaOpeWPo++8jOWwhuavj+S4quWxnuaAp+WumuS5ieS4uuWtl+espuS4suWtl+mdoumHj+exu+Wei1xuICAgIGlmIChtb2RlbHMubGVuZ3RoID4gMCkge1xuICAgICAgICBsaW5lcy5wdXNoKCcgICAgLy8g5omp5bGVIE1vZGVsTmFtZXNUeXBl77yM5bCG5q+P5Liq5bGe5oCn5a6a5LmJ5Li65a2X56ym5Liy5a2X6Z2i6YePJyk7XG4gICAgICAgIGxpbmVzLnB1c2goJyAgICBpbnRlcmZhY2UgTW9kZWxOYW1lc1R5cGUgeycpO1xuICAgICAgICBmb3IgKGNvbnN0IG1vZGVsIG9mIG1vZGVscykge1xuICAgICAgICAgICAgbGluZXMucHVzaChgICAgICAgICByZWFkb25seSAke21vZGVsLmRlY29yYXRvck5hbWV9OiAnJHttb2RlbC5kZWNvcmF0b3JOYW1lfSc7YCk7XG4gICAgICAgIH1cbiAgICAgICAgbGluZXMucHVzaCgnICAgIH0nKTtcbiAgICAgICAgbGluZXMucHVzaCgnJyk7XG4gICAgfVxuXG4gICAgaWYgKG1hbmFnZXJzLmxlbmd0aCA+IDApIHtcbiAgICAgICAgbGluZXMucHVzaCgnICAgIC8vIOaJqeWxlSBNYW5hZ2VyTmFtZXNUeXBl77yM5bCG5q+P5Liq5bGe5oCn5a6a5LmJ5Li65a2X56ym5Liy5a2X6Z2i6YePJyk7XG4gICAgICAgIGxpbmVzLnB1c2goJyAgICBpbnRlcmZhY2UgTWFuYWdlck5hbWVzVHlwZSB7Jyk7XG4gICAgICAgIGZvciAoY29uc3QgbWFuYWdlciBvZiBtYW5hZ2Vycykge1xuICAgICAgICAgICAgbGluZXMucHVzaChgICAgICAgICByZWFkb25seSAke21hbmFnZXIuZGVjb3JhdG9yTmFtZX06ICcke21hbmFnZXIuZGVjb3JhdG9yTmFtZX0nO2ApO1xuICAgICAgICB9XG4gICAgICAgIGxpbmVzLnB1c2goJyAgICB9Jyk7XG4gICAgICAgIGxpbmVzLnB1c2goJycpO1xuICAgIH1cblxuICAgIGlmICh2aWV3cy5sZW5ndGggPiAwKSB7XG4gICAgICAgIGxpbmVzLnB1c2goJyAgICAvLyDmianlsZUgVmlld05hbWVzVHlwZe+8jOWwhuavj+S4quWxnuaAp+WumuS5ieS4uuWtl+espuS4suWtl+mdoumHjycpO1xuICAgICAgICBsaW5lcy5wdXNoKCcgICAgaW50ZXJmYWNlIFZpZXdOYW1lc1R5cGUgeycpO1xuICAgICAgICBmb3IgKGNvbnN0IHZpZXcgb2Ygdmlld3MpIHtcbiAgICAgICAgICAgIGxpbmVzLnB1c2goYCAgICAgICAgcmVhZG9ubHkgJHt2aWV3LmRlY29yYXRvck5hbWV9OiAnJHt2aWV3LmRlY29yYXRvck5hbWV9JztgKTtcbiAgICAgICAgfVxuICAgICAgICBsaW5lcy5wdXNoKCcgICAgfScpO1xuICAgICAgICBsaW5lcy5wdXNoKCcnKTtcbiAgICB9XG5cbiAgICAvLyBJQ29yZSDmjqXlj6PmianlsZXvvIjkvb/nlKjlh73mlbDph43ovb3mj5Dkvpvnsr7noa7nmoTnsbvlnovmjqjmlq3vvIlcbiAgICBpZiAobW9kZWxzLmxlbmd0aCA+IDAgfHwgbWFuYWdlcnMubGVuZ3RoID4gMCkge1xuICAgICAgICBsaW5lcy5wdXNoKCcgICAgLy8g5omp5bGVIElDb3JlIOaOpeWPo++8jOa3u+WKoOeyvuehrueahOexu+Wei+mHjei9vScpO1xuICAgICAgICBsaW5lcy5wdXNoKCcgICAgaW50ZXJmYWNlIElDb3JlIHsnKTtcbiAgICAgICAgXG4gICAgICAgIC8vIOS4uuavj+S4qiBNb2RlbCDmt7vliqAgZ2V0TW9kZWwg6YeN6L29XG4gICAgICAgIGlmIChtb2RlbHMubGVuZ3RoID4gMCkge1xuICAgICAgICAgICAgZm9yIChjb25zdCBtb2RlbCBvZiBtb2RlbHMpIHtcbiAgICAgICAgICAgICAgICBsaW5lcy5wdXNoKGAgICAgICAgIGdldE1vZGVsKG1vZGVsS2V5OiAnJHttb2RlbC5kZWNvcmF0b3JOYW1lfScpOiAke21vZGVsLmNsYXNzTmFtZX07YCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgXG4gICAgICAgIC8vIOS4uuavj+S4qiBNYW5hZ2VyIOa3u+WKoCBnZXRNYW5hZ2VyIOmHjei9vVxuICAgICAgICBpZiAobWFuYWdlcnMubGVuZ3RoID4gMCkge1xuICAgICAgICAgICAgZm9yIChjb25zdCBtYW5hZ2VyIG9mIG1hbmFnZXJzKSB7XG4gICAgICAgICAgICAgICAgbGluZXMucHVzaChgICAgICAgICBnZXRNYW5hZ2VyKG1hbmFnZXJLZXk6ICcke21hbmFnZXIuZGVjb3JhdG9yTmFtZX0nKTogJHttYW5hZ2VyLmNsYXNzTmFtZX07YCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgXG4gICAgICAgIGxpbmVzLnB1c2goJyAgICB9Jyk7XG4gICAgICAgIGxpbmVzLnB1c2goJycpO1xuICAgIH1cblxuICAgIC8vIElVSU1hbmFnZXIg5o6l5Y+j5omp5bGV77yI5Li6IFZpZXcg5o+Q5L6b57G75Z6L5o6o5pat77yJXG4gICAgaWYgKHZpZXdzLmxlbmd0aCA+IDApIHtcbiAgICAgICAgbGluZXMucHVzaCgnICAgIC8vIOaJqeWxlSBJVUlNYW5hZ2VyIOaOpeWPo++8jOa3u+WKoCBWaWV3IOexu+Wei+mHjei9vScpO1xuICAgICAgICBsaW5lcy5wdXNoKCcgICAgaW50ZXJmYWNlIElVSU1hbmFnZXIgeycpO1xuICAgICAgICBcbiAgICAgICAgLy8g5Li65q+P5LiqIFZpZXcg5re75YqgIG9wZW4g6YeN6L29XG4gICAgICAgIGZvciAoY29uc3QgdmlldyBvZiB2aWV3cykge1xuICAgICAgICAgICAgbGluZXMucHVzaChgICAgICAgICBvcGVuKHZpZXdLZXk6ICcke3ZpZXcuZGVjb3JhdG9yTmFtZX0nLCBhcmdzPzogYW55KTogUHJvbWlzZTwke3ZpZXcuY2xhc3NOYW1lfT47YCk7XG4gICAgICAgIH1cbiAgICAgICAgXG4gICAgICAgIC8vIOS4uuavj+S4qiBWaWV3IOa3u+WKoCBvcGVuQW5kUHVzaCDph43ovb1cbiAgICAgICAgZm9yIChjb25zdCB2aWV3IG9mIHZpZXdzKSB7XG4gICAgICAgICAgICBsaW5lcy5wdXNoKGAgICAgICAgIG9wZW5BbmRQdXNoKHZpZXdLZXk6ICcke3ZpZXcuZGVjb3JhdG9yTmFtZX0nLCBncm91cDogc3RyaW5nLCBhcmdzPzogYW55KTogUHJvbWlzZTwke3ZpZXcuY2xhc3NOYW1lfT47YCk7XG4gICAgICAgIH1cbiAgICAgICAgXG4gICAgICAgIGxpbmVzLnB1c2goJyAgICB9Jyk7XG4gICAgfVxuXG4gICAgbGluZXMucHVzaCgnfScpO1xuICAgIGxpbmVzLnB1c2goJycpO1xuXG4gICAgcmV0dXJuIGxpbmVzLmpvaW4oJ1xcbicpO1xufVxuXG4vLyDkuLvlh73mlbBcbmV4cG9ydCBmdW5jdGlvbiBnZW5lcmF0ZVR5cGVzKGNvbmZpZzogVHlwZUdlbkNvbmZpZyk6IHsgc3VjY2VzczogYm9vbGVhbjsgbWVzc2FnZTogc3RyaW5nIH0ge1xuICAgIHRyeSB7XG4gICAgICAgIGNvbnNvbGUubG9nKCfwn5qAIOW8gOWni+eUn+aIkOexu+Wei+aYoOWwhOaWh+S7ti4uLlxcbicpO1xuXG4gICAgICAgIC8vIOaJq+aPjyBNb2RlbCDnm67lvZVcbiAgICAgICAgY29uc29sZS5sb2coYPCfk4Ig5omr5o+PIE1vZGVsIOebruW9lTogJHtjb25maWcubW9kZWxEaXJ9YCk7XG4gICAgICAgIGNvbnN0IG1vZGVsRmlsZXMgPSBzY2FuRGlyZWN0b3J5KGNvbmZpZy5tb2RlbERpcik7XG4gICAgICAgIGNvbnN0IG1vZGVscyA9IG1vZGVsRmlsZXNcbiAgICAgICAgICAgIC5tYXAocGFyc2VGaWxlKVxuICAgICAgICAgICAgLmZpbHRlcigoaXRlbSk6IGl0ZW0gaXMgUGFyc2VkSXRlbSA9PiBpdGVtICE9PSBudWxsICYmIGl0ZW0udHlwZSA9PT0gJ21vZGVsJyk7XG4gICAgICAgIGNvbnNvbGUubG9nKGAgICDmib7liLAgJHttb2RlbHMubGVuZ3RofSDkuKogTW9kZWxcXG5gKTtcblxuICAgICAgICAvLyDmiavmj48gTWFuYWdlciDnm67lvZVcbiAgICAgICAgY29uc29sZS5sb2coYPCfk4Ig5omr5o+PIE1hbmFnZXIg55uu5b2VOiAke2NvbmZpZy5tYW5hZ2VyRGlyfWApO1xuICAgICAgICBjb25zdCBtYW5hZ2VyRmlsZXMgPSBzY2FuRGlyZWN0b3J5KGNvbmZpZy5tYW5hZ2VyRGlyKTtcbiAgICAgICAgY29uc3QgbWFuYWdlcnMgPSBtYW5hZ2VyRmlsZXNcbiAgICAgICAgICAgIC5tYXAocGFyc2VGaWxlKVxuICAgICAgICAgICAgLmZpbHRlcigoaXRlbSk6IGl0ZW0gaXMgUGFyc2VkSXRlbSA9PiBpdGVtICE9PSBudWxsICYmIGl0ZW0udHlwZSA9PT0gJ21hbmFnZXInKTtcbiAgICAgICAgY29uc29sZS5sb2coYCAgIOaJvuWIsCAke21hbmFnZXJzLmxlbmd0aH0g5LiqIE1hbmFnZXJcXG5gKTtcblxuICAgICAgICAvLyDmiavmj48gVmlldyDnm67lvZVcbiAgICAgICAgY29uc29sZS5sb2coYPCfk4Ig5omr5o+PIFZpZXcg55uu5b2VOiAke2NvbmZpZy52aWV3RGlyfWApO1xuICAgICAgICBjb25zdCB2aWV3RmlsZXMgPSBzY2FuRGlyZWN0b3J5KGNvbmZpZy52aWV3RGlyKTtcbiAgICAgICAgY29uc3Qgdmlld3MgPSB2aWV3RmlsZXNcbiAgICAgICAgICAgIC5tYXAocGFyc2VGaWxlKVxuICAgICAgICAgICAgLmZpbHRlcigoaXRlbSk6IGl0ZW0gaXMgUGFyc2VkSXRlbSA9PiBpdGVtICE9PSBudWxsICYmIGl0ZW0udHlwZSA9PT0gJ3ZpZXcnKTtcbiAgICAgICAgY29uc29sZS5sb2coYCAgIOaJvuWIsCAke3ZpZXdzLmxlbmd0aH0g5LiqIFZpZXdcXG5gKTtcblxuICAgICAgICBpZiAobW9kZWxzLmxlbmd0aCA9PT0gMCAmJiBtYW5hZ2Vycy5sZW5ndGggPT09IDAgJiYgdmlld3MubGVuZ3RoID09PSAwKSB7XG4gICAgICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgICAgIHN1Y2Nlc3M6IGZhbHNlLFxuICAgICAgICAgICAgICAgIG1lc3NhZ2U6ICfimqDvuI8gIOacquaJvuWIsOS7u+S9lSBNb2RlbOOAgU1hbmFnZXIg5oiWIFZpZXfvvIzot7Pov4fnlJ/miJAnXG4gICAgICAgICAgICB9O1xuICAgICAgICB9XG5cbiAgICAgICAgLy8g55Sf5oiQ57G75Z6L5pig5bCEXG4gICAgICAgIGNvbnN0IGNvbnRlbnQgPSBnZW5lcmF0ZVR5cGVNYXAobW9kZWxzLCBtYW5hZ2Vycywgdmlld3MsIGNvbmZpZyk7XG5cbiAgICAgICAgLy8g56Gu5L+d6L6T5Ye655uu5b2V5a2Y5ZyoXG4gICAgICAgIGNvbnN0IG91dHB1dERpciA9IHBhdGguZGlybmFtZShjb25maWcub3V0cHV0RmlsZSk7XG4gICAgICAgIGlmICghZnMuZXhpc3RzU3luYyhvdXRwdXREaXIpKSB7XG4gICAgICAgICAgICBmcy5ta2RpclN5bmMob3V0cHV0RGlyLCB7IHJlY3Vyc2l2ZTogdHJ1ZSB9KTtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIOWGmeWFpeaWh+S7tlxuICAgICAgICBmcy53cml0ZUZpbGVTeW5jKGNvbmZpZy5vdXRwdXRGaWxlLCBjb250ZW50LCAndXRmLTgnKTtcblxuICAgICAgICBsZXQgbWVzc2FnZSA9IGDinIUg57G75Z6L5pig5bCE5paH5Lu25bey55Sf5oiQOiAke2NvbmZpZy5vdXRwdXRGaWxlfVxcblxcbmA7XG4gICAgICAgIG1lc3NhZ2UgKz0gJ/Cfk4sg55Sf5oiQ55qE5pig5bCEOlxcbic7XG4gICAgICAgIGlmIChtb2RlbHMubGVuZ3RoID4gMCkge1xuICAgICAgICAgICAgbWVzc2FnZSArPSAnICAgTW9kZWxzOlxcbic7XG4gICAgICAgICAgICBtb2RlbHMuZm9yRWFjaChtID0+IG1lc3NhZ2UgKz0gYCAgICAgLSAke20uZGVjb3JhdG9yTmFtZX0g4oaSICR7bS5jbGFzc05hbWV9XFxuYCk7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKG1hbmFnZXJzLmxlbmd0aCA+IDApIHtcbiAgICAgICAgICAgIG1lc3NhZ2UgKz0gJyAgIE1hbmFnZXJzOlxcbic7XG4gICAgICAgICAgICBtYW5hZ2Vycy5mb3JFYWNoKG0gPT4gbWVzc2FnZSArPSBgICAgICAtICR7bS5kZWNvcmF0b3JOYW1lfSDihpIgJHttLmNsYXNzTmFtZX1cXG5gKTtcbiAgICAgICAgfVxuICAgICAgICBpZiAodmlld3MubGVuZ3RoID4gMCkge1xuICAgICAgICAgICAgbWVzc2FnZSArPSAnICAgVmlld3M6XFxuJztcbiAgICAgICAgICAgIHZpZXdzLmZvckVhY2godiA9PiBtZXNzYWdlICs9IGAgICAgIC0gJHt2LmRlY29yYXRvck5hbWV9IOKGkiAke3YuY2xhc3NOYW1lfVxcbmApO1xuICAgICAgICB9XG4gICAgICAgIG1lc3NhZ2UgKz0gJ1xcbvCfjokg5a6M5oiQ77yBJztcblxuICAgICAgICBjb25zb2xlLmxvZyhtZXNzYWdlKTtcbiAgICAgICAgcmV0dXJuIHsgc3VjY2VzczogdHJ1ZSwgbWVzc2FnZSB9O1xuXG4gICAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICAgICAgY29uc3QgZXJyb3JNZXNzYWdlID0gYOKdjCDnlJ/miJDlpLHotKU6ICR7ZXJyb3IgaW5zdGFuY2VvZiBFcnJvciA/IGVycm9yLm1lc3NhZ2UgOiBTdHJpbmcoZXJyb3IpfWA7XG4gICAgICAgIGNvbnNvbGUuZXJyb3IoZXJyb3JNZXNzYWdlKTtcbiAgICAgICAgcmV0dXJuIHsgc3VjY2VzczogZmFsc2UsIG1lc3NhZ2U6IGVycm9yTWVzc2FnZSB9O1xuICAgIH1cbn1cblxuLy8g5LuO6aG555uu6YWN572u5paH5Lu26K+75Y+W6YWN572uXG5mdW5jdGlvbiBsb2FkQ29uZmlnRnJvbVByb2plY3QocHJvamVjdFBhdGg6IHN0cmluZyk6IFR5cGVHZW5Db25maWcgfCBudWxsIHtcbiAgICBjb25zdCBkZWZhdWx0Q29uZmlnID0ge1xuICAgICAgICBtb2RlbERpcjogJ2Fzc2V0cy9zcmMvZ2FtZS9tb2RlbHMnLFxuICAgICAgICBtYW5hZ2VyRGlyOiAnYXNzZXRzL3NyYy9nYW1lL21hbmFnZXJzJyxcbiAgICAgICAgdmlld0RpcjogJ2Fzc2V0cy9zcmMvZ2FtZS9ndWknLFxuICAgICAgICBvdXRwdXRGaWxlOiAnYXNzZXRzL3R5cGVzL2FwaS10eXBlLWhpbnRzLmQudHMnLFxuICAgICAgICBtb2R1bGVJbXBvcnRQYXRoOiAnZHprY2MtbWZsb3cvY29yZSdcbiAgICB9O1xuXG4gICAgLy8g6KeE6IyD5YyW6YWN572u77ya5bCG55u45a+56Lev5b6E6L2s5o2i5Li657ud5a+56Lev5b6EXG4gICAgY29uc3Qgbm9ybWFsaXplQ29uZmlnID0gKGNvbmZpZzogUGFydGlhbDxUeXBlR2VuQ29uZmlnPik6IFR5cGVHZW5Db25maWcgPT4gKHtcbiAgICAgICAgbW9kZWxEaXI6IHBhdGgucmVzb2x2ZShwcm9qZWN0UGF0aCwgY29uZmlnLm1vZGVsRGlyIHx8IGRlZmF1bHRDb25maWcubW9kZWxEaXIpLFxuICAgICAgICBtYW5hZ2VyRGlyOiBwYXRoLnJlc29sdmUocHJvamVjdFBhdGgsIGNvbmZpZy5tYW5hZ2VyRGlyIHx8IGRlZmF1bHRDb25maWcubWFuYWdlckRpciksXG4gICAgICAgIHZpZXdEaXI6IHBhdGgucmVzb2x2ZShwcm9qZWN0UGF0aCwgY29uZmlnLnZpZXdEaXIgfHwgZGVmYXVsdENvbmZpZy52aWV3RGlyKSxcbiAgICAgICAgb3V0cHV0RmlsZTogcGF0aC5yZXNvbHZlKHByb2plY3RQYXRoLCBjb25maWcub3V0cHV0RmlsZSB8fCBkZWZhdWx0Q29uZmlnLm91dHB1dEZpbGUpLFxuICAgICAgICBtb2R1bGVJbXBvcnRQYXRoOiBjb25maWcubW9kdWxlSW1wb3J0UGF0aCB8fCBkZWZhdWx0Q29uZmlnLm1vZHVsZUltcG9ydFBhdGhcbiAgICB9KTtcblxuICAgIC8vIOS7juWNleeLrOeahOmFjee9ruaWh+S7tuivu+WPllxuICAgIGNvbnN0IGNvbmZpZ1BhdGggPSBwYXRoLmpvaW4ocHJvamVjdFBhdGgsICdtZmxvdy5jb25maWcuanNvbicpO1xuICAgIGlmIChmcy5leGlzdHNTeW5jKGNvbmZpZ1BhdGgpKSB7XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgICBjb25zdCBjb25maWcgPSBKU09OLnBhcnNlKGZzLnJlYWRGaWxlU3luYyhjb25maWdQYXRoLCAndXRmLTgnKSk7XG4gICAgICAgICAgICByZXR1cm4gbm9ybWFsaXplQ29uZmlnKGNvbmZpZyk7XG4gICAgICAgIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgICAgICAgICBjb25zb2xlLndhcm4oJ+aXoOazleivu+WPliBtZmxvdy5jb25maWcuanNvbiDphY3nva4nKTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIC8vIOS9v+eUqOm7mOiupOmFjee9rlxuICAgIHJldHVybiBub3JtYWxpemVDb25maWcoe30pO1xufVxuXG4vLyDnvJbovpHlmajmianlsZXlhaXlj6NcbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBvbkdlbmVyYXRlVHlwZXMoKSB7XG4gICAgdHJ5IHtcbiAgICAgICAgLy8g6I635Y+W6aG555uu6Lev5b6EXG4gICAgICAgIGNvbnN0IHByb2plY3RQYXRoID0gRWRpdG9yLlByb2plY3QucGF0aDtcbiAgICAgICAgY29uc29sZS5sb2coJ+mhueebrui3r+W+hDonLCBwcm9qZWN0UGF0aCk7XG5cbiAgICAgICAgLy8g5Yqg6L296YWN572uXG4gICAgICAgIGNvbnN0IGNvbmZpZyA9IGxvYWRDb25maWdGcm9tUHJvamVjdChwcm9qZWN0UGF0aCk7XG4gICAgICAgIGlmICghY29uZmlnKSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ+aXoOazleWKoOi9vemFjee9ricpO1xuICAgICAgICB9XG5cbiAgICAgICAgY29uc29sZS5sb2coJ+S9v+eUqOmFjee9rjonLCBjb25maWcpO1xuXG4gICAgICAgIC8vIOeUn+aIkOexu+Wei+aYoOWwhFxuICAgICAgICBjb25zdCByZXN1bHQgPSBnZW5lcmF0ZVR5cGVzKGNvbmZpZyk7XG5cbiAgICAgICAgaWYgKHJlc3VsdC5zdWNjZXNzKSB7XG4gICAgICAgICAgICBhd2FpdCBFZGl0b3IuRGlhbG9nLmluZm8oJ+exu+Wei+aYoOWwhOeUn+aIkOaIkOWKn++8gScsIHtcbiAgICAgICAgICAgICAgICBkZXRhaWw6IHJlc3VsdC5tZXNzYWdlLFxuICAgICAgICAgICAgICAgIGJ1dHRvbnM6IFsn56Gu5a6aJ11cbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgYXdhaXQgRWRpdG9yLkRpYWxvZy53YXJuKCfnsbvlnovmmKDlsITnlJ/miJDlpLHotKUnLCB7XG4gICAgICAgICAgICAgICAgZGV0YWlsOiByZXN1bHQubWVzc2FnZSxcbiAgICAgICAgICAgICAgICBidXR0b25zOiBbJ+ehruWumiddXG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfVxuICAgIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgICAgIGNvbnNvbGUuZXJyb3IoJ+eUn+aIkOexu+Wei+aYoOWwhOWksei0pTonLCBlcnJvcik7XG4gICAgICAgIGF3YWl0IEVkaXRvci5EaWFsb2cuZXJyb3IoJ+eUn+aIkOexu+Wei+aYoOWwhOWksei0pScsIHtcbiAgICAgICAgICAgIGRldGFpbDogZXJyb3IgaW5zdGFuY2VvZiBFcnJvciA/IGVycm9yLm1lc3NhZ2UgOiBTdHJpbmcoZXJyb3IpLFxuICAgICAgICAgICAgYnV0dG9uczogWyfnoa7lrponXVxuICAgICAgICB9KTtcbiAgICB9XG59XG5cbiJdfQ==