// app/(tabs)/reporte.tsx
import React, { useState } from "react";
import { ScrollView, StyleSheet, View } from "react-native";
import { Button, Card, Dialog, List, Menu, Paragraph, Portal, Text, TextInput, Title } from "react-native-paper";
import ImagePickerComponent from "../../components/ImagePicker";
import MapPicker from "../../components/MapPicker";
import { createReport, generatePdf } from "../services/reportService";

// --- Opciones para los desplegables ---
const ESTADO_BIOLOGICO_OPTIONS = ["Huevo", "Larva", "Pupa", "Adulto", "Ninfa"];
const GRADO_INFESTACION_OPTIONS = ["Presente", "Bajo", "Medio", "Fuerte"];

// --- Listas de Plagas y Enfermedades ---
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

// --- TIPO PARA EL PAYLOAD DEL REPORTE ---
type ReportPayload = {
  folio: string;
  fecha: string;
  cultivo: string;
  superficie: string;
  responsable: string;
  observaciones: string;
  ubicacion: { lat: number; lng: number } | null;
  plagas: any;
  enfermedades: any;
  empresa: string;
  images: string[];
};

// --- Componente reutilizable para el Dropdown ---
const DropdownPicker = ({ label, value, onSelect, options }: { label: string; value: string; onSelect: (value: string) => void; options: string[] }) => {
  const [visible, setVisible] = useState(false);
  const openMenu = () => setVisible(true);
  const closeMenu = () => setVisible(false);

  return (
    <Menu
      visible={visible}
      onDismiss={closeMenu}
      anchor={
        <Button mode="outlined" onPress={openMenu} style={styles.dropdown} contentStyle={{ justifyContent: 'space-between' }} icon="chevron-down" textColor="#333">
          {value || label}
        </Button>
      }
    >
      {options.map(option => (
        <Menu.Item
          key={option}
          onPress={() => {
            onSelect(option);
            closeMenu();
          }}
          title={option}
        />
      ))}
    </Menu>
  );
};

