import { ScrollView, Text, View } from "react-native";
import { StatusBar } from "expo-status-bar";
import { useRouter } from "expo-router";
import { useSession } from "../session";
import { Btn, s } from "../ui";

export default function Soldier() {
  const router = useRouter();
  const { kid, kids, total } = useSession();
  if (!kid) return null;
  const more = kids.length < total;
  return (
    <View style={s.root}>
      <StatusBar style="light" />
      <ScrollView contentContainerStyle={s.body}>
        <Text style={s.brand}>iMeditate</Text>
        <Text style={s.rank}>RECRUIT</Text>
        <Text style={s.h1}>This is {kid.nickname}'s Soldier</Text>
        <Text style={s.hint}>He grows every time {kid.nickname} meditates. Let's begin.</Text>
        <Btn
          title={more ? `Next child (${kids.length + 1} of ${total})` : "Let's go"}
          onPress={() => router.replace(more ? "/addchild" : "/home")}
        />
      </ScrollView>
    </View>
  );
}
