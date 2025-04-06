import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { createPresignedPost } from '@aws-sdk/s3-request-presigner';

/**
 * 初始化S3客户端连接到Cloudflare R2
 */
export const r2Client = new S3Client({
  region: 'auto',
  endpoint: `https://${process.env.CLOUDFLARE_R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.CLOUDFLARE_R2_ACCESS_KEY_ID as string,
    secretAccessKey: process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY as string,
  },
});

export const bucketName = process.env.CLOUDFLARE_R2_BUCKET_NAME as string;

/**
 * 生成用于直接上传到R2的预签名URL
 * @param fileName - 文件名
 * @param contentType - 文件类型
 * @returns 包含上传URL、表单字段和公共访问URL的对象
 */
export async function getUploadUrl(fileName: string, contentType: string) {
  const key = `${Date.now()}-${fileName}`;
  
  const { url, fields } = await createPresignedPost(r2Client, {
    Bucket: bucketName,
    Key: key,
    Conditions: [
      ['content-length-range', 0, 10485760], // 10MB 最大限制
      ['starts-with', '$Content-Type', ''],
    ],
    Fields: {
      'Content-Type': contentType,
    },
    Expires: 600, // 10分钟有效期
  });

  // 构建公共访问URL
  const publicUrl = process.env.CLOUDFLARE_R2_PUBLIC_URL 
    ? `${process.env.CLOUDFLARE_R2_PUBLIC_URL}/${key}`
    : `https://${bucketName}.${process.env.CLOUDFLARE_R2_ACCOUNT_ID}.r2.cloudflarestorage.com/${key}`;

  return {
    uploadUrl: url,
    fields,
    publicUrl,
    key,
  };
}

/**
 * 客户端上传文件到R2的函数
 * @param file - 要上传的文件
 * @returns 包含上传后的公共URL的对象
 */
export async function uploadToR2(file: File) {
  try {
    // 获取预签名上传URL
    const response = await fetch('/api/r2/upload-url', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        fileName: file.name,
        contentType: file.type,
      }),
    });

    if (!response.ok) {
      throw new Error(`Failed to get upload URL: ${response.statusText}`);
    }

    const { uploadUrl, fields, publicUrl } = await response.json();

    // 构建表单数据
    const formData = new FormData();
    Object.entries(fields).forEach(([key, value]) => {
      formData.append(key, value as string);
    });
    formData.append('file', file);

    // 上传文件到R2
    const uploadResponse = await fetch(uploadUrl, {
      method: 'POST',
      body: formData,
    });

    if (!uploadResponse.ok) {
      throw new Error(`Failed to upload to R2: ${uploadResponse.statusText}`);
    }

    // 返回包含公共URL的对象，模拟Vercel Blob上传返回的格式
    return { url: publicUrl };
  } catch (error) {
    console.error('Error uploading to R2:', error);
    throw error;
  }
} 