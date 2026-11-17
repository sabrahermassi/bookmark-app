import { useState, type SubmitEvent } from "react";
import type { Bookmark, Folder } from "../types";

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
      const res = await fetch(`/api/bookmarks/${props.bookmark.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(changes),
      });

      if (res.ok) {
        props.onSaved();
        return;
      }

      const body = await res.json();
      if (body.error.fields) {
        setErrors(body.error.fields);
      } else if (res.status === 409) {
        setErrors({ name: body.error.message });
      } else {
        setErrors({ form: body.error.message });
      }
    } catch {
      setErrors({ form: "Could not reach the server. Try again." });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="overlay">
      <div
        className="dialog"
        role="dialog"
        aria-modal="true"
        aria-label="Edit bookmark"
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
      </div>
    </div>
  );
}
