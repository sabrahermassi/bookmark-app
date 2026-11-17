import { useState, useEffect } from "react";
import type { Bookmark, LoadState } from "../types";

type BookmarkListProps = {
  folderId: string;
  bookmarksVersion: number;
};

export function BookmarkList(props: BookmarkListProps) {
  const [bookmarks, setBookmarks] = useState<LoadState<Bookmark[]>>({
    status: "loading",
  });
  const [reload, setReload] = useState(0);

  useEffect(() => {
    let active = true;

    async function load() {
      try {
        const res = await fetch(`/api/folders/${props.folderId}/bookmarks`);
        if (!res.ok) throw new Error();
        const body = await res.json();
        if (active) setBookmarks({ status: "ready", data: body.bookmarks });
      } catch {
        if (active)
          setBookmarks({
            status: "error",
            message: "Could not load bookmarks",
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
    <li key={bookmark.id}>
      <a href={bookmark.url} target="_blank" rel="noopener noreferrer">
        {bookmark.name}
      </a>
    </li>
  ));

  return <ul>{bookmarksList}</ul>;
}
