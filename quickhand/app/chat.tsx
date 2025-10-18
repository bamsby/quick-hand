import { useLocalSearchParams } from "expo-router";
import { useState } from "react";
import { View, Text, TextInput, Pressable, StyleSheet, ScrollView } from "react-native";
import { ROLE_PRESETS, type RoleKey } from "../lib/roles";
import { runAgent } from "../lib/api";
import type { Message } from "../lib/types";

export default function Chat() {
  const { role = "general" } = useLocalSearchParams<{ role?: RoleKey }>();
  const preset = ROLE_PRESETS[role as RoleKey] ?? ROLE_PRESETS.general;
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Message[]>([
    { id:"sys", role:"system", content:preset.systemPrompt }
  ]);
  const [loading, setLoading] = useState(false);

  const onSend = async () => {
    if (!input.trim() || loading) return;
    const userMsg: Message = { id: String(Date.now()), role:"user", content: input.trim() };
    setMessages((m) => [...m, userMsg]);
    setInput(""); setLoading(true);
    try {
      const reply = await runAgent({ role: role as RoleKey, history: [...messages, userMsg] });
      setMessages((m) => [...m, { id: reply.id, role:"assistant", content: reply.content }]);
    } finally { setLoading(false); }
  };

  return (
    <View style={{ flex:1 }}>
      <View style={styles.header}><Text style={styles.title}>{preset.label} Mode</Text></View>
      <ScrollView style={{ flex:1, padding:16 }}>
        {messages.map((m) => (
          <View key={m.id} style={[styles.bubble, m.role==="user"?styles.user:styles.assistant]}>
            <Text>{m.content}</Text>
          </View>
        ))}
      </ScrollView>
      <View style={styles.inputBar}>
        <TextInput value={input} onChangeText={setInput} placeholder="Ask QuickHand…" style={styles.input}/>
        <Pressable onPress={onSend} style={styles.send}><Text style={{ color:"white" }}>{loading?"…":"Send"}</Text></Pressable>
      </View>
    </View>
  );
}
const styles = StyleSheet.create({
  header:{ padding:16, borderBottomWidth:1, borderColor:"#eee" },
  title:{ fontSize:18, fontWeight:"600" },
  bubble:{ marginBottom:10, padding:12, borderRadius:12, backgroundColor:"#f7f7f7" },
  user:{ alignSelf:"flex-end", backgroundColor:"#def7f1" },
  assistant:{ alignSelf:"flex-start" },
  inputBar:{ flexDirection:"row", gap:8, padding:12, borderTopWidth:1, borderColor:"#eee" },
  input:{ flex:1, padding:12, backgroundColor:"#f0f0f0", borderRadius:8 },
  send:{ paddingHorizontal:16, justifyContent:"center", borderRadius:8, backgroundColor:"#16E0B4" }
});

