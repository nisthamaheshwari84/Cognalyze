"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function SecureInterviewRedirect() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/interview?secure=true");
  }, [router]);

  return (
    <div style={{ minHeight: "100vh", background: "#09090B", color: "#F8FAFC", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "-apple-system,BlinkMacSystemFont,Segoe UI,Roboto,sans-serif" }}>
      <div style={{ textAlign: "center" }}>
        <div style={{ fontSize: 28, marginBottom: 10 }}>🛡️</div>
        <div style={{ fontSize: 14, fontWeight: 700, color: "#FFFFFF" }}>Launching Secure Proctored Studio...</div>
        <div style={{ fontSize: 12, color: "#71717A", marginTop: 4 }}>Initializing biometric verification & trust telemetry</div>
      </div>
    </div>
  );
}