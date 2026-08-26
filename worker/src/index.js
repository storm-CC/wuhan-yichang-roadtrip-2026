const DATE_OPTIONS = new Set(["9月30日", "10月1日", "10月2日", "10月3日", "10月4日", "10月5日", "10月6日", "10月7日", "其他"]);
const CATEGORY_OPTIONS = new Set(["住宿", "餐饮", "门票", "充电", "停车", "其他"]);

export default {
  async fetch(request, env) {
    const cors = corsHeaders(request, env);

    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: cors });
    }

    try {
      const url = new URL(request.url);

      if (url.pathname === "/health" && request.method === "GET") {
        return json({ ok: true, service: "wuhan-yichang-expense-api" }, 200, cors);
      }

      if (url.pathname !== "/expenses") {
        return json({ error: "Not found" }, 404, cors);
      }

      if (request.method === "GET") {
        const { expenses } = await readExpenses(env);
        return json(expenses, 200, { ...cors, "Cache-Control": "no-store" });
      }

      if (request.method === "PUT" || request.method === "POST") {
        const body = await request.json();
        const expenses = normalizeExpenses(Array.isArray(body) ? body : body.expenses);
        const saved = await saveExpensesWithRetry(expenses, env);
        return json(saved, 200, { ...cors, "Cache-Control": "no-store" });
      }

      return json({ error: "Method not allowed" }, 405, { ...cors, Allow: "GET, PUT, POST, OPTIONS" });
    } catch (error) {
      return json({ error: error instanceof Error ? error.message : "Unexpected error" }, 500, cors);
    }
  }
};

function corsHeaders(request, env) {
  const origin = request.headers.get("Origin") || "";
  const allowedOrigins = String(env.ALLOWED_ORIGINS || "*").split(",").map((item) => item.trim()).filter(Boolean);
  const allowOrigin = allowedOrigins.includes("*") || allowedOrigins.includes(origin) ? (allowedOrigins.includes("*") ? "*" : origin) : allowedOrigins[0] || "null";
  return {
    "Access-Control-Allow-Origin": allowOrigin,
    "Access-Control-Allow-Methods": "GET, PUT, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Vary": "Origin",
    "Content-Type": "application/json; charset=UTF-8"
  };
}

function json(body, status, headers) {
  return new Response(JSON.stringify(body), { status, headers });
}

function githubConfig(env) {
  const required = ["GITHUB_TOKEN", "GITHUB_OWNER", "GITHUB_REPO"];
  const missing = required.filter((key) => !env[key]);
  if (missing.length) throw new Error(`Missing Worker configuration: ${missing.join(", ")}`);
  return {
    token: env.GITHUB_TOKEN,
    owner: env.GITHUB_OWNER,
    repo: env.GITHUB_REPO,
    branch: env.GITHUB_BRANCH || "main",
    path: env.GITHUB_PATH || "data/expenses.json"
  };
}

async function githubContentsRequest(env, method = "GET", body) {
  const config = githubConfig(env);
  const endpoint = `https://api.github.com/repos/${encodeURIComponent(config.owner)}/${encodeURIComponent(config.repo)}/contents/${config.path.split("/").map(encodeURIComponent).join("/")}`;
  const response = await fetch(endpoint, {
    method,
    headers: {
      Accept: "application/vnd.github+json",
      Authorization: `Bearer ${config.token}`,
      "X-GitHub-Api-Version": "2022-11-28",
      "User-Agent": "wuhan-yichang-expense-api",
      ...(body ? { "Content-Type": "application/json" } : {})
    },
    ...(body ? { body: JSON.stringify(body) } : {})
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    const error = new Error(payload.message || `GitHub API request failed: ${response.status}`);
    error.status = response.status;
    throw error;
  }
  return payload;
}

async function readExpenses(env) {
  try {
    const payload = await githubContentsRequest(env, "GET");
    const content = decodeBase64(payload.content || "");
    return { expenses: normalizeExpenses(JSON.parse(content)), sha: payload.sha };
  } catch (error) {
    if (error.status === 404) return { expenses: [], sha: null };
    throw error;
  }
}

async function saveExpensesWithRetry(expenses, env) {
  let lastError;
  for (let attempt = 0; attempt < 3; attempt += 1) {
    try {
      const current = await readExpenses(env);
      const config = githubConfig(env);
      const payload = {
        message: `chore: update trip expenses (${new Date().toISOString()})`,
        content: encodeBase64(`${JSON.stringify(expenses, null, 2)}\n`),
        branch: config.branch,
        ...(current.sha ? { sha: current.sha } : {})
      };
      await githubContentsRequest(env, "PUT", payload);
      return expenses;
    } catch (error) {
      lastError = error;
      if (error.status !== 409) throw error;
    }
  }
  throw lastError || new Error("Could not save expenses");
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
      id: String(item?.id || crypto.randomUUID()).slice(0, 100),
      date,
      category,
      item: String(item?.item || "").trim().slice(0, 200),
      amount: Math.round(amount * 100) / 100,
      payer: String(item?.payer || "").trim().slice(0, 50)
    };
  });
}

function encodeBase64(value) {
  const bytes = new TextEncoder().encode(value);
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary);
}

function decodeBase64(value) {
  const binary = atob(value.replace(/\n/g, ""));
  const bytes = Uint8Array.from(binary, (character) => character.charCodeAt(0));
  return new TextDecoder().decode(bytes);
}
