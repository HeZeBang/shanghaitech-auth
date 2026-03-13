import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { sessionStore } from "@/lib/session-store";

const LOGIN_URL =
  "https://ids.shanghaitech.edu.cn/authserver/login?service=https://egate.shanghaitech.edu.cn/xsfw/sys/jbxxapp/*default/index.do";

const USER_CONF_URL =
  "https://ids.shanghaitech.edu.cn/personalInfo/common/getUserConf";

const JBXX_UI_URL = 
  "https://egate.shanghaitech.edu.cn/xsfw/sys/jbxxapp/*default/index.do#/jbxx";

const JBXX_APP_URL =
  "https://egate.shanghaitech.edu.cn/xsfw/sys/funauthapp/api/getAppConfig/jbxxapp-4585275700341858.do?v=08082535938553316";

const JBXX_URL =
  "https://egate.shanghaitech.edu.cn/xsfw/sys/jbxxapp/modules/jbxx/cxxsjbxx.do";

const HEADERS: Record<string, string> = {
  "User-Agent":
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36 Edg/115.0.1901.188",
  "sec-ch-ua":
    '"Not/A)Brand";v="99", "Microsoft Edge";v="115", "Chromium";v="115"',
  "sec-ch-ua-mobile": "?0",
  "sec-ch-ua-platform": '"Windows"',
};

/** Parse a named hidden input value from the HTML */
function collectData(text: string, name: string, endTag: string): string {
  let startIdx: number;
  if (name === "pwdEncryptSalt") {
    startIdx = text.indexOf(`id="${name}"`);
  } else {
    startIdx = text.indexOf(`name="${name}"`);
  }
  if (startIdx === -1) return "";
  const endIdx = text.indexOf(endTag, startIdx);
  const raw = text.substring(startIdx, endIdx);
  const valueStart = raw.indexOf('value="') + 7;
  const valueEnd = raw.indexOf('"', valueStart);
  return raw.substring(valueStart, valueEnd);
}

/** AES-CBC encrypt password, matching the Python implementation exactly */
function encryptPassword(password: string, salt: string): string {
  const prefix = Buffer.from("Nu1L".repeat(16));
  const combined = Buffer.concat([prefix, Buffer.from(password)]);

  const blockSize = 16;
  const padLen = blockSize - (combined.length % blockSize);
  const padded = Buffer.concat([combined, Buffer.alloc(padLen, padLen)]);

  const iv = Buffer.from("Nu1L".repeat(4));
  const key = Buffer.from(salt);
  const cipher = crypto.createCipheriv("aes-128-cbc", key, iv);
  cipher.setAutoPadding(false);
  const encrypted = Buffer.concat([cipher.update(padded), cipher.final()]);
  return encrypted.toString("base64");
}

/**
 * Merge Set-Cookie headers into a simple cookie-jar string.
 */
function mergeSetCookies(existing: string, response: Response): string {
  const jar = new Map<string, string>();

  if (existing) {
    for (const part of existing.split("; ")) {
      const eq = part.indexOf("=");
      if (eq > 0) jar.set(part.substring(0, eq), part.substring(eq + 1));
    }
  }

  const setCookies = response.headers.getSetCookie?.() ?? [];
  for (const sc of setCookies) {
    const cookiePart = sc.split(";")[0].trim();
    const eq = cookiePart.indexOf("=");
    if (eq > 0) {
      jar.set(cookiePart.substring(0, eq), cookiePart.substring(eq + 1));
    }
  }

  return [...jar.entries()].map(([k, v]) => `${k}=${v}`).join("; ");
}

/**
 * Follow redirects manually, accumulating cookies across hops.
 */
async function fetchWithCookies(
  url: string,
  init: RequestInit & { cookieJar?: string } = {}
): Promise<{ response: Response; cookies: string; body: string }> {
  let currentUrl = url;
  let cookies = init.cookieJar ?? "";
  let resp: Response;
  let body = "";
  const maxRedirects = 10;

  for (let i = 0; i <= maxRedirects; i++) {
    const headers: Record<string, string> = {
      ...HEADERS,
      ...(init.headers as Record<string, string>),
    };
    if (cookies) headers["Cookie"] = cookies;

    resp = await fetch(currentUrl, {
      ...init,
      headers,
      redirect: "manual",
    });

    cookies = mergeSetCookies(cookies, resp);

    const status = resp.status;
    if (status >= 300 && status < 400) {
      const location = resp.headers.get("location");
      if (!location) break;
      currentUrl = new URL(location, currentUrl).href;
      init = { ...init, method: "GET", body: undefined };
      continue;
    }

    body = await resp.text();
    return { response: resp, cookies, body };
  }

  body = await resp!.text();
  return { response: resp!, cookies, body };
}

