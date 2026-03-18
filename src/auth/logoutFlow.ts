import axios from "axios";
import type * as vscode from "vscode";
import { getAuth, clearAuth } from "./tokenStore";

function normalizeBaseUrl(raw: string) {
  return raw.replace(/\/api\/?$/i, "").replace(/\/+$/, "");
}

export async function logoutAndRevokeToken(args: {
  baseUrl: string;
  context: vscode.ExtensionContext;
}): Promise<void> {
  const { baseUrl, context } = args;
  const apiBase = normalizeBaseUrl(baseUrl);

  const { token, tokenId } = await getAuth(context);

  // 沒 token 直接當成已登出
  if (!tokenId) {
    await clearAuth(context);
    return;
  }

  try {
    await axios.delete(
      `${apiBase}/api/delete/user/token/${tokenId}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/json",
        },
        validateStatus: () => true,
        timeout: 10000,
      }
    );
  } catch (err) {
    // ❗ 登出時「不阻擋」，只記錄
    console.warn("[logout] revoke token failed", err);
  } finally {
    // 無論如何都清本地
    await clearAuth(context);
  }
}
