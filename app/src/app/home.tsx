import { useCallback, useState } from "react";
import { ScrollView, Text, TouchableOpacity, View } from "react-native";
import { StatusBar } from "expo-status-bar";
import { useFocusEffect, useRouter } from "expo-router";
import { api } from "../api";
import { useSession } from "../session";
import type { Child, Scripture } from "../theme";
import { Btn, errText, s } from "../ui";

interface Theme {
  id: string;
  title: string;
  is_free: boolean;
  locked: boolean;
}

export default function Home() {
  const router = useRouter();
  const { kid, setKid, kids, setKids, setScriptures } = useSession();
  const [themes, setThemes] = useState<Theme[]>([]);
  const [theme, setTheme] = useState<Theme | null>(null);
  const [list, setList] = useState<Scripture[]>([]);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    try {
      const kl = await api<Child[]>("GET", "/api/children");
      setKids(kl);
      const current = kl.find((x) => x.id === kid?.id) ?? kl[0] ?? null;
      setKid(current);
      const tl = await api<Theme[]>("GET", "/api/themes");
      setThemes(tl);
      const open = tl.find((t) => t.id === theme?.id) ?? tl.find((t) => !t.locked) ?? tl[0];
      if (open) {
        setTheme(open);
        if (!open.locked) {
          const sc = await api<Scripture[]>("GET", `/api/themes/${open.id}/scriptures`);
          setScriptures(sc);
          setList(sc);
        } else {
          setList([]);
        }
      }
    } catch (e) {
      setError(errText(e));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load])
  );

  function open(scrip: Scripture) {
    router.push({ pathname: "/session", params: { id: scrip.id } });
  }

  return (
    <View style={s.root}>
      <StatusBar style="light" />
      <ScrollView contentContainerStyle={s.body}>
        <Text style={s.brand}>iMeditate</Text>
        {!!error && <Text style={s.error}>{error}</Text>}
        <View style={s.seg}>
          {kids.map((k) => (
            <TouchableOpacity key={k.id} style={[s.segBtn, kid?.id === k.id && s.segOn]} onPress={() => { setKid(k); setList([]); load(); }}>
              <Text style={s.segTxt}>{k.nickname}</Text>
            </TouchableOpacity>
          ))}
        </View>
        {!!kid && (
          <>
            <Text style={s.rank}>{kid.soldier_rank.toUpperCase()}</Text>
            <Text style={s.h1}>Today</Text>
            {list.map((x) => (
              <TouchableOpacity key={x.id} style={s.card} onPress={() => open(x)}>
                <Text style={s.cardTitle}>{x.text}</Text>
                <Text style={s.hint}>{x.ref}</Text>
              </TouchableOpacity>
            ))}
            <Btn title="Start" onPress={() => list[0] && open(list[0])} />
            <Text style={[s.hint, { marginTop: 18 }]}>Browse themes</Text>
            {themes.map((t) => (
              <TouchableOpacity
                key={t.id}
                style={s.card}
                onPress={() => (t.locked ? router.push("/parent") : (setTheme(t), setList([]), load()))}
              >
                <Text style={s.cardTitle}>
                  {t.title} {t.locked ? "· Locked" : ""}
                </Text>
                <Text style={s.hint}>{t.locked ? "Ask a parent to unlock" : t.is_free ? "Free" : "Included"}</Text>
              </TouchableOpacity>
            ))}
            <TouchableOpacity onPress={() => router.push("/parent")}>
              <Text style={[s.hint, { textAlign: "center", marginTop: 18 }]}>Parents →</Text>
            </TouchableOpacity>
          </>
        )}
      </ScrollView>
    </View>
  );
}
