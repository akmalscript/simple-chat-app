import AsyncStorage from "@react-native-async-storage/async-storage";

// Key untuk menyimpan chat history
const CHAT_HISTORY_KEY = "@chatapp_chat_history";
const MAX_MESSAGES = 500; // Maksimal pesan yang disimpan

// Tipe untuk message
export interface StoredMessage {
  id: string;
  text: string;
  user: string;
  userId: string;
  createdAt: { seconds: number; nanoseconds: number } | null;
}

/**
 * Menyimpan chat history ke AsyncStorage
 */
export const saveChatHistory = async (messages: StoredMessage[]): Promise<void> => {
  try {
    // Batasi jumlah pesan yang disimpan
    const messagesToSave = messages.slice(-MAX_MESSAGES);
    await AsyncStorage.setItem(CHAT_HISTORY_KEY, JSON.stringify(messagesToSave));
    console.log(`Chat history saved: ${messagesToSave.length} messages`);
  } catch (error) {
    console.error("Error saving chat history:", error);
  }
};

/**
 * Mengambil chat history dari AsyncStorage
 */
export const getChatHistory = async (): Promise<StoredMessage[]> => {
  try {
    const data = await AsyncStorage.getItem(CHAT_HISTORY_KEY);
    if (data) {
      const messages = JSON.parse(data) as StoredMessage[];
      console.log(`Chat history loaded: ${messages.length} messages`);
      return messages;
    }
    return [];
  } catch (error) {
    console.error("Error loading chat history:", error);
    return [];
  }
};

/**
 * Menghapus chat history dari AsyncStorage
 */
export const clearChatHistory = async (): Promise<void> => {
  try {
    await AsyncStorage.removeItem(CHAT_HISTORY_KEY);
    console.log("Chat history cleared");
  } catch (error) {
    console.error("Error clearing chat history:", error);
  }
};

/**
 * Menambahkan satu pesan ke history (untuk pesan yang dikirim saat offline)
 */
export const addMessageToHistory = async (message: StoredMessage): Promise<void> => {
  try {
    const existingMessages = await getChatHistory();
    const updatedMessages = [...existingMessages, message].slice(-MAX_MESSAGES);
    await saveChatHistory(updatedMessages);
  } catch (error) {
    console.error("Error adding message to history:", error);
  }
};
