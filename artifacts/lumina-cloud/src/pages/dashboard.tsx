import { useEffect, useState, useMemo } from "react";
import { Link, useLocation } from "wouter";
import { Search, Plus, BookOpen, Library, Upload, RefreshCw, X } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { getBooks, Book } from "@/lib/books";
import BookCard from "@/components/BookCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";

const CATEGORIES = ["All", "Fiction", "Non-Fiction", "Science", "Technology", "History", "Biography", "Other"];

export default function DashboardPage() {
  const { currentUser } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");

  // Redirect if not logged in
  useEffect(() => {
    if (!currentUser) setLocation("/login");
  }, [currentUser, setLocation]);

  const loadBooks = async () => {
    setLoading(true);
    try {
      const data = await getBooks();
      setBooks(data);
    } catch {
      toast({ title: "Error", description: "Failed to load books.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (currentUser) loadBooks();
  }, [currentUser]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    return books.filter((b) => {
      const matchesSearch =
        !q || b.title.toLowerCase().includes(q) || b.author.toLowerCase().includes(q);
      const matchesCat = category === "All" || b.category === category;
      return matchesSearch && matchesCat;
    });
  }, [books, search, category]);

  const myBooks = books.filter((b) => b.uploadedBy === currentUser?.uid);

  if (!currentUser) return null;

  return (
    <div className="min-h-[calc(100vh-4rem)] px-4 py-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-bold text-white">
              Welcome back, {currentUser.displayName?.split(" ")[0] ?? "Reader"}
            </h1>
            <p className="text-slate-400 text-sm mt-0.5">
              {books.length} {books.length === 1 ? "book" : "books"} in the library
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={loadBooks}
              disabled={loading}
              className="text-slate-400 hover:text-white hover:bg-white/5 gap-2"
              data-testid="button-refresh"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
              Refresh
            </Button>
            <Link href="/upload">
              <Button
                size="sm"
                className="bg-indigo-600 hover:bg-indigo-500 text-white border-0 gap-2 shadow-md shadow-indigo-600/20"
                data-testid="button-upload"
              >
                <Plus className="h-4 w-4" />
                Upload Book
              </Button>
            </Link>
          </div>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-8">
          {[
            { label: "Total Books", value: books.length, icon: Library, color: "text-indigo-400" },
            { label: "My Uploads", value: myBooks.length, icon: Upload, color: "text-purple-400" },
            { label: "Categories", value: [...new Set(books.map((b) => b.category))].length, icon: BookOpen, color: "text-cyan-400" },
          ].map(({ label, value, icon: Icon, color }) => (
            <div
              key={label}
              className="bg-[#0d1526]/80 border border-white/10 rounded-xl p-4 flex items-center gap-3"
            >
              <div className="w-9 h-9 rounded-lg bg-white/5 flex items-center justify-center shrink-0">
                <Icon className={`h-5 w-5 ${color}`} />
              </div>
              <div>
                <div className="text-xl font-bold text-white">{value}</div>
                <div className="text-xs text-slate-500">{label}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Search & filters */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by title or author..."
              className="pl-9 bg-[#0d1526]/80 border-white/10 text-white placeholder:text-slate-600 focus:border-indigo-500/60"
              data-testid="input-search"
            />
            {search && (
              <button
                onClick={() => setSearch("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
          <div className="flex gap-1.5 flex-wrap">
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                onClick={() => setCategory(cat)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  category === cat
                    ? "bg-indigo-600 text-white"
                    : "bg-[#0d1526]/80 border border-white/10 text-slate-400 hover:text-white hover:border-white/20"
                }`}
                data-testid={`filter-${cat.toLowerCase().replace(/\s/g, "-")}`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Results */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="bg-[#0d1526]/80 border border-white/10 rounded-2xl p-5 animate-pulse">
                <div className="w-16 h-4 bg-white/5 rounded mb-4" />
                <div className="w-10 h-10 bg-white/5 rounded-xl mb-3" />
                <div className="w-3/4 h-3 bg-white/5 rounded mb-2" />
                <div className="w-1/2 h-3 bg-white/5 rounded mb-4" />
                <div className="w-full h-8 bg-white/5 rounded-lg" />
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20">
            <div className="w-16 h-16 rounded-2xl bg-[#0d1526]/80 border border-white/10 flex items-center justify-center mx-auto mb-4">
              <BookOpen className="h-8 w-8 text-slate-600" />
            </div>
            <h3 className="text-white font-semibold mb-2">
              {books.length === 0 ? "No books yet" : "No books match your search"}
            </h3>
            <p className="text-slate-500 text-sm mb-6">
              {books.length === 0
                ? "Upload your first PDF book to get started."
                : "Try a different search term or category."}
            </p>
            {books.length === 0 && (
              <Link href="/upload">
                <Button
                  size="sm"
                  className="bg-indigo-600 hover:bg-indigo-500 text-white border-0 gap-2"
                  data-testid="button-upload-first"
                >
                  <Plus className="h-4 w-4" />
                  Upload Your First Book
                </Button>
              </Link>
            )}
          </div>
        ) : (
          <>
            <p className="text-slate-500 text-xs mb-4">
              Showing {filtered.length} of {books.length} books
              {search && ` matching "${search}"`}
              {category !== "All" && ` in ${category}`}
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {filtered.map((book) => (
                <BookCard key={book.id} book={book} onDeleted={loadBooks} />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
