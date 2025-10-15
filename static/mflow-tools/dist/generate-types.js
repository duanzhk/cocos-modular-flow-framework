"use strict";
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
exports.onProjectMenu = exports.generateTypes = void 0;
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
    lines.push(' * 通过 mflow-tools 工具重新生成，或运行 npm run generate:types');
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
    // Model 类型映射
    if (models.length > 0) {
        lines.push('    interface ModelTypeMap {');
        for (const model of models) {
            lines.push(`        [ModelNames.${model.decoratorName}]: ${model.className};`);
        }
        lines.push('    }');
        lines.push('');
    }
    // Manager 类型映射
    if (managers.length > 0) {
        lines.push('    interface ManagerTypeMap {');
        for (const manager of managers) {
            lines.push(`        [ManagerNames.${manager.decoratorName}]: ${manager.className};`);
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
                    outputFile: path.resolve(projectPath, config.outputFile || 'assets/types/core-types.d.ts'),
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
function onProjectMenu() {
    return [
        {
            label: 'i18n:mflow-tools.generate-types',
            enabled: true,
            async click() {
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
        }
    ];
}
exports.onProjectMenu = onProjectMenu;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZ2VuZXJhdGUtdHlwZXMuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi9zb3VyY2UvZ2VuZXJhdGUtdHlwZXMudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFBQSx1Q0FBeUI7QUFDekIsMkNBQTZCO0FBa0I3QixrQkFBa0I7QUFDbEIsU0FBUyxhQUFhLENBQUMsR0FBVztJQUM5QixJQUFJLENBQUMsRUFBRSxDQUFDLFVBQVUsQ0FBQyxHQUFHLENBQUMsRUFBRTtRQUNyQixPQUFPLENBQUMsSUFBSSxDQUFDLGNBQWMsR0FBRyxFQUFFLENBQUMsQ0FBQztRQUNsQyxPQUFPLEVBQUUsQ0FBQztLQUNiO0lBRUQsTUFBTSxLQUFLLEdBQWEsRUFBRSxDQUFDO0lBQzNCLE1BQU0sS0FBSyxHQUFHLEVBQUUsQ0FBQyxXQUFXLENBQUMsR0FBRyxDQUFDLENBQUM7SUFFbEMsS0FBSyxNQUFNLElBQUksSUFBSSxLQUFLLEVBQUU7UUFDdEIsTUFBTSxRQUFRLEdBQUcsSUFBSSxDQUFDLElBQUksQ0FBQyxHQUFHLEVBQUUsSUFBSSxDQUFDLENBQUM7UUFDdEMsTUFBTSxJQUFJLEdBQUcsRUFBRSxDQUFDLFFBQVEsQ0FBQyxRQUFRLENBQUMsQ0FBQztRQUVuQyxJQUFJLElBQUksQ0FBQyxXQUFXLEVBQUUsRUFBRTtZQUNwQixLQUFLLENBQUMsSUFBSSxDQUFDLEdBQUcsYUFBYSxDQUFDLFFBQVEsQ0FBQyxDQUFDLENBQUM7U0FDMUM7YUFBTSxJQUFJLElBQUksQ0FBQyxRQUFRLENBQUMsS0FBSyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsUUFBUSxDQUFDLE9BQU8sQ0FBQyxFQUFFO1lBQ3hELEtBQUssQ0FBQyxJQUFJLENBQUMsUUFBUSxDQUFDLENBQUM7U0FDeEI7S0FDSjtJQUVELE9BQU8sS0FBSyxDQUFDO0FBQ2pCLENBQUM7QUFFRCxjQUFjO0FBQ2QsU0FBUyxTQUFTLENBQUMsUUFBZ0I7SUFDL0IsTUFB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LE1BQU0sQ0FBQyxDQUFDO29CQUVyQyxJQUFJLE1BQU0sQ0FBQyxPQUFPLEVBQUU7d0JBQ2hCLE1BQU0sTUFBTSxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsV0FBVyxFQUFFOzRCQUNsQyxNQUFNLEVBQUUsTUFBTSxDQUFDLE9BQU87NEJBQ3RCLE9BQU8sRUFBRSxDQUFDLElBQUksQ0FBQzt5QkFDbEIsQ0FBQyxDQUFDO3FCQUNOO3lCQUFNO3dCQUNILE1BQU0sTUFBTSxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsVUFBVSxFQUFFOzRCQUNqQyxNQUFNLEVBQUUsTUFBTSxDQUFDLE9BQU87NEJBQ3RCLE9BQU8sRUFBRSxDQUFDLElBQUksQ0FBQzt5QkFDbEIsQ0FBQyxDQUFDO3FCQUNOO2lCQUNKO2dCQUFDLE9BQU8sS0FBSyxFQUFFO29CQUNaLE9BQU8sQ0FBQyxLQUFLLENBQUMsV0FBVyxFQUFFLEtBQUssQ0FBQyxDQUFDO29CQUNsQyxNQUFNLE1BQU0sQ0FBQyxNQUFNLENBQUMsS0FBSyxDQUFDLFVBQVUsRUFBRTt3QkFDbEMsTUFBTSxFQUFFLEtBQUssWUFBWSxLQUFLLENBQUMsQ0FBQyxDQUFDLEtBQUssQ0FBQyxPQUFPLENBQUMsQ0FBQyxDQUFDLE1BQU0sQ0FBQyxLQUFLLENBQUM7d0JBQzlELE9BQU8sRUFBRSxDQUFDLElBQUksQ0FBQztxQkFDbEIsQ0FBQyxDQUFDO2lCQUNOO1lBQ0wsQ0FBQztTQUNKO0tBQ0osQ0FBQztBQUNOLENBQUM7QUEzQ0Qsc0NBMkNDIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0ICogYXMgZnMgZnJvbSAnZnMnO1xuaW1wb3J0ICogYXMgcGF0aCBmcm9tICdwYXRoJztcblxuLy8g6YWN572u5o6l5Y+jXG5pbnRlcmZhY2UgVHlwZUdlbkNvbmZpZyB7XG4gICAgbW9kZWxEaXI6IHN0cmluZztcbiAgICBtYW5hZ2VyRGlyOiBzdHJpbmc7XG4gICAgb3V0cHV0RmlsZTogc3RyaW5nO1xuICAgIG1vZHVsZUltcG9ydFBhdGg6IHN0cmluZztcbn1cblxuLy8g6Kej5p6Q57uT5p6c5o6l5Y+jXG5pbnRlcmZhY2UgUGFyc2VkSXRlbSB7XG4gICAgdHlwZTogJ21vZGVsJyB8ICdtYW5hZ2VyJztcbiAgICBkZWNvcmF0b3JOYW1lOiBzdHJpbmc7XG4gICAgY2xhc3NOYW1lOiBzdHJpbmc7XG4gICAgZmlsZVBhdGg6IHN0cmluZztcbn1cblxuLy8g5omr5o+P55uu5b2V6I635Y+W5omA5pyJIC50cyDmlofku7ZcbmZ1bmN0aW9uIHNjYW5EaXJlY3RvcnkoZGlyOiBzdHJpbmcpOiBzdHJpbmdbXSB7XG4gICAgaWYgKCFmcy5leGlzdHNTeW5jKGRpcikpIHtcbiAgICAgICAgY29uc29sZS53YXJuKGDimqDvuI8gIOebruW9leS4jeWtmOWcqDogJHtkaXJ9YCk7XG4gICAgICAgIHJldHVybiBbXTtcbiAgICB9XG5cbiAgICBjb25zdCBmaWxlczogc3RyaW5nW10gPSBbXTtcbiAgICBjb25zdCBpdGVtcyA9IGZzLnJlYWRkaXJTeW5jKGRpcik7XG5cbiAgICBmb3IgKGNvbnN0IGl0ZW0gb2YgaXRlbXMpIHtcbiAgICAgICAgY29uc3QgZnVsbFBhdGggPSBwYXRoLmpvaW4oZGlyLCBpdGVtKTtcbiAgICAgICAgY29uc3Qgc3RhdCA9IGZzLnN0YXRTeW5jKGZ1bGxQYXRoKTtcblxuICAgICAgICBpZiAoc3RhdC5pc0RpcmVjdG9yeSgpKSB7XG4gICAgICAgICAgICBmaWxlcy5wdXNoKC4uLnNjYW5EaXJlY3RvcnkoZnVsbFBhdGgpKTtcbiAgICAgICAgfSBlbHNlIGlmIChpdGVtLmVuZHNXaXRoKCcudHMnKSAmJiAhaXRlbS5lbmRzV2l0aCgnLmQudHMnKSkge1xuICAgICAgICAgICAgZmlsZXMucHVzaChmdWxsUGF0aCk7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICByZXR1cm4gZmlsZXM7XG59XG5cbi8vIOino+aekOaWh+S7tuiOt+WPluijhemlsOWZqOS/oeaBr1xuZnVuY3Rpb24gcGFyc2VGaWxlKGZpbGVQYXRoOiBzdHJpbmcpOiBQYXJzZWRJdGVtIHwgbnVsbCB7XG4gICAgY29uc3QgY29udGVudCA9IGZzLnJlYWRGaWxlU3luYyhmaWxlUGF0aCwgJ3V0Zi04Jyk7XG4gICAgY29uc3QgZmlsZU5hbWUgPSBwYXRoLmJhc2VuYW1lKGZpbGVQYXRoLCAnLnRzJyk7XG5cbiAgICAvLyDljLnphY0gQG1vZGVsKCdOYW1lJykg5oiWIEBtb2RlbCgpXG4gICAgY29uc3QgbW9kZWxNYXRjaCA9IGNvbnRlbnQubWF0Y2goL0Btb2RlbFxccypcXChcXHMqWydcIl0oXFx3KylbJ1wiXVxccypcXCkvKTtcbiAgICBpZiAobW9kZWxNYXRjaCkge1xuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgdHlwZTogJ21vZGVsJyxcbiAgICAgICAgICAgIGRlY29yYXRvck5hbWU6IG1vZGVsTWF0Y2hbMV0sXG4gICAgICAgICAgICBjbGFzc05hbWU6IGZpbGVOYW1lLFxuICAgICAgICAgICAgZmlsZVBhdGg6IGZpbGVQYXRoXG4gICAgICAgIH07XG4gICAgfVxuXG4gICAgLy8g5Yy56YWNIEBtYW5hZ2VyKCdOYW1lJykg5oiWIEBtYW5hZ2VyKClcbiAgICBjb25zdCBtYW5hZ2VyTWF0Y2ggPSBjb250ZW50Lm1hdGNoKC9AbWFuYWdlclxccypcXChcXHMqWydcIl0oXFx3KylbJ1wiXVxccypcXCkvKTtcbiAgICBpZiAobWFuYWdlck1hdGNoKSB7XG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICB0eXBlOiAnbWFuYWdlcicsXG4gICAgICAgICAgICBkZWNvcmF0b3JOYW1lOiBtYW5hZ2VyTWF0Y2hbMV0sXG4gICAgICAgICAgICBjbGFzc05hbWU6IGZpbGVOYW1lLFxuICAgICAgICAgICAgZmlsZVBhdGg6IGZpbGVQYXRoXG4gICAgICAgIH07XG4gICAgfVxuXG4gICAgLy8g5aaC5p6c5rKh5pyJ5oyH5a6a5ZCN56ew77yM5L2/55So57G75ZCNXG4gICAgaWYgKGNvbnRlbnQuaW5jbHVkZXMoJ0Btb2RlbCgpJykpIHtcbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgIHR5cGU6ICdtb2RlbCcsXG4gICAgICAgICAgICBkZWNvcmF0b3JOYW1lOiBmaWxlTmFtZSxcbiAgICAgICAgICAgIGNsYXNzTmFtZTogZmlsZU5hbWUsXG4gICAgICAgICAgICBmaWxlUGF0aDogZmlsZVBhdGhcbiAgICAgICAgfTtcbiAgICB9XG5cbiAgICBpZiAoY29udGVudC5pbmNsdWRlcygnQG1hbmFnZXIoKScpKSB7XG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICB0eXBlOiAnbWFuYWdlcicsXG4gICAgICAgICAgICBkZWNvcmF0b3JOYW1lOiBmaWxlTmFtZSxcbiAgICAgICAgICAgIGNsYXNzTmFtZTogZmlsZU5hbWUsXG4gICAgICAgICAgICBmaWxlUGF0aDogZmlsZVBhdGhcbiAgICAgICAgfTtcbiAgICB9XG5cbiAgICByZXR1cm4gbnVsbDtcbn1cblxuLy8g55Sf5oiQ57G75Z6L5pig5bCE5Luj56CBXG5mdW5jdGlvbiBnZW5lcmF0ZVR5cGVNYXAobW9kZWxzOiBQYXJzZWRJdGVtW10sIG1hbmFnZXJzOiBQYXJzZWRJdGVtW10sIGNvbmZpZzogVHlwZUdlbkNvbmZpZyk6IHN0cmluZyB7XG4gICAgY29uc3QgbGluZXM6IHN0cmluZ1tdID0gW107XG5cbiAgICAvLyDmlofku7blpLTms6jph4pcbiAgICBsaW5lcy5wdXNoKCcvKionKTtcbiAgICBsaW5lcy5wdXNoKCcgKiDoh6rliqjnlJ/miJDnmoTnsbvlnovmmKDlsITmlofku7YnKTtcbiAgICBsaW5lcy5wdXNoKCcgKiDimqDvuI8g6K+35Yu/5omL5Yqo5L+u5pS55q2k5paH5Lu277yBJyk7XG4gICAgbGluZXMucHVzaCgnICog6YCa6L+HIG1mbG93LXRvb2xzIOW3peWFt+mHjeaWsOeUn+aIkO+8jOaIlui/kOihjCBucG0gcnVuIGdlbmVyYXRlOnR5cGVzJyk7XG4gICAgbGluZXMucHVzaCgnICovJyk7XG4gICAgbGluZXMucHVzaCgnJyk7XG5cbiAgICAvLyDlr7zlhaUgTW9kZWxcbiAgICBpZiAobW9kZWxzLmxlbmd0aCA+IDApIHtcbiAgICAgICAgbGluZXMucHVzaCgnLy8gTW9kZWwg5a+85YWlJyk7XG4gICAgICAgIGZvciAoY29uc3QgbW9kZWwgb2YgbW9kZWxzKSB7XG4gICAgICAgICAgICBjb25zdCByZWxhdGl2ZVBhdGggPSBwYXRoLnJlbGF0aXZlKFxuICAgICAgICAgICAgICAgIHBhdGguZGlybmFtZShjb25maWcub3V0cHV0RmlsZSksXG4gICAgICAgICAgICAgICAgbW9kZWwuZmlsZVBhdGhcbiAgICAgICAgICAgICkucmVwbGFjZSgvXFxcXC9nLCAnLycpLnJlcGxhY2UoJy50cycsICcnKTtcbiAgICAgICAgICAgIGxpbmVzLnB1c2goYGltcG9ydCB7ICR7bW9kZWwuY2xhc3NOYW1lfSB9IGZyb20gJyR7cmVsYXRpdmVQYXRofSc7YCk7XG4gICAgICAgIH1cbiAgICAgICAgbGluZXMucHVzaCgnJyk7XG4gICAgfVxuXG4gICAgLy8g5a+85YWlIE1hbmFnZXJcbiAgICBpZiAobWFuYWdlcnMubGVuZ3RoID4gMCkge1xuICAgICAgICBsaW5lcy5wdXNoKCcvLyBNYW5hZ2VyIOWvvOWFpScpO1xuICAgICAgICBmb3IgKGNvbnN0IG1hbmFnZXIgb2YgbWFuYWdlcnMpIHtcbiAgICAgICAgICAgIGNvbnN0IHJlbGF0aXZlUGF0aCA9IHBhdGgucmVsYXRpdmUoXG4gICAgICAgICAgICAgICAgcGF0aC5kaXJuYW1lKGNvbmZpZy5vdXRwdXRGaWxlKSxcbiAgICAgICAgICAgICAgICBtYW5hZ2VyLmZpbGVQYXRoXG4gICAgICAgICAgICApLnJlcGxhY2UoL1xcXFwvZywgJy8nKS5yZXBsYWNlKCcudHMnLCAnJyk7XG4gICAgICAgICAgICBsaW5lcy5wdXNoKGBpbXBvcnQgeyAke21hbmFnZXIuY2xhc3NOYW1lfSB9IGZyb20gJyR7cmVsYXRpdmVQYXRofSc7YCk7XG4gICAgICAgIH1cbiAgICAgICAgbGluZXMucHVzaCgnJyk7XG4gICAgfVxuXG4gICAgLy8g5a+85YWlIE5hbWVzXG4gICAgbGluZXMucHVzaCgnLy8gTmFtZXMg5a+85YWlJyk7XG4gICAgbGluZXMucHVzaChgaW1wb3J0IHsgTW9kZWxOYW1lcywgTWFuYWdlck5hbWVzIH0gZnJvbSAnJHtjb25maWcubW9kdWxlSW1wb3J0UGF0aH0nO2ApO1xuICAgIGxpbmVzLnB1c2goJycpO1xuXG4gICAgLy8g5aOw5piO5qih5Z2XXG4gICAgbGluZXMucHVzaChgZGVjbGFyZSBtb2R1bGUgJyR7Y29uZmlnLm1vZHVsZUltcG9ydFBhdGh9JyB7YCk7XG5cbiAgICAvLyBNb2RlbCDnsbvlnovmmKDlsIRcbiAgICBpZiAobW9kZWxzLmxlbmd0aCA+IDApIHtcbiAgICAgICAgbGluZXMucHVzaCgnICAgIGludGVyZmFjZSBNb2RlbFR5cGVNYXAgeycpO1xuICAgICAgICBmb3IgKGNvbnN0IG1vZGVsIG9mIG1vZGVscykge1xuICAgICAgICAgICAgbGluZXMucHVzaChgICAgICAgICBbTW9kZWxOYW1lcy4ke21vZGVsLmRlY29yYXRvck5hbWV9XTogJHttb2RlbC5jbGFzc05hbWV9O2ApO1xuICAgICAgICB9XG4gICAgICAgIGxpbmVzLnB1c2goJyAgICB9Jyk7XG4gICAgICAgIGxpbmVzLnB1c2goJycpO1xuICAgIH1cblxuICAgIC8vIE1hbmFnZXIg57G75Z6L5pig5bCEXG4gICAgaWYgKG1hbmFnZXJzLmxlbmd0aCA+IDApIHtcbiAgICAgICAgbGluZXMucHVzaCgnICAgIGludGVyZmFjZSBNYW5hZ2VyVHlwZU1hcCB7Jyk7XG4gICAgICAgIGZvciAoY29uc3QgbWFuYWdlciBvZiBtYW5hZ2Vycykge1xuICAgICAgICAgICAgbGluZXMucHVzaChgICAgICAgICBbTWFuYWdlck5hbWVzLiR7bWFuYWdlci5kZWNvcmF0b3JOYW1lfV06ICR7bWFuYWdlci5jbGFzc05hbWV9O2ApO1xuICAgICAgICB9XG4gICAgICAgIGxpbmVzLnB1c2goJyAgICB9Jyk7XG4gICAgfVxuXG4gICAgbGluZXMucHVzaCgnfScpO1xuICAgIGxpbmVzLnB1c2goJycpO1xuXG4gICAgcmV0dXJuIGxpbmVzLmpvaW4oJ1xcbicpO1xufVxuXG4vLyDkuLvlh73mlbBcbmV4cG9ydCBmdW5jdGlvbiBnZW5lcmF0ZVR5cGVzKGNvbmZpZzogVHlwZUdlbkNvbmZpZyk6IHsgc3VjY2VzczogYm9vbGVhbjsgbWVzc2FnZTogc3RyaW5nIH0ge1xuICAgIHRyeSB7XG4gICAgICAgIGNvbnNvbGUubG9nKCfwn5qAIOW8gOWni+eUn+aIkOexu+Wei+aYoOWwhOaWh+S7ti4uLlxcbicpO1xuXG4gICAgICAgIC8vIOaJq+aPjyBNb2RlbCDnm67lvZVcbiAgICAgICAgY29uc29sZS5sb2coYPCfk4Ig5omr5o+PIE1vZGVsIOebruW9lTogJHtjb25maWcubW9kZWxEaXJ9YCk7XG4gICAgICAgIGNvbnN0IG1vZGVsRmlsZXMgPSBzY2FuRGlyZWN0b3J5KGNvbmZpZy5tb2RlbERpcik7XG4gICAgICAgIGNvbnN0IG1vZGVscyA9IG1vZGVsRmlsZXNcbiAgICAgICAgICAgIC5tYXAocGFyc2VGaWxlKVxuICAgICAgICAgICAgLmZpbHRlcigoaXRlbSk6IGl0ZW0gaXMgUGFyc2VkSXRlbSA9PiBpdGVtICE9PSBudWxsICYmIGl0ZW0udHlwZSA9PT0gJ21vZGVsJyk7XG4gICAgICAgIGNvbnNvbGUubG9nKGAgICDmib7liLAgJHttb2RlbHMubGVuZ3RofSDkuKogTW9kZWxcXG5gKTtcblxuICAgICAgICAvLyDmiavmj48gTWFuYWdlciDnm67lvZVcbiAgICAgICAgY29uc29sZS5sb2coYPCfk4Ig5omr5o+PIE1hbmFnZXIg55uu5b2VOiAke2NvbmZpZy5tYW5hZ2VyRGlyfWApO1xuICAgICAgICBjb25zdCBtYW5hZ2VyRmlsZXMgPSBzY2FuRGlyZWN0b3J5KGNvbmZpZy5tYW5hZ2VyRGlyKTtcbiAgICAgICAgY29uc3QgbWFuYWdlcnMgPSBtYW5hZ2VyRmlsZXNcbiAgICAgICAgICAgIC5tYXAocGFyc2VGaWxlKVxuICAgICAgICAgICAgLmZpbHRlcigoaXRlbSk6IGl0ZW0gaXMgUGFyc2VkSXRlbSA9PiBpdGVtICE9PSBudWxsICYmIGl0ZW0udHlwZSA9PT0gJ21hbmFnZXInKTtcbiAgICAgICAgY29uc29sZS5sb2coYCAgIOaJvuWIsCAke21hbmFnZXJzLmxlbmd0aH0g5LiqIE1hbmFnZXJcXG5gKTtcblxuICAgICAgICBpZiAobW9kZWxzLmxlbmd0aCA9PT0gMCAmJiBtYW5hZ2Vycy5sZW5ndGggPT09IDApIHtcbiAgICAgICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICAgICAgc3VjY2VzczogZmFsc2UsXG4gICAgICAgICAgICAgICAgbWVzc2FnZTogJ+KaoO+4jyAg5pyq5om+5Yiw5Lu75L2VIE1vZGVsIOaIliBNYW5hZ2Vy77yM6Lez6L+H55Sf5oiQJ1xuICAgICAgICAgICAgfTtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIOeUn+aIkOexu+Wei+aYoOWwhFxuICAgICAgICBjb25zdCBjb250ZW50ID0gZ2VuZXJhdGVUeXBlTWFwKG1vZGVscywgbWFuYWdlcnMsIGNvbmZpZyk7XG5cbiAgICAgICAgLy8g56Gu5L+d6L6T5Ye655uu5b2V5a2Y5ZyoXG4gICAgICAgIGNvbnN0IG91dHB1dERpciA9IHBhdGguZGlybmFtZShjb25maWcub3V0cHV0RmlsZSk7XG4gICAgICAgIGlmICghZnMuZXhpc3RzU3luYyhvdXRwdXREaXIpKSB7XG4gICAgICAgICAgICBmcy5ta2RpclN5bmMob3V0cHV0RGlyLCB7IHJlY3Vyc2l2ZTogdHJ1ZSB9KTtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIOWGmeWFpeaWh+S7tlxuICAgICAgICBmcy53cml0ZUZpbGVTeW5jKGNvbmZpZy5vdXRwdXRGaWxlLCBjb250ZW50LCAndXRmLTgnKTtcblxuICAgICAgICBsZXQgbWVzc2FnZSA9IGDinIUg57G75Z6L5pig5bCE5paH5Lu25bey55Sf5oiQOiAke2NvbmZpZy5vdXRwdXRGaWxlfVxcblxcbmA7XG4gICAgICAgIG1lc3NhZ2UgKz0gJ/Cfk4sg55Sf5oiQ55qE5pig5bCEOlxcbic7XG4gICAgICAgIGlmIChtb2RlbHMubGVuZ3RoID4gMCkge1xuICAgICAgICAgICAgbWVzc2FnZSArPSAnICAgTW9kZWxzOlxcbic7XG4gICAgICAgICAgICBtb2RlbHMuZm9yRWFjaChtID0+IG1lc3NhZ2UgKz0gYCAgICAgLSAke20uZGVjb3JhdG9yTmFtZX0g4oaSICR7bS5jbGFzc05hbWV9XFxuYCk7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKG1hbmFnZXJzLmxlbmd0aCA+IDApIHtcbiAgICAgICAgICAgIG1lc3NhZ2UgKz0gJyAgIE1hbmFnZXJzOlxcbic7XG4gICAgICAgICAgICBtYW5hZ2Vycy5mb3JFYWNoKG0gPT4gbWVzc2FnZSArPSBgICAgICAtICR7bS5kZWNvcmF0b3JOYW1lfSDihpIgJHttLmNsYXNzTmFtZX1cXG5gKTtcbiAgICAgICAgfVxuICAgICAgICBtZXNzYWdlICs9ICdcXG7wn46JIOWujOaIkO+8gSc7XG5cbiAgICAgICAgY29uc29sZS5sb2cobWVzc2FnZSk7XG4gICAgICAgIHJldHVybiB7IHN1Y2Nlc3M6IHRydWUsIG1lc3NhZ2UgfTtcblxuICAgIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgICAgIGNvbnN0IGVycm9yTWVzc2FnZSA9IGDinYwg55Sf5oiQ5aSx6LSlOiAke2Vycm9yIGluc3RhbmNlb2YgRXJyb3IgPyBlcnJvci5tZXNzYWdlIDogU3RyaW5nKGVycm9yKX1gO1xuICAgICAgICBjb25zb2xlLmVycm9yKGVycm9yTWVzc2FnZSk7XG4gICAgICAgIHJldHVybiB7IHN1Y2Nlc3M6IGZhbHNlLCBtZXNzYWdlOiBlcnJvck1lc3NhZ2UgfTtcbiAgICB9XG59XG5cbi8vIOS7jumhueebrumFjee9ruaWh+S7tuivu+WPlumFjee9rlxuZnVuY3Rpb24gbG9hZENvbmZpZ0Zyb21Qcm9qZWN0KHByb2plY3RQYXRoOiBzdHJpbmcpOiBUeXBlR2VuQ29uZmlnIHwgbnVsbCB7XG4gICAgLy8g5bCd6K+V5LuOIHBhY2thZ2UuanNvbiDor7vlj5bphY3nva5cbiAgICBjb25zdCBwYWNrYWdlSnNvblBhdGggPSBwYXRoLmpvaW4ocHJvamVjdFBhdGgsICdwYWNrYWdlLmpzb24nKTtcbiAgICBpZiAoZnMuZXhpc3RzU3luYyhwYWNrYWdlSnNvblBhdGgpKSB7XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgICBjb25zdCBwYWNrYWdlSnNvbiA9IEpTT04ucGFyc2UoZnMucmVhZEZpbGVTeW5jKHBhY2thZ2VKc29uUGF0aCwgJ3V0Zi04JykpO1xuICAgICAgICAgICAgaWYgKHBhY2thZ2VKc29uLm1mbG93VHlwZUdlbikge1xuICAgICAgICAgICAgICAgIGNvbnN0IGNvbmZpZyA9IHBhY2thZ2VKc29uLm1mbG93VHlwZUdlbjtcbiAgICAgICAgICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgICAgICAgICBtb2RlbERpcjogcGF0aC5yZXNvbHZlKHByb2plY3RQYXRoLCBjb25maWcubW9kZWxEaXIgfHwgJ2Fzc2V0cy9zcmMvbW9kZWxzJyksXG4gICAgICAgICAgICAgICAgICAgIG1hbmFnZXJEaXI6IHBhdGgucmVzb2x2ZShwcm9qZWN0UGF0aCwgY29uZmlnLm1hbmFnZXJEaXIgfHwgJ2Fzc2V0cy9zcmMvbWFuYWdlcnMnKSxcbiAgICAgICAgICAgICAgICAgICAgb3V0cHV0RmlsZTogcGF0aC5yZXNvbHZlKHByb2plY3RQYXRoLCBjb25maWcub3V0cHV0RmlsZSB8fCAnYXNzZXRzL3R5cGVzL2NvcmUtdHlwZXMuZC50cycpLFxuICAgICAgICAgICAgICAgICAgICBtb2R1bGVJbXBvcnRQYXRoOiBjb25maWcubW9kdWxlSW1wb3J0UGF0aCB8fCAnZHprY2MtbWZsb3cvY29yZSdcbiAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgfVxuICAgICAgICB9IGNhdGNoIChlcnJvcikge1xuICAgICAgICAgICAgY29uc29sZS53YXJuKCfml6Dms5Xor7vlj5YgcGFja2FnZS5qc29uIOmFjee9ricpO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgLy8g5bCd6K+V5LuO5Y2V54us55qE6YWN572u5paH5Lu26K+75Y+WXG4gICAgY29uc3QgY29uZmlnUGF0aCA9IHBhdGguam9pbihwcm9qZWN0UGF0aCwgJ21mbG93LmNvbmZpZy5qc29uJyk7XG4gICAgaWYgKGZzLmV4aXN0c1N5bmMoY29uZmlnUGF0aCkpIHtcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIGNvbnN0IGNvbmZpZyA9IEpTT04ucGFyc2UoZnMucmVhZEZpbGVTeW5jKGNvbmZpZ1BhdGgsICd1dGYtOCcpKTtcbiAgICAgICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICAgICAgbW9kZWxEaXI6IHBhdGgucmVzb2x2ZShwcm9qZWN0UGF0aCwgY29uZmlnLm1vZGVsRGlyIHx8ICdhc3NldHMvc3JjL21vZGVscycpLFxuICAgICAgICAgICAgICAgIG1hbmFnZXJEaXI6IHBhdGgucmVzb2x2ZShwcm9qZWN0UGF0aCwgY29uZmlnLm1hbmFnZXJEaXIgfHwgJ2Fzc2V0cy9zcmMvbWFuYWdlcnMnKSxcbiAgICAgICAgICAgICAgICBvdXRwdXRGaWxlOiBwYXRoLnJlc29sdmUocHJvamVjdFBhdGgsIGNvbmZpZy5vdXRwdXRGaWxlIHx8ICdhc3NldHMvdHlwZXMvY29yZS10eXBlcy5kLnRzJyksXG4gICAgICAgICAgICAgICAgbW9kdWxlSW1wb3J0UGF0aDogY29uZmlnLm1vZHVsZUltcG9ydFBhdGggfHwgJ2R6a2NjLW1mbG93L2NvcmUnXG4gICAgICAgICAgICB9O1xuICAgICAgICB9IGNhdGNoIChlcnJvcikge1xuICAgICAgICAgICAgY29uc29sZS53YXJuKCfml6Dms5Xor7vlj5YgbWZsb3cuY29uZmlnLmpzb24g6YWN572uJyk7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICAvLyDkvb/nlKjpu5jorqTphY3nva5cbiAgICByZXR1cm4ge1xuICAgICAgICBtb2RlbERpcjogcGF0aC5yZXNvbHZlKHByb2plY3RQYXRoLCAnYXNzZXRzL3NyYy9tb2RlbHMnKSxcbiAgICAgICAgbWFuYWdlckRpcjogcGF0aC5yZXNvbHZlKHByb2plY3RQYXRoLCAnYXNzZXRzL3NyYy9tYW5hZ2VycycpLFxuICAgICAgICBvdXRwdXRGaWxlOiBwYXRoLnJlc29sdmUocHJvamVjdFBhdGgsICdhc3NldHMvdHlwZXMvY29yZS10eXBlcy5kLnRzJyksXG4gICAgICAgIG1vZHVsZUltcG9ydFBhdGg6ICdkemtjYy1tZmxvdy9jb3JlJ1xuICAgIH07XG59XG5cbi8vIOe8lui+keWZqOaJqeWxleWFpeWPo1xuZXhwb3J0IGZ1bmN0aW9uIG9uUHJvamVjdE1lbnUoKSB7XG4gICAgcmV0dXJuIFtcbiAgICAgICAge1xuICAgICAgICAgICAgbGFiZWw6ICdpMThuOm1mbG93LXRvb2xzLmdlbmVyYXRlLXR5cGVzJyxcbiAgICAgICAgICAgIGVuYWJsZWQ6IHRydWUsXG4gICAgICAgICAgICBhc3luYyBjbGljaygpIHtcbiAgICAgICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICAgICAgICAvLyDojrflj5bpobnnm67ot6/lvoRcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgcHJvamVjdFBhdGggPSBFZGl0b3IuUHJvamVjdC5wYXRoO1xuICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmxvZygn6aG555uu6Lev5b6EOicsIHByb2plY3RQYXRoKTtcblxuICAgICAgICAgICAgICAgICAgICAvLyDliqDovb3phY3nva5cbiAgICAgICAgICAgICAgICAgICAgY29uc3QgY29uZmlnID0gbG9hZENvbmZpZ0Zyb21Qcm9qZWN0KHByb2plY3RQYXRoKTtcbiAgICAgICAgICAgICAgICAgICAgaWYgKCFjb25maWcpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcign5peg5rOV5Yqg6L296YWN572uJyk7XG4gICAgICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmxvZygn5L2/55So6YWN572uOicsIGNvbmZpZyk7XG5cbiAgICAgICAgICAgICAgICAgICAgLy8g55Sf5oiQ57G75Z6L5pig5bCEXG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IHJlc3VsdCA9IGdlbmVyYXRlVHlwZXMoY29uZmlnKTtcblxuICAgICAgICAgICAgICAgICAgICBpZiAocmVzdWx0LnN1Y2Nlc3MpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGF3YWl0IEVkaXRvci5EaWFsb2cuaW5mbygn57G75Z6L5pig5bCE55Sf5oiQ5oiQ5Yqf77yBJywge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGRldGFpbDogcmVzdWx0Lm1lc3NhZ2UsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgYnV0dG9uczogWyfnoa7lrponXVxuICAgICAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBhd2FpdCBFZGl0b3IuRGlhbG9nLndhcm4oJ+exu+Wei+aYoOWwhOeUn+aIkOWksei0pScsIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBkZXRhaWw6IHJlc3VsdC5tZXNzYWdlLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGJ1dHRvbnM6IFsn56Gu5a6aJ11cbiAgICAgICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICAgICAgICAgICAgICAgICAgY29uc29sZS5lcnJvcign55Sf5oiQ57G75Z6L5pig5bCE5aSx6LSlOicsIGVycm9yKTtcbiAgICAgICAgICAgICAgICAgICAgYXdhaXQgRWRpdG9yLkRpYWxvZy5lcnJvcign55Sf5oiQ57G75Z6L5pig5bCE5aSx6LSlJywge1xuICAgICAgICAgICAgICAgICAgICAgICAgZGV0YWlsOiBlcnJvciBpbnN0YW5jZW9mIEVycm9yID8gZXJyb3IubWVzc2FnZSA6IFN0cmluZyhlcnJvciksXG4gICAgICAgICAgICAgICAgICAgICAgICBidXR0b25zOiBbJ+ehruWumiddXG4gICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIF07XG59XG5cbiJdfQ==