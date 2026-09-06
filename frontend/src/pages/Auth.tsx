import { useState } from "react";
import type { FormEvent } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { ArrowRight, Play, ImagePlus } from "lucide-react";
import { useAuth } from "../auth";
import { api } from "../api";
import { ErrorBox } from "../components/shared";
export function AuthPage({ register = false }: { register?: boolean }) {
  const [busy, setBusy] = useState(false),
    [error, setError] = useState<unknown>(null);
  const { signIn } = useAuth();
  const location = useLocation(),
    navigate = useNavigate();
  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const data = new FormData(e.currentTarget);
    try {
      if (register) {
        if (data.get("password") !== data.get("confirm"))
          throw new Error("Passwords do not match");
        data.delete("confirm");
        const cover = data.get("coverImage");
        if (cover instanceof File && !cover.size) data.delete("coverImage");
        await api("/users/register", { method: "POST", body: data });
        navigate("/login", { state: { registered: true } });
      } else {
        await signIn(
          String(data.get("identifier")),
          String(data.get("password"))
        );
        const destination = location.state?.from;
        navigate(
          typeof destination === "string" &&
            destination.startsWith("/") &&
            !destination.startsWith("//")
            ? destination
            : "/",
          { replace: true }
        );
      }
    } catch (e) {
      setError(e);
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="auth-layout">
      <section className="auth-art">
        <span className="banner-pill">YOUR NEXT CHAPTER STARTS HERE</span>
        <h1>
          A home for
          <br />
          what moves you<span>.</span>
        </h1>
        <div className="auth-play">
          <Play size={64} fill="currentColor" />
        </div>
        <p>
          Watch a little. Learn a lot.
          <br />
          Share something only you can make.
        </p>
        <div className="auth-art-footer">
          PLAYGRID <span>WATCH · CREATE · CONNECT</span>
        </div>
      </section>
      <section className="auth-form-panel">
        <div className="eyebrow">
          {register ? "JOIN THE GRID" : "GOOD TO SEE YOU AGAIN"}
        </div>
        <h1>{register ? "Make yourself at home." : "Welcome back."}</h1>
        <p className="muted">
          {register
            ? "Create your account and find your corner of the internet."
            : "Your videos, creators, and saved favorites are waiting."}
        </p>
        {location.state?.registered && (
          <div className="success-box">
            Account created. Sign in to get started.
          </div>
        )}
        <form className="stack-form" onSubmit={submit}>
          <ErrorBox error={error} />
          {register ? (
            <>
              <label>
                Full name
                <input
                  name="fullName"
                  autoComplete="name"
                  required
                  maxLength={80}
                />
              </label>
              <div className="form-row">
                <label>
                  Username
                  <input
                    name="username"
                    autoComplete="username"
                    required
                    minLength={3}
                    maxLength={30}
                    pattern="[A-Za-z0-9_]+"
                  />
                </label>
                <label>
                  Email
                  <input
                    type="email"
                    name="email"
                    autoComplete="email"
                    required
                  />
                </label>
              </div>
            </>
          ) : (
            <label>
              Email or username
              <input
                name="identifier"
                autoComplete="username"
                required
                autoFocus
              />
            </label>
          )}
          <label>
            Password
            <input
              type="password"
              name="password"
              autoComplete={register ? "new-password" : "current-password"}
              required
              minLength={register ? 8 : undefined}
            />
          </label>
          {register && (
            <>
              <label>
                Confirm password
                <input
                  type="password"
                  name="confirm"
                  autoComplete="new-password"
                  required
                  minLength={8}
                />
              </label>
              <div className="file-field">
                <ImagePlus size={20} />
                <label>
                  Profile picture <span className="muted">· required</span>
                  <input
                    type="file"
                    name="avatar"
                    accept="image/png,image/jpeg,image/webp"
                    required
                  />
                  <small>JPEG, PNG or WebP, up to 10 MB.</small>
                </label>
              </div>
              <label>
                Cover image <span className="muted">· optional</span>
                <input
                  type="file"
                  name="coverImage"
                  accept="image/png,image/jpeg,image/webp"
                />
              </label>
            </>
          )}
          <button className="button full" disabled={busy}>
            {busy ? "One moment…" : register ? "Create account" : "Sign in"}
            <ArrowRight size={17} />
          </button>
        </form>
        <p className="auth-switch">
          {register ? "Already on the grid?" : "New around here?"}{" "}
          <Link to={register ? "/login" : "/register"}>
            {register ? "Sign in" : "Create an account"}
          </Link>
        </p>
      </section>
    </div>
  );
}
