import { useState } from "react";
import {
  NavLink,
  Link,
  Outlet,
  useNavigate,
  useSearchParams,
} from "react-router-dom";
import {
  Compass,
  History,
  ThumbsUp,
  ListVideo,
  Users,
  MessageSquare,
  Clapperboard,
  Settings,
  Search,
  Plus,
  Play,
  Menu,
  X,
  LogOut,
  ArrowUpRight,
} from "lucide-react";
import { useAuth } from "../auth";
import { Avatar, ErrorBox } from "./shared";
const links = [
  ["/explore", "Discover", Compass],
  ["/subscriptions", "Subscriptions", Users],
  ["/community", "Community", MessageSquare],
  ["/history", "Watch history", History],
  ["/liked", "Liked videos", ThumbsUp],
  ["/playlists", "Your playlists", ListVideo],
  ["/studio", "Creator studio", Clapperboard],
  ["/settings", "Settings", Settings],
] as const;
export function Layout() {
  const [open, setOpen] = useState(false),
    [error, setError] = useState<unknown>(null);
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  return (
    <div className="app-shell">
      <a className="skip-link" href="#main">
        Skip to content
      </a>
      {open && (
        <button
          className="sidebar-backdrop"
          aria-label="Close navigation"
          onClick={() => setOpen(false)}
        />
      )}
      <aside className={`sidebar ${open ? "open" : ""}`}>
        <Link className="brand" to="/" onClick={() => setOpen(false)}>
          <span className="brand-mark">
            <Play size={18} fill="currentColor" />
          </span>
          PlayGrid<span className="brand-dot">®</span>
        </Link>
        <button
          className="mobile-close icon-button"
          aria-label="Close navigation"
          onClick={() => setOpen(false)}
        >
          <X />
        </button>
        <div className="sidebar-label">YOUR DAILY DOSE</div>
        <nav>
          {links.map(([to, label, Icon], i) => (
            <NavLink
              end={to === "/explore" || to === "/studio"}
              key={to}
              to={to}
              onClick={() => setOpen(false)}
              className={({ isActive }) =>
                `nav-item ${isActive ? "active" : ""} ${i === 3 || i === 6 ? "nav-break" : ""}`
              }
            >
              <Icon size={19} />
              {label}
              {to === "/explore" && <span className="nav-active-dot" />}
            </NavLink>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <div className="creator-note">
            <span className="tiny-tag">MADE TO SHARE</span>
            <h3>
              Your ideas.
              <br />A bigger screen.
            </h3>
            <Link to="/studio/upload" onClick={() => setOpen(false)}>
              Start creating
              <ArrowUpRight size={17} />
            </Link>
          </div>
          <div className="sidebar-footer">
            A little curiosity goes a long way.
            <span>PLAYGRID © {new Date().getFullYear()}</span>
          </div>
        </div>
      </aside>
      <div className="main-shell">
        <header className="topbar">
          <button
            className="mobile-menu icon-button"
            aria-label="Open navigation"
            onClick={() => setOpen(true)}
          >
            <Menu />
          </button>
          <form
            className="search-form"
            onSubmit={(e) => {
              e.preventDefault();
              const q = String(
                new FormData(e.currentTarget).get("q") || ""
              ).trim();
              navigate(q ? `/search?q=${encodeURIComponent(q)}` : "/explore");
            }}
          >
            <Search size={18} />
            <input
              key={params.get("q") || ""}
              name="q"
              defaultValue={params.get("q") || ""}
              placeholder="Search videos, find your next thing"
              aria-label="Search videos"
            />
            <kbd>↵</kbd>
          </form>
          <div className="topbar-actions">
            <Link
              className="button secondary create-button"
              to="/studio/upload"
            >
              <Plus size={17} />
              Create
            </Link>
            {user ? (
              <>
                <Link aria-label="Account settings" to="/settings">
                  <Avatar src={user.avatar} name={user.fullName} />
                </Link>
                <button
                  className="icon-button signout"
                  title="Sign out"
                  aria-label="Sign out"
                  onClick={async () => {
                    try {
                      await signOut();
                      navigate("/");
                    } catch (e) {
                      setError(e);
                    }
                  }}
                >
                  <LogOut size={17} />
                </button>
              </>
            ) : (
              <Link className="button" to="/login">
                Sign in
                <ArrowUpRight size={15} />
              </Link>
            )}
          </div>
        </header>
        <main id="main" tabIndex={-1}>
          <ErrorBox error={error} />
          <Outlet />
        </main>
        <footer className="main-footer">
          <span>Good videos. Great company.</span>
          <span>
            You're on PlayGrid <span className="green-dot" />
          </span>
        </footer>
      </div>
    </div>
  );
}
