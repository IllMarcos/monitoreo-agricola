// services/reportService.ts
// Update the path below if your firebaseConfig file is located elsewhere
import { addDoc, collection, doc, serverTimestamp, updateDoc } from "firebase/firestore";
import { getDownloadURL, ref, uploadBytes } from "firebase/storage";
import { db, storage } from "../constants/firebaseConfig";

/**
 * Crea un reporte en Firestore y sube las imágenes a Storage.
 * reportData: objeto con todos los campos del formulario
 * localImageUris: array de URIs locales (expo image picker)
 */
export async function createReport(reportData: any, localImageUris: string[] = []) {
  try {
    // 1) crear documento inicial (sin images)
    const payload = {
      ...reportData,
      images: [],
      createdAt: serverTimestamp()
    };
    const colRef = collection(db, "reportes");
    const docRef = await addDoc(colRef, payload);

    // 2) subir imágenes (si hay)
    const urls: string[] = [];
    for (const uri of localImageUris) {
      const response = await fetch(uri);
      const blob = await response.blob();
      const filename = `reportes/${docRef.id}/${Date.now()}.jpg`;
      const storageRef = ref(storage, filename);
      await uploadBytes(storageRef, blob); // subir
      const url = await getDownloadURL(storageRef);
      urls.push(url);
    }

    // 3) actualizar doc con URLs
    if (urls.length > 0) {
      await updateDoc(doc(db, "reportes", docRef.id), { images: urls });
    }

    return { id: docRef.id };
  } catch (err) {
    console.error("createReport error:", err);
    throw err;
  }
}
