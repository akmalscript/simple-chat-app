import { storage, ref, getDownloadURL } from "../firebase";
import { uploadBytesResumable } from "firebase/storage";
import { launchImageLibrary, launchCamera, ImagePickerResponse, Asset } from "react-native-image-picker";
import { Alert } from "react-native";
import { decode as atob } from "base-64";

// Tipe untuk hasil upload
export interface UploadResult {
  success: boolean;
  url?: string;
  error?: string;
}

// Tipe untuk opsi image picker
export type ImageSourceType = "camera" | "gallery";

/**
 * Generate nama file unik untuk gambar
 */
const generateFileName = (userId: string): string => {
  const timestamp = Date.now();
  const randomString = Math.random().toString(36).substring(2, 8);
  return `chat-images/${userId}/${timestamp}_${randomString}.jpg`;
};

/**
 * Convert base64 ke Uint8Array
 */
const base64ToUint8Array = (base64: string): Uint8Array => {
  const binaryString = atob(base64);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
};

/**
 * Upload gambar ke Firebase Storage menggunakan base64
 */
export const uploadImageToStorage = async (
  base64Data: string,
  userId: string
): Promise<UploadResult> => {
  try {
    // Generate nama file unik
    const fileName = generateFileName(userId);
    
    // Buat reference ke Firebase Storage
    const storageRef = ref(storage, fileName);
    
    // Convert base64 ke Uint8Array
    const bytes = base64ToUint8Array(base64Data);
    
    // Upload gambar menggunakan uploadBytesResumable
    const uploadTask = uploadBytesResumable(storageRef, bytes, {
      contentType: 'image/jpeg',
    });
    
    // Tunggu upload selesai
    await new Promise<void>((resolve, reject) => {
      uploadTask.on(
        'state_changed',
        (snapshot) => {
          const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
          console.log('Upload progress:', progress.toFixed(0) + '%');
        },
        (error) => reject(error),
        () => resolve()
      );
    });
    
    // Dapatkan URL download
    const downloadURL = await getDownloadURL(storageRef);
    
    console.log("Image uploaded successfully:", downloadURL);
    
    return {
      success: true,
      url: downloadURL,
    };
  } catch (error: any) {
    console.error("Error uploading image:", error);
    return {
      success: false,
      error: error.message || "Gagal mengupload gambar",
    };
  }
};

/**
 * Memilih gambar dari galeri
 */
export const pickImageFromGallery = async (): Promise<Asset | null> => {
  return new Promise((resolve) => {
    launchImageLibrary(
      {
        mediaType: "photo",
        quality: 0.7,
        maxWidth: 800,
        maxHeight: 800,
        includeBase64: true, // Perlu base64 untuk upload
      },
      (response: ImagePickerResponse) => {
        if (response.didCancel) {
          console.log("User cancelled image picker");
          resolve(null);
        } else if (response.errorCode) {
          console.error("ImagePicker Error:", response.errorMessage);
          Alert.alert("Error", response.errorMessage || "Gagal memilih gambar");
          resolve(null);
        } else if (response.assets && response.assets.length > 0) {
          resolve(response.assets[0]);
        } else {
          resolve(null);
        }
      }
    );
  });
};

/**
 * Mengambil gambar dari kamera
 */
export const takePhotoFromCamera = async (): Promise<Asset | null> => {
  return new Promise((resolve) => {
    launchCamera(
      {
        mediaType: "photo",
        quality: 0.7,
        maxWidth: 800,
        maxHeight: 800,
        saveToPhotos: false,
        includeBase64: true, // Perlu base64 untuk upload
      },
      (response: ImagePickerResponse) => {
        if (response.didCancel) {
          console.log("User cancelled camera");
          resolve(null);
        } else if (response.errorCode) {
          console.error("Camera Error:", response.errorMessage);
          Alert.alert("Error", response.errorMessage || "Gagal mengambil foto");
          resolve(null);
        } else if (response.assets && response.assets.length > 0) {
          resolve(response.assets[0]);
        } else {
          resolve(null);
        }
      }
    );
  });
};

/**
 * Menampilkan dialog untuk memilih sumber gambar
 */
export const showImagePickerOptions = (): Promise<ImageSourceType | null> => {
  return new Promise((resolve) => {
    Alert.alert(
      "Upload Gambar",
      "Pilih sumber gambar",
      [
        {
          text: "Kamera",
          onPress: () => resolve("camera"),
        },
        {
          text: "Galeri",
          onPress: () => resolve("gallery"),
        },
        {
          text: "Batal",
          style: "cancel",
          onPress: () => resolve(null),
        },
      ],
      { cancelable: true }
    );
  });
};

/**
 * Fungsi utama untuk memilih dan upload gambar
 */
export const selectAndUploadImage = async (
  userId: string
): Promise<UploadResult> => {
  try {
    // Tampilkan dialog pilihan sumber gambar
    const source = await showImagePickerOptions();
    
    if (!source) {
      return { success: false, error: "Dibatalkan" };
    }
    
    // Pilih gambar berdasarkan sumber
    let asset: Asset | null = null;
    
    if (source === "camera") {
      asset = await takePhotoFromCamera();
    } else {
      asset = await pickImageFromGallery();
    }
    
    if (!asset || !asset.base64) {
      return { success: false, error: "Tidak ada gambar dipilih" };
    }
    
    // Upload gambar ke Firebase Storage menggunakan base64
    const result = await uploadImageToStorage(asset.base64, userId);
    
    return result;
  } catch (error: any) {
    console.error("Error in selectAndUploadImage:", error);
    return {
      success: false,
      error: error.message || "Terjadi kesalahan",
    };
  }
};
