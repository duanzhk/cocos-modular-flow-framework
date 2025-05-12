import fs from 'fs';
import path from 'path';
// import unzipper from 'unzipper';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

// Get __dirname equivalent for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// 1. 确保 unzipper 已安装
try {
    execSync('npm install --save-dev unzipper', {
        cwd: path.join( __dirname, '..'),
        stdio: 'inherit'
    });
} catch (e) {
    console.error('安装 unzipper 失败:', e);
    process.exit(1);
}

// 2. 动态导入 unzipper
const unzipper = await import('unzipper');

// 3. 创建 extensions 目录
const extensionsDir = path.join(__dirname, '../../../extensions');
if (!fs.existsSync(extensionsDir)) {
    fs.mkdirSync(extensionsDir);
}
console.log(`${extensionsDir} created`);
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
    });