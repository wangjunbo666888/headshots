import { createServerComponentClient } from "@supabase/auth-helpers-nextjs";
import { NextResponse } from "next/server";
import { cookies } from "next/headers";

/**
 * 此路由已更新为与Cloudflare R2存储配合使用
 * 原Vercel Blob上传逻辑已移除
 * 现在它会重定向到R2上传接口
 */
export async function POST(request: Request): Promise<NextResponse> {
  // 维持原有的身份验证
  const supabase = createServerComponentClient({ cookies });
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401 }
    );
  }

  // 为了保持与现有前端代码的兼容性，我们返回一个特殊的响应
  // 告诉前端使用新的R2上传端点
  return NextResponse.json({
    message: "Please use the new R2 upload endpoint: /api/r2/upload-url",
    redirectToR2: true
  });

  // 注意：如果你的前端代码依赖于旧的Vercel Blob上传路由，
  // 你可能需要修改前端代码，使其直接调用新的R2上传端点
}
