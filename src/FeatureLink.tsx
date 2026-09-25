import { Link } from "@tanstack/react-router";
import { getFeature, type FeatureId } from "./features";

/** Inline link to another feature, for use in running text. */
function FeatureLink({ id }: { id: FeatureId }) {
  const feature = getFeature(id);
  return (
    <Link
      to={feature.to}
      className="font-semibold text-blue-800 no-underline hover:underline"
    >
      {feature.inTextLabel}
    </Link>
  );
}

export default FeatureLink;
