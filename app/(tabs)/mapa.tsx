import React, { useRef, useState } from "react";
import {
  StyleSheet,
  View,
  Text,
  ActivityIndicator,
  SafeAreaView,
  Platform,
} from "react-native";
import { WebView, WebViewMessageEvent } from "react-native-webview";

/**
 * CONFIG: coloca tu API KEY de OpenWeatherMap aquí
 * Consíguela en https://home.openweathermap.org/api_keys
 */
const OPENWEATHERMAP_API_KEY = "fd2d74c664ffbbcb2245dfba30d0c781";

interface ClickMessage {
  type: "clicked";
  lat: number;
  lng: number;
  humiditySim: number;
}

interface RainInfo {
  available: boolean;
  oneHour: number | null;
  threeHour: number | null;
}

interface RainResponse {
  type: "rain_response";
  lat: number;
  lng: number;
  humiditySim: number;
  rainInfo: RainInfo | null;
  temp?: number | null;
  weatherDesc?: string | null;
  error?: string;
}

export default function Mapa() {
  const webviewRef = useRef<WebView>(null);
  const [loading, setLoading] = useState(true);

  // Manejo de mensajes del WebView
  const onMessage = async (event: WebViewMessageEvent) => {
    try {
      const data: ClickMessage = JSON.parse(event.nativeEvent.data);

      if (data.type === "clicked") {
        const { lat, lng, humiditySim } = data;

        const url = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lng}&appid=${OPENWEATHERMAP_API_KEY}&units=metric`;

        try {
          const res = await fetch(url);
          if (!res.ok) throw new Error("Weather API error: " + res.status);

          const json = await res.json();
          const rainInfo: RainInfo = {
            available: !!json.rain,
            oneHour: json.rain?.["1h"] ?? null,
            threeHour: json.rain?.["3h"] ?? null,
          };

          const payload: RainResponse = {
            type: "rain_response",
            lat,
            lng,
            humiditySim,
            rainInfo,
            temp: json.main?.temp ?? null,
            weatherDesc: json.weather?.[0]?.description ?? null,
          };

          webviewRef.current?.postMessage(JSON.stringify(payload));
        } catch (err: any) {
          const payload: RainResponse = {
            type: "rain_response",
            lat,
            lng,
            humiditySim,
            rainInfo: null,
            error: err.message,
          };
          webviewRef.current?.postMessage(JSON.stringify(payload));
        }
      }
    } catch (err) {
      console.warn("onMessage parse error:", err);
    }
  };

  const injectedJS = createHtml();

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Monitoreo Agrícola — Mapa de Humedad</Text>
        <Text style={styles.subtitle}>
          Haz clic en un punto para ver humedad simulada y lluvia real
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
          OpenWeatherMap API:{" "}
          {OPENWEATHERMAP_API_KEY ? "OK" : "NO CONFIGURADA"}
        </Text>
        <Text style={styles.footerTextSmall}>
          (Coloca tu API key en mapa.tsx → OPENWEATHERMAP_API_KEY)
        </Text>
      </View>
    </SafeAreaView>
  );
}

/**
 * HTML con Leaflet embebido
 */
function createHtml(): string {
  return `
<!doctype html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>Leaflet Grid Heatmap</title>
  <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"/>
  <style>
    html, body, #map { height: 100%; margin: 0; padding: 0; }
    .info-box { font-family: Arial; font-size: 14px; }
    .popup-title { font-weight: bold; margin-bottom: 6px; }
  </style>
</head>
<body>
  <div id="map"></div>
  <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
  <script>
    function clamp(v,a,b){return Math.max(a,Math.min(b,v));}
    function simulatedHumidity(lat,lng){
      const a=Math.sin(lat*0.1)*20;
      const b=Math.cos(lng*0.1)*20;
      const c=Math.sin((lat+lng)*0.05)*15;
      const d=(Math.sin(lat*0.35)+Math.cos(lng*0.4))*8;
      let val=50+a+b+c+d;
      return clamp(Math.round(val),0,100);
    }
    function humidityToColor(h){
      if(h<=20) return '#d73027';
      if(h<=40) return '#f46d43';
      if(h<=70) return '#66bd63';
      return '#2b83ba';
    }

    const map=L.map('map').setView([20.67,-103.35],6);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',{attribution:'&copy; OpenStreetMap'}).addTo(map);

    const gridLayer=L.GridLayer.extend({
      createTile:function(coords){
        const tile=document.createElement('canvas');
        const size=this.getTileSize();
        tile.width=size.x; tile.height=size.y;
        const ctx=tile.getContext('2d');

        const nw=coordsToLatLng(coords.x,coords.y,coords.z);
        const se=coordsToLatLng(coords.x+1,coords.y+1,coords.z);
        const steps=24, stepX=size.x/steps, stepY=size.y/steps;

        for(let i=0;i<steps;i++){
          for(let j=0;j<steps;j++){
            const tX=(i+0.5)/steps, tY=(j+0.5)/steps;
            const lat=nw.lat+(se.lat-nw.lat)*tY;
            const lng=nw.lng+(se.lng-nw.lng)*tX;
            const h=simulatedHumidity(lat,lng);
            ctx.fillStyle=humidityToColor(h);
            ctx.globalAlpha=0.12;
            ctx.fillRect(i*stepX,j*stepY,stepX+1,stepY+1);
          }
        }
        return tile;
      }
    });
    function coordsToLatLng(x,y,z){
      const n=Math.pow(2,z);
      const lng_deg=x/n*360-180;
      const lat_rad=Math.atan(Math.sinh(Math.PI*(1-2*y/n)));
      return {lat:lat_rad*180/Math.PI,lng:lng_deg};
    }
    const myGrid=new gridLayer(); myGrid.addTo(map);
    map.on('moveend zoomend',()=>setTimeout(()=>myGrid.redraw(),120));

    let lastMarker=null;
    function showPopup(latlng,humiditySim,rainData){
      if(lastMarker) map.removeLayer(lastMarker);
      const marker=L.marker(latlng).addTo(map);
      let html='<div class="popup-title">Punto seleccionado</div>';
      html+='<div><b>Coords:</b> '+latlng.lat.toFixed(5)+', '+latlng.lng.toFixed(5)+'</div>';
      html+='<div><b>Humedad:</b> '+humiditySim+'%</div>';
      if(!rainData){
        html+='<div><em>Buscando lluvia...</em></div>';
      }else if(rainData.error){
        html+='<div style="color:red"><b>Error:</b> '+rainData.error+'</div>';
      }else{
        if(rainData.rainInfo?.available){
          html+='<div><b>Lluvia 1h:</b> '+(rainData.rainInfo.oneHour ?? "n/d")+' mm</div>';
          html+='<div><b>Lluvia 3h:</b> '+(rainData.rainInfo.threeHour ?? "n/d")+' mm</div>';
        }else{
          html+='<div><b>Precipitación:</b> 0 mm</div>';
        }
        if(rainData.temp!==undefined){
          html+='<div><b>Temp:</b> '+rainData.temp+' °C</div>';
        }
        if(rainData.weatherDesc){
          html+='<div><b>Clima:</b> '+rainData.weatherDesc+'</div>';
        }
      }
      marker.bindPopup(html).openPopup();
      lastMarker=marker;
    }
    map.on('click',function(e){
      const h=simulatedHumidity(e.latlng.lat,e.latlng.lng);
      showPopup(e.latlng,h,null);
      const payload={type:'clicked',lat:e.latlng.lat,lng:e.latlng.lng,humiditySim:h};
      window.ReactNativeWebView?.postMessage(JSON.stringify(payload));
    });
    function handleMsg(evt){
      try{
        const data=JSON.parse(evt.data);
        if(data.type==='rain_response'){
          const latlng=L.latLng(data.lat,data.lng);
          showPopup(latlng,data.humiditySim,data);
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
  title: { fontSize: 18, fontWeight: "700", color: "#0f172a" },
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
  footerTextSmall: { fontSize: 11, color: "#94a3b8" },
});