export async function POST(req: NextRequest) {
  try {
    const { username, password } = await req.json();
    if (!username || !password) {
      return NextResponse.json(
        { success: false, subject: "", error: "用户名和密码不能为空" },
        { status: 400 }
      );
    }

    // Step 1: GET login page to collect hidden fields + cookies
    const getResult = await fetchWithCookies(LOGIN_URL);
    const html = getResult.body;
    const jarAfterGet = getResult.cookies;

    const lt = collectData(html, "lt", "/>");
    const execution = collectData(html, "execution", "/>");
    const salt = collectData(html, "pwdEncryptSalt", "/>");

    if (!salt) {
      return NextResponse.json(
        { success: false, subject: "", error: "无法获取加密盐值，登录页面解析失败" },
        { status: 502 }
      );
    }

    // Step 2: Encrypt password
    const encryptedPwd = encryptPassword(password, salt);

    // Step 3: POST login form
    const formData = new URLSearchParams({
      username,
      password: encryptedPwd,
      lt,
      dllt: "generalLogin",
      execution,
      _eventId: "submit",
      rmShown: "1",
    });

    const postResult = await fetchWithCookies(LOGIN_URL, {
      method: "POST",
      body: formData.toString(),
      cookieJar: jarAfterGet,
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
    });

    const finalCookies = postResult.cookies;
    const finalBody = postResult.body;

    console.log("Final cookies after login attempt:", finalCookies);

    // Check if login was successful
    const hasError =
      finalBody.includes("authError") ||
      finalBody.includes("用户名或密码") ||
      finalBody.includes("incorrectPassword");

    if (hasError) {
      return NextResponse.json(
        { success: false, subject: "", error: "用户名或密码错误" },
        { status: 401 }
      );
    }

    // Step 4: Get user info using the authenticated cookies
    const infoResp = await fetch(USER_CONF_URL, {
      method: "POST",
      headers: {
        Cookie: finalCookies,
        ...HEADERS,
      },
    });

    const infoData = await infoResp.json();

    if (infoData.code !== "0" || !infoData.datas) {
      return NextResponse.json(
        { success: false, subject: "", error: "获取用户信息失败" },
        { status: 502 }
      );
    }

    const subject = infoData.datas.uid as string;
    const name = infoData.datas.cn as string;

    // Step 5: Try to fetch email from egate.shanghaitech.edu.cn
    let email = "";
    try {
      const loginEgateResp = await fetchWithCookies(JBXX_UI_URL, {
        method: "GET",
        cookieJar: finalCookies,
      });

      const egateCookies = loginEgateResp.cookies;

      const egateAppResp = await fetchWithCookies(JBXX_APP_URL, {
        method: "GET",
        cookieJar: egateCookies,
      });

      const appCookies = egateAppResp.cookies;

      const emailResp = await fetchWithCookies(JBXX_URL, {
        method: "GET",
        cookieJar: appCookies,
      });
      
      const emailData = JSON.parse(emailResp.body);
      const rows = emailData?.datas?.cxxsjbxx?.rows;
      if (Array.isArray(rows) && rows.length > 0 && rows[0].DZXX) {
        email = rows[0].DZXX;
      }
    } catch (e: unknown) {
      console.error("Failed to fetch email:", e);
      // Email fetch failed, leave empty
    }

    const userInfo = { sid: subject, name, email };

    // Store session data for later userinfo retrieval during consent
    sessionStore.set(subject, { cookies: finalCookies, email });

    return NextResponse.json({
      success: true,
      subject,
      user_info: userInfo,
    });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : String(e);
    return NextResponse.json(
      { success: false, subject: "", error: message },
      { status: 500 }
    );
  }
}
