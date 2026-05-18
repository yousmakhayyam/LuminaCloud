import { useState, useRef } from "react";
import { useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Upload, FileText, X, CheckCircle, CloudUpload } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { uploadBook } from "@/lib/books";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useEffect } from "react";

const CATEGORIES = ["Fiction", "Non-Fiction", "Science", "Technology", "History", "Biography", "Other"];

const schema = z.object({
  title: z.string().min(1, "Title is required").max(120),
  author: z.string().min(1, "Author is required").max(80),
  description: z.string().max(500).optional(),
  category: z.string().min(1, "Category is required"),
});
type FormData = z.infer<typeof schema>;

export default function UploadPage() {
  const { currentUser } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const [file, setFile] = useState<File | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [done, setDone] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!currentUser) setLocation("/login");
  }, [currentUser, setLocation]);

  const form = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { title: "", author: "", description: "", category: "" },
  });

  const handleFileDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const dropped = e.dataTransfer.files[0];
    if (dropped?.type === "application/pdf") {
      setFile(dropped);
    } else {
      toast({ title: "Invalid file", description: "Please upload a PDF file.", variant: "destructive" });
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (selected?.type === "application/pdf") {
      setFile(selected);
    }
  };

  const formatSize = (bytes: number) => {
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  async function onSubmit(data: FormData) {
    if (!file) {
      toast({ title: "No file selected", description: "Please select a PDF to upload.", variant: "destructive" });
      return;
    }
    if (!currentUser) return;

    setUploading(true);
    setProgress(0);
    try {
      await uploadBook(
        file,
        {
          title: data.title,
          author: data.author,
          description: data.description ?? "",
          category: data.category,
        },
        currentUser.uid,
        currentUser.displayName ?? currentUser.email ?? "Unknown",
        setProgress
      );
      setDone(true);
      toast({ title: "Upload complete!", description: `"${data.title}" has been added to the library.` });
      setTimeout(() => setLocation("/dashboard"), 2000);
    } catch {
      toast({ title: "Upload failed", description: "Something went wrong. Please try again.", variant: "destructive" });
      setUploading(false);
    }
  }

  if (!currentUser) return null;

  if (done) {
    return (
      <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center px-4">
        <div className="text-center">
          <div className="w-16 h-16 rounded-full bg-green-500/20 border border-green-500/30 flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="h-8 w-8 text-green-400" />
          </div>
          <h2 className="text-xl font-bold text-white mb-2">Book uploaded!</h2>
          <p className="text-slate-400 text-sm">Redirecting to your dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] px-4 py-10">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-white mb-1">Upload a Book</h1>
          <p className="text-slate-400 text-sm">Add a PDF book to your cloud library</p>
        </div>

        <div className="bg-[#0d1526]/80 border border-white/10 rounded-2xl p-6 sm:p-8">
          {/* Drop zone */}
          <div
            onDrop={handleFileDrop}
            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onClick={() => !file && fileRef.current?.click()}
            className={`relative rounded-xl border-2 border-dashed transition-all cursor-pointer mb-6 ${
              file
                ? "border-indigo-500/40 bg-indigo-500/5 cursor-default"
                : dragOver
                ? "border-indigo-500/70 bg-indigo-500/10"
                : "border-white/10 hover:border-indigo-500/40 hover:bg-indigo-500/5"
            } p-8 text-center`}
            data-testid="dropzone-pdf"
          >
            <input
              ref={fileRef}
              type="file"
              accept="application/pdf"
              className="hidden"
              onChange={handleFileSelect}
              data-testid="input-file"
            />
            {file ? (
              <div className="flex items-center gap-3 justify-center">
                <div className="w-10 h-10 rounded-lg bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center shrink-0">
                  <FileText className="h-5 w-5 text-indigo-400" />
                </div>
                <div className="text-left">
                  <div className="text-white text-sm font-medium truncate max-w-[260px]">{file.name}</div>
                  <div className="text-slate-500 text-xs">{formatSize(file.size)}</div>
                </div>
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); setFile(null); }}
                  className="ml-auto text-slate-500 hover:text-white"
                  data-testid="button-remove-file"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ) : (
              <>
                <CloudUpload className="h-10 w-10 text-slate-600 mx-auto mb-3" />
                <p className="text-white text-sm font-medium mb-1">Drop your PDF here, or click to browse</p>
                <p className="text-slate-500 text-xs">Supports PDF files only</p>
              </>
            )}
          </div>

          {/* Upload progress */}
          {uploading && (
            <div className="mb-6">
              <div className="flex justify-between items-center mb-1.5">
                <span className="text-slate-400 text-xs">Uploading...</span>
                <span className="text-indigo-400 text-xs font-medium">{progress}%</span>
              </div>
              <div className="w-full bg-white/5 rounded-full h-1.5 overflow-hidden">
                <div
                  className="bg-gradient-to-r from-indigo-500 to-purple-500 h-full rounded-full transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          )}

          {/* Form */}
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-slate-300 text-sm">Title *</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          placeholder="Book title"
                          className="bg-[#0a0f1e]/80 border-white/10 text-white placeholder:text-slate-600 focus:border-indigo-500/60"
                          data-testid="input-title"
                        />
                      </FormControl>
                      <FormMessage className="text-red-400 text-xs" />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="author"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-slate-300 text-sm">Author *</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          placeholder="Author name"
                          className="bg-[#0a0f1e]/80 border-white/10 text-white placeholder:text-slate-600 focus:border-indigo-500/60"
                          data-testid="input-author"
                        />
                      </FormControl>
                      <FormMessage className="text-red-400 text-xs" />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="category"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-slate-300 text-sm">Category *</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger
                          className="bg-[#0a0f1e]/80 border-white/10 text-white focus:border-indigo-500/60"
                          data-testid="select-category"
                        >
                          <SelectValue placeholder="Select a category" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent className="bg-[#0d1526] border-white/10">
                        {CATEGORIES.map((cat) => (
                          <SelectItem key={cat} value={cat} className="text-white focus:bg-indigo-600/20">
                            {cat}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage className="text-red-400 text-xs" />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-slate-300 text-sm">Description <span className="text-slate-600">(optional)</span></FormLabel>
                    <FormControl>
                      <textarea
                        {...field}
                        rows={3}
                        placeholder="Brief description of the book..."
                        className="w-full bg-[#0a0f1e]/80 border border-white/10 rounded-md px-3 py-2 text-sm text-white placeholder:text-slate-600 focus:border-indigo-500/60 focus:outline-none resize-none"
                        data-testid="input-description"
                      />
                    </FormControl>
                    <FormMessage className="text-red-400 text-xs" />
                  </FormItem>
                )}
              />

              <div className="flex gap-3 pt-2">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setLocation("/dashboard")}
                  className="flex-1 text-slate-400 hover:text-white hover:bg-white/5 border border-white/10"
                  data-testid="button-cancel"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={uploading}
                  className="flex-1 bg-indigo-600 hover:bg-indigo-500 text-white border-0 gap-2 shadow-md shadow-indigo-600/20"
                  data-testid="button-submit"
                >
                  {uploading ? (
                    <span className="flex items-center gap-2">
                      <span className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Uploading...
                    </span>
                  ) : (
                    <>
                      <Upload className="h-4 w-4" />
                      Upload Book
                    </>
                  )}
                </Button>
              </div>
            </form>
          </Form>
        </div>
      </div>
    </div>
  );
}
