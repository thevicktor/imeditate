import { Platform } from "react-native";
import * as SecureStore from "expo-secure-store";

const BASE = process.env.EXPO_PUBLIC_API_URL ?? "http://192.168.34.214:3000";
const TOKEN_KEY = "imeditate-session-token";

// Web has no SecureStore — same API, browser storage instead.
const store = {
  get: (k: string) =>
    Platform.OS === "web" ? Promise.resolve(localStorage.getItem(k)) : SecureStore.getItemAsync(k),
  set: (k: string, v: string) =>
    Platform.OS === "web" ? Promise.resolve(localStorage.setItem(k, v)) : SecureStore.setItemAsync(k, v),
  del: (k: string) =>
    Platform.OS === "web" ? Promise.resolve(localStorage.removeItem(k)) : SecureStore.deleteItemAsync(k),
};

export async function setToken(t: string) {
  await store.set(TOKEN_KEY, t);
}
export async function clearToken() {
  await store.del(TOKEN_KEY);
}

/** Authenticated fetch. Throws {status, body} on HTTP error. */
export async function api<T>(method: string, path: string, body?: unknown): Promise<T> {
  const token = await store.get(TOKEN_KEY);
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const text = await res.text();
  let json: T;
  try {
    json = JSON.parse(text) as T;
  } catch {
    json = text as unknown as T;
  }
  if (!res.ok) throw { status: res.status, body: json };
  return json;
}

interface AuthResponse {
  token: string;
  user: { id: string; email: string };
}

export async function signUp(email: string, password: string): Promise<void> {
  const res = await fetch(`${BASE}/api/auth/sign-up/email`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name: "Parent", email, password }),
  });
  if (!res.ok) throw new Error(`signup ${res.status}: ${await res.text()}`);
  const data = (await res.json()) as AuthResponse;
  await setToken(data.token);
}

export async function signIn(email: string, password: string): Promise<void> {
  const res = await fetch(`${BASE}/api/auth/sign-in/email`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  if (!res.ok) throw new Error(`signin ${res.status}: ${await res.text()}`);
  const data = (await res.json()) as AuthResponse;
  await setToken(data.token);
}
