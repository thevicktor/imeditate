import { ScrollView, Text, View } from "react-native";
import { StatusBar } from "expo-status-bar";
import { useRouter } from "expo-router";
import { Btn, s } from "../ui";
import { C } from "../theme";

export default function Steps() {
  const router = useRouter();
  return (
    <View style={s.root}>
      <StatusBar style="light" />
      <ScrollView contentContainerStyle={s.body}>
        <Text style={s.brand}>iMeditate</Text>
        <View style={s.landing}>
          <Text style={s.h1}>Three steps</Text>
          <Text style={s.hint}>Each one leads to the next</Text>
          <View style={s.stepRow}>
            <View style={[s.num, { backgroundColor: C.parchment }]}><Text style={[s.numTxt, { color: C.ink }]}>1</Text></View>
            <View style={s.stepInfo}><Text style={s.stepName}>Ponder</Text><Text style={s.hint}>See yourself in it</Text></View>
          </View>
          <View style={s.stepRow}>
            <View style={[s.num, { backgroundColor: C.dusk }]}><Text style={[s.numTxt, { color: C.navy }]}>2</Text></View>
            <View style={s.stepInfo}><Text style={s.stepName}>Mutter</Text><Text style={s.hint}>Say it quietly, again and again</Text></View>
          </View>
          <View style={s.stepRow}>
            <View style={[s.num, { backgroundColor: C.red }]}><Text style={s.numTxt}>3</Text></View>
            <View style={s.stepInfo}><Text style={s.stepName}>Roar</Text><Text style={s.hint}>Declare it with joy</Text></View>
          </View>
          <Btn title="Continue" onPress={() => router.push("/promises")} />
        </View>
      </ScrollView>
    </View>
  );
}
