import { useState } from "react";
import type { FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { Camera, LockKeyhole, UserRound } from "lucide-react";
import { useAuth } from "../auth";
import { api } from "../api";
import { Avatar, PageTitle, ErrorBox } from "../components/shared";
export function Settings() {
  const { user } = useAuth();
  const cache = useQueryClient();
  const navigate = useNavigate();
  const [tab, setTab] = useState("profile"),
    [busy, setBusy] = useState(false),
    [error, setError] = useState<unknown>(null),
    [success, setSuccess] = useState("");
  async function submit(e: FormEvent<HTMLFormElement>, kind: string) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    setSuccess("");
    const data = new FormData(e.currentTarget);
    try {
      if (kind === "password") {
        if (data.get("newPassword") !== data.get("confirm"))
          throw new Error("New passwords do not match");
        await api("/users/change-password", {
          method: "POST",
          body: {
            oldPassword: data.get("oldPassword"),
            newPassword: data.get("newPassword"),
          },
        });
        await cache.cancelQueries();
        cache.removeQueries({
          predicate: (query) => query.queryKey[0] !== "session",
        });
        cache.setQueryData(["session"], null);
        navigate("/login");
        return;
      }
      if (kind === "profile") {
        await api("/users/updateDetails", {
          method: "PATCH",
          body: { fullName: data.get("fullName"), email: data.get("email") },
        });
      } else await api(`/users/${kind}`, { method: "PATCH", body: data });
      await cache.invalidateQueries();
      setSuccess("Changes saved. Looking good.");
    } catch (e) {
      setError(e);
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="settings-page">
      <PageTitle
        eyebrow="MAKE IT YOURS"
        title="A little more you."
        description="Your profile, your picture, your place on the grid."
      />
      <div className="tabs">
        <button
          className={tab === "profile" ? "active" : ""}
          onClick={() => {
            setTab("profile");
            setError(null);
            setSuccess("");
          }}
        >
          <UserRound size={16} />
          Profile
        </button>
        <button
          className={tab === "security" ? "active" : ""}
          onClick={() => {
            setTab("security");
            setError(null);
            setSuccess("");
          }}
        >
          <LockKeyhole size={16} />
          Security
        </button>
      </div>
      <ErrorBox error={error} />
      {success && (
        <div className="success-box" role="status">
          {success}
        </div>
      )}
      {tab === "profile" ? (
        <>
          <section className="panel settings-card">
            <div className="settings-heading">
              <Avatar src={user?.avatar} name={user?.fullName} size={68} />
              <div>
                <h2>{user?.fullName}</h2>
                <span className="muted">@{user?.username}</span>
              </div>
            </div>
            <form className="stack-form" onSubmit={(e) => submit(e, "profile")}>
              <label>
                Full name
                <input
                  name="fullName"
                  required
                  maxLength={80}
                  defaultValue={user?.fullName}
                />
              </label>
              <label>
                Email
                <input
                  name="email"
                  type="email"
                  required
                  defaultValue={user?.email}
                />
              </label>
              <div className="form-actions">
                <button className="button" disabled={busy}>
                  Save profile
                </button>
              </div>
            </form>
          </section>
          <div className="settings-images">
            {[
              ["avatar", "Profile picture", "avatar"],
              ["cover-image", "Channel cover", "coverImage"],
            ].map(([endpoint, title, field]) => (
              <section className="panel settings-card" key={endpoint}>
                <h2>
                  <Camera size={19} />
                  {title}
                </h2>
                <p className="muted small">JPEG, PNG or WebP, up to 10 MB.</p>
                {field === "coverImage" && user?.coverImage && (
                  <img
                    className="cover-preview"
                    src={user.coverImage}
                    alt="Current cover"
                  />
                )}
                <form
                  className="stack-form"
                  onSubmit={(e) => submit(e, endpoint)}
                >
                  <label>
                    Choose image
                    <input
                      name={field}
                      required
                      type="file"
                      accept="image/png,image/jpeg,image/webp"
                    />
                  </label>
                  <button className="button secondary" disabled={busy}>
                    Update {title.toLowerCase()}
                  </button>
                </form>
              </section>
            ))}
          </div>
        </>
      ) : (
        <section className="panel settings-card">
          <h2>Change password</h2>
          <p className="muted">
            You’ll sign in again after updating your password.
          </p>
          <form className="stack-form" onSubmit={(e) => submit(e, "password")}>
            <label>
              Current password
              <input
                type="password"
                autoComplete="current-password"
                name="oldPassword"
                required
              />
            </label>
            <label>
              New password
              <input
                type="password"
                autoComplete="new-password"
                name="newPassword"
                minLength={8}
                required
              />
            </label>
            <label>
              Confirm new password
              <input
                type="password"
                autoComplete="new-password"
                name="confirm"
                minLength={8}
                required
              />
            </label>
            <div className="form-actions">
              <button className="button" disabled={busy}>
                Update password
              </button>
            </div>
          </form>
        </section>
      )}
    </div>
  );
}
