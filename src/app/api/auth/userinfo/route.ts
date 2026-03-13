import { NextRequest, NextResponse } from "next/server";
import { sessionStore } from "@/lib/session-store";

const USER_CONF_URL =
  "https://ids.shanghaitech.edu.cn/personalInfo/common/getUserConf";

const HEADERS: Record<string, string> = {
  "User-Agent":
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36 Edg/115.0.1901.188",
};

export async function POST(req: NextRequest) {
  try {
    const { subject } = await req.json();
    if (!subject) {
      return NextResponse.json(
        { success: false, error: "缺少 subject" },
        { status: 400 }
      );
    }

    const session = sessionStore.get(subject);
    if (!session) {
      return NextResponse.json(
        { success: false, error: "Session not found or expired" },
        { status: 404 }
      );
    }

    const resp = await fetch(USER_CONF_URL, {
      method: "POST",
      headers: {
        Cookie: session.cookies,
        ...HEADERS,
      },
    });

    const data = await resp.json();

    if (data.code !== "0" || !data.datas) {
      return NextResponse.json(
        { success: false, error: "获取用户信息失败" },
        { status: 502 }
      );
    }

    return NextResponse.json({
      success: true,
      user_info: {
        sid: data.datas.uid,
        name: data.datas.cn,
        email: session.email,
      },
    });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : String(e);
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}
