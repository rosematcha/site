import { existsSync } from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

import { coverPhoto, events } from "./photos";
import { clients, featuredProjects, projects, smallerProjects } from "./portfolio";

describe("approved portfolio content", () => {
  it("keeps FilmScraper in the smaller list and the developer-first home choices", () => {
    expect(projects.slice(0, 3).map(project => project.title)).toEqual([
      "Ciphermaniac",
      "Ciphermaniac Events",
      "Balatro3DS",
    ]);
    expect(featuredProjects).toHaveLength(5);
    expect(smallerProjects[0]?.title).toBe("FilmScraper");
    expect(projects.some(project => project.title === "Gesso")).toBe(false);
    expect(clients).toHaveLength(8);
  });
  it("includes all 140 selected photos in 20 sets, newest first, with one event for 1906", () => {
    expect(events).toHaveLength(20);
    expect(events.flatMap(event => event.photos)).toHaveLength(140);
    expect(new Set(events.flatMap(event => event.photos.map(photo => photo.id))).size).toBe(140);
    expect(events.filter(event => event.title.includes("1906"))).toHaveLength(1);
    const dates = events.map(event => event.date);
    expect(dates).toEqual([...dates].sort().reverse());
  });
  it("covers a set with its chosen photo, or its first when the choice is missing", () => {
    const [event] = events;
    if (!event) {
      throw new Error("No sets");
    }
    expect(coverPhoto(event).id).toBe(event.coverId);
    expect(coverPhoto({ ...event, coverId: "missing" })).toBe(event.photos[0]);
  });
  it.each(events)("$id has a real cover, unique descriptions, and deployable images", event => {
    expect(event.photos).toContainEqual(coverPhoto(event));
    const alts = new Set(event.photos.map(photo => photo.alt));
    expect(alts.size).toBe(event.photos.length);
    event.photos.forEach(photo => {
      expect(photo.alt.length).toBeGreaterThan(20);
      expect(existsSync(path.join(process.cwd(), "public", photo.src))).toBe(true);
      expect(existsSync(path.join(process.cwd(), "public", photo.thumbnail))).toBe(true);
    });
  });
  it.each(projects)("$title has an image and working-shaped destination", project => {
    expect(existsSync(path.join(process.cwd(), "public", project.image))).toBe(true);
    expect(new URL(project.url).protocol).toBe("https:");
  });
  it("retains the confirmed PHP and internal-tooling distinctions", () => {
    expect(clients.find(client => client.title === "SAY Sí")?.description).toContain("5.3 to 8.4");
    expect(clients.find(client => client.title === "Ruby City")?.description).toContain("advised");
    expect(clients.find(client => client.title === "Combat Power Gaming")?.description).toContain(
      "hundreds of players"
    );
  });
});
