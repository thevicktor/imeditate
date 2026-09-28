import { useState } from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import { api, signIn, signUp } from "./src/api";
import { AGE_GROUPS, C, Child, Scripture, Stage } from "./src/theme";

type Screen =
  | "who"
  | "signup"
  | "addchild"
  | "soldier"
  | "home"
  | "session";

const ORDER: Stage[] = ["ponder", "mutter", "roar", "done"];

export default function App() {
  const [screen, setScreen] = useState<Screen>("who");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [nickname, setNickname] = useState("");
  const [age, setAge] = useState<(typeof AGE_GROUPS)[number]>("8-11");
  const [kids, setKids] = useState<Child[]>([]);
  const [kid, setKid] = useState<Child | null>(null);
  const [scriptures, setScriptures] = useState<Scripture[]>([]);
  const [scrip, setScrip] = useState<Scripture | null>(null);
  const [stage, setStage] = useState<Stage>("ponder");
  const [reps, setReps] = useState(0);
  const [result, setResult] = useState<{ rank: string; promoted: boolean; jewels: number } | null>(null);

  const fail = (e: unknown) =>
    setError(typeof e === "object" && e !== null && "body" in e ? JSON.stringify((e as { body: unknown }).body) : String(e));

  async function doAuth(mode: "up" | "in") {
    setError("");
    try {
      if (mode === "up") await signUp(email.trim(), password);
      else await signIn(email.trim(), password);
      setScreen("addchild");
      await loadKids();
    } catch (e) {
      fail(e);
    }
  }

  async function loadKids() {
    try {
      const list = await api<Child[]>("GET", "/api/children");
      setKids(list);
    } catch (e) {
      fail(e);
    }
  }

  async function doAddChild() {
    setError("");
    try {
      const c = await api<Child>("POST", "/api/children", { nickname: nickname.trim(), age_group: age });
      setKid(c);
      setKids((k) => [...k, c]);
      setNickname("");
      setScreen("soldier");
    } catch (e) {
      fail(e);
    }
  }

  async function openHome(c: Child) {
    setKid(c);
    setResult(null);
    try {
      const s = await api<Scripture[]>("GET", "/api/themes/sound-mind/scriptures");
      setScriptures(s);
      setScreen("home");
    } catch (e) {
      fail(e);
    }
  }

  async function startSession(s: Scripture) {
    setScrip(s);
    setResult(null);
    try {
      const p = await api<{ scripture_id: string; stage: Stage; mutter_count: number }[]>("GET", `/api/progress/${kid!.id}`);
      const cur = p.find((x) => x.scripture_id === s.id);
      setStage(cur ? cur.stage : "ponder");
      setReps(cur ? cur.mutter_count : 0);
      setScreen("session");
    } catch (e) {
      fail(e);
    }
  }

  async function put(next: Stage, count: number) {
    const r = await api<{ stage: Stage; rank?: string; promoted?: boolean }>(
      "PUT",
      `/api/progress/${kid!.id}/${scrip!.id}`,
      { stage: next, mutter_count: count }
    );
    setStage(r.stage);
    if (r.stage === "done") {
      const w = await api<{ balance: number }>("GET", `/api/wallet/${kid!.id}`);
      setResult({ rank: r.rank ?? "", promoted: r.promoted ?? false, jewels: w.balance });
      const list = await api<Child[]>("GET", "/api/children");
      setKids(list);
      const updated = list.find((x) => x.id === kid!.id);
      if (updated) setKid(updated);
    }
  }

  return (
    <View style={s.root}>
      <StatusBar style="light" />
      <ScrollView contentContainerStyle={s.body}>
        <Text style={s.brand}>iMeditate</Text>
        {!!error && <Text style={s.error}>{error}</Text>}

        {screen === "who" && (
          <>
            <Text style={s.h1}>Who are you?</Text>
            <Text style={s.hint}>First screen. Determines the whole path.</Text>
            <Btn title="I'm a parent" onPress={() => setScreen("signup")} />
            <Btn title="I'm meditating for myself" ghost onPress={() => setScreen("signup")} />
            <Text style={s.hint}>Children are always added by a parent.</Text>
          </>
        )}

        {screen === "signup" && (
          <>
            <Text style={s.h1}>Create your account</Text>
            <Text style={s.hint}>Minimal fields. No child data collected here.</Text>
            <TextInput style={s.input} placeholder="Email" placeholderTextColor={C.dusk} autoCapitalize="none" value={email} onChangeText={setEmail} />
            <TextInput style={s.input} placeholder="Password (8+)" placeholderTextColor={C.dusk} secureTextEntry value={password} onChangeText={setPassword} />
            <Btn title="Continue" onPress={() => doAuth("up")} />
            <Btn title="I already have an account" ghost onPress={() => doAuth("in")} />
            <Text style={s.hint}>No ads. No messaging. You can delete everything at any time.</Text>
          </>
        )}

        {screen === "addchild" && (
          <>
            <Text style={s.h1}>Add your child</Text>
            <Text style={s.hint}>We only ever ask for this much.</Text>
            <TextInput style={s.input} placeholder="First name or nickname" placeholderTextColor={C.dusk} value={nickname} onChangeText={setNickname} />
            <View style={s.seg}>
              {AGE_GROUPS.map((a) => (
                <TouchableOpacity key={a} style={[s.segBtn, age === a && s.segOn]} onPress={() => setAge(a)}>
                  <Text style={s.segTxt}>{a}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <Btn title="Add child" onPress={doAddChild} />
            {kids.map((k) => (
              <KidRow key={k.id} kid={k} onPress={() => openHome(k)} />
            ))}
          </>
        )}

        {screen === "soldier" && kid && (
          <>
            <Text style={s.rank}>RECRUIT</Text>
            <Text style={s.h1}>This is your Soldier</Text>
            <Text style={s.hint}>He grows every time you meditate, {kid.nickname}. Let's begin.</Text>
            <Btn title="Let's go" onPress={() => openHome(kid)} />
          </>
        )}

        {screen === "home" && kid && (
          <>
            <Text style={s.rank}>{kid.soldier_rank.toUpperCase()}</Text>
            <Text style={s.h1}>Today</Text>
            {scriptures.map((x) => (
              <TouchableOpacity key={x.id} style={s.card} onPress={() => startSession(x)}>
                <Text style={s.cardTitle}>{x.text}</Text>
                <Text style={s.hint}>{x.ref}</Text>
              </TouchableOpacity>
            ))}
            <Btn title="Start" onPress={() => scriptures[0] && startSession(scriptures[0])} />
          </>
        )}

        {screen === "session" && kid && scrip && (
          <>
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
                <Btn title="I'm done" onPress={() => put("mutter", 0).then(() => setReps(0)).catch(fail)} />
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
                <Btn title={`Said it (${reps}/20)`} onPress={() => { const n = Math.min(20, reps + 1); setReps(n); put("mutter", n).catch(fail); }} />
                <Btn title="Go to Roar" ghost onPress={() => put("roar", 20).catch(fail)} />
              </>
            )}
            {stage === "roar" && (
              <>
                <Text style={s.hint}>Roar: declare it LOUD!</Text>
                <Btn title="Declare it!" onPress={() => put("done", 20).catch(fail)} />
              </>
            )}
            {stage === "done" && result && (
              <View style={[s.banner, result.promoted && s.bannerPromo]}>
                <Text style={s.bannerBig}>{result.promoted ? `PROMOTED\n${result.rank}!` : "Well done today"}</Text>
                <Text style={s.hint}>{result.jewels} jewels · Soldier is proud</Text>
                <Btn title="Back home" onPress={() => openHome(kid)} />
              </View>
            )}
          </>
        )}
      </ScrollView>
    </View>
  );
}

function Btn({ title, onPress, ghost }: { title: string; onPress: () => void; ghost?: boolean }) {
  return (
    <TouchableOpacity style={[s.btn, ghost && s.btnGhost]} onPress={onPress}>
      <Text style={[s.btnTxt, ghost && s.btnGhostTxt]}>{title}</Text>
    </TouchableOpacity>
  );
}

function KidRow({ kid, onPress }: { kid: Child; onPress: () => void }) {
  return (
    <TouchableOpacity style={s.kid} onPress={onPress}>
      <Text style={s.kidName}>{kid.nickname} · {kid.age_group}</Text>
      <Text style={s.kidRank}>{kid.soldier_rank}</Text>
    </TouchableOpacity>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.navy },
  body: { padding: 24, paddingTop: 64 },
  brand: { color: C.dusk, fontSize: 12, fontWeight: "800", letterSpacing: 3, marginBottom: 16 },
  h1: { color: C.parchment, fontSize: 28, fontWeight: "800", marginBottom: 4 },
  hint: { color: C.dusk, fontSize: 13, marginVertical: 6 },
  error: { color: "#ff8a8a", fontSize: 13, marginBottom: 8 },
  input: { backgroundColor: C.input, borderColor: C.line, borderWidth: 1, color: C.parchment, borderRadius: 12, padding: 12, marginVertical: 5, fontSize: 15 },
  btn: { backgroundColor: C.amber, borderRadius: 999, padding: 14, marginTop: 10, alignItems: "center" },
  btnTxt: { color: "#fff", fontWeight: "800", fontSize: 16 },
  btnGhost: { backgroundColor: "transparent", borderWidth: 1.5, borderColor: C.line },
  btnGhostTxt: { color: C.dusk },
  seg: { flexDirection: "row", gap: 6, marginVertical: 6 },
  segBtn: { flex: 1, padding: 10, borderRadius: 10, backgroundColor: C.input, borderWidth: 1, borderColor: C.line, alignItems: "center" },
  segOn: { backgroundColor: C.amber, borderColor: C.amber },
  segTxt: { color: C.parchment, fontWeight: "700", fontSize: 13 },
  rank: { color: C.gold, fontWeight: "800", fontSize: 13, letterSpacing: 2 },
  card: { backgroundColor: C.navy2, borderWidth: 1, borderColor: C.line, borderRadius: 16, padding: 16, marginVertical: 6 },
  cardTitle: { color: C.parchment, fontSize: 16, fontWeight: "700" },
  kid: { flexDirection: "row", backgroundColor: C.input, borderWidth: 1, borderColor: C.line, borderRadius: 14, padding: 12, marginVertical: 4, alignItems: "center" },
  kidName: { color: C.parchment, fontWeight: "700" },
  kidRank: { marginLeft: "auto", color: C.gold, fontWeight: "800", fontSize: 12 },
  steps: { flexDirection: "row", gap: 6, marginVertical: 10 },
  step: { flex: 1, padding: 8, borderRadius: 10, backgroundColor: C.input, borderWidth: 1, borderColor: C.line, alignItems: "center" },
  stepDone: { backgroundColor: C.green, borderColor: C.green },
  stepNow: { backgroundColor: C.amber, borderColor: C.amber },
  stepTxt: { color: "#fff", fontSize: 11, fontWeight: "800" },
  verse: { color: C.parchment, fontSize: 17, lineHeight: 27, marginVertical: 8 },
  dots: { flexDirection: "row", flexWrap: "wrap", gap: 5, marginVertical: 10 },
  dot: { width: 13, height: 13, borderRadius: 7, backgroundColor: "#22345f", borderWidth: 1, borderColor: C.line },
  dotF: { backgroundColor: C.amber, borderColor: C.amber },
  banner: { backgroundColor: C.input, borderWidth: 1, borderColor: C.line, borderRadius: 16, padding: 20, alignItems: "center", marginTop: 10 },
  bannerPromo: { backgroundColor: C.red, borderColor: C.gold, borderWidth: 2 },
  bannerBig: { color: "#fff", fontSize: 26, fontWeight: "900", textAlign: "center" },
});
