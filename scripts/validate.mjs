import { access, readFile } from "node:fs/promises";
import { constants } from "node:fs";

const checks = [];

function check(label, passed) {
  checks.push({ label, passed });
}

async function fileExists(path) {
  try {
    await access(path, constants.F_OK);
    return true;
  } catch {
    return false;
  }
}

try {
  const html = await readFile("index.html", "utf8");

  check("包含移动端 viewport", html.includes('name="viewport"'));
  check("使用语义化 main 标签", /<main[\s>]/.test(html));
  check("使用每日 article 卡片", (html.match(/<article[\s>]/g) ?? []).length >= 8);
  check("包含打印按钮", html.includes('data-action="print"'));
  check("9月30日14:00出发", html.includes("14:00 武汉出发"));
  check("9月30日约18:00抵达宜昌", html.includes("18:00 抵达宜昌"));
  check("包含8个行程日期", ["9月30日", "10月1日", "10月2日", "10月3日", "10月4日", "10月5日", "10月6日", "10月7日"].every((date) => html.includes(date)));
  check("包含每日规划公里数", ["320公里", "140公里", "190公里", "90公里", "180公里", "380公里", "620公里", "410公里"].every((distance) => html.includes(distance)));
  check("包含约2330公里总里程", html.includes("约 2330 公里"));
  check("包含宜昌已订酒店", html.includes("丽橙酒店·智（宜昌火车东站五一广场店）"));
  check("包含宜昌单间价格", html.includes("¥220/间"));
  check("包含宜昌两间合计", html.includes("¥440"));
  check("包含秭归已订酒店", html.includes("秭归若兮酒店"));
  check("包含秭归单间价格", html.includes("¥399/间"));
  check("包含秭归两间合计", html.includes("¥798"));
  check("包含两晚住宿合计", html.includes("¥1,238"));
  check("包含记账单模块", html.includes('id="expenses"') && html.includes("此行记账单"));
  check("记账单预填两笔住宿", html.includes("丽橙酒店·智（宜昌火车东站五一广场店）") && html.includes("秭归若兮酒店"));
  check("记账单包含新增按钮", html.includes('id="add-expense"'));
  check("记账单包含自动保存逻辑", html.includes("wuhan-yichang-roadtrip-expenses-v1") && html.includes("localStorage.setItem"));
  check("记账单包含四人均摊", html.includes("expense-per-person") && html.includes("total / 4"));
  check("10月4日住宿兴隆镇", html.includes("住宿：奉节兴隆镇"));
  check("10月5日住宿八面山", html.includes("住宿：八面山景区内"));
  check("不包含芙蓉镇行程", !html.includes("前往芙蓉镇") && !html.includes("住宿芙蓉镇"));
  check("包含雨天替代方案", html.includes("雨天替代方案"));
  check("包含减少动态效果支持", html.includes("prefers-reduced-motion"));

  const readmeExists = await fileExists("README.md");
  check("存在README", readmeExists);
  if (readmeExists) {
    const readme = await readFile("README.md", "utf8");
    check("README包含本地预览命令", readme.includes("python3 -m http.server 8000"));
    check("README包含GitHub Pages说明", readme.includes("GitHub Pages"));
  }

  check("存在.nojekyll", await fileExists(".nojekyll"));

  check("无不安全HTTP资源", !/\b(?:src|href)=["']http:\/\//.test(html));

  let failed = 0;
  for (const result of checks) {
    const icon = result.passed ? "✓" : "✗";
    console.log(`${icon} ${result.label}`);
    if (!result.passed) failed += 1;
  }

  if (failed > 0) {
    console.error(`\nValidation failed: ${failed} check(s) did not pass.`);
    process.exit(1);
  }

  console.log(`\nValidation passed: ${checks.length} checks.`);
} catch (error) {
  console.error(`Validation failed: ${error.message}`);
  process.exit(1);
}
