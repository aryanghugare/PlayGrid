// Optional local mode: a persistent development database and local media.
// This intentionally does not load .env or contact your hosted database/Cloudinary.
import { MongoMemoryServer } from "mongodb-memory-server";
import mongoose from "mongoose";
import { mkdir } from "node:fs/promises";
import { randomBytes } from "node:crypto";
import path from "node:path";
process.env.NODE_ENV = "development";
process.env.MEDIA_DRIVER = "local";
process.env.ACCESS_TOKEN_SECRET = randomBytes(32).toString("hex");
process.env.REFRESH_TOKEN_SECRET = randomBytes(32).toString("hex");
process.env.CORS_ORIGIN = "http://localhost:5173,http://127.0.0.1:5173";
process.env.APP_ORIGIN = "http://localhost:8000";
const dbPath = path.resolve("data/mongodb");
await mkdir(dbPath, { recursive: true });
const mongo = await MongoMemoryServer.create({
  instance: { dbPath, dbName: "playgrid_local", storageEngine: "wiredTiger" },
});
await mongoose.connect(mongo.getUri(), { dbName: "playgrid_local" });
const { app } = await import("../src/app.js");
await Promise.all(Object.values(mongoose.models).map((model) => model.init()));
const server = app.listen(8000, "127.0.0.1", () =>
  console.log(
    "PlayGrid local mode: http://localhost:8000 — database and media persist in data/"
  )
);
for (const signal of ["SIGINT", "SIGTERM"])
  process.once(signal, () => {
    server.close(async () => {
      await mongoose.disconnect();
      await mongo.stop();
      process.exit(0);
    });
  });
