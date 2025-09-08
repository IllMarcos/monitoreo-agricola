import * as Location from "expo-location";
import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Platform,
  SafeAreaView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { WebView, WebViewMessageEvent } from "react-native-webview";

/**
 * CONFIG: coloca tu API KEY de OpenWeatherMap aquí
 */
const OPENWEATHERMAP_API_KEY = "fd2d74c664ffbbcb2245dfba30d0c781";

interface ClickMessage {
  type: "clicked";
  lat: number;
  lng: number;
}

interface RainInfo {
  available: boolean;
  oneHour: number | null;
  threeHour: number | null;
}

interface WeatherResponse {
  type: "weather_response";
  lat: number;
  lng: number;
  humidity: number | null;
  rainInfo: RainInfo | null;
  temp?: number | null;
  weatherDesc?: string | null;
  error?: string;
}

export default function Mapa() {
  const webviewRef = useRef<WebView>(null);
  const [loading, setLoading] = useState(true);
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(
    null
  );

  // Pedir permisos de ubicación
  useEffect(() => {
    (async () => {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        console.warn("Permiso de ubicación denegado");
        return;
      }

      const loc = await Location.getCurrentPositionAsync({});
      setLocation({
        lat: loc.coords.latitude,
        lng: loc.coords.longitude,
      });
    })();
  }, []);

  // Manejo de mensajes del WebView
  const onMessage = async (event: WebViewMessageEvent) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);

      if (data.type === "clicked") {
        const { lat, lng } = data;

        const url = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lng}&appid=${OPENWEATHERMAP_API_KEY}&units=metric&lang=es`;

        try {
          const res = await fetch(url);
          if (!res.ok) throw new Error("Error en la API del clima: " + res.status);

          const json = await res.json();

          const rainInfo: RainInfo = {
            available: !!json.rain,
            oneHour: json.rain?.["1h"] ?? null,
            threeHour: json.rain?.["3h"] ?? null,
          };

          const payload: WeatherResponse = {
            type: "weather_response",
            lat,
            lng,
            humidity: json.main?.humidity ?? null,
            rainInfo,
            temp: json.main?.temp ?? null,
            weatherDesc: json.weather?.[0]?.description ?? null,
          };

          webviewRef.current?.postMessage(JSON.stringify(payload));
        } catch (err: any) {
          const payload: WeatherResponse = {
            type: "weather_response",
            lat,
            lng,
            humidity: null,
            rainInfo: null,
            error: err.message,
          };
          webviewRef.current?.postMessage(JSON.stringify(payload));
        }
      }

      if (data.type === "parcel_selected") {
        console.log("📌 Parcela seleccionada:", data.coords);
        // 👉 Aquí puedes guardar coords en SQLite, Firebase o tu backend
      }
    } catch (err) {
      console.warn("Error al procesar mensaje:", err);
    }
  };

  if (!location) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" />
          <Text>Obteniendo ubicación...</Text>
        </View>
      </SafeAreaView>
    );
  }

  const injectedJS = createHtml(location.lat, location.lng);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.subtitle}>
          Haz clic en un punto para ver humedad real, lluvia y temperatura o dibuja
          un cuadrante
        </Text>
      </View>

      <View style={styles.webviewContainer}>
        <WebView
          ref={webviewRef}
          originWhitelist={["*"]}
          source={{ html: injectedJS }}
          onMessage={onMessage}
          javaScriptEnabled
          domStorageEnabled
          onLoadEnd={() => setLoading(false)}
          style={styles.webview}
        />
        {loading && (
          <View style={styles.loadingOverlay}>
            <ActivityIndicator size="large" />
            <Text style={{ marginTop: 8 }}>Cargando mapa...</Text>
          </View>
        )}
      </View>

      <View style={styles.footer}>
        <Text style={styles.footerText}>
          API de OpenWeatherMap:{" "}
          {OPENWEATHERMAP_API_KEY ? "CONFIGURADA" : "NO CONFIGURADA"}
        </Text>
      </View>
    </SafeAreaView>
  );
}

/**
 * HTML con Leaflet + Draw + capas satélite + filtros OWM
 */
function createHtml(lat: number, lng: number): string {
  return `
<!doctype html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>Mapa de Parcelas</title>
  <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"/>
  <link rel="stylesheet" href="https://unpkg.com/leaflet-draw@1.0.4/dist/leaflet.draw.css"/>
  <style>
    html, body, #map { height: 100%; margin: 0; padding: 0; }
    .info-box { font-family: Arial; font-size: 14px; }
    .popup-title { font-weight: bold; margin-bottom: 6px; }
    .user-location-marker { background: transparent !important; border: none !important; }
  </style>
