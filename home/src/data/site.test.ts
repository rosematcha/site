import { existsSync } from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

import { clients, coverPhoto, events, featuredProjects, projects, smallerProjects } from "./site";

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
  it("includes all 101 selected photos, with one event for 1906 and no Austin credit", () => {
    expect(events).toHaveLength(15);
    expect(events.flatMap(event => event.photos)).toHaveLength(101);
    expect(new Set(events.flatMap(event => event.photos.map(photo => photo.id))).size).toBe(101);
    expect(events.filter(event => event.title.includes("1906"))).toHaveLength(1);
    expect(events.some(event => event.title.includes("Austin"))).toBe(false);
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
