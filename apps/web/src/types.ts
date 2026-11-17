export type Bookmark = {
  id: string;
  folder_id: string;
  user_id: string;
  name: string;
  url: string;
  created_at: string;
};

export type Folder = {
  id: string;
  user_id: string;
  name: string;
  created_at: string;
};

export type LoadState<T> =
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "ready"; data: T };
