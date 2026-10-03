import { createContext, useContext, useState, type ReactNode } from "react";
import type { Child, Scripture } from "./theme";

interface Session {
  kid: Child | null;
  setKid: (c: Child | null) => void;
  kids: Child[];
  setKids: (k: Child[]) => void;
  scriptures: Scripture[];
  setScriptures: (s: Scripture[]) => void;
  total: number;
  setTotal: (n: number) => void;
  pending: { email: string; password: string } | null;
  setPending: (p: { email: string; password: string } | null) => void;
}

const Ctx = createContext<Session | null>(null);

export function SessionProvider({ children }: { children: ReactNode }) {
  const [kid, setKid] = useState<Child | null>(null);
  const [kids, setKids] = useState<Child[]>([]);
  const [scriptures, setScriptures] = useState<Scripture[]>([]);
  const [total, setTotal] = useState(1);
  const [pending, setPending] = useState<{ email: string; password: string } | null>(null);
  return (
    <Ctx.Provider value={{ kid, setKid, kids, setKids, scriptures, setScriptures, total, setTotal, pending, setPending }}>
      {children}
    </Ctx.Provider>
  );
}

export function useSession(): Session {
  const v = useContext(Ctx);
  if (!v) throw new Error("useSession outside provider");
  return v;
}
