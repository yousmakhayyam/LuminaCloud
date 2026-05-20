import {
  collection,
  addDoc,
  getDocs,
  deleteDoc,
  doc,
  query,
  orderBy,
  serverTimestamp,
  Timestamp,
} from "firebase/firestore";
import { db, firebaseConfigured } from "@/lib/firebase";

export interface Book {
  id: string;
  title: string;
  author: string;
  description: string;
  fileUrl: string;
  publicId: string;
  fileSize: number;
  uploadedBy: string;
  uploadedByName: string;
  createdAt: Timestamp | null;
  category: string;
}

const BOOKS_STORAGE_KEY = "lumina-books";

function loadLocalBooks(): Book[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(window.localStorage.getItem(BOOKS_STORAGE_KEY) ?? "[]");
  } catch {
    return [];
  }
}

function saveLocalBooks(books: Book[]) {
  window.localStorage.setItem(BOOKS_STORAGE_KEY, JSON.stringify(books));
}

export async function uploadBook(
  file: File,
  metadata: { title: string; author: string; description: string; category: string },
  userId: string,
  userName: string,
  onProgress?: (pct: number) => void
): Promise<Book> {
  // Build multipart form — file goes to our API server which uses the
  // Cloudinary SDK with chunked streaming, bypassing the 10 MB browser limit.
  const formData = new FormData();
  formData.append("file", file);

  const response = await new Promise<{ secure_url: string; public_id: string }>(
    (resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.open("POST", "/api/cloudinary/upload", true);

      xhr.upload.onprogress = (e) => {
        if (e.lengthComputable) {
          onProgress?.(Math.round((e.loaded / e.total) * 100));
        }
      };

      xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          try {
            resolve(JSON.parse(xhr.responseText) as { secure_url: string; public_id: string });
          } catch {
            reject(new Error("Invalid response from upload server"));
          }
        } else {
          let message = `Upload failed (${xhr.status})`;
          try {
            const err = JSON.parse(xhr.responseText) as { error?: string };
            if (err?.error) message = err.error;
          } catch {
            // keep default message
          }
          reject(new Error(message));
        }
      };

      xhr.onerror = () => reject(new Error("Network error — check your connection and try again"));
      xhr.ontimeout = () => reject(new Error("Upload timed out — please try again"));
      xhr.timeout = 300_000; // 5 minutes for large files

      xhr.send(formData);
    }
  );

  const book: Book = {
    id:
      typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
        ? crypto.randomUUID()
        : `local-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`,
    ...metadata,
    fileUrl: response.secure_url,
    publicId: response.public_id,
    fileSize: file.size,
    uploadedBy: userId,
    uploadedByName: userName,
    createdAt: null,
  };

  if (firebaseConfigured) {
    const docRef = await addDoc(collection(db, "books"), {
      ...metadata,
      fileUrl: response.secure_url,
      publicId: response.public_id,
      fileSize: file.size,
      uploadedBy: userId,
      uploadedByName: userName,
      createdAt: serverTimestamp(),
    });

    return {
      ...book,
      id: docRef.id,
    };
  }

  saveLocalBooks([book, ...loadLocalBooks()]);
  return book;
}

export async function getBooks(): Promise<Book[]> {
  if (firebaseConfigured) {
    const q = query(collection(db, "books"), orderBy("createdAt", "desc"));
    const snap = await getDocs(q);
    return snap.docs.map((d) => ({ id: d.id, ...d.data() } as Book));
  }

  return loadLocalBooks();
}

export async function deleteBook(book: Book): Promise<void> {
  if (firebaseConfigured) {
    await deleteDoc(doc(db, "books", book.id));
  } else {
    saveLocalBooks(loadLocalBooks().filter((b) => b.id !== book.id));
  }

  if (book.publicId) {
    try {
      await fetch("/api/cloudinary/delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ publicId: book.publicId }),
      });
    } catch {
      // Non-fatal — Cloudinary deletion is best effort
    }
  }
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
