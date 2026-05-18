import { Cloud, BookOpen, Github, Twitter } from "lucide-react";
import { Link } from "wouter";

export default function Footer() {
  return (
    <footer className="border-t border-white/10 bg-[#070c1a] mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="md:col-span-2">
            <div className="flex items-center gap-2 mb-4">
              <div className="relative">
                <Cloud className="h-7 w-7 text-indigo-400" />
                <BookOpen className="h-3.5 w-3.5 text-purple-400 absolute -bottom-0.5 -right-0.5" />
              </div>
              <span className="text-lg font-bold bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
                LuminaCloud
              </span>
            </div>
            <p className="text-slate-500 text-sm leading-relaxed max-w-xs">
              Your modern cloud-based digital library. Store, search, and share PDF books from anywhere.
            </p>
            <div className="flex gap-3 mt-4">
              <a href="#" className="text-slate-600 hover:text-slate-400 transition-colors">
                <Github className="h-5 w-5" />
              </a>
              <a href="#" className="text-slate-600 hover:text-slate-400 transition-colors">
                <Twitter className="h-5 w-5" />
              </a>
            </div>
          </div>

          {/* Links */}
          <div>
            <h4 className="text-white text-sm font-semibold mb-4">Product</h4>
            <ul className="space-y-2 text-sm text-slate-500">
              <li><Link href="/" className="hover:text-slate-300 transition-colors">Home</Link></li>
              <li><Link href="/dashboard" className="hover:text-slate-300 transition-colors">Dashboard</Link></li>
              <li><Link href="/upload" className="hover:text-slate-300 transition-colors">Upload Books</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="text-white text-sm font-semibold mb-4">Account</h4>
            <ul className="space-y-2 text-sm text-slate-500">
              <li><Link href="/login" className="hover:text-slate-300 transition-colors">Sign In</Link></li>
              <li><Link href="/signup" className="hover:text-slate-300 transition-colors">Create Account</Link></li>
            </ul>
          </div>
        </div>

        <div className="border-t border-white/5 mt-10 pt-6 flex flex-col sm:flex-row justify-between items-center gap-2">
          <p className="text-slate-600 text-xs">© {new Date().getFullYear()} LuminaCloud. All rights reserved.</p>
          <p className="text-slate-700 text-xs">Powered by Firebase & React</p>
        </div>
      </div>
    </footer>
  );
}
