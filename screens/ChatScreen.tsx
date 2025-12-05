import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  TextInput,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Alert,
} from "react-native";
import NetInfo from "@react-native-community/netinfo";
import { launchImageLibrary } from "react-native-image-picker";
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
  imageData?: string; // Base64 data URI (opsional)
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
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

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

  // Fungsi pilih gambar dari galeri
  const pickImage = async () => {
    if (!isOnline) {
      Alert.alert("Offline", "Tidak bisa upload gambar saat offline");
      return;
    }

    const result = await launchImageLibrary({
      mediaType: 'photo',
      quality: 0.4,
      maxWidth: 600,
      maxHeight: 600,
      includeBase64: true,
    });

    const asset = result.assets?.[0];
    if (!asset || !asset.base64) return;

    const mime = asset.type || 'image/jpeg';
    const dataUri = `data:${mime};base64,${asset.base64}`;

    // Cek ukuran (Firestore limit ~1MB per document)
    if (dataUri.length > 900000) {
      Alert.alert("Gambar terlalu besar", "Pilih gambar yang lebih kecil (< 1MB).");
      return;
    }

    setSelectedImage(dataUri);
  };

  // Fungsi kirim pesan (dengan atau tanpa gambar)
  const sendMessage = async () => {
    if (!message.trim() && !selectedImage) return;
    
    if (!isOnline) {
      Alert.alert("Offline", "Tidak bisa mengirim pesan saat offline");
      return;
    }

    setIsUploading(true);
    
    try {
      await addDoc(messagesCollection, {
        text: message,
        imageData: selectedImage || null,
        user: displayName,
        userId: currentUser?.uid || "",
        createdAt: serverTimestamp(),
      });
      
      setMessage("");
      setSelectedImage(null);
      console.log("Message sent successfully");
    } catch (error: any) {
      console.error("Error sending message:", error);
      Alert.alert("Error", "Gagal mengirim pesan");
    } finally {
      setIsUploading(false);
    }
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
        {/* Tampilkan gambar jika ada */}
        {item.imageData && (
          <Image
            source={{ uri: item.imageData }}
            style={styles.messageImage}
            resizeMode="cover"
          />
        )}
        {/* Tampilkan teks jika ada */}
        {item.text ? <Text>{item.text}</Text> : null}
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

      {/* Preview gambar yang dipilih */}
      {selectedImage && (
        <View style={styles.previewContainer}>
          <Image source={{ uri: selectedImage }} style={styles.previewImage} />
          <TouchableOpacity onPress={() => setSelectedImage(null)} style={styles.closeButton}>
            <Text style={styles.closeButtonText}>✕</Text>
          </TouchableOpacity>
        </View>
      )}
      
      <View style={styles.inputRow}>
        {/* Tombol Upload Gambar */}
        <TouchableOpacity
          style={[styles.imageButton, (!isOnline || isUploading) && styles.imageButtonDisabled]}
          onPress={pickImage}
          disabled={!isOnline || isUploading}
        >
          {isUploading ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Text style={styles.imageButtonText}>📷</Text>
          )}
        </TouchableOpacity>
        
        <TextInput
          style={[styles.input, !isOnline && styles.inputDisabled]}
          placeholder={isOnline ? "Ketik pesan..." : "Tidak bisa mengirim (offline)"}
          value={message}
          onChangeText={setMessage}
          editable={isOnline && !isUploading}
        />
        <TouchableOpacity
          style={[styles.sendButton, (!isOnline || isUploading || (!message.trim() && !selectedImage)) && styles.sendButtonDisabled]}
          onPress={sendMessage}
          disabled={!isOnline || isUploading || (!message.trim() && !selectedImage)}
        >
          {isUploading ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Text style={styles.sendButtonText}>Kirim</Text>
          )}
        </TouchableOpacity>
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
    alignItems: "center",
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
  imageButton: {
    backgroundColor: "#007bff",
    padding: 10,
    borderRadius: 6,
    marginRight: 10,
    justifyContent: "center",
    alignItems: "center",
    width: 44,
    height: 44,
  },
  imageButtonDisabled: {
    backgroundColor: "#ccc",
  },
  imageButtonText: {
    fontSize: 20,
  },
  messageImage: {
    width: 200,
    height: 200,
    borderRadius: 8,
    marginTop: 4,
    marginBottom: 4,
  },
  previewContainer: {
    padding: 10,
    borderTopWidth: 1,
    borderColor: "#ccc",
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f5f5f5",
  },
  previewImage: {
    width: 80,
    height: 80,
    borderRadius: 8,
  },
  closeButton: {
    position: "absolute",
    top: 5,
    left: 75,
    backgroundColor: "#ff4444",
    borderRadius: 12,
    width: 24,
    height: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  closeButtonText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 12,
  },
  sendButton: {
    backgroundColor: "#22c55e",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 6,
    alignItems: "center",
  },
  sendButtonDisabled: {
    opacity: 0.6,
  },
  sendButtonText: {
    color: "#fff",
    fontWeight: "bold",
  },
});