import React, { useState, useEffect } from "react";
import { View, StyleSheet, Dimensions, ScrollView } from "react-native";
import { Text, Title, Paragraph, Card } from "react-native-paper";
import { PieChart } from "react-native-chart-kit";
import { useIsFocused } from "@react-navigation/native";
import AsyncStorage from "@react-native-async-storage/async-storage";

// Tipos de datos
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

export default function Index() {
  const [productos, setProductos] = useState<Producto[]>([]);
  const isFocused = useIsFocused();
  const screenWidth = Dimensions.get("window").width;

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

    if (isFocused) {
      cargarDatos();
    }
  }, [isFocused]);

  // Contar productos por estado
  const enStockCount = productos.filter(p => p.cantidad > p.stockMinimo).length;
  const bajoStockCount = productos.filter(p => p.cantidad > 0 && p.cantidad <= p.stockMinimo).length;
  const sinStockCount = productos.filter(p => p.cantidad === 0).length;

  const data = [
    {
      name: "En Stock",
      count: enStockCount,
      color: colores.primario,
      legendFontColor: colores.texto,
      legendFontSize: 15,
    },
    {
      name: "Bajo Stock",
      count: bajoStockCount,
      color: "#ff8c00", // Naranja
      legendFontColor: colores.texto,
      legendFontSize: 15,
    },
    {
      name: "Sin Stock",
      count: sinStockCount,
      color: "#ff0000", // Rojo
      legendFontColor: colores.texto,
      legendFontSize: 15,
    },
  ];

  const chartConfig = {
    backgroundColor: colores.card,
    backgroundGradientFrom: colores.card,
    backgroundGradientTo: colores.card,
    color: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
  };

  const totalProductos = productos.length;

  if (totalProductos === 0) {
    return (
      <View style={styles.container}>
        <Text style={styles.text}>No hay productos en el inventario.</Text>
        <Text style={{ textAlign: 'center' }}>Agrega algunos en la pestaña "Inventario" para ver el resumen.</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <Card style={styles.card}>
        <Card.Content>
          <Title style={styles.cardTitle}>Estado del Inventario</Title>
          <Paragraph style={styles.paragraph}>Total de productos: {totalProductos}</Paragraph>
          <PieChart
            data={data}
            width={screenWidth - 20}
            height={220}
            chartConfig={chartConfig}
            accessor="count"
            backgroundColor="transparent"
            paddingLeft="15"
            absolute
          />
        </Card.Content>
      </Card>
      {/* Puedes agregar más gráficos aquí en el futuro */}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 10,
    backgroundColor: colores.fondo,
  },
  card: {
    marginBottom: 10,
    borderRadius: 10,
    elevation: 2,
    backgroundColor: colores.card,
  },
  cardTitle: {
    textAlign: "center",
    marginBottom: 10,
    color: colores.primario,
  },
  paragraph: {
    textAlign: "center",
    color: colores.textoSuave,
  },
  text: {
    fontSize: 20,
    fontWeight: "bold",
    textAlign: "center",
    color: colores.texto,
  },
});