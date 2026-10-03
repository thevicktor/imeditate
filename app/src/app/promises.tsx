import { ScrollView, Text, View } from "react-native";
import { StatusBar } from "expo-status-bar";
import { useRouter } from "expo-router";
import { Btn, s } from "../ui";

const PROMISES = [
  "No ads, ever",
  "No chatting between users",
  "Only a first name and age group",
  "Delete everything at any time",
];

export default function Promises() {
  const router = useRouter();
  return (
    <View style={s.root}>
      <StatusBar style="light" />
      <ScrollView contentContainerStyle={s.body}>
        <Text style={s.brand}>iMeditate</Text>
        <View style={s.landing}>
          <Text style={s.h1}>Made for families</Text>
          <Text style={s.hint}>Safe by design</Text>
          {PROMISES.map((p) => (
            <View key={p} style={s.promise}>
              <Text style={s.check}>✓</Text>
              <Text style={s.promiseTxt}>{p}</Text>
            </View>
          ))}
          <Btn title="Get started" onPress={() => router.push("/signup")} />
        </View>
      </ScrollView>
    </View>
  );
}
