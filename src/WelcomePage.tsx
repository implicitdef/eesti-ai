import { Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";
import { visibleFeatures } from "./features";
import { useOwnerMode } from "./OwnerModeContext";

function WelcomePage() {
  const { ownerMode } = useOwnerMode();
  const [translation, ...otherFeatures] = visibleFeatures(ownerMode);

  return (
    <main className="flex-1 overflow-y-auto px-6 py-8">
      <div className="max-w-3xl mx-auto flex flex-col gap-8">
        <div className="flex flex-col gap-2">
          <h2 className="text-3xl font-bold text-gray-900">
            Learn Estonian with AI
          </h2>
          <p className="text-gray-600 max-w-2xl">
            A handful of small tools to practice Estonian: translate sentences,
            drill vocabulary, and pull new words out of any text. Pick a feature
            below to get started.
          </p>
        </div>

        <ul className="border-t border-gray-900">
          {[translation, ...otherFeatures].map((feature) => {
            const isMain = feature === translation;
            return (
              <li key={feature.to} className="border-b border-gray-200">
                <Link
                  to={feature.to}
                  className="group grid grid-cols-[1.5rem_1fr_auto] items-start gap-x-4 px-1 py-5 hover:bg-gray-50 transition-colors"
                >
                  <feature.icon
                    size={isMain ? 22 : 18}
                    className={`shrink-0 text-gray-500 group-hover:text-blue-700 transition-colors ${isMain ? "mt-1" : "mt-0.5"}`}
                  />
                  <div className="flex flex-col gap-1 min-w-0">
                    <div className="flex items-baseline gap-3 flex-wrap">
                      <h3
                        className={`font-semibold text-gray-900 group-hover:text-blue-800 transition-colors ${isMain ? "text-xl" : "text-base"}`}
                      >
                        {feature.welcomeCardLabel}
                      </h3>
                      {isMain && (
                        <span className="text-xs uppercase tracking-wide text-gray-500">
                          Main exercise
                        </span>
                      )}
                    </div>
                    <p
                      className={`text-gray-600 max-w-2xl ${isMain ? "text-base" : "text-sm"}`}
                    >
                      {feature.description}
                    </p>
                  </div>
                  <ArrowRight
                    size={18}
                    className="mt-1 shrink-0 text-gray-300 group-hover:text-blue-700 group-hover:translate-x-0.5 transition"
                  />
                </Link>
              </li>
            );
          })}
        </ul>
      </div>
    </main>
  );
}

export default WelcomePage;
