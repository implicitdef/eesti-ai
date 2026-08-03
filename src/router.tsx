import {
  createRouter,
  createRootRoute,
  createRoute,
  createHashHistory,
} from "@tanstack/react-router";
import RootLayout from "./RootLayout";
import PracticeMode from "./PracticeMode";
import SentencePracticeMode from "./SentencePracticeMode";
import VideoMode from "./VideoMode";

const rootRoute = createRootRoute({ component: RootLayout });

const practiceRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/",
  component: PracticeMode,
});

const sentencePracticeRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/from-sentence",
  component: SentencePracticeMode,
});

const videoRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/video",
  component: VideoMode,
});

const routeTree = rootRoute.addChildren([
  practiceRoute,
  sentencePracticeRoute,
  videoRoute,
]);

export const router = createRouter({
  routeTree,
  history: createHashHistory(),
});

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}
