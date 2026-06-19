import { Link, useLocation, useNavigate } from "react-router-dom";
import StatusState from "../components/StatusState.jsx";

export default function NotFoundPage() {
  const location = useLocation();
  const navigate = useNavigate();

  return (
    <div className="mx-auto w-full max-w-5xl">
      <StatusState
        tone="empty"
        kicker="404"
        title="404 - Page not found"
        description={`No page exists at ${location.pathname}. The workspace, docs, and settings routes are still available from here.`}
        actionLabel="Open Workspace"
        onAction={() => {
          navigate("/");
        }}
      />
      <div className="mt-4 flex flex-wrap gap-2">
        <Link className="btn btn-soft" to="/docs">
          Read Docs
        </Link>
        <Link className="btn btn-ghost" to="/settings">
          Settings
        </Link>
      </div>
    </div>
  );
}
