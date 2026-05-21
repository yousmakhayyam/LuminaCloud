import { createContext, useContext, useEffect, useState } from "react";
import {
  User,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updateProfile,
} from "firebase/auth";
import { auth, firebaseConfigured } from "@/lib/firebase";

interface AuthContextType {
  currentUser: User | null;
  loading: boolean;
  signup: (email: string, password: string, displayName: string) => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

interface LocalUser {
  uid: string;
  email: string;
  password: string;
  displayName: string | null;
}

function getLocalUsers(): LocalUser[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(window.localStorage.getItem("lumina-users") ?? "[]") as LocalUser[];
  } catch {
    return [];
  }
}

function saveLocalUsers(users: LocalUser[]) {
  window.localStorage.setItem("lumina-users", JSON.stringify(users));
}

function getStoredCurrentUserId() {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem("lumina-current-user");
}

function setStoredCurrentUserId(uid: string | null) {
  if (typeof window === "undefined") return;
  if (uid) {
    window.localStorage.setItem("lumina-current-user", uid);
  } else {
    window.localStorage.removeItem("lumina-current-user");
  }
}

function buildLocalUser(email: string, displayName: string | null, uid: string) {
  return { email, displayName, uid } as User;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  async function signup(email: string, password: string, displayName: string) {
    if (firebaseConfigured) {
      if (!auth) throw new Error("Firebase auth not initialized");
      const cred = await createUserWithEmailAndPassword(auth, email, password);
      await updateProfile(cred.user, { displayName });
      return;
    }

    const users = getLocalUsers();
    if (users.some((user) => user.email === email)) {
      throw new Error("email-already-in-use");
    }

    const uid = typeof crypto !== "undefined" && typeof crypto.randomUUID === "function" ? crypto.randomUUID() : `${Date.now()}-${Math.random()}`;
    const newUser = { uid, email, password, displayName, };
    saveLocalUsers([...users, newUser]);
    setStoredCurrentUserId(uid);
    setCurrentUser(buildLocalUser(email, displayName, uid));
  }

  async function login(email: string, password: string) {
    if (firebaseConfigured) {
      if (!auth) throw new Error("Firebase auth not initialized");
      await signInWithEmailAndPassword(auth, email, password);
      return;
    }

    const users = getLocalUsers();
    const match = users.find((user) => user.email === email && user.password === password);
    if (!match) {
      throw new Error("user-not-found");
    }

    setStoredCurrentUserId(match.uid);
    setCurrentUser(buildLocalUser(match.email, match.displayName, match.uid));
  }

  async function logout() {
    if (firebaseConfigured) {
      if (!auth) throw new Error("Firebase auth not initialized");
      await signOut(auth);
      return;
    }

    setStoredCurrentUserId(null);
    setCurrentUser(null);
  }

  useEffect(() => {
    if (!firebaseConfigured) {
      const savedId = getStoredCurrentUserId();
      if (savedId) {
        const users = getLocalUsers();
        const match = users.find((user) => user.uid === savedId);
        if (match) {
          setCurrentUser(buildLocalUser(match.email, match.displayName, match.uid));
        }
      }
      setLoading(false);
      return;
    }

    if (!auth) {
      setLoading(false);
      return;
    }

    const unsub = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      setLoading(false);
    });
    return unsub;
  }, []);

  return (
    <AuthContext.Provider value={{ currentUser, loading, signup, login, logout }}>
      {!loading && children}
    </AuthContext.Provider>
  );
}
