// Not found: two things on an almost empty sheet. The key rests low and to the left, and the heading stands higher than any other
// type on the site, so its one long shadow across the empty ground is what swings with the visitor's hand.
import type { PageCfg } from "../engine";
import { Btn } from "../site/markup";
import { Page } from "../site/Page";
import { useEngine } from "../site/useEngine";

// the long shadow over open ground swept 55% of the screen at home's gain
const CFG: PageCfg = { rest: [0.16, 0.2], gain: { wide: [0.23, 0.22] } };
export default function NotFoundPage() {
  useEngine(CFG);
  return (
    <Page current="" id="p-404" title="Page not found">
      <main className="page nf col" id="main" tabIndex={-1}>
        <div className="nf-g">
          <h1 data-ts="9" tabIndex={-1}>
            Page not found
          </h1>
          <p className="nf-go">
            <Btn label="Go home" to="/" />
          </p>
        </div>
      </main>
    </Page>
  );
}
