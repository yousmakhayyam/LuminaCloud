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

interface CloudinarySignResponse {
  signature: string;
  timestamp: number;
  folder: string;
  api_key: string;
  cloud_name: string;
}

async function getUploadSignature(): Promise<CloudinarySignResponse> {
  const res = await fetch("/api/cloudinary/sign?folder=lumina-books");
  if (!res.ok) throw new Error("Failed to get upload signature");
  return res.json() as Promise<CloudinarySignResponse>;
}

export async function uploadBook(
  file: File,
  metadata: { title: string; author: string; description: string; category: string },
  userId: string,
  userName: string,
  onProgress?: (pct: number) => void
): Promise<Book> {
  // 1. Get a signed upload ticket from our API server
  const sig = await getUploadSignature();

  // 2. Upload directly to Cloudinary using XHR (supports progress events)
  const formData = new FormData();
  formData.append("file", file);
  formData.append("api_key", sig.api_key);
  formData.append("timestamp", String(sig.timestamp));
  formData.append("signature", sig.signature);
  formData.append("folder", sig.folder);

  const uploadUrl = `https://api.cloudinary.com/v1_1/${sig.cloud_name}/raw/upload`;

  const cloudinaryResponse = await new Promise<{ secure_url: string; public_id: string }>(
    (resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.open("POST", uploadUrl, true);

      xhr.upload.onprogress = (e) => {
        if (e.lengthComputable) {
          onProgress?.(Math.round((e.loaded / e.total) * 100));
        }
      };

      xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          resolve(JSON.parse(xhr.responseText) as { secure_url: string; public_id: string });
        } else {
          reject(new Error(`Cloudinary upload failed: ${xhr.status} ${xhr.responseText}`));
        }
      };

      xhr.onerror = () => reject(new Error("Network error during upload"));
      xhr.send(formData);
    }
  );

  // 3. Save metadata + Cloudinary URL to Firestore
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
  // Delete Firestore document
  await deleteDoc(doc(db, "books", book.id));

  // Ask API server to delete from Cloudinary
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
