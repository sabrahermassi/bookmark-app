import type { Folder, LoadState } from "../types";

type FolderListProps = {
  folders: LoadState<Folder[]>;
  onSelect: (id: string) => void;
  onRetry: () => void;
};

export function FolderList(props: FolderListProps) {
  if (props.folders.status === "loading")
    return (
      <ul>
        <li className="skeleton" />
        <li className="skeleton" />
        <li className="skeleton" />
      </ul>
    );

  if (props.folders.status === "error")
    return (
      <>
        <p>{props.folders.message}</p>
        <button onClick={props.onRetry}>Retry</button>
      </>
    );

  if (props.folders.data.length === 0)
    return <p>No folders yet. Add one to get started.</p>;

  const foldersList = props.folders.data.map((folder) => (
    <li key={folder.id}>
      <button onClick={() => props.onSelect(folder.id)}>{folder.name}</button>
    </li>
  ));

  return <ul>{foldersList}</ul>;
}
