import { useState, type SubmitEvent } from "react";

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
      const res = await fetch("/api/folders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });

      if (res.ok) {
        setName("");
        setErrors({});
        props.onCreated();
        return;
      }

      const body = await res.json();
      if (body.error.fields) {
        setErrors(body.error.fields);
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
