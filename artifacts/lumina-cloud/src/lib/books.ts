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
import { db } from "@/lib/firebase";

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

const CLOUDINARY_CLOUD_NAME = "djpxkbn8x";
const CLOUDINARY_UPLOAD_PRESET = "luminacloud";
const CLOUDINARY_UPLOAD_URL = `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/raw/upload`;

export async function uploadBook(
  file: File,
  metadata: { title: string; author: string; description: string; category: string },
  userId: string,
  userName: string,
  onProgress?: (pct: number) => void
): Promise<Book> {
  // Upload directly to Cloudinary using unsigned preset
  const formData = new FormData();
  formData.append("file", file);
  formData.append("upload_preset", CLOUDINARY_UPLOAD_PRESET);

  const cloudinaryResponse = await new Promise<{ secure_url: string; public_id: string }>(
    (resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.open("POST", CLOUDINARY_UPLOAD_URL, true);

      xhr.upload.onprogress = (e) => {
        if (e.lengthComputable) {
          onProgress?.(Math.round((e.loaded / e.total) * 100));
        }
      };

      xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          try {
            const data = JSON.parse(xhr.responseText) as { secure_url: string; public_id: string };
            resolve(data);
          } catch {
            reject(new Error("Invalid response from Cloudinary"));
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
      xhr.timeout = 120000; // 2 minute timeout

      xhr.send(formData);
    }
  );

  // Save metadata + Cloudinary URL to Firestore
  const docRef = await addDoc(collection(db, "books"), {
    ...metadata,
    fileUrl: cloudinaryResponse.secure_url,
    publicId: cloudinaryResponse.public_id,
    fileSize: file.size,
    uploadedBy: userId,
    uploadedByName: userName,
    createdAt: serverTimestamp(),
  });

  return {
    id: docRef.id,
    ...metadata,
    fileUrl: cloudinaryResponse.secure_url,
    publicId: cloudinaryResponse.public_id,
    fileSize: file.size,
    uploadedBy: userId,
    uploadedByName: userName,
    createdAt: null,
  };
}

export async function getBooks(): Promise<Book[]> {
  const q = query(collection(db, "books"), orderBy("createdAt", "desc"));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as Book));
}

export async function deleteBook(book: Book): Promise<void> {
  // Delete Firestore document first
  await deleteDoc(doc(db, "books", book.id));

  // Ask API server to delete from Cloudinary (non-fatal if it fails)
  if (book.publicId) {
    try {
      await fetch("/api/cloudinary/delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ publicId: book.publicId }),
      });
    } catch {
      // Non-fatal — Firestore doc is already deleted
    }
  }
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
