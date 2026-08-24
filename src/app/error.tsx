"use client";
import { useEffect } from "react";

export default function GlobalError({
  error, reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => { console.error(error); }, [error]);
  return (
    <html><body>
      <div style={{ display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", height:"100vh", background:"#0f1117", color:"#e2e8f0", textAlign:"center", padding:"2rem" }}>
        <h2 style={{ fontSize:"1.5rem", fontWeight:700, marginBottom:"1rem" }}>Application Error</h2>
        <p style={{ color:"#94a3b8", marginBottom:"1.5rem" }}>{error.message || "Unexpected error"}</p>
        <button onClick={reset} style={{ background:"#4f46e5", color:"white", padding:"0.5rem 1.5rem", borderRadius:"0.5rem", border:"none", cursor:"pointer" }}>
          Reload
        </button>
      </div>
    </body></html>
  );
}
