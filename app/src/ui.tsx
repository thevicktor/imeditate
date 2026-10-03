import { StyleSheet, Text, TouchableOpacity } from "react-native";
import { C } from "./theme";

export function Btn({ title, onPress, ghost }: { title: string; onPress: () => void; ghost?: boolean }) {
  return (
    <TouchableOpacity style={[s.btn, ghost && s.btnGhost]} onPress={onPress}>
      <Text style={[s.btnTxt, ghost && s.btnGhostTxt]}>{title}</Text>
    </TouchableOpacity>
  );
}

export function errText(e: unknown): string {
  return typeof e === "object" && e !== null && "body" in e
    ? JSON.stringify((e as { body: unknown }).body)
    : String(e);
}

export const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.navy },
  body: { padding: 24, paddingTop: 64 },
  brand: { color: C.dusk, fontSize: 12, fontWeight: "800", letterSpacing: 3, marginBottom: 16 },
  h1: { color: C.parchment, fontSize: 28, fontWeight: "800", marginBottom: 4 },
  hint: { color: C.dusk, fontSize: 13, marginVertical: 6 },
  error: { color: "#ff8a8a", fontSize: 13, marginBottom: 8 },
  input: { backgroundColor: C.input, borderColor: C.line, borderWidth: 1, color: C.parchment, borderRadius: 12, padding: 12, marginVertical: 5, fontSize: 15 },
  btn: { backgroundColor: C.amber, borderRadius: 18, paddingVertical: 14, paddingHorizontal: 20, marginTop: 10, alignItems: "center", alignSelf: "stretch", minHeight: 48 },
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
  landing: { alignItems: "center", paddingTop: 60, paddingHorizontal: 32 },
  emblem: { width: 124, height: 124, borderRadius: 62, backgroundColor: C.emblem, borderWidth: 3, borderColor: C.gold, alignItems: "center", justifyContent: "center", marginBottom: 28 },
  emblemShield: { color: C.gold, fontSize: 52 },
  landingName: { color: "#FFFFFF", fontSize: 30, fontWeight: "600", fontFamily: "Georgia", marginBottom: 11 },
  tagline: { color: C.gold, fontSize: 15, fontWeight: "600", textAlign: "center", marginBottom: 35 },
  desc: { color: "rgba(255,255,255,0.68)", fontSize: 15, lineHeight: 25, textAlign: "center", marginBottom: 39 },
  quietLink: { color: C.dusk, fontSize: 14, marginTop: 28, paddingVertical: 12, paddingHorizontal: 24 },
  stepRow: { flexDirection: "row", alignItems: "center", width: "100%", marginVertical: 8 },
  num: { width: 48, height: 48, borderRadius: 24, alignItems: "center", justifyContent: "center", marginRight: 14 },
  numTxt: { color: "#fff", fontSize: 20, fontWeight: "900" },
  stepInfo: { flex: 1 },
  stepName: { color: C.parchment, fontSize: 18, fontWeight: "800" },
  promise: { flexDirection: "row", alignItems: "center", width: "100%", marginVertical: 7 },
  check: { color: C.green, fontSize: 20, fontWeight: "900", marginRight: 12 },
  promiseTxt: { color: C.parchment, fontSize: 15 },
  kid: { flexDirection: "row", backgroundColor: C.input, borderWidth: 1, borderColor: C.line, borderRadius: 14, padding: 12, marginVertical: 4, alignItems: "center" },
  kidName: { color: C.parchment, fontWeight: "700" },
  kidRank: { marginLeft: "auto", color: C.gold, fontWeight: "800", fontSize: 12 },
});
