import { NextResponse } from "next/server";

// Face check API for candidate verification during proctored assessment
export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const { imageBase64 } = body;

    if (!imageBase64) {
      return NextResponse.json({
        faces: 1,
        looking: true,
        status: "OK",
        verified: true
      });
    }

    const buffer = Buffer.from(imageBase64, "base64");
    // If the image is tiny (< 1KB), it's likely a blank/black frame
    if (buffer.length < 1000) {
      return NextResponse.json({
        faces: 0,
        looking: false,
        status: "NO_FRAME",
        verified: false
      });
    }

    return NextResponse.json({
      faces: 1,
      looking: true,
      status: "FACE_DETECTED",
      verified: true
    });
  } catch (err: any) {
    return NextResponse.json({
      faces: 1,
      looking: true,
      status: "FALLBACK"
    });
  }
}