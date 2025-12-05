import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { RootStackParamList } from "../App";
import { auth, signInWithEmailAndPassword, generateEmailFromUsername } from "../firebase";
import { setRememberMe } from "../utils/authStorage";

type Props = NativeStackScreenProps<RootStackParamList, "Login">;

export default function LoginScreen({ navigation }: Props) {
  const [username, setUsername] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [rememberMe, setRememberMeState] = useState<boolean>(true);
  const [showPassword, setShowPassword] = useState<boolean>(false);

  const handleLogin = async () => {
    // Validasi input
    if (!username.trim()) {
      Alert.alert("Error", "Username tidak boleh kosong");
      return;
    }
    if (!password.trim()) {
      Alert.alert("Error", "Password tidak boleh kosong");
      return;
    }

    setLoading(true);
    try {
      // Generate email dari username untuk login
      const emailToUse = generateEmailFromUsername(username.trim());

      // Login dengan email dan password
      await signInWithEmailAndPassword(auth, emailToUse, password);
      
      // Simpan preferensi "Ingat Saya" setelah login berhasil
      console.log("Login successful, saving remember me:", rememberMe);
      await setRememberMe(rememberMe);
      
      // Navigasi akan ditangani oleh onAuthStateChanged di App.tsx
    } catch (error: any) {
      let errorMessage = "Terjadi kesalahan saat login";

      switch (error.code) {
        case "auth/user-disabled":
          errorMessage = "Akun ini telah dinonaktifkan";
          break;
        case "auth/user-not-found":
          errorMessage = "Username tidak ditemukan";
          break;
        case "auth/wrong-password":
          errorMessage = "Password salah";
          break;
        case "auth/invalid-credential":
          errorMessage = "Username atau password salah";
          break;
        case "auth/too-many-requests":
          errorMessage = "Terlalu banyak percobaan. Coba lagi nanti";
          break;
        default:
          errorMessage = error.message;
      }

      Alert.alert("Error", errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContainer}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.formContainer}>
          <Text style={styles.title}>Selamat Datang</Text>
          <Text style={styles.subtitle}>Masuk untuk melanjutkan</Text>

          <TextInput
            style={styles.input}
            placeholder="Username"
            value={username}
            onChangeText={setUsername}
            autoCapitalize="none"
            autoCorrect={false}
          />

          <View style={styles.passwordContainer}>
            <TextInput
              style={styles.passwordInput}
              placeholder="Password"
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPassword}
              autoCapitalize="none"
            />
            <TouchableOpacity
              style={styles.eyeButton}
              onPress={() => setShowPassword(!showPassword)}
            >
              <Text style={styles.eyeIcon}>{showPassword ? "🔒" : "👁️"}</Text>
            </TouchableOpacity>
          </View>

          {/* Checkbox Ingat Saya */}
          <TouchableOpacity
            style={styles.rememberMeContainer}
            onPress={() => setRememberMeState(!rememberMe)}
            activeOpacity={0.7}
          >
            <View style={[styles.checkbox, rememberMe && styles.checkboxChecked]}>
              {rememberMe && <Text style={styles.checkmark}>✓</Text>}
            </View>
            <Text style={styles.rememberMeText}>Ingat Saya (7 hari)</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.button, loading && styles.buttonDisabled]}
            onPress={handleLogin}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.buttonText}>Masuk</Text>
            )}
          </TouchableOpacity>

          <View style={styles.registerContainer}>
            <Text style={styles.registerText}>Belum punya akun? </Text>
            <TouchableOpacity onPress={() => navigation.navigate("Register")}>
              <Text style={styles.registerLink}>Daftar di sini</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: "center",
  },
  formContainer: {
    padding: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 8,
    color: "#333",
  },
  subtitle: {
    fontSize: 16,
    textAlign: "center",
    marginBottom: 30,
    color: "#666",
  },
  input: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#ddd",
    padding: 15,
    borderRadius: 10,
    marginBottom: 15,
    fontSize: 16,
  },
  passwordContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 10,
    marginBottom: 15,
  },
  passwordInput: {
    flex: 1,
    padding: 15,
    fontSize: 16,
  },
  eyeButton: {
    padding: 15,
  },
  eyeIcon: {
    fontSize: 20,
  },
  button: {
    backgroundColor: "#007AFF",
    padding: 15,
    borderRadius: 10,
    alignItems: "center",
    marginTop: 10,
  },
  buttonDisabled: {
    backgroundColor: "#99c9ff",
  },
  buttonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
  },
  registerContainer: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: 20,
  },
  registerText: {
    fontSize: 16,
    color: "#666",
  },
  registerLink: {
    fontSize: 16,
    color: "#007AFF",
    fontWeight: "bold",
  },
  rememberMeContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: "#007AFF",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 10,
    backgroundColor: "#fff",
  },
  checkboxChecked: {
    backgroundColor: "#007AFF",
  },
  checkmark: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "bold",
  },
  rememberMeText: {
    fontSize: 14,
    color: "#666",
  },
});