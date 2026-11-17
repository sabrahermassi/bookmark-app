import { useState, useEffect } from "react";
import type { Bookmark, Folder, LoadState } from "../types";
import { api } from "../api";

const PAGE_SIZE = 20;

type SearchResultsProps = {
  text: string; // already debounced by App
  folders: Folder[];
  onOpenFolder: (folderId: string) => void;
};

export function SearchResults(props: SearchResultsProps) {
  const [results, setResults] = useState<LoadState<Bookmark[]>>({
    status: "loading",
  });
  const [reload, setReload] = useState(0);

  // Paging
  const [hasMore, setHasMore] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [moreError, setMoreError] = useState<string | null>(null);

  useEffect(() => {
    // Typing has started but not paused yet: nothing to search for
    if (props.text.trim() === "") return;

    let active = true;

    async function load() {
      try {
        const name = encodeURIComponent(props.text.trim());
        const body = await api<{ bookmarks: Bookmark[] }>(
          `/bookmarks?name=${name}&limit=${PAGE_SIZE}&offset=0`,
        );
        if (active) {
          setResults({ status: "ready", data: body.bookmarks });
          setHasMore(body.bookmarks.length === PAGE_SIZE);
        }
      } catch {
        if (active) setResults({ status: "error", message: "Search failed." });
      }
    }
    load();

    return () => {
      active = false;
    };
  }, [props.text, reload]);

  // Next page of matches, starting after the ones we already have
  async function handleLoadMore() {
    if (results.status !== "ready") return;
    const offset = results.data.length;

    setLoadingMore(true);
    setMoreError(null);
    try {
      const name = encodeURIComponent(props.text.trim());
      const body = await api<{ bookmarks: Bookmark[] }>(
        `/bookmarks?name=${name}&limit=${PAGE_SIZE}&offset=${offset}`,
      );
      const page = body.bookmarks;
      setResults((prev) =>
        prev.status === "ready"
          ? { status: "ready", data: [...prev.data, ...page] }
          : prev,
      );
      setHasMore(page.length === PAGE_SIZE);
    } catch {
      setMoreError("Could not load more results.");
    } finally {
      setLoadingMore(false);
    }
  }

  function folderName(folderId: string) {
    const folder = props.folders.find((f) => f.id === folderId);
    return folder ? folder.name : "Open folder";
  }

  function handleRetry() {
    setResults({ status: "loading" });
    setReload((r) => r + 1);
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
        <button onClick={handleRetry}>Retry</button>
      </>
    );
  if (results.data.length === 0)
    return <p>No bookmarks match “{props.text.trim()}”.</p>;

  return (
    <>
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

      {hasMore && (
        <button
          className="load-more"
          disabled={loadingMore}
          onClick={handleLoadMore}
        >
          {loadingMore ? "Loading…" : "Load more"}
        </button>
      )}
      {moreError && <p>{moreError}</p>}
    </>
  );
}
