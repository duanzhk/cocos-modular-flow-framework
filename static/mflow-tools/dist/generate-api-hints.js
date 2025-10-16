"use strict";
/**
 * @en Generate global type declarations for the classes decorated with @model(), @manager() or @view()
 * @zh 为被装饰器装饰(@model()、@manager()或@view())的类生成全局类型声明，实现基于泛型约束的类型推断。
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
exports.onGenerateApiHints = exports.generateGlobalTypes = void 0;
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
// 生成全局类型声明代码
function generateGlobalTypeMap(models, managers, views, config) {
    const lines = [];
    // 文件头注释
    lines.push('/**');
    lines.push(' * 自动生成的全局类型声明文件');
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
    // 全局类型声明
    lines.push('declare global {');
    // Model 注册表
    if (models.length > 0) {
        lines.push('    /**');
        lines.push('     * Model 注册表 - 全局类型声明');
        lines.push('     * 用于 getModel<ModelClass>() 的类型推断');
        lines.push('     */');
        lines.push('    interface ModelRegistry {');
        for (const model of models) {
            lines.push(`        ${model.className}: typeof ${model.className};`);
        }
        lines.push('    }');
        lines.push('');
    }
    // Manager 注册表
    if (managers.length > 0) {
        lines.push('    /**');
        lines.push('     * Manager 注册表 - 全局类型声明');
        lines.push('     * 用于 getManager<ManagerClass>() 的类型推断');
        lines.push('     */');
        lines.push('    interface ManagerRegistry {');
        for (const manager of managers) {
            lines.push(`        ${manager.className}: typeof ${manager.className};`);
        }
        lines.push('    }');
        lines.push('');
    }
    // UI 注册表
    if (views.length > 0) {
        lines.push('    /**');
        lines.push('     * UI 注册表 - 全局类型声明');
        lines.push('     * 用于 open<UIClass>() 的类型推断');
        lines.push('     */');
        lines.push('    interface UIRegistry {');
        for (const view of views) {
            lines.push(`        ${view.className}: typeof ${view.className};`);
        }
        lines.push('    }');
        lines.push('');
    }
    lines.push('}');
    lines.push('');
    return lines.join('\n');
}
// 主函数
function generateGlobalTypes(config) {
    try {
        console.log('🚀 开始生成全局类型声明文件...\n');
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
        // 生成全局类型声明
        const content = generateGlobalTypeMap(models, managers, views, config);
        // 确保输出目录存在
        const outputDir = path.dirname(config.outputFile);
        if (!fs.existsSync(outputDir)) {
            fs.mkdirSync(outputDir, { recursive: true });
        }
        // 写入文件
        fs.writeFileSync(config.outputFile, content, 'utf-8');
        let message = `✅ 全局类型声明文件已生成: ${config.outputFile}\n\n`;
        message += '📋 生成的映射:\n';
        if (models.length > 0) {
            message += '   Models:\n';
            models.forEach(m => message += `     - ${m.className} (${m.decoratorName})\n`);
        }
        if (managers.length > 0) {
            message += '   Managers:\n';
            managers.forEach(m => message += `     - ${m.className} (${m.decoratorName})\n`);
        }
        if (views.length > 0) {
            message += '   Views:\n';
            views.forEach(v => message += `     - ${v.className} (${v.decoratorName})\n`);
        }
        message += '\n🎉 完成！现在可以使用泛型语法：';
        message += '\n   mf.core.getManager(ManagerClass)';
        message += '\n   mf.uiManager.open(UIClass)';
        console.log(message);
        return { success: true, message };
    }
    catch (error) {
        const errorMessage = `❌ 生成失败: ${error instanceof Error ? error.message : String(error)}`;
        console.error(errorMessage);
        return { success: false, message: errorMessage };
    }
}
exports.generateGlobalTypes = generateGlobalTypes;
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
async function onGenerateApiHints() {
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
        // 生成全局类型声明
        const result = generateGlobalTypes(config);
        if (result.success) {
            await Editor.Dialog.info('全局类型声明生成成功！', {
                detail: result.message,
                buttons: ['确定']
            });
        }
        else {
            await Editor.Dialog.warn('全局类型声明生成失败', {
                detail: result.message,
                buttons: ['确定']
            });
        }
    }
    catch (error) {
        console.error('生成全局类型声明失败:', error);
        await Editor.Dialog.error('生成全局类型声明失败', {
            detail: error instanceof Error ? error.message : String(error),
            buttons: ['确定']
        });
    }
}
exports.onGenerateApiHints = onGenerateApiHints;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZ2VuZXJhdGUtYXBpLWhpbnRzLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vc291cmNlL2dlbmVyYXRlLWFwaS1oaW50cy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiO0FBQUE7OztHQUdHOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQUVILHVDQUF5QjtBQUN6QiwyQ0FBNkI7QUFtQjdCLGtCQUFrQjtBQUNsQixTQUFTLGFBQWEsQ0FBQyxHQUFXO0lBQzlCLElBQUksQ0FBQyxFQUFFLENBQUMsVUFBVSxDQUFDLEdBQUcsQ0FBQyxFQUFFO1FBQ3JCLE9BQU8sQ0FBQyxJQUFJLENBQUMsY0FBYyxHQUFHLEVBQUUsQ0FBQyxDQUFDO1FBQ2xDLE9BQU8sRUFBRSxDQUFDO0tBQ2I7SUFFRCxNQUFNLEtBQUssR0FBYSxFQUFFLENBQUM7SUFDM0IsTUFBTSxLQUFLLEdBQUcsRUFBRSxDQUFDLFdBQVcsQ0FBQyxHQUFHLENBQUMsQ0FBQztJQUVsQyxLQUFLLE1BQU0sSUFBSSxJQUFJLEtBQUssRUFBRTtRQUN0QixNQUFNLFFBQVEsR0FBRyxJQUFJLENBQUMsSUFBSSxDQUFDLEdBQUcsRUFBRSxJQUFJLENBQUMsQ0FBQztRQUN0QyxNQUFNLElBQUksR0FBRyxFQUFFLENBQUMsUUFBUSxDQUFDLFFBQVEsQ0FBQyxDQUFDO1FBRW5DLElBQUksSUFBSSxDQUFDLFdBQVcsRUFBRSxFQUFFO1lBQ3BCLEtBQUssQ0FBQyxJQUFJLENBQUMsR0FBRyxhQUFhLENBQUMsUUFBUSxDQUFDLENBQUMsQ0FBQztTQUMxQzthQUFNLElBQUksSUFBSSxDQUFDLFFBQVEsQ0FBQyxLQUFLLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxRQUFRLENBQUMsT0FBTyxDQUFDLEVBQUU7WUFDeEQsS0FBSyxDQUFDLElBQUksQ0FBQyxRQUFRLENBQUMsQ0FBQztTQUN4QjtLQUNKO0lBRUQsT0FBTyxLQUFLLENBQUM7QUFDakIsQ0FBQztBQUVELGNBQWM7QUFDZCxTQUFTLFNBQVMsQ0FBQyxRQUFnQjtJQUMvQixNQUFNLE9BQU8sR0FBRyxFQUFFLENBQUMsWUFBWSxDQUFDLFFBQVEsRUFBRSxPQUFPLENBQUMsQ0FBQztJQUNuRCxNQUFNLFFBQVEsR0FBRyxJQUFJLENBQUMsUUFBUSxDQUFDLFFBQVEsRUFBRSxLQUFLLENBQUMsQ0FBQztJQUVoRCwrQkFBK0I7SUFDL0IsTUFBTSxVQUFVLEdBQUcsT0FBTyxDQUFDLEtBQUssQ0FBQyxrQ0FBa0MsQ0FBQyxDQUFDO0lBQ3JFLElBQUksVUFBVSxFQUFFO1FBQ1osT0FBTztZQUNILElBQUksRUFBRSxPQUFPO1lBQ2IsYUFBYSxFQUFFLFVBQVUsQ0FBQyxDQUFDLENBQUM7WUFDNUIsU0FBUyxFQUFFLFFBQVE7WUFDbkIsUUFBUSxFQUFFLFFBQVE7U0FDckIsQ0FBQztLQUNMO0lBRUQsbUNBQW1DO0lBQ25DLE1BQU0sWUFBWSxHQUFHLE9BQU8sQ0FBQyxLQUFLLENBQUMsb0NBQW9DLENBQUMsQ0FBQztJQUN6RSxJQUFJLFlBQVksRUFBRTtRQUNkLE9BQU87WUFDSCxJQUFJLEVBQUUsU0FBUztZQUNmLGFBQWEsRUFBRSxZQUFZLENBQUMsQ0FBQyxDQUFDO1lBQzlCLFNBQVMsRUFBRSxRQUFRO1lBQ25CLFFBQVEsRUFBRSxRQUFRO1NBQ3JCLENBQUM7S0FDTDtJQUVELDZCQUE2QjtJQUM3QixNQUFNLFNBQVMsR0FBRyxPQUFPLENBQUMsS0FBSyxDQUFDLGlDQUFpQyxDQUFDLENBQUM7SUFDbkUsSUFBSSxTQUFTLEVBQUU7UUFDWCxPQUFPO1lBQ0gsSUFBSSxFQUFFLE1BQU07WUFDWixhQUFhLEVBQUUsU0FBUyxDQUFDLENBQUMsQ0FBQztZQUMzQixTQUFTLEVBQUUsUUFBUTtZQUNuQixRQUFRLEVBQUUsUUFBUTtTQUNyQixDQUFDO0tBQ0w7SUFFRCxnQkFBZ0I7SUFDaEIsSUFBSSxPQUFPLENBQUMsUUFBUSxDQUFDLFVBQVUsQ0FBQyxFQUFFO1FBQzlCLE9BQU87WUFDSCxJQUFJLEVBQUUsT0FBTztZQUNiLGFBQWEsRUFBRSxRQUFRO1lBQ3ZCLFNBQVMsRUFBRSxRQUFRO1lBQ25CLFFBQVEsRUFBRSxRQUFRO1NBQ3JCLENBQUM7S0FDTDtJQUVELElBQUksT0FBTyxDQUFDLFFBQVEsQ0FBQyxZQUFZLENBQUMsRUFBRTtRQUNoQyxPQUFPO1lBQ0gsSUFBSSxFQUFFLFNBQVM7WUFDZixhQUFhLEVBQUUsUUFBUTtZQUN2QixTQUFTLEVBQUUsUUFBUTtZQUNuQixRQUFRLEVBQUUsUUFBUTtTQUNyQixDQUFDO0tBQ0w7SUFFRCxJQUFJLE9BQU8sQ0FBQyxRQUFRLENBQUMsU0FBUyxDQUFDLEVBQUU7UUFDN0IsT0FBTztZQUNILElBQUksRUFBRSxNQUFNO1lBQ1osYUFBYSxFQUFFLFFBQVE7WUFDdkIsU0FBUyxFQUFFLFFBQVE7WUFDbkIsUUFBUSxFQUFFLFFBQVE7U0FDckIsQ0FBQztLQUNMO0lBRUQsT0FBTyxJQUFJLENBQUM7QUFDaEIsQ0FBQztBQUVELGFBQWE7QUFDYixTQUFTLHFCQUFxQixDQUFDLE1BQW9CLEVBQUUsUUFBc0IsRUFBRSxLQUFtQixFQUFFLE1BQXFCO0lBQ25ILE1BQU0sS0FBSyxHQUFhLEVBQUUsQ0FBQztJQUUzQixRQUFRO0lBQ1IsS0FBSyxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsQ0FBQztJQUNsQixLQUFLLENBQUMsSUFBSSxDQUFDLGtCQUFrQixDQUFDLENBQUM7SUFDL0IsS0FBSyxDQUFDLElBQUksQ0FBQyxrQkFBa0IsQ0FBQyxDQUFDO0lBQy9CLEtBQUssQ0FBQyxJQUFJLENBQUMsaUZBQWlGLENBQUMsQ0FBQztJQUM5RixLQUFLLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxDQUFDO0lBQ2xCLEtBQUssQ0FBQyxJQUFJLENBQUMsRUFBRSxDQUFDLENBQUM7SUFFZixXQUFXO0lBQ1gsSUFBSSxNQUFNLENBQUMsTUFBTSxHQUFHLENBQUMsRUFBRTtRQUNuQixLQUFLLENBQUMsSUFBSSxDQUFDLGFBQWEsQ0FBQyxDQUFDO1FBQzFCLEtBQUssTUFBTSxLQUFLLElBQUksTUFBTSxFQUFFO1lBQ3hCLE1BQU0sWUFBWSxHQUFHLElBQUksQ0FBQyxRQUFRLENBQzlCLElBQUksQ0FBQyxPQUFPLENBQUMsTUFBTSxDQUFDLFVBQVUsQ0FBQyxFQUMvQixLQUFLLENBQUMsUUFBUSxDQUNqQixDQUFDLE9BQU8sQ0FBQyxLQUFLLEVBQUUsR0FBRyxDQUFDLENBQUMsT0FBTyxDQUFDLEtBQUssRUFBRSxFQUFFLENBQUMsQ0FBQztZQUN6QyxLQUFLLENBQUMsSUFBSSxDQUFDLGlCQUFpQixLQUFLLENBQUMsU0FBUyxZQUFZLFlBQVksSUFBSSxDQUFDLENBQUM7U0FDNUU7UUFDRCxLQUFLLENBQUMsSUFBSSxDQUFDLEVBQUUsQ0FBQyxDQUFDO0tBQ2xCO0lBRUQsYUFBYTtJQUNiLElBQUksUUFBUSxDQUFDLE1BQU0sR0FBRyxDQUFDLEVBQUU7UUFDckIsS0FBSyxDQUFDLElBQUksQ0FBQyxlQUFlLENBQUMsQ0FBQztRQUM1QixLQUFLLE1BQU0sT0FBTyxJQUFJLFFBQVEsRUFBRTtZQUM1QixNQUFNLFlBQVksR0FBRyxJQUFJLENBQUMsUUFBUSxDQUM5QixJQUFJLENBQUMsT0FBTyxDQUFDLE1BQU0sQ0FBQyxVQUFVLENBQUMsRUFDL0IsT0FBTyxDQUFDLFFBQVEsQ0FDbkIsQ0FBQyxPQUFPLENBQUMsS0FBSyxFQUFFLEdBQUcsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxLQUFLLEVBQUUsRUFBRSxDQUFDLENBQUM7WUFDekMsS0FBSyxDQUFDLElBQUksQ0FBQyxpQkFBaUIsT0FBTyxDQUFDLFNBQVMsWUFBWSxZQUFZLElBQUksQ0FBQyxDQUFDO1NBQzlFO1FBQ0QsS0FBSyxDQUFDLElBQUksQ0FBQyxFQUFFLENBQUMsQ0FBQztLQUNsQjtJQUVELFVBQVU7SUFDVixJQUFJLEtBQUssQ0FBQyxNQUFNLEdBQUcsQ0FBQyxFQUFFO1FBQ2xCLEtBQUssQ0FBQyxJQUFJLENBQUMsWUFBWSxDQUFDLENBQUM7UUFDekIsS0FBSyxNQUFNLElBQUksSUFBSSxLQUFLLEVBQUU7WUFDdEIsTUFBTSxZQUFZLEdBQUcsSUFBSSxDQUFDLFFBQVEsQ0FDOUIsSUFBSSxDQUFDLE9BQU8sQ0FBQyxNQUFNLENBQUMsVUFBVSxDQUFDLEVBQy9CLElBQUksQ0FBQyxRQUFRLENBQ2hCLENBQUMsT0FBTyxDQUFDLEtBQUssRUFBRSxHQUFHLENBQUMsQ0FBQyxPQUFPLENBQUMsS0FBSyxFQUFFLEVBQUUsQ0FBQyxDQUFDO1lBQ3pDLEtBQUssQ0FBQyxJQUFJLENBQUMsaUJBQWlCLElBQUksQ0FBQyxTQUFTLFlBQVksWUFBWSxJQUFJLENBQUMsQ0FBQztTQUMzRTtRQUNELEtBQUssQ0FBQyxJQUFJLENBQUMsRUFBRSxDQUFDLENBQUM7S0FDbEI7SUFFRCxTQUFTO0lBQ1QsS0FBSyxDQUFDLElBQUksQ0FBQyxrQkFBa0IsQ0FBQyxDQUFDO0lBRS9CLFlBQVk7SUFDWixJQUFJLE1BQU0sQ0FBQyxNQUFNLEdBQUcsQ0FBQyxFQUFFO1FBQ25CLEtBQUssQ0FBQyxJQUFJLENBQUMsU0FBUyxDQUFDLENBQUM7UUFDdEIsS0FBSyxDQUFDLElBQUksQ0FBQywyQkFBMkIsQ0FBQyxDQUFDO1FBQ3hDLEtBQUssQ0FBQyxJQUFJLENBQUMsd0NBQXdDLENBQUMsQ0FBQztRQUNyRCxLQUFLLENBQUMsSUFBSSxDQUFDLFNBQVMsQ0FBQyxDQUFDO1FBQ3RCLEtBQUssQ0FBQyxJQUFJLENBQUMsK0JBQStCLENBQUMsQ0FBQztRQUM1QyxLQUFLLE1BQU0sS0FBSyxJQUFJLE1BQU0sRUFBRTtZQUN4QixLQUFLLENBQUMsSUFBSSxDQUFDLFdBQVcsS0FBSyxDQUFDLFNBQVMsWUFBWSxLQUFLLENBQUMsU0FBUyxHQUFHLENBQUMsQ0FBQztTQUN4RTtRQUNELEtBQUssQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFDLENBQUM7UUFDcEIsS0FBSyxDQUFDLElBQUksQ0FBQyxFQUFFLENBQUMsQ0FBQztLQUNsQjtJQUVELGNBQWM7SUFDZCxJQUFJLFFBQVEsQ0FBQyxNQUFNLEdBQUcsQ0FBQyxFQUFFO1FBQ3JCLEtBQUssQ0FBQyxJQUFJLENBQUMsU0FBUyxDQUFDLENBQUM7UUFDdEIsS0FBSyxDQUFDLElBQUksQ0FBQyw2QkFBNkIsQ0FBQyxDQUFDO1FBQzFDLEtBQUssQ0FBQyxJQUFJLENBQUMsNENBQTRDLENBQUMsQ0FBQztRQUN6RCxLQUFLLENBQUMsSUFBSSxDQUFDLFNBQVMsQ0FBQyxDQUFDO1FBQ3RCLEtBQUssQ0FBQyxJQUFJLENBQUMsaUNBQWlDLENBQUMsQ0FBQztRQUM5QyxLQUFLLE1BQU0sT0FBTyxJQUFJLFFBQVEsRUFBRTtZQUM1QixLQUFLLENBQUMsSUFBSSxDQUFDLFdBQVcsT0FBTyxDQUFDLFNBQVMsWUFBWSxPQUFPLENBQUMsU0FBUyxHQUFHLENBQUMsQ0FBQztTQUM1RTtRQUNELEtBQUssQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFDLENBQUM7UUFDcEIsS0FBSyxDQUFDLElBQUksQ0FBQyxFQUFFLENBQUMsQ0FBQztLQUNsQjtJQUVELFNBQVM7SUFDVCxJQUFJLEtBQUssQ0FBQyxNQUFNLEdBQUcsQ0FBQyxFQUFFO1FBQ2xCLEtBQUssQ0FBQyxJQUFJLENBQUMsU0FBUyxDQUFDLENBQUM7UUFDdEIsS0FBSyxDQUFDLElBQUksQ0FBQyx3QkFBd0IsQ0FBQyxDQUFDO1FBQ3JDLEtBQUssQ0FBQyxJQUFJLENBQUMsaUNBQWlDLENBQUMsQ0FBQztRQUM5QyxLQUFLLENBQUMsSUFBSSxDQUFDLFNBQVMsQ0FBQyxDQUFDO1FBQ3RCLEtBQUssQ0FBQyxJQUFJLENBQUMsNEJBQTRCLENBQUMsQ0FBQztRQUN6QyxLQUFLLE1BQU0sSUFBSSxJQUFJLEtBQUssRUFBRTtZQUN0QixLQUFLLENBQUMsSUFBSSxDQUFDLFdBQVcsSUFBSSxDQUFDLFNBQVMsWUFBWSxJQUFJLENBQUMsU0FBUyxHQUFHLENBQUMsQ0FBQztTQUN0RTtRQUNELEtBQUssQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFDLENBQUM7UUFDcEIsS0FBSyxDQUFDLElBQUksQ0FBQyxFQUFFLENBQUMsQ0FBQztLQUNsQjtJQUVELEtBQUssQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLENBQUM7SUFDaEIsS0FBSyxDQUFDLElBQUksQ0FBQyxFQUFFLENBQUMsQ0FBQztJQUVmLE9BQU8sS0FBSyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQztBQUM1QixDQUFDO0FBRUQsTUFBTTtBQUNOLFNBQWdCLG1CQUFtQixDQUFDLE1BQXFCO0lBQ3JELElBQUk7UUFDQSxPQUFPLENBQUMsR0FBRyxDQUFDLHNCQUFzQixDQUFDLENBQUM7UUFFcEMsY0FBYztRQUNkLE9BQU8sQ0FBQyxHQUFHLENBQUMsbUJBQW1CLE1BQU0sQ0FBQyxRQUFRLEVBQUUsQ0FBQyxDQUFDO1FBQ2xELE1BQU0sVUFBVSxHQUFHLGFBQWEsQ0FBQyxNQUFNLENBQUMsUUFBUSxDQUFDLENBQUM7UUFDbEQsTUFBTSxNQUFNLEdBQUcsVUFBVTthQUNwQixHQUFHLENBQUMsU0FBUyxDQUFDO2FBQ2QsTUFBTSxDQUFDLENBQUMsSUFBSSxFQUFzQixFQUFFLENBQUMsSUFBSSxLQUFLLElBQUksSUFBSSxJQUFJLENBQUMsSUFBSSxLQUFLLE9BQU8sQ0FBQyxDQUFDO1FBQ2xGLE9BQU8sQ0FBQyxHQUFHLENBQUMsU0FBUyxNQUFNLENBQUMsTUFBTSxZQUFZLENBQUMsQ0FBQztRQUVoRCxnQkFBZ0I7UUFDaEIsT0FBTyxDQUFDLEdBQUcsQ0FBQyxxQkFBcUIsTUFBTSxDQUFDLFVBQVUsRUFBRSxDQUFDLENBQUM7UUFDdEQsTUFBTSxZQUFZLEdBQUcsYUFBYSxDQUFDLE1BQU0sQ0FBQyxVQUFVLENBQUMsQ0FBQztRQUN0RCxNQUFNLFFBQVEsR0FBRyxZQUFZO2FBQ3hCLEdBQUcsQ0FBQyxTQUFTLENBQUM7YUFDZCxNQUFNLENBQUMsQ0FBQyxJQUFJLEVBQXNCLEVBQUUsQ0FBQyxJQUFJLEtBQUssSUFBSSxJQUFJLElBQUksQ0FBQyxJQUFJLEtBQUssU0FBUyxDQUFDLENBQUM7UUFDcEYsT0FBTyxDQUFDLEdBQUcsQ0FBQyxTQUFTLFFBQVEsQ0FBQyxNQUFNLGNBQWMsQ0FBQyxDQUFDO1FBRXBELGFBQWE7UUFDYixPQUFPLENBQUMsR0FBRyxDQUFDLGtCQUFrQixNQUFNLENBQUMsT0FBTyxFQUFFLENBQUMsQ0FBQztRQUNoRCxNQUFNLFNBQVMsR0FBRyxhQUFhLENBQUMsTUFBTSxDQUFDLE9BQU8sQ0FBQyxDQUFDO1FBQ2hELE1BQU0sS0FBSyxHQUFHLFNBQVM7YUFDbEIsR0FBRyxDQUFDLFNBQVMsQ0FBQzthQUNkLE1BQU0sQ0FBQyxDQUFDLElBQUksRUFBc0IsRUFBRSxDQUFDLElBQUksS0FBSyxJQUFJLElBQUksSUFBSSxDQUFDLElBQUksS0FBSyxNQUFNLENBQUMsQ0FBQztRQUNqRixPQUFPLENBQUMsR0FBRyxDQUFDLFNBQVMsS0FBSyxDQUFDLE1BQU0sV0FBVyxDQUFDLENBQUM7UUFFOUMsSUFBSSxNQUFNLENBQUMsTUFBTSxLQUFLLENBQUMsSUFBSSxRQUFRLENBQUMsTUFBTSxLQUFLLENBQUMsSUFBSSxLQUFLLENBQUMsTUFBTSxLQUFLLENBQUMsRUFBRTtZQUNwRSxPQUFPO2dCQUNILE9BQU8sRUFBRSxLQUFLO2dCQUNkLE9BQU8sRUFBRSxxQ0FBcUM7YUFDakQsQ0FBQztTQUNMO1FBRUQsV0FBVztRQUNYLE1BQU0sT0FBTyxHQUFHLHFCQUFxQixDQUFDLE1BQU0sRUFBRSxRQUFRLEVBQUUsS0FBSyxFQUFFLE1BQU0sQ0FBQyxDQUFDO1FBRXZFLFdBQVc7UUFDWCxNQUFNLFNBQVMsR0FBRyxJQUFJLENBQUMsT0FBTyxDQUFDLE1BQU0sQ0FBQyxVQUFVLENBQUMsQ0FBQztRQUNsRCxJQUFJLENBQUMsRUFBRSxDQUFDLFVBQVUsQ0FBQyxTQUFTLENBQUMsRUFBRTtZQUMzQixFQUFFLENBQUMsU0FBUyxDQUFDLFNBQVMsRUFBRSxFQUFFLFNBQVMsRUFBRSxJQUFJLEVBQUUsQ0FBQyxDQUFDO1NBQ2hEO1FBRUQsT0FBTztRQUNQLEVBQUUsQ0FBQyxhQUFhLENBQUMsTUFBTSxDQUFDLFVBQVUsRUFBRSxPQUFPLEVBQUUsT0FBTyxDQUFDLENBQUM7UUFFdEQsSUFBSSxPQUFPLEdBQUcsa0JBQWtCLE1BQU0sQ0FBQyxVQUFVLE1BQU0sQ0FBQztRQUN4RCxPQUFPLElBQUksYUFBYSxDQUFDO1FBQ3pCLElBQUksTUFBTSxDQUFDLE1BQU0sR0FBRyxDQUFDLEVBQUU7WUFDbkIsT0FBTyxJQUFJLGNBQWMsQ0FBQztZQUMxQixNQUFNLENBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsT0FBTyxJQUFJLFVBQVUsQ0FBQyxDQUFDLFNBQVMsS0FBSyxDQUFDLENBQUMsYUFBYSxLQUFLLENBQUMsQ0FBQztTQUNsRjtRQUNELElBQUksUUFBUSxDQUFDLE1BQU0sR0FBRyxDQUFDLEVBQUU7WUFDckIsT0FBTyxJQUFJLGdCQUFnQixDQUFDO1lBQzVCLFFBQVEsQ0FBQyxPQUFPLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxPQUFPLElBQUksVUFBVSxDQUFDLENBQUMsU0FBUyxLQUFLLENBQUMsQ0FBQyxhQUFhLEtBQUssQ0FBQyxDQUFDO1NBQ3BGO1FBQ0QsSUFBSSxLQUFLLENBQUMsTUFBTSxHQUFHLENBQUMsRUFBRTtZQUNsQixPQUFPLElBQUksYUFBYSxDQUFDO1lBQ3pCLEtBQUssQ0FBQyxPQUFPLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxPQUFPLElBQUksVUFBVSxDQUFDLENBQUMsU0FBUyxLQUFLLENBQUMsQ0FBQyxhQUFhLEtBQUssQ0FBQyxDQUFDO1NBQ2pGO1FBQ0QsT0FBTyxJQUFJLHFCQUFxQixDQUFDO1FBQ2pDLE9BQU8sSUFBSSx1Q0FBdUMsQ0FBQztRQUNuRCxPQUFPLElBQUksaUNBQWlDLENBQUM7UUFFN0MsT0FBTyxDQUFDLEdBQUcsQ0FBQyxPQUFPLENBQUMsQ0FBQztRQUNyQixPQUFPLEVBQUUsT0FBTyxFQUFFLElBQUksRUFBRSxPQUFPLEVBQUUsQ0FBQztLQUVyQztJQUFDLE9BQU8sS0FBSyxFQUFFO1FBQ1osTUFBTSxZQUFZLEdBQUcsV0FBVyxLQUFLLFlBQVksS0FBSyxDQUFDLENBQUMsQ0FBQyxLQUFLLENBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQyxNQUFNLENBQUMsS0FBSyxDQUFDLEVBQUUsQ0FBQztRQUN6RixPQUFPLENBQUMsS0FBSyxDQUFDLFlBQVksQ0FBQyxDQUFDO1FBQzVCLE9BQU8sRUFBRSxPQUFPLEVBQUUsS0FBSyxFQUFFLE9BQU8sRUFBRSxZQUFZLEVBQUUsQ0FBQztLQUNwRDtBQUNMLENBQUM7QUF6RUQsa0RBeUVDO0FBRUQsY0FBYztBQUNkLFNBQVMscUJBQXFCLENBQUMsV0FBbUI7SUFDOUMsTUFBTSxhQUFhLEdBQUc7UUFDbEIsUUFBUSxFQUFFLHdCQUF3QjtRQUNsQyxVQUFVLEVBQUUsMEJBQTBCO1FBQ3RDLE9BQU8sRUFBRSxxQkFBcUI7UUFDOUIsVUFBVSxFQUFFLGtDQUFrQztRQUM5QyxnQkFBZ0IsRUFBRSxrQkFBa0I7S0FDdkMsQ0FBQztJQUVGLHFCQUFxQjtJQUNyQixNQUFNLGVBQWUsR0FBRyxDQUFDLE1BQThCLEVBQWlCLEVBQUUsQ0FBQyxDQUFDO1FBQ3hFLFFBQVEsRUFBRSxJQUFJLENBQUMsT0FBTyxDQUFDLFdBQVcsRUFBRSxNQUFNLENBQUMsUUFBUSxJQUFJLGFBQWEsQ0FBQyxRQUFRLENBQUM7UUFDOUUsVUFBVSxFQUFFLElBQUksQ0FBQyxPQUFPLENBQUMsV0FBVyxFQUFFLE1BQU0sQ0FBQyxVQUFVLElBQUksYUFBYSxDQUFDLFVBQVUsQ0FBQztRQUNwRixPQUFPLEVBQUUsSUFBSSxDQUFDLE9BQU8sQ0FBQyxXQUFXLEVBQUUsTUFBTSxDQUFDLE9BQU8sSUFBSSxhQUFhLENBQUMsT0FBTyxDQUFDO1FBQzNFLFVBQVUsRUFBRSxJQUFJLENBQUMsT0FBTyxDQUFDLFdBQVcsRUFBRSxNQUFNLENBQUMsVUFBVSxJQUFJLGFBQWEsQ0FBQyxVQUFVLENBQUM7UUFDcEYsZ0JBQWdCLEVBQUUsTUFBTSxDQUFDLGdCQUFnQixJQUFJLGFBQWEsQ0FBQyxnQkFBZ0I7S0FDOUUsQ0FBQyxDQUFDO0lBRUgsYUFBYTtJQUNiLE1BQU0sVUFBVSxHQUFHLElBQUksQ0FBQyxJQUFJLENBQUMsV0FBVyxFQUFFLG1CQUFtQixDQUFDLENBQUM7SUFDL0QsSUFBSSxFQUFFLENBQUMsVUFBVSxDQUFDLFVBQVUsQ0FBQyxFQUFFO1FBQzNCLElBQUk7WUFDQSxNQUFNLE1BQU0sR0FBRyxJQUFJLENBQUMsS0FBSyxDQUFDLEVBQUUsQ0FBQyxZQUFZLENBQUMsVUFBVSxFQUFFLE9BQU8sQ0FBQyxDQUFDLENBQUM7WUFDaEUsT0FBTyxlQUFlLENBQUMsTUFBTSxDQUFDLENBQUM7U0FDbEM7UUFBQyxPQUFPLEtBQUssRUFBRTtZQUNaLE9BQU8sQ0FBQyxJQUFJLENBQUMsMkJBQTJCLENBQUMsQ0FBQztTQUM3QztLQUNKO0lBRUQsU0FBUztJQUNULE9BQU8sZUFBZSxDQUFDLEVBQUUsQ0FBQyxDQUFDO0FBQy9CLENBQUM7QUFFRCxVQUFVO0FBQ0gsS0FBSyxVQUFVLGtCQUFrQjtJQUNwQyxJQUFJO1FBQ0EsU0FBUztRQUNULE1BQU0sV0FBVyxHQUFHLE1BQU0sQ0FBQyxPQUFPLENBQUMsSUFBSSxDQUFDO1FBQ3hDLE9BQU8sQ0FBQyxHQUFHLENBQUMsT0FBTyxFQUFFLFdBQVcsQ0FBQyxDQUFDO1FBRWxDLE9BQU87UUFDUCxNQUFNLE1BQU0sR0FBRyxxQkFBcUIsQ0FBQyxXQUFXLENBQUMsQ0FBQztRQUNsRCxJQUFJLENBQUMsTUFBTSxFQUFFO1lBQ1QsTUFBTSxJQUFJLEtBQUssQ0FBQyxRQUFRLENBQUMsQ0FBQztTQUM3QjtRQUVELE9BQU8sQ0FBQyxHQUFHLENBQUMsT0FBTyxFQUFFLE1BQU0sQ0FBQyxDQUFDO1FBRTdCLFdBQVc7UUFDWCxNQUFNLE1BQU0sR0FBRyxtQkFBbUIsQ0FBQyxNQUFNLENBQUMsQ0FBQztRQUUzQyxJQUFJLE1BQU0sQ0FBQyxPQUFPLEVBQUU7WUFDaEIsTUFBTSxNQUFNLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxhQUFhLEVBQUU7Z0JBQ3BDLE1BQU0sRUFBRSxNQUFNLENBQUMsT0FBTztnQkFDdEIsT0FBTyxFQUFFLENBQUMsSUFBSSxDQUFDO2FBQ2xCLENBQUMsQ0FBQztTQUNOO2FBQU07WUFDSCxNQUFNLE1BQU0sQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDLFlBQVksRUFBRTtnQkFDbkMsTUFBTSxFQUFFLE1BQU0sQ0FBQyxPQUFPO2dCQUN0QixPQUFPLEVBQUUsQ0FBQyxJQUFJLENBQUM7YUFDbEIsQ0FBQyxDQUFDO1NBQ047S0FDSjtJQUFDLE9BQU8sS0FBSyxFQUFFO1FBQ1osT0FBTyxDQUFDLEtBQUssQ0FBQyxhQUFhLEVBQUUsS0FBSyxDQUFDLENBQUM7UUFDcEMsTUFBTSxNQUFNLENBQUMsTUFBTSxDQUFDLEtBQUssQ0FBQyxZQUFZLEVBQUU7WUFDcEMsTUFBTSxFQUFFLEtBQUssWUFBWSxLQUFLLENBQUMsQ0FBQyxDQUFDLEtBQUssQ0FBQyxPQUFPLENBQUMsQ0FBQyxDQUFDLE1BQU0sQ0FBQyxLQUFLLENBQUM7WUFDOUQsT0FBTyxFQUFFLENBQUMsSUFBSSxDQUFDO1NBQ2xCLENBQUMsQ0FBQztLQUNOO0FBQ0wsQ0FBQztBQW5DRCxnREFtQ0MiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEBlbiBHZW5lcmF0ZSBnbG9iYWwgdHlwZSBkZWNsYXJhdGlvbnMgZm9yIHRoZSBjbGFzc2VzIGRlY29yYXRlZCB3aXRoIEBtb2RlbCgpLCBAbWFuYWdlcigpIG9yIEB2aWV3KClcbiAqIEB6aCDkuLrooqvoo4XppbDlmajoo4XppbAoQG1vZGVsKCnjgIFAbWFuYWdlcigp5oiWQHZpZXcoKSnnmoTnsbvnlJ/miJDlhajlsYDnsbvlnovlo7DmmI7vvIzlrp7njrDln7rkuo7ms5vlnovnuqbmnZ/nmoTnsbvlnovmjqjmlq3jgIJcbiAqL1xuXG5pbXBvcnQgKiBhcyBmcyBmcm9tICdmcyc7XG5pbXBvcnQgKiBhcyBwYXRoIGZyb20gJ3BhdGgnO1xuXG4vLyDphY3nva7mjqXlj6NcbmludGVyZmFjZSBUeXBlR2VuQ29uZmlnIHtcbiAgICBtb2RlbERpcjogc3RyaW5nO1xuICAgIG1hbmFnZXJEaXI6IHN0cmluZztcbiAgICB2aWV3RGlyOiBzdHJpbmc7XG4gICAgb3V0cHV0RmlsZTogc3RyaW5nO1xuICAgIG1vZHVsZUltcG9ydFBhdGg6IHN0cmluZztcbn1cblxuLy8g6Kej5p6Q57uT5p6c5o6l5Y+jXG5pbnRlcmZhY2UgUGFyc2VkSXRlbSB7XG4gICAgdHlwZTogJ21vZGVsJyB8ICdtYW5hZ2VyJyB8ICd2aWV3JztcbiAgICBkZWNvcmF0b3JOYW1lOiBzdHJpbmc7XG4gICAgY2xhc3NOYW1lOiBzdHJpbmc7XG4gICAgZmlsZVBhdGg6IHN0cmluZztcbn1cblxuLy8g5omr5o+P55uu5b2V6I635Y+W5omA5pyJIC50cyDmlofku7ZcbmZ1bmN0aW9uIHNjYW5EaXJlY3RvcnkoZGlyOiBzdHJpbmcpOiBzdHJpbmdbXSB7XG4gICAgaWYgKCFmcy5leGlzdHNTeW5jKGRpcikpIHtcbiAgICAgICAgY29uc29sZS53YXJuKGDimqDvuI8gIOebruW9leS4jeWtmOWcqDogJHtkaXJ9YCk7XG4gICAgICAgIHJldHVybiBbXTtcbiAgICB9XG5cbiAgICBjb25zdCBmaWxlczogc3RyaW5nW10gPSBbXTtcbiAgICBjb25zdCBpdGVtcyA9IGZzLnJlYWRkaXJTeW5jKGRpcik7XG5cbiAgICBmb3IgKGNvbnN0IGl0ZW0gb2YgaXRlbXMpIHtcbiAgICAgICAgY29uc3QgZnVsbFBhdGggPSBwYXRoLmpvaW4oZGlyLCBpdGVtKTtcbiAgICAgICAgY29uc3Qgc3RhdCA9IGZzLnN0YXRTeW5jKGZ1bGxQYXRoKTtcblxuICAgICAgICBpZiAoc3RhdC5pc0RpcmVjdG9yeSgpKSB7XG4gICAgICAgICAgICBmaWxlcy5wdXNoKC4uLnNjYW5EaXJlY3RvcnkoZnVsbFBhdGgpKTtcbiAgICAgICAgfSBlbHNlIGlmIChpdGVtLmVuZHNXaXRoKCcudHMnKSAmJiAhaXRlbS5lbmRzV2l0aCgnLmQudHMnKSkge1xuICAgICAgICAgICAgZmlsZXMucHVzaChmdWxsUGF0aCk7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICByZXR1cm4gZmlsZXM7XG59XG5cbi8vIOino+aekOaWh+S7tuiOt+WPluijhemlsOWZqOS/oeaBr1xuZnVuY3Rpb24gcGFyc2VGaWxlKGZpbGVQYXRoOiBzdHJpbmcpOiBQYXJzZWRJdGVtIHwgbnVsbCB7XG4gICAgY29uc3QgY29udGVudCA9IGZzLnJlYWRGaWxlU3luYyhmaWxlUGF0aCwgJ3V0Zi04Jyk7XG4gICAgY29uc3QgZmlsZU5hbWUgPSBwYXRoLmJhc2VuYW1lKGZpbGVQYXRoLCAnLnRzJyk7XG5cbiAgICAvLyDljLnphY0gQG1vZGVsKCdOYW1lJykg5oiWIEBtb2RlbCgpXG4gICAgY29uc3QgbW9kZWxNYXRjaCA9IGNvbnRlbnQubWF0Y2goL0Btb2RlbFxccypcXChcXHMqWydcIl0oXFx3KylbJ1wiXVxccypcXCkvKTtcbiAgICBpZiAobW9kZWxNYXRjaCkge1xuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgdHlwZTogJ21vZGVsJyxcbiAgICAgICAgICAgIGRlY29yYXRvck5hbWU6IG1vZGVsTWF0Y2hbMV0sXG4gICAgICAgICAgICBjbGFzc05hbWU6IGZpbGVOYW1lLFxuICAgICAgICAgICAgZmlsZVBhdGg6IGZpbGVQYXRoXG4gICAgICAgIH07XG4gICAgfVxuXG4gICAgLy8g5Yy56YWNIEBtYW5hZ2VyKCdOYW1lJykg5oiWIEBtYW5hZ2VyKClcbiAgICBjb25zdCBtYW5hZ2VyTWF0Y2ggPSBjb250ZW50Lm1hdGNoKC9AbWFuYWdlclxccypcXChcXHMqWydcIl0oXFx3KylbJ1wiXVxccypcXCkvKTtcbiAgICBpZiAobWFuYWdlck1hdGNoKSB7XG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICB0eXBlOiAnbWFuYWdlcicsXG4gICAgICAgICAgICBkZWNvcmF0b3JOYW1lOiBtYW5hZ2VyTWF0Y2hbMV0sXG4gICAgICAgICAgICBjbGFzc05hbWU6IGZpbGVOYW1lLFxuICAgICAgICAgICAgZmlsZVBhdGg6IGZpbGVQYXRoXG4gICAgICAgIH07XG4gICAgfVxuXG4gICAgLy8g5Yy56YWNIEB2aWV3KCdOYW1lJykg5oiWIEB2aWV3KClcbiAgICBjb25zdCB2aWV3TWF0Y2ggPSBjb250ZW50Lm1hdGNoKC9Admlld1xccypcXChcXHMqWydcIl0oXFx3KylbJ1wiXVxccypcXCkvKTtcbiAgICBpZiAodmlld01hdGNoKSB7XG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICB0eXBlOiAndmlldycsXG4gICAgICAgICAgICBkZWNvcmF0b3JOYW1lOiB2aWV3TWF0Y2hbMV0sXG4gICAgICAgICAgICBjbGFzc05hbWU6IGZpbGVOYW1lLFxuICAgICAgICAgICAgZmlsZVBhdGg6IGZpbGVQYXRoXG4gICAgICAgIH07XG4gICAgfVxuXG4gICAgLy8g5aaC5p6c5rKh5pyJ5oyH5a6a5ZCN56ew77yM5L2/55So57G75ZCNXG4gICAgaWYgKGNvbnRlbnQuaW5jbHVkZXMoJ0Btb2RlbCgpJykpIHtcbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgIHR5cGU6ICdtb2RlbCcsXG4gICAgICAgICAgICBkZWNvcmF0b3JOYW1lOiBmaWxlTmFtZSxcbiAgICAgICAgICAgIGNsYXNzTmFtZTogZmlsZU5hbWUsXG4gICAgICAgICAgICBmaWxlUGF0aDogZmlsZVBhdGhcbiAgICAgICAgfTtcbiAgICB9XG5cbiAgICBpZiAoY29udGVudC5pbmNsdWRlcygnQG1hbmFnZXIoKScpKSB7XG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICB0eXBlOiAnbWFuYWdlcicsXG4gICAgICAgICAgICBkZWNvcmF0b3JOYW1lOiBmaWxlTmFtZSxcbiAgICAgICAgICAgIGNsYXNzTmFtZTogZmlsZU5hbWUsXG4gICAgICAgICAgICBmaWxlUGF0aDogZmlsZVBhdGhcbiAgICAgICAgfTtcbiAgICB9XG5cbiAgICBpZiAoY29udGVudC5pbmNsdWRlcygnQHZpZXcoKScpKSB7XG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICB0eXBlOiAndmlldycsXG4gICAgICAgICAgICBkZWNvcmF0b3JOYW1lOiBmaWxlTmFtZSxcbiAgICAgICAgICAgIGNsYXNzTmFtZTogZmlsZU5hbWUsXG4gICAgICAgICAgICBmaWxlUGF0aDogZmlsZVBhdGhcbiAgICAgICAgfTtcbiAgICB9XG5cbiAgICByZXR1cm4gbnVsbDtcbn1cblxuLy8g55Sf5oiQ5YWo5bGA57G75Z6L5aOw5piO5Luj56CBXG5mdW5jdGlvbiBnZW5lcmF0ZUdsb2JhbFR5cGVNYXAobW9kZWxzOiBQYXJzZWRJdGVtW10sIG1hbmFnZXJzOiBQYXJzZWRJdGVtW10sIHZpZXdzOiBQYXJzZWRJdGVtW10sIGNvbmZpZzogVHlwZUdlbkNvbmZpZyk6IHN0cmluZyB7XG4gICAgY29uc3QgbGluZXM6IHN0cmluZ1tdID0gW107XG5cbiAgICAvLyDmlofku7blpLTms6jph4pcbiAgICBsaW5lcy5wdXNoKCcvKionKTtcbiAgICBsaW5lcy5wdXNoKCcgKiDoh6rliqjnlJ/miJDnmoTlhajlsYDnsbvlnovlo7DmmI7mlofku7YnKTtcbiAgICBsaW5lcy5wdXNoKCcgKiDimqDvuI8g6K+35Yu/5omL5Yqo5L+u5pS55q2k5paH5Lu277yBJyk7XG4gICAgbGluZXMucHVzaCgnICog6YeN5paw55Sf5oiQ77ya5ZyoIENvY29zIENyZWF0b3Ig57yW6L6R5Zmo5Lit6L+Q6KGMIG1mbG93LXRvb2xzIC0+IEdlbmVyYXRlIEFQSSB0eXBlIGhpbnRzL+eUn+aIkEFQSeexu+Wei+aPkOekuicpO1xuICAgIGxpbmVzLnB1c2goJyAqLycpO1xuICAgIGxpbmVzLnB1c2goJycpO1xuXG4gICAgLy8g5a+85YWlIE1vZGVsXG4gICAgaWYgKG1vZGVscy5sZW5ndGggPiAwKSB7XG4gICAgICAgIGxpbmVzLnB1c2goJy8vIE1vZGVsIOWvvOWFpScpO1xuICAgICAgICBmb3IgKGNvbnN0IG1vZGVsIG9mIG1vZGVscykge1xuICAgICAgICAgICAgY29uc3QgcmVsYXRpdmVQYXRoID0gcGF0aC5yZWxhdGl2ZShcbiAgICAgICAgICAgICAgICBwYXRoLmRpcm5hbWUoY29uZmlnLm91dHB1dEZpbGUpLFxuICAgICAgICAgICAgICAgIG1vZGVsLmZpbGVQYXRoXG4gICAgICAgICAgICApLnJlcGxhY2UoL1xcXFwvZywgJy8nKS5yZXBsYWNlKCcudHMnLCAnJyk7XG4gICAgICAgICAgICBsaW5lcy5wdXNoKGBpbXBvcnQgdHlwZSB7ICR7bW9kZWwuY2xhc3NOYW1lfSB9IGZyb20gJyR7cmVsYXRpdmVQYXRofSc7YCk7XG4gICAgICAgIH1cbiAgICAgICAgbGluZXMucHVzaCgnJyk7XG4gICAgfVxuXG4gICAgLy8g5a+85YWlIE1hbmFnZXJcbiAgICBpZiAobWFuYWdlcnMubGVuZ3RoID4gMCkge1xuICAgICAgICBsaW5lcy5wdXNoKCcvLyBNYW5hZ2VyIOWvvOWFpScpO1xuICAgICAgICBmb3IgKGNvbnN0IG1hbmFnZXIgb2YgbWFuYWdlcnMpIHtcbiAgICAgICAgICAgIGNvbnN0IHJlbGF0aXZlUGF0aCA9IHBhdGgucmVsYXRpdmUoXG4gICAgICAgICAgICAgICAgcGF0aC5kaXJuYW1lKGNvbmZpZy5vdXRwdXRGaWxlKSxcbiAgICAgICAgICAgICAgICBtYW5hZ2VyLmZpbGVQYXRoXG4gICAgICAgICAgICApLnJlcGxhY2UoL1xcXFwvZywgJy8nKS5yZXBsYWNlKCcudHMnLCAnJyk7XG4gICAgICAgICAgICBsaW5lcy5wdXNoKGBpbXBvcnQgdHlwZSB7ICR7bWFuYWdlci5jbGFzc05hbWV9IH0gZnJvbSAnJHtyZWxhdGl2ZVBhdGh9JztgKTtcbiAgICAgICAgfVxuICAgICAgICBsaW5lcy5wdXNoKCcnKTtcbiAgICB9XG5cbiAgICAvLyDlr7zlhaUgVmlld1xuICAgIGlmICh2aWV3cy5sZW5ndGggPiAwKSB7XG4gICAgICAgIGxpbmVzLnB1c2goJy8vIFZpZXcg5a+85YWlJyk7XG4gICAgICAgIGZvciAoY29uc3QgdmlldyBvZiB2aWV3cykge1xuICAgICAgICAgICAgY29uc3QgcmVsYXRpdmVQYXRoID0gcGF0aC5yZWxhdGl2ZShcbiAgICAgICAgICAgICAgICBwYXRoLmRpcm5hbWUoY29uZmlnLm91dHB1dEZpbGUpLFxuICAgICAgICAgICAgICAgIHZpZXcuZmlsZVBhdGhcbiAgICAgICAgICAgICkucmVwbGFjZSgvXFxcXC9nLCAnLycpLnJlcGxhY2UoJy50cycsICcnKTtcbiAgICAgICAgICAgIGxpbmVzLnB1c2goYGltcG9ydCB0eXBlIHsgJHt2aWV3LmNsYXNzTmFtZX0gfSBmcm9tICcke3JlbGF0aXZlUGF0aH0nO2ApO1xuICAgICAgICB9XG4gICAgICAgIGxpbmVzLnB1c2goJycpO1xuICAgIH1cblxuICAgIC8vIOWFqOWxgOexu+Wei+WjsOaYjlxuICAgIGxpbmVzLnB1c2goJ2RlY2xhcmUgZ2xvYmFsIHsnKTtcbiAgICBcbiAgICAvLyBNb2RlbCDms6jlhozooahcbiAgICBpZiAobW9kZWxzLmxlbmd0aCA+IDApIHtcbiAgICAgICAgbGluZXMucHVzaCgnICAgIC8qKicpO1xuICAgICAgICBsaW5lcy5wdXNoKCcgICAgICogTW9kZWwg5rOo5YaM6KGoIC0g5YWo5bGA57G75Z6L5aOw5piOJyk7XG4gICAgICAgIGxpbmVzLnB1c2goJyAgICAgKiDnlKjkuo4gZ2V0TW9kZWw8TW9kZWxDbGFzcz4oKSDnmoTnsbvlnovmjqjmlq0nKTtcbiAgICAgICAgbGluZXMucHVzaCgnICAgICAqLycpO1xuICAgICAgICBsaW5lcy5wdXNoKCcgICAgaW50ZXJmYWNlIE1vZGVsUmVnaXN0cnkgeycpO1xuICAgICAgICBmb3IgKGNvbnN0IG1vZGVsIG9mIG1vZGVscykge1xuICAgICAgICAgICAgbGluZXMucHVzaChgICAgICAgICAke21vZGVsLmNsYXNzTmFtZX06IHR5cGVvZiAke21vZGVsLmNsYXNzTmFtZX07YCk7XG4gICAgICAgIH1cbiAgICAgICAgbGluZXMucHVzaCgnICAgIH0nKTtcbiAgICAgICAgbGluZXMucHVzaCgnJyk7XG4gICAgfVxuXG4gICAgLy8gTWFuYWdlciDms6jlhozooahcbiAgICBpZiAobWFuYWdlcnMubGVuZ3RoID4gMCkge1xuICAgICAgICBsaW5lcy5wdXNoKCcgICAgLyoqJyk7XG4gICAgICAgIGxpbmVzLnB1c2goJyAgICAgKiBNYW5hZ2VyIOazqOWGjOihqCAtIOWFqOWxgOexu+Wei+WjsOaYjicpO1xuICAgICAgICBsaW5lcy5wdXNoKCcgICAgICog55So5LqOIGdldE1hbmFnZXI8TWFuYWdlckNsYXNzPigpIOeahOexu+Wei+aOqOaWrScpO1xuICAgICAgICBsaW5lcy5wdXNoKCcgICAgICovJyk7XG4gICAgICAgIGxpbmVzLnB1c2goJyAgICBpbnRlcmZhY2UgTWFuYWdlclJlZ2lzdHJ5IHsnKTtcbiAgICAgICAgZm9yIChjb25zdCBtYW5hZ2VyIG9mIG1hbmFnZXJzKSB7XG4gICAgICAgICAgICBsaW5lcy5wdXNoKGAgICAgICAgICR7bWFuYWdlci5jbGFzc05hbWV9OiB0eXBlb2YgJHttYW5hZ2VyLmNsYXNzTmFtZX07YCk7XG4gICAgICAgIH1cbiAgICAgICAgbGluZXMucHVzaCgnICAgIH0nKTtcbiAgICAgICAgbGluZXMucHVzaCgnJyk7XG4gICAgfVxuXG4gICAgLy8gVUkg5rOo5YaM6KGoXG4gICAgaWYgKHZpZXdzLmxlbmd0aCA+IDApIHtcbiAgICAgICAgbGluZXMucHVzaCgnICAgIC8qKicpO1xuICAgICAgICBsaW5lcy5wdXNoKCcgICAgICogVUkg5rOo5YaM6KGoIC0g5YWo5bGA57G75Z6L5aOw5piOJyk7XG4gICAgICAgIGxpbmVzLnB1c2goJyAgICAgKiDnlKjkuo4gb3BlbjxVSUNsYXNzPigpIOeahOexu+Wei+aOqOaWrScpO1xuICAgICAgICBsaW5lcy5wdXNoKCcgICAgICovJyk7XG4gICAgICAgIGxpbmVzLnB1c2goJyAgICBpbnRlcmZhY2UgVUlSZWdpc3RyeSB7Jyk7XG4gICAgICAgIGZvciAoY29uc3QgdmlldyBvZiB2aWV3cykge1xuICAgICAgICAgICAgbGluZXMucHVzaChgICAgICAgICAke3ZpZXcuY2xhc3NOYW1lfTogdHlwZW9mICR7dmlldy5jbGFzc05hbWV9O2ApO1xuICAgICAgICB9XG4gICAgICAgIGxpbmVzLnB1c2goJyAgICB9Jyk7XG4gICAgICAgIGxpbmVzLnB1c2goJycpO1xuICAgIH1cblxuICAgIGxpbmVzLnB1c2goJ30nKTtcbiAgICBsaW5lcy5wdXNoKCcnKTtcblxuICAgIHJldHVybiBsaW5lcy5qb2luKCdcXG4nKTtcbn1cblxuLy8g5Li75Ye95pWwXG5leHBvcnQgZnVuY3Rpb24gZ2VuZXJhdGVHbG9iYWxUeXBlcyhjb25maWc6IFR5cGVHZW5Db25maWcpOiB7IHN1Y2Nlc3M6IGJvb2xlYW47IG1lc3NhZ2U6IHN0cmluZyB9IHtcbiAgICB0cnkge1xuICAgICAgICBjb25zb2xlLmxvZygn8J+agCDlvIDlp4vnlJ/miJDlhajlsYDnsbvlnovlo7DmmI7mlofku7YuLi5cXG4nKTtcblxuICAgICAgICAvLyDmiavmj48gTW9kZWwg55uu5b2VXG4gICAgICAgIGNvbnNvbGUubG9nKGDwn5OCIOaJq+aPjyBNb2RlbCDnm67lvZU6ICR7Y29uZmlnLm1vZGVsRGlyfWApO1xuICAgICAgICBjb25zdCBtb2RlbEZpbGVzID0gc2NhbkRpcmVjdG9yeShjb25maWcubW9kZWxEaXIpO1xuICAgICAgICBjb25zdCBtb2RlbHMgPSBtb2RlbEZpbGVzXG4gICAgICAgICAgICAubWFwKHBhcnNlRmlsZSlcbiAgICAgICAgICAgIC5maWx0ZXIoKGl0ZW0pOiBpdGVtIGlzIFBhcnNlZEl0ZW0gPT4gaXRlbSAhPT0gbnVsbCAmJiBpdGVtLnR5cGUgPT09ICdtb2RlbCcpO1xuICAgICAgICBjb25zb2xlLmxvZyhgICAg5om+5YiwICR7bW9kZWxzLmxlbmd0aH0g5LiqIE1vZGVsXFxuYCk7XG5cbiAgICAgICAgLy8g5omr5o+PIE1hbmFnZXIg55uu5b2VXG4gICAgICAgIGNvbnNvbGUubG9nKGDwn5OCIOaJq+aPjyBNYW5hZ2VyIOebruW9lTogJHtjb25maWcubWFuYWdlckRpcn1gKTtcbiAgICAgICAgY29uc3QgbWFuYWdlckZpbGVzID0gc2NhbkRpcmVjdG9yeShjb25maWcubWFuYWdlckRpcik7XG4gICAgICAgIGNvbnN0IG1hbmFnZXJzID0gbWFuYWdlckZpbGVzXG4gICAgICAgICAgICAubWFwKHBhcnNlRmlsZSlcbiAgICAgICAgICAgIC5maWx0ZXIoKGl0ZW0pOiBpdGVtIGlzIFBhcnNlZEl0ZW0gPT4gaXRlbSAhPT0gbnVsbCAmJiBpdGVtLnR5cGUgPT09ICdtYW5hZ2VyJyk7XG4gICAgICAgIGNvbnNvbGUubG9nKGAgICDmib7liLAgJHttYW5hZ2Vycy5sZW5ndGh9IOS4qiBNYW5hZ2VyXFxuYCk7XG5cbiAgICAgICAgLy8g5omr5o+PIFZpZXcg55uu5b2VXG4gICAgICAgIGNvbnNvbGUubG9nKGDwn5OCIOaJq+aPjyBWaWV3IOebruW9lTogJHtjb25maWcudmlld0Rpcn1gKTtcbiAgICAgICAgY29uc3Qgdmlld0ZpbGVzID0gc2NhbkRpcmVjdG9yeShjb25maWcudmlld0Rpcik7XG4gICAgICAgIGNvbnN0IHZpZXdzID0gdmlld0ZpbGVzXG4gICAgICAgICAgICAubWFwKHBhcnNlRmlsZSlcbiAgICAgICAgICAgIC5maWx0ZXIoKGl0ZW0pOiBpdGVtIGlzIFBhcnNlZEl0ZW0gPT4gaXRlbSAhPT0gbnVsbCAmJiBpdGVtLnR5cGUgPT09ICd2aWV3Jyk7XG4gICAgICAgIGNvbnNvbGUubG9nKGAgICDmib7liLAgJHt2aWV3cy5sZW5ndGh9IOS4qiBWaWV3XFxuYCk7XG5cbiAgICAgICAgaWYgKG1vZGVscy5sZW5ndGggPT09IDAgJiYgbWFuYWdlcnMubGVuZ3RoID09PSAwICYmIHZpZXdzLmxlbmd0aCA9PT0gMCkge1xuICAgICAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgICAgICBzdWNjZXNzOiBmYWxzZSxcbiAgICAgICAgICAgICAgICBtZXNzYWdlOiAn4pqg77iPICDmnKrmib7liLDku7vkvZUgTW9kZWzjgIFNYW5hZ2VyIOaIliBWaWV377yM6Lez6L+H55Sf5oiQJ1xuICAgICAgICAgICAgfTtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIOeUn+aIkOWFqOWxgOexu+Wei+WjsOaYjlxuICAgICAgICBjb25zdCBjb250ZW50ID0gZ2VuZXJhdGVHbG9iYWxUeXBlTWFwKG1vZGVscywgbWFuYWdlcnMsIHZpZXdzLCBjb25maWcpO1xuXG4gICAgICAgIC8vIOehruS/nei+k+WHuuebruW9leWtmOWcqFxuICAgICAgICBjb25zdCBvdXRwdXREaXIgPSBwYXRoLmRpcm5hbWUoY29uZmlnLm91dHB1dEZpbGUpO1xuICAgICAgICBpZiAoIWZzLmV4aXN0c1N5bmMob3V0cHV0RGlyKSkge1xuICAgICAgICAgICAgZnMubWtkaXJTeW5jKG91dHB1dERpciwgeyByZWN1cnNpdmU6IHRydWUgfSk7XG4gICAgICAgIH1cblxuICAgICAgICAvLyDlhpnlhaXmlofku7ZcbiAgICAgICAgZnMud3JpdGVGaWxlU3luYyhjb25maWcub3V0cHV0RmlsZSwgY29udGVudCwgJ3V0Zi04Jyk7XG5cbiAgICAgICAgbGV0IG1lc3NhZ2UgPSBg4pyFIOWFqOWxgOexu+Wei+WjsOaYjuaWh+S7tuW3sueUn+aIkDogJHtjb25maWcub3V0cHV0RmlsZX1cXG5cXG5gO1xuICAgICAgICBtZXNzYWdlICs9ICfwn5OLIOeUn+aIkOeahOaYoOWwhDpcXG4nO1xuICAgICAgICBpZiAobW9kZWxzLmxlbmd0aCA+IDApIHtcbiAgICAgICAgICAgIG1lc3NhZ2UgKz0gJyAgIE1vZGVsczpcXG4nO1xuICAgICAgICAgICAgbW9kZWxzLmZvckVhY2gobSA9PiBtZXNzYWdlICs9IGAgICAgIC0gJHttLmNsYXNzTmFtZX0gKCR7bS5kZWNvcmF0b3JOYW1lfSlcXG5gKTtcbiAgICAgICAgfVxuICAgICAgICBpZiAobWFuYWdlcnMubGVuZ3RoID4gMCkge1xuICAgICAgICAgICAgbWVzc2FnZSArPSAnICAgTWFuYWdlcnM6XFxuJztcbiAgICAgICAgICAgIG1hbmFnZXJzLmZvckVhY2gobSA9PiBtZXNzYWdlICs9IGAgICAgIC0gJHttLmNsYXNzTmFtZX0gKCR7bS5kZWNvcmF0b3JOYW1lfSlcXG5gKTtcbiAgICAgICAgfVxuICAgICAgICBpZiAodmlld3MubGVuZ3RoID4gMCkge1xuICAgICAgICAgICAgbWVzc2FnZSArPSAnICAgVmlld3M6XFxuJztcbiAgICAgICAgICAgIHZpZXdzLmZvckVhY2godiA9PiBtZXNzYWdlICs9IGAgICAgIC0gJHt2LmNsYXNzTmFtZX0gKCR7di5kZWNvcmF0b3JOYW1lfSlcXG5gKTtcbiAgICAgICAgfVxuICAgICAgICBtZXNzYWdlICs9ICdcXG7wn46JIOWujOaIkO+8geeOsOWcqOWPr+S7peS9v+eUqOazm+Wei+ivreazle+8mic7XG4gICAgICAgIG1lc3NhZ2UgKz0gJ1xcbiAgIG1mLmNvcmUuZ2V0TWFuYWdlcihNYW5hZ2VyQ2xhc3MpJztcbiAgICAgICAgbWVzc2FnZSArPSAnXFxuICAgbWYudWlNYW5hZ2VyLm9wZW4oVUlDbGFzcyknO1xuXG4gICAgICAgIGNvbnNvbGUubG9nKG1lc3NhZ2UpO1xuICAgICAgICByZXR1cm4geyBzdWNjZXNzOiB0cnVlLCBtZXNzYWdlIH07XG5cbiAgICB9IGNhdGNoIChlcnJvcikge1xuICAgICAgICBjb25zdCBlcnJvck1lc3NhZ2UgPSBg4p2MIOeUn+aIkOWksei0pTogJHtlcnJvciBpbnN0YW5jZW9mIEVycm9yID8gZXJyb3IubWVzc2FnZSA6IFN0cmluZyhlcnJvcil9YDtcbiAgICAgICAgY29uc29sZS5lcnJvcihlcnJvck1lc3NhZ2UpO1xuICAgICAgICByZXR1cm4geyBzdWNjZXNzOiBmYWxzZSwgbWVzc2FnZTogZXJyb3JNZXNzYWdlIH07XG4gICAgfVxufVxuXG4vLyDku47pobnnm67phY3nva7mlofku7bor7vlj5bphY3nva5cbmZ1bmN0aW9uIGxvYWRDb25maWdGcm9tUHJvamVjdChwcm9qZWN0UGF0aDogc3RyaW5nKTogVHlwZUdlbkNvbmZpZyB8IG51bGwge1xuICAgIGNvbnN0IGRlZmF1bHRDb25maWcgPSB7XG4gICAgICAgIG1vZGVsRGlyOiAnYXNzZXRzL3NyYy9nYW1lL21vZGVscycsXG4gICAgICAgIG1hbmFnZXJEaXI6ICdhc3NldHMvc3JjL2dhbWUvbWFuYWdlcnMnLFxuICAgICAgICB2aWV3RGlyOiAnYXNzZXRzL3NyYy9nYW1lL2d1aScsXG4gICAgICAgIG91dHB1dEZpbGU6ICdhc3NldHMvdHlwZXMvYXBpLXR5cGUtaGludHMuZC50cycsXG4gICAgICAgIG1vZHVsZUltcG9ydFBhdGg6ICdkemtjYy1tZmxvdy9jb3JlJ1xuICAgIH07XG5cbiAgICAvLyDop4TojIPljJbphY3nva7vvJrlsIbnm7jlr7not6/lvoTovazmjaLkuLrnu53lr7not6/lvoRcbiAgICBjb25zdCBub3JtYWxpemVDb25maWcgPSAoY29uZmlnOiBQYXJ0aWFsPFR5cGVHZW5Db25maWc+KTogVHlwZUdlbkNvbmZpZyA9PiAoe1xuICAgICAgICBtb2RlbERpcjogcGF0aC5yZXNvbHZlKHByb2plY3RQYXRoLCBjb25maWcubW9kZWxEaXIgfHwgZGVmYXVsdENvbmZpZy5tb2RlbERpciksXG4gICAgICAgIG1hbmFnZXJEaXI6IHBhdGgucmVzb2x2ZShwcm9qZWN0UGF0aCwgY29uZmlnLm1hbmFnZXJEaXIgfHwgZGVmYXVsdENvbmZpZy5tYW5hZ2VyRGlyKSxcbiAgICAgICAgdmlld0RpcjogcGF0aC5yZXNvbHZlKHByb2plY3RQYXRoLCBjb25maWcudmlld0RpciB8fCBkZWZhdWx0Q29uZmlnLnZpZXdEaXIpLFxuICAgICAgICBvdXRwdXRGaWxlOiBwYXRoLnJlc29sdmUocHJvamVjdFBhdGgsIGNvbmZpZy5vdXRwdXRGaWxlIHx8IGRlZmF1bHRDb25maWcub3V0cHV0RmlsZSksXG4gICAgICAgIG1vZHVsZUltcG9ydFBhdGg6IGNvbmZpZy5tb2R1bGVJbXBvcnRQYXRoIHx8IGRlZmF1bHRDb25maWcubW9kdWxlSW1wb3J0UGF0aFxuICAgIH0pO1xuXG4gICAgLy8g5LuO5Y2V54us55qE6YWN572u5paH5Lu26K+75Y+WXG4gICAgY29uc3QgY29uZmlnUGF0aCA9IHBhdGguam9pbihwcm9qZWN0UGF0aCwgJ21mbG93LmNvbmZpZy5qc29uJyk7XG4gICAgaWYgKGZzLmV4aXN0c1N5bmMoY29uZmlnUGF0aCkpIHtcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIGNvbnN0IGNvbmZpZyA9IEpTT04ucGFyc2UoZnMucmVhZEZpbGVTeW5jKGNvbmZpZ1BhdGgsICd1dGYtOCcpKTtcbiAgICAgICAgICAgIHJldHVybiBub3JtYWxpemVDb25maWcoY29uZmlnKTtcbiAgICAgICAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICAgICAgICAgIGNvbnNvbGUud2Fybign5peg5rOV6K+75Y+WIG1mbG93LmNvbmZpZy5qc29uIOmFjee9ricpO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgLy8g5L2/55So6buY6K6k6YWN572uXG4gICAgcmV0dXJuIG5vcm1hbGl6ZUNvbmZpZyh7fSk7XG59XG5cbi8vIOe8lui+keWZqOaJqeWxleWFpeWPo1xuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIG9uR2VuZXJhdGVBcGlIaW50cygpIHtcbiAgICB0cnkge1xuICAgICAgICAvLyDojrflj5bpobnnm67ot6/lvoRcbiAgICAgICAgY29uc3QgcHJvamVjdFBhdGggPSBFZGl0b3IuUHJvamVjdC5wYXRoO1xuICAgICAgICBjb25zb2xlLmxvZygn6aG555uu6Lev5b6EOicsIHByb2plY3RQYXRoKTtcblxuICAgICAgICAvLyDliqDovb3phY3nva5cbiAgICAgICAgY29uc3QgY29uZmlnID0gbG9hZENvbmZpZ0Zyb21Qcm9qZWN0KHByb2plY3RQYXRoKTtcbiAgICAgICAgaWYgKCFjb25maWcpIHtcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcign5peg5rOV5Yqg6L296YWN572uJyk7XG4gICAgICAgIH1cblxuICAgICAgICBjb25zb2xlLmxvZygn5L2/55So6YWN572uOicsIGNvbmZpZyk7XG5cbiAgICAgICAgLy8g55Sf5oiQ5YWo5bGA57G75Z6L5aOw5piOXG4gICAgICAgIGNvbnN0IHJlc3VsdCA9IGdlbmVyYXRlR2xvYmFsVHlwZXMoY29uZmlnKTtcblxuICAgICAgICBpZiAocmVzdWx0LnN1Y2Nlc3MpIHtcbiAgICAgICAgICAgIGF3YWl0IEVkaXRvci5EaWFsb2cuaW5mbygn5YWo5bGA57G75Z6L5aOw5piO55Sf5oiQ5oiQ5Yqf77yBJywge1xuICAgICAgICAgICAgICAgIGRldGFpbDogcmVzdWx0Lm1lc3NhZ2UsXG4gICAgICAgICAgICAgICAgYnV0dG9uczogWyfnoa7lrponXVxuICAgICAgICAgICAgfSk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBhd2FpdCBFZGl0b3IuRGlhbG9nLndhcm4oJ+WFqOWxgOexu+Wei+WjsOaYjueUn+aIkOWksei0pScsIHtcbiAgICAgICAgICAgICAgICBkZXRhaWw6IHJlc3VsdC5tZXNzYWdlLFxuICAgICAgICAgICAgICAgIGJ1dHRvbnM6IFsn56Gu5a6aJ11cbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9XG4gICAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICAgICAgY29uc29sZS5lcnJvcign55Sf5oiQ5YWo5bGA57G75Z6L5aOw5piO5aSx6LSlOicsIGVycm9yKTtcbiAgICAgICAgYXdhaXQgRWRpdG9yLkRpYWxvZy5lcnJvcign55Sf5oiQ5YWo5bGA57G75Z6L5aOw5piO5aSx6LSlJywge1xuICAgICAgICAgICAgZGV0YWlsOiBlcnJvciBpbnN0YW5jZW9mIEVycm9yID8gZXJyb3IubWVzc2FnZSA6IFN0cmluZyhlcnJvciksXG4gICAgICAgICAgICBidXR0b25zOiBbJ+ehruWumiddXG4gICAgICAgIH0pO1xuICAgIH1cbn1cbiJdfQ==