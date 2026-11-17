import { useState, useEffect } from "react";
import type { Bookmark, Folder, LoadState } from "../types";
import { api } from "../api";

const DEBOUNCE_MS = 300;

type SearchResultsProps = {
  text: string;
  folders: Folder[];
  onOpenFolder: (folderId: string) => void;
};

export function SearchResults(props: SearchResultsProps) {
  const [results, setResults] = useState<LoadState<Bookmark[]>>({
    status: "loading",
  });
  const [reload, setReload] = useState(0);

  useEffect(() => {
    let active = true;

    // Wait until typing stops. Every new keystroke runs the cleanup below,
    // which cancels this timer, so only the last one fires.
    const timer = setTimeout(async () => {
      setResults({ status: "loading" });
      try {
        const name = encodeURIComponent(props.text.trim());
        const body = await api<{ bookmarks: Bookmark[] }>(
          `/bookmarks?name=${name}`,
        );
        if (active) setResults({ status: "ready", data: body.bookmarks });
      } catch {
        if (active) setResults({ status: "error", message: "Search failed." });
      }
    }, DEBOUNCE_MS);

    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [props.text, reload]);

  function folderName(folderId: string) {
    const folder = props.folders.find((f) => f.id === folderId);
    return folder ? folder.name : "";
  }

  if (results.status === "loading")
    return (
      <ul>
        <li className="skeleton" />
        <li className="skeleton" />
        <li className="skeleton" />
      </ul>
    );
  if (results.status === "error")
    return (
      <>
        <p>{results.message}</p>
        <button onClick={() => setReload((r) => r + 1)}>Retry</button>
      </>
    );
  if (results.data.length === 0)
    return <p>No bookmarks match “{props.text.trim()}”.</p>;

  return (
    <ul>
      {results.data.map((bookmark) => (
        <li key={bookmark.id} className="bookmark-row">
          <a href={bookmark.url} target="_blank" rel="noopener noreferrer">
            {bookmark.name}
          </a>
          <button
            className="folder-tag"
            onClick={() => props.onOpenFolder(bookmark.folder_id)}
          >
            {folderName(bookmark.folder_id)}
          </button>
        </li>
      ))}
    </ul>
  );
}
