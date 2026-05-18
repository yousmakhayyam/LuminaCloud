import { useEffect, useState, useMemo } from "react";
import { Link, useLocation } from "wouter";
import { Search, Plus, BookOpen, Library, Upload, RefreshCw, X, CloudOff } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { getBooks, Book } from "@/lib/books";
import BookCard from "@/components/BookCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";

const CATEGORIES = ["All", "Fiction", "Non-Fiction", "Science", "Technology", "History", "Biography", "Other"];

function SkeletonCard() {
  return (
    <div className="bg-gradient-to-b from-[#111827]/90 to-[#0d1526]/90 border border-white/8 rounded-2xl p-5 animate-pulse space-y-3">
      <div className="flex justify-between">
        <div className="h-5 w-20 bg-white/5 rounded-full" />
        <div className="h-4 w-10 bg-white/5 rounded" />
      </div>
      <div className="h-11 w-11 bg-white/5 rounded-xl" />
      <div className="space-y-1.5">
        <div className="h-3 w-3/4 bg-white/5 rounded" />
        <div className="h-3 w-1/2 bg-white/5 rounded" />
      </div>
      <div className="h-3 w-full bg-white/5 rounded" />
      <div className="h-3 w-2/3 bg-white/5 rounded" />
      <div className="h-8 w-full bg-white/5 rounded-lg mt-2" />
    </div>
  );
}

export default function DashboardPage() {
  const { currentUser } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");

  useEffect(() => {
    if (!currentUser) setLocation("/login");
  }, [currentUser, setLocation]);

  const loadBooks = async () => {
    setLoading(true);
    try {
      const data = await getBooks();
      setBooks(data);
    } catch {
      toast({ title: "Failed to load library", description: "Check your connection and try again.", variant: "destructive" });
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
      const matchesSearch = !q || b.title.toLowerCase().includes(q) || b.author.toLowerCase().includes(q);
      const matchesCat = category === "All" || b.category === category;
      return matchesSearch && matchesCat;
    });
  }, [books, search, category]);

  const myBooks = books.filter((b) => b.uploadedBy === currentUser?.uid);
  const uniqueCategories = [...new Set(books.map((b) => b.category))].length;

  if (!currentUser) return null;

  const firstName = currentUser.displayName?.split(" ")[0] ?? "Reader";

  return (
    <div className="min-h-[calc(100vh-4rem)] px-4 sm:px-6 py-8">
      <div className="max-w-7xl mx-auto space-y-6">

        {/* Page header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-white tracking-tight">
              Good day, {firstName}
            </h1>
            <p className="text-slate-500 text-sm mt-0.5">
              {loading ? "Loading your library…" : `${books.length} ${books.length === 1 ? "book" : "books"} in your library`}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={loadBooks}
              disabled={loading}
              className="text-slate-500 hover:text-white hover:bg-white/5 gap-1.5 border border-white/8"
              data-testid="button-refresh"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
              Refresh
            </Button>
            <Link href="/upload">
              <Button
                size="sm"
                className="bg-indigo-600 hover:bg-indigo-500 text-white border-0 gap-2 shadow-lg shadow-indigo-600/25 px-4"
                data-testid="button-upload"
              >
                <Plus className="h-4 w-4" />
                Upload Book
              </Button>
            </Link>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: "Total Books", value: books.length,     icon: Library,  gradient: "from-indigo-600/20 to-indigo-800/10", border: "border-indigo-500/15", text: "text-indigo-400" },
            { label: "My Uploads",  value: myBooks.length,   icon: Upload,   gradient: "from-purple-600/20 to-purple-800/10", border: "border-purple-500/15", text: "text-purple-400" },
            { label: "Categories",  value: uniqueCategories, icon: BookOpen, gradient: "from-cyan-600/20 to-cyan-800/10",     border: "border-cyan-500/15",   text: "text-cyan-400"   },
          ].map(({ label, value, icon: Icon, gradient, border, text }) => (
            <div
              key={label}
              className={`bg-gradient-to-br ${gradient} border ${border} rounded-xl p-4 flex items-center gap-3`}
            >
              <div className="w-9 h-9 rounded-lg bg-white/5 flex items-center justify-center shrink-0">
                <Icon className={`h-4.5 w-4.5 ${text}`} style={{ width: "18px", height: "18px" }} />
              </div>
              <div className="min-w-0">
                <div className="text-xl font-bold text-white leading-none">{loading ? "—" : value}</div>
                <div className="text-xs text-slate-500 mt-0.5 truncate">{label}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Search & category filters */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-600 pointer-events-none" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by title or author…"
              className="pl-9 pr-9 bg-[#0d1526]/80 border-white/8 text-white placeholder:text-slate-700 focus:border-indigo-500/50 focus:ring-0 h-9"
              data-testid="input-search"
            />
            {search && (
              <button
                onClick={() => setSearch("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-600 hover:text-white transition-colors"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
          <div className="flex gap-1.5 flex-wrap">
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                onClick={() => setCategory(cat)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-150 ${
                  category === cat
                    ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/20"
                    : "bg-[#0d1526]/80 border border-white/8 text-slate-500 hover:text-white hover:border-white/20"
                }`}
                data-testid={`filter-${cat.toLowerCase().replace(/\s/g, "-")}`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Results label */}
        {!loading && books.length > 0 && (
          <p className="text-slate-600 text-xs -mb-2">
            {filtered.length === books.length
              ? `${books.length} ${books.length === 1 ? "book" : "books"}`
              : `${filtered.length} of ${books.length} books`}
            {search && ` matching "${search}"`}
            {category !== "All" && ` in ${category}`}
          </p>
        )}

        {/* Grid */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {Array.from({ length: 8 }).map((_, i) => <SkeletonCard key={i} />)}
          </div>
        ) : filtered.length === 0 ? (
          <EmptyState hasBooks={books.length > 0} search={search} category={category} />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filtered.map((book) => (
              <BookCard key={book.id} book={book} onDeleted={loadBooks} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function EmptyState({ hasBooks, search, category }: { hasBooks: boolean; search: string; category: string }) {
  const isFiltered = hasBooks && (search || category !== "All");

  return (
    <div className="flex flex-col items-center justify-center py-20 px-4 text-center">
      <div className="relative mb-6">
        <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-[#0d1526] to-[#111827] border border-white/8 flex items-center justify-center shadow-xl">
          {isFiltered
            ? <Search className="h-9 w-9 text-slate-700" />
            : <CloudOff className="h-9 w-9 text-slate-700" />
          }
        </div>
        <div className="absolute -inset-3 rounded-3xl bg-indigo-600/5 blur-xl -z-10" />
      </div>

      <h3 className="text-white font-semibold text-lg mb-2">
        {isFiltered ? "No matching books" : "Your library is empty"}
      </h3>
      <p className="text-slate-500 text-sm max-w-xs leading-relaxed mb-7">
        {isFiltered
          ? "Try adjusting your search terms or selecting a different category."
          : "Upload your first PDF book and it will appear here, ready to download anytime."}
      </p>

      {!isFiltered && (
        <Link href="/upload">
          <Button
            className="bg-indigo-600 hover:bg-indigo-500 text-white border-0 gap-2 shadow-lg shadow-indigo-600/25 px-6"
            data-testid="button-upload-first"
          >
            <Plus className="h-4 w-4" />
            Upload Your First Book
          </Button>
        </Link>
      )}
    </div>
  );
}
