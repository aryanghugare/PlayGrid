import { before, after, test } from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";
import request from "supertest";
process.env.NODE_ENV = "test";
process.env.ACCESS_TOKEN_SECRET = "test-access-secret-never-use-in-production";
process.env.REFRESH_TOKEN_SECRET =
  "test-refresh-secret-never-use-in-production";
process.env.MEDIA_DRIVER = "local";
process.env.MEDIA_DIRECTORY = await mkdtemp(
  path.join(tmpdir(), "playgrid-media-test-")
);
const { app } = await import("../src/app.js");
const { User } = await import("../src/models/user.model.js");
const { Video } = await import("../src/models/video.model.js");
const { Tweet } = await import("../src/models/tweet.model.js");
const { Subscription } = await import("../src/models/subscription.model.js");
const { Like } = await import("../src/models/like.model.js");
const { Playlist } = await import("../src/models/playlist.model.js");
const { Comment } = await import("../src/models/comment.model.js");
let mongo, alice, bob, a, b, video;
const png = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jZ1kAAAAASUVORK5CYII=",
  "base64"
);
async function login(username) {
  const agent = request.agent(app);
  const response = await agent
    .post("/api/v1/users/login")
    .send({ username, password: "password123" })
    .expect(200);
  return { agent, response };
}
function containsPrivate(value) {
  return /"(?:password|refreshToken|sessionVersion|avatarPublicId|coverImagePublicId)"/.test(
    JSON.stringify(value)
  );
}
before(async () => {
  mongo = await MongoMemoryServer.create({ instance: { ip: "127.0.0.1" } });
  await mongoose.connect(mongo.getUri());
  await Promise.all([
    User.init(),
    Video.init(),
    Tweet.init(),
    Subscription.init(),
    Like.init(),
    Playlist.init(),
    Comment.init(),
  ]);
  alice = await User.create({
    username: "alice",
    email: "alice@example.com",
    fullName: "Alice",
    avatar: "/avatar.png",
    password: "password123",
  });
  bob = await User.create({
    username: "bob",
    email: "bob@example.com",
    fullName: "Bob",
    avatar: "/avatar.png",
    password: "password123",
  });
  a = (await login("alice")).agent;
  b = (await login("bob")).agent;
  video = await Video.create({
    title: "A published film",
    description: "A test film",
    videoFile: "/movie.mp4",
    thumbnail: "/thumb.png",
    duration: 12,
    owner: alice._id,
    isPublished: true,
  });
});
after(async () => {
  await mongoose.disconnect();
  if (mongo) await mongo.stop();
  await rm(process.env.MEDIA_DIRECTORY, { recursive: true, force: true });
});
test("health, malformed JSON, unknown route and unauthenticated errors use consistent envelopes", async () => {
  await request(app).get("/api/v1/healthcheck").expect(200);
  await request(app).get("/api/v1/healthcheck/ready").expect(200);
  const missing = await request(app).get("/api/v1/nothing").expect(404);
  assert.equal(missing.body.success, false);
  const invalid = await request(app)
    .post("/api/v1/users/login")
    .set("Content-Type", "application/json")
    .send("{")
    .expect(400);
  assert.match(invalid.body.message, /JSON/);
  await request(app).get("/api/v1/users/current-user").expect(401);
  await request(app)
    .post("/api/v1/users/login")
    .set("Origin", "https://evil.example")
    .send({})
    .expect(403);
});
test("registration validates inputs, requires image, detects fake media, and excludes secrets", async () => {
  await request(app).post("/api/v1/users/register").send({}).expect(400);
  const signup = () =>
    request(app)
      .post("/api/v1/users/register")
      .field("username", "charlie")
      .field("email", "charlie@example.com")
      .field("fullName", "Charlie")
      .field("password", "password123");
  await signup().expect(400);
  await signup()
    .attach("avatar", Buffer.from("not-an-image"), {
      filename: "avatar.png",
      contentType: "image/png",
    })
    .expect(400);
  const result = await signup()
    .attach("avatar", png, { filename: "avatar.png", contentType: "image/png" })
    .expect(201);
  assert.equal(containsPrivate(result.body.data), false);
  assert.equal(result.headers["set-cookie"], undefined);
  await signup()
    .attach("avatar", png, { filename: "avatar.png", contentType: "image/png" })
    .expect(409);
});
test("profile updates and first cover upload succeed without revealing tokens", async () => {
  const current = await a.get("/api/v1/users/current-user").expect(200);
  assert.equal(containsPrivate(current.body.data), false);
  const update = await a
    .patch("/api/v1/users/updateDetails")
    .send({ fullname: "Alice Creator", email: "alice@example.com" })
    .expect(200);
  assert.equal(update.body.data.fullName, "Alice Creator");
  assert.equal(containsPrivate(update.body.data), false);
  const cover = await a
    .patch("/api/v1/users/cover-image")
    .attach("coverImage", png, {
      filename: "cover.png",
      contentType: "image/png",
    })
    .expect(200);
  assert.match(cover.body.data.coverImage, /^\/media\//);
  assert.equal(containsPrivate(cover.body.data), false);
  await a.patch("/api/v1/users/avatar").expect(400);
  const publicChannel = await request(app)
    .get("/api/v1/users/c/alice")
    .expect(200);
  assert.equal(publicChannel.body.data.email, undefined);
});
test("refresh rotates atomically; replay and logout invalidate sessions", async () => {
  const { agent, response } = await login("charlie");
  assert.equal(containsPrivate(response.body.data), false);
  const oldCookies = response.headers["set-cookie"].map((x) => x.split(";")[0]);
  const refreshed = await agent
    .post("/api/v1/users/refresh-token")
    .send({})
    .expect(200);
  assert.ok(refreshed.headers["set-cookie"]);
  await request(app)
    .post("/api/v1/users/refresh-token")
    .set("Cookie", oldCookies)
    .send({})
    .expect(401);
  const activeCookies = refreshed.headers["set-cookie"].map(
    (x) => x.split(";")[0]
  );
  await agent.post("/api/v1/users/logout").expect(200);
  await request(app)
    .get("/api/v1/users/current-user")
    .set("Cookie", activeCookies)
    .expect(401);
  await request(app)
    .post("/api/v1/users/refresh-token")
    .set("Cookie", activeCookies)
    .send({})
    .expect(401);
});
test("password changes revoke existing access and require new password", async () => {
  const { agent, response } = await login("charlie");
  const cookies = response.headers["set-cookie"].map((x) => x.split(";")[0]);
  await agent
    .post("/api/v1/users/change-password")
    .send({ oldPassword: "wrong", newPassword: "different123" })
    .expect(400);
  await agent
    .post("/api/v1/users/change-password")
    .send({ oldPassword: "password123", newPassword: "different123" })
    .expect(200);
  await request(app)
    .get("/api/v1/users/current-user")
    .set("Cookie", cookies)
    .expect(401);
  await request(app)
    .post("/api/v1/users/login")
    .send({ username: "charlie", password: "password123" })
    .expect(401);
  await request(app)
    .post("/api/v1/users/login")
    .send({ username: "charlie", password: "different123" })
    .expect(200);
});
test("posts keep IDs and safe owners; cross-user mutations are rejected", async () => {
  const created = await a
    .post("/api/v1/tweet")
    .send({ content: "My first post" })
    .expect(201);
  const id = created.body.data._id;
  const list = await request(app)
    .get(`/api/v1/tweet/user/${alice._id}`)
    .expect(200);
  assert.equal(list.body.data.items[0]._id, id);
  assert.equal(list.body.data.items[0].owner.email, undefined);
  await b.patch(`/api/v1/tweet/${id}`).send({ content: "Stolen" }).expect(404);
  await b.delete(`/api/v1/tweet/${id}`).expect(404);
  await a.patch(`/api/v1/tweet/${id}`).send({ content: " " }).expect(400);
  await a.patch(`/api/v1/tweet/${id}`).send({ content: "Updated" }).expect(200);
  await a.delete(`/api/v1/tweet/${id}`).expect(200);
});
test("subscriptions are idempotent under concurrent requests and protect subscriber email", async () => {
  await a.put(`/api/v1/subscriptions/c/${alice._id}`).expect(400);
  await a.put("/api/v1/subscriptions/c/invalid").expect(400);
  await a
    .put(`/api/v1/subscriptions/c/${new mongoose.Types.ObjectId()}`)
    .expect(404);
  const responses = await Promise.all(
    Array.from({ length: 5 }, () =>
      b.put(`/api/v1/subscriptions/c/${alice._id}`)
    )
  );
  assert.ok(responses.every((r) => r.status === 200));
  assert.equal(
    await Subscription.countDocuments({
      subscriber: bob._id,
      channel: alice._id,
    }),
    1
  );
  const list = await request(app)
    .get(`/api/v1/subscriptions/u/${alice._id}`)
    .expect(200);
  assert.equal(list.body.data.items[0].email, undefined);
  const feed = await b.get("/api/v1/videos/feed/subscriptions").expect(200);
  assert.equal(feed.body.data.total, 1);
  await b.delete(`/api/v1/subscriptions/c/${alice._id}`).expect(200);
  await b.delete(`/api/v1/subscriptions/c/${alice._id}`).expect(200);
});
test("video discovery, search and pagination exclude drafts; owners control publication", async () => {
  const draft = await Video.create({
    title: "Draft footage",
    decription: "Legacy description",
    videoFile: "/draft.mp4",
    thumbnail: "/thumb.png",
    duration: 1,
    owner: alice._id,
    isPublished: false,
  });
  const list = await request(app)
    .get("/api/v1/videos?q=published&limit=1")
    .expect(200);
  assert.equal(list.body.data.total, 1);
  await request(app).get("/api/v1/videos?page=-1").expect(400);
  await request(app).get(`/api/v1/videos/${draft._id}`).expect(404);
  await b.get(`/api/v1/videos/${draft._id}`).expect(404);
  const own = await a.get(`/api/v1/videos/${draft._id}`).expect(200);
  assert.equal(own.body.data.description, "Legacy description");
  await b
    .patch(`/api/v1/videos/${draft._id}/publication`)
    .send({ isPublished: true })
    .expect(404);
  await a
    .patch(`/api/v1/videos/${draft._id}/publication`)
    .send({ isPublished: true })
    .expect(200);
  await request(app).get(`/api/v1/videos/${draft._id}`).expect(200);
  await a.delete(`/api/v1/videos/${draft._id}`).expect(200);
});
test("multipart video creation and metadata updates return usable DTOs", async () => {
  const movie = Buffer.from([
    0, 0, 0, 24, 102, 116, 121, 112, 109, 112, 52, 50, 0, 0, 0, 0,
  ]);
  const created = await a
    .post("/api/v1/videos")
    .field("title", "Uploaded clip")
    .field("description", "Upload test")
    .field("durationSeconds", "2")
    .field("isPublished", "false")
    .attach("video", movie, { filename: "clip.mp4", contentType: "video/mp4" })
    .attach("thumbnail", png, {
      filename: "thumb.png",
      contentType: "image/png",
    })
    .expect(201);
  assert.equal(created.body.data.durationSeconds, 2);
  assert.equal(created.body.data.videoPublicId, undefined);
  const id = created.body.data._id;
  await a
    .patch(`/api/v1/videos/${id}`)
    .send({ title: "Renamed clip", description: "New text" })
    .expect(200);
  await a.delete(`/api/v1/videos/${id}`).expect(200);
});
test("comments, likes, playlist membership, history and delete cleanup integrate", async () => {
  const id = String(video._id);
  const comment = await b
    .post(`/api/v1/videos/${id}/comments`)
    .send({ content: "Great film" })
    .expect(201);
  const cid = comment.body.data._id;
  await a.patch(`/api/v1/comments/${cid}`).send({ content: "No" }).expect(404);
  await b
    .patch(`/api/v1/comments/${cid}`)
    .send({ content: "Excellent film" })
    .expect(200);
  await b.put(`/api/v1/likes/video/${id}`).expect(200);
  await b.put(`/api/v1/likes/video/${id}`).expect(200);
  assert.equal(await Like.countDocuments({ video: video._id }), 1);
  await b.put(`/api/v1/likes/comment/${cid}`).expect(200);
  const likes = await b.get("/api/v1/likes/videos").expect(200);
  assert.equal(likes.body.data.total, 1);
  const playlist = await b
    .post("/api/v1/playlists")
    .send({ name: "Weekend" })
    .expect(201);
  const pid = playlist.body.data._id;
  await b.put(`/api/v1/playlists/${pid}/videos/${id}`).expect(200);
  await b.put(`/api/v1/playlists/${pid}/videos/${id}`).expect(200);
  const saved = await b.get(`/api/v1/playlists/${pid}`).expect(200);
  assert.equal(saved.body.data.videos.total, 1);
  await a.get(`/api/v1/playlists/${pid}`).expect(404);
  await b.patch(`/api/v1/playlists/${pid}`).send({ videoIds: [] }).expect(400);
  await b.put(`/api/v1/users/history/${id}`).expect(200);
  await b.put(`/api/v1/users/history/${id}`).expect(200);
  const history = await b.get("/api/v1/users/history").expect(200);
  assert.equal(history.body.data.total, 1);
  assert.equal(containsPrivate(history.body.data), false);
  const stats = await a.get("/api/v1/dashboard/stats").expect(200);
  assert.equal(stats.body.data.videos, 1);
  assert.equal(typeof stats.body.message, "string");
  await request(app).post(`/api/v1/videos/${id}/views`).expect(200);
  await b.delete(`/api/v1/videos/${id}`).expect(404);
  await a.delete(`/api/v1/videos/${id}`).expect(200);
  assert.equal(await Comment.countDocuments({ video: video._id }), 0);
  assert.equal(
    await Like.countDocuments({
      $or: [{ video: video._id }, { comment: cid }],
    }),
    0
  );
  assert.equal((await Playlist.findById(pid)).videos.length, 0);
  assert.equal((await User.findById(bob._id)).watchHistory.length, 0);
  await b.delete(`/api/v1/playlists/${pid}`).expect(200);
});
