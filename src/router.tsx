import {
  createRouter,
  createRootRoute,
  createRoute,
  createHashHistory,
} from "@tanstack/react-router";
import RootLayout from "./RootLayout";
import AnalyzeMode from "./AnalyzeMode";
import PracticeMode from "./PracticeMode";

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

const routeTree = rootRoute.addChildren([analyzeRoute, practiceRoute]);

export const router = createRouter({
  routeTree,
  history: createHashHistory(),
});

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}
