import { useState, type SubmitEvent } from "react";
import type { Folder } from "../types";

type AddBookmarkFormProps = {
  folders: Folder[];
  selectedFolderId: string | null;
  onCreated: () => void;
};

export function AddBookmarkForm(props: AddBookmarkFormProps) {
  const [folderId, setFolderId] = useState(props.selectedFolderId ?? "");
  const [name, setName] = useState("");
  const [url, setUrl] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  function validate() {
    const errs: Record<string, string> = {};
    if (folderId === "") errs.folder_id = "Pick a folder.";
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

    setSubmitting(true);
    try {
      const res = await fetch("/api/bookmarks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ folder_id: folderId, name, url }),
      });

      if (res.ok) {
        setName("");
        setUrl("");
        setErrors({});
        props.onCreated();
        return;
      }

      const body = await res.json();
      if (body.error.fields) {
        setErrors(body.error.fields);
      } else if (res.status === 404) {
        setErrors({ folder_id: body.error.message });
      } else {
        setErrors({ name: body.error.message });
      }
    } catch {
      setErrors({ form: "Could not reach the server. Try again." });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form className="bookmark-form" onSubmit={handleSubmit}>
      <div className="field">
        <select
          aria-label="Folder"
          value={folderId}
          disabled={submitting}
          onChange={(e) => setFolderId(e.target.value)}
        >
          <option value="">Pick a folder</option>
          {props.folders.map((folder) => (
            <option key={folder.id} value={folder.id}>
              {folder.name}
            </option>
          ))}
        </select>
        {errors.folder_id && <p>{errors.folder_id}</p>}
      </div>

      <div className="field grow">
        <input
          placeholder="Name"
          value={name}
          disabled={submitting}
          onChange={(e) => setName(e.target.value)}
        />
        {errors.name && <p>{errors.name}</p>}
      </div>

      <div className="field grow">
        <input
          placeholder="https://…"
          value={url}
          disabled={submitting}
          onChange={(e) => setUrl(e.target.value)}
        />
        {errors.url && <p>{errors.url}</p>}
      </div>

      <button disabled={submitting}>Add</button>
      {errors.form && <p>{errors.form}</p>}
    </form>
  );
}
