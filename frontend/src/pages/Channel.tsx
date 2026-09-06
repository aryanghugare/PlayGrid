import { useState } from "react";
import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { api } from "../api";
import type { Channel as ChannelType, Page, Video, User } from "../types";
import {
  Avatar,
  count,
  Loading,
  ErrorBox,
  SubscribeButton,
  VideoGrid,
  Pager,
  Empty,
} from "../components/shared";
import { Community } from "./Community";
export function Channel() {
  const { username } = useParams();
  const [tab, setTab] = useState("videos"),
    [page, setPage] = useState(1);
  const query = useQuery({
    queryKey: ["channel", username],
    queryFn: () => api<ChannelType>(`/users/c/${username}`),
  });
  const channel = query.data;
  const videos = useQuery({
    queryKey: ["channel-videos", channel?._id, page],
    queryFn: () =>
      api<Page<Video>>(`/videos?owner=${channel?._id}&page=${page}`),
    enabled: !!channel,
  });
  const subscribers = useQuery({
    queryKey: ["subscribers", channel?._id, page],
    queryFn: () =>
      api<Page<User>>(`/subscriptions/u/${channel?._id}?page=${page}`),
    enabled: !!channel && tab === "subscribers",
  });
  if (query.isPending) return <Loading />;
  if (!channel) return <ErrorBox error={query.error} />;
  return (
    <>
      <div className="channel-cover">
        {channel.coverImage ? (
          <img src={channel.coverImage} alt="" />
        ) : (
          <div className="cover-pattern">
            <span>EVERY CREATOR HAS A STORY.</span>
          </div>
        )}
      </div>
      <div className="channel-header">
        <Avatar src={channel.avatar} name={channel.fullName} size={94} />
        <div>
          <h1>{channel.fullName}</h1>
          <p className="muted">
            @{channel.username} <span className="dot">·</span>{" "}
            {count(channel.subscribersCount)} subscribers
          </p>
        </div>
        <SubscribeButton
          channelId={channel._id}
          subscribed={channel.isSubscribed}
        />
      </div>
      <div className="tabs">
        {["videos", "community", "subscribers"].map((t) => (
          <button
            key={t}
            className={tab === t ? "active" : ""}
            onClick={() => {
              setTab(t);
              setPage(1);
            }}
          >
            {t[0].toUpperCase() + t.slice(1)}
          </button>
        ))}
      </div>
      {tab === "videos" && (
        <>
          <ErrorBox error={videos.error} />
          {videos.isPending ? (
            <Loading />
          ) : (
            videos.data && (
              <>
                <VideoGrid
                  items={videos.data.items}
                  empty={
                    <Empty
                      title="A new story is on its way"
                      detail="Published videos from this creator will appear here."
                    />
                  }
                />
                <Pager
                  page={page}
                  hasNext={videos.data.hasNextPage}
                  onChange={setPage}
                />
              </>
            )
          )}
        </>
      )}
      {tab === "community" && <Community userId={channel._id} embedded />}
      {tab === "subscribers" && (
        <>
          <ErrorBox error={subscribers.error} />
          {subscribers.isPending ? (
            <Loading />
          ) : (
            <div className="people-grid">
              {subscribers.data?.items.map((u) => (
                <div className="panel person" key={u._id}>
                  <Avatar src={u.avatar} name={u.fullName} size={50} />
                  <div>
                    <a href={`/channel/${u.username}`}>{u.fullName}</a>
                    <span className="muted">@{u.username}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
          {subscribers.data && (
            <Pager
              page={page}
              hasNext={subscribers.data.hasNextPage}
              onChange={setPage}
            />
          )}
        </>
      )}
    </>
  );
}
