# 腾讯云账单接口

这份函数用于替代无法在国内网络稳定访问的 Cloudflare Worker。网页继续使用自制账单界面，账单数据保存到腾讯云 CloudBase 的 SQL 型数据库。

## 控制台部署

1. 在腾讯云开发控制台创建一个环境，记下环境 ID。
2. 点击左侧 **SQL 型数据库**，初始化数据库后打开 SQL 编辑器，执行下方建表语句。

```sql
CREATE TABLE `trip_expenses` (
  `_id` VARCHAR(64) NOT NULL PRIMARY KEY,
  `payload` LONGTEXT NOT NULL,
  `updated_at` VARCHAR(40) NOT NULL
);
```

3. 确认云函数服务角色可以访问当前环境的 SQL 数据库。
4. 创建 Node.js 云函数，运行时选择 Node.js 18 或更高版本，入口设置为 `index.main_handler`。
5. 将本目录中的 `index.js`、`package.json` 上传部署，或在函数目录执行 `npm install` 后整体打包上传。
6. 配置环境变量：
   - `TCB_ENV_ID`：腾讯云开发环境 ID
   - `TCB_TABLE`：填写 `trip_expenses`
   - `TCB_DOCUMENT_ID`：填写 `current`
   - `ALLOWED_ORIGIN`：填写 `https://storm-cc.github.io`
7. 为函数创建 API 网关 HTTP 触发器，开启 `GET`、`POST`、`PUT`、`OPTIONS`，复制生成的 HTTPS URL。
8. 将 URL 加上 `/expenses`，填入网页根目录的 `expense-config.js`。

## 数据格式

函数返回一个费用数组，每项包含 `date`、`category`、`item`、`amount` 和 `payer` 字段，与网页自制账单兼容。
