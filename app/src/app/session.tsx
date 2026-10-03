import { useEffect, useRef, useState } from "react";
import { PanResponder, ScrollView, Text, View } from "react-native";
import { StatusBar } from "expo-status-bar";
import { useLocalSearchParams, useRouter } from "expo-router";
import Svg, { Path } from "react-native-svg";
import { api } from "../api";
import { useSession } from "../session";
import type { Stage } from "../theme";
import { Btn, errText, s } from "../ui";
import { PlayButton } from "../audio";

const ORDER: Stage[] = ["ponder", "mutter", "roar", "done"];

export default function Session() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { kid, kids, setKids, setKid, scriptures } = useSession();
  const [stage, setStage] = useState<Stage>("ponder");
  const [reps, setReps] = useState(0);
  const [result, setResult] = useState<{ rank: string; promoted: boolean; jewels: number } | null>(null);
  const [error, setError] = useState("");
  const [paths, setPaths] = useState<string[]>([]);
  const [savedNote, setSavedNote] = useState("");
  const clock = useRef(Date.now());

  const scrip = scriptures.find((x) => x.id === id);

  const pan = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: (e) => {
        const { locationX, locationY } = e.nativeEvent;
        setPaths((p) => [...p, `M${locationX.toFixed(0)},${locationY.toFixed(0)}`]);
      },
      onPanResponderMove: (e) => {
        const { locationX, locationY } = e.nativeEvent;
        setPaths((p) => {
          const last = p[p.length - 1] + ` L${locationX.toFixed(0)},${locationY.toFixed(0)}`;
          return [...p.slice(0, -1), last];
        });
      },
    })
  ).current;

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

  function drawingSvg(): string {
    const d = paths.map((p) => `<path d="${p}" stroke="#0F1E3D" stroke-width="4" fill="none" stroke-linecap="round"/>`).join("");
    return `<svg xmlns="http://www.w3.org/2000/svg" width="640" height="320" viewBox="0 0 640 320"><rect width="640" height="320" fill="#F7F4EC"/>${d}</svg>`;
  }

  async function saveDrawing(): Promise<boolean> {
    if (!paths.length) return true;
    try {
      const ticket = await api<{ url: string; bucket: string; key: string }>("POST", "/api/artifacts/request", {
        child_id: kid!.id,
        kind: "ponder",
        ext: "svg",
        content_type: "image/svg+xml",
      });
      const up = await fetch(ticket.url, { method: "PUT", headers: { "Content-Type": "image/svg+xml" }, body: drawingSvg() });
      if (!up.ok) throw new Error(`upload ${up.status}`);
      await api("POST", "/api/artifacts/confirm", {
        child_id: kid!.id,
        scripture_id: id,
        bucket: ticket.bucket,
        key: ticket.key,
      });
      setSavedNote("Drawing saved ✓");
      return true;
    } catch (e) {
      setError(errText(e));
      return false;
    }
  }

  async function ponderDone() {
    if (await saveDrawing()) {
      setReps(0);
      await put("mutter", 0);
    }
  }
  async function put(next: Stage, count: number) {
    const elapsed = Math.round((Date.now() - clock.current) / 1000);
    try {
      const r = await api<{ stage: Stage; rank?: string; promoted?: boolean }>(
        "PUT",
        `/api/progress/${kid!.id}/${id}`,
        { stage: next, mutter_count: count, time_spent_seconds: elapsed }
      );
      clock.current = Date.now();
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
            <PlayButton url={scrip.audio_url} label="Reading" />
            <View {...pan.panHandlers} style={{ backgroundColor: "#F7F4EC", borderRadius: 14, height: 180, marginVertical: 8 }}>
              <Svg width="100%" height="100%" viewBox="0 0 640 320">
                {paths.map((d, i) => (
                  <Path key={i} d={d} stroke="#0F1E3D" strokeWidth={4} fill="none" strokeLinecap="round" />
                ))}
              </Svg>
            </View>
            {!!savedNote && <Text style={s.hint}>{savedNote}</Text>}
            <Btn title="Clear drawing" ghost onPress={() => { setPaths([]); setSavedNote(""); }} />
            <Btn title="I'm done" onPress={ponderDone} />
          </>
        )}
        {stage === "mutter" && (
          <>
            <Text style={s.hint}>Mutter: say it softly, 20 times.</Text>
            <PlayButton url={null} label="Soft sound" loop />
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
            <PlayButton url={null} label="Roar music" />
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
