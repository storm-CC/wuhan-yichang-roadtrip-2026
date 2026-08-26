# 公开记账接口

这个 Worker 为 GitHub Pages 记账单提供公开读写接口，数据保存在仓库根目录的 `data/expenses.json`。

## 部署

在 Cloudflare 创建账号后，先切换到 Node.js 22 或更高版本，再在 Worker 项目内安装 Wrangler：

```bash
nvm install 22
nvm use 22
cd worker
npm install -D wrangler@latest
npx wrangler login
npx wrangler secret put GITHUB_TOKEN
npx wrangler deploy
```

如果终端提示 `nvm: command not found`，先安装 nvm，重新打开终端后再执行上面的命令。也可以使用 Node.js 官网的 macOS 安装包，安装 Node.js 22 或更高版本。

`GITHUB_TOKEN` 需要能够对 `storm-CC/wuhan-yichang-roadtrip-2026` 仓库读写 Contents。不要把 Token 写进网页或提交到 Git 仓库。

部署成功后，把 Worker 地址写入仓库根目录的 `expense-config.js`：

```js
window.EXPENSE_API_URL = "https://wuhan-yichang-expense-api.<你的账号>.workers.dev/expenses";
```

然后提交并推送 `expense-config.js`，网页即可从服务器读取和保存账单。

## 接口

- `GET /expenses`：读取全部费用
- `PUT /expenses`：用请求体中的数组覆盖保存全部费用
- `POST /expenses`：与 `PUT` 相同，作为兼容入口
- `GET /health`：健康检查

这是公开读写接口，任何拿到网页地址的人都可以修改账单。由于每次保存都会提交 GitHub commit，请只用于这次旅行账单。
