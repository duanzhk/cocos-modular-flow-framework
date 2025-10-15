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
    lines.push(' * 重新生成：在 Cocos Creator 编辑器中运行 mflow-tools -> generate-types');
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZ2VuZXJhdGUtdHlwZXMuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi9zb3VyY2UvZ2VuZXJhdGUtdHlwZXMudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IjtBQUFBOzs7R0FHRzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFFSCx1Q0FBeUI7QUFDekIsMkNBQTZCO0FBa0I3QixrQkFBa0I7QUFDbEIsU0FBUyxhQUFhLENBQUMsR0FBVztJQUM5QixJQUFJLENBQUMsRUFBRSxDQUFDLFVBQVUsQ0FBQyxHQUFHLENBQUMsRUFBRTtRQUNyQixPQUFPLENBQUMsSUFBSSxDQUFDLGNBQWMsR0FBRyxFQUFFLENBQUMsQ0FBQztRQUNsQyxPQUFPLEVBQUUsQ0FBQztLQUNiO0lBRUQsTUFBTSxLQUFLLEdBQWEsRUFBRSxDQUFDO0lBQzNCLE1BQU0sS0FBSyxHQUFHLEVBQUUsQ0FBQyxXQUFXLENBQUMsR0FBRyxDQUFDLENBQUM7SUFFbEMsS0FBSyxNQUFNLElBQUksSUFBSSxLQUFLLEVBQUU7UUFDdEIsTUFBTSxRQUFRLEdBQUcsSUFBSSxDQUFDLElBQUksQ0FBQyxHQUFHLEVBQUUsSUFBSSxDQUFDLENBQUM7UUFDdEMsTUFBTSxJQUFJLEdBQUcsRUFBRSxDQUFDLFFBQVEsQ0FBQyxRQUFRLENBQUMsQ0FBQztRQUVuQyxJQUFJLElBQUksQ0FBQyxXQUFXLEVBQUUsRUFBRTtZQUNwQixLQUFLLENBQUMsSUFBSSxDQUFDLEdBQUcsYUFBYSxDQUFDLFFBQVEsQ0FBQyxDQUFDLENBQUM7U0FDMUM7YUFBTSxJQUFJLElBQUksQ0FBQyxRQUFRLENBQUMsS0FBSyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsUUFBUSxDQUFDLE9BQU8sQ0FBQyxFQUFFO1lBQ3hELEtBQUssQ0FBQyxJQUFJLENBQUMsUUFBUSxDQUFDLENBQUM7U0FDeEI7S0FDSjtJQUVELE9BQU8sS0FBSyxDQUFDO0FBQ2pCLENBQUM7QUFFRCxjQUFjO0FBQ2QsU0FBUyxTQUFTLENBQUMsUUFB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QUFDLElBQUksQ0FBQyxXQUFXLEVBQUU7Z0JBQ2xDLE1BQU0sRUFBRSxNQUFNLENBQUMsT0FBTztnQkFDdEIsT0FBTyxFQUFFLENBQUMsSUFBSSxDQUFDO2FBQ2xCLENBQUMsQ0FBQztTQUNOO2FBQU07WUFDSCxNQUFNLE1BQU0sQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDLFVBQVUsRUFBRTtnQkFDakMsTUFBTSxFQUFFLE1BQU0sQ0FBQyxPQUFPO2dCQUN0QixPQUFPLEVBQUUsQ0FBQyxJQUFJLENBQUM7YUFDbEIsQ0FBQyxDQUFDO1NBQ047S0FDSjtJQUFDLE9BQU8sS0FBSyxFQUFFO1FBQ1osT0FBTyxDQUFDLEtBQUssQ0FBQyxXQUFXLEVBQUUsS0FBSyxDQUFDLENBQUM7UUFDbEMsTUFBTSxNQUFNLENBQUMsTUFBTSxDQUFDLEtBQUssQ0FBQyxVQUFVLEVBQUU7WUFDbEMsTUFBTSxFQUFFLEtBQUssWUFBWSxLQUFLLENBQUMsQ0FBQyxDQUFDLEtBQUssQ0FBQyxPQUFPLENBQUMsQ0FBQyxDQUFDLE1BQU0sQ0FBQyxLQUFLLENBQUM7WUFDOUQsT0FBTyxFQUFFLENBQUMsSUFBSSxDQUFDO1NBQ2xCLENBQUMsQ0FBQztLQUNOO0FBQ0wsQ0FBQztBQW5DRCwwQ0FtQ0MiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEBlbiBHZW5lcmF0ZSB0eXBlIG1hcCBmaWxlIGZvciB0aGUgY2xhc3NlcyBkZWNvcmF0ZWQgd2l0aCBAbW9kZWwoKSBvciBAbWFuYWdlcigpXG4gKiBAemgg5Li66KKr6KOF6aWw5Zmo6KOF6aWwKEBtb2RlbCgp5oiWQG1hbmFnZXIoKSnnmoTnsbvnlJ/miJDnsbvlnovmmKDlsITmlofku7bvvIzlrp7njrDlrozmlbTnmoTnsbvlnovmjqjmlq3mlK/mjIHjgIJcbiAqL1xuXG5pbXBvcnQgKiBhcyBmcyBmcm9tICdmcyc7XG5pbXBvcnQgKiBhcyBwYXRoIGZyb20gJ3BhdGgnO1xuXG4vLyDphY3nva7mjqXlj6NcbmludGVyZmFjZSBUeXBlR2VuQ29uZmlnIHtcbiAgICBtb2RlbERpcjogc3RyaW5nO1xuICAgIG1hbmFnZXJEaXI6IHN0cmluZztcbiAgICBvdXRwdXRGaWxlOiBzdHJpbmc7XG4gICAgbW9kdWxlSW1wb3J0UGF0aDogc3RyaW5nO1xufVxuXG4vLyDop6PmnpDnu5PmnpzmjqXlj6NcbmludGVyZmFjZSBQYXJzZWRJdGVtIHtcbiAgICB0eXBlOiAnbW9kZWwnIHwgJ21hbmFnZXInO1xuICAgIGRlY29yYXRvck5hbWU6IHN0cmluZztcbiAgICBjbGFzc05hbWU6IHN0cmluZztcbiAgICBmaWxlUGF0aDogc3RyaW5nO1xufVxuXG4vLyDmiavmj4/nm67lvZXojrflj5bmiYDmnIkgLnRzIOaWh+S7tlxuZnVuY3Rpb24gc2NhbkRpcmVjdG9yeShkaXI6IHN0cmluZyk6IHN0cmluZ1tdIHtcbiAgICBpZiAoIWZzLmV4aXN0c1N5bmMoZGlyKSkge1xuICAgICAgICBjb25zb2xlLndhcm4oYOKaoO+4jyAg55uu5b2V5LiN5a2Y5ZyoOiAke2Rpcn1gKTtcbiAgICAgICAgcmV0dXJuIFtdO1xuICAgIH1cblxuICAgIGNvbnN0IGZpbGVzOiBzdHJpbmdbXSA9IFtdO1xuICAgIGNvbnN0IGl0ZW1zID0gZnMucmVhZGRpclN5bmMoZGlyKTtcblxuICAgIGZvciAoY29uc3QgaXRlbSBvZiBpdGVtcykge1xuICAgICAgICBjb25zdCBmdWxsUGF0aCA9IHBhdGguam9pbihkaXIsIGl0ZW0pO1xuICAgICAgICBjb25zdCBzdGF0ID0gZnMuc3RhdFN5bmMoZnVsbFBhdGgpO1xuXG4gICAgICAgIGlmIChzdGF0LmlzRGlyZWN0b3J5KCkpIHtcbiAgICAgICAgICAgIGZpbGVzLnB1c2goLi4uc2NhbkRpcmVjdG9yeShmdWxsUGF0aCkpO1xuICAgICAgICB9IGVsc2UgaWYgKGl0ZW0uZW5kc1dpdGgoJy50cycpICYmICFpdGVtLmVuZHNXaXRoKCcuZC50cycpKSB7XG4gICAgICAgICAgICBmaWxlcy5wdXNoKGZ1bGxQYXRoKTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIHJldHVybiBmaWxlcztcbn1cblxuLy8g6Kej5p6Q5paH5Lu26I635Y+W6KOF6aWw5Zmo5L+h5oGvXG5mdW5jdGlvbiBwYXJzZUZpbGUoZmlsZVBhdGg6IHN0cmluZyk6IFBhcnNlZEl0ZW0gfCBudWxsIHtcbiAgICBjb25zdCBjb250ZW50ID0gZnMucmVhZEZpbGVTeW5jKGZpbGVQYXRoLCAndXRmLTgnKTtcbiAgICBjb25zdCBmaWxlTmFtZSA9IHBhdGguYmFzZW5hbWUoZmlsZVBhdGgsICcudHMnKTtcblxuICAgIC8vIOWMuemFjSBAbW9kZWwoJ05hbWUnKSDmiJYgQG1vZGVsKClcbiAgICBjb25zdCBtb2RlbE1hdGNoID0gY29udGVudC5tYXRjaCgvQG1vZGVsXFxzKlxcKFxccypbJ1wiXShcXHcrKVsnXCJdXFxzKlxcKS8pO1xuICAgIGlmIChtb2RlbE1hdGNoKSB7XG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICB0eXBlOiAnbW9kZWwnLFxuICAgICAgICAgICAgZGVjb3JhdG9yTmFtZTogbW9kZWxNYXRjaFsxXSxcbiAgICAgICAgICAgIGNsYXNzTmFtZTogZmlsZU5hbWUsXG4gICAgICAgICAgICBmaWxlUGF0aDogZmlsZVBhdGhcbiAgICAgICAgfTtcbiAgICB9XG5cbiAgICAvLyDljLnphY0gQG1hbmFnZXIoJ05hbWUnKSDmiJYgQG1hbmFnZXIoKVxuICAgIGNvbnN0IG1hbmFnZXJNYXRjaCA9IGNvbnRlbnQubWF0Y2goL0BtYW5hZ2VyXFxzKlxcKFxccypbJ1wiXShcXHcrKVsnXCJdXFxzKlxcKS8pO1xuICAgIGlmIChtYW5hZ2VyTWF0Y2gpIHtcbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgIHR5cGU6ICdtYW5hZ2VyJyxcbiAgICAgICAgICAgIGRlY29yYXRvck5hbWU6IG1hbmFnZXJNYXRjaFsxXSxcbiAgICAgICAgICAgIGNsYXNzTmFtZTogZmlsZU5hbWUsXG4gICAgICAgICAgICBmaWxlUGF0aDogZmlsZVBhdGhcbiAgICAgICAgfTtcbiAgICB9XG5cbiAgICAvLyDlpoLmnpzmsqHmnInmjIflrprlkI3np7DvvIzkvb/nlKjnsbvlkI1cbiAgICBpZiAoY29udGVudC5pbmNsdWRlcygnQG1vZGVsKCknKSkge1xuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgdHlwZTogJ21vZGVsJyxcbiAgICAgICAgICAgIGRlY29yYXRvck5hbWU6IGZpbGVOYW1lLFxuICAgICAgICAgICAgY2xhc3NOYW1lOiBmaWxlTmFtZSxcbiAgICAgICAgICAgIGZpbGVQYXRoOiBmaWxlUGF0aFxuICAgICAgICB9O1xuICAgIH1cblxuICAgIGlmIChjb250ZW50LmluY2x1ZGVzKCdAbWFuYWdlcigpJykpIHtcbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgIHR5cGU6ICdtYW5hZ2VyJyxcbiAgICAgICAgICAgIGRlY29yYXRvck5hbWU6IGZpbGVOYW1lLFxuICAgICAgICAgICAgY2xhc3NOYW1lOiBmaWxlTmFtZSxcbiAgICAgICAgICAgIGZpbGVQYXRoOiBmaWxlUGF0aFxuICAgICAgICB9O1xuICAgIH1cblxuICAgIHJldHVybiBudWxsO1xufVxuXG4vLyDnlJ/miJDnsbvlnovmmKDlsITku6PnoIFcbmZ1bmN0aW9uIGdlbmVyYXRlVHlwZU1hcChtb2RlbHM6IFBhcnNlZEl0ZW1bXSwgbWFuYWdlcnM6IFBhcnNlZEl0ZW1bXSwgY29uZmlnOiBUeXBlR2VuQ29uZmlnKTogc3RyaW5nIHtcbiAgICBjb25zdCBsaW5lczogc3RyaW5nW10gPSBbXTtcblxuICAgIC8vIOaWh+S7tuWktOazqOmHilxuICAgIGxpbmVzLnB1c2goJy8qKicpO1xuICAgIGxpbmVzLnB1c2goJyAqIOiHquWKqOeUn+aIkOeahOexu+Wei+aYoOWwhOaWh+S7ticpO1xuICAgIGxpbmVzLnB1c2goJyAqIOKaoO+4jyDor7fli7/miYvliqjkv67mlLnmraTmlofku7bvvIEnKTtcbiAgICBsaW5lcy5wdXNoKCcgKiDph43mlrDnlJ/miJDvvJrlnKggQ29jb3MgQ3JlYXRvciDnvJbovpHlmajkuK3ov5DooYwgbWZsb3ctdG9vbHMgLT4gZ2VuZXJhdGUtdHlwZXMnKTtcbiAgICBsaW5lcy5wdXNoKCcgKi8nKTtcbiAgICBsaW5lcy5wdXNoKCcnKTtcblxuICAgIC8vIOWvvOWFpSBNb2RlbFxuICAgIGlmIChtb2RlbHMubGVuZ3RoID4gMCkge1xuICAgICAgICBsaW5lcy5wdXNoKCcvLyBNb2RlbCDlr7zlhaUnKTtcbiAgICAgICAgZm9yIChjb25zdCBtb2RlbCBvZiBtb2RlbHMpIHtcbiAgICAgICAgICAgIGNvbnN0IHJlbGF0aXZlUGF0aCA9IHBhdGgucmVsYXRpdmUoXG4gICAgICAgICAgICAgICAgcGF0aC5kaXJuYW1lKGNvbmZpZy5vdXRwdXRGaWxlKSxcbiAgICAgICAgICAgICAgICBtb2RlbC5maWxlUGF0aFxuICAgICAgICAgICAgKS5yZXBsYWNlKC9cXFxcL2csICcvJykucmVwbGFjZSgnLnRzJywgJycpO1xuICAgICAgICAgICAgbGluZXMucHVzaChgaW1wb3J0IHsgJHttb2RlbC5jbGFzc05hbWV9IH0gZnJvbSAnJHtyZWxhdGl2ZVBhdGh9JztgKTtcbiAgICAgICAgfVxuICAgICAgICBsaW5lcy5wdXNoKCcnKTtcbiAgICB9XG5cbiAgICAvLyDlr7zlhaUgTWFuYWdlclxuICAgIGlmIChtYW5hZ2Vycy5sZW5ndGggPiAwKSB7XG4gICAgICAgIGxpbmVzLnB1c2goJy8vIE1hbmFnZXIg5a+85YWlJyk7XG4gICAgICAgIGZvciAoY29uc3QgbWFuYWdlciBvZiBtYW5hZ2Vycykge1xuICAgICAgICAgICAgY29uc3QgcmVsYXRpdmVQYXRoID0gcGF0aC5yZWxhdGl2ZShcbiAgICAgICAgICAgICAgICBwYXRoLmRpcm5hbWUoY29uZmlnLm91dHB1dEZpbGUpLFxuICAgICAgICAgICAgICAgIG1hbmFnZXIuZmlsZVBhdGhcbiAgICAgICAgICAgICkucmVwbGFjZSgvXFxcXC9nLCAnLycpLnJlcGxhY2UoJy50cycsICcnKTtcbiAgICAgICAgICAgIGxpbmVzLnB1c2goYGltcG9ydCB7ICR7bWFuYWdlci5jbGFzc05hbWV9IH0gZnJvbSAnJHtyZWxhdGl2ZVBhdGh9JztgKTtcbiAgICAgICAgfVxuICAgICAgICBsaW5lcy5wdXNoKCcnKTtcbiAgICB9XG5cbiAgICAvLyDlr7zlhaUgTmFtZXNcbiAgICBsaW5lcy5wdXNoKCcvLyBOYW1lcyDlr7zlhaUnKTtcbiAgICBsaW5lcy5wdXNoKGBpbXBvcnQgeyBNb2RlbE5hbWVzLCBNYW5hZ2VyTmFtZXMgfSBmcm9tICcke2NvbmZpZy5tb2R1bGVJbXBvcnRQYXRofSc7YCk7XG4gICAgbGluZXMucHVzaCgnJyk7XG5cbiAgICAvLyDlo7DmmI7mqKHlnZdcbiAgICBsaW5lcy5wdXNoKGBkZWNsYXJlIG1vZHVsZSAnJHtjb25maWcubW9kdWxlSW1wb3J0UGF0aH0nIHtgKTtcblxuICAgIC8vIE1vZGVsIOexu+Wei+aYoOWwhFxuICAgIGlmIChtb2RlbHMubGVuZ3RoID4gMCkge1xuICAgICAgICBsaW5lcy5wdXNoKCcgICAgaW50ZXJmYWNlIE1vZGVsVHlwZU1hcCB7Jyk7XG4gICAgICAgIGZvciAoY29uc3QgbW9kZWwgb2YgbW9kZWxzKSB7XG4gICAgICAgICAgICBsaW5lcy5wdXNoKGAgICAgICAgIFtNb2RlbE5hbWVzLiR7bW9kZWwuZGVjb3JhdG9yTmFtZX1dOiAke21vZGVsLmNsYXNzTmFtZX07YCk7XG4gICAgICAgIH1cbiAgICAgICAgbGluZXMucHVzaCgnICAgIH0nKTtcbiAgICAgICAgbGluZXMucHVzaCgnJyk7XG4gICAgfVxuXG4gICAgLy8gTWFuYWdlciDnsbvlnovmmKDlsIRcbiAgICBpZiAobWFuYWdlcnMubGVuZ3RoID4gMCkge1xuICAgICAgICBsaW5lcy5wdXNoKCcgICAgaW50ZXJmYWNlIE1hbmFnZXJUeXBlTWFwIHsnKTtcbiAgICAgICAgZm9yIChjb25zdCBtYW5hZ2VyIG9mIG1hbmFnZXJzKSB7XG4gICAgICAgICAgICBsaW5lcy5wdXNoKGAgICAgICAgIFtNYW5hZ2VyTmFtZXMuJHttYW5hZ2VyLmRlY29yYXRvck5hbWV9XTogJHttYW5hZ2VyLmNsYXNzTmFtZX07YCk7XG4gICAgICAgIH1cbiAgICAgICAgbGluZXMucHVzaCgnICAgIH0nKTtcbiAgICB9XG5cbiAgICBsaW5lcy5wdXNoKCd9Jyk7XG4gICAgbGluZXMucHVzaCgnJyk7XG5cbiAgICByZXR1cm4gbGluZXMuam9pbignXFxuJyk7XG59XG5cbi8vIOS4u+WHveaVsFxuZXhwb3J0IGZ1bmN0aW9uIGdlbmVyYXRlVHlwZXMoY29uZmlnOiBUeXBlR2VuQ29uZmlnKTogeyBzdWNjZXNzOiBib29sZWFuOyBtZXNzYWdlOiBzdHJpbmcgfSB7XG4gICAgdHJ5IHtcbiAgICAgICAgY29uc29sZS5sb2coJ/CfmoAg5byA5aeL55Sf5oiQ57G75Z6L5pig5bCE5paH5Lu2Li4uXFxuJyk7XG5cbiAgICAgICAgLy8g5omr5o+PIE1vZGVsIOebruW9lVxuICAgICAgICBjb25zb2xlLmxvZyhg8J+TgiDmiavmj48gTW9kZWwg55uu5b2VOiAke2NvbmZpZy5tb2RlbERpcn1gKTtcbiAgICAgICAgY29uc3QgbW9kZWxGaWxlcyA9IHNjYW5EaXJlY3RvcnkoY29uZmlnLm1vZGVsRGlyKTtcbiAgICAgICAgY29uc3QgbW9kZWxzID0gbW9kZWxGaWxlc1xuICAgICAgICAgICAgLm1hcChwYXJzZUZpbGUpXG4gICAgICAgICAgICAuZmlsdGVyKChpdGVtKTogaXRlbSBpcyBQYXJzZWRJdGVtID0+IGl0ZW0gIT09IG51bGwgJiYgaXRlbS50eXBlID09PSAnbW9kZWwnKTtcbiAgICAgICAgY29uc29sZS5sb2coYCAgIOaJvuWIsCAke21vZGVscy5sZW5ndGh9IOS4qiBNb2RlbFxcbmApO1xuXG4gICAgICAgIC8vIOaJq+aPjyBNYW5hZ2VyIOebruW9lVxuICAgICAgICBjb25zb2xlLmxvZyhg8J+TgiDmiavmj48gTWFuYWdlciDnm67lvZU6ICR7Y29uZmlnLm1hbmFnZXJEaXJ9YCk7XG4gICAgICAgIGNvbnN0IG1hbmFnZXJGaWxlcyA9IHNjYW5EaXJlY3RvcnkoY29uZmlnLm1hbmFnZXJEaXIpO1xuICAgICAgICBjb25zdCBtYW5hZ2VycyA9IG1hbmFnZXJGaWxlc1xuICAgICAgICAgICAgLm1hcChwYXJzZUZpbGUpXG4gICAgICAgICAgICAuZmlsdGVyKChpdGVtKTogaXRlbSBpcyBQYXJzZWRJdGVtID0+IGl0ZW0gIT09IG51bGwgJiYgaXRlbS50eXBlID09PSAnbWFuYWdlcicpO1xuICAgICAgICBjb25zb2xlLmxvZyhgICAg5om+5YiwICR7bWFuYWdlcnMubGVuZ3RofSDkuKogTWFuYWdlclxcbmApO1xuXG4gICAgICAgIGlmIChtb2RlbHMubGVuZ3RoID09PSAwICYmIG1hbmFnZXJzLmxlbmd0aCA9PT0gMCkge1xuICAgICAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgICAgICBzdWNjZXNzOiBmYWxzZSxcbiAgICAgICAgICAgICAgICBtZXNzYWdlOiAn4pqg77iPICDmnKrmib7liLDku7vkvZUgTW9kZWwg5oiWIE1hbmFnZXLvvIzot7Pov4fnlJ/miJAnXG4gICAgICAgICAgICB9O1xuICAgICAgICB9XG5cbiAgICAgICAgLy8g55Sf5oiQ57G75Z6L5pig5bCEXG4gICAgICAgIGNvbnN0IGNvbnRlbnQgPSBnZW5lcmF0ZVR5cGVNYXAobW9kZWxzLCBtYW5hZ2VycywgY29uZmlnKTtcblxuICAgICAgICAvLyDnoa7kv53ovpPlh7rnm67lvZXlrZjlnKhcbiAgICAgICAgY29uc3Qgb3V0cHV0RGlyID0gcGF0aC5kaXJuYW1lKGNvbmZpZy5vdXRwdXRGaWxlKTtcbiAgICAgICAgaWYgKCFmcy5leGlzdHNTeW5jKG91dHB1dERpcikpIHtcbiAgICAgICAgICAgIGZzLm1rZGlyU3luYyhvdXRwdXREaXIsIHsgcmVjdXJzaXZlOiB0cnVlIH0pO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8g5YaZ5YWl5paH5Lu2XG4gICAgICAgIGZzLndyaXRlRmlsZVN5bmMoY29uZmlnLm91dHB1dEZpbGUsIGNvbnRlbnQsICd1dGYtOCcpO1xuXG4gICAgICAgIGxldCBtZXNzYWdlID0gYOKchSDnsbvlnovmmKDlsITmlofku7blt7LnlJ/miJA6ICR7Y29uZmlnLm91dHB1dEZpbGV9XFxuXFxuYDtcbiAgICAgICAgbWVzc2FnZSArPSAn8J+TiyDnlJ/miJDnmoTmmKDlsIQ6XFxuJztcbiAgICAgICAgaWYgKG1vZGVscy5sZW5ndGggPiAwKSB7XG4gICAgICAgICAgICBtZXNzYWdlICs9ICcgICBNb2RlbHM6XFxuJztcbiAgICAgICAgICAgIG1vZGVscy5mb3JFYWNoKG0gPT4gbWVzc2FnZSArPSBgICAgICAtICR7bS5kZWNvcmF0b3JOYW1lfSDihpIgJHttLmNsYXNzTmFtZX1cXG5gKTtcbiAgICAgICAgfVxuICAgICAgICBpZiAobWFuYWdlcnMubGVuZ3RoID4gMCkge1xuICAgICAgICAgICAgbWVzc2FnZSArPSAnICAgTWFuYWdlcnM6XFxuJztcbiAgICAgICAgICAgIG1hbmFnZXJzLmZvckVhY2gobSA9PiBtZXNzYWdlICs9IGAgICAgIC0gJHttLmRlY29yYXRvck5hbWV9IOKGkiAke20uY2xhc3NOYW1lfVxcbmApO1xuICAgICAgICB9XG4gICAgICAgIG1lc3NhZ2UgKz0gJ1xcbvCfjokg5a6M5oiQ77yBJztcblxuICAgICAgICBjb25zb2xlLmxvZyhtZXNzYWdlKTtcbiAgICAgICAgcmV0dXJuIHsgc3VjY2VzczogdHJ1ZSwgbWVzc2FnZSB9O1xuXG4gICAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICAgICAgY29uc3QgZXJyb3JNZXNzYWdlID0gYOKdjCDnlJ/miJDlpLHotKU6ICR7ZXJyb3IgaW5zdGFuY2VvZiBFcnJvciA/IGVycm9yLm1lc3NhZ2UgOiBTdHJpbmcoZXJyb3IpfWA7XG4gICAgICAgIGNvbnNvbGUuZXJyb3IoZXJyb3JNZXNzYWdlKTtcbiAgICAgICAgcmV0dXJuIHsgc3VjY2VzczogZmFsc2UsIG1lc3NhZ2U6IGVycm9yTWVzc2FnZSB9O1xuICAgIH1cbn1cblxuLy8g5LuO6aG555uu6YWN572u5paH5Lu26K+75Y+W6YWN572uXG5mdW5jdGlvbiBsb2FkQ29uZmlnRnJvbVByb2plY3QocHJvamVjdFBhdGg6IHN0cmluZyk6IFR5cGVHZW5Db25maWcgfCBudWxsIHtcbiAgICAvLyDlsJ3or5Xku44gcGFja2FnZS5qc29uIOivu+WPlumFjee9rlxuICAgIGNvbnN0IHBhY2thZ2VKc29uUGF0aCA9IHBhdGguam9pbihwcm9qZWN0UGF0aCwgJ3BhY2thZ2UuanNvbicpO1xuICAgIGlmIChmcy5leGlzdHNTeW5jKHBhY2thZ2VKc29uUGF0aCkpIHtcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIGNvbnN0IHBhY2thZ2VKc29uID0gSlNPTi5wYXJzZShmcy5yZWFkRmlsZVN5bmMocGFja2FnZUpzb25QYXRoLCAndXRmLTgnKSk7XG4gICAgICAgICAgICBpZiAocGFja2FnZUpzb24ubWZsb3dUeXBlR2VuKSB7XG4gICAgICAgICAgICAgICAgY29uc3QgY29uZmlnID0gcGFja2FnZUpzb24ubWZsb3dUeXBlR2VuO1xuICAgICAgICAgICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICAgICAgICAgIG1vZGVsRGlyOiBwYXRoLnJlc29sdmUocHJvamVjdFBhdGgsIGNvbmZpZy5tb2RlbERpciB8fCAnYXNzZXRzL3NyYy9tb2RlbHMnKSxcbiAgICAgICAgICAgICAgICAgICAgbWFuYWdlckRpcjogcGF0aC5yZXNvbHZlKHByb2plY3RQYXRoLCBjb25maWcubWFuYWdlckRpciB8fCAnYXNzZXRzL3NyYy9tYW5hZ2VycycpLFxuICAgICAgICAgICAgICAgICAgICBvdXRwdXRGaWxlOiBwYXRoLnJlc29sdmUocHJvamVjdFBhdGgsIGNvbmZpZy5vdXRwdXRGaWxlIHx8ICdhc3NldHMvdHlwZXMvY29yZS10eXBlcy5kLnRzJyksXG4gICAgICAgICAgICAgICAgICAgIG1vZHVsZUltcG9ydFBhdGg6IGNvbmZpZy5tb2R1bGVJbXBvcnRQYXRoIHx8ICdkemtjYy1tZmxvdy9jb3JlJ1xuICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICB9XG4gICAgICAgIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgICAgICAgICBjb25zb2xlLndhcm4oJ+aXoOazleivu+WPliBwYWNrYWdlLmpzb24g6YWN572uJyk7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICAvLyDlsJ3or5Xku47ljZXni6znmoTphY3nva7mlofku7bor7vlj5ZcbiAgICBjb25zdCBjb25maWdQYXRoID0gcGF0aC5qb2luKHByb2plY3RQYXRoLCAnbWZsb3cuY29uZmlnLmpzb24nKTtcbiAgICBpZiAoZnMuZXhpc3RzU3luYyhjb25maWdQYXRoKSkge1xuICAgICAgICB0cnkge1xuICAgICAgICAgICAgY29uc3QgY29uZmlnID0gSlNPTi5wYXJzZShmcy5yZWFkRmlsZVN5bmMoY29uZmlnUGF0aCwgJ3V0Zi04JykpO1xuICAgICAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgICAgICBtb2RlbERpcjogcGF0aC5yZXNvbHZlKHByb2plY3RQYXRoLCBjb25maWcubW9kZWxEaXIgfHwgJ2Fzc2V0cy9zcmMvbW9kZWxzJyksXG4gICAgICAgICAgICAgICAgbWFuYWdlckRpcjogcGF0aC5yZXNvbHZlKHByb2plY3RQYXRoLCBjb25maWcubWFuYWdlckRpciB8fCAnYXNzZXRzL3NyYy9tYW5hZ2VycycpLFxuICAgICAgICAgICAgICAgIG91dHB1dEZpbGU6IHBhdGgucmVzb2x2ZShwcm9qZWN0UGF0aCwgY29uZmlnLm91dHB1dEZpbGUgfHwgJ2Fzc2V0cy90eXBlcy9jb3JlLXR5cGVzLmQudHMnKSxcbiAgICAgICAgICAgICAgICBtb2R1bGVJbXBvcnRQYXRoOiBjb25maWcubW9kdWxlSW1wb3J0UGF0aCB8fCAnZHprY2MtbWZsb3cvY29yZSdcbiAgICAgICAgICAgIH07XG4gICAgICAgIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgICAgICAgICBjb25zb2xlLndhcm4oJ+aXoOazleivu+WPliBtZmxvdy5jb25maWcuanNvbiDphY3nva4nKTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIC8vIOS9v+eUqOm7mOiupOmFjee9rlxuICAgIHJldHVybiB7XG4gICAgICAgIG1vZGVsRGlyOiBwYXRoLnJlc29sdmUocHJvamVjdFBhdGgsICdhc3NldHMvc3JjL21vZGVscycpLFxuICAgICAgICBtYW5hZ2VyRGlyOiBwYXRoLnJlc29sdmUocHJvamVjdFBhdGgsICdhc3NldHMvc3JjL21hbmFnZXJzJyksXG4gICAgICAgIG91dHB1dEZpbGU6IHBhdGgucmVzb2x2ZShwcm9qZWN0UGF0aCwgJ2Fzc2V0cy90eXBlcy9jb3JlLXR5cGVzLmQudHMnKSxcbiAgICAgICAgbW9kdWxlSW1wb3J0UGF0aDogJ2R6a2NjLW1mbG93L2NvcmUnXG4gICAgfTtcbn1cblxuLy8g57yW6L6R5Zmo5omp5bGV5YWl5Y+jXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gb25HZW5lcmF0ZVR5cGVzKCkge1xuICAgIHRyeSB7XG4gICAgICAgIC8vIOiOt+WPlumhueebrui3r+W+hFxuICAgICAgICBjb25zdCBwcm9qZWN0UGF0aCA9IEVkaXRvci5Qcm9qZWN0LnBhdGg7XG4gICAgICAgIGNvbnNvbGUubG9nKCfpobnnm67ot6/lvoQ6JywgcHJvamVjdFBhdGgpO1xuXG4gICAgICAgIC8vIOWKoOi9vemFjee9rlxuICAgICAgICBjb25zdCBjb25maWcgPSBsb2FkQ29uZmlnRnJvbVByb2plY3QocHJvamVjdFBhdGgpO1xuICAgICAgICBpZiAoIWNvbmZpZykge1xuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKCfml6Dms5XliqDovb3phY3nva4nKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGNvbnNvbGUubG9nKCfkvb/nlKjphY3nva46JywgY29uZmlnKTtcblxuICAgICAgICAvLyDnlJ/miJDnsbvlnovmmKDlsIRcbiAgICAgICAgY29uc3QgcmVzdWx0ID0gZ2VuZXJhdGVUeXBlcyhjb25maWcpO1xuXG4gICAgICAgIGlmIChyZXN1bHQuc3VjY2Vzcykge1xuICAgICAgICAgICAgYXdhaXQgRWRpdG9yLkRpYWxvZy5pbmZvKCfnsbvlnovmmKDlsITnlJ/miJDmiJDlip/vvIEnLCB7XG4gICAgICAgICAgICAgICAgZGV0YWlsOiByZXN1bHQubWVzc2FnZSxcbiAgICAgICAgICAgICAgICBidXR0b25zOiBbJ+ehruWumiddXG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGF3YWl0IEVkaXRvci5EaWFsb2cud2Fybign57G75Z6L5pig5bCE55Sf5oiQ5aSx6LSlJywge1xuICAgICAgICAgICAgICAgIGRldGFpbDogcmVzdWx0Lm1lc3NhZ2UsXG4gICAgICAgICAgICAgICAgYnV0dG9uczogWyfnoa7lrponXVxuICAgICAgICAgICAgfSk7XG4gICAgICAgIH1cbiAgICB9IGNhdGNoIChlcnJvcikge1xuICAgICAgICBjb25zb2xlLmVycm9yKCfnlJ/miJDnsbvlnovmmKDlsITlpLHotKU6JywgZXJyb3IpO1xuICAgICAgICBhd2FpdCBFZGl0b3IuRGlhbG9nLmVycm9yKCfnlJ/miJDnsbvlnovmmKDlsITlpLHotKUnLCB7XG4gICAgICAgICAgICBkZXRhaWw6IGVycm9yIGluc3RhbmNlb2YgRXJyb3IgPyBlcnJvci5tZXNzYWdlIDogU3RyaW5nKGVycm9yKSxcbiAgICAgICAgICAgIGJ1dHRvbnM6IFsn56Gu5a6aJ11cbiAgICAgICAgfSk7XG4gICAgfVxufVxuXG4iXX0=