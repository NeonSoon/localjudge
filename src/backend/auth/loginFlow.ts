import axios, { AxiosInstance } from "axios";
import { CookieJar, type Cookie } from "tough-cookie";
import type * as vscode from "vscode";

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
    token?: string;
};

export type TokenListItem = {
    id: string;
    purpose: string;
    user_id: string;
    created_at: string;
    token?: string;
};

function normalizeBaseUrl(raw: string) {
    return raw.replace(/\/api\/?$/i, "").replace(/\/+$/, "");
}

function maskToken(token: string, head = 6, tail = 4) {
    if (!token) return "";
    if (token.length <= head + tail) return token;
    return `${token.slice(0, head)}...${token.slice(-tail)}`;
}

async function createClient(baseUrl: string): Promise<{ client: AxiosInstance; jar: CookieJar }> {
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
            validateStatus: () => true,
        } as any)
    );

    client.interceptors.request.use(async (config) => {
        const url = new URL(config.url ?? "", config.baseURL);
        const cookieHeader = await jar.getCookieString(url.toString());
        console.log(
            `[loginFlow][REQ] ${String(config.method).toUpperCase()} ${url.toString()} cookieLen=${cookieHeader.length}`
        );
        return config;
    });

    return { client, jar };
}

function pickLatestByPurpose(list: TokenListItem[], purpose: string): TokenListItem | undefined {
    const filtered = list.filter((x) => x && x.purpose === purpose);
    const candidates = (filtered.length > 0 ? filtered : list).map((x) => ({
        item: x,
        t: Number.isFinite(Date.parse(x.created_at)) ? Date.parse(x.created_at) : 0,
    }));
    candidates.sort((a, b) => b.t - a.t);
    return candidates[0]?.item;
}

function sanitizeTokens(value: any): any {
    if (Array.isArray(value)) return value.map(sanitizeTokens);
    if (value && typeof value === "object") {
        const copy: Record<string, any> = {};
        for (const [k, v] of Object.entries(value)) {
            if (typeof v === "string" && k.toLowerCase().includes("token")) {
                copy[k] = `[masked len=${v.length} preview=${maskToken(v)}]`;
            } else {
                copy[k] = sanitizeTokens(v);
            }
        }
        return copy;
    }
    return value;
}

function previewBody(data: any) {
    try {
        const sanitized = sanitizeTokens(data);
        return JSON.stringify(sanitized).slice(0, 500);
    } catch {
        return String(data).slice(0, 500);
    }
}

async function logCookieDiagnostics(jar: CookieJar, url: string, label: string) {
    const cookieStr = await jar.getCookieString(url);
    const cookieKeys = (await jar.getCookies(url)).map((c: Cookie) => c.key);
    console.log(
        `[loginFlow][${label}] tokenApi.url=${url} cookieLen=${cookieStr.length} cookieKeys=${JSON.stringify(
            cookieKeys
        )}`
    );
    return { cookieStr, cookieKeys };
}

