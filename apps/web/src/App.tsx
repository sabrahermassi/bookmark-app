import { useState, useEffect } from "react";
import type { Folder, LoadState } from "./types";
import { api } from "./api";
import { FolderList } from "./components/FolderList";
import { BookmarkList } from "./components/BookmarkList";
import { AddFolderForm } from "./components/AddFolderForm";
import { AddBookmarkForm } from "./components/AddBookmarkForm";
import { SearchBox } from "./components/SearchBox";
import { SearchResults } from "./components/SearchResults";
import { useDebounced } from "./useDebounced";

export function App() {
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null);
  const [foldersVersion, setFoldersVersion] = useState(0);
  const [bookmarksVersion, setBookmarksVersion] = useState(0);
  const [folders, setFolders] = useState<LoadState<Folder[]>>({
    status: "loading",
  });
  const [reload, setReload] = useState(0);
  const [searchText, setSearchText] = useState("");
  // The search text, but only once typing has paused for 300 ms
  const debouncedText = useDebounced(searchText, 300);

  useEffect(() => {
    let active = true;

    async function load() {
      try {
        const body = await api<{ folders: Folder[] }>("/folders");
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

  // Opening a folder (from the sidebar or a search result) leaves search
  function handleSelectFolder(folderId: string) {
    setSearchText("");
    setSelectedFolderId(folderId);
  }

  const folderList = folders.status === "ready" ? folders.data : [];

  return (
    <div className="app">
      <aside className="sidebar">
        <h1>Bookmarks</h1>
        <AddFolderForm onCreated={() => setFoldersVersion((v) => v + 1)} />
        <FolderList
          folders={folders}
          onSelect={handleSelectFolder}
          onRetry={handleRetry}
        />
      </aside>
      <main className="main">
        <SearchBox text={searchText} onChange={setSearchText} />
        {searchText.trim() !== "" ? (
          <SearchResults
            key={debouncedText}
            text={debouncedText}
            folders={folderList}
            onOpenFolder={handleSelectFolder}
          />
        ) : (
          <>
            <AddBookmarkForm
              key={`form-${selectedFolderId ?? "none"}`}
              folders={folderList}
              selectedFolderId={selectedFolderId}
              onCreated={() => setBookmarksVersion((v) => v + 1)}
            />
            {selectedFolderId != null ? (
              <BookmarkList
                key={selectedFolderId}
                folderId={selectedFolderId}
                folders={folderList}
                bookmarksVersion={bookmarksVersion}
              />
            ) : (
              <p>Pick a folder to see its bookmarks.</p>
            )}
          </>
        )}
      </main>
    </div>
  );
}
