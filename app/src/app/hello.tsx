import { useState } from "react";
import { ScrollView, Text, TextInput, View } from "react-native";
import { StatusBar } from "expo-status-bar";
import { useRouter } from "expo-router";
import { api } from "../api";
import { Btn, errText, s } from "../ui";

export default function Hello() {
  const router = useRouter();
  const [pin, setPin] = useState("");
  const [error, setError] = useState("");

  async function cont() {
    setError("");
    if (!/^\d{4,6}$/.test(pin)) {
      setError("PIN must be 4-6 digits");
      return;
    }
    try {
      await api("POST", "/api/parent/pin", { pin });
      router.replace("/howmany");
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
        <View style={s.landing}>
          <Text style={s.rank}>WELCOME</Text>
          <Text style={s.h1}>Welcome to iMeditate!</Text>
          <Text style={s.desc}>Your email is confirmed. Next: lock the parent area with a PIN, then add your children — each meets their own Soldier.</Text>
          <TextInput style={s.input} placeholder="Parent PIN (4-6 digits)" placeholderTextColor="#8FA6C9" keyboardType="number-pad" maxLength={6} value={pin} onChangeText={setPin} />
          <Btn title="Continue" onPress={cont} />
        </View>
      </ScrollView>
    </View>
  );
}
