import { Book, formatFileSize, deleteBook } from "@/lib/books";
import { Download, Trash2, BookOpen, User, Calendar, Tag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";

interface BookCardProps {
  book: Book;
  onDeleted?: () => void;
}

const CATEGORY_COLORS: Record<string, string> = {
  Fiction: "bg-purple-500/20 text-purple-300 border-purple-500/30",
  "Non-Fiction": "bg-blue-500/20 text-blue-300 border-blue-500/30",
  Science: "bg-cyan-500/20 text-cyan-300 border-cyan-500/30",
  Technology: "bg-indigo-500/20 text-indigo-300 border-indigo-500/30",
  History: "bg-amber-500/20 text-amber-300 border-amber-500/30",
  Biography: "bg-green-500/20 text-green-300 border-green-500/30",
  Other: "bg-slate-500/20 text-slate-300 border-slate-500/30",
};

export default function BookCard({ book, onDeleted }: BookCardProps) {
  const { currentUser } = useAuth();
  const { toast } = useToast();
  const [deleting, setDeleting] = useState(false);

  const isOwner = currentUser?.uid === book.uploadedBy;
  const categoryClass = CATEGORY_COLORS[book.category] ?? CATEGORY_COLORS["Other"];

  const formatDate = (ts: Book["createdAt"]) => {
    if (!ts) return "Just now";
    return ts.toDate().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  };

  const handleDownload = () => {
    window.open(book.fileUrl, "_blank");
  };

  const handleDelete = async () => {
    if (!confirm(`Delete "${book.title}"? This cannot be undone.`)) return;
    setDeleting(true);
    try {
      await deleteBook(book);
      toast({ title: "Book deleted", description: `"${book.title}" has been removed.` });
      onDeleted?.();
    } catch {
      toast({ title: "Error", description: "Failed to delete the book.", variant: "destructive" });
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div
      className="group relative bg-[#0d1526]/80 border border-white/10 rounded-2xl p-5 flex flex-col gap-3 hover:border-indigo-500/40 hover:bg-[#0d1526] transition-all duration-300 hover:shadow-lg hover:shadow-indigo-500/10"
      data-testid={`card-book-${book.id}`}
    >
      {/* Category badge */}
      <div className="flex items-start justify-between gap-2">
        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border ${categoryClass}`}>
          <Tag className="h-3 w-3" />
          {book.category}
        </span>
        <span className="text-xs text-slate-600">{formatFileSize(book.fileSize)}</span>
      </div>

      {/* Book icon */}
      <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-600/30 to-purple-600/30 border border-indigo-500/20">
        <BookOpen className="h-6 w-6 text-indigo-400" />
      </div>

      {/* Title & author */}
      <div className="flex-1">
        <h3
          className="text-white font-semibold text-sm leading-snug line-clamp-2 mb-1"
          data-testid={`text-book-title-${book.id}`}
        >
          {book.title}
        </h3>
        <p className="text-slate-400 text-xs flex items-center gap-1">
          <User className="h-3 w-3 shrink-0" />
          {book.author}
        </p>
      </div>

      {/* Description */}
      {book.description && (
        <p className="text-slate-500 text-xs line-clamp-2 leading-relaxed">{book.description}</p>
      )}

      {/* Meta */}
      <div className="flex items-center justify-between text-xs text-slate-600">
        <span className="flex items-center gap-1">
          <Calendar className="h-3 w-3" />
          {formatDate(book.createdAt)}
        </span>
        <span className="truncate max-w-[100px]">{book.uploadedByName}</span>
      </div>

      {/* Actions */}
      <div className="flex gap-2 pt-1">
        <Button
          size="sm"
          onClick={handleDownload}
          className="flex-1 bg-indigo-600/20 hover:bg-indigo-600/40 text-indigo-300 border border-indigo-500/30 hover:border-indigo-500/60 text-xs gap-1.5"
          variant="ghost"
          data-testid={`button-download-${book.id}`}
        >
          <Download className="h-3.5 w-3.5" />
          Download
        </Button>
        {isOwner && (
          <Button
            size="sm"
            variant="ghost"
            onClick={handleDelete}
            disabled={deleting}
            className="bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 hover:border-red-500/40 px-2.5"
            data-testid={`button-delete-${book.id}`}
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        )}
      </div>
    </div>
  );
}
