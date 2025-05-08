import typescript from 'rollup-plugin-typescript2';
import { globSync } from 'glob';
import { writeFileSync } from 'fs';

// 类型声明模板
const typeDeclarations = `
declare module '@mflow/api' {
  export * from 'dzkcc-mflow/core/index';
}
declare module '@mflow/libs' {
  export * from 'dzkcc-mflow/libs/index';
}
declare module '@mflow/utils' {
  export * from 'dzkcc-mflow/utils/index';
}
`;

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
        // {
        //     name: 'generate-type-declarations',
        //     writeBundle() {
        //         writeFileSync('dist/types.d.ts', typeDeclarations);
        //     }
        // }
    ]
};
