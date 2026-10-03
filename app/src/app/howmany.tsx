import { ScrollView, Text, TouchableOpacity, View } from "react-native";
import { StatusBar } from "expo-status-bar";
import { useRouter } from "expo-router";
import { useSession } from "../session";
import { Btn, s } from "../ui";

export default function HowMany() {
  const router = useRouter();
  const { total, setTotal } = useSession();
  return (
    <View style={s.root}>
      <StatusBar style="light" />
      <ScrollView contentContainerStyle={s.body}>
        <Text style={s.brand}>iMeditate</Text>
        <View style={s.landing}>
          <Text style={s.h1}>How many children?</Text>
          <Text style={s.hint}>You'll add each one by name and age group.</Text>
          <View style={s.seg}>
            {[1, 2, 3, 4, 5].map((n) => (
              <TouchableOpacity key={n} style={[s.segBtn, total === n && s.segOn]} onPress={() => setTotal(n)}>
                <Text style={s.segTxt}>{n}</Text>
              </TouchableOpacity>
            ))}
          </View>
          <Btn title={`Add ${total} ${total === 1 ? "child" : "children"}`} onPress={() => router.push("/addchild")} />
        </View>
      </ScrollView>
    </View>
  );
}
