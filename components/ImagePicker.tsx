// app/components/ImagePicker.tsx
import * as ImagePicker from "expo-image-picker";
import React, { useState } from "react";
import { Alert, Button, Image, ScrollView, View } from "react-native";

export default function ImagePickerComponent({ onChange }: any) {
  const [uris, setUris] = useState<string[]>([]);

  const askAndLaunchCamera = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Permisos", "Necesitamos permisos de cámara");
      return;
    }
    const result = await ImagePicker.launchCameraAsync({ quality: 0.6 });
    if (!result.canceled) {
      const uri = result.assets[0].uri;
      const next = [...uris, uri];
      setUris(next);
      if (onChange) onChange(next);
    }
  };

  const askAndPickFromGallery = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Permisos", "Necesitamos permisos de galería");
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, quality: 0.6, selectionLimit: 5});
    if (!result.canceled) {
      // result.assets can have multiple if selectionLimit>1
      const selected = result.assets.map((a:any) => a.uri);
      const next = [...uris, ...selected];
      setUris(next);
      if (onChange) onChange(next);
    }
  };

  return (
    <View style={{ marginTop: 8 }}>
      <Button title="Tomar foto" onPress={askAndLaunchCamera} />
      <View style={{height:8}}/>
      <Button title="Elegir desde galería" onPress={askAndPickFromGallery} />
      <ScrollView horizontal style={{ marginTop: 10 }}>
        {uris.map((u, i) => (
          <Image key={i} source={{ uri: u }} style={{ width: 120, height: 90, marginRight: 10, borderRadius: 6 }} />
        ))}
      </ScrollView>
    </View>
  );
}
