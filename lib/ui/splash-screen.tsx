import { View, Text, StyleSheet, Animated, Platform, Image, Dimensions } from "react-native";
import { useEffect, useRef } from "react";
import { LinearGradient } from 'expo-linear-gradient';

const { width, height } = Dimensions.get('window');

export function SplashScreen() {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const progressAnim = useRef(new Animated.Value(0)).current;
  const shimmerAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Main entrance animation
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 50,
        friction: 8,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 800,
        useNativeDriver: true,
      }),
    ]).start();

    // Continuous rotation for background elements
    Animated.loop(
      Animated.timing(rotateAnim, {
        toValue: 1,
        duration: 20000,
        useNativeDriver: true,
      })
    ).start();

    // Pulse animation for logo
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.05,
          duration: 2000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 2000,
          useNativeDriver: true,
        }),
      ])
    ).start();

    // Progress bar animation
    Animated.timing(progressAnim, {
      toValue: 1,
      duration: 3000,
      useNativeDriver: false,
    }).start();

    // Shimmer effect for loading text
    Animated.loop(
      Animated.sequence([
        Animated.timing(shimmerAnim, {
          toValue: 1,
          duration: 1500,
          useNativeDriver: true,
        }),
        Animated.timing(shimmerAnim, {
          toValue: 0,
          duration: 1500,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, [fadeAnim, scaleAnim, slideAnim, rotateAnim, pulseAnim, progressAnim, shimmerAnim]);

  const rotateInterpolate = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  const progressWidth = progressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '85%'],
  });

  const shimmerOpacity = shimmerAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.5, 1],
  });

  return (
    <LinearGradient
      colors={['#667eea', '#764ba2', '#f093fb']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.container}
    >
      {/* Animated background elements */}
      <Animated.View
        style={[
          styles.backgroundElement,
          styles.element1,
          {
            transform: [
              { rotate: rotateInterpolate },
              { scale: 1.2 },
            ],
          },
        ]}
      />
      <Animated.View
        style={[
          styles.backgroundElement,
          styles.element2,
          {
            transform: [
              { rotate: rotateInterpolate },
              { scale: 0.8 },
            ],
          },
        ]}
      />
      <Animated.View
        style={[
          styles.backgroundElement,
          styles.element3,
          {
            transform: [
              { rotate: rotateInterpolate },
              { scale: 1.1 },
            ],
          },
        ]}
      />

      {/* Main content */}
      <Animated.View
        style={[
          styles.logoContainer,
          {
            opacity: fadeAnim,
            transform: [
              { scale: scaleAnim },
              { translateY: slideAnim },
            ],
          },
        ]}
      >
        {/* Enhanced Logo Icon with glow effect */}
        <Animated.View
          style={[
            styles.logoIcon,
            {
              transform: [{ scale: pulseAnim }],
            },
          ]}
        >
          <View style={styles.logoGlow} />
          <View style={styles.logoInner}>
            <Image 
              source={require('../../assets/logo.png')} 
              style={styles.logoImage}
              resizeMode="contain"
            />
          </View>
        </Animated.View>
        
        <Text style={styles.brandName}>QuickHand</Text>
        <Text style={styles.tagline}>ROLE-AWARE AI ASSISTANT</Text>
        
        {/* Decorative dots */}
        <View style={styles.dotsContainer}>
          <View style={[styles.dot, styles.dot1]} />
          <View style={[styles.dot, styles.dot2]} />
          <View style={[styles.dot, styles.dot3]} />
        </View>
      </Animated.View>
      
      {/* Enhanced loading indicator */}
      <View style={styles.loadingContainer}>
        <Animated.Text 
          style={[
            styles.loadingText,
            {
              opacity: shimmerOpacity,
            }
          ]}
        >
          Loading your AI assistant...
        </Animated.Text>
        <View style={styles.loadingBar}>
          <Animated.View
            style={[
              styles.loadingProgress,
              {
                width: progressWidth,
                opacity: fadeAnim,
              },
            ]}
          />
        </View>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  // Animated background elements
  backgroundElement: {
    position: "absolute",
    borderRadius: 100,
    opacity: 0.1,
  },
  element1: {
    width: 300,
    height: 300,
    backgroundColor: "#ffffff",
    top: -150,
    right: -150,
  },
  element2: {
    width: 200,
    height: 200,
    backgroundColor: "#f093fb",
    bottom: -100,
    left: -100,
  },
  element3: {
    width: 150,
    height: 150,
    backgroundColor: "#667eea",
    top: height * 0.3,
    left: -75,
  },
  logoContainer: {
    alignItems: "center",
    zIndex: 10,
  },
  logoIcon: {
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 40,
    position: "relative",
  },
  logoGlow: {
    position: "absolute",
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: "rgba(255,255,255,0.2)",
    ...Platform.select({
      ios: {
        shadowColor: "#ffffff",
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.8,
        shadowRadius: 20,
      },
      android: {
        elevation: 20,
      },
    }),
  },
  logoInner: {
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.15)",
    borderRadius: 40,
    padding: 40,
    backdropFilter: "blur(10px)",
    ...Platform.select({
      ios: {
        shadowColor: "#000000",
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.3,
        shadowRadius: 16,
      },
      android: {
        elevation: 12,
      },
    }),
  },
  logoImage: {
    width: 120,
    height: 80,
  },
  brandName: {
    fontSize: 48,
    fontWeight: "800",
    color: "#ffffff",
    letterSpacing: -1.5,
    marginBottom: 12,
    textAlign: "center",
    ...Platform.select({
      ios: {
        shadowColor: "#000000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  tagline: {
    fontSize: 16,
    color: "rgba(255,255,255,0.95)",
    fontWeight: "600",
    letterSpacing: 2,
    textTransform: "uppercase",
    textAlign: "center",
    marginBottom: 30,
  },
  dotsContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 20,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginHorizontal: 6,
    backgroundColor: "rgba(255,255,255,0.6)",
  },
  dot1: {
    backgroundColor: "#ffffff",
  },
  dot2: {
    backgroundColor: "rgba(255,255,255,0.7)",
  },
  dot3: {
    backgroundColor: "rgba(255,255,255,0.5)",
  },
  loadingContainer: {
    position: "absolute",
    bottom: 100,
    width: "70%",
    alignItems: "center",
  },
  loadingText: {
    color: "rgba(255,255,255,0.9)",
    fontSize: 14,
    fontWeight: "500",
    marginBottom: 16,
    textAlign: "center",
  },
  loadingBar: {
    width: "100%",
    height: 6,
    backgroundColor: "rgba(255,255,255,0.2)",
    borderRadius: 3,
    overflow: "hidden",
  },
  loadingProgress: {
    height: "100%",
    backgroundColor: "#ffffff",
    borderRadius: 3,
    ...Platform.select({
      ios: {
        shadowColor: "#ffffff",
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.8,
        shadowRadius: 4,
      },
      android: {
        elevation: 4,
      },
    }),
  },
});

