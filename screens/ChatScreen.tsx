import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  TextInput,
  Button,
  FlatList,
  StyleSheet,
} from "react-native";
import NetInfo from "@react-native-community/netinfo";
import {
  auth,
  addDoc,
  serverTimestamp,
  query,
  orderBy,
  onSnapshot,
  messagesCollection
} from "../firebase";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { RootStackParamList } from "../App";
import { saveChatHistory, getChatHistory } from "../utils/chatStorage";

type MessageType = {
  id: string;
  text: string;
  user: string;
  userId: string;
  createdAt: { seconds: number; nanoseconds: number } | null;
};

type Props = NativeStackScreenProps<RootStackParamList, "Chat">;

export default function ChatScreen({ route }: Props) {
  const { name } = route.params;
  const currentUser = auth.currentUser;
  const displayName = currentUser?.displayName || currentUser?.email || name;
  
  const [message, setMessage] = useState<string>("");
  const [messages, setMessages] = useState<MessageType[]>([]);
  const [isOnline, setIsOnline] = useState<boolean>(true);
  const [cacheLoaded, setCacheLoaded] = useState<boolean>(false);

  // Load cached messages saat pertama kali mount
  useEffect(() => {
    const loadCachedMessages = async () => {
      try {
        const cachedMessages = await getChatHistory();
        if (cachedMessages.length > 0) {
          setMessages(cachedMessages);
          console.log("Loaded cached messages:", cachedMessages.length);
        }
      } catch (error) {
        console.error("Error loading cached messages:", error);
      } finally {
        setCacheLoaded(true);
      }
    };

    loadCachedMessages();
  }, []);

  // Monitor network status
  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener(state => {
      const online = state.isConnected ?? false;
      setIsOnline(online);
      console.log("Network status:", online ? "Online" : "Offline");
    });

    return () => unsubscribe();
  }, []);

  // Mengambil data real-time dari Firestore dan simpan ke cache
  // Hanya jalankan setelah cache di-load dan saat online
  useEffect(() => {
    // Tunggu cache loaded dulu
    if (!cacheLoaded) return;
    
    // Jika offline, jangan subscribe ke Firestore
    if (!isOnline) {
      console.log("Offline mode: using cached messages");
      return;
    }

    const q = query(messagesCollection, orderBy("createdAt", "asc"));
    
    const unsub = onSnapshot(q, (snapshot) => {
      const list: MessageType[] = [];
      snapshot.forEach((doc) => {
        list.push({
          id: doc.id,
          ...(doc.data() as Omit<MessageType, "id">),
        });
      });
      
      // Hanya update jika ada data dari Firestore
      if (list.length > 0) {
        setMessages(list);
        // Simpan ke local storage
        saveChatHistory(list);
        console.log("Synced messages from Firestore:", list.length);
      }
    }, (error) => {
      console.log("Firestore error:", error.message);
      // Saat error, tetap gunakan cache yang sudah di-load
    });

    return () => unsub();
  }, [cacheLoaded, isOnline]);

  // Fungsi mengirim pesan
  const sendMessage = async () => {
    if (!message.trim()) return;
    
    if (!isOnline) {
      // Jika offline, tampilkan pesan error
      console.log("Cannot send message: offline");
      return;
    }
    
    await addDoc(messagesCollection, {
      text: message,
      user: displayName,
      userId: currentUser?.uid || "",
      createdAt: serverTimestamp(),
    });
    
    setMessage("");
  };

  // Render item chat bubble
  const renderItem = ({ item }: { item: MessageType }) => {
    const isMyMessage = item.userId === currentUser?.uid;
    
    return (
      <View
        style={[
          styles.msgBox,
          isMyMessage ? styles.myMsg : styles.otherMsg,
        ]}
      >
        <Text style={styles.sender}>{item.user}</Text>
        <Text>{item.text}</Text>
      </View>
    );
  };

  // UI Utama
  return (
    <View style={styles.container}>
      {/* Offline Banner */}
      {!isOnline && (
        <View style={styles.offlineBanner}>
          <Text style={styles.offlineText}>📴 Mode Offline - Menampilkan pesan tersimpan</Text>
        </View>
      )}
      
      <FlatList
        data={messages}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={styles.listContent}
      />
      
      <View style={styles.inputRow}>
        <TextInput
          style={[styles.input, !isOnline && styles.inputDisabled]}
          placeholder={isOnline ? "Ketik pesan..." : "Tidak bisa mengirim (offline)"}
          value={message}
          onChangeText={setMessage}
          editable={isOnline}
        />
        <Button title="Kirim" onPress={sendMessage} disabled={!isOnline} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  offlineBanner: {
    backgroundColor: "#ff9800",
    padding: 8,
    alignItems: "center",
  },
  offlineText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 12,
  },
  listContent: {
    padding: 10,
  },
  msgBox: {
    padding: 10,
    marginVertical: 6,
    borderRadius: 6,
    maxWidth: "80%",
  },
  myMsg: {
    backgroundColor: "#d1f0ff",
    alignSelf: "flex-end",
  },
  otherMsg: {
    backgroundColor: "#eee",
    alignSelf: "flex-start",
  },
  sender: {
    fontWeight: "bold",
    fontSize: 12,
    marginBottom: 2,
  },
  inputRow: {
    flexDirection: "row",
    padding: 10,
    borderTopWidth: 1,
    borderColor: "#ccc",
  },
  input: {
    flex: 1,
    borderWidth: 1,
    marginRight: 10,
    padding: 8,
    borderRadius: 6,
  },
  inputDisabled: {
    backgroundColor: "#f0f0f0",
    borderColor: "#ddd",
  },
});