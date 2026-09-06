export interface User {
  _id: string;
  username: string;
  fullName: string;
  email?: string;
  avatar: string;
  coverImage?: string;
  createdAt?: string;
}
export interface Channel extends User {
  subscribersCount: number;
  channelSubscribedToCount: number;
  isSubscribed: boolean;
}
export interface Video {
  _id: string;
  title: string;
  description: string;
  thumbnail: string;
  videoFile: string;
  durationSeconds: number;
  duration: number;
  views: number;
  isPublished: boolean;
  owner: User;
  createdAt: string;
  likesCount?: number;
  isLiked?: boolean;
  subscribersCount?: number;
  isSubscribed?: boolean;
}
export interface Post {
  _id: string;
  content: string;
  owner: User;
  createdAt: string;
}
export interface Page<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  hasNextPage: boolean;
}
export interface Playlist {
  _id: string;
  name: string;
  description: string;
  videos: string[];
  updatedAt: string;
}
export interface PlaylistDetail extends Omit<Playlist, "videos"> {
  videos: Page<Video>;
}
