import { Link, useRouter } from "expo-router";
import { View, Text, Pressable, StyleSheet, Platform, Image } from "react-native";
import { ROLE_PRESETS, ROLE_ORDER } from "../lib/roles";

export default function RoleSelect() {
  const router = useRouter();
  return (
    <View style={styles.wrap}>
      <View style={styles.headerSection}>
        <Image 
          source={require('../assets/logo.png')} 
          style={styles.logoImage}
          resizeMode="contain"
        />
        <Text style={styles.h1}>Pick your role</Text>
      </View>
      <View style={styles.grid}>
        {ROLE_ORDER.map((key) => (
          <Pressable key={key} style={styles.pill}
            onPress={() => router.push({ pathname: "/chat", params: { role: key } })}>
            <Text style={styles.pillText}>{ROLE_PRESETS[key].label}</Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
}
const styles = StyleSheet.create({
  wrap:{ 
    flex:1, 
    padding:20, 
    justifyContent:"center",
    backgroundColor: "#F8FAFC",
    ...Platform.select({
      ios: {
        shadowColor: "#4F7CFF",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  headerSection: {
    alignItems: "center",
    marginBottom: 32,
  },
  logoImage: {
    width: 240,
    height: 160,
    marginBottom: 40,
  },
  h1:{ 
    fontSize:32, 
    fontWeight:"700", 
    marginBottom:0,
    color: "#1E293B",
    textAlign: "center",
    letterSpacing: -0.5,
  },
  grid:{ 
    flexDirection:"row", 
    flexWrap:"wrap", 
    marginBottom:24,
    justifyContent: "center",
    gap: 12,
  },
  pill:{ 
    paddingVertical:16, 
    paddingHorizontal:24, 
    borderRadius:20, 
    backgroundColor:"#FFFFFF", 
    marginRight:12, 
    marginBottom:12,
    borderWidth: 2,
    borderColor: "#E2E8F0",
    ...Platform.select({
      ios: {
        shadowColor: "#4F7CFF",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.15,
        shadowRadius: 6,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  pillText:{ 
    fontWeight:"600",
    fontSize: 16,
    color: "#1E293B",
  },
});

