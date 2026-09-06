// Browser tests use a fresh database and temporary media, never the project's .env.
import { MongoMemoryServer } from "mongodb-memory-server";
import mongoose from "mongoose";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
process.env.NODE_ENV = "test";
process.env.MEDIA_DRIVER = "local";
process.env.MEDIA_DIRECTORY = await mkdtemp(
  path.join(tmpdir(), "playgrid-browser-")
);
process.env.ACCESS_TOKEN_SECRET = "browser-tests-only-access-secret";
process.env.REFRESH_TOKEN_SECRET = "browser-tests-only-refresh-secret";
process.env.CORS_ORIGIN = "http://127.0.0.1:4173";
process.env.APP_ORIGIN = "http://127.0.0.1:4173";
const mongo = await MongoMemoryServer.create();
await mongoose.connect(mongo.getUri());
const { app } = await import("../src/app.js");
await Promise.all(Object.values(mongoose.models).map((model) => model.init()));
const server = app.listen(4173, "127.0.0.1", () =>
  console.log("Browser test server ready")
);
for (const signal of ["SIGINT", "SIGTERM"])
  process.once(signal, () => {
    server.close(async () => {
      await mongoose.disconnect();
      await mongo.stop();
      await rm(process.env.MEDIA_DIRECTORY, { recursive: true, force: true });
      process.exit(0);
    });
  });
