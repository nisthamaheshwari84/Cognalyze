import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedContext } from "@/lib/auth/server";
import { invalidateUserDNAScope } from "@/lib/dna/store";
import { deleteSession, getSessionByToken } from "@/lib/auth/store";

export const dynamic = "force-dynamic";

const NO_STORE_HEADERS = {
  "Cache-Control": "no-store, no-cache, must-revalidate, private",
  Pragma: "no-cache",
  Vary: "Cookie, Authorization",
};

export async function POST(req: NextRequest) {
  try {
    const auth = await getAuthenticatedContext(req);
    const sessionToken = req.cookies.get("cognalyze_session")?.value;

    if (auth?.user?.id) {
      invalidateUserDNAScope(auth.user.id);
    }

    if (sessionToken) {
      const sess = getSessionByToken(sessionToken);
      if (sess?.userId) invalidateUserDNAScope(sess.userId);
      deleteSession(sessionToken);
    }

    const res = NextResponse.json(
      { success: true, loggedOut: true },
      { status: 200, headers: NO_STORE_HEADERS }
    );
    res.cookies.delete("cognalyze_session");
    res.cookies.delete("cognalyze_role");
    res.cookies.delete("sb-access-token");
    res.cookies.delete("sb-refresh-token");
    return res;
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err?.message || "Logout failed" },
      { status: 500, headers: NO_STORE_HEADERS }
    );
  }
}
