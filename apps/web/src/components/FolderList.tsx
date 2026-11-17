import { useState, useEffect } from "react";
import type { Folder, LoadState } from "../types";

type FolderListProps = {
  onSelect: (id: string) => void;
  foldersVersion: number;
};

export function FolderList(props: FolderListProps) {
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
  }, [reload, props.foldersVersion]);

  function handleRetry() {
    setFolders({ status: "loading" });
    setReload((r) => r + 1);
  }

  if (folders.status === "loading")
    return (
      <ul>
        <li className="skeleton" />
        <li className="skeleton" />
        <li className="skeleton" />
      </ul>
    );
  if (folders.status === "error")
    return (
      <>
        <p>{folders.message}</p>
        <button onClick={handleRetry}>Retry</button>
      </>
    );
  if (folders.data.length === 0)
    return <p>No folders yet. Add one to get started.</p>;

  const foldersList = folders.data.map((folder) => (
    <li key={folder.id}>
      <button onClick={() => props.onSelect(folder.id)}>{folder.name}</button>
    </li>
  ));

  return <ul>{foldersList}</ul>;
}
