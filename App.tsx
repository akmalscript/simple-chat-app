import { View, Text, ActivityIndicator, TouchableOpacity, StyleSheet } from "react-native";
import React, { useEffect, useState, useMemo } from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator, NativeStackNavigationOptions } from "@react-navigation/native-stack";
import LoginScreen from "./screens/LoginScreen";
import RegisterScreen from "./screens/RegisterScreen";
import ChatScreen from "./screens/ChatScreen";
import { auth, signOut, onAuthStateChanged } from "./firebase";
import { User } from "firebase/auth";

// Definisi tipe navigasi
export type RootStackParamList = {
  Login: undefined;
  Register: undefined;
  Chat: { name: string };
};

const Stack = createNativeStackNavigator<RootStackParamList>();

// Komponen LogoutButton terpisah
function LogoutButton() {
  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error("Error saat logout:", error);
    }
  };

  return (
    <TouchableOpacity onPress={handleLogout} style={styles.logoutButton}>
      <Text style={styles.logoutText}>Keluar</Text>
    </TouchableOpacity>
  );
}

// Screen options untuk Chat
const chatScreenOptions: NativeStackNavigationOptions = {
  title: "Chat",
  headerRight: () => <LogoutButton />,
};

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [initializing, setInitializing] = useState<boolean>(true);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u);
      if (initializing) setInitializing(false);
    });

    return () => unsub();
  }, [initializing]);

  const chatInitialParams = useMemo(() => ({
    name: user?.displayName || user?.email || "Pengguna"
  }), [user?.displayName, user?.email]);

  if (initializing) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Memuat...</Text>
      </View>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator>
        {user ? (
          // Pengguna sudah login
          <Stack.Screen
            name="Chat"
            component={ChatScreen}
            initialParams={chatInitialParams}
            options={chatScreenOptions}
          />
        ) : (
          // Pengguna belum login
          <>
            <Stack.Screen
              name="Login"
              component={LoginScreen}
              options={{ headerShown: false }}
            />
            <Stack.Screen
              name="Register"
              component={RegisterScreen}
              options={{ headerShown: false }}
            />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f5f5f5",
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: "#666",
  },
  logoutButton: {
    marginRight: 10,
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: "#ff4444",
    borderRadius: 6,
  },
  logoutText: {
    color: "#fff",
    fontWeight: "bold",
  },
});