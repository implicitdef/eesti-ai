import {
  createRouter,
  createRootRoute,
  createRoute,
  createHashHistory,
} from "@tanstack/react-router";
import RootLayout from "./RootLayout";
import FromThemeProvider from "./FromThemeContext";
import SentenceListPage from "./SentenceListPage";
import SentencePage from "./SentencePage";
import GenerationPage from "./GenerationPage";
import VideoMode from "./VideoMode";
import IngestMode from "./IngestMode";

const rootRoute = createRootRoute({ component: RootLayout });

const fromThemeLayoutRoute = createRoute({
  id: "fromThemeLayout",
  getParentRoute: () => rootRoute,
  component: FromThemeProvider,
});

const sentenceListRoute = createRoute({
  getParentRoute: () => fromThemeLayoutRoute,
  path: "/",
  component: SentenceListPage,
});

const sentenceRoute = createRoute({
  getParentRoute: () => fromThemeLayoutRoute,
  path: "/sentence/$id",
  component: SentencePage,
});

const generateRoute = createRoute({
  getParentRoute: () => fromThemeLayoutRoute,
  path: "/generate",
  component: GenerationPage,
});

const videoRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/video",
  component: VideoMode,
});

const ingestRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/vocab-practice",
  component: IngestMode,
});

const routeTree = rootRoute.addChildren([
  fromThemeLayoutRoute.addChildren([
    sentenceListRoute,
    sentenceRoute,
    generateRoute,
  ]),
  videoRoute,
  ingestRoute,
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
