import resume from "./resume.json";

export interface Job {
  title: string;
  company: string;
  start: string;
  end: string | null;
  tags: string[];
  details: string[];
  lenses: string[];
}
export const { jobs } = resume;
export const { skills } = resume;
