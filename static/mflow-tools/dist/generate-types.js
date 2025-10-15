"use strict";
/**
 * @en Generate type map file for the classes decorated with @model() or @manager()
 * @zh 为被装饰器装饰(@model()或@manager())的类生成类型映射文件，实现完整的类型推断支持。
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
    return null;
}
// 生成类型映射代码
function generateTypeMap(models, managers, config) {
    const lines = [];
    // 文件头注释
    lines.push('/**');
    lines.push(' * 自动生成的类型映射文件');
    lines.push(' * ⚠️ 请勿手动修改此文件！');
    lines.push(' * 重新生成：在 Cocos Creator 编辑器中运行 mflow-tools -> Generate decorator mapping/生成装饰器映射');
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
    // 导入 Names（用于函数重载）
    const needModelNames = models.length > 0;
    const needManagerNames = managers.length > 0;
    if (needModelNames || needManagerNames) {
        const imports = [];
        if (needModelNames)
            imports.push('ModelNames');
        if (needManagerNames)
            imports.push('ManagerNames');
        lines.push(`import { ${imports.join(', ')} } from '${config.moduleImportPath}';`);
        lines.push('');
    }
    // 声明模块
    lines.push(`declare module '${config.moduleImportPath}' {`);
    // 扩展 NamesType 接口，将每个属性定义为 unique symbol
    if (models.length > 0) {
        lines.push('    // 扩展 ModelNamesType，将每个属性定义为 unique symbol');
        lines.push('    interface ModelNamesType {');
        for (const model of models) {
            lines.push(`        readonly ${model.decoratorName}: unique symbol;`);
        }
        lines.push('    }');
        lines.push('');
    }
    if (managers.length > 0) {
        lines.push('    // 扩展 ManagerNamesType，将每个属性定义为 unique symbol');
        lines.push('    interface ManagerNamesType {');
        for (const manager of managers) {
            lines.push(`        readonly ${manager.decoratorName}: unique symbol;`);
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
                lines.push(`        getModel(modelSymbol: typeof ModelNames.${model.decoratorName}): ${model.className};`);
            }
        }
        // 为每个 Manager 添加 getManager 重载
        if (managers.length > 0) {
            for (const manager of managers) {
                lines.push(`        getManager(managerSymbol: typeof ManagerNames.${manager.decoratorName}): ${manager.className};`);
            }
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
        if (models.length === 0 && managers.length === 0) {
            return {
                success: false,
                message: '⚠️  未找到任何 Model 或 Manager，跳过生成'
            };
        }
        // 生成类型映射
        const content = generateTypeMap(models, managers, config);
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
        modelDir: 'assets/src/models',
        managerDir: 'assets/src/managers',
        outputFile: 'assets/types/manager-model-mapping.d.ts',
        moduleImportPath: 'dzkcc-mflow/core'
    };
    // 规范化配置：将相对路径转换为绝对路径
    const normalizeConfig = (config) => ({
        modelDir: path.resolve(projectPath, config.modelDir || defaultConfig.modelDir),
        managerDir: path.resolve(projectPath, config.managerDir || defaultConfig.managerDir),
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZ2VuZXJhdGUtdHlwZXMuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi9zb3VyY2UvZ2VuZXJhdGUtdHlwZXMudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IjtBQUFBOzs7R0FHRzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFFSCx1Q0FBeUI7QUFDekIsMkNBQTZCO0FBa0I3QixrQkFBa0I7QUFDbEIsU0FBUyxhQUFhLENBQUMsR0FBVztJQUM5QixJQUFJLENBQUMsRUFBRSxDQUFDLFVBQVUsQ0FBQyxHQUFHLENBQUMsRUFBRTtRQUNyQixPQUFPLENBQUMsSUFBSSxDQUFDLGNBQWMsR0FBRyxFQUFFLENBQUMsQ0FBQztRQUNsQyxPQUFPLEVBQUUsQ0FBQztLQUNiO0lBRUQsTUFBTSxLQUFLLEdBQWEsRUFBRSxDQUFDO0lBQzNCLE1BQU0sS0FBSyxHQUFHLEVBQUUsQ0FBQyxXQUFXLENBQUMsR0FBRyxDQUFDLENBQUM7SUFFbEMsS0FBSyxNQUFNLElBQUksSUFBSSxLQUFLLEVBQUU7UUFDdEIsTUFBTSxRQUFRLEdBQUcsSUFBSSxDQUFDLElBQUksQ0FBQyxHQUFHLEVBQUUsSUFBSSxDQUFDLENBQUM7UUFDdEMsTUFBTSxJQUFJLEdBQUcsRUFBRSxDQUFDLFFBQVEsQ0FBQyxRQUFRLENBQUMsQ0FBQztRQUVuQyxJQUFJLElBQUksQ0FBQyxXQUFXLEVBQUUsRUFBRTtZQUNwQixLQUFLLENBQUMsSUFBSSxDQUFDLEdBQUcsYUFBYSxDQUFDLFFBQVEsQ0FBQyxDQUFDLENBQUM7U0FDMUM7YUFBTSxJQUFJLElBQUksQ0FBQyxRQUFRLENBQUMsS0FBSyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsUUFBUSxDQUFDLE9BQU8sQ0FBQyxFQUFFO1lBQ3hELEtBQUssQ0FBQyxJQUFJLENBQUMsUUFBUSxDQUFDLENBQUM7U0FDeEI7S0FDSjtJQUVELE9BQU8sS0FBSyxDQUFDO0FBQ2pCLENBQUM7QUFFRCxjQUFjO0FBQ2QsU0FBUyxTQUFTLENBQUMsUUFB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Ii8qKlxuICogQGVuIEdlbmVyYXRlIHR5cGUgbWFwIGZpbGUgZm9yIHRoZSBjbGFzc2VzIGRlY29yYXRlZCB3aXRoIEBtb2RlbCgpIG9yIEBtYW5hZ2VyKClcbiAqIEB6aCDkuLrooqvoo4XppbDlmajoo4XppbAoQG1vZGVsKCnmiJZAbWFuYWdlcigpKeeahOexu+eUn+aIkOexu+Wei+aYoOWwhOaWh+S7tu+8jOWunueOsOWujOaVtOeahOexu+Wei+aOqOaWreaUr+aMgeOAglxuICovXG5cbmltcG9ydCAqIGFzIGZzIGZyb20gJ2ZzJztcbmltcG9ydCAqIGFzIHBhdGggZnJvbSAncGF0aCc7XG5cbi8vIOmFjee9ruaOpeWPo1xuaW50ZXJmYWNlIFR5cGVHZW5Db25maWcge1xuICAgIG1vZGVsRGlyOiBzdHJpbmc7XG4gICAgbWFuYWdlckRpcjogc3RyaW5nO1xuICAgIG91dHB1dEZpbGU6IHN0cmluZztcbiAgICBtb2R1bGVJbXBvcnRQYXRoOiBzdHJpbmc7XG59XG5cbi8vIOino+aekOe7k+aenOaOpeWPo1xuaW50ZXJmYWNlIFBhcnNlZEl0ZW0ge1xuICAgIHR5cGU6ICdtb2RlbCcgfCAnbWFuYWdlcic7XG4gICAgZGVjb3JhdG9yTmFtZTogc3RyaW5nO1xuICAgIGNsYXNzTmFtZTogc3RyaW5nO1xuICAgIGZpbGVQYXRoOiBzdHJpbmc7XG59XG5cbi8vIOaJq+aPj+ebruW9leiOt+WPluaJgOaciSAudHMg5paH5Lu2XG5mdW5jdGlvbiBzY2FuRGlyZWN0b3J5KGRpcjogc3RyaW5nKTogc3RyaW5nW10ge1xuICAgIGlmICghZnMuZXhpc3RzU3luYyhkaXIpKSB7XG4gICAgICAgIGNvbnNvbGUud2Fybihg4pqg77iPICDnm67lvZXkuI3lrZjlnKg6ICR7ZGlyfWApO1xuICAgICAgICByZXR1cm4gW107XG4gICAgfVxuXG4gICAgY29uc3QgZmlsZXM6IHN0cmluZ1tdID0gW107XG4gICAgY29uc3QgaXRlbXMgPSBmcy5yZWFkZGlyU3luYyhkaXIpO1xuXG4gICAgZm9yIChjb25zdCBpdGVtIG9mIGl0ZW1zKSB7XG4gICAgICAgIGNvbnN0IGZ1bGxQYXRoID0gcGF0aC5qb2luKGRpciwgaXRlbSk7XG4gICAgICAgIGNvbnN0IHN0YXQgPSBmcy5zdGF0U3luYyhmdWxsUGF0aCk7XG5cbiAgICAgICAgaWYgKHN0YXQuaXNEaXJlY3RvcnkoKSkge1xuICAgICAgICAgICAgZmlsZXMucHVzaCguLi5zY2FuRGlyZWN0b3J5KGZ1bGxQYXRoKSk7XG4gICAgICAgIH0gZWxzZSBpZiAoaXRlbS5lbmRzV2l0aCgnLnRzJykgJiYgIWl0ZW0uZW5kc1dpdGgoJy5kLnRzJykpIHtcbiAgICAgICAgICAgIGZpbGVzLnB1c2goZnVsbFBhdGgpO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgcmV0dXJuIGZpbGVzO1xufVxuXG4vLyDop6PmnpDmlofku7bojrflj5boo4XppbDlmajkv6Hmga9cbmZ1bmN0aW9uIHBhcnNlRmlsZShmaWxlUGF0aDogc3RyaW5nKTogUGFyc2VkSXRlbSB8IG51bGwge1xuICAgIGNvbnN0IGNvbnRlbnQgPSBmcy5yZWFkRmlsZVN5bmMoZmlsZVBhdGgsICd1dGYtOCcpO1xuICAgIGNvbnN0IGZpbGVOYW1lID0gcGF0aC5iYXNlbmFtZShmaWxlUGF0aCwgJy50cycpO1xuXG4gICAgLy8g5Yy56YWNIEBtb2RlbCgnTmFtZScpIOaIliBAbW9kZWwoKVxuICAgIGNvbnN0IG1vZGVsTWF0Y2ggPSBjb250ZW50Lm1hdGNoKC9AbW9kZWxcXHMqXFwoXFxzKlsnXCJdKFxcdyspWydcIl1cXHMqXFwpLyk7XG4gICAgaWYgKG1vZGVsTWF0Y2gpIHtcbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgIHR5cGU6ICdtb2RlbCcsXG4gICAgICAgICAgICBkZWNvcmF0b3JOYW1lOiBtb2RlbE1hdGNoWzFdLFxuICAgICAgICAgICAgY2xhc3NOYW1lOiBmaWxlTmFtZSxcbiAgICAgICAgICAgIGZpbGVQYXRoOiBmaWxlUGF0aFxuICAgICAgICB9O1xuICAgIH1cblxuICAgIC8vIOWMuemFjSBAbWFuYWdlcignTmFtZScpIOaIliBAbWFuYWdlcigpXG4gICAgY29uc3QgbWFuYWdlck1hdGNoID0gY29udGVudC5tYXRjaCgvQG1hbmFnZXJcXHMqXFwoXFxzKlsnXCJdKFxcdyspWydcIl1cXHMqXFwpLyk7XG4gICAgaWYgKG1hbmFnZXJNYXRjaCkge1xuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgdHlwZTogJ21hbmFnZXInLFxuICAgICAgICAgICAgZGVjb3JhdG9yTmFtZTogbWFuYWdlck1hdGNoWzFdLFxuICAgICAgICAgICAgY2xhc3NOYW1lOiBmaWxlTmFtZSxcbiAgICAgICAgICAgIGZpbGVQYXRoOiBmaWxlUGF0aFxuICAgICAgICB9O1xuICAgIH1cblxuICAgIC8vIOWmguaenOayoeacieaMh+WumuWQjeensO+8jOS9v+eUqOexu+WQjVxuICAgIGlmIChjb250ZW50LmluY2x1ZGVzKCdAbW9kZWwoKScpKSB7XG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICB0eXBlOiAnbW9kZWwnLFxuICAgICAgICAgICAgZGVjb3JhdG9yTmFtZTogZmlsZU5hbWUsXG4gICAgICAgICAgICBjbGFzc05hbWU6IGZpbGVOYW1lLFxuICAgICAgICAgICAgZmlsZVBhdGg6IGZpbGVQYXRoXG4gICAgICAgIH07XG4gICAgfVxuXG4gICAgaWYgKGNvbnRlbnQuaW5jbHVkZXMoJ0BtYW5hZ2VyKCknKSkge1xuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgdHlwZTogJ21hbmFnZXInLFxuICAgICAgICAgICAgZGVjb3JhdG9yTmFtZTogZmlsZU5hbWUsXG4gICAgICAgICAgICBjbGFzc05hbWU6IGZpbGVOYW1lLFxuICAgICAgICAgICAgZmlsZVBhdGg6IGZpbGVQYXRoXG4gICAgICAgIH07XG4gICAgfVxuXG4gICAgcmV0dXJuIG51bGw7XG59XG5cbi8vIOeUn+aIkOexu+Wei+aYoOWwhOS7o+eggVxuZnVuY3Rpb24gZ2VuZXJhdGVUeXBlTWFwKG1vZGVsczogUGFyc2VkSXRlbVtdLCBtYW5hZ2VyczogUGFyc2VkSXRlbVtdLCBjb25maWc6IFR5cGVHZW5Db25maWcpOiBzdHJpbmcge1xuICAgIGNvbnN0IGxpbmVzOiBzdHJpbmdbXSA9IFtdO1xuXG4gICAgLy8g5paH5Lu25aS05rOo6YeKXG4gICAgbGluZXMucHVzaCgnLyoqJyk7XG4gICAgbGluZXMucHVzaCgnICog6Ieq5Yqo55Sf5oiQ55qE57G75Z6L5pig5bCE5paH5Lu2Jyk7XG4gICAgbGluZXMucHVzaCgnICog4pqg77iPIOivt+WLv+aJi+WKqOS/ruaUueatpOaWh+S7tu+8gScpO1xuICAgIGxpbmVzLnB1c2goJyAqIOmHjeaWsOeUn+aIkO+8muWcqCBDb2NvcyBDcmVhdG9yIOe8lui+keWZqOS4rei/kOihjCBtZmxvdy10b29scyAtPiBHZW5lcmF0ZSBkZWNvcmF0b3IgbWFwcGluZy/nlJ/miJDoo4XppbDlmajmmKDlsIQnKTtcbiAgICBsaW5lcy5wdXNoKCcgKi8nKTtcbiAgICBsaW5lcy5wdXNoKCcnKTtcblxuICAgIC8vIOWvvOWFpSBNb2RlbFxuICAgIGlmIChtb2RlbHMubGVuZ3RoID4gMCkge1xuICAgICAgICBsaW5lcy5wdXNoKCcvLyBNb2RlbCDlr7zlhaUnKTtcbiAgICAgICAgZm9yIChjb25zdCBtb2RlbCBvZiBtb2RlbHMpIHtcbiAgICAgICAgICAgIGNvbnN0IHJlbGF0aXZlUGF0aCA9IHBhdGgucmVsYXRpdmUoXG4gICAgICAgICAgICAgICAgcGF0aC5kaXJuYW1lKGNvbmZpZy5vdXRwdXRGaWxlKSxcbiAgICAgICAgICAgICAgICBtb2RlbC5maWxlUGF0aFxuICAgICAgICAgICAgKS5yZXBsYWNlKC9cXFxcL2csICcvJykucmVwbGFjZSgnLnRzJywgJycpO1xuICAgICAgICAgICAgbGluZXMucHVzaChgaW1wb3J0IHR5cGUgeyAke21vZGVsLmNsYXNzTmFtZX0gfSBmcm9tICcke3JlbGF0aXZlUGF0aH0nO2ApO1xuICAgICAgICB9XG4gICAgICAgIGxpbmVzLnB1c2goJycpO1xuICAgIH1cblxuICAgIC8vIOWvvOWFpSBNYW5hZ2VyXG4gICAgaWYgKG1hbmFnZXJzLmxlbmd0aCA+IDApIHtcbiAgICAgICAgbGluZXMucHVzaCgnLy8gTWFuYWdlciDlr7zlhaUnKTtcbiAgICAgICAgZm9yIChjb25zdCBtYW5hZ2VyIG9mIG1hbmFnZXJzKSB7XG4gICAgICAgICAgICBjb25zdCByZWxhdGl2ZVBhdGggPSBwYXRoLnJlbGF0aXZlKFxuICAgICAgICAgICAgICAgIHBhdGguZGlybmFtZShjb25maWcub3V0cHV0RmlsZSksXG4gICAgICAgICAgICAgICAgbWFuYWdlci5maWxlUGF0aFxuICAgICAgICAgICAgKS5yZXBsYWNlKC9cXFxcL2csICcvJykucmVwbGFjZSgnLnRzJywgJycpO1xuICAgICAgICAgICAgbGluZXMucHVzaChgaW1wb3J0IHR5cGUgeyAke21hbmFnZXIuY2xhc3NOYW1lfSB9IGZyb20gJyR7cmVsYXRpdmVQYXRofSc7YCk7XG4gICAgICAgIH1cbiAgICAgICAgbGluZXMucHVzaCgnJyk7XG4gICAgfVxuXG4gICAgLy8g5a+85YWlIE5hbWVz77yI55So5LqO5Ye95pWw6YeN6L2977yJXG4gICAgY29uc3QgbmVlZE1vZGVsTmFtZXMgPSBtb2RlbHMubGVuZ3RoID4gMDtcbiAgICBjb25zdCBuZWVkTWFuYWdlck5hbWVzID0gbWFuYWdlcnMubGVuZ3RoID4gMDtcbiAgICBpZiAobmVlZE1vZGVsTmFtZXMgfHwgbmVlZE1hbmFnZXJOYW1lcykge1xuICAgICAgICBjb25zdCBpbXBvcnRzOiBzdHJpbmdbXSA9IFtdO1xuICAgICAgICBpZiAobmVlZE1vZGVsTmFtZXMpIGltcG9ydHMucHVzaCgnTW9kZWxOYW1lcycpO1xuICAgICAgICBpZiAobmVlZE1hbmFnZXJOYW1lcykgaW1wb3J0cy5wdXNoKCdNYW5hZ2VyTmFtZXMnKTtcbiAgICAgICAgbGluZXMucHVzaChgaW1wb3J0IHsgJHtpbXBvcnRzLmpvaW4oJywgJyl9IH0gZnJvbSAnJHtjb25maWcubW9kdWxlSW1wb3J0UGF0aH0nO2ApO1xuICAgICAgICBsaW5lcy5wdXNoKCcnKTtcbiAgICB9XG5cbiAgICAvLyDlo7DmmI7mqKHlnZdcbiAgICBsaW5lcy5wdXNoKGBkZWNsYXJlIG1vZHVsZSAnJHtjb25maWcubW9kdWxlSW1wb3J0UGF0aH0nIHtgKTtcblxuICAgIC8vIOaJqeWxlSBOYW1lc1R5cGUg5o6l5Y+j77yM5bCG5q+P5Liq5bGe5oCn5a6a5LmJ5Li6IHVuaXF1ZSBzeW1ib2xcbiAgICBpZiAobW9kZWxzLmxlbmd0aCA+IDApIHtcbiAgICAgICAgbGluZXMucHVzaCgnICAgIC8vIOaJqeWxlSBNb2RlbE5hbWVzVHlwZe+8jOWwhuavj+S4quWxnuaAp+WumuS5ieS4uiB1bmlxdWUgc3ltYm9sJyk7XG4gICAgICAgIGxpbmVzLnB1c2goJyAgICBpbnRlcmZhY2UgTW9kZWxOYW1lc1R5cGUgeycpO1xuICAgICAgICBmb3IgKGNvbnN0IG1vZGVsIG9mIG1vZGVscykge1xuICAgICAgICAgICAgbGluZXMucHVzaChgICAgICAgICByZWFkb25seSAke21vZGVsLmRlY29yYXRvck5hbWV9OiB1bmlxdWUgc3ltYm9sO2ApO1xuICAgICAgICB9XG4gICAgICAgIGxpbmVzLnB1c2goJyAgICB9Jyk7XG4gICAgICAgIGxpbmVzLnB1c2goJycpO1xuICAgIH1cblxuICAgIGlmIChtYW5hZ2Vycy5sZW5ndGggPiAwKSB7XG4gICAgICAgIGxpbmVzLnB1c2goJyAgICAvLyDmianlsZUgTWFuYWdlck5hbWVzVHlwZe+8jOWwhuavj+S4quWxnuaAp+WumuS5ieS4uiB1bmlxdWUgc3ltYm9sJyk7XG4gICAgICAgIGxpbmVzLnB1c2goJyAgICBpbnRlcmZhY2UgTWFuYWdlck5hbWVzVHlwZSB7Jyk7XG4gICAgICAgIGZvciAoY29uc3QgbWFuYWdlciBvZiBtYW5hZ2Vycykge1xuICAgICAgICAgICAgbGluZXMucHVzaChgICAgICAgICByZWFkb25seSAke21hbmFnZXIuZGVjb3JhdG9yTmFtZX06IHVuaXF1ZSBzeW1ib2w7YCk7XG4gICAgICAgIH1cbiAgICAgICAgbGluZXMucHVzaCgnICAgIH0nKTtcbiAgICAgICAgbGluZXMucHVzaCgnJyk7XG4gICAgfVxuXG4gICAgLy8gSUNvcmUg5o6l5Y+j5omp5bGV77yI5L2/55So5Ye95pWw6YeN6L295o+Q5L6b57K+56Gu55qE57G75Z6L5o6o5pat77yJXG4gICAgaWYgKG1vZGVscy5sZW5ndGggPiAwIHx8IG1hbmFnZXJzLmxlbmd0aCA+IDApIHtcbiAgICAgICAgbGluZXMucHVzaCgnICAgIC8vIOaJqeWxlSBJQ29yZSDmjqXlj6PvvIzmt7vliqDnsr7noa7nmoTnsbvlnovph43ovb0nKTtcbiAgICAgICAgbGluZXMucHVzaCgnICAgIGludGVyZmFjZSBJQ29yZSB7Jyk7XG4gICAgICAgIFxuICAgICAgICAvLyDkuLrmr4/kuKogTW9kZWwg5re75YqgIGdldE1vZGVsIOmHjei9vVxuICAgICAgICBpZiAobW9kZWxzLmxlbmd0aCA+IDApIHtcbiAgICAgICAgICAgIGZvciAoY29uc3QgbW9kZWwgb2YgbW9kZWxzKSB7XG4gICAgICAgICAgICAgICAgbGluZXMucHVzaChgICAgICAgICBnZXRNb2RlbChtb2RlbFN5bWJvbDogdHlwZW9mIE1vZGVsTmFtZXMuJHttb2RlbC5kZWNvcmF0b3JOYW1lfSk6ICR7bW9kZWwuY2xhc3NOYW1lfTtgKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBcbiAgICAgICAgLy8g5Li65q+P5LiqIE1hbmFnZXIg5re75YqgIGdldE1hbmFnZXIg6YeN6L29XG4gICAgICAgIGlmIChtYW5hZ2Vycy5sZW5ndGggPiAwKSB7XG4gICAgICAgICAgICBmb3IgKGNvbnN0IG1hbmFnZXIgb2YgbWFuYWdlcnMpIHtcbiAgICAgICAgICAgICAgICBsaW5lcy5wdXNoKGAgICAgICAgIGdldE1hbmFnZXIobWFuYWdlclN5bWJvbDogdHlwZW9mIE1hbmFnZXJOYW1lcy4ke21hbmFnZXIuZGVjb3JhdG9yTmFtZX0pOiAke21hbmFnZXIuY2xhc3NOYW1lfTtgKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBcbiAgICAgICAgbGluZXMucHVzaCgnICAgIH0nKTtcbiAgICB9XG5cbiAgICBsaW5lcy5wdXNoKCd9Jyk7XG4gICAgbGluZXMucHVzaCgnJyk7XG5cbiAgICByZXR1cm4gbGluZXMuam9pbignXFxuJyk7XG59XG5cbi8vIOS4u+WHveaVsFxuZXhwb3J0IGZ1bmN0aW9uIGdlbmVyYXRlVHlwZXMoY29uZmlnOiBUeXBlR2VuQ29uZmlnKTogeyBzdWNjZXNzOiBib29sZWFuOyBtZXNzYWdlOiBzdHJpbmcgfSB7XG4gICAgdHJ5IHtcbiAgICAgICAgY29uc29sZS5sb2coJ/CfmoAg5byA5aeL55Sf5oiQ57G75Z6L5pig5bCE5paH5Lu2Li4uXFxuJyk7XG5cbiAgICAgICAgLy8g5omr5o+PIE1vZGVsIOebruW9lVxuICAgICAgICBjb25zb2xlLmxvZyhg8J+TgiDmiavmj48gTW9kZWwg55uu5b2VOiAke2NvbmZpZy5tb2RlbERpcn1gKTtcbiAgICAgICAgY29uc3QgbW9kZWxGaWxlcyA9IHNjYW5EaXJlY3RvcnkoY29uZmlnLm1vZGVsRGlyKTtcbiAgICAgICAgY29uc3QgbW9kZWxzID0gbW9kZWxGaWxlc1xuICAgICAgICAgICAgLm1hcChwYXJzZUZpbGUpXG4gICAgICAgICAgICAuZmlsdGVyKChpdGVtKTogaXRlbSBpcyBQYXJzZWRJdGVtID0+IGl0ZW0gIT09IG51bGwgJiYgaXRlbS50eXBlID09PSAnbW9kZWwnKTtcbiAgICAgICAgY29uc29sZS5sb2coYCAgIOaJvuWIsCAke21vZGVscy5sZW5ndGh9IOS4qiBNb2RlbFxcbmApO1xuXG4gICAgICAgIC8vIOaJq+aPjyBNYW5hZ2VyIOebruW9lVxuICAgICAgICBjb25zb2xlLmxvZyhg8J+TgiDmiavmj48gTWFuYWdlciDnm67lvZU6ICR7Y29uZmlnLm1hbmFnZXJEaXJ9YCk7XG4gICAgICAgIGNvbnN0IG1hbmFnZXJGaWxlcyA9IHNjYW5EaXJlY3RvcnkoY29uZmlnLm1hbmFnZXJEaXIpO1xuICAgICAgICBjb25zdCBtYW5hZ2VycyA9IG1hbmFnZXJGaWxlc1xuICAgICAgICAgICAgLm1hcChwYXJzZUZpbGUpXG4gICAgICAgICAgICAuZmlsdGVyKChpdGVtKTogaXRlbSBpcyBQYXJzZWRJdGVtID0+IGl0ZW0gIT09IG51bGwgJiYgaXRlbS50eXBlID09PSAnbWFuYWdlcicpO1xuICAgICAgICBjb25zb2xlLmxvZyhgICAg5om+5YiwICR7bWFuYWdlcnMubGVuZ3RofSDkuKogTWFuYWdlclxcbmApO1xuXG4gICAgICAgIGlmIChtb2RlbHMubGVuZ3RoID09PSAwICYmIG1hbmFnZXJzLmxlbmd0aCA9PT0gMCkge1xuICAgICAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgICAgICBzdWNjZXNzOiBmYWxzZSxcbiAgICAgICAgICAgICAgICBtZXNzYWdlOiAn4pqg77iPICDmnKrmib7liLDku7vkvZUgTW9kZWwg5oiWIE1hbmFnZXLvvIzot7Pov4fnlJ/miJAnXG4gICAgICAgICAgICB9O1xuICAgICAgICB9XG5cbiAgICAgICAgLy8g55Sf5oiQ57G75Z6L5pig5bCEXG4gICAgICAgIGNvbnN0IGNvbnRlbnQgPSBnZW5lcmF0ZVR5cGVNYXAobW9kZWxzLCBtYW5hZ2VycywgY29uZmlnKTtcblxuICAgICAgICAvLyDnoa7kv53ovpPlh7rnm67lvZXlrZjlnKhcbiAgICAgICAgY29uc3Qgb3V0cHV0RGlyID0gcGF0aC5kaXJuYW1lKGNvbmZpZy5vdXRwdXRGaWxlKTtcbiAgICAgICAgaWYgKCFmcy5leGlzdHNTeW5jKG91dHB1dERpcikpIHtcbiAgICAgICAgICAgIGZzLm1rZGlyU3luYyhvdXRwdXREaXIsIHsgcmVjdXJzaXZlOiB0cnVlIH0pO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8g5YaZ5YWl5paH5Lu2XG4gICAgICAgIGZzLndyaXRlRmlsZVN5bmMoY29uZmlnLm91dHB1dEZpbGUsIGNvbnRlbnQsICd1dGYtOCcpO1xuXG4gICAgICAgIGxldCBtZXNzYWdlID0gYOKchSDnsbvlnovmmKDlsITmlofku7blt7LnlJ/miJA6ICR7Y29uZmlnLm91dHB1dEZpbGV9XFxuXFxuYDtcbiAgICAgICAgbWVzc2FnZSArPSAn8J+TiyDnlJ/miJDnmoTmmKDlsIQ6XFxuJztcbiAgICAgICAgaWYgKG1vZGVscy5sZW5ndGggPiAwKSB7XG4gICAgICAgICAgICBtZXNzYWdlICs9ICcgICBNb2RlbHM6XFxuJztcbiAgICAgICAgICAgIG1vZGVscy5mb3JFYWNoKG0gPT4gbWVzc2FnZSArPSBgICAgICAtICR7bS5kZWNvcmF0b3JOYW1lfSDihpIgJHttLmNsYXNzTmFtZX1cXG5gKTtcbiAgICAgICAgfVxuICAgICAgICBpZiAobWFuYWdlcnMubGVuZ3RoID4gMCkge1xuICAgICAgICAgICAgbWVzc2FnZSArPSAnICAgTWFuYWdlcnM6XFxuJztcbiAgICAgICAgICAgIG1hbmFnZXJzLmZvckVhY2gobSA9PiBtZXNzYWdlICs9IGAgICAgIC0gJHttLmRlY29yYXRvck5hbWV9IOKGkiAke20uY2xhc3NOYW1lfVxcbmApO1xuICAgICAgICB9XG4gICAgICAgIG1lc3NhZ2UgKz0gJ1xcbvCfjokg5a6M5oiQ77yBJztcblxuICAgICAgICBjb25zb2xlLmxvZyhtZXNzYWdlKTtcbiAgICAgICAgcmV0dXJuIHsgc3VjY2VzczogdHJ1ZSwgbWVzc2FnZSB9O1xuXG4gICAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICAgICAgY29uc3QgZXJyb3JNZXNzYWdlID0gYOKdjCDnlJ/miJDlpLHotKU6ICR7ZXJyb3IgaW5zdGFuY2VvZiBFcnJvciA/IGVycm9yLm1lc3NhZ2UgOiBTdHJpbmcoZXJyb3IpfWA7XG4gICAgICAgIGNvbnNvbGUuZXJyb3IoZXJyb3JNZXNzYWdlKTtcbiAgICAgICAgcmV0dXJuIHsgc3VjY2VzczogZmFsc2UsIG1lc3NhZ2U6IGVycm9yTWVzc2FnZSB9O1xuICAgIH1cbn1cblxuLy8g5LuO6aG555uu6YWN572u5paH5Lu26K+75Y+W6YWN572uXG5mdW5jdGlvbiBsb2FkQ29uZmlnRnJvbVByb2plY3QocHJvamVjdFBhdGg6IHN0cmluZyk6IFR5cGVHZW5Db25maWcgfCBudWxsIHtcbiAgICBjb25zdCBkZWZhdWx0Q29uZmlnID0ge1xuICAgICAgICBtb2RlbERpcjogJ2Fzc2V0cy9zcmMvbW9kZWxzJyxcbiAgICAgICAgbWFuYWdlckRpcjogJ2Fzc2V0cy9zcmMvbWFuYWdlcnMnLFxuICAgICAgICBvdXRwdXRGaWxlOiAnYXNzZXRzL3R5cGVzL21hbmFnZXItbW9kZWwtbWFwcGluZy5kLnRzJyxcbiAgICAgICAgbW9kdWxlSW1wb3J0UGF0aDogJ2R6a2NjLW1mbG93L2NvcmUnXG4gICAgfTtcblxuICAgIC8vIOinhOiMg+WMlumFjee9ru+8muWwhuebuOWvuei3r+W+hOi9rOaNouS4uue7neWvuei3r+W+hFxuICAgIGNvbnN0IG5vcm1hbGl6ZUNvbmZpZyA9IChjb25maWc6IFBhcnRpYWw8VHlwZUdlbkNvbmZpZz4pOiBUeXBlR2VuQ29uZmlnID0+ICh7XG4gICAgICAgIG1vZGVsRGlyOiBwYXRoLnJlc29sdmUocHJvamVjdFBhdGgsIGNvbmZpZy5tb2RlbERpciB8fCBkZWZhdWx0Q29uZmlnLm1vZGVsRGlyKSxcbiAgICAgICAgbWFuYWdlckRpcjogcGF0aC5yZXNvbHZlKHByb2plY3RQYXRoLCBjb25maWcubWFuYWdlckRpciB8fCBkZWZhdWx0Q29uZmlnLm1hbmFnZXJEaXIpLFxuICAgICAgICBvdXRwdXRGaWxlOiBwYXRoLnJlc29sdmUocHJvamVjdFBhdGgsIGNvbmZpZy5vdXRwdXRGaWxlIHx8IGRlZmF1bHRDb25maWcub3V0cHV0RmlsZSksXG4gICAgICAgIG1vZHVsZUltcG9ydFBhdGg6IGNvbmZpZy5tb2R1bGVJbXBvcnRQYXRoIHx8IGRlZmF1bHRDb25maWcubW9kdWxlSW1wb3J0UGF0aFxuICAgIH0pO1xuXG4gICAgLy8g5LuO5Y2V54us55qE6YWN572u5paH5Lu26K+75Y+WXG4gICAgY29uc3QgY29uZmlnUGF0aCA9IHBhdGguam9pbihwcm9qZWN0UGF0aCwgJ21mbG93LmNvbmZpZy5qc29uJyk7XG4gICAgaWYgKGZzLmV4aXN0c1N5bmMoY29uZmlnUGF0aCkpIHtcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIGNvbnN0IGNvbmZpZyA9IEpTT04ucGFyc2UoZnMucmVhZEZpbGVTeW5jKGNvbmZpZ1BhdGgsICd1dGYtOCcpKTtcbiAgICAgICAgICAgIHJldHVybiBub3JtYWxpemVDb25maWcoY29uZmlnKTtcbiAgICAgICAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICAgICAgICAgIGNvbnNvbGUud2Fybign5peg5rOV6K+75Y+WIG1mbG93LmNvbmZpZy5qc29uIOmFjee9ricpO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgLy8g5L2/55So6buY6K6k6YWN572uXG4gICAgcmV0dXJuIG5vcm1hbGl6ZUNvbmZpZyh7fSk7XG59XG5cbi8vIOe8lui+keWZqOaJqeWxleWFpeWPo1xuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIG9uR2VuZXJhdGVUeXBlcygpIHtcbiAgICB0cnkge1xuICAgICAgICAvLyDojrflj5bpobnnm67ot6/lvoRcbiAgICAgICAgY29uc3QgcHJvamVjdFBhdGggPSBFZGl0b3IuUHJvamVjdC5wYXRoO1xuICAgICAgICBjb25zb2xlLmxvZygn6aG555uu6Lev5b6EOicsIHByb2plY3RQYXRoKTtcblxuICAgICAgICAvLyDliqDovb3phY3nva5cbiAgICAgICAgY29uc3QgY29uZmlnID0gbG9hZENvbmZpZ0Zyb21Qcm9qZWN0KHByb2plY3RQYXRoKTtcbiAgICAgICAgaWYgKCFjb25maWcpIHtcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcign5peg5rOV5Yqg6L296YWN572uJyk7XG4gICAgICAgIH1cblxuICAgICAgICBjb25zb2xlLmxvZygn5L2/55So6YWN572uOicsIGNvbmZpZyk7XG5cbiAgICAgICAgLy8g55Sf5oiQ57G75Z6L5pig5bCEXG4gICAgICAgIGNvbnN0IHJlc3VsdCA9IGdlbmVyYXRlVHlwZXMoY29uZmlnKTtcblxuICAgICAgICBpZiAocmVzdWx0LnN1Y2Nlc3MpIHtcbiAgICAgICAgICAgIGF3YWl0IEVkaXRvci5EaWFsb2cuaW5mbygn57G75Z6L5pig5bCE55Sf5oiQ5oiQ5Yqf77yBJywge1xuICAgICAgICAgICAgICAgIGRldGFpbDogcmVzdWx0Lm1lc3NhZ2UsXG4gICAgICAgICAgICAgICAgYnV0dG9uczogWyfnoa7lrponXVxuICAgICAgICAgICAgfSk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBhd2FpdCBFZGl0b3IuRGlhbG9nLndhcm4oJ+exu+Wei+aYoOWwhOeUn+aIkOWksei0pScsIHtcbiAgICAgICAgICAgICAgICBkZXRhaWw6IHJlc3VsdC5tZXNzYWdlLFxuICAgICAgICAgICAgICAgIGJ1dHRvbnM6IFsn56Gu5a6aJ11cbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9XG4gICAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICAgICAgY29uc29sZS5lcnJvcign55Sf5oiQ57G75Z6L5pig5bCE5aSx6LSlOicsIGVycm9yKTtcbiAgICAgICAgYXdhaXQgRWRpdG9yLkRpYWxvZy5lcnJvcign55Sf5oiQ57G75Z6L5pig5bCE5aSx6LSlJywge1xuICAgICAgICAgICAgZGV0YWlsOiBlcnJvciBpbnN0YW5jZW9mIEVycm9yID8gZXJyb3IubWVzc2FnZSA6IFN0cmluZyhlcnJvciksXG4gICAgICAgICAgICBidXR0b25zOiBbJ+ehruWumiddXG4gICAgICAgIH0pO1xuICAgIH1cbn1cblxuIl19