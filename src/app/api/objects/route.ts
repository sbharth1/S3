import { NextResponse } from "next/server";
import { S3Client, ListObjectsV2Command } from "@aws-sdk/client-s3";
import { NextURL } from "next/dist/server/web/next-url";

const client = new S3Client({
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY as string,
    secretAccessKey: process.env.AWS_SECRET_KEY as string,
  },
  region: process.env.AWS_REGION as string,
});

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const prefix = searchParams.get("prefix") ?? undefined;
  const command = new ListObjectsV2Command({
    Bucket: process.env.AWS_S3_BUCKET_NAME as string,
    Delimiter: "/",
    Prefix: prefix,
  });
  const res = await client.send(command);

  const lastResult =
    res.Contents?.map((e) => ({
      Key: e.Key,
      Size: e.Size,
      LastModified: e.LastModified,
    })) || [];

  const rootFolders = res?.CommonPrefixes?.map((e) => e.Prefix) || [];

  return NextResponse.json({ files: lastResult, folders: rootFolders });
}
