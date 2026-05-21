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

async function generateSignature(params: Record<string, string>, apiSecret: string): Promise<string> {
  const sortedKeys = Object.keys(params).sort();
  const signatureString = sortedKeys
    .map((key) => `${key}=${params[key]}`)
    .join("&") + apiSecret;

  const msgBuffer = new TextEncoder().encode(signatureString);
  const hashBuffer = await crypto.subtle.digest("SHA-1", msgBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

export async function uploadBook(
  file: File,
  metadata: { title: string; author: string; description: string; category: string },
  userId: string,
  userName: string,
  onProgress?: (pct: number) => void
): Promise<Book> {
  const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
  const apiKey = import.meta.env.VITE_CLOUDINARY_API_KEY;
  const apiSecret = import.meta.env.VITE_CLOUDINARY_API_SECRET;

  if (!cloudName || !apiKey || !apiSecret) {
    throw new Error("Cloudinary environment variables (VITE_CLOUDINARY_CLOUD_NAME, VITE_CLOUDINARY_API_KEY, VITE_CLOUDINARY_API_SECRET) must be set.");
  }

  const timestamp = Math.round(Date.now() / 1000).toString();
  const folder = "lumina-books";
  const signature = await generateSignature({ folder, timestamp }, apiSecret);

  const formData = new FormData();
  formData.append("file", file);
  formData.append("folder", folder);
  formData.append("timestamp", timestamp);
  formData.append("api_key", apiKey);
  formData.append("signature", signature);

  const response = await new Promise<{ secure_url: string; public_id: string }>(
    (resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.open("POST", `https://api.cloudinary.com/v1_1/${cloudName}/raw/upload`, true);

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
            reject(new Error("Invalid response from Cloudinary server"));
          }
        } else {
          let message = `Upload failed (${xhr.status})`;
          try {
            const err = JSON.parse(xhr.responseText) as { error?: { message?: string } };
            if (err?.error?.message) message = err.error.message;
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
      const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
      const apiKey = import.meta.env.VITE_CLOUDINARY_API_KEY;
      const apiSecret = import.meta.env.VITE_CLOUDINARY_API_SECRET;

      if (cloudName && apiKey && apiSecret) {
        const timestamp = Math.round(Date.now() / 1000).toString();
        const signature = await generateSignature(
          { public_id: book.publicId, resource_type: "raw", timestamp },
          apiSecret
        );

        const formData = new FormData();
        formData.append("public_id", book.publicId);
        formData.append("resource_type", "raw");
        formData.append("timestamp", timestamp);
        formData.append("api_key", apiKey);
        formData.append("signature", signature);

        await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/destroy`, {
          method: "POST",
          body: formData,
        });
      }
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
