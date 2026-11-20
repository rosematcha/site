// The router decides when a page arrives at a plate named by the URL's hash (a fresh navigation to it), as against returning to a
// saved place (Back or Forward); it asks here, and the page's engine answers once it is up. No dependencies, so the router's
// bundle doesn't take in the engine.
let wanted = false;
let answer: (() => void) | null = null;
export function requestArrival() {
  if (answer) {
    answer();
  } else {
    wanted = true;
  }
}
// the engine of the page shown: answers now if asked before it was up, and to every later ask
export function answerArrivals(f: (() => void) | null) {
  answer = f;
  if (f && wanted) {
    wanted = false;
    f();
  }
  if (!f) {
    wanted = false;
  }
}
