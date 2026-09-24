import { Link, Outlet, useLocation } from "@tanstack/react-router";
import { X } from "lucide-react";
import {
  CREDENTIALS,
  CredentialsProvider,
  useCredential,
  useSetCredentialKinds,
} from "./CredentialsContext";
import type { CredentialKind } from "./CredentialsContext";
import { FEATURES } from "./features";

function CredentialChip({ kind }: { kind: CredentialKind }) {
  const { values, clear } = useCredential(kind);

  return (
    <div className="flex items-center gap-2">
      <div className="flex items-center gap-1.5 rounded-full border border-gray-300 bg-white px-3 py-1">
        {CREDENTIALS[kind].summary(values).map((part, i) => (
          <span key={i} className="flex items-center gap-1.5">
            {i > 0 && <span className="text-xs text-gray-300">·</span>}
            <span className="text-xs text-gray-400">{part.label}</span>
            <code className="font-mono text-xs text-gray-600">
              {part.value}
            </code>
          </span>
        ))}
      </div>
      <button
        onClick={clear}
        title={`Clear ${CREDENTIALS[kind].fields.map((f) => f.label).join(" and ")}`}
        className="flex items-center gap-1 rounded-full border border-transparent px-3 py-1 text-xs text-gray-400 transition-colors hover:border-red-100 hover:bg-red-50 hover:text-red-500"
      >
        <X size={12} />
        <span>Clear</span>
      </button>
    </div>
  );
}

/** Secondary header showing the stored credentials, shown only once one is set. */
function CredentialsBar() {
  const setKinds = useSetCredentialKinds();

  if (setKinds.length === 0) return null;

  return (
    <div className="bg-blue-50 border-b border-blue-100 px-4 sm:px-6 py-1.5 flex flex-wrap items-center justify-end gap-x-4 gap-y-1">
      {setKinds.map((kind) => (
        <CredentialChip key={kind} kind={kind} />
      ))}
    </div>
  );
}

function RootLayout() {
  const { pathname } = useLocation();
  const activeFeature = FEATURES.find((feature) => feature.isActive(pathname));
  const pageTitle = pathname === "/" ? "Welcome" : activeFeature?.pageTitle;
  const otherFeatures = activeFeature
    ? FEATURES.filter((feature) => feature !== activeFeature)
    : FEATURES;
  const otherFeaturesLabel = activeFeature ? "other features:" : "features:";

  return (
    <CredentialsProvider>
      <div className="min-h-screen bg-white flex flex-col">
        <header className="bg-blue-900 text-white px-4 py-2 shadow">
          <div className="flex flex-wrap items-start justify-between gap-x-4 gap-y-1">
            <div>
              <Link to="/" className="no-underline">
                <h1 className="text-2xl font-bold uppercase inline text-white">
                  Eesti AI
                </h1>
              </Link>
              <span className="text-sm text-blue-200 ml-2">{pageTitle}</span>
            </div>

            <div className="flex flex-row sm:flex-col items-center justify-between sm:items-end flex-wrap gap-x-2 gap-y-1 w-full sm:w-auto">
              <div
                className="font-mono text-[11px] text-blue-300"
                title="Build version"
              >
                version: {__APP_VERSION__}
              </div>
              <nav className="flex items-center gap-1.5 text-xs text-blue-200 flex-wrap">
                <span className="text-blue-300">{otherFeaturesLabel}</span>
                {otherFeatures.flatMap((feature, i) => [
                  ...(i > 0
                    ? [
                        <span
                          key={`${feature.to}-sep`}
                          className="text-blue-400"
                        >
                          /
                        </span>,
                      ]
                    : []),
                  <Link
                    key={feature.to}
                    to={feature.to}
                    className="text-blue-100 underline decoration-blue-500 hover:text-white transition-colors"
                  >
                    {feature.label}
                  </Link>,
                ])}
              </nav>
            </div>
          </div>
        </header>

        <CredentialsBar />

        <Outlet />
      </div>
    </CredentialsProvider>
  );
}

export default RootLayout;
