import { NextResponse } from "next/server";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { NextURL } from "next/dist/server/web/next-url";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

const client = new S3Client({
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY as string,
    secretAccessKey: process.env.AWS_SECRET_KEY as string,
  },
  region: "ap-south-1",
});

export async function POST(request: Request) {
  const { searchParams } = new URL(request.url);
  const key = searchParams.get("key") ?? undefined;
  if (!key) throw new Error("key is required");

  const command = new PutObjectCommand({
    Bucket: "s3-user-interface-explorer",
    Key: key,
  });

  const url = await getSignedUrl(client, command, { expiresIn: 3600 });
  return NextResponse.json({ url });
}