export async function loginWithUsernamePassword(args: {
    baseUrl: string;
    username: string;
    password: string;
    purpose?: string;
    context?: vscode.ExtensionContext;
}): Promise<{ token: string; tokenId?: string; user: SignInResponse }> {
    console.log("[loginFlow][VERSION] 2026-01-19-MANUAL-COOKIE-TOKENID");

    const _context = args.context; // reserved for future use (lint guard)
    void _context;

    const purpose = args.purpose ?? "localjudge";
    const baseUrl = normalizeBaseUrl(args.baseUrl);
    const hostRoot = `${new URL(baseUrl).protocol}//${new URL(baseUrl).host}/`;

    console.log("[loginFlow][STEP 1] create client");
    console.log("[loginFlow][DEBUG] baseUrl =", baseUrl);
    console.log("[loginFlow][DEBUG] hostRoot =", hostRoot);
    console.log("[loginFlow][DEBUG] purpose =", purpose);

    const { client, jar } = await createClient(baseUrl);

    console.log("[loginFlow][STEP 2] POST /api/user/signin");
    const signin = await client.post<SignInResponse>("/api/user/signin", {
        username: args.username,
        password: args.password,
    });

    console.log("[loginFlow][STEP 2] status =", signin.status);
    const setCookies: string[] = (signin.headers as any)?.["set-cookie"] ?? [];
    console.log("[loginFlow][STEP 2] setCookieCount =", setCookies.length);

    if (signin.status !== 200) {
        console.error("[loginFlow][FAIL] signin failed", {
            status: signin.status,
            data: (signin as any).data,
            headers: signin.headers,
        });
        throw Object.assign(new Error("Signin failed"), { response: signin });
    }

    const user = signin.data;
    console.log("[loginFlow][STEP 2] user =", {
        id: user.id,
        username: user.username,
        role: user.role_name,
    });

    console.log("[loginFlow][STEP 3] ensure cookies in jar");
    const beforeKeys = (await jar.getCookies(hostRoot)).map((c) => c.key);
    console.log("[loginFlow][STEP 3] jarKeys(before) =", beforeKeys);

    if (beforeKeys.length === 0 && setCookies.length > 0) {
        console.warn("[loginFlow][WARN] jar empty, applying Set-Cookie manually...");
        for (const sc of setCookies) {
            await jar.setCookie(sc, hostRoot);
        }
    }

    const afterCookies = await jar.getCookies(hostRoot);
    console.log(
        "[loginFlow][STEP 3] jarCookies(after) =",
        afterCookies.map((c: Cookie) => ({
            key: c.key,
            domain: c.domain,
            path: c.path,
            httpOnly: c.httpOnly,
            secure: c.secure,
        }))
    );

    const accessCookie = afterCookies.find((c) => c.key === "access_token");
    const cookieToken = accessCookie?.value ?? "";
    console.log("[loginFlow][STEP 3] access_token exists =", Boolean(cookieToken));
    console.log("[loginFlow][STEP 3] access_token len =", cookieToken.length);

    const tokenApiUrl = new URL("/api/user/token", `${baseUrl}/`).toString();

    // STEP 4A: POST /api/user/token
    await logCookieDiagnostics(jar, tokenApiUrl, "STEP 4A");
    const postCookieStr = await jar.getCookieString(tokenApiUrl);
    console.log("[loginFlow][STEP 4A] POST /api/user/token");

    const tokenPostResp = await client.post<CreateTokenResponse>(
        "/api/user/token",
        { purpose },
        { headers: { Cookie: postCookieStr } }
    );

    console.log("[loginFlow][STEP 4A] status =", tokenPostResp.status);
    console.log("[loginFlow][STEP 4A] content-type =", (tokenPostResp.headers as any)?.["content-type"]);
    console.log("[loginFlow][STEP 4A] bodyPreview =", previewBody(tokenPostResp.data));

    let postToken = "";
    let postTokenId = "";

    if (tokenPostResp.status === 200) {
        const data = tokenPostResp.data;
        if (data && typeof data.token === "string" && data.token.trim()) {
            postToken = data.token.trim();
        }
        if (data && (typeof (data as any).id === "string" || typeof (data as any).id === "number")) {
            postTokenId = String((data as any).id);
        }
        console.log("[loginFlow][STEP 4A] tokenId =", postTokenId || "(none)");
        console.log("[loginFlow][STEP 4A] tokenLen =", postToken.length);
    }

    // STEP 4B: GET /api/user/token (fallback if POST failed)
    let getTokenId: string | undefined;

    if (tokenPostResp.status !== 200) {
        await logCookieDiagnostics(jar, tokenApiUrl, "STEP 4B");
        const getCookieStr = await jar.getCookieString(tokenApiUrl);
        console.log("[loginFlow][STEP 4B] GET /api/user/token");

        const tokenGetResp = await client.get<TokenListItem[]>("/api/user/token", {
            headers: { Cookie: getCookieStr },
        });

        console.log("[loginFlow][STEP 4B] status =", tokenGetResp.status);
        console.log("[loginFlow][STEP 4B] content-type =", (tokenGetResp.headers as any)?.["content-type"]);
        console.log("[loginFlow][STEP 4B] bodyPreview =", previewBody(tokenGetResp.data));

        if (tokenGetResp.status === 200 && Array.isArray(tokenGetResp.data)) {
            const picked = pickLatestByPurpose(tokenGetResp.data, purpose);
            if (picked && (typeof picked.id === "string" || typeof picked.id === "number")) {
                getTokenId = String(picked.id);
            }
            console.log("[loginFlow][STEP 4B] tokenId(picked) =", getTokenId ?? "(none)");
            console.log(
                "[loginFlow][STEP 4B] list.size =",
                Array.isArray(tokenGetResp.data) ? tokenGetResp.data.length : "(none)"
            );
        }
    }

    // Decide final token + tokenId
    let finalToken = "";
    let finalTokenId: string | undefined;

    if (postTokenRespOk(tokenPostResp.status) && postToken) {
        finalToken = postToken;
        finalTokenId = postTokenId || undefined;
    } else if (postTokenRespOk(tokenPostResp.status) && !postToken) {
        finalToken = cookieToken || postToken;
        finalTokenId = postTokenId || undefined;
    } else if (getTokenId) {
        finalToken = cookieToken || postToken;
        finalTokenId = getTokenId;
    } else {
        finalToken = cookieToken || postToken || "";
        finalTokenId = postTokenId || getTokenId;
    }

    const finalTokenMasked = maskToken(finalToken);
    console.log("[loginFlow][RESULT] tokenLen =", finalToken.length, "token(masked) =", finalTokenMasked);
    console.log("[loginFlow][RESULT] tokenId =", finalTokenId ?? "(none)");

    if (!finalToken) {
        throw new Error("No usable token found. API did not return token string and access_token cookie is missing.");
    }

    return { token: finalToken, tokenId: finalTokenId, user };
}

function postTokenRespOk(status: number | undefined) {
    return status === 200;
}
