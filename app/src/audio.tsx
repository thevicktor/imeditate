import { Text } from "react-native";
import { useAudioPlayer, useAudioPlayerStatus } from "expo-audio";
import { Btn } from "./ui";

/** Play/pause button for a remote audio file. Silent placeholder when no file yet. */
export function PlayButton({ url, label, loop = false }: { url: string | null; label: string; loop?: boolean }) {
  const player = useAudioPlayer(url, { updateInterval: 500 });
  const status = useAudioPlayerStatus(player);
  if (!url) return <Text style={{ color: "#8FA6C9", fontSize: 13, marginVertical: 6 }}>{label} (arrives with real content)</Text>;
  player.loop = loop;
  return (
    <Btn
      title={status.playing ? `Pause ${label}` : `Play ${label}`}
      ghost
      onPress={() => (status.playing ? player.pause() : player.play())}
    />
  );
}
