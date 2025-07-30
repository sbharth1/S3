import { NextRequest } from "next/server";
import { S3Client, GetObjectCommand } from "@aws-sdk/client-s3";

const client = new S3Client({
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY as string,
    secretAccessKey: process.env.AWS_SECRET_KEY as string,
  },
  region: process.env.AWS_REGION as string,
});

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const key = searchParams.get("key");
  if (!key) {
    return new Response("key is required", { status: 400 });
  }

  try {
    const command = new GetObjectCommand({
      Bucket: process.env.AWS_S3_BUCKET_NAME as string,
      Key: key,
      ResponseContentDisposition: `attachment; filename="${key.split("/").pop()}"`,
    });
    const s3Response = await client.send(command);

    const body = s3Response.Body as ReadableStream<Uint8Array>;
    const filename = key.split("/").pop() || "download";

    return new Response(body, {
      status: 200,
      headers: {
        "Content-Type": s3Response.ContentType || "application/octet-stream",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  } catch (err) {
    console.error("Error streaming file from S3:", err);
    return new Response("Failed to download file", { status: 500 });
  }
}