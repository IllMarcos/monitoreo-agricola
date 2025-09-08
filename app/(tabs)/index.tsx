import { useRouter } from 'expo-router';
import React from 'react';
import { Image, ScrollView, StyleSheet, View } from 'react-native';
import { Card, List, Paragraph, Title } from 'react-native-paper';

// Paleta de colores consistente
const colores = {
  primario: '#2e7d32',
  fondo: '#f4f7f6',
  card: '#ffffff',
  texto: '#263238',
  textoSuave: '#546e7a',
};

export default function Index() {
  const router = useRouter();

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      <View style={styles.header}>
        <Image source={require('@/assets/images/logo-agro.png')} style={styles.logo} />
        <Title style={styles.title}>🌱 Agrícola Bernal Produce</Title>
        <Paragraph style={styles.subtitle}>
          Consultoría y venta de agroquímicos en Guasave, Sinaloa
        </Paragraph>
      </View>

      <Card style={styles.card}>
        <Card.Content>
          <Paragraph style={styles.bodyText}>
            En Agrícola Bernal Produce trabajamos de la mano con los productores del campo sinaloense, ofreciendo soluciones integrales para el cuidado y desarrollo de sus cultivos. Nuestro compromiso es brindar asesoría personalizada y productos de la más alta calidad para maximizar el rendimiento de sus cosechas.
          </Paragraph>
        </Card.Content>
      </Card>

      <Card style={styles.card}>
        <Card.Content>
          <Title style={styles.cardTitle}>Nuestros Servicios</Title>
          <List.Item
            title="Consultoría especializada"
            description="Acompañamiento técnico en cada etapa del cultivo."
            left={props => <List.Icon {...props} icon="check-circle" color={colores.primario} />}
          />
          <List.Item
            title="Venta de agroquímicos"
            description="Fertilizantes, plaguicidas y productos certificados."
            left={props => <List.Icon {...props} icon="check-circle" color={colores.primario} />}
          />
          <List.Item
            title="Soluciones a la medida"
            description="Estrategias adaptadas a cada necesidad agrícola."
            left={props => <List.Icon {...props} icon="check-circle" color={colores.primario} />}
          />
        </Card.Content>
      </Card>
      
      <Card style={styles.card}>
        <Card.Content>
          <Title style={styles.cardTitle}>¿Por qué elegirnos?</Title>
            <Paragraph style={styles.bulletPoint}>• Experiencia en el sector agrícola de Guasave.</Paragraph>
            <Paragraph style={styles.bulletPoint}>• Atención cercana y personalizada.</Paragraph>
            <Paragraph style={styles.bulletPoint}>• Productos confiables que garantizan resultados.</Paragraph>
        </Card.Content>
      </Card>

      <Paragraph style={styles.footerText}>
        En Agrícola Bernal Produce creemos que el éxito del campo está en la unión entre el conocimiento técnico y las herramientas adecuadas.
      </Paragraph>

    </ScrollView>
  );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colores.fondo,
    },
    contentContainer: {
        padding: 20,
    },
    header: {
        alignItems: 'center',
        marginBottom: 20,
    },
    logo: {
        width: 100,
        height: 100,
        marginBottom: 15,
    },
    title: {
        fontSize: 26,
        fontWeight: 'bold',
        color: colores.texto,
        textAlign: 'center',
    },
    subtitle: {
        fontSize: 16,
        color: colores.textoSuave,
        textAlign: 'center',
        marginTop: 5,
    },
    card: {
        marginBottom: 20,
        borderRadius: 12,
        elevation: 2,
        backgroundColor: colores.card,
    },
    cardTitle: {
        color: colores.primario,
        marginBottom: 10,
        fontSize: 20,
        fontWeight: 'bold',
    },
    bodyText: {
        fontSize: 16,
        lineHeight: 24,
        color: colores.textoSuave,
    },
    bulletPoint: {
        fontSize: 16,
        lineHeight: 24,
        color: colores.textoSuave,
        marginBottom: 5,
    },
    footerText: {
        fontSize: 14,
        color: colores.textoSuave,
        textAlign: 'center',
        fontStyle: 'italic',
        marginTop: 10,
    },
});