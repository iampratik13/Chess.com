import { useEffect, useState } from "react";
import type { ReactNode } from "react";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updateProfile,
  GoogleAuthProvider,
  signInWithPopup,
} from "firebase/auth";
import type { User } from "firebase/auth";
import { auth } from "@/config/firebase";
import { AuthContext, type AuthContextValue } from "@/contexts/auth-context";

export function AuthProvider({ children }: { children: ReactNode }) {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => onAuthStateChanged(auth, (user) => {
    setCurrentUser(user);
    setLoading(false);
  }), []);

  const value: AuthContextValue = {
    currentUser,
    loading,
    async signup(email, password, displayName) {
      const { user } = await createUserWithEmailAndPassword(auth, email, password);
      if (user) await updateProfile(user, { displayName });
    },
    async login(email, password) {
      await signInWithEmailAndPassword(auth, email, password);
    },
    logout() {
      return signOut(auth);
    },
    async signInWithGoogle() {
      await signInWithPopup(auth, new GoogleAuthProvider());
    },
  };

  return <AuthContext.Provider value={value}>{!loading && children}</AuthContext.Provider>;
}
