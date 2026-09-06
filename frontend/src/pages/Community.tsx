import { useState } from "react";
import { Link } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Pencil, Trash2 } from "lucide-react";
import { api } from "../api";
import { useAuth } from "../auth";
import type { Page, Post } from "../types";
import {
  Avatar,
  date,
  PageTitle,
  TextEditor,
  Pager,
  Loading,
  ErrorBox,
  Empty,
  Confirm,
} from "../components/shared";
export function Community({
  userId,
  embedded = false,
}: {
  userId?: string;
  embedded?: boolean;
}) {
  const { user } = useAuth();
  const cache = useQueryClient();
  const [page, setPage] = useState(1),
    [edit, setEdit] = useState<string | null>(null),
    [remove, setRemove] = useState<string | null>(null);
  const endpoint = userId ? `/tweet/user/${userId}` : "/tweet";
  const query = useQuery({
    queryKey: ["posts", userId, page],
    queryFn: () => api<Page<Post>>(`${endpoint}?page=${page}`),
  });
  const reload = () => cache.invalidateQueries({ queryKey: ["posts"] });
  return (
    <div className={embedded ? "" : "community-page"}>
      {!embedded && (
        <PageTitle
          eyebrow="BETWEEN THE VIDEOS"
          title="The conversation continues."
          description="Updates, ideas, and a little behind the scenes."
        />
      )}
      {user && (!userId || userId === user._id) && (
        <div className="panel composer">
          <Avatar src={user.avatar} name={user.fullName} />
          <TextEditor
            label="What's on your mind?"
            onSave={async (content) => {
              await api("/tweet", { method: "POST", body: { content } });
              await reload();
            }}
          />
        </div>
      )}
      <ErrorBox error={query.error} />
      {query.isPending ? (
        <Loading />
      ) : !query.data?.items.length ? (
        <Empty
          title="Start a conversation"
          detail="A thought, an update, a new idea. It all belongs here."
        />
      ) : (
        <div className="post-list">
          {query.data.items.map((post) => (
            <article className="panel post" key={post._id}>
              <div className="post-header">
                <Link to={`/channel/${post.owner?.username}`}>
                  <Avatar
                    src={post.owner?.avatar}
                    name={post.owner?.fullName}
                  />
                </Link>
                <div>
                  <Link
                    className="strong"
                    to={`/channel/${post.owner?.username}`}
                  >
                    {post.owner?.fullName}
                  </Link>
                  <span className="small muted">
                    @{post.owner?.username} · {date(post.createdAt)}
                  </span>
                </div>
                {user?._id === post.owner?._id && (
                  <div className="post-actions">
                    <button
                      aria-label="Edit post"
                      className="icon-button"
                      onClick={() => setEdit(post._id)}
                    >
                      <Pencil size={16} />
                    </button>
                    <button
                      aria-label="Delete post"
                      className="icon-button"
                      onClick={() => setRemove(post._id)}
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                )}
              </div>
              {edit === post._id ? (
                <TextEditor
                  initial={post.content}
                  label="Edit your post"
                  onCancel={() => setEdit(null)}
                  onSave={async (content) => {
                    await api(`/tweet/${post._id}`, {
                      method: "PATCH",
                      body: { content },
                    });
                    setEdit(null);
                    await reload();
                  }}
                />
              ) : (
                <p className="post-content">{post.content}</p>
              )}
            </article>
          ))}
        </div>
      )}
      {query.data && (
        <Pager
          page={page}
          hasNext={query.data.hasNextPage}
          onChange={setPage}
        />
      )}{" "}
      {remove && (
        <Confirm
          title="Delete this post?"
          detail="This removes your post permanently."
          onClose={() => setRemove(null)}
          onConfirm={async () => {
            await api(`/tweet/${remove}`, { method: "DELETE" });
            await reload();
          }}
        />
      )}
    </div>
  );
}
