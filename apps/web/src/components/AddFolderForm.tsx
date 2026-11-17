import { useState, type SubmitEvent } from "react";
import type { Folder } from "../types";
import { api, ApiError } from "../api";

type AddFolderFormProps = {
  onCreated: () => void;
};

export function AddFolderForm(props: AddFolderFormProps) {
  const [name, setName] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  function validate() {
    const errs: Record<string, string> = {};
    if (name.trim() === "") errs.name = "Name is required.";
    return errs;
  }

  async function handleSubmit(e: SubmitEvent<HTMLFormElement>) {
    e.preventDefault();

    const errs = validate();
    setErrors(errs);
    if (Object.keys(errs).length > 0) return;

    setSubmitting(true);
    try {
      await api<Folder>("/folders", { method: "POST", body: { name } });
      setName("");
      setErrors({});
      props.onCreated();
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
    <form onSubmit={handleSubmit}>
      <input
        placeholder="New folder"
        value={name}
        disabled={submitting}
        onChange={(e) => setName(e.target.value)}
      />
      <button disabled={submitting}>Add</button>
      {errors.name && <p>{errors.name}</p>}
      {errors.form && <p>{errors.form}</p>}
    </form>
  );
}
