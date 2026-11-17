import { useState } from "react";
import { FolderList } from "./components/FolderList";
import { BookmarkList } from "./components/BookmarkList";

export function App() {
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null);

  return (
    <>
      <FolderList onSelect={setSelectedFolderId} />
      {selectedFolderId != null && (
        <BookmarkList key={selectedFolderId} folderId={selectedFolderId} />
      )}
    </>
  );
}
