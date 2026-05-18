import { Book, formatFileSize, deleteBook } from "@/lib/books";
import { Download, Trash2, BookOpen, User, Calendar, Tag, AlertTriangle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";

interface BookCardProps {
  book: Book;
  onDeleted?: () => void;
}

const CATEGORY_STYLES: Record<string, { badge: string; icon: string; glow: string }> = {
  Fiction:       { badge: "bg-purple-500/15 text-purple-300 border-purple-500/25", icon: "from-purple-600/40 to-purple-800/40", glow: "hover:shadow-purple-500/8" },
  "Non-Fiction": { badge: "bg-blue-500/15 text-blue-300 border-blue-500/25",       icon: "from-blue-600/40 to-blue-800/40",   glow: "hover:shadow-blue-500/8"   },
  Science:       { badge: "bg-cyan-500/15 text-cyan-300 border-cyan-500/25",        icon: "from-cyan-600/40 to-cyan-800/40",   glow: "hover:shadow-cyan-500/8"   },
  Technology:    { badge: "bg-indigo-500/15 text-indigo-300 border-indigo-500/25",  icon: "from-indigo-600/40 to-indigo-800/40", glow: "hover:shadow-indigo-500/8"},
  History:       { badge: "bg-amber-500/15 text-amber-300 border-amber-500/25",     icon: "from-amber-600/40 to-amber-800/40", glow: "hover:shadow-amber-500/8"  },
  Biography:     { badge: "bg-green-500/15 text-green-300 border-green-500/25",     icon: "from-green-600/40 to-green-800/40", glow: "hover:shadow-green-500/8"  },
  Other:         { badge: "bg-slate-500/15 text-slate-300 border-slate-500/25",     icon: "from-slate-600/40 to-slate-800/40", glow: "hover:shadow-slate-500/8"  },
};

export default function BookCard({ book, onDeleted }: BookCardProps) {
  const { currentUser } = useAuth();
  const { toast } = useToast();
  const [deleting, setDeleting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const isOwner = currentUser?.uid === book.uploadedBy;
  const style = CATEGORY_STYLES[book.category] ?? CATEGORY_STYLES["Other"];

  const formatDate = (ts: Book["createdAt"]) => {
    if (!ts) return "Just now";
    return ts.toDate().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  };

  const handleDownload = () => {
    window.open(book.fileUrl, "_blank");
  };

  const handleDeleteConfirm = async () => {
    setDeleting(true);
    try {
      await deleteBook(book);
      toast({
        title: "Book deleted",
        description: `"${book.title}" has been removed from the library.`,
      });
      onDeleted?.();
    } catch {
      toast({
        title: "Delete failed",
        description: "Could not delete the book. Please try again.",
        variant: "destructive",
      });
      setDeleting(false);
      setConfirmDelete(false);
    }
  };

  return (
    <div
      className={`group relative bg-gradient-to-b from-[#111827]/90 to-[#0d1526]/90 border rounded-2xl flex flex-col overflow-hidden transition-all duration-300 shadow-lg hover:shadow-xl ${style.glow} ${
        confirmDelete
          ? "border-red-500/40 shadow-red-500/10"
          : "border-white/8 hover:border-indigo-500/35 hover:shadow-indigo-500/10"
      }`}
      data-testid={`card-book-${book.id}`}
    >
      {/* Top accent line */}
      <div className={`h-px w-full bg-gradient-to-r from-transparent via-indigo-500/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300`} />

      <div className="p-5 flex flex-col gap-3 flex-1">
        {/* Category + size row */}
        <div className="flex items-center justify-between gap-2">
          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border ${style.badge}`}>
            <Tag className="h-3 w-3" />
            {book.category}
          </span>
          <span className="text-xs text-slate-600 font-mono">{formatFileSize(book.fileSize)}</span>
        </div>

        {/* Book icon */}
        <div className={`flex items-center justify-center w-11 h-11 rounded-xl bg-gradient-to-br ${style.icon} border border-white/8 shadow-inner`}>
          <BookOpen className="h-5 w-5 text-white/70" />
        </div>

        {/* Title & author */}
        <div className="flex-1 min-h-0">
          <h3
            className="text-white font-semibold text-sm leading-snug line-clamp-2 mb-1.5 group-hover:text-indigo-100 transition-colors"
            data-testid={`text-book-title-${book.id}`}
          >
            {book.title}
          </h3>
          <p className="text-slate-500 text-xs flex items-center gap-1">
            <User className="h-3 w-3 shrink-0 text-slate-600" />
            {book.author}
          </p>
        </div>

        {/* Description */}
        {book.description && (
          <p className="text-slate-600 text-xs line-clamp-2 leading-relaxed border-t border-white/5 pt-2">
            {book.description}
          </p>
        )}

        {/* Date */}
        <div className="flex items-center justify-between text-xs text-slate-700">
          <span className="flex items-center gap-1">
            <Calendar className="h-3 w-3" />
            {formatDate(book.createdAt)}
          </span>
          <span className="truncate max-w-[90px] text-slate-700">{book.uploadedByName}</span>
        </div>
      </div>

      {/* Actions footer */}
      <div className="px-5 pb-5">
        {confirmDelete ? (
          /* Inline delete confirmation */
          <div className="rounded-xl border border-red-500/25 bg-red-500/8 p-3">
            <div className="flex items-start gap-2 mb-3">
              <AlertTriangle className="h-4 w-4 text-red-400 shrink-0 mt-0.5" />
              <p className="text-red-300 text-xs leading-relaxed">
                Delete <span className="font-semibold">"{book.title}"</span>? This cannot be undone.
              </p>
            </div>
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setConfirmDelete(false)}
                disabled={deleting}
                className="flex-1 text-xs text-slate-400 hover:text-white hover:bg-white/5 border border-white/10 h-7"
                data-testid={`button-cancel-delete-${book.id}`}
              >
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={handleDeleteConfirm}
                disabled={deleting}
                className="flex-1 text-xs bg-red-600/80 hover:bg-red-600 text-white border-0 h-7 gap-1"
                data-testid={`button-confirm-delete-${book.id}`}
              >
                {deleting ? (
                  <Loader2 className="h-3 w-3 animate-spin" />
                ) : (
                  <Trash2 className="h-3 w-3" />
                )}
                {deleting ? "Deleting…" : "Delete"}
              </Button>
            </div>
          </div>
        ) : (
          <div className="flex gap-2">
            <Button
              size="sm"
              onClick={handleDownload}
              variant="ghost"
              className="flex-1 bg-indigo-600/10 hover:bg-indigo-600/25 text-indigo-400 hover:text-indigo-300 border border-indigo-500/20 hover:border-indigo-500/50 text-xs gap-1.5 transition-all duration-200"
              data-testid={`button-download-${book.id}`}
            >
              <Download className="h-3.5 w-3.5" />
              Download
            </Button>
            {isOwner && (
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setConfirmDelete(true)}
                className="bg-transparent hover:bg-red-500/10 text-slate-600 hover:text-red-400 border border-white/8 hover:border-red-500/25 px-2.5 transition-all duration-200"
                data-testid={`button-delete-${book.id}`}
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
