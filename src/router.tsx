import {
  createRouter,
  createRootRoute,
  createRoute,
  createHashHistory,
} from "@tanstack/react-router";
import RootLayout from "./RootLayout";
import AnalyzeMode from "./AnalyzeMode";
import PracticeMode from "./PracticeMode";
import VideoMode from "./VideoMode";

const rootRoute = createRootRoute({ component: RootLayout });

const analyzeRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/",
  component: AnalyzeMode,
});

const practiceRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/practice",
  component: PracticeMode,
});

const videoRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/video",
  component: VideoMode,
});

const routeTree = rootRoute.addChildren([
  analyzeRoute,
  practiceRoute,
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
