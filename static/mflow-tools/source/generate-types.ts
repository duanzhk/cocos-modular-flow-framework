/**
 * @en Generate type map file for the classes decorated with @model(), @manager() or @view()
 * @zh 为被装饰器装饰(@model()、@manager()或@view())的类生成类型映射文件，实现完整的类型推断支持。
 */

import * as fs from 'fs';
import * as path from 'path';

// 配置接口
interface TypeGenConfig {
    modelDir: string;
    managerDir: string;
    viewDir: string;
    outputFile: string;
    moduleImportPath: string;
}

// 解析结果接口
interface ParsedItem {
    type: 'model' | 'manager' | 'view';
    decoratorName: string;
    className: string;
    filePath: string;
}

// 扫描目录获取所有 .ts 文件
function scanDirectory(dir: string): string[] {
    if (!fs.existsSync(dir)) {
        console.warn(`⚠️  目录不存在: ${dir}`);
        return [];
    }

    const files: string[] = [];
    const items = fs.readdirSync(dir);

    for (const item of items) {
        const fullPath = path.join(dir, item);
        const stat = fs.statSync(fullPath);

        if (stat.isDirectory()) {
            files.push(...scanDirectory(fullPath));
        } else if (item.endsWith('.ts') && !item.endsWith('.d.ts')) {
            files.push(fullPath);
        }
    }

    return files;
}

// 解析文件获取装饰器信息
function parseFile(filePath: string): ParsedItem | null {
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
function generateTypeMap(models: ParsedItem[], managers: ParsedItem[], views: ParsedItem[], config: TypeGenConfig): string {
    const lines: string[] = [];

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
            const relativePath = path.relative(
                path.dirname(config.outputFile),
                model.filePath
            ).replace(/\\/g, '/').replace('.ts', '');
            lines.push(`import type { ${model.className} } from '${relativePath}';`);
        }
        lines.push('');
    }

    // 导入 Manager
    if (managers.length > 0) {
        lines.push('// Manager 导入');
        for (const manager of managers) {
            const relativePath = path.relative(
                path.dirname(config.outputFile),
                manager.filePath
            ).replace(/\\/g, '/').replace('.ts', '');
            lines.push(`import type { ${manager.className} } from '${relativePath}';`);
        }
        lines.push('');
    }

    // 导入 View
    if (views.length > 0) {
        lines.push('// View 导入');
        for (const view of views) {
            const relativePath = path.relative(
                path.dirname(config.outputFile),
                view.filePath
            ).replace(/\\/g, '/').replace('.ts', '');
            lines.push(`import type { ${view.className} } from '${relativePath}';`);
        }
        lines.push('');
    }

    // 导入 Names（用于函数重载）
    const needModelNames = models.length > 0;
    const needManagerNames = managers.length > 0;
    const needViewNames = views.length > 0;
    if (needModelNames || needManagerNames || needViewNames) {
        const imports: string[] = [];
        if (needModelNames) imports.push('ModelNames');
        if (needManagerNames) imports.push('ManagerNames');
        if (needViewNames) imports.push('ViewNames');
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
export function generateTypes(config: TypeGenConfig): { success: boolean; message: string } {
    try {
        console.log('🚀 开始生成类型映射文件...\n');

        // 扫描 Model 目录
        console.log(`📂 扫描 Model 目录: ${config.modelDir}`);
        const modelFiles = scanDirectory(config.modelDir);
        const models = modelFiles
            .map(parseFile)
            .filter((item): item is ParsedItem => item !== null && item.type === 'model');
        console.log(`   找到 ${models.length} 个 Model\n`);

        // 扫描 Manager 目录
        console.log(`📂 扫描 Manager 目录: ${config.managerDir}`);
        const managerFiles = scanDirectory(config.managerDir);
        const managers = managerFiles
            .map(parseFile)
            .filter((item): item is ParsedItem => item !== null && item.type === 'manager');
        console.log(`   找到 ${managers.length} 个 Manager\n`);

        // 扫描 View 目录
        console.log(`📂 扫描 View 目录: ${config.viewDir}`);
        const viewFiles = scanDirectory(config.viewDir);
        const views = viewFiles
            .map(parseFile)
            .filter((item): item is ParsedItem => item !== null && item.type === 'view');
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

    } catch (error) {
        const errorMessage = `❌ 生成失败: ${error instanceof Error ? error.message : String(error)}`;
        console.error(errorMessage);
        return { success: false, message: errorMessage };
    }
}

// 从项目配置文件读取配置
function loadConfigFromProject(projectPath: string): TypeGenConfig | null {
    const defaultConfig = {
        modelDir: 'assets/src/game/models',
        managerDir: 'assets/src/game/managers',
        viewDir: 'assets/src/game/gui',
        outputFile: 'assets/types/api-type-hints.d.ts',
        moduleImportPath: 'dzkcc-mflow/core'
    };

    // 规范化配置：将相对路径转换为绝对路径
    const normalizeConfig = (config: Partial<TypeGenConfig>): TypeGenConfig => ({
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
        } catch (error) {
            console.warn('无法读取 mflow.config.json 配置');
        }
    }

    // 使用默认配置
    return normalizeConfig({});
}

// 编辑器扩展入口
export async function onGenerateTypes() {
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
        } else {
            await Editor.Dialog.warn('类型映射生成失败', {
                detail: result.message,
                buttons: ['确定']
            });
        }
    } catch (error) {
        console.error('生成类型映射失败:', error);
        await Editor.Dialog.error('生成类型映射失败', {
            detail: error instanceof Error ? error.message : String(error),
            buttons: ['确定']
        });
    }
}

