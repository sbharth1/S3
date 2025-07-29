import { NextRequest, NextResponse } from "next/server";
import { S3Client, DeleteObjectCommand } from "@aws-sdk/client-s3";

const s3 = new S3Client({
  region: process.env.AWS_REGION! as string,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY! as string,
    secretAccessKey: process.env.AWS_SECRET_KEY! as string,
  },
});

const BUCKET_NAME = process.env.AWS_S3_BUCKET_NAME! as string;

export async function DELETE(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const key = searchParams.get("key");

  if (!key) {
    return NextResponse.json({ message: "Missing or invalid key" }, { status: 400 });
  }

  try {
    await s3.send(new DeleteObjectCommand({ Bucket: BUCKET_NAME, Key: key }));
    return NextResponse.json({ message: "Delete successful" }, { status: 200 });
  } catch (error) {
    console.error("Error deleting object:", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}
