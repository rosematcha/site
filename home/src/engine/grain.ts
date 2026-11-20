// v22's grain with a faint ordered dither in it, one 192 px tile, normal blend. Made once for the visit in four tasks of 48
// rows (no long task), encoded off the main thread where the engine can, and set as --grain on the root.
const N = 192;
const B = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5];
let tile: Promise<HTMLCanvasElement> | null = null;

function grainRows(data: Uint8ClampedArray, rnd: () => number, j0: number, j1: number) {
  for (let j = j0; j < j1; j++) {
    for (let i = 0; i < N; i++) {
      const v =
        0.72 * (rnd() + rnd() - 1) + 0.28 * ((B[(j & 3) * 4 + (i & 3)] ?? 0) / 15 - 0.5) * 2;
      const k = (j * N + i) * 4;
      const c = v > 0 ? 255 : 0;
      data[k] = c;
      data[k + 1] = c;
      data[k + 2] = c;
      data[k + 3] = Math.round(Math.min(1, Math.abs(v)) * (v > 0 ? 22 : 34));
    }
  }
}
function make(): Promise<HTMLCanvasElement> {
  const cv = document.createElement("canvas");
  cv.width = N;
  cv.height = N;
  const x = cv.getContext("2d");
  if (!x) {
    return Promise.resolve(cv);
  }
  const im = x.createImageData(N, N);
  let s = 7;
  const rnd = () => {
    s = (s * 16807) % 2147483647;
    return s / 2147483647;
  };
  return new Promise(done => {
    let j = 0;
    const set = (u: string) => {
      document.documentElement.style.setProperty("--grain", `url(${u})`);
      done(cv);
    };
    const rows = () => {
      const j1 = Math.min(N, j + 48);
      grainRows(im.data, rnd, j, j1);
      j = j1;
      if (j < N) {
        setTimeout(rows);
        return;
      }
      x.putImageData(im, 0, 0);
      cv.toBlob(b => {
        set(b ? URL.createObjectURL(b) : cv.toDataURL());
      });
    };
    setTimeout(rows);
  });
}
export function grainTile() {
  tile ??= make();
  return tile;
}
