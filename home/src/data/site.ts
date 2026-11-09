import photography from "./photos.json";
import portfolio from "./portfolio.json";
import resume from "./resume.json";

export interface Contribution {
  id: string;
  title: string;
  description: string;
  url: string;
}
export interface Project extends Contribution {
  image: string;
  width: number;
  height: number;
  featured: boolean;
}
export interface Client extends Contribution {
  image: string;
}
export interface Job {
  title: string;
  company: string;
  start: string;
  end: string | null;
  tags: string[];
  details: string[];
  lenses: string[];
}
export interface Photo {
  id: string;
  src: string;
  thumbnail: string;
  alt: string;
  width: number;
  height: number;
}
export interface PhotoEvent {
  id: string;
  title: string;
  year: string;
  coverId: string;
  photos: Photo[];
}
export const { projects } = portfolio;
export const { clients } = portfolio;
export const { jobs } = resume;
export const { skills } = resume;
export const events: PhotoEvent[] = photography;
export const featuredProjects = projects.filter(project => project.featured);
export const smallerProjects = projects
  .filter(project => !project.featured)
  .sort((a, b) => Number(b.id === "filmscraper") - Number(a.id === "filmscraper"));
export const homeProjects = projects.slice(0, 3);
export const introduction =
  "I'm a web developer, photographer, organizer, and youth educator, with backgrounds in the arts, non-profits, and politics. I love making and doing cool things that help people. Welcome to my site!";
export const destinations = [
  { to: "/", label: "Home" },
  { to: "/work", label: "Work" },
  { to: "/resume", label: "Resume" },
  { to: "/photos", label: "Photos" },
  { to: "/guestbook", label: "Guestbook" },
];
export function coverPhoto(event: PhotoEvent): Photo {
  const cover = event.photos.find(photo => photo.id === event.coverId) ?? event.photos[0];
  if (!cover) {
    throw new Error(`No photographs for ${event.id}`);
  }
  return cover;
}
