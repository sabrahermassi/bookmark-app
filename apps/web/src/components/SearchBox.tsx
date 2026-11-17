type SearchBoxProps = {
  text: string;
  onChange: (text: string) => void;
};

export function SearchBox(props: SearchBoxProps) {
  return (
    <div className="search-box">
      <input
        placeholder="Search all bookmarks by name"
        aria-label="Search bookmarks"
        value={props.text}
        onChange={(e) => props.onChange(e.target.value)}
      />
      {props.text !== "" && (
        <button type="button" onClick={() => props.onChange("")}>
          Clear
        </button>
      )}
    </div>
  );
}
