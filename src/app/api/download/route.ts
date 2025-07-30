import { NextResponse } from "next/server";
import { S3Client, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

const client = new S3Client({
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY as string,
    secretAccessKey: process.env.AWS_SECRET_KEY as string,
  },
  region: process.env.AWS_REGION as string,
});

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const key = searchParams.get("key") ?? undefined;
  if (!key) throw new Error("key is required");

  try {
    const command = new GetObjectCommand({
      Bucket: process.env.AWS_S3_BUCKET_NAME as string,
      Key: key,
    });

    const url = await getSignedUrl(client, command, { expiresIn: 60 });
    return NextResponse.json({ url });
  } catch (err) {
    console.error("Error generating downloading URL:", err);
    return NextResponse.json({ error: "Failed to generate download URL" }, { status: 500 });
  }
}
