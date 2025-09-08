# wrap-template

## 项目简介

`wrap-template` 是一个用于批量处理 Vue 单文件组件（SFC），在其 `<template>` 根节点插入自定义标签的工具。适用于需要统一包裹页面根节点的场景，比如主题、全局样式等。

## 功能

- 批量读取 `pages.json` 配置，自动遍历所有页面文件
- 在每个页面的 `<template>` 根节点插入指定标签（如 `app-root`）
- 支持处理主包和分包页面
- TypeScript 编写，易于扩展

## 安装

```bash
git clone <你的仓库地址>
cd 批量更改文件内容
npm install
```

## 使用方法

1. **配置 `pages.json`**

   在 `example/pages.json` 中配置你的页面路径，格式如下：

   ```json
   {
     "pages": [
       { "path": "pages/index/index.vue" },
       { "path": "pages/about/about.vue" }
     ],
     "subPackages": [
       {
         "root": "packageA",
         "pages": [
           { "path": "pages/subpage1.vue" }
         ]
       }
     ]
   }
   ```

2. **自定义插入标签**

   在 `src/index.ts` 中修改 `tag` 变量为你需要插入的标签名。

3. **批量处理**

   执行以下命令：

   ```bash
   npm run generate
   ```

   该命令会自动编译 TypeScript 文件并批量处理所有页面。

## 目录结构

```
├── example/
│   └── pages.json         # 页面配置文件
├── src/
│   ├── index.ts           # 主入口文件
│   └── wrap-template.ts   # 根标签插入逻辑
├── dist/                  # 编译后输出目录
├── package.json
├── tsconfig.json
└── readme.md
```

## 开发与扩展

- 修改 `src/wrap-template.ts` 可自定义插入逻辑
- 支持自定义标签、属性等

## 依赖

- [TypeScript](https://www.typescriptlang.org/)
-