import React, { useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  Animated,
} from "react-native";

interface SplashScreenProps {
  onFinish?: () => void;
}

export default function SplashScreen({ onFinish }: SplashScreenProps) {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.5)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;

  useEffect(() => {
    // Animasi logo muncul
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 4,
        tension: 40,
        useNativeDriver: true,
      }),
    ]).start();

    // Animasi teks muncul dengan delay
    Animated.sequence([
      Animated.delay(400),
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 500,
          useNativeDriver: true,
        }),
      ]),
    ]).start();

    // Panggil onFinish setelah animasi selesai
    const timer = setTimeout(() => {
      if (onFinish) {
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }).start(() => onFinish());
      }
    }, 2500);

    return () => clearTimeout(timer);
  }, [fadeAnim, scaleAnim, slideAnim, onFinish]);

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
        <View style={styles.logoCircle}>
          <Text style={styles.logoText}>💬</Text>
        </View>
      </Animated.View>

      <Animated.View
        style={[
          styles.textContainer,
          {
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }],
          },
        ]}
      >
        <Text style={styles.appName}>ChatApp</Text>
        <Text style={styles.tagline}>Terhubung dengan mudah</Text>
      </Animated.View>

      <Animated.View
        style={[
          styles.loadingContainer,
          { opacity: fadeAnim },
        ]}
      >
        <View style={styles.loadingDots}>
          <LoadingDot delay={0} />
          <LoadingDot delay={200} />
          <LoadingDot delay={400} />
        </View>
        <Text style={styles.loadingText}>Memuat...</Text>
      </Animated.View>
    </View>
  );
}

// Komponen animasi titik loading
function LoadingDot({ delay }: { delay: number }) {
  const scaleAnim = useRef(new Animated.Value(0.5)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.delay(delay),
        Animated.timing(scaleAnim, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 0.5,
          duration: 400,
          useNativeDriver: true,
        }),
      ])
    );
    animation.start();
    return () => animation.stop();
  }, [scaleAnim, delay]);

  return (
    <Animated.View
      style={[
        styles.dot,
        { transform: [{ scale: scaleAnim }] },
      ]}
    />
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#007AFF",
    justifyContent: "center",
    alignItems: "center",
  },
  logoContainer: {
    marginBottom: 30,
  },
  logoCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: "#fff",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 10,
  },
  logoText: {
    fontSize: 60,
  },
  textContainer: {
    alignItems: "center",
    marginBottom: 60,
  },
  appName: {
    fontSize: 36,
    fontWeight: "bold",
    color: "#fff",
    marginBottom: 8,
  },
  tagline: {
    fontSize: 16,
    color: "rgba(255, 255, 255, 0.8)",
  },
  loadingContainer: {
    position: "absolute",
    bottom: 80,
    alignItems: "center",
  },
  loadingDots: {
    flexDirection: "row",
    marginBottom: 10,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: "#fff",
    marginHorizontal: 5,
  },
  loadingText: {
    fontSize: 14,
    color: "rgba(255, 255, 255, 0.7)",
  },
});
