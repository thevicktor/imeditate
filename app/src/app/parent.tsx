import { useState } from "react";
import { ScrollView, Text, TextInput, TouchableOpacity, View } from "react-native";
import { StatusBar } from "expo-status-bar";
import { useRouter } from "expo-router";
import { api, clearToken } from "../api";
import { useSession } from "../session";
import type { Child } from "../theme";
import { Btn, errText, s } from "../ui";

interface Summary {
  child: Child;
  progress: { scripture_id: string; ref: string; stage: string; mutter_count: number; time_spent_seconds: number }[];
  streak: { current: number; longest: number; last_done_date: string | null };
  jewels: number;
  minutesThisWeek: number;
}

export default function Parent() {
  const router = useRouter();
  const { kids, setKids, kid, setKid } = useSession();
  const [pin, setPin] = useState("");
  const [open, setOpen] = useState(false);
  const [error, setError] = useState("");
  const [summary, setSummary] = useState<Summary | null>(null);

  async function unlock() {
    setError("");
    try {
      await api("POST", "/api/parent/unlock", { pin });
      const list = await api<Child[]>("GET", "/api/children");
      setKids(list);
      setOpen(true);
      if (list[0]) void show(list[0].id);
    } catch {
      setError("Wrong PIN — try again");
    }
  }

  async function show(id: string) {
    setError("");
    try {
      const s = await api<Summary>("GET", `/api/children/${id}/summary`);
      setSummary(s);
      const k = kids.find((x) => x.id === id);
      if (k) setKid(k);
    } catch (e) {
      setError(errText(e));
    }
  }

  async function removeChild(id: string) {
    setError("");
    try {
      await api("DELETE", `/api/children/${id}`);
      const list = await api<Child[]>("GET", "/api/children");
      setKids(list);
      setSummary(null);
    } catch (e) {
      setError(errText(e));
    }
  }

  async function removeAll() {
    setError("");
    try {
      await api("DELETE", "/api/parent");
      await clearToken();
      setKids([]);
      setKid(null);
      router.replace("/");
    } catch (e) {
      setError(errText(e));
    }
  }

  return (
    <View style={s.root}>
      <StatusBar style="light" />
      <ScrollView contentContainerStyle={s.body}>
        <Text style={s.brand}>iMeditate · Parents</Text>
        {!!error && <Text style={s.error}>{error}</Text>}
        {!open ? (
          <>
            <Text style={s.h1}>Enter parent PIN</Text>
            <Text style={s.hint}>Simple, not punitive.</Text>
            <TextInput style={s.input} placeholder="PIN" placeholderTextColor="#8FA6C9" keyboardType="number-pad" secureTextEntry maxLength={6} value={pin} onChangeText={setPin} />
            <Btn title="Unlock" onPress={unlock} />
          </>
        ) : (
          <>
            <View style={s.seg}>
              {kids.map((k) => (
                <TouchableOpacity key={k.id} style={[s.segBtn, summary?.child.id === k.id && s.segOn]} onPress={() => show(k.id)}>
                  <Text style={s.segTxt}>{k.nickname}</Text>
                </TouchableOpacity>
              ))}
            </View>
            {summary && (
              <>
                <Text style={s.h1}>{summary.child.nickname}'s progress</Text>
                <Text style={s.hint}>
                  {summary.streak.current} day streak · {summary.minutesThisWeek} min this week · {summary.child.soldier_rank} · {summary.jewels} jewels
                </Text>
                {summary.progress.map((p) => (
                  <View key={p.scripture_id} style={s.card}>
                    <Text style={s.cardTitle}>{p.ref}</Text>
                    <Text style={s.hint}>
                      {p.stage} · {Math.round(p.time_spent_seconds / 60)} min
                    </Text>
                  </View>
                ))}
                {summary.progress.length === 0 && <Text style={s.hint}>No meditations yet.</Text>}
                <Btn title={`Delete ${summary.child.nickname} + all data`} ghost onPress={() => removeChild(summary.child.id)} />
              </>
            )}
            <Btn title="Delete account + everything" ghost onPress={removeAll} />
            {!!kid && <Btn title="Back to app" ghost onPress={() => router.replace("/home")} />}
          </>
        )}
      </ScrollView>
    </View>
  );
}
