// The quiet iOS opt-in: a small text button that appears only after the visitor has touched the page (so it answers interest
// rather than asking up front), and never again once declined.
import { mq } from "./env";
import type { LightInput, TiltState } from "./input";
import { later, sig } from "./scope";

const KEY = "light-tilt";
function stored() {
  try {
    return localStorage.getItem(KEY);
  } catch {
    return null;
  }
}
function store(v: string) {
  try {
    localStorage.setItem(KEY, v);
  } catch {
    // storage blocked: the offer comes back next visit
  }
}
function tiltOptIn(light: LightInput, button: HTMLElement) {
  let touched = false;
  let ask = false;
  const show = () => {
    if (touched && ask && stored() !== "denied") {
      button.hidden = false;
    }
  };
  // wait past the click that follows this touch, so the same tap can't land on the new button
  window.addEventListener(
    "pointerup",
    e => {
      if (e.pointerType === "touch") {
        touched = true;
        later(show, 400);
      }
    },
    sig()
  );
  button.addEventListener(
    "click",
    () => {
      void light.enableTilt().then(ok => {
        if (light.tilt === "ask") {
          return; // no answer yet: keep the offer, remember nothing
        }
        store(ok ? "granted" : "denied");
        button.hidden = true;
      });
    },
    sig()
  );
  return (state: TiltState) => {
    ask = state === "ask";
    if (!ask) {
      button.hidden = true;
      return;
    }
    // granted on an earlier visit: re-request on the first tap anywhere (needs a gesture)
    if (stored() === "granted") {
      window.addEventListener("click", () => void light.enableTilt(), { ...sig(), once: true });
    } else {
      show();
    }
  };
}
// The offer's line is held from load wherever the offer may appear (a touch screen whose browser asks before tilt, not yet
// answered), so the first tap shows it without moving anything below it. If tilt turns out to need no asking (Android sends
// readings at once), the line is let go, but only before the first touch: after that nothing below the intro moves.
export function tiltRoom(light: LightInput, button: HTMLElement) {
  const root = document.documentElement;
  const offer = tiltOptIn(light, button);
  let touched = false;
  const asks = "DeviceOrientationEvent" in window && "requestPermission" in DeviceOrientationEvent;
  root.classList.toggle("tilt-room", asks && mq("(pointer: coarse)") && !stored());
  window.addEventListener(
    "pointerup",
    e => {
      if (e.pointerType === "touch") {
        touched = true;
      }
    },
    sig()
  );
  return (s: TiltState) => {
    offer(s);
    if (!touched && (s === "on" || s === "denied")) {
      root.classList.remove("tilt-room");
    }
  };
}
