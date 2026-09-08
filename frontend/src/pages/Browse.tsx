import { useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ArrowUpRight, Sparkles, Radio, SlidersHorizontal } from "lucide-react";
import { api } from "../api";
import type { Page, Video, User } from "../types";
import {
  PageTitle,
  VideoGrid,
  Pager,
  Loading,
  ErrorBox,
  Avatar,
  Empty,
} from "../components/shared";
export function Browse({
  mode = "discover",
}: {
  mode?: "discover" | "search" | "subscriptions" | "liked" | "history";
}) {
  const [params] = useSearchParams(),
    [page, setPage] = useState(1),
    [sort, setSort] = useState("latest");
  const q = params.get("q") || "";
  const endpoint =
    mode === "subscriptions"
      ? "/videos/feed/subscriptions"
      : mode === "liked"
        ? "/likes/videos"
        : mode === "history"
          ? "/users/history"
          : "/videos";
  const query = useQuery({
    queryKey: ["browse", mode, q, page, sort],
    queryFn: ({ signal }) =>
      api<Page<Video>>(
        `${endpoint}?page=${page}&sort=${sort}&q=${encodeURIComponent(q)}`,
        { signal }
      ),
  });
  const channels = useQuery({
    queryKey: ["subscriptions"],
    queryFn: () => api<Page<User>>("/subscriptions/me?limit=100"),
    enabled: mode === "subscriptions",
  });
  const names = {
    discover: [
      "THE GOOD STUFF, ALL IN ONE PLACE",
      "A little curiosity. A lot to discover.",
    ],
    search: ["FOLLOW YOUR CURIOSITY", `Results for “${q}”`],
    subscriptions: ["YOUR CREATOR CIRCLE", "Keep up with your favorites."],
    liked: ["YOUR PERSONAL HIGHLIGHTS", "Worth another watch."],
    history: ["PICK UP WHERE YOU LEFT OFF", "Your recent watches."],
  };
  return (
    <>
      <PageTitle
        eyebrow={names[mode][0]}
        title={names[mode][1]}
        description={
          mode === "discover"
            ? "Fresh perspectives, familiar favorites, and something you didn’t know you needed."
            : undefined
        }
      />
      {mode === "discover" && (
        <section className="discovery-banner">
          <div>
            <span className="banner-pill">
              <Sparkles size={13} /> A SPACE FOR YOUR NEXT OBSESSION
            </span>
            <h2>
              Press play.
              <br />
              See where it takes you.
            </h2>
            <p>
              Big ideas and small moments.
              <br />
              There’s room for all of it here.
            </p>
            <Link to="/community">
              Meet the community
              <ArrowUpRight size={17} />
            </Link>
          </div>
          <div className="banner-art" aria-hidden="true">
            <div className="orbit orbit-one" />
            <div className="orbit orbit-two" />
            <div className="art-card card-back" />
            <div className="art-card card-front">
              <div className="art-sun" />
              <div className="art-mountain" />
              <span className="art-play">▶</span>
              <span className="art-label">SOMETHING GOOD IS NEXT</span>
            </div>
            <span className="spark spark-one">✳</span>
            <span className="spark spark-two">✦</span>
            <span className="floating-tag">
              <Radio size={14} /> Made for curious minds
            </span>
          </div>
        </section>
      )}
      {mode === "subscriptions" && channels.data && (
        <div className="channel-strip">
          {channels.data.items.map((c) => (
            <Link key={c._id} to={`/channel/${c.username}`}>
              <Avatar src={c.avatar} name={c.fullName} size={50} />
              <span>{c.fullName}</span>
            </Link>
          ))}
        </div>
      )}
      <div className="section-toolbar">
        <h2>
          {mode === "discover"
            ? "On your radar"
            : mode === "search"
              ? "Search results"
              : mode === "subscriptions"
                ? "From your subscriptions"
                : "Your videos"}
          {query.data && (
            <span className="result-count">{query.data.total}</span>
          )}
        </h2>
        {["discover", "search"].includes(mode) && (
          <div className="segmented">
            <button
              className={sort === "latest" ? "selected" : ""}
              onClick={() => {
                setSort("latest");
                setPage(1);
              }}
            >
              Latest
            </button>
            <button
              className={sort === "popular" ? "selected" : ""}
              onClick={() => {
                setSort("popular");
                setPage(1);
              }}
            >
              Popular
            </button>
            <SlidersHorizontal size={15} />
          </div>
        )}
      </div>
      <ErrorBox error={query.error} />
      {query.isPending ? (
        <Loading />
      ) : (
        query.data && (
          <>
            <VideoGrid
              items={query.data.items}
              empty={
                mode !== "discover" ? (
                  <Empty
                    title={
                      mode === "search"
                        ? "No matches this time"
                        : "Nothing here yet"
                    }
                    detail={
                      mode === "search"
                        ? "Try a different title or keyword."
                        : mode === "subscriptions"
                          ? "Subscribe to a creator to see their latest videos."
                          : mode === "liked"
                            ? "Like a video to keep it close."
                            : "Videos you watch while signed in will appear here."
                    }
                    action={
                      <Link className="button secondary" to="/explore">
                        Explore videos
                        <ArrowUpRight size={16} />
                      </Link>
                    }
                  />
                ) : undefined
              }
            />
            <Pager
              page={page}
              hasNext={query.data.hasNextPage}
              onChange={setPage}
            />
          </>
        )
      )}
      {mode === "history" && Boolean(query.data?.items.length) && (
        <HistoryClear onDone={() => query.refetch()} />
      )}
    </>
  );
}
function HistoryClear({ onDone }: { onDone: () => void }) {
  const [error, setError] = useState<unknown>(null),
    [busy, setBusy] = useState(false);
  return (
    <div className="form-actions">
      <ErrorBox error={error} />
      <button
        className="button secondary"
        disabled={busy}
        onClick={async () => {
          setBusy(true);
          try {
            await api("/users/history", { method: "DELETE" });
            onDone();
          } catch (e) {
            setError(e);
          } finally {
            setBusy(false);
          }
        }}
      >
        Clear watch history
      </button>
    </div>
  );
}
