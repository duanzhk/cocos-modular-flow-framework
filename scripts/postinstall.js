import fs from 'fs';
import path from 'path';
import unzipper from 'unzipper';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

// Get __dirname equivalent for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// 1. 创建 extensions 目录
const extensionsDir = path.join(__dirname, '../../../extensions');
if (!fs.existsSync(extensionsDir)) {
    fs.mkdirSync(extensionsDir);
}
console.log(`${extensionsDir} created`);
// 2. 解压 mflow-tools.zip
const zipPath = path.join(__dirname, '../dist/mflow-tools.zip');
const extractPath = path.join(extensionsDir, 'mflow-tools');

fs.createReadStream(zipPath)
    .pipe(unzipper.Extract({ path: extractPath }))
    .on('close', () => {
        // 3. 在解压目录中执行 npm install
        execSync('npm install', { 
            cwd: extractPath,
            stdio: 'inherit'
        });
    });