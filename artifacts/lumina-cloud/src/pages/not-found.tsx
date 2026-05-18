import { Link } from "wouter";
import { Cloud, BookOpen, Home } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center px-4">
      <div className="text-center">
        <div className="relative inline-flex items-center justify-center mb-6">
          <Cloud className="h-16 w-16 text-indigo-600/30" />
          <BookOpen className="h-8 w-8 text-indigo-400/60 absolute" />
        </div>
        <h1 className="text-6xl font-black text-white mb-2">404</h1>
        <h2 className="text-xl font-semibold text-slate-300 mb-3">Page not found</h2>
        <p className="text-slate-500 text-sm mb-8 max-w-sm">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <Link href="/">
          <Button
            className="bg-indigo-600 hover:bg-indigo-500 text-white border-0 gap-2"
            data-testid="button-go-home"
          >
            <Home className="h-4 w-4" />
            Back to Home
          </Button>
        </Link>
      </div>
    </div>
  );
}
