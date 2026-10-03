import { ScrollView, Text, TouchableOpacity, View } from "react-native";
import { StatusBar } from "expo-status-bar";
import { useRouter } from "expo-router";
import { Btn, s } from "../ui";

export default function Welcome() {
  const router = useRouter();
  return (
    <View style={s.root}>
      <StatusBar style="light" />
      <ScrollView contentContainerStyle={s.body}>
        <Text style={s.brand}>iMeditate</Text>
        <View style={s.landing}>
          <View style={s.emblem}>
            <Text style={s.emblemShield}>⛨</Text>
          </View>
          <Text style={s.landingName}>iMeditate</Text>
          <Text style={s.tagline}>Meditate. Prosper. Succeed.</Text>
          <Text style={s.desc}>Meditate on scripture in three steps, for children and anyone.</Text>
          <Btn title="Get started" onPress={() => router.push("/steps")} />
          <TouchableOpacity onPress={() => router.push("/signup")}>
            <Text style={s.quietLink}>I already have an account</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}
