import { Suspense, type ComponentType } from "react";

import { Navigate, Route, Routes, useLocation } from "react-router-dom";

import { useRouteFocus } from "./hooks/useRouteFocus";

// the pages: imported directly to prerender (pages/all.ts), loaded per route in the browser (main.tsx), so a page ships only its
// own code; the Suspense boundary sits in the same place in both, so a page still loading keeps its built markup while it hydrates
export interface Pages {
  Home: ComponentType;
  Work: ComponentType;
  Resume: ComponentType;
  Photos: ComponentType;
  Set: ComponentType;
  Guestbook: ComponentType;
  NotFound: ComponentType;
}
// paths match case-sensitively, as the built files and Netlify's rules do (/Work is Not found); each path is its own page: a new path mounts its page (and attaches the engine to it) afresh, as a page load would
export default function App({ pages: P }: { pages: Pages }) {
  useRouteFocus();
  const { pathname } = useLocation();
  return (
    // a new boundary per path: the page leaving goes as the URL changes, rather than staying on show (and in reach) under the
    // next page's URL while that page's chunk comes in
    <Suspense key={pathname} fallback={null}>
      <Routes key={pathname}>
        <Route caseSensitive element={<P.Home />} path="/" />
        <Route caseSensitive element={<P.Work />} path="/work" />
        <Route caseSensitive element={<Navigate replace to="/work" />} path="/projects" />
        <Route caseSensitive element={<P.Resume />} path="/resume" />
        <Route caseSensitive element={<P.Photos />} path="/photos" />
        <Route caseSensitive element={<P.Set />} path="/photos/:eventId" />
        <Route caseSensitive element={<P.Guestbook />} path="/guestbook" />
        <Route element={<P.NotFound />} path="*" />
      </Routes>
    </Suspense>
  );
}
