import { useState } from "react";
import { ScrollView, Text, TextInput, View } from "react-native";
import { StatusBar } from "expo-status-bar";
import { useRouter } from "expo-router";
import { api, signIn } from "../api";
import { useSession } from "../session";
import { Btn, errText, s } from "../ui";

export default function Verify() {
  const router = useRouter();
  const { pending, setPending } = useSession();
  const [code, setCode] = useState("");
  const [devCode, setDevCode] = useState("");
  const [error, setError] = useState("");

  async function resend() {
    setError("");
    try {
      const r = await api<{ ok: boolean; devCode?: string }>("POST", "/api/auth/request-code", { email: pending?.email ?? "" });
      setDevCode(r.devCode ?? "");
    } catch (e) {
      setError(errText(e));
    }
  }

  async function doVerify() {
    setError("");
    try {
      await api("POST", "/api/auth/verify-code", { email: pending?.email ?? "", code: code.trim() });
      if (pending) await signIn(pending.email, pending.password);
      setPending(null);
      router.replace("/hello");
    } catch (e) {
      setError(errText(e));
    }
  }

  return (
    <View style={s.root}>
      <StatusBar style="light" />
      <ScrollView contentContainerStyle={s.body}>
        <Text style={s.brand}>iMeditate</Text>
        {!!error && <Text style={s.error}>{error}</Text>}
        <Text style={s.h1}>Check your email</Text>
        <Text style={s.hint}>We sent a 6-digit code to {pending?.email}. It lasts 15 minutes.</Text>
        <TextInput style={s.input} placeholder="6-digit code" placeholderTextColor="#8FA6C9" keyboardType="number-pad" maxLength={6} value={code} onChangeText={setCode} />
        {!!devCode && <Text style={s.hint}>Testing code: {devCode} (email sending arrives later)</Text>}
        <Btn title="Verify" onPress={doVerify} />
        <Btn title="Resend code" ghost onPress={resend} />
      </ScrollView>
    </View>
  );
}
