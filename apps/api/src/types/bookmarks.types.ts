import type { Folder, Bookmark } from "../generated/prisma/client.js";

export type FolderCreateBody = { name: string };

export type FolderResponse = {
  id: string;
  user_id: string;
  name: string;
  created_at: Date;
};

export type FolderListResponse = {
  folders: FolderResponse[];
};

export type BookmarkCreateBody = {
  folder_id: string;
  name: string;
  url: string;
};

export type BookmarkResponse = {
  id: string;
  folder_id: string;
  user_id: string;
  name: string;
  url: string;
  created_at: Date;
};

export type FolderBookmarksParams = {
  folderId: string;
};

export type FolderBookmarksQuery = {
  sort?: string;
  limit?: string;
  offset?: string;
};

export type BookmarkListResponse = { bookmarks: BookmarkResponse[] };

export type UserBookmarksQuery = {
  name: string;
  limit?: string;
  offset?: string;
};

export type BookmarkParams = {
  bookmarkId: string;
};

export type BookmarkUpdateBody = Partial<BookmarkCreateBody>;

export type ErrorResponse = {
  error: {
    code: string;
    message: string;
    fields?: Record<string, string>;
  };
};

export function toBookmarkResponse(bookmark: Bookmark): BookmarkResponse {
  return {
    id: bookmark.id,
    folder_id: bookmark.folderId,
    user_id: bookmark.userId,
    name: bookmark.name,
    url: bookmark.url,
    created_at: bookmark.createdAt,
  };
}

export function toFolderResponse(folder: Folder): FolderResponse {
  return {
    id: folder.id,
    user_id: folder.userId,
    name: folder.name,
    created_at: folder.createdAt,
  };
}
