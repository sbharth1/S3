import { NextRequest, NextResponse } from "next/server";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";

const s3 = new S3Client({
  region: process.env.AWS_REGION! as string,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY! as string,
    secretAccessKey: process.env.AWS_SECRET_KEY! as string,
  },
});

const BUCKET_NAME = process.env.AWS_S3_BUCKET_NAME! as string;

export async function POST(req: NextRequest) {
  const { folderName } = await req.json();
  if (!folderName) {
    return NextResponse.json(
      { message: "Missing or invalid Folder Name" },
      { status: 400 }
    );
  }

  const folderKey = folderName.endsWith("/") ? folderName : folderName + "/";

  try {
    await s3.send(
      new PutObjectCommand({ Bucket: BUCKET_NAME, Key: folderKey, Body: "" })
    );
    return NextResponse.json(
      { message: "Folder created successfully" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error creating folder:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}
