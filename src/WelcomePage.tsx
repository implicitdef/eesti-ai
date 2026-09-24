import { Link } from "@tanstack/react-router";
import { FEATURES } from "./features";

const [translation, ...otherFeatures] = FEATURES;

function WelcomePage() {
  return (
    <main className="flex-1 overflow-y-auto px-6 py-8">
      <div className="max-w-4xl mx-auto flex flex-col gap-8">
        <div className="flex flex-col gap-2">
          <h2 className="text-3xl font-bold text-gray-900">
            Learn Estonian with AI
          </h2>
          <p className="text-gray-600 max-w-2xl">
            A handful of small tools to practice Estonian: translate sentences,
            drill vocabulary, watch videos with a cheatsheet, and pull new words
            out of any text. Pick a feature below to get started.
          </p>
        </div>

        <Link
          to={translation.to}
          className="group flex flex-col gap-3 rounded-2xl border-2 border-blue-700 bg-blue-50 p-6 sm:p-8 hover:bg-blue-100 transition-colors"
        >
          <div className="flex items-center gap-3">
            <translation.icon size={32} className="text-blue-700 shrink-0" />
            <h3 className="text-2xl font-bold text-blue-900">
              {translation.label}
            </h3>
          </div>
          <p className="text-gray-700 max-w-2xl">{translation.description}</p>
        </Link>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {otherFeatures.map((feature) => (
            <Link
              key={feature.to}
              to={feature.to}
              className="group flex flex-col gap-2 rounded-xl border border-gray-300 bg-white p-5 hover:border-blue-400 hover:bg-blue-50 transition-colors"
            >
              <div className="flex items-center gap-2">
                <feature.icon size={20} className="text-blue-700 shrink-0" />
                <h3 className="text-lg font-bold text-gray-900">
                  {feature.label}
                </h3>
              </div>
              <p className="text-sm text-gray-600">{feature.description}</p>
            </Link>
          ))}
        </div>
      </div>
    </main>
  );
}

export default WelcomePage;
