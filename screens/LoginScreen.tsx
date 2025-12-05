import React, { useState } from "react";
import { View, Text, TextInput, Button, StyleSheet } from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { RootStackParamList } from "../App";

type Props = NativeStackScreenProps<RootStackParamList, "Login">;

export default function LoginScreen({ navigation }: Props) {
  const [name, setName] = useState<string>("");

  const handleLogin = () => {
    if (!name.trim()) return;
    navigation.navigate("Chat", { name });
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Masukkan Nama</Text>
      <TextInput
        style={styles.input}
        placeholder="Nama kamu"
        value={name}
        onChangeText={setName}
      />
      <Button title="Masuk Chat" onPress={handleLogin} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    justifyContent: "center", 
    padding: 20 
  },
  title: { 
    fontSize: 26, 
    textAlign: "center", 
    marginBottom: 20 
  },
  input: {
    borderWidth: 1,
    padding: 12,
    borderRadius: 8,
    marginBottom: 20,
  },
});