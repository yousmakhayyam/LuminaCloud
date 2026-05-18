import { Link } from "wouter";
import { Cloud, BookOpen, Search, Upload, Download, Shield, Zap, Globe, ArrowRight, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";

const features = [
  {
    icon: Upload,
    title: "Upload PDFs Instantly",
    description: "Drag and drop your PDF books directly to the cloud with lightning-fast uploads.",
    color: "from-indigo-500 to-indigo-700",
  },
  {
    icon: Search,
    title: "Powerful Search",
    description: "Find any book in seconds by title, author, or category across your entire library.",
    color: "from-purple-500 to-purple-700",
  },
  {
    icon: Download,
    title: "Download Anywhere",
    description: "Access and download your books from any device, any time, anywhere in the world.",
    color: "from-cyan-500 to-cyan-700",
  },
  {
    icon: Shield,
    title: "Secure Storage",
    description: "Your library is protected with Firebase security rules and authenticated access.",
    color: "from-green-500 to-green-700",
  },
  {
    icon: Zap,
    title: "Blazing Fast",
    description: "Powered by Google's Firebase infrastructure for unmatched speed and reliability.",
    color: "from-amber-500 to-amber-700",
  },
  {
    icon: Globe,
    title: "Cloud-Native",
    description: "Built from the ground up for the cloud — no local storage, no limits.",
    color: "from-rose-500 to-rose-700",
  },
];

const stats = [
  { label: "Books Stored", value: "10K+" },
  { label: "Active Readers", value: "2.5K+" },
  { label: "Categories", value: "50+" },
  { label: "Uptime", value: "99.9%" },
];

export default function HomePage() {
  const { currentUser } = useAuth();

  return (
    <div className="min-h-screen">
      {/* Hero */}
      <section className="relative overflow-hidden pt-20 pb-32 px-4">
        {/* Background glow */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[900px] h-[600px] bg-indigo-600/10 rounded-full blur-3xl" />
          <div className="absolute top-20 left-1/4 w-[400px] h-[400px] bg-purple-600/8 rounded-full blur-3xl" />
          <div className="absolute top-10 right-1/4 w-[300px] h-[300px] bg-cyan-600/8 rounded-full blur-3xl" />
        </div>

        <div className="relative max-w-5xl mx-auto text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-indigo-500/30 bg-indigo-500/10 text-indigo-300 text-sm mb-8">
            <Star className="h-3.5 w-3.5 fill-indigo-400 text-indigo-400" />
            Modern Cloud Digital Library
          </div>

          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-extrabold text-white leading-tight mb-6">
            Your Books,{" "}
            <span className="bg-gradient-to-r from-indigo-400 via-purple-400 to-cyan-400 bg-clip-text text-transparent">
              Illuminated
            </span>
            <br />in the Cloud
          </h1>

          <p className="text-xl text-slate-400 max-w-2xl mx-auto mb-10 leading-relaxed">
            LuminaCloud is a modern digital library that lets you upload, organize, and access your PDF collection from anywhere — securely stored in the cloud.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            {currentUser ? (
              <Link href="/dashboard">
                <Button
                  size="lg"
                  className="bg-indigo-600 hover:bg-indigo-500 text-white px-8 gap-2 text-base border-0 shadow-lg shadow-indigo-600/30"
                  data-testid="button-go-to-dashboard"
                >
                  Go to Dashboard
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            ) : (
              <>
                <Link href="/signup">
                  <Button
                    size="lg"
                    className="bg-indigo-600 hover:bg-indigo-500 text-white px-8 gap-2 text-base border-0 shadow-lg shadow-indigo-600/30"
                    data-testid="button-get-started"
                  >
                    Get Started Free
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
                <Link href="/login">
                  <Button
                    size="lg"
                    variant="ghost"
                    className="text-slate-300 hover:text-white hover:bg-white/5 px-8 text-base border border-white/10"
                    data-testid="button-sign-in"
                  >
                    Sign In
                  </Button>
                </Link>
              </>
            )}
          </div>

          {/* Hero visual */}
          <div className="mt-20 relative mx-auto max-w-4xl">
            <div className="relative rounded-2xl border border-white/10 bg-[#0d1526]/80 backdrop-blur overflow-hidden shadow-2xl shadow-indigo-500/10">
              {/* Fake browser chrome */}
              <div className="flex items-center gap-2 px-4 py-3 border-b border-white/10 bg-[#0a0f1e]/60">
                <div className="w-3 h-3 rounded-full bg-red-500/60" />
                <div className="w-3 h-3 rounded-full bg-yellow-500/60" />
                <div className="w-3 h-3 rounded-full bg-green-500/60" />
                <div className="flex-1 mx-4 bg-white/5 rounded-md h-6 flex items-center px-3">
                  <span className="text-xs text-slate-600">luminacloud.app/dashboard</span>
                </div>
              </div>
              {/* Preview content */}
              <div className="p-6 grid grid-cols-2 sm:grid-cols-3 gap-3">
                {[
                  { title: "The Great Gatsby", author: "F. Scott Fitzgerald", cat: "Fiction" },
                  { title: "Clean Code", author: "Robert C. Martin", cat: "Technology" },
                  { title: "Sapiens", author: "Yuval Noah Harari", cat: "History" },
                  { title: "Dune", author: "Frank Herbert", cat: "Fiction" },
                  { title: "A Brief History of Time", author: "Stephen Hawking", cat: "Science" },
                  { title: "Steve Jobs", author: "Walter Isaacson", cat: "Biography" },
                ].map((b, i) => (
                  <div
                    key={i}
                    className="bg-[#0a0f1e]/80 border border-white/8 rounded-xl p-3 flex flex-col gap-2"
                  >
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-600/40 to-purple-600/40 flex items-center justify-center">
                      <BookOpen className="h-4 w-4 text-indigo-400" />
                    </div>
                    <div>
                      <div className="text-white text-xs font-medium line-clamp-1">{b.title}</div>
                      <div className="text-slate-500 text-xs">{b.author}</div>
                    </div>
                    <div className="text-xs px-1.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 w-fit">{b.cat}</div>
                  </div>
                ))}
              </div>
            </div>
            {/* Glow beneath */}
            <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 w-3/4 h-24 bg-indigo-600/20 blur-2xl rounded-full" />
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="border-y border-white/10 bg-[#0a0f1e]/60 py-12 px-4">
        <div className="max-w-5xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8">
          {stats.map(({ label, value }) => (
            <div key={label} className="text-center">
              <div className="text-3xl font-bold bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
                {value}
              </div>
              <div className="text-sm text-slate-500 mt-1">{label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section className="py-24 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
              Everything you need for your digital library
            </h2>
            <p className="text-slate-400 text-lg max-w-xl mx-auto">
              Built for readers, researchers, and knowledge enthusiasts who want their library in the cloud.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map(({ icon: Icon, title, description, color }) => (
              <div
                key={title}
                className="group bg-[#0d1526]/80 border border-white/10 rounded-2xl p-6 hover:border-indigo-500/30 transition-all duration-300 hover:shadow-lg hover:shadow-indigo-500/5"
              >
                <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${color} flex items-center justify-center mb-4 opacity-90 group-hover:opacity-100 transition-opacity`}>
                  <Icon className="h-5 w-5 text-white" />
                </div>
                <h3 className="text-white font-semibold mb-2">{title}</h3>
                <p className="text-slate-500 text-sm leading-relaxed">{description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 px-4">
        <div className="max-w-3xl mx-auto text-center">
          <div className="relative rounded-3xl border border-indigo-500/20 bg-gradient-to-b from-indigo-600/10 to-purple-600/5 p-12 overflow-hidden">
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(99,102,241,0.15)_0%,transparent_70%)]" />
            <div className="relative">
              <Cloud className="h-12 w-12 text-indigo-400 mx-auto mb-6" />
              <h2 className="text-3xl font-bold text-white mb-4">Start building your cloud library today</h2>
              <p className="text-slate-400 mb-8">Join thousands of readers who have moved their books to the cloud.</p>
              <Link href={currentUser ? "/upload" : "/signup"}>
                <Button
                  size="lg"
                  className="bg-indigo-600 hover:bg-indigo-500 text-white px-10 gap-2 border-0 shadow-lg shadow-indigo-600/30"
                  data-testid="button-cta"
                >
                  {currentUser ? "Upload a Book" : "Create Free Account"}
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
