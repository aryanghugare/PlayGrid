import { useState } from "react";
import type { FormEvent } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ListVideo,
  Plus,
  ArrowUpRight,
  Pencil,
  Trash2,
  ArrowUp,
  X,
} from "lucide-react";
import { api } from "../api";
import type { Page, Playlist, PlaylistDetail } from "../types";
import {
  PageTitle,
  Loading,
  ErrorBox,
  Empty,
  Pager,
  VideoGrid,
  Modal,
  Confirm,
} from "../components/shared";
export function Playlists() {
  const cache = useQueryClient();
  const [page, setPage] = useState(1),
    [creating, setCreating] = useState(false);
  const query = useQuery({
    queryKey: ["playlists", "list", page],
    queryFn: () => api<Page<Playlist>>(`/playlists?page=${page}`),
  });
  return (
    <>
      <PageTitle
        eyebrow="CURATED BY YOU"
        title="The good ones, all together."
        description="Collect a mood, follow a curiosity, save a little inspiration."
        action={
          <button className="button" onClick={() => setCreating(true)}>
            <Plus size={17} />
            New playlist
          </button>
        }
      />
      <ErrorBox error={query.error} />
      {query.isPending ? (
        <Loading />
      ) : query.data?.items.length ? (
        <div className="playlist-grid">
          {query.data.items.map((p, i) => (
            <Link
              className="playlist-card panel"
              to={`/playlist/${p._id}`}
              key={p._id}
            >
              <div className={`playlist-art tone-${i % 3}`}>
                <ListVideo size={45} />
                <span>{p.videos.length} VIDEOS</span>
                <div className="playlist-lines" />
              </div>
              <div className="playlist-info">
                <div>
                  <h2>{p.name}</h2>
                  <p>
                    {p.description || "A collection of things worth keeping."}
                  </p>
                </div>
                <ArrowUpRight size={20} />
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <Empty
          title="Start your first collection"
          detail="Save videos from the watch page, or create a playlist here."
          action={
            <button className="button" onClick={() => setCreating(true)}>
              Create a playlist
              <Plus size={16} />
            </button>
          }
        />
      )}{" "}
      {query.data && (
        <Pager
          page={page}
          hasNext={query.data.hasNextPage}
          onChange={setPage}
        />
      )}{" "}
      {creating && (
        <PlaylistForm
          onClose={() => setCreating(false)}
          onSaved={() => cache.invalidateQueries({ queryKey: ["playlists"] })}
        />
      )}
    </>
  );
}
export function PlaylistPage() {
  const { playlistId } = useParams(),
    cache = useQueryClient(),
    navigate = useNavigate();
  const [page, setPage] = useState(1),
    [edit, setEdit] = useState(false),
    [remove, setRemove] = useState(false),
    [error, setError] = useState<unknown>(null),
    [busy, setBusy] = useState(false);
  const query = useQuery({
    queryKey: ["playlists", playlistId, page],
    queryFn: () => api<PlaylistDetail>(`/playlists/${playlistId}?page=${page}`),
  });
  const all = useQuery({
    queryKey: ["playlists", "order", playlistId],
    queryFn: () => api<Page<Playlist>>("/playlists?limit=100"),
  });
  const p = query.data;
  async function removeVideo(id: string) {
    setBusy(true);
    try {
      await api(`/playlists/${playlistId}/videos/${id}`, { method: "DELETE" });
      await cache.invalidateQueries({ queryKey: ["playlists"] });
    } catch (e) {
      setError(e);
    } finally {
      setBusy(false);
    }
  }
  async function moveFirst(id: string) {
    const ids = all.data?.items.find((p) => p._id === playlistId)?.videos;
    if (!ids) return;
    setBusy(true);
    try {
      await api(`/playlists/${playlistId}`, {
        method: "PATCH",
        body: { videoIds: [id, ...ids.filter((v) => v !== id)] },
      });
      await cache.invalidateQueries({ queryKey: ["playlists"] });
    } catch (e) {
      setError(e);
    } finally {
      setBusy(false);
    }
  }
  if (query.isPending) return <Loading />;
  if (!p) return <ErrorBox error={query.error} />;
  return (
    <>
      <PageTitle
        eyebrow={`YOUR PLAYLIST · ${p.videos.total} VIDEOS`}
        title={p.name}
        description={p.description || "Your own little corner of inspiration."}
        action={
          <div className="row-actions">
            <button className="button secondary" onClick={() => setEdit(true)}>
              <Pencil size={16} />
              Edit
            </button>
            <button
              className="icon-button"
              aria-label="Delete playlist"
              onClick={() => setRemove(true)}
            >
              <Trash2 size={18} />
            </button>
          </div>
        }
      />
      <ErrorBox error={error} />
      <VideoGrid
        items={p.videos.items}
        empty={
          <Empty
            title="Your collection is taking shape"
            detail="Use Save on any video to add it to this playlist."
            action={
              <Link className="button" to="/">
                Discover videos
                <ArrowUpRight size={16} />
              </Link>
            }
          />
        }
        renderExtra={(v) => (
          <div className="playlist-video-actions">
            <button
              className="text-button"
              disabled={busy}
              onClick={() => moveFirst(v._id)}
            >
              <ArrowUp size={14} />
              Move to top
            </button>
            <button
              className="text-button"
              disabled={busy}
              onClick={() => removeVideo(v._id)}
            >
              <X size={14} />
              Remove
            </button>
          </div>
        )}
      />
      <Pager page={page} hasNext={p.videos.hasNextPage} onChange={setPage} />
      {edit && (
        <PlaylistForm
          playlist={{ ...p, videos: [] }}
          onClose={() => setEdit(false)}
          onSaved={() => cache.invalidateQueries({ queryKey: ["playlists"] })}
        />
      )}{" "}
      {remove && (
        <Confirm
          title="Delete playlist?"
          detail="The collection will be removed. Its videos stay on PlayGrid."
          onClose={() => setRemove(false)}
          onConfirm={async () => {
            await api(`/playlists/${playlistId}`, { method: "DELETE" });
            await cache.invalidateQueries({ queryKey: ["playlists"] });
            navigate("/playlists");
          }}
        />
      )}
    </>
  );
}
function PlaylistForm({
  playlist,
  onClose,
  onSaved,
}: {
  playlist?: Playlist;
  onClose: () => void;
  onSaved: () => Promise<unknown>;
}) {
  const [error, setError] = useState<unknown>(null),
    [busy, setBusy] = useState(false);
  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    const data = new FormData(e.currentTarget);
    try {
      await api(playlist ? `/playlists/${playlist._id}` : "/playlists", {
        method: playlist ? "PATCH" : "POST",
        body: { name: data.get("name"), description: data.get("description") },
      });
      await onSaved();
      onClose();
    } catch (e) {
      setError(e);
    } finally {
      setBusy(false);
    }
  }
  return (
    <Modal
      title={playlist ? "Edit playlist" : "A new collection"}
      onClose={onClose}
    >
      <form className="stack-form" onSubmit={submit}>
        <ErrorBox error={error} />
        <label>
          Name
          <input
            autoFocus
            name="name"
            required
            maxLength={100}
            defaultValue={playlist?.name}
            placeholder="Sunday inspiration"
          />
        </label>
        <label>
          Description
          <textarea
            name="description"
            maxLength={2000}
            defaultValue={playlist?.description}
            placeholder="What brings these videos together?"
          />
        </label>
        <button className="button" disabled={busy}>
          {busy ? "Saving…" : playlist ? "Save changes" : "Create playlist"}
        </button>
      </form>
    </Modal>
  );
}
