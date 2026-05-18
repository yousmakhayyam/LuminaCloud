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
import {
  ref,
  uploadBytesResumable,
  getDownloadURL,
  deleteObject,
} from "firebase/storage";
import { db, storage } from "@/lib/firebase";

export interface Book {
  id: string;
  title: string;
  author: string;
  description: string;
  fileUrl: string;
  storagePath: string;
  fileSize: number;
  uploadedBy: string;
  uploadedByName: string;
  createdAt: Timestamp | null;
  category: string;
}

export async function uploadBook(
  file: File,
  metadata: { title: string; author: string; description: string; category: string },
  userId: string,
  userName: string,
  onProgress?: (pct: number) => void
): Promise<Book> {
  const storagePath = `books/${userId}/${Date.now()}_${file.name}`;
  const storageRef = ref(storage, storagePath);
  const uploadTask = uploadBytesResumable(storageRef, file);

  await new Promise<void>((resolve, reject) => {
    uploadTask.on(
      "state_changed",
      (snap) => {
        const pct = Math.round((snap.bytesTransferred / snap.totalBytes) * 100);
        onProgress?.(pct);
      },
      reject,
      () => resolve()
    );
  });

  const fileUrl = await getDownloadURL(uploadTask.snapshot.ref);

  const docRef = await addDoc(collection(db, "books"), {
    ...metadata,
    fileUrl,
    storagePath,
    fileSize: file.size,
    uploadedBy: userId,
    uploadedByName: userName,
    createdAt: serverTimestamp(),
  });

  return {
    id: docRef.id,
    ...metadata,
    fileUrl,
    storagePath,
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
  await deleteDoc(doc(db, "books", book.id));
  try {
    await deleteObject(ref(storage, book.storagePath));
  } catch {
    // ignore storage errors
  }
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
