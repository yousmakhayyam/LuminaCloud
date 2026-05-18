# LuminaCloud

A modern cloud-based digital library for uploading, organizing, searching, and downloading PDF books — powered by Firebase.

## Run & Operate

- `pnpm --filter @workspace/lumina-cloud run dev` — run the frontend (port 18944)
- `pnpm --filter @workspace/api-server run dev` — run the API server (port 8080)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- Frontend: React 18 + Vite + Wouter (routing) + Tailwind CSS
- Auth: Firebase Authentication (email/password)
- Database: Firebase Firestore (book metadata)
- Storage: Firebase Storage (PDF files)
- Forms: react-hook-form + Zod validation
- UI: shadcn/ui components
- API: Express 5 (health endpoint only — app is Firebase-first)

## Where things live

- `artifacts/lumina-cloud/src/` — React frontend
  - `pages/` — home, login, signup, dashboard, upload, not-found
  - `components/` — Navbar, Footer, BookCard
  - `contexts/AuthContext.tsx` — Firebase auth context
  - `lib/firebase.ts` — Firebase SDK initialization
  - `lib/books.ts` — Firestore + Storage helpers
  - `index.css` — Dark cloud theme (CSS variables)

## Architecture decisions

- Firebase-first: Auth, Firestore, and Storage are used directly from the client — no backend proxy layer needed.
- Dark-always theme: LuminaCloud is dark-mode-only. The CSS variables are set identically in both `:root` and `.dark` blocks to guarantee consistent rendering.
- Wouter for routing: lightweight React router, used in place of Next.js App Router since this is a Vite SPA.
- PDF download via Firebase Storage signed URLs: clicking "Download" opens the file URL in a new tab — no server required.
- Book ownership: each Firestore document stores `uploadedBy` (UID) so only owners can delete their own books.

## Product

- Beautiful dark homepage with hero, stats, features, and CTA sections
- Email/password sign up and sign in with Firebase Auth
- Dashboard showing all uploaded books with search (title/author) and category filters
- Upload page: drag-and-drop or browse PDF, with upload progress bar
- Book cards showing title, author, category badge, file size, date, and download/delete actions
- Fully responsive for mobile and desktop
- Navbar with auth state awareness; Footer with navigation links

## User preferences

- Dark modern cloud theme with indigo/purple accent colors
- No emojis in the UI

## Gotchas

- Firebase env vars are all `VITE_` prefixed and stored as shared env vars
- Firestore requires an index on `createdAt desc` for the `books` collection — Firebase will prompt with a link the first time you query
- Firebase Storage and Firestore security rules should be configured in the Firebase Console before going to production (default rules allow read/write for authenticated users)
- The `storageBucket` value ends in `.firebasestorage.app` (newer Firebase projects), not `.appspot.com`

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
