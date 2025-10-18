import { Link, useRouter } from "expo-router";
import { View, Text, Pressable, StyleSheet } from "react-native";
import { ROLE_PRESETS, ROLE_ORDER } from "../lib/roles";

export default function RoleSelect() {
  const router = useRouter();
  return (
    <View style={styles.wrap}>
      <Text style={styles.h1}>Pick your role</Text>
      <View style={styles.grid}>
        {ROLE_ORDER.map((key) => (
          <Pressable key={key} style={styles.pill}
            onPress={() => router.push({ pathname: "/chat", params: { role: key } })}>
            <Text style={styles.pillText}>{ROLE_PRESETS[key].label}</Text>
          </Pressable>
        ))}
      </View>
      <Link href={{ pathname: "/chat", params: { role: "general" }}}>Skip for now →</Link>
    </View>
  );
}
const styles = StyleSheet.create({
  wrap:{ flex:1, padding:20, justifyContent:"center" },
  h1:{ fontSize:24, fontWeight:"600", marginBottom:16 },
  grid:{ flexDirection:"row", flexWrap:"wrap", marginBottom:16 },
  pill:{ paddingVertical:10, paddingHorizontal:14, borderRadius:999, backgroundColor:"#efefef", marginRight:12, marginBottom:12 },
  pillText:{ fontWeight:"600" }
});

