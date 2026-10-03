import { useState } from "react";
import { ScrollView, Text, TextInput, TouchableOpacity, View } from "react-native";
import { StatusBar } from "expo-status-bar";
import { useRouter } from "expo-router";
import { api } from "../api";
import { useSession } from "../session";
import { AGE_GROUPS, type Child } from "../theme";
import { Btn, errText, s } from "../ui";

export default function AddChild() {
  const router = useRouter();
  const { kids, setKids, setKid, total } = useSession();
  const [nickname, setNickname] = useState("");
  const [age, setAge] = useState<(typeof AGE_GROUPS)[number]>("8-11");
  const [error, setError] = useState("");

  async function add() {
    setError("");
    try {
      const c = await api<Child>("POST", "/api/children", { nickname: nickname.trim(), age_group: age });
      setKids([...kids, c]);
      setKid(c);
      router.replace("/soldier");
    } catch (e) {
      setError(errText(e));
    }
  }

  return (
    <View style={s.root}>
      <StatusBar style="light" />
      <ScrollView contentContainerStyle={s.body}>
        <Text style={s.brand}>iMeditate</Text>
        {!!error && <Text style={s.error}>{error}</Text>}
        <Text style={s.h1}>Add your child</Text>
        <Text style={s.hint}>Child {kids.length + 1} of {total}. We only ever ask for this much.</Text>
        <TextInput style={s.input} placeholder="First name or nickname" placeholderTextColor="#8FA6C9" value={nickname} onChangeText={setNickname} />
        <View style={s.seg}>
          {AGE_GROUPS.map((a) => (
            <TouchableOpacity key={a} style={[s.segBtn, age === a && s.segOn]} onPress={() => setAge(a)}>
              <Text style={s.segTxt}>{a}</Text>
            </TouchableOpacity>
          ))}
        </View>
        <Btn title="Add child" onPress={add} />
      </ScrollView>
    </View>
  );
}
