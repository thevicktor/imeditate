import { useState } from "react";
import { ScrollView, Text, TextInput, View } from "react-native";
import { StatusBar } from "expo-status-bar";
import { useRouter } from "expo-router";
import { api, signIn, signUp } from "../api";
import { useSession } from "../session";
import type { Child } from "../theme";
import { Btn, errText, s } from "../ui";

export default function Signup() {
  const router = useRouter();
  const { setKids, setKid, setPending } = useSession();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  async function sendCode(emailAddr: string) {
    const r = await api<{ ok: boolean; devCode?: string }>("POST", "/api/auth/request-code", { email: emailAddr });
    return r.devCode ?? "";
  }

  async function doSignup() {
    setError("");
    try {
      await signUp(email.trim(), password);
      setPending({ email: email.trim(), password });
      await sendCode(email.trim());
      router.replace("/verify");
    } catch (e) {
      setError(errText(e));
    }
  }

  async function doSignin() {
    setError("");
    try {
      await signIn(email.trim(), password);
      const me = await api<{ email: string; verified: boolean }>("GET", "/api/me");
      if (me.verified) {
        const list = await api<Child[]>("GET", "/api/children");
        setKids(list);
        if (list.length) {
          setKid(list[0]);
          router.replace("/home");
        } else {
          router.replace("/howmany");
        }
      } else {
        setPending({ email: email.trim(), password });
        await sendCode(email.trim());
        router.replace("/verify");
      }
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
        <Text style={s.h1}>Create your account</Text>
        <Text style={s.hint}>Minimal fields. No child data collected here.</Text>
        <TextInput style={s.input} placeholder="Email" placeholderTextColor="#8FA6C9" autoCapitalize="none" value={email} onChangeText={setEmail} />
        <TextInput style={s.input} placeholder="Password (8+)" placeholderTextColor="#8FA6C9" secureTextEntry value={password} onChangeText={setPassword} />
        <Btn title="Continue" onPress={doSignup} />
        <Btn title="I already have an account" ghost onPress={doSignin} />
        <Text style={s.hint}>No ads. No messaging. You can delete everything at any time.</Text>
      </ScrollView>
    </View>
  );
}
