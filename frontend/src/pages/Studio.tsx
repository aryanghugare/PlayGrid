import { useState } from "react";
import type { FormEvent } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Film,
  Eye,
  Users,
  ThumbsUp,
  Plus,
  Pencil,
  Trash2,
  UploadCloud,
  ArrowUpRight,
} from "lucide-react";
import { api, upload } from "../api";
import type { Page, Video } from "../types";
import {
  PageTitle,
  Loading,
  ErrorBox,
  Empty,
  Pager,
  count,
  date,
  Confirm,
} from "../components/shared";
export function Studio() {
  const cache = useQueryClient();
  const [page, setPage] = useState(1),
    [remove, setRemove] = useState<Video | null>(null),
    [error, setError] = useState<unknown>(null),
    [busy, setBusy] = useState<string | null>(null);
  const stats = useQuery({
    queryKey: ["studio", "stats"],
    queryFn: () =>
      api<{
        videos: number;
        views: number;
        subscribers: number;
        likes: number;
        published: number;
      }>("/dashboard/stats"),
  });
  const videos = useQuery({
    queryKey: ["studio", "videos", page],
    queryFn: () => api<Page<Video>>(`/dashboard/videos?page=${page}`),
  });
  return (
    <>
      <PageTitle
        eyebrow="YOUR CREATIVE CORNER"
        title="Small beginnings. Big possibilities."
        description="Make something you love. We’ll give it a place to live."
        action={
          <Link className="button" to="/studio/upload">
            <Plus size={17} />
            Upload video
          </Link>
        }
      />
      <div className="stats-grid">
        {[
          ["Total videos", stats.data?.videos, Film],
          ["Video views", stats.data?.views, Eye],
          ["Subscribers", stats.data?.subscribers, Users],
          ["Likes received", stats.data?.likes, ThumbsUp],
        ].map(([label, value, Icon]) => {
          const Glyph = Icon as typeof Film;
          return (
            <div className="panel stat" key={String(label)}>
              <div>
                <span>{String(label)}</span>
                <Glyph size={19} />
              </div>
              <strong>{stats.isPending ? "—" : count(value as number)}</strong>
              <span className="small muted">All time</span>
            </div>
          );
        })}
      </div>
      <div className="section-toolbar">
        <h2>Your content</h2>
        <span className="muted small">
          {stats.data?.published || 0} published
        </span>
      </div>
      <ErrorBox error={stats.error || videos.error || error} />
      {videos.isPending ? (
        <Loading />
      ) : !videos.data?.items.length ? (
        <Empty
          title="Your first video starts here"
          detail="A tutorial, a new perspective, a moment worth keeping. Make it yours."
          action={
            <Link className="button" to="/studio/upload">
              Upload a video
              <ArrowUpRight size={17} />
            </Link>
          }
        />
      ) : (
        <div className="table-wrap panel">
          <table>
            <thead>
              <tr>
                <th>Video</th>
                <th>Visibility</th>
                <th>Date</th>
                <th>Views</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {videos.data.items.map((v) => (
                <tr key={v._id}>
                  <td>
                    <Link className="table-video" to={`/watch/${v._id}`}>
                      <img src={v.thumbnail} alt="" />
                      <strong>{v.title}</strong>
                    </Link>
                  </td>
                  <td>
                    <button
                      className={`status-pill ${v.isPublished ? "published" : ""}`}
                      disabled={busy === v._id}
                      onClick={async () => {
                        setBusy(v._id);
                        try {
                          await api(`/videos/${v._id}/publication`, {
                            method: "PATCH",
                            body: { isPublished: !v.isPublished },
                          });
                          await cache.invalidateQueries();
                        } catch (e) {
                          setError(e);
                        } finally {
                          setBusy(null);
                        }
                      }}
                    >
                      {v.isPublished ? "Published" : "Draft"}
                    </button>
                  </td>
                  <td>{date(v.createdAt)}</td>
                  <td>{count(v.views)}</td>
                  <td>
                    <div className="row-actions">
                      <Link
                        className="icon-button"
                        aria-label={`Edit ${v.title}`}
                        to={`/studio/edit/${v._id}`}
                      >
                        <Pencil size={16} />
                      </Link>
                      <button
                        className="icon-button"
                        aria-label={`Delete ${v.title}`}
                        onClick={() => setRemove(v)}
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {videos.data && (
        <Pager
          page={page}
          hasNext={videos.data.hasNextPage}
          onChange={setPage}
        />
      )}{" "}
      {remove && (
        <Confirm
          title="Delete this video?"
          detail={`“${remove.title}” and its comments will be permanently removed.`}
          onClose={() => setRemove(null)}
          onConfirm={async () => {
            await api(`/videos/${remove._id}`, { method: "DELETE" });
            await cache.invalidateQueries();
          }}
        />
      )}
    </>
  );
}
export function VideoEditor() {
  const { videoId } = useParams();
  const existing = useQuery({
    queryKey: ["edit-video", videoId],
    queryFn: () => api<Video>(`/videos/${videoId}`),
    enabled: !!videoId,
  });
  if (videoId && existing.isPending) return <Loading />;
  if (existing.error) return <ErrorBox error={existing.error} />;
  return <UploadForm key={videoId || "new"} video={existing.data} />;
}
function UploadForm({ video }: { video?: Video }) {
  const navigate = useNavigate();
  const cache = useQueryClient();
  const [busy, setBusy] = useState(false),
    [progress, setProgress] = useState(0),
    [error, setError] = useState<unknown>(null),
    [fileName, setFileName] = useState("Choose your video"),
    [seconds, setSeconds] = useState(0);
  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const data = new FormData(e.currentTarget);
    setBusy(true);
    setError(null);
    try {
      const thumbnail = data.get("thumbnail");
      if (thumbnail instanceof File && !thumbnail.size)
        data.delete("thumbnail");
      if (video) {
        await api(`/videos/${video._id}`, { method: "PATCH", body: data });
      } else {
        if (seconds <= 0)
          throw new Error(
            "Wait for the video metadata to load, or choose a supported video."
          );
        data.set("durationSeconds", String(seconds));
        await upload("/videos", data, setProgress);
      }
      await cache.invalidateQueries();
      navigate("/studio");
    } catch (e) {
      setError(e);
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="editor-page">
      <PageTitle
        eyebrow="LET’S MAKE SOMETHING"
        title={video ? "A few finishing touches." : "Your next great video."}
        description={
          video
            ? "Update the details that help your story stand out."
            : "Bring your story to the grid. Start with a video and make it yours."
        }
      />
      <form className="panel stack-form upload-form" onSubmit={submit}>
        <ErrorBox error={error} />
        {!video && (
          <label className="upload-drop">
            <UploadCloud size={36} />
            <strong>{fileName}</strong>
            <span>MP4 or WebM · up to 250 MB</span>
            <input
              name="video"
              aria-label="Video file"
              type="file"
              required
              accept="video/mp4,video/webm"
              disabled={busy}
              onChange={(e) => {
                const file = e.target.files?.[0];
                setSeconds(0);
                if (!file) return;
                setFileName(file.name);
                if (file.size > 250 * 1024 * 1024) {
                  setError(new Error("Video must be 250 MB or smaller"));
                  return;
                }
                const element = document.createElement("video"),
                  url = URL.createObjectURL(file);
                element.preload = "metadata";
                element.onloadedmetadata = () => {
                  if (Number.isFinite(element.duration)) {
                    setSeconds(element.duration);
                    URL.revokeObjectURL(url);
                  } else {
                    element.ontimeupdate = () => {
                      if (
                        Number.isFinite(element.currentTime) &&
                        element.currentTime > 0 &&
                        element.currentTime < 86400
                      ) {
                        setSeconds(element.currentTime);
                        element.ontimeupdate = null;
                        URL.revokeObjectURL(url);
                      }
                    };
                    element.currentTime = 1e10;
                  }
                };
                element.onerror = () => {
                  setError(
                    new Error(
                      "Could not read this video. Choose an MP4 or WebM."
                    )
                  );
                  URL.revokeObjectURL(url);
                };
                element.src = url;
              }}
            />
          </label>
        )}
        <label>
          Title
          <input
            name="title"
            required
            maxLength={120}
            defaultValue={video?.title}
            placeholder="Give people a reason to press play"
            disabled={busy}
          />
        </label>
        <label>
          Description
          <textarea
            name="description"
            maxLength={5000}
            rows={5}
            defaultValue={video?.description}
            placeholder="Tell the story behind your video…"
            disabled={busy}
          />
        </label>
        <label>
          Thumbnail{" "}
          {video && (
            <span className="muted">
              · leave empty to keep the current image
            </span>
          )}
          <input
            name="thumbnail"
            type="file"
            required={!video}
            accept="image/png,image/jpeg,image/webp"
            disabled={busy}
          />
          <small>
            JPEG, PNG or WebP · up to 10 MB. A 16:9 image looks best.
          </small>
        </label>
        {video && (
          <img
            className="thumbnail-preview"
            src={video.thumbnail}
            alt="Current thumbnail"
          />
        )}
        {!video && (
          <label>
            Visibility
            <select name="isPublished" defaultValue="false" disabled={busy}>
              <option value="false">Draft — finish before publishing</option>
              <option value="true">Published — visible on the grid</option>
            </select>
          </label>
        )}
        {busy && !video && (
          <div className="upload-progress" role="status">
            <progress max={100} value={progress} />
            <span>
              {progress < 100
                ? `Uploading ${progress}%`
                : "Processing your upload…"}
            </span>
          </div>
        )}
        <div className="form-actions">
          <Link className="button secondary" to="/studio">
            Cancel
          </Link>
          <button className="button" disabled={busy}>
            {busy ? "Saving…" : video ? "Save changes" : "Upload video"}
            <UploadCloud size={16} />
          </button>
        </div>
      </form>
    </div>
  );
}
