import AsyncStorage from "@react-native-async-storage/async-storage";

// Keys untuk AsyncStorage
const KEYS = {
  REMEMBER_ME: "@chatapp_remember_me",
  LAST_ACTIVITY: "@chatapp_last_activity",
  SESSION_TIMEOUT_DAYS: "@chatapp_session_timeout",
  USER_CREDENTIALS: "@chatapp_user_credentials",
};

// Default timeout: 7 hari (dalam milidetik)
const DEFAULT_TIMEOUT_DAYS = 7;
const DAY_IN_MS = 24 * 60 * 60 * 1000;

/**
 * Menyimpan preferensi "Ingat Saya"
 */
export const setRememberMe = async (value: boolean): Promise<void> => {
  try {
    await AsyncStorage.setItem(KEYS.REMEMBER_ME, JSON.stringify(value));
    if (value) {
      // Jika ingat saya diaktifkan, simpan waktu aktivitas terakhir
      await updateLastActivity();
    } else {
      // Jika tidak ingat saya, hapus data aktivitas
      await AsyncStorage.removeItem(KEYS.LAST_ACTIVITY);
    }
    console.log("Remember me saved:", value);
  } catch (error) {
    console.error("Error saving remember me preference:", error);
  }
};

/**
 * Mendapatkan preferensi "Ingat Saya"
 */
export const getRememberMe = async (): Promise<boolean> => {
  try {
    const value = await AsyncStorage.getItem(KEYS.REMEMBER_ME);
    console.log("Reading remember me from storage:", value);
    return value ? JSON.parse(value) : false;
  } catch (error) {
    console.error("Error reading remember me preference:", error);
    return false;
  }
};

/**
 * Update waktu aktivitas terakhir
 */
export const updateLastActivity = async (): Promise<void> => {
  try {
    await AsyncStorage.setItem(KEYS.LAST_ACTIVITY, Date.now().toString());
  } catch (error) {
    console.error("Error updating last activity:", error);
  }
};

/**
 * Mendapatkan waktu aktivitas terakhir
 */
export const getLastActivity = async (): Promise<number | null> => {
  try {
    const value = await AsyncStorage.getItem(KEYS.LAST_ACTIVITY);
    return value ? parseInt(value, 10) : null;
  } catch (error) {
    console.error("Error reading last activity:", error);
    return null;
  }
};

/**
 * Mengecek apakah sesi sudah expired berdasarkan timeout
 */
export const isSessionExpired = async (): Promise<boolean> => {
  try {
    // Baca semua data sekaligus untuk menghindari race condition
    const values = await AsyncStorage.multiGet([
      KEYS.REMEMBER_ME,
      KEYS.LAST_ACTIVITY,
      KEYS.SESSION_TIMEOUT_DAYS,
    ]);

    const rememberMeValue = values[0][1];
    const lastActivityValue = values[1][1];
    const timeoutDaysValue = values[2][1];

    console.log("Session check - rememberMe:", rememberMeValue, "lastActivity:", lastActivityValue);

    // Parse nilai
    const rememberMe = rememberMeValue ? JSON.parse(rememberMeValue) : false;
    
    // Jika tidak memilih "Ingat Saya", anggap expired (harus login ulang)
    if (!rememberMe) {
      console.log("Remember me is false, session expired");
      return true;
    }

    const lastActivity = lastActivityValue ? parseInt(lastActivityValue, 10) : null;
    if (!lastActivity) {
      console.log("No last activity found, session expired");
      return true;
    }

    const timeoutDays = timeoutDaysValue ? parseInt(timeoutDaysValue, 10) : DEFAULT_TIMEOUT_DAYS;
    const timeoutMs = timeoutDays * DAY_IN_MS;
    const timeSinceLastActivity = Date.now() - lastActivity;

    const expired = timeSinceLastActivity > timeoutMs;
    console.log("Session expired check:", expired, "timeSinceLastActivity:", timeSinceLastActivity, "timeoutMs:", timeoutMs);
    
    return expired;
  } catch (error) {
    console.error("Error checking session expiry:", error);
    return true;
  }
};

/**
 * Set timeout hari untuk auto-logout
 */
export const setSessionTimeoutDays = async (days: number): Promise<void> => {
  try {
    await AsyncStorage.setItem(KEYS.SESSION_TIMEOUT_DAYS, days.toString());
  } catch (error) {
    console.error("Error saving session timeout:", error);
  }
};

/**
 * Mendapatkan timeout hari untuk auto-logout
 */
export const getSessionTimeoutDays = async (): Promise<number> => {
  try {
    const value = await AsyncStorage.getItem(KEYS.SESSION_TIMEOUT_DAYS);
    return value ? parseInt(value, 10) : DEFAULT_TIMEOUT_DAYS;
  } catch (error) {
    console.error("Error reading session timeout:", error);
    return DEFAULT_TIMEOUT_DAYS;
  }
};

/**
 * Hapus semua data sesi saat logout
 */
export const clearSessionData = async (): Promise<void> => {
  try {
    await AsyncStorage.multiRemove([
      KEYS.REMEMBER_ME,
      KEYS.LAST_ACTIVITY,
    ]);
  } catch (error) {
    console.error("Error clearing session data:", error);
  }
};

/**
 * Mendapatkan info sesi untuk debugging
 */
export const getSessionInfo = async (): Promise<{
  rememberMe: boolean;
  lastActivity: number | null;
  timeoutDays: number;
  isExpired: boolean;
}> => {
  const rememberMe = await getRememberMe();
  const lastActivity = await getLastActivity();
  const timeoutDays = await getSessionTimeoutDays();
  const isExpired = await isSessionExpired();

  return {
    rememberMe,
    lastActivity,
    timeoutDays,
    isExpired,
  };
};
