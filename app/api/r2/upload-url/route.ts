import { createServerComponentClient } from "@supabase/auth-helpers-nextjs";
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getUploadUrl } from "@/lib/cloudflare-r2";

/**
 * 处理POST请求，生成用于上传到R2的预签名URL
 * 这个接口需要用户认证才能使用
 */
export async function POST(request: Request) {
  const supabase = createServerComponentClient({ cookies });
  const { data: { user } } = await supabase.auth.getUser();

  // 检查用户是否已认证
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { fileName, contentType } = await request.json();
    
    // 验证请求参数
    if (!fileName || !contentType) {
      return NextResponse.json(
        { error: "Missing fileName or contentType" },
        { status: 400 }
      );
    }

    // 生成预签名上传URL
    const uploadData = await getUploadUrl(fileName, contentType);
    
    return NextResponse.json(uploadData);
  } catch (error) {
    console.error("Error generating upload URL:", error);
    return NextResponse.json(
      { error: (error as Error).message },
      { status: 500 }
    );
  }
} 