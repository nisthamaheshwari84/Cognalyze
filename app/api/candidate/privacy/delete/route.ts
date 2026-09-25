import { NextResponse } from "next/server";
import { executeDeletionCascade } from "@/lib/privacy/deletion";

export async function POST(req: Request) {
  try {
    const { candidateId, confirmation } = await req.json();

    if (!candidateId || confirmation !== "IRREVOCABLE_DELETE") {
      return NextResponse.json(
        {
          success: false,
          error: "candidateId and explicit confirmation ('IRREVOCABLE_DELETE') are required to execute GDPR/CCPA erasure."
        },
        { status: 400 }
      );
    }

    const receipt = await executeDeletionCascade(candidateId, `candidate:${candidateId}`);

    return NextResponse.json({
      success: true,
      message: "Candidate personal data, raw evidence, and claims have been permanently and irrevocably erased.",
      receipt
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
