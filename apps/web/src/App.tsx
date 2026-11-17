import { useState, useEffect } from "react";
import type { Folder, LoadState } from "./types";
import { FolderList } from "./components/FolderList";
import { BookmarkList } from "./components/BookmarkList";
import { AddFolderForm } from "./components/AddFolderForm";
import { AddBookmarkForm } from "./components/AddBookmarkForm";

export function App() {
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null);
  const [foldersVersion, setFoldersVersion] = useState(0);
  const [bookmarksVersion, setBookmarksVersion] = useState(0);
  const [folders, setFolders] = useState<LoadState<Folder[]>>({
    status: "loading",
  });
  const [reload, setReload] = useState(0);

  useEffect(() => {
    let active = true;

    async function load() {
      try {
        const res = await fetch("/api/folders");
        if (!res.ok) throw new Error();
        const body = await res.json();
        if (active) setFolders({ status: "ready", data: body.folders });
      } catch {
        if (active)
          setFolders({ status: "error", message: "Could not load folders." });
      }
    }
    load();

    return () => {
      active = false;
    };
  }, [reload, foldersVersion]);

  function handleRetry() {
    setFolders({ status: "loading" });
    setReload((r) => r + 1);
  }

  return (
    <div className="app">
      <aside className="sidebar">
        <h1>Bookmarks</h1>
        <AddFolderForm onCreated={() => setFoldersVersion((v) => v + 1)} />
        <FolderList
          folders={folders}
          onSelect={setSelectedFolderId}
          onRetry={handleRetry}
        />
      </aside>
      <main className="main">
        <AddBookmarkForm
          key={`form-${selectedFolderId ?? "none"}`}
          folders={folders.status === "ready" ? folders.data : []}
          selectedFolderId={selectedFolderId}
          onCreated={() => setBookmarksVersion((v) => v + 1)}
        />
        {selectedFolderId != null ? (
          <BookmarkList
            key={selectedFolderId}
            folderId={selectedFolderId}
            folders={folders.status === "ready" ? folders.data : []}
            bookmarksVersion={bookmarksVersion}
          />
        ) : (
          <p>Pick a folder to see its bookmarks.</p>
        )}
      </main>
    </div>
  );
}
