import fs from 'fs';
import path from 'path';
import archiver from 'archiver';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { execSync } from 'child_process';

// Get __dirname equivalent for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// 1. 先构建 toolsDir 下的内容
const toolsDir = path.join(__dirname, '../static/mflow-tools');
console.log(`Building tools in ${toolsDir}...`);
execSync('npm run build', { cwd: toolsDir, stdio: 'inherit' });

// 压缩 static/mflow-tools 目录为 mflow-tools.zip
const output = fs.createWriteStream(path.join(__dirname, '../dist/mflow-tools.zip'));
const archive = archiver('zip', { zlib: { level: 9 } });

archive.pipe(output);

// 只添加指定的文件和目录
archive.file(path.join(toolsDir, 'package.json'), { name: 'package.json' });
archive.directory(path.join(toolsDir, 'dist'), 'dist');
archive.directory(path.join(toolsDir, 'i18n'), 'i18n');
archive.directory(path.join(toolsDir, 'scripts'), 'scripts');
// 直接添加整个目录
// archive.directory(toolsDir, false);

archive.finalize();

console.log('mflow-tools.zip created in dist folder');