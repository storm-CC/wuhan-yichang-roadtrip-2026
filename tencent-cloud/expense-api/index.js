const tcb = require("@cloudbase/node-sdk");

const DATE_OPTIONS = new Set(["9月30日", "10月1日", "10月2日", "10月3日", "10月4日", "10月5日", "10月6日", "10月7日", "其他"]);
const CATEGORY_OPTIONS = new Set(["住宿", "餐饮", "门票", "充电", "停车", "其他"]);
const TABLE_NAME = process.env.TCB_TABLE || "trip_expenses";
const DOCUMENT_ID = process.env.TCB_DOCUMENT_ID || "current";

let models;

function getModels() {
  if (!models) {
    const app = tcb.init({ env: process.env.TCB_ENV_ID });
    models = app.models;
  }
  return models;
}

function corsHeaders() {
  return {
    "Access-Control-Allow-Origin": process.env.ALLOWED_ORIGIN || "*",
    "Access-Control-Allow-Methods": "GET, PUT, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Cache-Control": "no-store",
    "Content-Type": "application/json; charset=UTF-8"
  };
}

function response(body, statusCode = 200) {
  return {
    statusCode,
    headers: corsHeaders(),
    body: JSON.stringify(body)
  };
}

function requestMethod(event) {
  return String(event.httpMethod || event.requestContext?.http?.method || event.requestContext?.httpMethod || "GET").toUpperCase();
}

function requestBody(event) {
  if (typeof event.body === "string") return JSON.parse(event.isBase64Encoded ? Buffer.from(event.body, "base64").toString("utf8") : event.body);
  return event.body || event;
}

function normalizeExpenses(input) {
  if (!Array.isArray(input)) throw new Error("Request body must be an expenses array");
  if (input.length > 500) throw new Error("At most 500 expense records are allowed");
  return input.map((item, index) => {
    const date = String(item?.date || "其他");
    const category = String(item?.category || "其他");
    const amount = Number(item?.amount);
    if (!DATE_OPTIONS.has(date)) throw new Error(`Invalid date at record ${index + 1}`);
    if (!CATEGORY_OPTIONS.has(category)) throw new Error(`Invalid category at record ${index + 1}`);
    if (!Number.isFinite(amount) || amount < 0 || amount > 10000000) throw new Error(`Invalid amount at record ${index + 1}`);
    return {
      id: String(item?.id || `${Date.now()}-${index}`).slice(0, 100),
      date,
      category,
      item: String(item?.item || "").trim().slice(0, 200),
      amount: Math.round(amount * 100) / 100,
      payer: String(item?.payer || "").trim().slice(0, 50)
    };
  });
}

async function runSql(sql, params = {}) {
  return getModels().$runSQL(sql, params);
}

function queryRows(result) {
  return result?.data?.executeResultList || result?.executeResultList || [];
}

async function readExpenses() {
  const result = await runSql(`SELECT payload FROM \`${TABLE_NAME}\` WHERE _id = {{id}} LIMIT 1`, { id: DOCUMENT_ID });
  const row = queryRows(result)[0];
  if (!row?.payload) return [];
  return normalizeExpenses(JSON.parse(row.payload));
}

async function saveExpenses(expenses) {
  const payload = JSON.stringify(expenses);
  const updatedAt = new Date().toISOString();
  const updateResult = await runSql(`UPDATE \`${TABLE_NAME}\` SET payload = {{payload}}, updated_at = {{updatedAt}} WHERE _id = {{id}}`, {
    id: DOCUMENT_ID,
    payload,
    updatedAt
  });
  if (!queryRows(updateResult).length && !updateResult?.data?.total) {
    await runSql(`INSERT INTO \`${TABLE_NAME}\` (_id, payload, updated_at) VALUES ({{id}}, {{payload}}, {{updatedAt}})`, {
      id: DOCUMENT_ID,
      payload,
      updatedAt
    });
  }
  return expenses;
}

exports.main_handler = async (event) => {
  const method = requestMethod(event);

  if (method === "OPTIONS") {
    return { statusCode: 204, headers: corsHeaders(), body: "" };
  }

  try {
    if (method === "GET") return response(await readExpenses());
    if (method === "PUT" || method === "POST") {
      const body = requestBody(event);
      const expenses = normalizeExpenses(Array.isArray(body) ? body : body.expenses);
      return response(await saveExpenses(expenses));
    }
    return response({ error: "Method not allowed" }, 405);
  } catch (error) {
    return response({ error: error instanceof Error ? error.message : "Unexpected error" }, 500);
  }
};