</head>
<body>
  <div id="map"></div>
  <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
  <script src="https://unpkg.com/leaflet-draw@1.0.4/dist/leaflet.draw.js"></script>
  <script>
    const map = L.map('map').setView([${lat}, ${lng}], 13);

    // Capas base
    const osm = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap'
    });

    const satelite = L.tileLayer(
      'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', 
      { attribution: 'Imágenes © Esri y colaboradores' }
    );

    osm.addTo(map);

    // --- Capas climáticas reales OpenWeatherMap ---
    const precipitation = L.tileLayer(
      "https://tile.openweathermap.org/map/precipitation_new/{z}/{x}/{y}.png?appid=${OPENWEATHERMAP_API_KEY}",
      { attribution: "Datos © OpenWeatherMap", opacity: 0.6 }
    );

    const temperature = L.tileLayer(
      "https://tile.openweathermap.org/map/temp_new/{z}/{x}/{y}.png?appid=${OPENWEATHERMAP_API_KEY}",
      { attribution: "Datos © OpenWeatherMap", opacity: 0.5 }
    );

    const clouds = L.tileLayer(
      "https://tile.openweathermap.org/map/clouds_new/{z}/{x}/{y}.png?appid=${OPENWEATHERMAP_API_KEY}",
      { attribution: "Datos © OpenWeatherMap", opacity: 0.5 }
    );

    // Control de capas
    L.control.layers(
      { "Mapa": osm, "Satélite": satelite },
      { "🌧️ Precipitación": precipitation, "🌡️ Temperatura": temperature, "☁️ Nubes": clouds }
    ).addTo(map);

    // --- Dibujo de parcelas ---
    const drawnItems = new L.FeatureGroup();
    map.addLayer(drawnItems);

    const drawControl = new L.Control.Draw({
      edit: { featureGroup: drawnItems },
      draw: {
        polyline: false,
        rectangle: true,
        polygon: true,
        circle: false,
        marker: false,
        circlemarker: false
      }
    });
    map.addControl(drawControl);

    // Capturar evento de creación de parcela
    map.on(L.Draw.Event.CREATED, function (e) {
      const layer = e.layer;
      drawnItems.addLayer(layer);

      const coords = layer.getLatLngs()[0].map(p => [p.lat, p.lng]);

      const payload = {
        type: 'parcel_selected',
        coords: coords
      };

      window.ReactNativeWebView?.postMessage(JSON.stringify(payload));
    });

    // Evento click para clima puntual
    let lastMarker=null;
    function showPopup(latlng, weatherData){
      if(lastMarker) map.removeLayer(lastMarker);
      const marker=L.marker(latlng).addTo(map);
      let html='<div class="popup-title">Datos Meteorológicos</div>';
      html+='<div><b>Coordenadas:</b> '+latlng.lat.toFixed(5)+', '+latlng.lng.toFixed(5)+'</div>';
      
      if(!weatherData){
        html+='<div><em>Obteniendo datos del clima...</em></div>';
      }else if(weatherData.error){
        html+='<div style="color:red"><b>Error:</b> '+weatherData.error+'</div>';
      }else{
        if(weatherData.humidity !== null){
          html+='<div><b>Humedad:</b> '+weatherData.humidity+'%</div>';
        }
        if(weatherData.temp !== null && weatherData.temp !== undefined){
          html+='<div><b>Temperatura:</b> '+weatherData.temp.toFixed(1)+' °C</div>';
        }
        if(weatherData.weatherDesc){
          html+='<div><b>Condición:</b> '+weatherData.weatherDesc+'</div>';
        }
        if(weatherData.rainInfo?.available){
          const rain1h = weatherData.rainInfo.oneHour !== null ? weatherData.rainInfo.oneHour.toFixed(1) : 'n/d';
          const rain3h = weatherData.rainInfo.threeHour !== null ? weatherData.rainInfo.threeHour.toFixed(1) : 'n/d';
          html+='<div><b>Lluvia (1 hora):</b> '+rain1h+' mm</div>';
          html+='<div><b>Lluvia (3 horas):</b> '+rain3h+' mm</div>';
        }else{
          html+='<div><b>Precipitación:</b> Sin lluvia</div>';
        }
      }
      marker.bindPopup(html).openPopup();
      lastMarker=marker;
    }

    map.on('click',function(e){
      showPopup(e.latlng, null);
      const payload={type:'clicked',lat:e.latlng.lat,lng:e.latlng.lng};
      window.ReactNativeWebView?.postMessage(JSON.stringify(payload));
    });

    function handleMsg(evt){
      try{
        const data=JSON.parse(evt.data);
        if(data.type==='weather_response'){
          const latlng=L.latLng(data.lat,data.lng);
          showPopup(latlng, data);
        }
      }catch{}
    }
    window.addEventListener('message',handleMsg);
    document.addEventListener('message',handleMsg);
  </script>
</body>
</html>
  `;
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f5f7fb" },
  header: {
    paddingTop: Platform.OS === "android" ? 20 : 8,
    paddingHorizontal: 12,
    paddingBottom: 8,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderColor: "#eee",
  },
  subtitle: { marginTop: 4, fontSize: 12, color: "#334155" },
  webviewContainer: { flex: 1 },
  webview: { flex: 1, backgroundColor: "#e6eef8" },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.6)",
  },
  footer: {
    padding: 10,
    backgroundColor: "#fff",
    borderTopWidth: 1,
    borderColor: "#eee",
    alignItems: "center",
  },
  footerText: { fontSize: 12, color: "#334155" },
});
