import { useState, useEffect } from "react";

export function App() {
  const [status, setStatus] = useState("Checking...");

  useEffect(() => {
    async function checkApi() {
      try {
        const res = await fetch("/api");
        if (!res.ok) throw new Error();
        setStatus("API and database are up");
      } catch {
        setStatus("API or database is down");
      }
    }

    checkApi();
  }, []);

  return (
    <>
      <h1>Bookmarks</h1>
      <h1>{status}</h1>
    </>
  );
}