export default function ReporteScreen() {
  const [folio, setFolio] = useState("");
  const [fecha, setFecha] = useState(new Date().toISOString().slice(0, 10));
  const [cultivo, setCultivo] = useState("");
  const [superficie, setSuperficie] = useState("");
  const [responsable, setResponsable] = useState("");
  const [observaciones, setObservaciones] = useState("");
  const [ubicacion, setUbicacion] = useState<{ lat: number; lng: number } | null>(null);
  const [imagenes, setImagenes] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);

  const [plagasState, setPlagasState] = useState<any>(PLAGAS.reduce((acc, name) => ({ ...acc, [name]: { estadoBiologico: "", grado: "" } }), {}));
  const [enfState, setEnfState] = useState<any>(ENFERMEDADES.reduce((acc, name) => ({ ...acc, [name]: { grado: "" } }), {}));
  
  const [plagasExpanded, setPlagasExpanded] = useState(false);
  const [enfermedadesExpanded, setEnfermedadesExpanded] = useState(false);

  const [dialog, setDialog] = useState<{ visible: boolean; title: string; message: string; reportData?: ReportPayload }>({ visible: false, title: '', message: '' });

  const handleUpdatePlaga = (name: string, field: 'estadoBiologico' | 'grado', value: string) => {
    setPlagasState((prevState: any) => ({
      ...prevState,
      [name]: { ...prevState[name], [field]: value },
    }));
  };

  const handleUpdateEnfermedad = (name: string, value: string) => {
    setEnfState((prevState: any) => ({
      ...prevState,
      [name]: { ...prevState[name], grado: value },
    }));
  };

  const onSave = async () => {
    if (!cultivo || !responsable) {
      setDialog({ visible: true, title: 'Campos requeridos', message: 'Por favor, completa los campos de Cultivo y Responsable.' });
      return;
    }
    setSaving(true);
    try {
      const payload: ReportPayload = {
        folio, fecha, cultivo, superficie, responsable, observaciones, ubicacion,
        plagas: plagasState,
        enfermedades: enfState,
        empresa: "COMERCIALIZADORA AGRÍCOLA AAA S.A. DE C.V.",
        images: [],
      };

      const res = await createReport(payload, imagenes);
      
      if (res.imageUrls) {
        payload.images = res.imageUrls; 
      }

      setDialog({
        visible: true,
        title: 'Éxito',
        message: `Reporte guardado con ID: ${res.id}`,
        reportData: payload
      });
      
    } catch (err: any) {
      console.error(err);
      setDialog({ visible: true, title: 'Error', message: err.message || 'Ocurrió un error al guardar el reporte.' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
        <Title style={styles.headerTitle}>Reporte de Inspección de Campo</Title>

        <Card style={styles.card}>
          <Card.Content>
            <Title>Datos Generales</Title>
            <TextInput label="Folio (opcional)" value={folio} onChangeText={setFolio} style={styles.input} mode="outlined" />
            <TextInput label="Fecha" value={fecha} onChangeText={setFecha} style={styles.input} mode="outlined" />
            <TextInput label="Cultivo" value={cultivo} onChangeText={setCultivo} style={styles.input} mode="outlined" />
            <TextInput label="Superficie" value={superficie} onChangeText={setSuperficie} style={styles.input} mode="outlined" />
            <TextInput label="Responsable" value={responsable} onChangeText={setResponsable} style={styles.input} mode="outlined" />
          </Card.Content>
        </Card>
        
        <Card style={styles.card}>
          <Card.Content>
            <Title>Ubicación</Title>
            <Text style={styles.label}>Selecciona el punto en el mapa</Text>
            <MapPicker onLocationSelect={setUbicacion} />
            <Text style={styles.coordsText}>
              {ubicacion ? `Lat: ${ubicacion.lat.toFixed(5)}, Lng: ${ubicacion.lng.toFixed(5)}` : "Ubicación no seleccionada"}
            </Text>
          </Card.Content>
        </Card>

        <List.Section>
          <List.Accordion
            title="Plagas Detectadas"
            expanded={plagasExpanded}
            onPress={() => setPlagasExpanded(!plagasExpanded)}
            style={styles.accordion}
            titleStyle={styles.accordionTitle}
          >
            <Card style={styles.card}>
              <Card.Content>
                {PLAGAS.map((name) => (
                  <View key={name} style={styles.itemContainer}>
                    <Text style={styles.itemName}>{name}</Text>
                    <DropdownPicker
                      label="Estado Biológico"
                      value={plagasState[name].estadoBiologico}
                      onSelect={(value) => handleUpdatePlaga(name, 'estadoBiologico', value)}
                      options={ESTADO_BIOLOGICO_OPTIONS}
                    />
                    <DropdownPicker
                      label="Grado Infestación"
                      value={plagasState[name].grado}
                      onSelect={(value) => handleUpdatePlaga(name, 'grado', value)}
                      options={GRADO_INFESTACION_OPTIONS}
                    />
                  </View>
                ))}
              </Card.Content>
            </Card>
          </List.Accordion>

          <List.Accordion
            title="Enfermedades Detectadas"
            expanded={enfermedadesExpanded}
            onPress={() => setEnfermedadesExpanded(!enfermedadesExpanded)}
            style={styles.accordion}
            titleStyle={styles.accordionTitle}
          >
            <Card style={styles.card}>
              <Card.Content>
                {ENFERMEDADES.map((name) => (
                  <View key={name} style={styles.itemContainer}>
                    <Text style={styles.itemName}>{name}</Text>
                    <DropdownPicker
                      label="Grado Infestación"
                      value={enfState[name].grado}
                      onSelect={(value) => handleUpdateEnfermedad(name, value)}
                      options={GRADO_INFESTACION_OPTIONS}
                    />
                  </View>
                ))}
              </Card.Content>
            </Card>
          </List.Accordion>
        </List.Section>

        <Card style={styles.card}>
          <Card.Content>
            <Title>Observaciones y Evidencia</Title>
            <TextInput label="Observaciones generales" value={observaciones} onChangeText={setObservaciones} multiline numberOfLines={4} style={styles.input} mode="outlined" />
            <ImagePickerComponent onChange={setImagenes} />
          </Card.Content>
        </Card>

        <Button
          mode="contained"
          onPress={onSave}
          disabled={saving}
          loading={saving}
          style={styles.saveButton}
          icon="content-save"
        >
          {saving ? 'Guardando...' : 'Guardar Reporte'}
        </Button>
      </ScrollView>

      <Portal>
        <Dialog visible={dialog.visible} onDismiss={() => setDialog({ ...dialog, visible: false, reportData: undefined })}>
          <Dialog.Title>{dialog.title}</Dialog.Title>
          <Dialog.Content>
            <Paragraph>{dialog.message}</Paragraph>
          </Dialog.Content>
          <Dialog.Actions>
            {dialog.title === 'Éxito' && dialog.reportData && (
              <Button 
                icon="file-pdf-box"
                onPress={() => generatePdf(dialog.reportData)}
              >
                Exportar a PDF
              </Button>
            )}
            <Button onPress={() => setDialog({ ...dialog, visible: false, reportData: undefined })}>OK</Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </>
  );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#f0f4f7",
    },
    contentContainer: {
        padding: 16,
    },
    headerTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 16,
        textAlign: 'center',
        color: '#333',
    },
    card: {
        marginBottom: 16,
        elevation: 2,
    },
    accordion: {
        backgroundColor: '#ffffff',
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#e0e0e0',
        marginBottom: 16,
    },
    accordionTitle: {
        fontSize: 18,
        fontWeight: '600',
    },
    input: {
        marginBottom: 12,
    },
    label: {
        fontSize: 14,
        color: '#555',
        marginBottom: 8,
    },
    coordsText: {
        marginTop: 8,
        fontSize: 12,
        color: '#666',
        textAlign: 'center',
    },
    itemContainer: {
        marginBottom: 16,
        paddingBottom: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
    },
    itemName: {
        fontSize: 16,
        fontWeight: '600',
        marginBottom: 8,
    },
    dropdown: {
        backgroundColor: '#fafafa',
        marginTop: 8,
    },
    saveButton: {
        marginTop: 16,
        paddingVertical: 8,
        borderRadius: 8,
    },
});