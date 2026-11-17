import { useState } from "react";
import { FolderList } from "./components/FolderList";
import { BookmarkList } from "./components/BookmarkList";
import { AddFolderForm } from "./components/AddFolderForm";

export function App() {
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null);
  const [foldersVersion, setFoldersVersion] = useState(0);

  return (
    <>
      <AddFolderForm onCreated={() => setFoldersVersion((v) => v + 1)} />
      <FolderList
        onSelect={setSelectedFolderId}
        foldersVersion={foldersVersion}
      />
      {selectedFolderId != null && (
        <BookmarkList key={selectedFolderId} folderId={selectedFolderId} />
      )}
    </>
  );
}
