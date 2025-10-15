/**
 * 自动生成类型映射文件
 * 使用方法: node scripts/generate-type-map.js
 */

const fs = require('fs');
const path = require('path');

// 配置
const config = {
    // 需要扫描的目录
    modelDir: path.join(__dirname, '../src/models'),
    managerDir: path.join(__dirname, '../src/managers'),
    // 输出文件路径
    outputFile: path.join(__dirname, '../types/core-types.d.ts'),
    // 模块路径（根据你的项目调整）
    moduleImportPath: 'dzkcc-mflow/core'
};

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
    lines.push(' * 运行 npm run generate:types 重新生成');
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

