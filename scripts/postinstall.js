import fs from 'fs';
import path from 'path';
// import unzipper from 'unzipper';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

// Get __dirname equivalent for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// 1. 确保 unzipper 已安装（使用 --ignore-scripts 避免递归触发）
try {
    execSync('npm install --save-dev unzipper', {
        cwd: path.join(__dirname, '..'),
        stdio: 'inherit'
    });
} catch (e) {
    console.error('安装 unzipper 失败:', e);
    process.exit(1);
}
// 2. 动态导入 unzipper
const unzipper = await import('unzipper');

// 3. 创建 extensions 目录到项目根目录（与 node_modules 同级）
// 使用 INIT_CWD 环境变量获取执行 npm install 的项目根目录
// 如果不存在则回退到查找 node_modules 目录的父目录
let projectRoot;
if (process.env.INIT_CWD) {
    // npm/yarn 会设置 INIT_CWD 为执行命令的目录
    projectRoot = process.env.INIT_CWD;
} else {
    // 回退方案：从当前目录向上查找 node_modules，然后取其父目录
    let currentDir = __dirname;
    while (currentDir !== path.dirname(currentDir)) {
        const nodeModulesPath = path.join(currentDir, 'node_modules');
        if (fs.existsSync(nodeModulesPath)) {
            projectRoot = currentDir;
            break;
        }
        currentDir = path.dirname(currentDir);
    }
    if (!projectRoot) {
        console.error('无法找到项目根目录');
        process.exit(1);
    }
}

const extensionsDir = path.join(projectRoot, 'extensions');
if (!fs.existsSync(extensionsDir)) {
    fs.mkdirSync(extensionsDir/*, { recursive: true }*/);
}
console.log(`Extensions directory created at: ${extensionsDir}`);
// 4. 解压 mflow-tools.zip
const zipPath = path.join(__dirname, '../dist/mflow-tools.zip');
const extractPath = path.join(extensionsDir, 'mflow-tools');

fs.createReadStream(zipPath)
    .pipe(unzipper.Extract({ path: extractPath }))
    .on('close', () => {
        // 5. 在解压目录中执行 npm install
        execSync('npm install', {
            cwd: extractPath,
            stdio: 'inherit'
        });
    })