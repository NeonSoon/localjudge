import axios, { AxiosInstance } from "axios";
import { CookieJar, type Cookie } from "tough-cookie";

export type SignInResponse = {
  id: string;
  username: string;
  role_name: string;
  auth_type: string;
  created_at: string;
  updated_at: string | null;
};

export type CreateTokenResponse = {
  id: string;
  purpose: string;
  user_id: string;
  created_at: string;
  token?: string; // ⚠️ 後端可能不再回 token 明文，所以改成 optional
};

export type TokenListItem = {
  id: string;
  purpose: string;
  user_id: string;
  created_at: string;
  token?: string; // 以防後端某些情況會回
};

function hostRootFromBaseUrl(baseUrl: string) {
  const u = new URL(baseUrl);
  return `${u.protocol}//${u.host}/`;
}

async function createClient(
  baseUrl: string
): Promise<{ client: AxiosInstance; jar: CookieJar }> {
  const mod = await import("axios-cookiejar-support");
  const wrapper = mod.wrapper;

  const jar = new CookieJar();

  const client = wrapper(
    axios.create({
      baseURL: baseUrl,
      withCredentials: true,
      jar,
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      timeout: 15000,
      // 建議加：避免某些環境 3xx/4xx 被當成非預期（你仍會 catch）
      validateStatus: () => true,
    } as any)
  );

  // Debug：印出每次 request 最終 URL + Cookie（測試字段）
  client.interceptors.request.use(async (config) => {
    const url = new URL(config.url ?? "", config.baseURL);
    const cookieHeader = await jar.getCookieString(url.toString());
    console.log(
      `[loginFlow][REQ] ${String(config.method).toUpperCase()} ${url.toString()} CookieLen=${cookieHeader.length}`
    );
    return config;
  });

  return { client, jar };
}

export async function loginWithUsernamePassword(args: {
  baseUrl: string;
  username: string;
  password: string;
  purpose?: string;
}): Promise<{ token: string; user: SignInResponse }> {
  console.log("[loginFlow][VERSION] 2026-01-17-FIX-GETTOKEN-COOKIEFALLBACK");

  const { baseUrl, username, password } = args;
  const purpose = args.purpose ?? "localjudge";
  const hostRoot = hostRootFromBaseUrl(baseUrl);

  // ===============================
  // STEP 1：建立 client
  // ===============================
  console.log("[loginFlow][STEP 1] create client");
  console.log("[loginFlow][TEST] baseUrl =", baseUrl);
  console.log("[loginFlow][TEST] hostRoot =", hostRoot);

  const { client, jar } = await createClient(baseUrl);

  // ===============================
  // STEP 2：/user/signin（注意：不要用 /user/...，避免覆蓋 baseUrl 的 /api）
  // ===============================
  console.log("[loginFlow][STEP 2] POST /api/user/signin");
  const signin = await client.post<SignInResponse>("/api/user/signin", {
    username,
    password,
  });

  console.log("[loginFlow][TEST] signin.status =", signin.status);
  const setCookies: string[] = (signin.headers as any)?.["set-cookie"] ?? [];
  console.log("[loginFlow][TEST] signin.setCookieCount =", setCookies.length);

  if (signin.status !== 200) {
    // 盡量把錯誤訊息印出（測試字段）
    console.error("[loginFlow][FAIL] signin failed", {
      status: signin.status,
      data: (signin as any).data,
      headers: signin.headers,
    });
    throw Object.assign(new Error("Signin failed"), { response: signin });
  }

  const user = signin.data;
  console.log("[loginFlow][TEST] signin.user =", {
    id: user.id,
    username: user.username,
    role: user.role_name,
  });

  // ===============================
  // STEP 3：確保 cookie 進 jar（手動 set-cookie 修正）
  // ===============================
  console.log("[loginFlow][STEP 3] ensure cookies in jar");

  // 先看目前 jar
  const beforeKeys = (await jar.getCookies(hostRoot)).map((c) => c.key);
  console.log("[loginFlow][TEST] jarKeys(before) =", beforeKeys);

  // 若 jar 沒有 cookie，就手動寫入 set-cookie
  if (beforeKeys.length === 0 && setCookies.length > 0) {
    console.warn("[loginFlow][WARN] jar empty, applying Set-Cookie manually...");
    for (const sc of setCookies) {
      await jar.setCookie(sc, hostRoot);
    }
  }

  const afterCookies = await jar.getCookies(hostRoot);
  console.log(
    "[loginFlow][TEST] jarCookies(after) =",
    afterCookies.map((c: Cookie) => ({
      key: c.key,
      domain: c.domain,
      path: c.path,
      httpOnly: c.httpOnly,
      secure: c.secure,
    }))
  );

  const cookieStrApi = await jar.getCookieString(new URL("api/", hostRoot).toString());
  console.log("[loginFlow][TEST] cookieString(/api) len =", cookieStrApi.length);

  // 先把 cookie 裡的 access_token 抓出來（當作 fallback token）
  const accessCookie = afterCookies.find((c) => c.key === "access_token");
  const cookieToken = accessCookie?.value ?? "";

  console.log("[loginFlow][TEST] access_token(cookie) exists =", Boolean(cookieToken));
  console.log("[loginFlow][TEST] access_token(cookie) len =", cookieToken.length);

  // ===============================
  // STEP 4：GET /user/token（你瀏覽器證實這條存在）
  // ===============================
  console.log("[loginFlow][STEP 4] GET /api/user/token");
  const tokenListResp = await client.get<TokenListItem[] | CreateTokenResponse | any>("/api/user/token");

  console.log("[loginFlow][TEST] tokenList.status =", tokenListResp.status);
  console.log(
    "[loginFlow][TEST] tokenList.contentType =",
    (tokenListResp.headers as any)?.["content-type"]
  );

  // 若 GET 回非 200，仍可用 cookieToken 當 fallback
  if (tokenListResp.status !== 200) {
    console.warn("[loginFlow][WARN] GET user/token not 200, fallback to cookie token");
  }

  // 嘗試從 API 回應中找 token（如果後端有提供明文）
  let apiToken = "";
  const data = tokenListResp.data;

  // case A: { token: "..." }
  if (data && typeof data === "object" && typeof data.token === "string") {
    apiToken = data.token;
  }

  // case B: [ {..., token?} ]
  if (!apiToken && Array.isArray(data) && data.length > 0) {
    const last = data[data.length - 1];
    if (last && typeof last === "object" && typeof last.token === "string") {
      apiToken = last.token;
    }
  }

  console.log("[loginFlow][TEST] apiToken(found) =", Boolean(apiToken));
  console.log("[loginFlow][TEST] apiToken len =", apiToken.length);

  // ===============================
  // STEP 5：決定最終 token 來源
  // ===============================
  let finalToken = "";
  let tokenSource: "api" | "cookie" | "none" = "none";

  if (apiToken) {
    finalToken = apiToken;
    tokenSource = "api";
  } else if (cookieToken) {
    finalToken = cookieToken;
    tokenSource = "cookie";
  }

  console.log("[loginFlow][STEP 5] tokenSource =", tokenSource);
  console.log("[loginFlow][STEP 5] finalToken len =", finalToken.length);

  if (!finalToken) {
    // 這代表後端不給 token 明文、cookie 也拿不到（不太可能）
    throw new Error(
      "No usable token found. API did not return token string and access_token cookie is missing."
    );
  }

  console.log("[loginFlow][SUCCESS] login completed");
  return { token: finalToken, user };
}
