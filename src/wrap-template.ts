const fs = require("fs");
const path = require("path");

/**
 * 定位 SFC 顶层 <template> 的开闭区间（含标签）
 * 返回：{ openStart, openEnd, innerStart, innerEnd, closeStart, closeEnd }
 */
function findTopLevelTemplateRange(src: string) {
  const n = src.length;
  let i = 0;
  let inComment = false;

  const isAlpha = (ch: string) => /[A-Za-z]/.test(ch);

  function startsWithAt(pos: number, s: string) {
    return src.slice(pos, pos + s.length).toLowerCase() === s.toLowerCase();
  }

  // 读取标签名（假设 pos 指向 '<' 或 '</' 后的第一个字符）
  function readTagName(pos: number) {
    let j = pos;
    let name = "";
    while (j < n && isAlpha(src[j])) {
      name += src[j];
      j++;
    }
    return { name: name.toLowerCase(), end: j };
  }

  let topOpenStart = -1;
  let topOpenEnd = -1;   // '>' 的位置 + 1
  let topCloseStart = -1;
  let topCloseEnd = -1;  // '>' 的位置 + 1
  let depth = 0;

  while (i < n) {
    // 注释 <!-- ... -->
    if (!inComment && src[i] === "<" && startsWithAt(i, "<!--")) {
      inComment = true;
      i += 4;
      const end = src.indexOf("-->", i);
      if (end === -1) return null;
      inComment = false;
      i = end + 3;
      continue;
    }

    // script/style 块整体跳过
    if (src[i] === "<" && startsWithAt(i, "<script")) {
      const end = src.toLowerCase().indexOf("</script>", i + 7);
      i = end === -1 ? n : end + 9;
      continue;
    }
    if (src[i] === "<" && startsWithAt(i, "<style")) {
      const end = src.toLowerCase().indexOf("</style>", i + 6);
      i = end === -1 ? n : end + 8;
      continue;
    }

    if (src[i] === "<") {
      const isClose = src[i + 1] === "/";
      const nameInfo = readTagName(i + (isClose ? 2 : 1));
      const tag = nameInfo.name;

      if (tag === "template") {
        if (!isClose) {
          // 找到开标签的闭合 '>'
          const gt = src.indexOf(">", nameInfo.end);
          if (gt === -1) throw new Error("未找到 <template> 的 >");
          if (depth === 0) {
            topOpenStart = i;
            topOpenEnd = gt + 1;
          }
          depth++;
          i = gt + 1;
          continue;
        } else {
          // 关闭标签
          const gt = src.indexOf(">", nameInfo.end);
          if (gt === -1) throw new Error("未找到 </template> 的 >");
          depth--;
          if (depth === 0) {
            topCloseStart = i;
            topCloseEnd = gt + 1;
            break;
          }
          i = gt + 1;
          continue;
        }
      }
    }

    i++;
  }

  if (topOpenStart === -1 || topCloseEnd === -1) return null;

  const innerStart = topOpenEnd;
  const innerEnd = topCloseStart;
  return {
    openStart: topOpenStart,
    openEnd: topOpenEnd,
    innerStart,
    innerEnd,
    closeStart: topCloseStart,
    closeEnd: topCloseEnd,
  };
}

/**
 * 把 SFC 顶层模板内容包裹一层根元素
 * @param filePath .vue 文件路径（可不带 .vue）
 * @param wrapperTag 包裹标签，默认 'view'（适合 uni-app）
 * @param className 可选：给根元素加 class
 * @param nvu 可选：是否处理nvue文件
 */
export function wrapSfcRootTemplate(data: {
  filePath: string,
  wrapperTag?: string,
  className?: string
  nvue?: boolean
}) {
  const { filePath, wrapperTag = "view", className, nvue = true } = data;
  const absPath = path.resolve(
    /\.vue$/i.test(filePath) ? filePath : `${filePath}.vue`
  );
  const absPath_nvue = path.resolve(
    /\.nvue$/i.test(filePath) ? filePath : `${filePath}.nvue`
  );

  // 是否是nvue
  if (fs.existsSync(absPath_nvue) && !nvue) {
    console.error(`⚠️ nvue文件不操作: ${absPath_nvue}`);
    return
  }
  
  if (!fs.existsSync(absPath)) {
    console.error(`❌ 文件不存在: ${absPath}`);
    process.exit(1);
  }

  const src = fs.readFileSync(absPath, "utf-8");
  const range = findTopLevelTemplateRange(src);
  if (!range) {
    console.error("❌ 未找到顶层 <template> 块");
    process.exit(1);
  }

  const before = src.slice(0, range.innerStart);
  const inner = src.slice(range.innerStart, range.innerEnd);
  const after = src.slice(range.innerEnd);

  // 简单判断：如果已经最外层就是同名 wrapper，可以跳过（可按需关闭）
  const innerTrim = inner.trimStart();
  const alreadyWrapped =
    innerTrim.startsWith(`<${wrapperTag}`) && innerTrim.includes(`</${wrapperTag}>`);

  if (alreadyWrapped) {
    console.log("ℹ️ 似乎已经包裹过同名根元素，未做改动。");
    return;
  }

  const classAttr = className ? ` class="${className}"` : "";
  const needsLeadingNL = inner.startsWith("\n") ? "" : "\n";
  const needsTrailingNL = inner.endsWith("\n") ? "" : "\n";

  const wrapped =
    `${needsLeadingNL}<${wrapperTag}${classAttr}>` +
    inner +
    `${needsTrailingNL}</${wrapperTag}>\n`;

  const newSrc = before + wrapped + after;
  fs.writeFileSync(absPath, newSrc, "utf-8");
  console.log(`✅ 已在顶层 <template> 内部插入 <${wrapperTag}> 根元素: ${absPath}`);
}