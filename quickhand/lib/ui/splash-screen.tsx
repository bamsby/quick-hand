import { View, Text, StyleSheet, Animated } from "react-native";
import { useEffect, useRef } from "react";

export function SplashScreen() {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 50,
        friction: 7,
        useNativeDriver: true,
      }),
    ]).start();
  }, [fadeAnim, scaleAnim]);

  return (
    <View style={styles.container}>
      <Animated.View
        style={[
          styles.logoContainer,
          {
            opacity: fadeAnim,
            transform: [{ scale: scaleAnim }],
          },
        ]}
      >
        {/* Logo Icon - Lightning Bolt + Hand */}
        <View style={styles.logoIcon}>
          <Text style={styles.logoEmoji}>⚡👆</Text>
        </View>
        
        <Text style={styles.brandName}>QuickHand</Text>
        <Text style={styles.tagline}>Your AI execution assistant</Text>
      </Animated.View>
      
      {/* Loading indicator */}
      <View style={styles.loadingContainer}>
        <View style={styles.loadingBar}>
          <Animated.View
            style={[
              styles.loadingProgress,
              {
                opacity: fadeAnim,
              },
            ]}
          />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#6366f1",
    justifyContent: "center",
    alignItems: "center",
  },
  logoContainer: {
    alignItems: "center",
  },
  logoIcon: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.2)",
    borderRadius: 24,
    padding: 20,
    marginBottom: 24,
  },
  logoEmoji: {
    fontSize: 56,
    lineHeight: 64,
  },
  brandName: {
    fontSize: 42,
    fontWeight: "700",
    color: "#ffffff",
    letterSpacing: -1,
    marginBottom: 8,
  },
  tagline: {
    fontSize: 16,
    color: "rgba(255,255,255,0.85)",
    fontWeight: "500",
  },
  loadingContainer: {
    position: "absolute",
    bottom: 80,
    width: "60%",
    alignItems: "center",
  },
  loadingBar: {
    width: "100%",
    height: 4,
    backgroundColor: "rgba(255,255,255,0.2)",
    borderRadius: 2,
    overflow: "hidden",
  },
  loadingProgress: {
    height: "100%",
    width: "60%",
    backgroundColor: "#fbbf24",
    borderRadius: 2,
  },
});

