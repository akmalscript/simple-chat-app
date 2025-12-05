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
import {
  auth,
  createUserWithEmailAndPassword,
  updateProfile,
  isUsernameAvailable,
  saveUserData,
  generateEmailFromUsername,
} from "../firebase";

type Props = NativeStackScreenProps<RootStackParamList, "Register">;

export default function RegisterScreen({ navigation }: Props) {
  const [username, setUsername] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [confirmPassword, setConfirmPassword] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState<boolean>(false);

  // Validasi format username (hanya huruf, angka, underscore, dan titik)
  const isValidUsername = (value: string): boolean => {
    const usernameRegex = /^[a-zA-Z0-9_.]+$/;
    return usernameRegex.test(value) && value.length >= 3 && value.length <= 20;
  };

  const handleRegister = async () => {
    // Validasi input
    if (!username.trim()) {
      Alert.alert("Error", "Username tidak boleh kosong");
      return;
    }
    if (!isValidUsername(username.trim())) {
      Alert.alert(
        "Error", 
        "Username harus 3-20 karakter dan hanya boleh mengandung huruf, angka, underscore (_), atau titik (.)"
      );
      return;
    }
    if (!password.trim()) {
      Alert.alert("Error", "Password tidak boleh kosong");
      return;
    }
    if (password.length < 8) {
      Alert.alert("Error", "Password minimal 8 karakter");
      return;
    }
    if (password !== confirmPassword) {
      Alert.alert("Error", "Password dan konfirmasi password tidak cocok");
      return;
    }

    setLoading(true);
    try {
      // Cek apakah username sudah digunakan
      const usernameAvailable = await isUsernameAvailable(username.trim());
      if (!usernameAvailable) {
        Alert.alert("Error", "Username sudah digunakan, silakan pilih username lain");
        setLoading(false);
        return;
      }

      // Generate email dari username untuk Firebase Auth
      const generatedEmail = generateEmailFromUsername(username.trim());

      // Buat akun baru dengan email dan password
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        generatedEmail,
        password
      );

      // Simpan data user ke Firestore (username)
      await saveUserData(
        userCredential.user.uid,
        username.trim()
      );

      // Update profil pengguna dengan username sebagai displayName
      await updateProfile(userCredential.user, {
        displayName: username.trim(),
      });

      Alert.alert("Berhasil", "Akun berhasil dibuat!", [
        {
          text: "OK",
          onPress: () => navigation.replace("Login"),
        },
      ]);
    } catch (error: any) {
      let errorMessage = "Terjadi kesalahan saat mendaftar";
      
      switch (error.code) {
        case "auth/email-already-in-use":
          errorMessage = "Email sudah terdaftar";
          break;
        case "auth/invalid-email":
          errorMessage = "Format email tidak valid";
          break;
        case "auth/weak-password":
          errorMessage = "Password terlalu lemah";
          break;
        case "auth/operation-not-allowed":
          errorMessage = "Registrasi email/password tidak diaktifkan";
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
          <Text style={styles.title}>Daftar Akun Baru</Text>
          <Text style={styles.subtitle}>
            Silakan isi data untuk membuat akun
          </Text>

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
              placeholder="Password (min. 8 karakter)"
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPassword}
              autoCapitalize="none"
            />
            <TouchableOpacity
              style={styles.eyeButton}
              onPress={() => setShowPassword(!showPassword)}
            >
              <Text style={styles.eyeText}>{showPassword ? "🔒" : "👁️"}</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.passwordContainer}>
            <TextInput
              style={styles.passwordInput}
              placeholder="Konfirmasi Password"
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              secureTextEntry={!showConfirmPassword}
              autoCapitalize="none"
            />
            <TouchableOpacity
              style={styles.eyeButton}
              onPress={() => setShowConfirmPassword(!showConfirmPassword)}
            >
              <Text style={styles.eyeText}>{showConfirmPassword ? "🔒" : "👁️"}</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={[styles.button, loading && styles.buttonDisabled]}
            onPress={handleRegister}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.buttonText}>Daftar</Text>
            )}
          </TouchableOpacity>

          <View style={styles.loginContainer}>
            <Text style={styles.loginText}>Sudah punya akun? </Text>
            <TouchableOpacity onPress={() => navigation.navigate("Login")}>
              <Text style={styles.loginLink}>Masuk di sini</Text>
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
  loginContainer: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: 20,
  },
  loginText: {
    fontSize: 16,
    color: "#666",
  },
  loginLink: {
    fontSize: 16,
    color: "#007AFF",
    fontWeight: "bold",
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
  eyeText: {
    fontSize: 18,
  },
});
