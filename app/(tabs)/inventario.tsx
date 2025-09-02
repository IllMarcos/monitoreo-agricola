import React, { useState, useEffect } from "react";
import { View, FlatList, StyleSheet, Alert } from "react-native";
import {
  Text,
  Button,
  TextInput,
  Card,
  Title,
  Paragraph,
  FAB,
  Portal,
  Dialog,
} from "react-native-paper";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as XLSX from 'xlsx';
import * as Sharing from 'expo-sharing';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system';

type Producto = {
  id: string;
  nombre: string;
  cantidad: number;
  precio: number;
  stockMinimo: number;
};

// Paleta de colores
const colores = {
  primario: "#2e7d32",
  fondo: "#f5f5f5",
  card: "#ffffff",
  suave: "#e8f5e9",
  texto: "#333333",
  textoSuave: "#666666",
};

export default function InventarioScreen() {
  const [productos, setProductos] = useState<Producto[]>([]);
  const [nombre, setNombre] = useState("");
  const [cantidad, setCantidad] = useState("");
  const [precio, setPrecio] = useState("");
  const [stockMinimo, setStockMinimo] = useState("");
  const [dialogVisible, setDialogVisible] = useState(false);
  const [movementDialogVisible, setMovementDialogVisible] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Producto | null>(null);
  const [movementQuantity, setMovementQuantity] = useState("");
  
  // Nuevos estados para manejar errores con un Dialog
  const [errorDialogVisible, setErrorDialogVisible] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  // Cargar productos al iniciar
  useEffect(() => {
    const cargarDatos = async () => {
      try {
        const data = await AsyncStorage.getItem("productos");
        if (data) {
          setProductos(JSON.parse(data));
        }
      } catch (error) {
        console.error("Error cargando inventario:", error);
      }
    };
    cargarDatos();
  }, []);

  // Guardar productos cada vez que cambien
  useEffect(() => {
    const guardarDatos = async () => {
      try {
        await AsyncStorage.setItem("productos", JSON.stringify(productos));
      } catch (error) {
        console.error("Error guardando inventario:", error);
      }
    };
    guardarDatos();
  }, [productos]);

  const mostrarError = (mensaje: string) => {
    setErrorMessage(mensaje);
    setErrorDialogVisible(true);
  };

  const agregarProducto = () => {
    if (!nombre || !cantidad || !precio || !stockMinimo) {
      mostrarError("Completa todos los campos");
      return;
    }

    const nuevo: Producto = {
      id: Date.now().toString(),
      nombre,
      cantidad: parseInt(cantidad),
      precio: parseFloat(precio),
      stockMinimo: parseInt(stockMinimo),
    };

    setProductos([...productos, nuevo]);
    setNombre("");
    setCantidad("");
    setPrecio("");
    setStockMinimo("");
    setDialogVisible(false);
  };

  const eliminarProducto = (id: string) => {
    // Se usa Alert.alert para la confirmación nativa, ya que es la forma recomendada en React Native.
    Alert.alert("Eliminar", "¿Seguro que deseas eliminar este producto?", [
      { text: "Cancelar", style: "cancel" },
      {
        text: "Eliminar",
        style: "destructive",
        onPress: () => setProductos(productos.filter((p) => p.id !== id)),
      },
    ]);
  };

  // Función para manejar la entrada de productos
  const handleEntrada = () => {
    if (!selectedProduct || !movementQuantity || parseInt(movementQuantity) <= 0) {
      mostrarError("Ingresa una cantidad válida para la entrada.");
      return;
    }

    const cantidadEntrada = parseInt(movementQuantity);
    const updatedProductos = productos.map(p =>
      p.id === selectedProduct.id ? { ...p, cantidad: p.cantidad + cantidadEntrada } : p
    );
    setProductos(updatedProductos);
    setMovementQuantity("");
    setMovementDialogVisible(false);
  };

  // Función para manejar la salida de productos
  const handleSalida = () => {
    if (!selectedProduct || !movementQuantity || parseInt(movementQuantity) <= 0) {
      mostrarError("Ingresa una cantidad válida para la salida.");
      return;
    }

    const cantidadSalida = parseInt(movementQuantity);
    if (selectedProduct.cantidad - cantidadSalida < 0) {
      mostrarError("No puedes sacar más productos de los que hay en stock.");
      return;
    }

    const updatedProductos = productos.map(p =>
      p.id === selectedProduct.id ? { ...p, cantidad: p.cantidad - cantidadSalida } : p
    );
    setProductos(updatedProductos);
    setMovementQuantity("");
    setMovementDialogVisible(false);
  };

  // Función de importación de Excel
  const handleImportExcel = async () => {
    try {
      const res = await DocumentPicker.getDocumentAsync({
        copyToCacheDirectory: true,
        type: ['application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'],
      });
  
      if (!res.canceled && res.assets) {
        const file = res.assets[0];
        const fileContent = await fetch(file.uri).then(res => res.arrayBuffer());
        const workbook = XLSX.read(fileContent, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const jsonProductos = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
  
        // Suponiendo que la primera fila son los encabezados y las siguientes son los datos
        const headers = (jsonProductos[0] as string[]).map(header => header.trim());
        const dataRows = jsonProductos.slice(1);

        // Validar que el archivo contenga las columnas correctas
        if (!headers.includes('nombre') || !headers.includes('cantidad') || !headers.includes('precio') || !headers.includes('stockMinimo')) {
          mostrarError("El archivo de Excel no contiene las columnas necesarias: 'nombre', 'cantidad', 'precio' y 'stockMinimo'.");
          return;
        }
  
        const importedProducts: Producto[] = dataRows.map((row: any) => ({
          id: Date.now().toString() + Math.random().toString(),
          nombre: row[headers.indexOf('nombre')] || '',
          cantidad: parseInt(row[headers.indexOf('cantidad')]) || 0,
          precio: parseFloat(row[headers.indexOf('precio')]) || 0,
          stockMinimo: parseInt(row[headers.indexOf('stockMinimo')]) || 0,
        }));
  
        setProductos([...productos, ...importedProducts]);
        mostrarError("¡Importación exitosa!");
      }
    } catch (err) {
      mostrarError(`Error al importar: ${err}`);
    }
  };

  // Función de exportación de Excel
  const handleExportExcel = async () => {
    try {
      // Prepara los datos para el archivo Excel
      const ws = XLSX.utils.json_to_sheet(productos);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Inventario");

      // Genera el archivo como un ArrayBuffer
      const wbout = XLSX.write(wb, { type: 'base64', bookType: 'xlsx' });
      
      // Crea un URI de archivo temporal
      const filename = FileSystem.cacheDirectory + 'inventario.xlsx';
      
      // Escribe el archivo en el sistema de archivos local
      await FileSystem.writeAsStringAsync(filename, wbout, { encoding: FileSystem.EncodingType.Base64 });

      // Usa Expo Sharing para compartir el archivo local
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(filename, { mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      } else {
        mostrarError("La función de compartir no está disponible en este dispositivo.");
      }
    } catch (error) {
      console.error("Error al exportar el inventario:", error);
      mostrarError("Error al exportar el archivo de Excel.");
    }
  };

  // Calcular resumen
  const totalValor = productos.reduce(
    (acc, p) => acc + p.cantidad * p.precio,
    0
  );
  const bajoStock = productos.filter((p) => p.cantidad <= p.stockMinimo).length;

  const renderItem = ({ item }: { item: Producto }) => (
    <Card style={styles.card}>
      <Card.Content>
        <Title style={{ color: colores.texto }}>{item.nombre}</Title>
        <Paragraph style={{ color: colores.textoSuave }}>
          Cantidad: {item.cantidad} | Precio: ${item.precio.toFixed(2)}
        </Paragraph>
        <Paragraph style={{ color: colores.textoSuave }}>Stock mínimo: {item.stockMinimo}</Paragraph>
        <Paragraph style={{ color: item.cantidad === 0 ? 'red' : item.cantidad <= item.stockMinimo ? 'orange' : colores.textoSuave }}>
          Estado:{" "}
          {item.cantidad === 0
            ? "Sin stock ❌"
            : item.cantidad <= item.stockMinimo
            ? "Stock bajo ⚠️"
            : "En stock ✅"}
        </Paragraph>
      </Card.Content>
      <Card.Actions style={styles.cardActions}>
        <Button onPress={() => {
          setSelectedProduct(item);
          setMovementDialogVisible(true);
        }} mode="contained" buttonColor={colores.primario} compact={true}>Movimientos</Button>
        <Button onPress={() => eliminarProducto(item.id)} mode="contained" buttonColor="#B00020" compact={true}>Eliminar</Button>
      </Card.Actions>
    </Card>
  );

  return (
    <View style={styles.container}>
      {/* Resumen del inventario */}
      <Card style={styles.resumen}>
        <Card.Content>
          <Title style={{ color: colores.primario }}>📊 Resumen del Inventario</Title>
          <Paragraph style={{ color: colores.textoSuave }}>Productos registrados: {productos.length}</Paragraph>
          <Paragraph style={{ color: colores.textoSuave }}>Stock bajo: {bajoStock}</Paragraph>
          <Paragraph style={{ color: colores.textoSuave }}>Valor total: ${totalValor.toFixed(2)}</Paragraph>
        </Card.Content>
        <Card.Actions style={{ justifyContent: 'center' }}>
          <Button mode="text" icon="upload" onPress={handleImportExcel} compact={true} textColor={colores.primario}>Importar Excel</Button>
          <Button mode="text" icon="download" onPress={handleExportExcel} compact={true} textColor={colores.primario}>Exportar Excel</Button>
        </Card.Actions>
      </Card>

      {/* Lista de productos */}
      <FlatList
        data={productos}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ paddingBottom: 100 }}
      />

      {/* Botón flotante para agregar producto */}
      <FAB
        style={styles.fab}
        icon="plus"
        onPress={() => setDialogVisible(true)}
        color="#ffffff"
      />

      {/* Modales dentro de un Portal */}
      <Portal>
        {/* Modal para agregar producto */}
        <Dialog
          visible={dialogVisible}
          onDismiss={() => setDialogVisible(false)}
        >
          <Dialog.Title>Agregar producto</Dialog.Title>
          <Dialog.Content>
            <TextInput
              label="Nombre"
              value={nombre}
              onChangeText={setNombre}
              style={styles.input}
            />
            <TextInput
              label="Cantidad inicial"
              value={cantidad}
              onChangeText={setCantidad}
              keyboardType="numeric"
              style={styles.input}
            />
            <TextInput
              label="Precio"
              value={precio}
              onChangeText={setPrecio}
              keyboardType="numeric"
              style={styles.input}
            />
            <TextInput
              label="Stock mínimo"
              value={stockMinimo}
              onChangeText={setStockMinimo}
              keyboardType="numeric"
              style={styles.input}
            />
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setDialogVisible(false)}>Cancelar</Button>
            <Button onPress={agregarProducto} buttonColor={colores.primario} mode="contained">Guardar</Button>
          </Dialog.Actions>
        </Dialog>

        {/* Nuevo Modal para movimientos de stock */}
        <Dialog
          visible={movementDialogVisible}
          onDismiss={() => setMovementDialogVisible(false)}
        >
          <Dialog.Title>Movimientos de Stock</Dialog.Title>
          <Dialog.Content>
            <Text>Producto: {selectedProduct?.nombre}</Text>
            <TextInput
              label="Cantidad a mover"
              value={movementQuantity}
              onChangeText={setMovementQuantity}
              keyboardType="numeric"
              style={styles.input}
            />
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setMovementDialogVisible(false)}>Cancelar</Button>
            <Button onPress={handleSalida} buttonColor="#B00020" mode="contained">Salida</Button>
            <Button onPress={handleEntrada} buttonColor={colores.primario} mode="contained">Entrada</Button>
          </Dialog.Actions>
        </Dialog>
        
        {/* Modal para mensajes de error */}
        <Dialog
          visible={errorDialogVisible}
          onDismiss={() => setErrorDialogVisible(false)}
        >
          <Dialog.Title>Error</Dialog.Title>
          <Dialog.Content>
            <Paragraph>{errorMessage}</Paragraph>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setErrorDialogVisible(false)}>OK</Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 10,
    backgroundColor: colores.fondo,
  },
  resumen: {
    marginBottom: 10,
    padding: 5,
    borderRadius: 10,
    elevation: 2,
    backgroundColor: colores.suave,
  },
  card: {
    marginBottom: 10,
    borderRadius: 10,
    elevation: 2,
    backgroundColor: colores.card,
  },
  cardActions: {
    justifyContent: 'flex-end',
  },
  input: {
    marginBottom: 10,
  },
  fab: {
    position: "absolute",
    right: 20,
    bottom: 20,
    backgroundColor: colores.primario,
  },
});