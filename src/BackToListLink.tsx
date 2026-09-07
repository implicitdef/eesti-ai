import { Link } from "@tanstack/react-router";

function BackToListLink() {
  return (
    <Link
      to="/"
      className="self-start font-bold hover:text-blue-700 transition-colors"
    >
      ← Back to the sentences list
    </Link>
  );
}

export default BackToListLink;
