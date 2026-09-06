import { useEffect, useRef, useState } from "react";
import type { FormEvent, ReactNode } from "react";
import { Link, Navigate, useLocation } from "react-router-dom";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  ArrowRight,
  Check,
  ChevronLeft,
  ChevronRight,
  Film,
  LoaderCircle,
  Plus,
  X,
} from "lucide-react";
import { useAuth } from "../auth";
import { api } from "../api";
import type { Video } from "../types";
export const count = (n = 0) =>
  new Intl.NumberFormat("en", {
    notation: n >= 10000 ? "compact" : "standard",
    maximumFractionDigits: 1,
  }).format(n);
export const duration = (seconds = 0) =>
  `${Math.floor(seconds / 60)}:${String(Math.floor(seconds % 60)).padStart(2, "0")}`;
export const date = (value: string) =>
  new Date(value).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
export function Avatar({
  src,
  name,
  size = 38,
}: {
  src?: string;
  name?: string;
  size?: number;
}) {
  const [failed, setFailed] = useState(false);
  return src && !failed ? (
    <img
      className="avatar"
      style={{ width: size, height: size }}
      src={src}
      alt=""
      onError={() => setFailed(true)}
    />
  ) : (
    <span
      className="avatar avatar-fallback"
      style={{ width: size, height: size }}
    >
      {name?.slice(0, 1).toUpperCase() || "P"}
    </span>
  );
}
export function Loading() {
  return (
    <div className="loading" role="status">
      <LoaderCircle className="spin" size={24} />
      <span>Loading your grid…</span>
    </div>
  );
}
export function ErrorBox({ error }: { error: unknown }) {
  return error ? (
    <div className="error-box" role="alert">
      {error instanceof Error ? error.message : String(error)}
    </div>
  ) : null;
}
export function Empty({
  title = "Nothing here yet",
  detail,
  action,
}: {
  title?: string;
  detail?: string;
  action?: ReactNode;
}) {
  return (
    <div className="empty">
      <div className="empty-icon">
        <Film size={30} />
      </div>
      <h2>{title}</h2>
      <p>{detail}</p>
      {action}
    </div>
  );
}
export function PageTitle({
  eyebrow,
  title,
  description,
  action,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="page-title">
      <div>
        {eyebrow && <div className="eyebrow">{eyebrow}</div>}
        <h1>{title}</h1>
        {description && <p>{description}</p>}
      </div>
      {action}
    </div>
  );
}
export function RequireAuth({ children }: { children: ReactNode }) {
  const { user, loading, error } = useAuth();
  const location = useLocation();
  if (loading) return <Loading />;
  if (error) return <ErrorBox error={error} />;
  return user ? (
    <>{children}</>
  ) : (
    <Navigate
      to="/login"
      state={{ from: location.pathname + location.search }}
      replace
    />
  );
}
export function Pager({
  page,
  hasNext,
  onChange,
}: {
  page: number;
  hasNext: boolean;
  onChange: (page: number) => void;
}) {
  if (page === 1 && !hasNext) return null;
  return (
    <nav className="pager" aria-label="Pagination">
      <button
        className="button secondary"
        disabled={page === 1}
        onClick={() => onChange(page - 1)}
      >
        <ChevronLeft size={16} />
        Previous
      </button>
      <span>Page {page}</span>
      <button
        className="button secondary"
        disabled={!hasNext}
        onClick={() => onChange(page + 1)}
      >
        Next
        <ChevronRight size={16} />
      </button>
    </nav>
  );
}
export function VideoCard({
  video,
  extra,
}: {
  video: Video;
  extra?: ReactNode;
}) {
  return (
    <article className="video-card">
      <Link to={`/watch/${video._id}`} className="thumbnail">
        <img src={video.thumbnail} alt="" loading="lazy" />
        <span className="duration">
          {duration(video.durationSeconds ?? video.duration)}
        </span>
        {!video.isPublished && <span className="draft-badge">Draft</span>}
      </Link>
      <div className="video-card-meta">
        <Link to={`/channel/${video.owner?.username}`}>
          <Avatar
            src={video.owner?.avatar}
            name={video.owner?.fullName}
            size={34}
          />
        </Link>
        <div>
          <Link className="video-title" to={`/watch/${video._id}`}>
            {video.title}
          </Link>
          <Link
            className="creator-name"
            to={`/channel/${video.owner?.username}`}
          >
            {video.owner?.fullName || "Creator"}
          </Link>
          <div className="muted small">
            {count(video.views)} views <span className="dot">·</span>{" "}
            {date(video.createdAt)}
          </div>
        </div>
      </div>
      {extra}
    </article>
  );
}
export function VideoGrid({
  items,
  empty,
  renderExtra,
}: {
  items: Video[];
  empty?: ReactNode;
  renderExtra?: (v: Video) => ReactNode;
}) {
  return items.length ? (
    <div className="video-grid">
      {items.map((v) => (
        <VideoCard key={v._id} video={v} extra={renderExtra?.(v)} />
      ))}
    </div>
  ) : (
    empty || (
      <Empty
        title="The grid is waiting"
        detail="New videos will appear here as creators publish them."
        action={
          <Link className="button" to="/studio/upload">
            Upload a video
            <ArrowRight size={16} />
          </Link>
        }
      />
    )
  );
}
export function SubscribeButton({
  channelId,
  subscribed,
}: {
  channelId: string;
  subscribed: boolean;
}) {
  const { user } = useAuth();
  const cache = useQueryClient();
  const mutation = useMutation({
    mutationFn: () =>
      api(`/subscriptions/c/${channelId}`, {
        method: subscribed ? "DELETE" : "PUT",
      }),
    onSuccess: () => cache.invalidateQueries(),
  });
  if (user?._id === channelId)
    return (
      <Link className="button secondary" to="/settings">
        Edit channel
      </Link>
    );
  if (!user)
    return (
      <Link className="button" to="/login">
        Subscribe
        <Plus size={15} />
      </Link>
    );
  return (
    <>
      <button
        className={`button ${subscribed ? "secondary" : ""}`}
        disabled={mutation.isPending}
        onClick={() => mutation.mutate()}
      >
        {subscribed ? <Check size={15} /> : <Plus size={15} />}{" "}
        {subscribed ? "Subscribed" : "Subscribe"}
      </button>
      <ErrorBox error={mutation.error} />
    </>
  );
}
export function Modal({
  title,
  onClose,
  children,
}: {
  title: string;
  onClose: () => void;
  children: ReactNode;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    dialog.current?.showModal();
    return () => dialog.current?.close();
  }, []);
  return (
    <dialog
      ref={dialog}
      className="modal"
      onCancel={onClose}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="modal-header">
        <h2>{title}</h2>
        <button
          className="icon-button"
          aria-label="Close dialog"
          onClick={onClose}
        >
          <X size={20} />
        </button>
      </div>
      {children}
    </dialog>
  );
}
export function Confirm({
  title,
  detail,
  onConfirm,
  onClose,
}: {
  title: string;
  detail: string;
  onConfirm: () => Promise<unknown>;
  onClose: () => void;
}) {
  const [busy, setBusy] = useState(false),
    [error, setError] = useState<unknown>(null);
  return (
    <Modal
      title={title}
      onClose={() => {
        if (!busy) onClose();
      }}
    >
      <p>{detail}</p>
      <ErrorBox error={error} />
      <div className="form-actions">
        <button className="button secondary" disabled={busy} onClick={onClose}>
          Cancel
        </button>
        <button
          className="button danger"
          disabled={busy}
          onClick={async () => {
            setBusy(true);
            try {
              await onConfirm();
              onClose();
            } catch (e) {
              setError(e);
            } finally {
              setBusy(false);
            }
          }}
        >
          {busy ? "Working…" : "Confirm"}
        </button>
      </div>
    </Modal>
  );
}
export function TextEditor({
  initial = "",
  label = "Content",
  onSave,
  onCancel,
}: {
  initial?: string;
  label?: string;
  onSave: (text: string) => Promise<unknown>;
  onCancel?: () => void;
}) {
  const [value, setValue] = useState(initial),
    [busy, setBusy] = useState(false),
    [error, setError] = useState<unknown>(null);
  async function submit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      await onSave(value);
      setValue("");
    } catch (e) {
      setError(e);
    } finally {
      setBusy(false);
    }
  }
  return (
    <form onSubmit={submit} className="text-editor">
      <label>
        {label}
        <textarea
          required
          maxLength={2000}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="Share something worth watching…"
        />
      </label>
      <ErrorBox error={error} />
      <div className="form-actions">
        {onCancel && (
          <button type="button" className="button secondary" onClick={onCancel}>
            Cancel
          </button>
        )}
        <button className="button" disabled={busy || !value.trim()}>
          {busy ? "Saving…" : "Post"}
        </button>
      </div>
    </form>
  );
}
