import { Link, useLocation } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  const { pathname } = useLocation();
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center text-center">
      <Helmet><meta name="prerender-status-code" content="404" /><title>Not found — AI Console</title></Helmet>
      <p className="font-mono text-sm text-muted-foreground">404</p>
      <h1 className="mt-2 text-xl font-semibold">Page not found</h1>
      <p className="mt-1 font-mono text-xs text-muted-foreground">{pathname}</p>
      <Button asChild size="sm" className="mt-5"><Link to="/">Back to overview</Link></Button>
    </div>
  );
}
