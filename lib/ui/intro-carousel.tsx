import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  Animated,
  Platform,
  Image,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';

const { width, height } = Dimensions.get('window');

interface IntroCarouselProps {
  onComplete: () => void;
}

export function IntroCarousel({ onComplete }: IntroCarouselProps) {
  const [currentSlide, setCurrentSlide] = useState(0);
  const router = useRouter();
  
  const slideAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.9)).current;
  const staggerAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Entrance animation
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 50,
        friction: 8,
        useNativeDriver: true,
      }),
    ]).start();

    // Staggered animation for elements
    Animated.timing(staggerAnim, {
      toValue: 1,
      duration: 800,
      delay: 200,
      useNativeDriver: true,
    }).start();
  }, []);

  useEffect(() => {
    // Slide transition animation
    Animated.timing(slideAnim, {
      toValue: -currentSlide * width,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }, [currentSlide]);

  const nextSlide = () => {
    if (currentSlide < 2) {
      setCurrentSlide(currentSlide + 1);
    } else {
      onComplete();
    }
  };

  const skipIntro = () => {
    onComplete();
  };

  const selectRole = (role: string) => {
    // Navigate to chat with preselected role
    router.push({
      pathname: '/chat',
      params: { role }
    });
  };

  const renderSlide1 = () => (
    <View style={styles.slide}>
      <LinearGradient
        colors={['#667eea', '#764ba2']}
        style={styles.slideBackground}
      >
        {/* Hero Icon */}
        <View style={styles.heroIconContainer}>
          <View style={styles.heroIcon}>
            <Image 
              source={require('../../assets/logo.png')} 
              style={styles.heroIconImage}
              resizeMode="contain"
            />
          </View>
        </View>

        <Text style={styles.heroTitle}>Meet QuickHand</Text>
        <Text style={styles.heroSubtitle}>Get it done. Fast.</Text>
        <Text style={styles.heroDescription}>Role-aware AI that acts—not just chats.</Text>

        {/* Feature bullets */}
        <View style={styles.bulletsContainer}>
          {[
            'Grounded answers with citations',
            'One-tap actions to your apps',
            'Mobile-first, zero setup'
          ].map((text, index) => (
            <Animated.View
              key={index}
              style={[
                styles.bulletItem,
                {
                  opacity: staggerAnim,
                  transform: [
                    {
                      translateY: staggerAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: [20, 0],
                      }),
                    },
                  ],
                },
              ]}
            >
              <View style={styles.bulletDot} />
              <Text style={styles.bulletText}>{text}</Text>
            </Animated.View>
          ))}
        </View>
      </LinearGradient>
    </View>
  );

  const renderSlide2 = () => (
    <View style={styles.slide}>
      <LinearGradient
        colors={['#764ba2', '#f093fb']}
        style={styles.slideBackground}
      >
        <Text style={styles.heroTitle}>How it works</Text>
        <Text style={styles.heroSubtitle}>Plan → Search → Act</Text>
        <Text style={styles.heroDescription}>A simple flow you can trust.</Text>

        {/* Process flow */}
        <View style={styles.processContainer}>
          <View style={styles.processStep}>
            <View style={styles.processIcon}>
              <Text style={styles.processIconText}>📋</Text>
            </View>
            <Text style={styles.processTitle}>Plan</Text>
            <Text style={styles.processDescription}>2–3 steps with a quick checkpoint</Text>
          </View>

          <View style={styles.processArrow}>
            <Text style={styles.arrowText}>→</Text>
          </View>

          <View style={styles.processStep}>
            <View style={styles.processIcon}>
              <Text style={styles.processIconText}>🔍</Text>
            </View>
            <Text style={styles.processTitle}>Search</Text>
            <Text style={styles.processDescription}>Exa-powered, fresh sources [1][2][3]</Text>
          </View>

          <View style={styles.processArrow}>
            <Text style={styles.arrowText}>→</Text>
          </View>

          <View style={styles.processStep}>
            <View style={styles.processIcon}>
              <Text style={styles.processIconText}>⚡</Text>
            </View>
            <Text style={styles.processTitle}>Act</Text>
            <Text style={styles.processDescription}>Save to Notion / Draft in Gmail</Text>
          </View>
        </View>
      </LinearGradient>
    </View>
  );

  const renderSlide3 = () => (
    <View style={styles.slide}>
      <LinearGradient
        colors={['#f093fb', '#667eea']}
        style={styles.slideBackground}
      >
        <Text style={styles.heroTitle}>Make it yours</Text>
        <Text style={styles.heroSubtitle}>Pick your role & start</Text>
        <Text style={styles.heroDescription}>We tailor tone and outputs to you.</Text>

        {/* Role pills */}
        <View style={styles.rolesContainer}>
          {['Founder', 'Student', 'Teacher', 'Creator', 'General'].map((role, index) => (
            <Animated.View
              key={role}
              style={{
                opacity: staggerAnim,
                transform: [
                  {
                    scale: staggerAnim.interpolate({
                      inputRange: [0, 0.5, 1],
                      outputRange: [0.8, 1.1, 1],
                    }),
                  },
                ],
              }}
            >
              <TouchableOpacity
                style={styles.rolePill}
                onPress={() => selectRole(role.toLowerCase())}
                activeOpacity={0.8}
              >
                <Text style={styles.rolePillText}>{role}</Text>
              </TouchableOpacity>
            </Animated.View>
          ))}
        </View>

        {/* Trust note */}
        <View style={styles.trustNote}>
          <Text style={styles.trustNoteText}>
            Your actions need approval. Drafts by default.
          </Text>
        </View>
      </LinearGradient>
    </View>
  );

  return (
    <Animated.View
      style={[
        styles.container,
        {
          opacity: fadeAnim,
          transform: [{ scale: scaleAnim }],
        },
      ]}
    >
      {/* Skip button */}
      <TouchableOpacity style={styles.skipButton} onPress={skipIntro}>
        <Text style={styles.skipButtonText}>Skip</Text>
      </TouchableOpacity>

      {/* Slides container */}
      <View style={styles.slidesContainerWrapper}>
        <Animated.View
          style={[
            styles.slidesContainer,
            {
              transform: [{ translateX: slideAnim }],
            },
          ]}
        >
          <View style={styles.slideWrapper}>
            {renderSlide1()}
          </View>
          <View style={styles.slideWrapper}>
            {renderSlide2()}
          </View>
          <View style={styles.slideWrapper}>
            {renderSlide3()}
          </View>
        </Animated.View>
      </View>

      {/* Bottom controls */}
      <View style={styles.bottomControls}>
        {/* Dots indicator */}
        <View style={styles.dotsContainer}>
          {[0, 1, 2].map((index) => (
            <View
              key={index}
              style={[
                styles.dot,
                currentSlide === index && styles.activeDot,
              ]}
            />
          ))}
        </View>

        {/* Next/Get Started button */}
        <TouchableOpacity style={styles.nextButton} onPress={nextSlide}>
          <LinearGradient
            colors={['#ffffff', '#f8f9ff']}
            style={styles.nextButtonGradient}
          >
            <Text style={styles.nextButtonText}>
              {currentSlide === 2 ? 'Get Started' : 'Next'}
            </Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  slidesContainerWrapper: {
    flex: 1,
    overflow: 'hidden',
  },
  skipButton: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 60 : 40,
    right: 20,
    zIndex: 10,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  skipButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
  slidesContainer: {
    flexDirection: 'row',
    width: width * 3, // Total width for all slides
    height: '100%',
  },
  slideWrapper: {
    width: width,
    height: '100%',
  },
  slide: {
    width: width,
    flex: 1,
  },
  slideBackground: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  heroIconContainer: {
    marginBottom: 40,
  },
  heroIcon: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#000000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.3,
        shadowRadius: 16,
      },
      android: {
        elevation: 12,
      },
    }),
  },
  heroIconImage: {
    width: 80,
    height: 50,
  },
  heroTitle: {
    fontSize: 36,
    fontWeight: '800',
    color: '#ffffff',
    textAlign: 'center',
    marginBottom: 16,
    letterSpacing: -1,
  },
  heroSubtitle: {
    fontSize: 24,
    fontWeight: '600',
    color: '#ffffff',
    textAlign: 'center',
    marginBottom: 12,
    opacity: 0.95,
  },
  heroDescription: {
    fontSize: 18,
    color: 'rgba(255,255,255,0.9)',
    textAlign: 'center',
    marginBottom: 40,
    lineHeight: 24,
  },
  bulletsContainer: {
    width: '100%',
    maxWidth: 300,
  },
  bulletItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  bulletDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#ffffff',
    marginRight: 16,
  },
  bulletText: {
    fontSize: 16,
    color: '#ffffff',
    fontWeight: '500',
    flex: 1,
  },
  processContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    maxWidth: 320,
  },
  processStep: {
    alignItems: 'center',
    flex: 1,
  },
  processIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  processIconText: {
    fontSize: 24,
  },
  processTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#ffffff',
    marginBottom: 4,
  },
  processDescription: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.8)',
    textAlign: 'center',
    lineHeight: 16,
  },
  processArrow: {
    marginHorizontal: 8,
  },
  arrowText: {
    fontSize: 24,
    color: '#ffffff',
    fontWeight: '600',
  },
  rolesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    marginBottom: 32,
    maxWidth: 300,
  },
  rolePill: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 25,
    margin: 6,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  rolePillText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
  trustNote: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 12,
    marginTop: 20,
  },
  trustNoteText: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 16,
  },
  bottomControls: {
    position: 'absolute',
    bottom: 60,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  dotsContainer: {
    flexDirection: 'row',
    marginBottom: 32,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255,255,255,0.3)',
    marginHorizontal: 4,
  },
  activeDot: {
    backgroundColor: '#ffffff',
    width: 24,
  },
  nextButton: {
    borderRadius: 25,
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: '#000000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  nextButtonGradient: {
    paddingHorizontal: 40,
    paddingVertical: 16,
  },
  nextButtonText: {
    color: '#667eea',
    fontSize: 16,
    fontWeight: '700',
    textAlign: 'center',
  },
});
