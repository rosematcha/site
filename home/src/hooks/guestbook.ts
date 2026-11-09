export interface GuestEntry {
  id: string;
  name: string;
  website: string;
  message: string;
  date: string;
}
export function safeWebsite(value: unknown): string {
  if (typeof value !== "string" || !value.trim()) {
    return "";
  }
  try {
    const url = new URL(value);
    return ["https:", "http:"].includes(url.protocol) ? url.href : "";
  } catch {
    return "";
  }
}
function parseEntry(value: unknown): GuestEntry | null {
  if (!value || typeof value !== "object") {
    return null;
  }
  if (!("id" in value) || !("name" in value) || !("message" in value) || !("date" in value)) {
    return null;
  }
  if (
    typeof value.id !== "string" ||
    typeof value.name !== "string" ||
    typeof value.message !== "string" ||
    typeof value.date !== "string"
  ) {
    return null;
  }
  return {
    id: value.id,
    name: value.name,
    message: value.message,
    date: value.date,
    website: safeWebsite("website" in value ? value.website : ""),
  };
}
export async function fetchGuestEntries(signal: AbortSignal): Promise<GuestEntry[]> {
  const response = await fetch("/.netlify/functions/get-guestbook-entries", { signal });
  if (!response.ok || !response.headers.get("content-type")?.includes("application/json")) {
    throw new Error("Guestbook unavailable");
  }
  const payload: unknown = await response.json();
  if (!Array.isArray(payload)) {
    throw new Error("Invalid guestbook response");
  }
  return payload
    .map((value: unknown) => parseEntry(value))
    .filter((entry): entry is GuestEntry => entry !== null);
}
export async function signGuestbook(form: HTMLFormElement): Promise<void> {
  const body = new URLSearchParams();
  new FormData(form).forEach((value, key) => {
    if (typeof value === "string") {
      body.set(key, value);
    }
  });
  const response = await fetch("/", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: body.toString(),
  });
  if (!response.ok) {
    throw new Error("Submission failed");
  }
}
