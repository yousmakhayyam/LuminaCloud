import { useState, useRef, useEffect } from "react";
import { useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Upload, FileText, X, CheckCircle, CloudUpload, Loader2, ArrowLeft } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { uploadBook } from "@/lib/books";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";

const CATEGORIES = ["Fiction", "Non-Fiction", "Science", "Technology", "History", "Biography", "Other"];

const schema = z.object({
  title: z.string().min(1, "Title is required").max(120),
  author: z.string().min(1, "Author is required").max(80),
  description: z.string().max(500).optional(),
  category: z.string().min(1, "Category is required"),
});
type FormData = z.infer<typeof schema>;

type UploadStage = "idle" | "uploading" | "saving" | "done" | "error";

const STAGE_LABELS: Record<UploadStage, string> = {
  idle:      "",
  uploading: "Uploading to cloud…",
  saving:    "Saving to library…",
  done:      "All done!",
  error:     "Upload failed",
};

export default function UploadPage() {
  const { currentUser } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const [file, setFile] = useState<File | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [stage, setStage] = useState<UploadStage>("idle");
  const [progress, setProgress] = useState(0);
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
      toast({ title: "Invalid file type", description: "Only PDF files are supported.", variant: "destructive" });
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (selected?.type === "application/pdf") setFile(selected);
  };

  const formatSize = (bytes: number) => {
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  async function onSubmit(data: FormData) {
    if (!file) {
      toast({ title: "No file selected", description: "Please select a PDF before uploading.", variant: "destructive" });
      return;
    }
    if (!currentUser) return;

    setStage("uploading");
    setProgress(0);

    try {
      await uploadBook(
        file,
        { title: data.title, author: data.author, description: data.description ?? "", category: data.category },
        currentUser.uid,
        currentUser.displayName ?? currentUser.email ?? "Unknown",
        (pct) => {
          setProgress(pct);
          if (pct === 100) setStage("saving");
        }
      );
      setStage("done");
      toast({
        title: "Book uploaded successfully",
        description: `"${data.title}" is now in your library.`,
      });
      setTimeout(() => setLocation("/dashboard"), 2200);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Something went wrong. Please try again.";
      setStage("error");
      toast({ title: "Upload failed", description: message, variant: "destructive" });
      setTimeout(() => setStage("idle"), 2000);
    }
  }

  if (!currentUser) return null;

  const isUploading = stage === "uploading" || stage === "saving";

  if (stage === "done") {
    return (
      <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center px-4">
        <div className="text-center">
          <div className="relative mb-5">
            <div className="w-20 h-20 rounded-full bg-green-500/15 border border-green-500/30 flex items-center justify-center mx-auto">
              <CheckCircle className="h-9 w-9 text-green-400" />
            </div>
            <div className="absolute inset-0 rounded-full bg-green-500/10 blur-xl -z-10" />
          </div>
          <h2 className="text-xl font-bold text-white mb-1">Book uploaded!</h2>
          <p className="text-slate-500 text-sm">Redirecting to your library…</p>
          <div className="mt-4 flex justify-center">
            <div className="h-1 w-32 bg-white/5 rounded-full overflow-hidden">
              <div className="h-full bg-green-500/60 rounded-full animate-[grow_2.2s_ease-in-out_forwards]" style={{ width: "100%", transformOrigin: "left", animation: "none", transition: "width 2.2s linear" }} />
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] px-4 sm:px-6 py-10">
      <div className="max-w-2xl mx-auto">

        {/* Header */}
        <div className="flex items-center gap-3 mb-8">
          <button
            onClick={() => setLocation("/dashboard")}
            className="text-slate-600 hover:text-white transition-colors p-1 rounded-lg hover:bg-white/5"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-white tracking-tight">Upload a Book</h1>
            <p className="text-slate-500 text-sm mt-0.5">Add a PDF to your cloud library</p>
          </div>
        </div>

        <div className="bg-gradient-to-b from-[#111827]/80 to-[#0d1526]/80 border border-white/8 rounded-2xl overflow-hidden shadow-xl">

          {/* Progress banner */}
          {isUploading && (
            <div className="border-b border-white/8 bg-indigo-600/8 px-6 py-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 text-indigo-400 animate-spin" />
                  <span className="text-sm text-indigo-300 font-medium">{STAGE_LABELS[stage]}</span>
                </div>
                <span className="text-xs text-indigo-400 font-mono font-semibold tabular-nums">
                  {stage === "saving" ? "Processing…" : `${progress}%`}
                </span>
              </div>
              <div className="w-full bg-white/5 rounded-full h-1.5 overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-indigo-500 via-purple-500 to-indigo-400 rounded-full transition-all duration-300 ease-out"
                  style={{ width: stage === "saving" ? "100%" : `${progress}%` }}
                />
              </div>
            </div>
          )}

          <div className="p-6 sm:p-8 space-y-6">
            {/* Drop zone */}
            <div
              onDrop={handleFileDrop}
              onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onClick={() => !file && !isUploading && fileRef.current?.click()}
              className={`relative rounded-xl border-2 border-dashed transition-all duration-200 ${
                isUploading
                  ? "border-indigo-500/30 bg-indigo-500/5 cursor-default opacity-60"
                  : file
                  ? "border-indigo-500/40 bg-indigo-500/5 cursor-default"
                  : dragOver
                  ? "border-indigo-500/70 bg-indigo-500/10 scale-[1.01]"
                  : "border-white/10 hover:border-indigo-500/40 hover:bg-white/2 cursor-pointer"
              } p-7 text-center`}
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
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-indigo-500/15 border border-indigo-500/25 flex items-center justify-center shrink-0">
                    <FileText className="h-5 w-5 text-indigo-400" />
                  </div>
                  <div className="text-left flex-1 min-w-0">
                    <div className="text-white text-sm font-medium truncate">{file.name}</div>
                    <div className="text-slate-500 text-xs">{formatSize(file.size)}</div>
                  </div>
                  {!isUploading && (
                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); setFile(null); }}
                      className="text-slate-600 hover:text-white transition-colors shrink-0"
                      data-testid="button-remove-file"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  )}
                </div>
              ) : (
                <div>
                  <CloudUpload className="h-10 w-10 text-slate-700 mx-auto mb-3" />
                  <p className="text-slate-300 text-sm font-medium mb-1">
                    Drop your PDF here, or <span className="text-indigo-400 underline underline-offset-2">browse</span>
                  </p>
                  <p className="text-slate-600 text-xs">PDF files only · No size limit</p>
                </div>
              )}
            </div>

            {/* Form */}
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="title"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-slate-400 text-xs font-medium uppercase tracking-wide">Title *</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            placeholder="Book title"
                            disabled={isUploading}
                            className="bg-[#0a0f1e]/60 border-white/8 text-white placeholder:text-slate-700 focus:border-indigo-500/50 h-9 text-sm"
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
                        <FormLabel className="text-slate-400 text-xs font-medium uppercase tracking-wide">Author *</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            placeholder="Author name"
                            disabled={isUploading}
                            className="bg-[#0a0f1e]/60 border-white/8 text-white placeholder:text-slate-700 focus:border-indigo-500/50 h-9 text-sm"
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
                      <FormLabel className="text-slate-400 text-xs font-medium uppercase tracking-wide">Category *</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value} disabled={isUploading}>
                        <FormControl>
                          <SelectTrigger
                            className="bg-[#0a0f1e]/60 border-white/8 text-white focus:border-indigo-500/50 h-9 text-sm"
                            data-testid="select-category"
                          >
                            <SelectValue placeholder="Select a category" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent className="bg-[#0d1526] border-white/10">
                          {CATEGORIES.map((cat) => (
                            <SelectItem key={cat} value={cat} className="text-white focus:bg-indigo-600/20 text-sm">
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
                      <FormLabel className="text-slate-400 text-xs font-medium uppercase tracking-wide">
                        Description <span className="text-slate-700 normal-case">(optional)</span>
                      </FormLabel>
                      <FormControl>
                        <textarea
                          {...field}
                          rows={3}
                          placeholder="Brief description of the book…"
                          disabled={isUploading}
                          className="w-full bg-[#0a0f1e]/60 border border-white/8 rounded-md px-3 py-2 text-sm text-white placeholder:text-slate-700 focus:border-indigo-500/50 focus:outline-none resize-none disabled:opacity-50"
                          data-testid="input-description"
                        />
                      </FormControl>
                      <FormMessage className="text-red-400 text-xs" />
                    </FormItem>
                  )}
                />

                <div className="flex gap-3 pt-2 border-t border-white/5">
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => setLocation("/dashboard")}
                    disabled={isUploading}
                    className="text-slate-500 hover:text-white hover:bg-white/5 border border-white/8 px-5"
                    data-testid="button-cancel"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={isUploading}
                    className="flex-1 bg-indigo-600 hover:bg-indigo-500 text-white border-0 gap-2 shadow-lg shadow-indigo-600/20"
                    data-testid="button-submit"
                  >
                    {isUploading ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        {STAGE_LABELS[stage]}
                      </>
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
    </div>
  );
}
