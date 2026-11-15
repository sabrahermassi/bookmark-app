import { useState, useEffect } from "react";

export function App() {
  const [status, setStatus] = useState("Checking...");

  useEffect(() => {
    let active = true;

    async function checkApi() {
      try {
        const res = await fetch("/api");
        if (!res.ok) throw new Error();
        if (active) setStatus("API and database are up");
      } catch {
        if (active) setStatus("API or database is down");
      }
    }
    checkApi();

    return () => {
      active = false;
    };
  }, []);

  return (
    <>
      <h1>Bookmarks</h1>
      <h1>{status}</h1>
    </>
  );
}
