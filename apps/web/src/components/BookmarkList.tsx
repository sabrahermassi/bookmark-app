import { useState, useEffect, useRef } from "react";
import type { Bookmark, Folder, LoadState } from "../types";
import { api, ApiError } from "../api";
import { EditBookmarkDialog } from "./EditBookmarkDialog";

const PAGE_SIZE = 20;

type BookmarkListProps = {
  folderId: string;
  folders: Folder[];
  bookmarksVersion: number;
};

export function BookmarkList(props: BookmarkListProps) {
  // The rows loaded so far (first page + every "Load more" page)
  const [bookmarks, setBookmarks] = useState<LoadState<Bookmark[]>>({
    status: "loading",
  });
  const [reload, setReload] = useState(0);
  // Which version of the list is on screen. It changes on every refresh
  // (after Retry, add, edit, delete), so a "Load more" answer that belongs
  // to an older version can be recognised and thrown away.
  const generation = useRef(0);
  const listKey = `${reload}-${props.bookmarksVersion}`;
  const [loadedKey, setLoadedKey] = useState<string | null>(null);
  // True while a refresh is running and the old rows are still shown
  const refreshing = loadedKey !== listKey;

  // Paging
  const [hasMore, setHasMore] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [moreError, setMoreError] = useState<string | null>(null);

  // Edit and delete
  const [editing, setEditing] = useState<Bookmark | null>(null);
  const [confirmingId, setConfirmingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [rowError, setRowError] = useState<{
    id: string;
    message: string;
  } | null>(null);

  // First page. Runs again when the folder changes, after Retry,
  // after a bookmark is added (bookmarksVersion), edited or deleted (reload).
  useEffect(() => {
    let active = true;

    // A refresh starts: any "Load more" still in flight is now out of date
    generation.current += 1;
    const key = `${reload}-${props.bookmarksVersion}`;

    async function load() {
      try {
        const body = await api<{ bookmarks: Bookmark[] }>(
          `/folders/${props.folderId}/bookmarks?limit=${PAGE_SIZE}&offset=0`,
        );
        if (active) {
          setBookmarks({ status: "ready", data: body.bookmarks });
          setLoadedKey(key);
          setHasMore(body.bookmarks.length === PAGE_SIZE);
          setMoreError(null);
        }
      } catch {
        if (active)
          setBookmarks({
            status: "error",
            message: "Could not load bookmarks.",
          });
      }
    }
    load();

    return () => {
      active = false;
    };
  }, [props.folderId, reload, props.bookmarksVersion]);

  function handleRetry() {
    setBookmarks({ status: "loading" });
    setReload((r) => r + 1);
  }

  // Next page: ask for 20 more, starting after the rows we already have
  async function handleLoadMore() {
    if (bookmarks.status !== "ready" || refreshing) return;
    const offset = bookmarks.data.length;
    const gen = generation.current;

    setLoadingMore(true);
    setMoreError(null);
    try {
      const body = await api<{ bookmarks: Bookmark[] }>(
        `/folders/${props.folderId}/bookmarks?limit=${PAGE_SIZE}&offset=${offset}`,
      );
      // The list was refreshed while we waited: this page no longer fits
      if (gen !== generation.current) return;
      const page = body.bookmarks;
      setBookmarks((prev) =>
        prev.status === "ready"
          ? { status: "ready", data: [...prev.data, ...page] }
          : prev,
      );
      setHasMore(page.length === PAGE_SIZE);
    } catch {
      if (gen === generation.current)
        setMoreError("Could not load more bookmarks.");
    } finally {
      setLoadingMore(false);
    }
  }

  async function handleDelete(id: string) {
    setDeletingId(id);
    setRowError(null);
    try {
      await api(`/bookmarks/${id}`, { method: "DELETE" });
      setConfirmingId(null);
      setReload((r) => r + 1);
    } catch (err) {
      if (err instanceof ApiError && err.status === 404) {
        // Already gone (deleted in another tab): just refresh the list
        setConfirmingId(null);
        setReload((r) => r + 1);
      } else {
        setRowError({ id, message: "Could not delete. Try again." });
      }
    } finally {
      setDeletingId(null);
    }
  }

  function handleSaved() {
    setEditing(null);
    setReload((r) => r + 1);
  }

  if (bookmarks.status === "loading")
    return (
      <ul>
        <li className="skeleton" />
        <li className="skeleton" />
        <li className="skeleton" />
      </ul>
    );
  if (bookmarks.status === "error")
    return (
      <>
        <p>{bookmarks.message}</p>
        <button onClick={handleRetry}>Retry</button>
      </>
    );
  if (bookmarks.data.length === 0)
    return <p>No bookmarks yet. Add one to get started.</p>;

  const bookmarksList = bookmarks.data.map((bookmark) => (
    <li key={bookmark.id} className="bookmark-row">
      <a href={bookmark.url} target="_blank" rel="noopener noreferrer">
        {bookmark.name}
      </a>

      {confirmingId === bookmark.id ? (
        <span className="row-actions">
          <span>Delete this bookmark?</span>
          <button
            className="danger"
            disabled={deletingId === bookmark.id}
            onClick={() => handleDelete(bookmark.id)}
          >
            Delete
          </button>
          <button
            disabled={deletingId === bookmark.id}
            onClick={() => setConfirmingId(null)}
          >
            Cancel
          </button>
        </span>
      ) : (
        <span className="row-actions">
          <button onClick={() => setEditing(bookmark)}>Edit</button>
          <button onClick={() => setConfirmingId(bookmark.id)}>Delete</button>
        </span>
      )}

      {rowError?.id === bookmark.id && (
        <p className="row-error">{rowError.message}</p>
      )}
    </li>
  ));

  return (
    <>
      <ul>{bookmarksList}</ul>

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

      {editing && (
        <EditBookmarkDialog
          key={editing.id}
          bookmark={editing}
          folders={props.folders}
          onSaved={handleSaved}
          onClose={() => setEditing(null)}
        />
      )}
    </>
  );
}
