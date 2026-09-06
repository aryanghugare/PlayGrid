import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter, Routes, Route, Link } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AuthProvider } from "./auth";
import { Layout } from "./components/Layout";
import { RequireAuth, Empty } from "./components/shared";
import { Browse } from "./pages/Browse";
import { AuthPage } from "./pages/Auth";
import { Community } from "./pages/Community";
import { Channel } from "./pages/Channel";
import { Watch } from "./pages/Watch";
import { Studio, VideoEditor } from "./pages/Studio";
import { Settings } from "./pages/Settings";
import { Playlists, PlaylistPage } from "./pages/Playlists";
import "./styles.css";
const cache = new QueryClient({
  defaultOptions: {
    queries: { retry: 1, staleTime: 30_000, refetchOnWindowFocus: false },
  },
});
const protectedPage = (page: React.ReactNode) => (
  <RequireAuth>{page}</RequireAuth>
);
ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <QueryClientProvider client={cache}>
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route element={<Layout />}>
              <Route index element={<Browse key="discover" />} />
              <Route
                path="search"
                element={<Browse key="search" mode="search" />}
              />
              <Route path="login" element={<AuthPage key="login" />} />
              <Route
                path="register"
                element={<AuthPage key="register" register />}
              />
              <Route path="community" element={<Community />} />
              <Route path="channel/:username" element={<Channel />} />
              <Route path="watch/:videoId" element={<Watch />} />
              <Route
                path="subscriptions"
                element={protectedPage(
                  <Browse key="subscriptions" mode="subscriptions" />
                )}
              />
              <Route
                path="history"
                element={protectedPage(<Browse key="history" mode="history" />)}
              />
              <Route
                path="liked"
                element={protectedPage(<Browse key="liked" mode="liked" />)}
              />
              <Route path="studio" element={protectedPage(<Studio />)} />
              <Route
                path="studio/upload"
                element={protectedPage(<VideoEditor />)}
              />
              <Route
                path="studio/edit/:videoId"
                element={protectedPage(<VideoEditor />)}
              />
              <Route path="settings" element={protectedPage(<Settings />)} />
              <Route path="playlists" element={protectedPage(<Playlists />)} />
              <Route
                path="playlist/:playlistId"
                element={protectedPage(<PlaylistPage />)}
              />
              <Route
                path="*"
                element={
                  <Empty
                    title="This page wandered off"
                    detail="Let’s get you back to something good."
                    action={
                      <Link className="button" to="/">
                        Back to discovery
                      </Link>
                    }
                  />
                }
              />
            </Route>
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </QueryClientProvider>
  </React.StrictMode>
);
