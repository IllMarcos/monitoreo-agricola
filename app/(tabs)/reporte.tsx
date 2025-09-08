// app/(tabs)/reporte.tsx
import React, { useState } from "react";
import { ActivityIndicator, Alert, Button, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import ImagePickerComponent from "../../components/ImagePicker";
import MapPicker from "../../components/MapPicker";
import { createReport } from "../services/reportService";

/** listas basicas tomadas de la hoja (puedes editar) */
const PLAGAS = [
  "Ácaros","Gusano Alfiler","Gusano del Cuerno","Gusano Cogollero","Gusano del Fruto",
  "Gusano Falso Medidor","G. Minador de la Hoja","Gusano Peludo","Gusano Soldado",
  "Gusano Trozador","Grillos","Gallina Ciega","Mosca Blanca","Pulgón","Pulga Saltosa","Trips","Chicharritas"
];
const ENFERMEDADES = [
  "Tizón Temprano","Tizón Tardío","Mildiu Velloso","Cenicilla","Mosaico Común","Chahuixtle",
  "Antracnosis","Moho de la Hoja","Damping Off","Corynespora","Fusarium","Mancha Bacteriana",
  "Moho Blanco","Mancha Gris","Cáncer Bacteriana","Botrytis","Otros"
];

export default function ReporteScreen() {
  const [folio, setFolio] = useState("");
  const [fecha, setFecha] = useState(new Date().toISOString().slice(0,10));
  const [cultivo, setCultivo] = useState("");
  const [superficie, setSuperficie] = useState("");
  const [responsable, setResponsable] = useState("");
  const [observaciones, setObservaciones] = useState("");
  const [ubicacion, setUbicacion] = useState<{lat:number;lng:number} | null>(null);
  const [imagenes, setImagenes] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);

  // plagas/enfermedades: guardamos un mapa nombre -> {estadoBiologico, grado}
  const [plagasState, setPlagasState] = useState<any>(PLAGAS.reduce((acc, name) => ({...acc, [name]: { estadoBiologico: "", grado:"" }}), {}));
  const [enfState, setEnfState] = useState<any>(ENFERMEDADES.reduce((acc, name) => ({...acc, [name]: { grado:"" }}), {}));

  const onSave = async () => {
    if (!cultivo) { Alert.alert("Falta", "Ingresa el cultivo"); return; }
    setSaving(true);
    try {
      const payload = {
        folio,
        fecha,
        cultivo,
        superficie,
        responsable,
        plagas: plagasState,
        enfermedades: enfState,
        observaciones,
        ubicacion,
        empresa: "COMERCIALIZADORA AGRÍCOLA AAA S.A. DE C.V."
      };
      const res = await createReport(payload, imagenes);
      Alert.alert("Guardado", "Reporte guardado con ID: " + res.id);
      // limpiar formulario si quieres
    } catch (err:any) {
      console.error(err);
      Alert.alert("Error", err.message || "Error al guardar");
    } finally {
      setSaving(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={{padding:16}}>
      <Text style={styles.h1}>Reporte de Inspección de Campo</Text>

      <Text>Folio</Text>
      <TextInput style={styles.input} value={folio} onChangeText={setFolio} placeholder="Folio (opcional)" />

      <Text>Fecha</Text>
      <TextInput style={styles.input} value={fecha} onChangeText={setFecha} placeholder="YYYY-MM-DD" />

      <Text>Cultivo</Text>
      <TextInput style={styles.input} value={cultivo} onChangeText={setCultivo} placeholder="Ej: Maíz" />

      <Text>Superficie</Text>
      <TextInput style={styles.input} value={superficie} onChangeText={setSuperficie} placeholder="ha / m2" />

      <Text>Responsable</Text>
      <TextInput style={styles.input} value={responsable} onChangeText={setResponsable} placeholder="Nombre del inspector" />

      <View style={{height:12}} />

      <Text style={{fontWeight:"bold", marginBottom:6}}>Ubicación (selecciona en el mapa)</Text>
      <MapPicker initialLat={20.5} initialLng={-103.4} onLocationSelect={(p:any) => setUbicacion(p)} />
      <Text style={{marginTop:6}}>Coordenadas: {ubicacion ? `${ubicacion.lat.toFixed(5)}, ${ubicacion.lng.toFixed(5)}` : "No seleccionada"}</Text>

      <View style={{height:12}} />

      <Text style={{fontWeight:"bold"}}>Plagas (ingresa estado biológico y grado de infestación)</Text>
      {PLAGAS.map((name) => (
        <View key={name} style={{marginTop:6, padding:6, borderWidth:1, borderColor:"#eee", borderRadius:6}}>
          <Text style={{fontWeight:"600"}}>{name}</Text>
          <TextInput placeholder="Estado biológico (H/L/P/A/N)" value={plagasState[name].estadoBiologico} onChangeText={(t)=>setPlagasState((s:any)=>({...s,[name]:{...s[name], estadoBiologico:t}}))} style={styles.smallInput} />
          <TextInput placeholder="Grado infestación (P/B/M/F)" value={plagasState[name].grado} onChangeText={(t)=>setPlagasState((s:any)=>({...s,[name]:{...s[name], grado:t}}))} style={styles.smallInput} />
        </View>
      ))}

      <View style={{height:12}} />
      <Text style={{fontWeight:"bold"}}>Enfermedades</Text>
      {ENFERMEDADES.map((name) => (
        <View key={name} style={{marginTop:6, padding:6, borderWidth:1, borderColor:"#eee", borderRadius:6}}>
          <Text style={{fontWeight:"600"}}>{name}</Text>
          <TextInput placeholder="Grado infestación (P/B/M/F)" value={enfState[name].grado} onChangeText={(t)=>setEnfState((s:any)=>({...s,[name]:{...s[name], grado:t}}))} style={styles.smallInput} />
        </View>
      ))}

      <View style={{height:12}} />
      <Text>Observaciones</Text>
      <TextInput value={observaciones} onChangeText={setObservaciones} multiline style={[styles.input, {height:100}]} />

      <Text style={{marginTop:8, marginBottom:6}}>Fotos (observaciones)</Text>
      <ImagePickerComponent onChange={(uris:any)=>setImagenes(uris)} />

      <View style={{height:16}} />
      {saving ? <ActivityIndicator size="large" /> : <Button title="Guardar Reporte" onPress={onSave} />}

      <View style={{height:50}} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container:{flex:1, backgroundColor:"#fff"},
  h1:{fontSize:18, fontWeight:"700", marginBottom:12},
  input:{borderWidth:1, borderColor:"#ddd", padding:8, borderRadius:6, marginBottom:8},
  smallInput:{borderWidth:1, borderColor:"#ddd", padding:6, borderRadius:6, marginTop:6}
});
