import { useState, useEffect, useRef, type SubmitEvent } from "react";
import type { Bookmark, Folder } from "../types";
import { api, ApiError } from "../api";

type EditBookmarkDialogProps = {
  bookmark: Bookmark;
  folders: Folder[];
  onSaved: () => void;
  onClose: () => void;
};

export function EditBookmarkDialog(props: EditBookmarkDialogProps) {
  // The form starts with the bookmark's current values
  const [folderId, setFolderId] = useState(props.bookmark.folder_id);
  const [name, setName] = useState(props.bookmark.name);
  const [url, setUrl] = useState(props.bookmark.url);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const dialogRef = useRef<HTMLDialogElement>(null);

  // Open as a real modal: the browser moves focus inside, keeps Tab inside,
  // and makes the rest of the page unclickable. On close, focus goes back
  // to the button that opened the dialog.
  useEffect(() => {
    const dialog = dialogRef.current;
    const opener = document.activeElement as HTMLElement | null;
    dialog?.showModal();
    return () => {
      dialog?.close();
      opener?.focus();
    };
  }, []);

  function validate() {
    const errs: Record<string, string> = {};
    if (name.trim() === "") errs.name = "Name is required.";
    if (url.trim() === "") {
      errs.url = "URL is required.";
    } else if (
      !URL.canParse(url) ||
      !(url.startsWith("http://") || url.startsWith("https://"))
    ) {
      errs.url = "URL must start with http:// or https://.";
    }
    return errs;
  }

  async function handleSubmit(e: SubmitEvent<HTMLFormElement>) {
    e.preventDefault();

    const errs = validate();
    setErrors(errs);
    if (Object.keys(errs).length > 0) return;

    // docs/api.md: send only the fields that change
    const changes: Record<string, string> = {};
    if (folderId !== props.bookmark.folder_id) changes.folder_id = folderId;
    if (name !== props.bookmark.name) changes.name = name;
    if (url !== props.bookmark.url) changes.url = url;

    if (Object.keys(changes).length === 0) {
      props.onClose();
      return;
    }

    setSubmitting(true);
    try {
      await api<Bookmark>(`/bookmarks/${props.bookmark.id}`, {
        method: "PUT",
        body: changes,
      });
      props.onSaved();
    } catch (err) {
      if (!(err instanceof ApiError)) {
        setErrors({ form: "Something went wrong. Try again." });
      } else if (err.fields) {
        setErrors(err.fields);
      } else if (err.status === 409) {
        setErrors({ name: err.message });
      } else {
        setErrors({ form: err.message });
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <dialog
      ref={dialogRef}
      className="dialog"
      aria-label="Edit bookmark"
      onCancel={(e) => {
        // Escape: close, unless a save is still running
        e.preventDefault();
        if (!submitting) props.onClose();
      }}
    >
      <h3>Edit bookmark</h3>
      <form className="edit-form" onSubmit={handleSubmit}>
        <label>
          Folder
          <select
            value={folderId}
            disabled={submitting}
            onChange={(e) => setFolderId(e.target.value)}
          >
            {props.folders.map((folder) => (
              <option key={folder.id} value={folder.id}>
                {folder.name}
              </option>
            ))}
          </select>
        </label>
        {errors.folder_id && <p>{errors.folder_id}</p>}

        <label>
          Name
          <input
            value={name}
            disabled={submitting}
            onChange={(e) => setName(e.target.value)}
          />
        </label>
        {errors.name && <p>{errors.name}</p>}

        <label>
          URL
          <input
            value={url}
            disabled={submitting}
            onChange={(e) => setUrl(e.target.value)}
          />
        </label>
        {errors.url && <p>{errors.url}</p>}

        {errors.form && <p>{errors.form}</p>}

        <div className="dialog-actions">
          <button
            type="button"
            className="secondary"
            disabled={submitting}
            onClick={props.onClose}
          >
            Cancel
          </button>
          <button disabled={submitting}>
            {submitting ? "Saving…" : "Save"}
          </button>
        </div>
      </form>
    </dialog>
  );
}
