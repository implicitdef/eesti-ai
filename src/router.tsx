import {
  createRouter,
  createRootRoute,
  createRoute,
  createHashHistory,
} from "@tanstack/react-router";
import RootLayout from "./RootLayout";
import SentencePracticeMode from "./SentencePracticeMode";
import MixingSentencesMode from "./MixingSentencesMode";
import FromThemeMode from "./FromThemeMode";
import VideoMode from "./VideoMode";

const rootRoute = createRootRoute({ component: RootLayout });

const sentencePracticeRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/from-sentence",
  component: SentencePracticeMode,
});

const mixingSentencesRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/mixing-sentences",
  component: MixingSentencesMode,
});

const fromThemeRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/",
  component: FromThemeMode,
});

const videoRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/video",
  component: VideoMode,
});

const routeTree = rootRoute.addChildren([
  sentencePracticeRoute,
  mixingSentencesRoute,
  fromThemeRoute,
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
