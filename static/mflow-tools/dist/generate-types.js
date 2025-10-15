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
            lines.push(`import { ${model.className} } from '${relativePath}';`);
        }
        lines.push('');
    }
    // 导入 Manager
    if (managers.length > 0) {
        lines.push('// Manager 导入');
        for (const manager of managers) {
            const relativePath = path.relative(path.dirname(config.outputFile), manager.filePath).replace(/\\/g, '/').replace('.ts', '');
            lines.push(`import { ${manager.className} } from '${relativePath}';`);
        }
        lines.push('');
    }
    // 导入 Names
    lines.push('// Names 导入');
    lines.push(`import { ModelNames, ManagerNames } from '${config.moduleImportPath}';`);
    lines.push('');
    // 声明模块
    lines.push(`declare module '${config.moduleImportPath}' {`);
    // Model Names 类型映射
    if (models.length > 0) {
        lines.push('    interface ModelNamesType {');
        for (const model of models) {
            lines.push(`        ${model.decoratorName}: symbol;`);
        }
        lines.push('    }');
        lines.push('');
    }
    // Manager Names 类型映射
    if (managers.length > 0) {
        lines.push('    interface ManagerNamesType {');
        for (const manager of managers) {
            lines.push(`        ${manager.decoratorName}: symbol;`);
        }
        lines.push('    }');
        lines.push('');
    }
    // Model 类型映射
    if (models.length > 0) {
        lines.push('    interface ModelTypeMap {');
        for (const model of models) {
            lines.push(`        '${model.decoratorName}': ${model.className};`);
        }
        lines.push('    }');
        lines.push('');
    }
    // Manager 类型映射
    if (managers.length > 0) {
        lines.push('    interface ManagerTypeMap {');
        for (const manager of managers) {
            lines.push(`        '${manager.decoratorName}': ${manager.className};`);
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
    // 尝试从 package.json 读取配置
    const packageJsonPath = path.join(projectPath, 'package.json');
    if (fs.existsSync(packageJsonPath)) {
        try {
            const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));
            if (packageJson.mflowTypeGen) {
                const config = packageJson.mflowTypeGen;
                return {
                    modelDir: path.resolve(projectPath, config.modelDir || 'assets/src/models'),
                    managerDir: path.resolve(projectPath, config.managerDir || 'assets/src/managers'),
                    outputFile: path.resolve(projectPath, config.outputFile || 'assets/types/manager-model-mapping.d.ts'),
                    moduleImportPath: config.moduleImportPath || 'dzkcc-mflow/core'
                };
            }
        }
        catch (error) {
            console.warn('无法读取 package.json 配置');
        }
    }
    // 尝试从单独的配置文件读取
    const configPath = path.join(projectPath, 'mflow.config.json');
    if (fs.existsSync(configPath)) {
        try {
            const config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
            return {
                modelDir: path.resolve(projectPath, config.modelDir || 'assets/src/models'),
                managerDir: path.resolve(projectPath, config.managerDir || 'assets/src/managers'),
                outputFile: path.resolve(projectPath, config.outputFile || 'assets/types/core-types.d.ts'),
                moduleImportPath: config.moduleImportPath || 'dzkcc-mflow/core'
            };
        }
        catch (error) {
            console.warn('无法读取 mflow.config.json 配置');
        }
    }
    // 使用默认配置
    return {
        modelDir: path.resolve(projectPath, 'assets/src/models'),
        managerDir: path.resolve(projectPath, 'assets/src/managers'),
        outputFile: path.resolve(projectPath, 'assets/types/core-types.d.ts'),
        moduleImportPath: 'dzkcc-mflow/core'
    };
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZ2VuZXJhdGUtdHlwZXMuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi9zb3VyY2UvZ2VuZXJhdGUtdHlwZXMudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IjtBQUFBOzs7R0FHRzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFFSCx1Q0FBeUI7QUFDekIsMkNBQTZCO0FBa0I3QixrQkFBa0I7QUFDbEIsU0FBUyxhQUFhLENBQUMsR0FBVztJQUM5QixJQUFJLENBQUMsRUFBRSxDQUFDLFVBQVUsQ0FBQyxHQUFHLENBQUMsRUFBRTtRQUNyQixPQUFPLENBQUMsSUFBSSxDQUFDLGNBQWMsR0FBRyxFQUFFLENBQUMsQ0FBQztRQUNsQyxPQUFPLEVBQUUsQ0FBQztLQUNiO0lBRUQsTUFBTSxLQUFLLEdBQWEsRUFBRSxDQUFDO0lBQzNCLE1BQU0sS0FBSyxHQUFHLEVBQUUsQ0FBQyxXQUFXLENBQUMsR0FBRyxDQUFDLENBQUM7SUFFbEMsS0FBSyxNQUFNLElBQUksSUFBSSxLQUFLLEVBQUU7UUFDdEIsTUFBTSxRQUFRLEdBQUcsSUFBSSxDQUFDLElBQUksQ0FBQyxHQUFHLEVBQUUsSUFBSSxDQUFDLENBQUM7UUFDdEMsTUFBTSxJQUFJLEdBQUcsRUFBRSxDQUFDLFFBQVEsQ0FBQyxRQUFRLENBQUMsQ0FBQztRQUVuQyxJQUFJLElBQUksQ0FBQyxXQUFXLEVBQUUsRUFBRTtZQUNwQixLQUFLLENBQUMsSUFBSSxDQUFDLEdBQUcsYUFBYSxDQUFDLFFBQVEsQ0FBQyxDQUFDLENBQUM7U0FDMUM7YUFBTSxJQUFJLElBQUksQ0FBQyxRQUFRLENBQUMsS0FBSyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsUUFBUSxDQUFDLE9BQU8sQ0FBQyxFQUFFO1lBQ3hELEtBQUssQ0FBQyxJQUFJLENBQUMsUUFBUSxDQUFDLENBQUM7U0FDeEI7S0FDSjtJQUVELE9BQU8sS0FBSyxDQUFDO0FBQ2pCLENBQUM7QUFFRCxjQUFjO0FBQ2QsU0FBUyxTQUFTLENBQUMsUUFB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QU0sTUFBTSxDQUFDLE1BQU0sQ0FBQyxLQUFLLENBQUMsVUFBVSxFQUFFO1lBQ2xDLE1BQU0sRUFBRSxLQUFLLFlBQVksS0FBSyxDQUFDLENBQUMsQ0FBQyxLQUFLLENBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQyxNQUFNLENBQUMsS0FBSyxDQUFDO1lBQzlELE9BQU8sRUFBRSxDQUFDLElBQUksQ0FBQztTQUNsQixDQUFDLENBQUM7S0FDTjtBQUNMLENBQUM7QUFuQ0QsMENBbUNDIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAZW4gR2VuZXJhdGUgdHlwZSBtYXAgZmlsZSBmb3IgdGhlIGNsYXNzZXMgZGVjb3JhdGVkIHdpdGggQG1vZGVsKCkgb3IgQG1hbmFnZXIoKVxuICogQHpoIOS4uuiiq+ijhemlsOWZqOijhemlsChAbW9kZWwoKeaIlkBtYW5hZ2VyKCkp55qE57G755Sf5oiQ57G75Z6L5pig5bCE5paH5Lu277yM5a6e546w5a6M5pW055qE57G75Z6L5o6o5pat5pSv5oyB44CCXG4gKi9cblxuaW1wb3J0ICogYXMgZnMgZnJvbSAnZnMnO1xuaW1wb3J0ICogYXMgcGF0aCBmcm9tICdwYXRoJztcblxuLy8g6YWN572u5o6l5Y+jXG5pbnRlcmZhY2UgVHlwZUdlbkNvbmZpZyB7XG4gICAgbW9kZWxEaXI6IHN0cmluZztcbiAgICBtYW5hZ2VyRGlyOiBzdHJpbmc7XG4gICAgb3V0cHV0RmlsZTogc3RyaW5nO1xuICAgIG1vZHVsZUltcG9ydFBhdGg6IHN0cmluZztcbn1cblxuLy8g6Kej5p6Q57uT5p6c5o6l5Y+jXG5pbnRlcmZhY2UgUGFyc2VkSXRlbSB7XG4gICAgdHlwZTogJ21vZGVsJyB8ICdtYW5hZ2VyJztcbiAgICBkZWNvcmF0b3JOYW1lOiBzdHJpbmc7XG4gICAgY2xhc3NOYW1lOiBzdHJpbmc7XG4gICAgZmlsZVBhdGg6IHN0cmluZztcbn1cblxuLy8g5omr5o+P55uu5b2V6I635Y+W5omA5pyJIC50cyDmlofku7ZcbmZ1bmN0aW9uIHNjYW5EaXJlY3RvcnkoZGlyOiBzdHJpbmcpOiBzdHJpbmdbXSB7XG4gICAgaWYgKCFmcy5leGlzdHNTeW5jKGRpcikpIHtcbiAgICAgICAgY29uc29sZS53YXJuKGDimqDvuI8gIOebruW9leS4jeWtmOWcqDogJHtkaXJ9YCk7XG4gICAgICAgIHJldHVybiBbXTtcbiAgICB9XG5cbiAgICBjb25zdCBmaWxlczogc3RyaW5nW10gPSBbXTtcbiAgICBjb25zdCBpdGVtcyA9IGZzLnJlYWRkaXJTeW5jKGRpcik7XG5cbiAgICBmb3IgKGNvbnN0IGl0ZW0gb2YgaXRlbXMpIHtcbiAgICAgICAgY29uc3QgZnVsbFBhdGggPSBwYXRoLmpvaW4oZGlyLCBpdGVtKTtcbiAgICAgICAgY29uc3Qgc3RhdCA9IGZzLnN0YXRTeW5jKGZ1bGxQYXRoKTtcblxuICAgICAgICBpZiAoc3RhdC5pc0RpcmVjdG9yeSgpKSB7XG4gICAgICAgICAgICBmaWxlcy5wdXNoKC4uLnNjYW5EaXJlY3RvcnkoZnVsbFBhdGgpKTtcbiAgICAgICAgfSBlbHNlIGlmIChpdGVtLmVuZHNXaXRoKCcudHMnKSAmJiAhaXRlbS5lbmRzV2l0aCgnLmQudHMnKSkge1xuICAgICAgICAgICAgZmlsZXMucHVzaChmdWxsUGF0aCk7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICByZXR1cm4gZmlsZXM7XG59XG5cbi8vIOino+aekOaWh+S7tuiOt+WPluijhemlsOWZqOS/oeaBr1xuZnVuY3Rpb24gcGFyc2VGaWxlKGZpbGVQYXRoOiBzdHJpbmcpOiBQYXJzZWRJdGVtIHwgbnVsbCB7XG4gICAgY29uc3QgY29udGVudCA9IGZzLnJlYWRGaWxlU3luYyhmaWxlUGF0aCwgJ3V0Zi04Jyk7XG4gICAgY29uc3QgZmlsZU5hbWUgPSBwYXRoLmJhc2VuYW1lKGZpbGVQYXRoLCAnLnRzJyk7XG5cbiAgICAvLyDljLnphY0gQG1vZGVsKCdOYW1lJykg5oiWIEBtb2RlbCgpXG4gICAgY29uc3QgbW9kZWxNYXRjaCA9IGNvbnRlbnQubWF0Y2goL0Btb2RlbFxccypcXChcXHMqWydcIl0oXFx3KylbJ1wiXVxccypcXCkvKTtcbiAgICBpZiAobW9kZWxNYXRjaCkge1xuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgdHlwZTogJ21vZGVsJyxcbiAgICAgICAgICAgIGRlY29yYXRvck5hbWU6IG1vZGVsTWF0Y2hbMV0sXG4gICAgICAgICAgICBjbGFzc05hbWU6IGZpbGVOYW1lLFxuICAgICAgICAgICAgZmlsZVBhdGg6IGZpbGVQYXRoXG4gICAgICAgIH07XG4gICAgfVxuXG4gICAgLy8g5Yy56YWNIEBtYW5hZ2VyKCdOYW1lJykg5oiWIEBtYW5hZ2VyKClcbiAgICBjb25zdCBtYW5hZ2VyTWF0Y2ggPSBjb250ZW50Lm1hdGNoKC9AbWFuYWdlclxccypcXChcXHMqWydcIl0oXFx3KylbJ1wiXVxccypcXCkvKTtcbiAgICBpZiAobWFuYWdlck1hdGNoKSB7XG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICB0eXBlOiAnbWFuYWdlcicsXG4gICAgICAgICAgICBkZWNvcmF0b3JOYW1lOiBtYW5hZ2VyTWF0Y2hbMV0sXG4gICAgICAgICAgICBjbGFzc05hbWU6IGZpbGVOYW1lLFxuICAgICAgICAgICAgZmlsZVBhdGg6IGZpbGVQYXRoXG4gICAgICAgIH07XG4gICAgfVxuXG4gICAgLy8g5aaC5p6c5rKh5pyJ5oyH5a6a5ZCN56ew77yM5L2/55So57G75ZCNXG4gICAgaWYgKGNvbnRlbnQuaW5jbHVkZXMoJ0Btb2RlbCgpJykpIHtcbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgIHR5cGU6ICdtb2RlbCcsXG4gICAgICAgICAgICBkZWNvcmF0b3JOYW1lOiBmaWxlTmFtZSxcbiAgICAgICAgICAgIGNsYXNzTmFtZTogZmlsZU5hbWUsXG4gICAgICAgICAgICBmaWxlUGF0aDogZmlsZVBhdGhcbiAgICAgICAgfTtcbiAgICB9XG5cbiAgICBpZiAoY29udGVudC5pbmNsdWRlcygnQG1hbmFnZXIoKScpKSB7XG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICB0eXBlOiAnbWFuYWdlcicsXG4gICAgICAgICAgICBkZWNvcmF0b3JOYW1lOiBmaWxlTmFtZSxcbiAgICAgICAgICAgIGNsYXNzTmFtZTogZmlsZU5hbWUsXG4gICAgICAgICAgICBmaWxlUGF0aDogZmlsZVBhdGhcbiAgICAgICAgfTtcbiAgICB9XG5cbiAgICByZXR1cm4gbnVsbDtcbn1cblxuLy8g55Sf5oiQ57G75Z6L5pig5bCE5Luj56CBXG5mdW5jdGlvbiBnZW5lcmF0ZVR5cGVNYXAobW9kZWxzOiBQYXJzZWRJdGVtW10sIG1hbmFnZXJzOiBQYXJzZWRJdGVtW10sIGNvbmZpZzogVHlwZUdlbkNvbmZpZyk6IHN0cmluZyB7XG4gICAgY29uc3QgbGluZXM6IHN0cmluZ1tdID0gW107XG5cbiAgICAvLyDmlofku7blpLTms6jph4pcbiAgICBsaW5lcy5wdXNoKCcvKionKTtcbiAgICBsaW5lcy5wdXNoKCcgKiDoh6rliqjnlJ/miJDnmoTnsbvlnovmmKDlsITmlofku7YnKTtcbiAgICBsaW5lcy5wdXNoKCcgKiDimqDvuI8g6K+35Yu/5omL5Yqo5L+u5pS55q2k5paH5Lu277yBJyk7XG4gICAgbGluZXMucHVzaCgnICog6YeN5paw55Sf5oiQ77ya5ZyoIENvY29zIENyZWF0b3Ig57yW6L6R5Zmo5Lit6L+Q6KGMIG1mbG93LXRvb2xzIC0+IEdlbmVyYXRlIGRlY29yYXRvciBtYXBwaW5nL+eUn+aIkOijhemlsOWZqOaYoOWwhCcpO1xuICAgIGxpbmVzLnB1c2goJyAqLycpO1xuICAgIGxpbmVzLnB1c2goJycpO1xuXG4gICAgLy8g5a+85YWlIE1vZGVsXG4gICAgaWYgKG1vZGVscy5sZW5ndGggPiAwKSB7XG4gICAgICAgIGxpbmVzLnB1c2goJy8vIE1vZGVsIOWvvOWFpScpO1xuICAgICAgICBmb3IgKGNvbnN0IG1vZGVsIG9mIG1vZGVscykge1xuICAgICAgICAgICAgY29uc3QgcmVsYXRpdmVQYXRoID0gcGF0aC5yZWxhdGl2ZShcbiAgICAgICAgICAgICAgICBwYXRoLmRpcm5hbWUoY29uZmlnLm91dHB1dEZpbGUpLFxuICAgICAgICAgICAgICAgIG1vZGVsLmZpbGVQYXRoXG4gICAgICAgICAgICApLnJlcGxhY2UoL1xcXFwvZywgJy8nKS5yZXBsYWNlKCcudHMnLCAnJyk7XG4gICAgICAgICAgICBsaW5lcy5wdXNoKGBpbXBvcnQgeyAke21vZGVsLmNsYXNzTmFtZX0gfSBmcm9tICcke3JlbGF0aXZlUGF0aH0nO2ApO1xuICAgICAgICB9XG4gICAgICAgIGxpbmVzLnB1c2goJycpO1xuICAgIH1cblxuICAgIC8vIOWvvOWFpSBNYW5hZ2VyXG4gICAgaWYgKG1hbmFnZXJzLmxlbmd0aCA+IDApIHtcbiAgICAgICAgbGluZXMucHVzaCgnLy8gTWFuYWdlciDlr7zlhaUnKTtcbiAgICAgICAgZm9yIChjb25zdCBtYW5hZ2VyIG9mIG1hbmFnZXJzKSB7XG4gICAgICAgICAgICBjb25zdCByZWxhdGl2ZVBhdGggPSBwYXRoLnJlbGF0aXZlKFxuICAgICAgICAgICAgICAgIHBhdGguZGlybmFtZShjb25maWcub3V0cHV0RmlsZSksXG4gICAgICAgICAgICAgICAgbWFuYWdlci5maWxlUGF0aFxuICAgICAgICAgICAgKS5yZXBsYWNlKC9cXFxcL2csICcvJykucmVwbGFjZSgnLnRzJywgJycpO1xuICAgICAgICAgICAgbGluZXMucHVzaChgaW1wb3J0IHsgJHttYW5hZ2VyLmNsYXNzTmFtZX0gfSBmcm9tICcke3JlbGF0aXZlUGF0aH0nO2ApO1xuICAgICAgICB9XG4gICAgICAgIGxpbmVzLnB1c2goJycpO1xuICAgIH1cblxuICAgIC8vIOWvvOWFpSBOYW1lc1xuICAgIGxpbmVzLnB1c2goJy8vIE5hbWVzIOWvvOWFpScpO1xuICAgIGxpbmVzLnB1c2goYGltcG9ydCB7IE1vZGVsTmFtZXMsIE1hbmFnZXJOYW1lcyB9IGZyb20gJyR7Y29uZmlnLm1vZHVsZUltcG9ydFBhdGh9JztgKTtcbiAgICBsaW5lcy5wdXNoKCcnKTtcblxuICAgIC8vIOWjsOaYjuaooeWdl1xuICAgIGxpbmVzLnB1c2goYGRlY2xhcmUgbW9kdWxlICcke2NvbmZpZy5tb2R1bGVJbXBvcnRQYXRofScge2ApO1xuXG4gICAgLy8gTW9kZWwgTmFtZXMg57G75Z6L5pig5bCEXG4gICAgaWYgKG1vZGVscy5sZW5ndGggPiAwKSB7XG4gICAgICAgIGxpbmVzLnB1c2goJyAgICBpbnRlcmZhY2UgTW9kZWxOYW1lc1R5cGUgeycpO1xuICAgICAgICBmb3IgKGNvbnN0IG1vZGVsIG9mIG1vZGVscykge1xuICAgICAgICAgICAgbGluZXMucHVzaChgICAgICAgICAke21vZGVsLmRlY29yYXRvck5hbWV9OiBzeW1ib2w7YCk7XG4gICAgICAgIH1cbiAgICAgICAgbGluZXMucHVzaCgnICAgIH0nKTtcbiAgICAgICAgbGluZXMucHVzaCgnJyk7XG4gICAgfVxuXG4gICAgLy8gTWFuYWdlciBOYW1lcyDnsbvlnovmmKDlsIRcbiAgICBpZiAobWFuYWdlcnMubGVuZ3RoID4gMCkge1xuICAgICAgICBsaW5lcy5wdXNoKCcgICAgaW50ZXJmYWNlIE1hbmFnZXJOYW1lc1R5cGUgeycpO1xuICAgICAgICBmb3IgKGNvbnN0IG1hbmFnZXIgb2YgbWFuYWdlcnMpIHtcbiAgICAgICAgICAgIGxpbmVzLnB1c2goYCAgICAgICAgJHttYW5hZ2VyLmRlY29yYXRvck5hbWV9OiBzeW1ib2w7YCk7XG4gICAgICAgIH1cbiAgICAgICAgbGluZXMucHVzaCgnICAgIH0nKTtcbiAgICAgICAgbGluZXMucHVzaCgnJyk7XG4gICAgfVxuXG4gICAgLy8gTW9kZWwg57G75Z6L5pig5bCEXG4gICAgaWYgKG1vZGVscy5sZW5ndGggPiAwKSB7XG4gICAgICAgIGxpbmVzLnB1c2goJyAgICBpbnRlcmZhY2UgTW9kZWxUeXBlTWFwIHsnKTtcbiAgICAgICAgZm9yIChjb25zdCBtb2RlbCBvZiBtb2RlbHMpIHtcbiAgICAgICAgICAgIGxpbmVzLnB1c2goYCAgICAgICAgJyR7bW9kZWwuZGVjb3JhdG9yTmFtZX0nOiAke21vZGVsLmNsYXNzTmFtZX07YCk7XG4gICAgICAgIH1cbiAgICAgICAgbGluZXMucHVzaCgnICAgIH0nKTtcbiAgICAgICAgbGluZXMucHVzaCgnJyk7XG4gICAgfVxuXG4gICAgLy8gTWFuYWdlciDnsbvlnovmmKDlsIRcbiAgICBpZiAobWFuYWdlcnMubGVuZ3RoID4gMCkge1xuICAgICAgICBsaW5lcy5wdXNoKCcgICAgaW50ZXJmYWNlIE1hbmFnZXJUeXBlTWFwIHsnKTtcbiAgICAgICAgZm9yIChjb25zdCBtYW5hZ2VyIG9mIG1hbmFnZXJzKSB7XG4gICAgICAgICAgICBsaW5lcy5wdXNoKGAgICAgICAgICcke21hbmFnZXIuZGVjb3JhdG9yTmFtZX0nOiAke21hbmFnZXIuY2xhc3NOYW1lfTtgKTtcbiAgICAgICAgfVxuICAgICAgICBsaW5lcy5wdXNoKCcgICAgfScpO1xuICAgIH1cblxuICAgIGxpbmVzLnB1c2goJ30nKTtcbiAgICBsaW5lcy5wdXNoKCcnKTtcblxuICAgIHJldHVybiBsaW5lcy5qb2luKCdcXG4nKTtcbn1cblxuLy8g5Li75Ye95pWwXG5leHBvcnQgZnVuY3Rpb24gZ2VuZXJhdGVUeXBlcyhjb25maWc6IFR5cGVHZW5Db25maWcpOiB7IHN1Y2Nlc3M6IGJvb2xlYW47IG1lc3NhZ2U6IHN0cmluZyB9IHtcbiAgICB0cnkge1xuICAgICAgICBjb25zb2xlLmxvZygn8J+agCDlvIDlp4vnlJ/miJDnsbvlnovmmKDlsITmlofku7YuLi5cXG4nKTtcblxuICAgICAgICAvLyDmiavmj48gTW9kZWwg55uu5b2VXG4gICAgICAgIGNvbnNvbGUubG9nKGDwn5OCIOaJq+aPjyBNb2RlbCDnm67lvZU6ICR7Y29uZmlnLm1vZGVsRGlyfWApO1xuICAgICAgICBjb25zdCBtb2RlbEZpbGVzID0gc2NhbkRpcmVjdG9yeShjb25maWcubW9kZWxEaXIpO1xuICAgICAgICBjb25zdCBtb2RlbHMgPSBtb2RlbEZpbGVzXG4gICAgICAgICAgICAubWFwKHBhcnNlRmlsZSlcbiAgICAgICAgICAgIC5maWx0ZXIoKGl0ZW0pOiBpdGVtIGlzIFBhcnNlZEl0ZW0gPT4gaXRlbSAhPT0gbnVsbCAmJiBpdGVtLnR5cGUgPT09ICdtb2RlbCcpO1xuICAgICAgICBjb25zb2xlLmxvZyhgICAg5om+5YiwICR7bW9kZWxzLmxlbmd0aH0g5LiqIE1vZGVsXFxuYCk7XG5cbiAgICAgICAgLy8g5omr5o+PIE1hbmFnZXIg55uu5b2VXG4gICAgICAgIGNvbnNvbGUubG9nKGDwn5OCIOaJq+aPjyBNYW5hZ2VyIOebruW9lTogJHtjb25maWcubWFuYWdlckRpcn1gKTtcbiAgICAgICAgY29uc3QgbWFuYWdlckZpbGVzID0gc2NhbkRpcmVjdG9yeShjb25maWcubWFuYWdlckRpcik7XG4gICAgICAgIGNvbnN0IG1hbmFnZXJzID0gbWFuYWdlckZpbGVzXG4gICAgICAgICAgICAubWFwKHBhcnNlRmlsZSlcbiAgICAgICAgICAgIC5maWx0ZXIoKGl0ZW0pOiBpdGVtIGlzIFBhcnNlZEl0ZW0gPT4gaXRlbSAhPT0gbnVsbCAmJiBpdGVtLnR5cGUgPT09ICdtYW5hZ2VyJyk7XG4gICAgICAgIGNvbnNvbGUubG9nKGAgICDmib7liLAgJHttYW5hZ2Vycy5sZW5ndGh9IOS4qiBNYW5hZ2VyXFxuYCk7XG5cbiAgICAgICAgaWYgKG1vZGVscy5sZW5ndGggPT09IDAgJiYgbWFuYWdlcnMubGVuZ3RoID09PSAwKSB7XG4gICAgICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgICAgIHN1Y2Nlc3M6IGZhbHNlLFxuICAgICAgICAgICAgICAgIG1lc3NhZ2U6ICfimqDvuI8gIOacquaJvuWIsOS7u+S9lSBNb2RlbCDmiJYgTWFuYWdlcu+8jOi3s+i/h+eUn+aIkCdcbiAgICAgICAgICAgIH07XG4gICAgICAgIH1cblxuICAgICAgICAvLyDnlJ/miJDnsbvlnovmmKDlsIRcbiAgICAgICAgY29uc3QgY29udGVudCA9IGdlbmVyYXRlVHlwZU1hcChtb2RlbHMsIG1hbmFnZXJzLCBjb25maWcpO1xuXG4gICAgICAgIC8vIOehruS/nei+k+WHuuebruW9leWtmOWcqFxuICAgICAgICBjb25zdCBvdXRwdXREaXIgPSBwYXRoLmRpcm5hbWUoY29uZmlnLm91dHB1dEZpbGUpO1xuICAgICAgICBpZiAoIWZzLmV4aXN0c1N5bmMob3V0cHV0RGlyKSkge1xuICAgICAgICAgICAgZnMubWtkaXJTeW5jKG91dHB1dERpciwgeyByZWN1cnNpdmU6IHRydWUgfSk7XG4gICAgICAgIH1cblxuICAgICAgICAvLyDlhpnlhaXmlofku7ZcbiAgICAgICAgZnMud3JpdGVGaWxlU3luYyhjb25maWcub3V0cHV0RmlsZSwgY29udGVudCwgJ3V0Zi04Jyk7XG5cbiAgICAgICAgbGV0IG1lc3NhZ2UgPSBg4pyFIOexu+Wei+aYoOWwhOaWh+S7tuW3sueUn+aIkDogJHtjb25maWcub3V0cHV0RmlsZX1cXG5cXG5gO1xuICAgICAgICBtZXNzYWdlICs9ICfwn5OLIOeUn+aIkOeahOaYoOWwhDpcXG4nO1xuICAgICAgICBpZiAobW9kZWxzLmxlbmd0aCA+IDApIHtcbiAgICAgICAgICAgIG1lc3NhZ2UgKz0gJyAgIE1vZGVsczpcXG4nO1xuICAgICAgICAgICAgbW9kZWxzLmZvckVhY2gobSA9PiBtZXNzYWdlICs9IGAgICAgIC0gJHttLmRlY29yYXRvck5hbWV9IOKGkiAke20uY2xhc3NOYW1lfVxcbmApO1xuICAgICAgICB9XG4gICAgICAgIGlmIChtYW5hZ2Vycy5sZW5ndGggPiAwKSB7XG4gICAgICAgICAgICBtZXNzYWdlICs9ICcgICBNYW5hZ2VyczpcXG4nO1xuICAgICAgICAgICAgbWFuYWdlcnMuZm9yRWFjaChtID0+IG1lc3NhZ2UgKz0gYCAgICAgLSAke20uZGVjb3JhdG9yTmFtZX0g4oaSICR7bS5jbGFzc05hbWV9XFxuYCk7XG4gICAgICAgIH1cbiAgICAgICAgbWVzc2FnZSArPSAnXFxu8J+OiSDlrozmiJDvvIEnO1xuXG4gICAgICAgIGNvbnNvbGUubG9nKG1lc3NhZ2UpO1xuICAgICAgICByZXR1cm4geyBzdWNjZXNzOiB0cnVlLCBtZXNzYWdlIH07XG5cbiAgICB9IGNhdGNoIChlcnJvcikge1xuICAgICAgICBjb25zdCBlcnJvck1lc3NhZ2UgPSBg4p2MIOeUn+aIkOWksei0pTogJHtlcnJvciBpbnN0YW5jZW9mIEVycm9yID8gZXJyb3IubWVzc2FnZSA6IFN0cmluZyhlcnJvcil9YDtcbiAgICAgICAgY29uc29sZS5lcnJvcihlcnJvck1lc3NhZ2UpO1xuICAgICAgICByZXR1cm4geyBzdWNjZXNzOiBmYWxzZSwgbWVzc2FnZTogZXJyb3JNZXNzYWdlIH07XG4gICAgfVxufVxuXG4vLyDku47pobnnm67phY3nva7mlofku7bor7vlj5bphY3nva5cbmZ1bmN0aW9uIGxvYWRDb25maWdGcm9tUHJvamVjdChwcm9qZWN0UGF0aDogc3RyaW5nKTogVHlwZUdlbkNvbmZpZyB8IG51bGwge1xuICAgIC8vIOWwneivleS7jiBwYWNrYWdlLmpzb24g6K+75Y+W6YWN572uXG4gICAgY29uc3QgcGFja2FnZUpzb25QYXRoID0gcGF0aC5qb2luKHByb2plY3RQYXRoLCAncGFja2FnZS5qc29uJyk7XG4gICAgaWYgKGZzLmV4aXN0c1N5bmMocGFja2FnZUpzb25QYXRoKSkge1xuICAgICAgICB0cnkge1xuICAgICAgICAgICAgY29uc3QgcGFja2FnZUpzb24gPSBKU09OLnBhcnNlKGZzLnJlYWRGaWxlU3luYyhwYWNrYWdlSnNvblBhdGgsICd1dGYtOCcpKTtcbiAgICAgICAgICAgIGlmIChwYWNrYWdlSnNvbi5tZmxvd1R5cGVHZW4pIHtcbiAgICAgICAgICAgICAgICBjb25zdCBjb25maWcgPSBwYWNrYWdlSnNvbi5tZmxvd1R5cGVHZW47XG4gICAgICAgICAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgICAgICAgICAgbW9kZWxEaXI6IHBhdGgucmVzb2x2ZShwcm9qZWN0UGF0aCwgY29uZmlnLm1vZGVsRGlyIHx8ICdhc3NldHMvc3JjL21vZGVscycpLFxuICAgICAgICAgICAgICAgICAgICBtYW5hZ2VyRGlyOiBwYXRoLnJlc29sdmUocHJvamVjdFBhdGgsIGNvbmZpZy5tYW5hZ2VyRGlyIHx8ICdhc3NldHMvc3JjL21hbmFnZXJzJyksXG4gICAgICAgICAgICAgICAgICAgIG91dHB1dEZpbGU6IHBhdGgucmVzb2x2ZShwcm9qZWN0UGF0aCwgY29uZmlnLm91dHB1dEZpbGUgfHwgJ2Fzc2V0cy90eXBlcy9tYW5hZ2VyLW1vZGVsLW1hcHBpbmcuZC50cycpLFxuICAgICAgICAgICAgICAgICAgICBtb2R1bGVJbXBvcnRQYXRoOiBjb25maWcubW9kdWxlSW1wb3J0UGF0aCB8fCAnZHprY2MtbWZsb3cvY29yZSdcbiAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgfVxuICAgICAgICB9IGNhdGNoIChlcnJvcikge1xuICAgICAgICAgICAgY29uc29sZS53YXJuKCfml6Dms5Xor7vlj5YgcGFja2FnZS5qc29uIOmFjee9ricpO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgLy8g5bCd6K+V5LuO5Y2V54us55qE6YWN572u5paH5Lu26K+75Y+WXG4gICAgY29uc3QgY29uZmlnUGF0aCA9IHBhdGguam9pbihwcm9qZWN0UGF0aCwgJ21mbG93LmNvbmZpZy5qc29uJyk7XG4gICAgaWYgKGZzLmV4aXN0c1N5bmMoY29uZmlnUGF0aCkpIHtcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIGNvbnN0IGNvbmZpZyA9IEpTT04ucGFyc2UoZnMucmVhZEZpbGVTeW5jKGNvbmZpZ1BhdGgsICd1dGYtOCcpKTtcbiAgICAgICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICAgICAgbW9kZWxEaXI6IHBhdGgucmVzb2x2ZShwcm9qZWN0UGF0aCwgY29uZmlnLm1vZGVsRGlyIHx8ICdhc3NldHMvc3JjL21vZGVscycpLFxuICAgICAgICAgICAgICAgIG1hbmFnZXJEaXI6IHBhdGgucmVzb2x2ZShwcm9qZWN0UGF0aCwgY29uZmlnLm1hbmFnZXJEaXIgfHwgJ2Fzc2V0cy9zcmMvbWFuYWdlcnMnKSxcbiAgICAgICAgICAgICAgICBvdXRwdXRGaWxlOiBwYXRoLnJlc29sdmUocHJvamVjdFBhdGgsIGNvbmZpZy5vdXRwdXRGaWxlIHx8ICdhc3NldHMvdHlwZXMvY29yZS10eXBlcy5kLnRzJyksXG4gICAgICAgICAgICAgICAgbW9kdWxlSW1wb3J0UGF0aDogY29uZmlnLm1vZHVsZUltcG9ydFBhdGggfHwgJ2R6a2NjLW1mbG93L2NvcmUnXG4gICAgICAgICAgICB9O1xuICAgICAgICB9IGNhdGNoIChlcnJvcikge1xuICAgICAgICAgICAgY29uc29sZS53YXJuKCfml6Dms5Xor7vlj5YgbWZsb3cuY29uZmlnLmpzb24g6YWN572uJyk7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICAvLyDkvb/nlKjpu5jorqTphY3nva5cbiAgICByZXR1cm4ge1xuICAgICAgICBtb2RlbERpcjogcGF0aC5yZXNvbHZlKHByb2plY3RQYXRoLCAnYXNzZXRzL3NyYy9tb2RlbHMnKSxcbiAgICAgICAgbWFuYWdlckRpcjogcGF0aC5yZXNvbHZlKHByb2plY3RQYXRoLCAnYXNzZXRzL3NyYy9tYW5hZ2VycycpLFxuICAgICAgICBvdXRwdXRGaWxlOiBwYXRoLnJlc29sdmUocHJvamVjdFBhdGgsICdhc3NldHMvdHlwZXMvY29yZS10eXBlcy5kLnRzJyksXG4gICAgICAgIG1vZHVsZUltcG9ydFBhdGg6ICdkemtjYy1tZmxvdy9jb3JlJ1xuICAgIH07XG59XG5cbi8vIOe8lui+keWZqOaJqeWxleWFpeWPo1xuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIG9uR2VuZXJhdGVUeXBlcygpIHtcbiAgICB0cnkge1xuICAgICAgICAvLyDojrflj5bpobnnm67ot6/lvoRcbiAgICAgICAgY29uc3QgcHJvamVjdFBhdGggPSBFZGl0b3IuUHJvamVjdC5wYXRoO1xuICAgICAgICBjb25zb2xlLmxvZygn6aG555uu6Lev5b6EOicsIHByb2plY3RQYXRoKTtcblxuICAgICAgICAvLyDliqDovb3phY3nva5cbiAgICAgICAgY29uc3QgY29uZmlnID0gbG9hZENvbmZpZ0Zyb21Qcm9qZWN0KHByb2plY3RQYXRoKTtcbiAgICAgICAgaWYgKCFjb25maWcpIHtcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcign5peg5rOV5Yqg6L296YWN572uJyk7XG4gICAgICAgIH1cblxuICAgICAgICBjb25zb2xlLmxvZygn5L2/55So6YWN572uOicsIGNvbmZpZyk7XG5cbiAgICAgICAgLy8g55Sf5oiQ57G75Z6L5pig5bCEXG4gICAgICAgIGNvbnN0IHJlc3VsdCA9IGdlbmVyYXRlVHlwZXMoY29uZmlnKTtcblxuICAgICAgICBpZiAocmVzdWx0LnN1Y2Nlc3MpIHtcbiAgICAgICAgICAgIGF3YWl0IEVkaXRvci5EaWFsb2cuaW5mbygn57G75Z6L5pig5bCE55Sf5oiQ5oiQ5Yqf77yBJywge1xuICAgICAgICAgICAgICAgIGRldGFpbDogcmVzdWx0Lm1lc3NhZ2UsXG4gICAgICAgICAgICAgICAgYnV0dG9uczogWyfnoa7lrponXVxuICAgICAgICAgICAgfSk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBhd2FpdCBFZGl0b3IuRGlhbG9nLndhcm4oJ+exu+Wei+aYoOWwhOeUn+aIkOWksei0pScsIHtcbiAgICAgICAgICAgICAgICBkZXRhaWw6IHJlc3VsdC5tZXNzYWdlLFxuICAgICAgICAgICAgICAgIGJ1dHRvbnM6IFsn56Gu5a6aJ11cbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9XG4gICAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICAgICAgY29uc29sZS5lcnJvcign55Sf5oiQ57G75Z6L5pig5bCE5aSx6LSlOicsIGVycm9yKTtcbiAgICAgICAgYXdhaXQgRWRpdG9yLkRpYWxvZy5lcnJvcign55Sf5oiQ57G75Z6L5pig5bCE5aSx6LSlJywge1xuICAgICAgICAgICAgZGV0YWlsOiBlcnJvciBpbnN0YW5jZW9mIEVycm9yID8gZXJyb3IubWVzc2FnZSA6IFN0cmluZyhlcnJvciksXG4gICAgICAgICAgICBidXR0b25zOiBbJ+ehruWumiddXG4gICAgICAgIH0pO1xuICAgIH1cbn1cblxuIl19