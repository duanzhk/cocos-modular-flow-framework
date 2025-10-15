/**
 * 自动生成类型映射文件
 * 使用方法: 
 *   1. 在框架开发中: node scripts/generate-type-map.js
 *   2. 在用户项目中: node node_modules/dzkcc-mflow/scripts/generate-type-map.js
 *   3. 在用户项目中（推荐）: npx dzkcc-mflow-typegen
 */

const fs = require('fs');
const path = require('path');

// 从配置文件加载配置
function loadConfig(projectPath) {
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
        } catch (error) {
            console.warn('⚠️  无法读取 package.json 配置');
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
        } catch (error) {
            console.warn('⚠️  无法读取 mflow.config.json 配置');
        }
    }

    // 检测是否在框架开发目录中
    const srcModelsPath = path.join(projectPath, 'src/models');
    const srcManagersPath = path.join(projectPath, 'src/managers');
    if (fs.existsSync(srcModelsPath) || fs.existsSync(srcManagersPath)) {
        // 框架开发模式
        return {
            modelDir: srcModelsPath,
            managerDir: srcManagersPath,
            outputFile: path.join(projectPath, 'types/core-types.d.ts'),
            moduleImportPath: 'dzkcc-mflow/core'
        };
    }

    // 使用默认配置（用户项目）
    return {
        modelDir: path.resolve(projectPath, 'assets/src/models'),
        managerDir: path.resolve(projectPath, 'assets/src/managers'),
        outputFile: path.resolve(projectPath, 'assets/types/core-types.d.ts'),
        moduleImportPath: 'dzkcc-mflow/core'
    };
}

// 确定项目路径
const projectPath = process.cwd();
console.log(`📁 项目路径: ${projectPath}\n`);

// 配置
const config = loadConfig(projectPath);

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
        } else if (item.endsWith('.ts') && !item.endsWith('.d.ts')) {
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
function generateTypeMap(models, managers, outputFile) {
    const lines = [];
    
    // 文件头注释
    lines.push('/**');
    lines.push(' * 自动生成的类型映射文件');
    lines.push(' * ⚠️ 请勿手动修改此文件！');
    lines.push(' * 重新生成方法：');
    lines.push(' *   - 在 Cocos Creator 编辑器中：项目菜单 -> 生成类型映射');
    lines.push(' *   - 命令行：node node_modules/dzkcc-mflow/scripts/generate-type-map.js');
    lines.push(' */');
    lines.push('');
    
    // 导入 Model
    if (models.length > 0) {
        lines.push('// Model 导入');
        for (const model of models) {
            const relativePath = path.relative(
                path.dirname(outputFile),
                model.filePath
            ).replace(/\\/g, '/').replace('.ts', '');
            lines.push(`import { ${model.className} } from '${relativePath}';`);
        }
        lines.push('');
    }
    
    // 导入 Manager
    if (managers.length > 0) {
        lines.push('// Manager 导入');
        for (const manager of managers) {
            const relativePath = path.relative(
                path.dirname(outputFile),
                manager.filePath
            ).replace(/\\/g, '/').replace('.ts', '');
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
function main() {
    console.log('🚀 开始生成类型映射文件...\n');
    
    // 输出配置信息
    console.log('⚙️  使用配置:');
    console.log(`   Model 目录: ${config.modelDir}`);
    console.log(`   Manager 目录: ${config.managerDir}`);
    console.log(`   输出文件: ${config.outputFile}`);
    console.log(`   模块路径: ${config.moduleImportPath}\n`);
    
    // 扫描 Model 目录
    console.log(`📂 扫描 Model 目录: ${config.modelDir}`);
    const modelFiles = scanDirectory(config.modelDir);
    const models = modelFiles
        .map(parseFile)
        .filter(item => item && item.type === 'model');
    console.log(`   找到 ${models.length} 个 Model\n`);
    
    // 扫描 Manager 目录
    console.log(`📂 扫描 Manager 目录: ${config.managerDir}`);
    const managerFiles = scanDirectory(config.managerDir);
    const managers = managerFiles
        .map(parseFile)
        .filter(item => item && item.type === 'manager');
    console.log(`   找到 ${managers.length} 个 Manager\n`);
    
    if (models.length === 0 && managers.length === 0) {
        console.log('⚠️  未找到任何 Model 或 Manager，跳过生成');
        console.log('\n💡 提示：');
        console.log('   1. 确保在 Model/Manager 类上使用了 @model() 或 @manager() 装饰器');
        console.log('   2. 确保目录路径配置正确');
        console.log('   3. 可以在 package.json 中添加 mflowTypeGen 配置或创建 mflow.config.json 文件');
        console.log('\n配置示例 (package.json):');
        console.log('   "mflowTypeGen": {');
        console.log('     "modelDir": "assets/src/models",');
        console.log('     "managerDir": "assets/src/managers",');
        console.log('     "outputFile": "assets/types/core-types.d.ts",');
        console.log('     "moduleImportPath": "dzkcc-mflow/core"');
        console.log('   }');
        return;
    }
    
    // 生成类型映射
    const content = generateTypeMap(models, managers, config.outputFile);
    
    // 确保输出目录存在
    const outputDir = path.dirname(config.outputFile);
    if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
    }
    
    // 写入文件
    fs.writeFileSync(config.outputFile, content, 'utf-8');
    
    console.log(`✅ 类型映射文件已生成: ${config.outputFile}\n`);
    console.log('📋 生成的映射:');
    if (models.length > 0) {
        console.log('   Models:');
        models.forEach(m => console.log(`     - ${m.decoratorName} → ${m.className}`));
    }
    if (managers.length > 0) {
        console.log('   Managers:');
        managers.forEach(m => console.log(`     - ${m.decoratorName} → ${m.className}`));
    }
    console.log('');
    console.log('🎉 完成！');
}

// 执行
try {
    main();
} catch (error) {
    console.error('❌ 生成失败:', error.message);
    process.exit(1);
}

