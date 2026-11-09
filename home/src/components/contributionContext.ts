import { createContext } from "react";

import type { Contribution } from "../data/site";

export interface NoteRequest {
  item: Contribution;
  anchor: HTMLAnchorElement;
  href: string;
  action: string;
  external: boolean;
}
export interface ContributionApi {
  anchor: HTMLAnchorElement | null;
  show: (request: NoteRequest, modal: boolean) => void;
  scheduleClose: () => void;
  cancelClose: () => void;
  dismiss: () => void;
}
export const ContributionContext = createContext<ContributionApi | null>(null);
