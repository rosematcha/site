// Which page is in the document: a page reports its path when it mounts and clears it when it leaves. Route focus waits on it,
// since a route's page can come in after its location (its chunk still loading, the old page still showing or nothing at all).
let shown: string | null = null;
let waiting: { path: string; run: () => void } | null = null;
export function pageShown(path: string | null) {
  shown = path;
  if (path && waiting?.path === path) {
    const { run } = waiting;
    waiting = null;
    run();
  }
}
// run once the page for path is in the document (now, if it already is); returns a cancel
export function whenShown(path: string, run: () => void) {
  if (shown === path) {
    run();
  } else {
    waiting = { path, run };
  }
  return () => {
    if (waiting?.run === run) {
      waiting = null;
    }
  };
}
