import { Text, TouchableOpacity, StyleSheet } from "react-native";
import React, { useEffect, useState, useMemo } from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator, NativeStackNavigationOptions } from "@react-navigation/native-stack";
import LoginScreen from "./screens/LoginScreen";
import RegisterScreen from "./screens/RegisterScreen";
import ChatScreen from "./screens/ChatScreen";
import SplashScreen from "./screens/SplashScreen";
import { auth, signOut, onAuthStateChanged } from "./firebase";
import { User } from "firebase/auth";
import { 
  isSessionExpired, 
  updateLastActivity, 
  clearSessionData,
  getRememberMe 
} from "./utils/authStorage";

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
      await clearSessionData();
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
  const [showSplash, setShowSplash] = useState<boolean>(true);
  const [sessionChecked, setSessionChecked] = useState<boolean>(false);

  // Cek sesi dan auto-logout jika expired
  const checkSessionAndLogout = async (currentUser: User | null) => {
    if (currentUser) {
      // Tunggu sebentar untuk memastikan AsyncStorage siap
      await new Promise<void>(resolve => setTimeout(resolve, 100));
      
      const expired = await isSessionExpired();
      console.log("Session expired result:", expired);
      
      if (expired) {
        // Sesi sudah expired, logout otomatis
        console.log("Sesi expired, melakukan auto-logout...");
        await clearSessionData();
        await signOut(auth);
        return false;
      } else {
        // Update waktu aktivitas terakhir
        const rememberMe = await getRememberMe();
        if (rememberMe) {
          await updateLastActivity();
        }
        return true;
      }
    }
    return false;
  };

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      if (u && !sessionChecked) {
        // Cek apakah sesi masih valid
        const isValid = await checkSessionAndLogout(u);
        if (isValid) {
          setUser(u);
        }
        setSessionChecked(true);
      } else {
        setUser(u);
      }
      
      if (initializing) {
        setInitializing(false);
      }
    });

    return () => unsub();
  }, [initializing, sessionChecked]);

  const chatInitialParams = useMemo(() => ({
    name: user?.displayName || user?.email || "Pengguna"
  }), [user?.displayName, user?.email]);

  // Handler ketika splash screen selesai
  const handleSplashFinish = () => {
    setShowSplash(false);
  };

  // Tampilkan splash screen
  if (showSplash || initializing) {
    return <SplashScreen onFinish={handleSplashFinish} />;
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