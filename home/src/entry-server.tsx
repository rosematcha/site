// Each route's markup at build time (scripts/build-metadata.mjs), so a page paints before its script runs; main.tsx hydrates it.
import { StrictMode } from "react";

import { StaticRouter } from "react-router-dom";

import { renderToString } from "react-dom/server";

import App from "./App";
import { pages } from "./pages/all";

export function render(url: string) {
  return renderToString(
    <StrictMode>
      <StaticRouter location={url}>
        <App pages={pages} />
      </StaticRouter>
    </StrictMode>
  );
}
