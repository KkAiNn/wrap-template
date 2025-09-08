const { wrapSfcRootTemplate } = require("./wrap-template");
const fs = require("fs");
const path = require("path");

// 去除注释
function removeComments(jsonString) {
  return jsonString.replace(/\/\*[\s\S]*?\*\/|\/\/.*/g, '').trim();
}

// 获取 pages.json 
const pagesJsonPath = path.resolve('./example/pages.json');;
const json = fs.readFileSync(pagesJsonPath, 'utf-8');
const pages = JSON.parse(removeComments(json));

function buildTemplate(path: string, tag: string) {
  const filePath = `example/${path}`;
  console.log(filePath)
  wrapSfcRootTemplate({ filePath, wrapperTag: tag, nvue: false });
}

export function generate(data: {
  tag?: string
}) {
  const { tag = "root" } = data
  console.log(`👉 批量处理 ${tag} 标签`);
  // 批量处理 pages 中页面
  pages.pages.forEach((page: { path: string }) => buildTemplate(page.path, tag));

  // 批量处理 subPackages 中页面
  pages.subPackages.forEach((subPackage: { root: string; pages: { path: string }[] }) => {
    subPackage.pages.forEach((page: { path: string }) => {
      buildTemplate(`${subPackage.root}/${page.path}`, tag);
    });
  });
  console.log("✅ 批量处理完成");
}

