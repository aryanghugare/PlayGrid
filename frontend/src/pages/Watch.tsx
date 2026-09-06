import { useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ThumbsUp,
  BookmarkPlus,
  Share2,
  Pencil,
  Trash2,
  Check,
} from "lucide-react";
import { api } from "../api";
import { useAuth } from "../auth";
import type { Video, Page, Post, Playlist } from "../types";
import {
  Avatar,
  count,
  date,
  Loading,
  ErrorBox,
  SubscribeButton,
  TextEditor,
  Pager,
  VideoCard,
  Modal,
  Confirm,
} from "../components/shared";
export function Watch() {
  const { videoId } = useParams();
  return <WatchContent key={videoId} videoId={videoId!} />;
}
function WatchContent({ videoId }: { videoId: string }) {
  const { user } = useAuth();
  const cache = useQueryClient();
  const viewed = useRef(false);
  const [save, setSave] = useState(false),
    [copied, setCopied] = useState(false),
    [error, setError] = useState<unknown>(null);
  const query = useQuery({
    queryKey: ["video", videoId, user?._id],
    queryFn: () => api<Video>(`/videos/${videoId}`),
  });
  const related = useQuery({
    queryKey: ["related", videoId],
    queryFn: () => api<Page<Video>>("/videos?limit=6"),
  });
  const video = query.data;
  const like = useMutation({
    mutationFn: () =>
      api(`/likes/video/${videoId}`, {
        method: video?.isLiked ? "DELETE" : "PUT",
      }),
    onSuccess: () => {
      cache.invalidateQueries({ queryKey: ["video", videoId] });
      cache.invalidateQueries({ queryKey: ["browse", "liked"] });
    },
  });
  async function onPlay() {
    if (viewed.current) return;
    viewed.current = true;
    try {
      await api(`/videos/${videoId}/views`, { method: "POST" });
      if (user) {
        await api(`/users/history/${videoId}`, { method: "PUT" });
        cache.invalidateQueries({ queryKey: ["browse", "history"] });
      }
    } catch (e) {
      setError(e);
    }
  }
  if (query.isPending) return <Loading />;
  if (!video) return <ErrorBox error={query.error} />;
  return (
    <div className="watch-layout">
      <div className="watch-primary">
        <div className="player-shell">
          <video
            controls
            playsInline
            preload="metadata"
            src={video.videoFile}
            poster={video.thumbnail}
            onPlay={onPlay}
            onError={() =>
              setError(
                new Error(
                  "This video could not be played. Check the connection or media format."
                )
              )
            }
          />
        </div>
        <h1 className="watch-title">{video.title}</h1>
        <div className="watch-creator">
          <Link
            to={`/channel/${video.owner?.username}`}
            className="creator-lockup"
          >
            <Avatar
              src={video.owner?.avatar}
              name={video.owner?.fullName}
              size={44}
            />
            <div>
              <strong>{video.owner?.fullName}</strong>
              <span className="muted small">
                {count(video.subscribersCount)} subscribers
              </span>
            </div>
          </Link>
          <SubscribeButton
            channelId={video.owner?._id}
            subscribed={Boolean(video.isSubscribed)}
          />
          <div className="watch-buttons">
            {user ? (
              <button
                className={`button secondary ${video.isLiked ? "is-liked" : ""}`}
                disabled={like.isPending}
                onClick={() => like.mutate()}
              >
                <ThumbsUp size={16} />
                {count(video.likesCount)}
              </button>
            ) : (
              <Link className="button secondary" to="/login">
                <ThumbsUp size={16} />
                {count(video.likesCount)}
              </Link>
            )}
            {user ? (
              <button
                className="button secondary"
                onClick={() => setSave(true)}
              >
                <BookmarkPlus size={16} />
                Save
              </button>
            ) : (
              <Link className="button secondary" to="/login">
                <BookmarkPlus size={16} />
                Save
              </Link>
            )}
            <button
              className="icon-button"
              title="Copy video link"
              aria-label="Copy video link"
              onClick={async () => {
                try {
                  await navigator.clipboard.writeText(location.href);
                  setCopied(true);
                } catch {
                  setError(
                    new Error(
                      "Could not copy the link. Copy the address from your browser."
                    )
                  );
                }
              }}
            >
              {copied ? <Check size={18} /> : <Share2 size={18} />}
            </button>
          </div>
        </div>
        <ErrorBox error={error || like.error} />
        <div className="video-description">
          <strong>
            {count(video.views)} views <span className="dot">·</span>{" "}
            {date(video.createdAt)} {!video.isPublished && " · Draft"}
          </strong>
          <p>
            {video.description || "The creator hasn’t added a description yet."}
          </p>
        </div>
        <Comments videoId={videoId} />
      </div>
      <aside className="related">
        <div className="section-toolbar">
          <h2>Keep exploring</h2>
        </div>
        {related.data?.items
          .filter((v) => v._id !== videoId)
          .map((v) => (
            <VideoCard key={v._id} video={v} />
          ))}
        {!related.data?.items.filter((v) => v._id !== videoId).length && (
          <p className="muted">More stories are on their way.</p>
        )}
      </aside>
      {save && (
        <SaveToPlaylist videoId={videoId} onClose={() => setSave(false)} />
      )}
    </div>
  );
}
function Comments({ videoId }: { videoId: string }) {
  const { user } = useAuth();
  const cache = useQueryClient();
  const [page, setPage] = useState(1),
    [edit, setEdit] = useState<string | null>(null),
    [remove, setRemove] = useState<string | null>(null);
  const query = useQuery({
    queryKey: ["comments", videoId, page],
    queryFn: () => api<Page<Post>>(`/videos/${videoId}/comments?page=${page}`),
  });
  const reload = () =>
    cache.invalidateQueries({ queryKey: ["comments", videoId] });
  return (
    <section className="comments">
      <h2>{count(query.data?.total)} comments</h2>
      {user ? (
        <TextEditor
          label="Join the conversation"
          onSave={async (content) => {
            await api(`/videos/${videoId}/comments`, {
              method: "POST",
              body: { content },
            });
            await reload();
          }}
        />
      ) : (
        <p className="muted">
          <Link to="/login">Sign in</Link> to join the conversation.
        </p>
      )}
      <ErrorBox error={query.error} />
      {query.data?.items.map((c) => (
        <article className="comment" key={c._id}>
          <Avatar src={c.owner?.avatar} name={c.owner?.fullName} size={34} />
          <div className="comment-body">
            <div className="comment-header">
              <Link to={`/channel/${c.owner?.username}`}>
                @{c.owner?.username}
              </Link>
              <span className="muted small">{date(c.createdAt)}</span>
              {user?._id === c.owner?._id && (
                <div className="post-actions">
                  <button
                    aria-label="Edit comment"
                    className="icon-button"
                    onClick={() => setEdit(c._id)}
                  >
                    <Pencil size={14} />
                  </button>
                  <button
                    aria-label="Delete comment"
                    className="icon-button"
                    onClick={() => setRemove(c._id)}
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              )}
            </div>
            {edit === c._id ? (
              <TextEditor
                initial={c.content}
                label="Edit comment"
                onCancel={() => setEdit(null)}
                onSave={async (content) => {
                  await api(`/comments/${c._id}`, {
                    method: "PATCH",
                    body: { content },
                  });
                  setEdit(null);
                  await reload();
                }}
              />
            ) : (
              <p>{c.content}</p>
            )}
          </div>
        </article>
      ))}
      {query.data && (
        <Pager
          page={page}
          hasNext={query.data.hasNextPage}
          onChange={setPage}
        />
      )}{" "}
      {remove && (
        <Confirm
          title="Delete comment?"
          detail="Your comment will be removed."
          onClose={() => setRemove(null)}
          onConfirm={async () => {
            await api(`/comments/${remove}`, { method: "DELETE" });
            await reload();
          }}
        />
      )}
    </section>
  );
}
function SaveToPlaylist({
  videoId,
  onClose,
}: {
  videoId: string;
  onClose: () => void;
}) {
  const cache = useQueryClient();
  const [name, setName] = useState(""),
    [saved, setSaved] = useState<string | null>(null);
  const query = useQuery({
    queryKey: ["playlists", "picker"],
    queryFn: () => api<Page<Playlist>>("/playlists?limit=100"),
  });
  const mutation = useMutation({
    mutationFn: async (id?: string) => {
      const playlistId =
        id ||
        (await api<Playlist>("/playlists", { method: "POST", body: { name } }))
          ._id;
      await api(`/playlists/${playlistId}/videos/${videoId}`, {
        method: "PUT",
      });
      return playlistId;
    },
    onSuccess: (id) => {
      setSaved(id);
      setName("");
      cache.invalidateQueries({ queryKey: ["playlists"] });
    },
  });
  return (
    <Modal title="Save to a playlist" onClose={onClose}>
      <ErrorBox error={query.error || mutation.error} />
      {saved && (
        <div className="success-box">Video saved to your playlist.</div>
      )}
      <div className="playlist-picker">
        {query.data?.items.map((p) => (
          <button
            className="button secondary"
            disabled={mutation.isPending}
            key={p._id}
            onClick={() => mutation.mutate(p._id)}
          >
            {p.name}
            {p.videos.includes(videoId) || saved === p._id ? (
              <Check size={17} />
            ) : (
              <BookmarkPlus size={17} />
            )}
          </button>
        ))}
      </div>
      <form
        className="stack-form"
        onSubmit={(e) => {
          e.preventDefault();
          mutation.mutate(undefined);
        }}
      >
        <label>
          Or create a playlist
          <input
            required
            maxLength={100}
            placeholder="Give it a name"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </label>
        <button
          className="button"
          disabled={mutation.isPending || !name.trim()}
        >
          Create and save
        </button>
      </form>
    </Modal>
  );
}
