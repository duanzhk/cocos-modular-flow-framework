import typescript from 'rollup-plugin-typescript2';
import { globSync } from 'glob';

export default {
    input: {
        // 动态匹配所有 .ts 文件
        ...Object.fromEntries(globSync('src/**/*.ts').map(f => [f.replace('src/', '').replace('.ts', ''), f]))
    },
    output: {
        dir: 'dist',
        format: 'esm',
        preserveModules: true,
        entryFileNames: '[name].js'
    },
    external: [
        'cc', 'cc/env', 'reflect-metadata'
    ],
    plugins: [
        typescript({
            tsconfig: './tsconfig.json',
            declaration: true, // 启用声明文件生成
            declarationDir: 'dist' // 声明文件输出目录
        }),
    ]
};
