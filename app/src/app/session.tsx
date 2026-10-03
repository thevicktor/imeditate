import { useEffect, useState } from "react";
import { ScrollView, Text, View } from "react-native";
import { StatusBar } from "expo-status-bar";
import { useLocalSearchParams, useRouter } from "expo-router";
import { api } from "../api";
import { useSession } from "../session";
import type { Stage } from "../theme";
import { Btn, errText, s } from "../ui";

const ORDER: Stage[] = ["ponder", "mutter", "roar", "done"];

export default function Session() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { kid, kids, setKids, setKid, scriptures } = useSession();
  const [stage, setStage] = useState<Stage>("ponder");
  const [reps, setReps] = useState(0);
  const [result, setResult] = useState<{ rank: string; promoted: boolean; jewels: number } | null>(null);
  const [error, setError] = useState("");

  const scrip = scriptures.find((x) => x.id === id);

  useEffect(() => {
    (async () => {
      if (!kid || !id) return;
      try {
        const p = await api<{ scripture_id: string; stage: Stage; mutter_count: number }[]>("GET", `/api/progress/${kid.id}`);
        const cur = p.find((x) => x.scripture_id === id);
        setStage(cur ? cur.stage : "ponder");
        setReps(cur ? cur.mutter_count : 0);
      } catch (e) {
        setError(errText(e));
      }
    })();
  }, [kid, id]);

  async function put(next: Stage, count: number) {
    try {
      const r = await api<{ stage: Stage; rank?: string; promoted?: boolean }>(
        "PUT",
        `/api/progress/${kid!.id}/${id}`,
        { stage: next, mutter_count: count }
      );
      setStage(r.stage);
      if (r.stage === "done") {
        const w = await api<{ balance: number }>("GET", `/api/wallet/${kid!.id}`);
        setResult({ rank: r.rank ?? "", promoted: r.promoted ?? false, jewels: w.balance });
        const list = await api<import("../theme").Child[]>("GET", "/api/children");
        setKids(list);
        const updated = list.find((x) => x.id === kid!.id);
        if (updated) setKid(updated);
      }
    } catch (e) {
      setError(errText(e));
    }
  }

  if (!scrip || !kid) return null;
  void kids;

  return (
    <View style={s.root}>
      <StatusBar style="light" />
      <ScrollView contentContainerStyle={s.body}>
        <Text style={s.brand}>iMeditate</Text>
        {!!error && <Text style={s.error}>{error}</Text>}
        <View style={s.steps}>
          {ORDER.map((st) => (
            <View key={st} style={[s.step, ORDER.indexOf(st) < ORDER.indexOf(stage) && s.stepDone, st === stage && s.stepNow]}>
              <Text style={s.stepTxt}>{st}</Text>
            </View>
          ))}
        </View>
        <Text style={s.verse}>"{scrip.text}"</Text>
        <Text style={s.hint}>{scrip.ref}</Text>

        {stage === "ponder" && (
          <>
            <Text style={s.hint}>Ponder: picture yourself in it. No timer.</Text>
            <Btn title="I'm done" onPress={() => put("mutter", 0).then(() => setReps(0))} />
          </>
        )}
        {stage === "mutter" && (
          <>
            <Text style={s.hint}>Mutter: say it softly, 20 times.</Text>
            <View style={s.dots}>
              {Array.from({ length: 20 }, (_, i) => (
                <View key={i} style={[s.dot, i < reps && s.dotF]} />
              ))}
            </View>
            <Btn title={`Said it (${reps}/20)`} onPress={() => { const n = Math.min(20, reps + 1); setReps(n); put("mutter", n); }} />
            <Btn title="Go to Roar" ghost onPress={() => put("roar", 20)} />
          </>
        )}
        {stage === "roar" && (
          <>
            <Text style={s.hint}>Roar: declare it LOUD!</Text>
            <Btn title="Declare it!" onPress={() => put("done", 20)} />
          </>
        )}
        {stage === "done" && result && (
          <View style={[s.banner, result.promoted && s.bannerPromo]}>
            <Text style={s.bannerBig}>{result.promoted ? `PROMOTED\n${result.rank}!` : "Well done today"}</Text>
            <Text style={s.hint}>{result.jewels} jewels · Soldier is proud</Text>
            <Btn title="Back home" onPress={() => router.replace("/home")} />
          </View>
        )}
      </ScrollView>
    </View>
  );
}
