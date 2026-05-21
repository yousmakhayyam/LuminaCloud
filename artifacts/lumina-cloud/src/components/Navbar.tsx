import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/contexts/AuthContext";
import { BookOpen, Cloud, Menu, X, LogOut, LayoutDashboard, Upload, Home } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function Navbar() {
  const { currentUser, logout } = useAuth();
  const [location] = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  const navLinks = currentUser
    ? [
        { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
        { href: "/upload", label: "Upload", icon: Upload },
      ]
    : [{ href: "/", label: "Home", icon: Home }];

  return (
    <nav className="sticky top-0 z-50 border-b border-white/10 bg-[#0a0f1e]/90 backdrop-blur-xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 group">
            <div className="relative">
              <Cloud className="h-8 w-8 text-indigo-400 group-hover:text-indigo-300 transition-colors" />
              <BookOpen className="h-4 w-4 text-purple-400 absolute -bottom-0.5 -right-0.5" />
            </div>
            <span className="text-xl font-bold bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
              NovaShelf
            </span>
          </Link>

          {/* Desktop nav */}
          <div className="hidden md:flex items-center gap-1">
            {navLinks.map(({ href, label, icon: Icon }) => (
              <Link key={href} href={href}>
                <Button
                  variant="ghost"
                  size="sm"
                  className={`gap-2 text-sm ${
                    location === href
                      ? "text-white bg-white/10"
                      : "text-slate-400 hover:text-white hover:bg-white/5"
                  }`}
                  data-testid={`nav-link-${label.toLowerCase()}`}
                >
                  <Icon className="h-4 w-4" />
                  {label}
                </Button>
              </Link>
            ))}
          </div>

          {/* Auth buttons */}
          <div className="hidden md:flex items-center gap-2">
            {currentUser ? (
              <div className="flex items-center gap-3">
                <span className="text-sm text-slate-400">
                  {currentUser.displayName || currentUser.email}
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={logout}
                  className="gap-2 text-slate-400 hover:text-white hover:bg-white/5"
                  data-testid="button-logout"
                >
                  <LogOut className="h-4 w-4" />
                  Sign Out
                </Button>
              </div>
            ) : (
              <>
                <Link href="/login">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-slate-400 hover:text-white hover:bg-white/5"
                    data-testid="nav-link-login"
                  >
                    Sign In
                  </Button>
                </Link>
                <Link href="/signup">
                  <Button
                    size="sm"
                    className="bg-indigo-600 hover:bg-indigo-500 text-white border-0"
                    data-testid="nav-link-signup"
                  >
                    Get Started
                  </Button>
                </Link>
              </>
            )}
          </div>

          {/* Mobile menu toggle */}
          <button
            className="md:hidden text-slate-400 hover:text-white p-1"
            onClick={() => setMobileOpen(!mobileOpen)}
            data-testid="button-mobile-menu"
          >
            {mobileOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="md:hidden border-t border-white/10 bg-[#0a0f1e]/95 px-4 py-3 space-y-1">
          {navLinks.map(({ href, label, icon: Icon }) => (
            <Link key={href} href={href} onClick={() => setMobileOpen(false)}>
              <div className="flex items-center gap-2 px-3 py-2 rounded-lg text-slate-300 hover:text-white hover:bg-white/5 text-sm">
                <Icon className="h-4 w-4" />
                {label}
              </div>
            </Link>
          ))}
          {currentUser ? (
            <button
              onClick={() => { logout(); setMobileOpen(false); }}
              className="flex items-center gap-2 px-3 py-2 rounded-lg text-slate-300 hover:text-white hover:bg-white/5 text-sm w-full"
              data-testid="button-mobile-logout"
            >
              <LogOut className="h-4 w-4" />
              Sign Out
            </button>
          ) : (
            <>
              <Link href="/login" onClick={() => setMobileOpen(false)}>
                <div className="px-3 py-2 rounded-lg text-slate-300 hover:text-white hover:bg-white/5 text-sm">Sign In</div>
              </Link>
              <Link href="/signup" onClick={() => setMobileOpen(false)}>
                <div className="px-3 py-2 rounded-lg bg-indigo-600 text-white text-sm text-center">Get Started</div>
              </Link>
            </>
          )}
        </div>
      )}
    </nav>
  );
}
