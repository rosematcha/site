import portfolio from "./portfolio.json";

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
  width: number;
  height: number;
}
export const { projects } = portfolio;
export const { clients }: { clients: Client[] } = portfolio;
const byId = new Map(projects.map(project => [project.id, project]));
const pick = (ids: string[]) => ids.flatMap(id => byId.get(id) ?? []);
// home's four in home's order; Work's first shelf adds San Japan; its second is the smaller projects, FilmScraper first
export const homeProjects = pick(["events", "bexarvoting", "ciphermaniac", "balatro3ds"]);
export const featuredProjects = pick([
  "events",
  "bexarvoting",
  "ciphermaniac",
  "balatro3ds",
  "sanjapan",
]);
export const smallerProjects = projects
  .filter(project => !project.featured)
  .sort((a, b) => Number(b.id === "filmscraper") - Number(a.id === "filmscraper"));
