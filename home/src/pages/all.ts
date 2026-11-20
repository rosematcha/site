// every page, imported directly: the build's prerender (entry-server.tsx) and the tests
import type { Pages } from "../App";

import GuestbookPage from "./GuestbookPage";
import HomePage from "./HomePage";
import NotFoundPage from "./NotFoundPage";
import PhotosPage from "./PhotosPage";
import ResumePage from "./ResumePage";
import SetPage from "./SetPage";
import WorkPage from "./WorkPage";

export const pages: Pages = {
  Home: HomePage,
  Work: WorkPage,
  Resume: ResumePage,
  Photos: PhotosPage,
  Set: SetPage,
  Guestbook: GuestbookPage,
  NotFound: NotFoundPage,
};
