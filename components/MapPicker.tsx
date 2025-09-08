// app/components/MapPicker.tsx
import React, { useRef } from "react";
import { StyleSheet, View } from "react-native";
import { WebView } from "react-native-webview";

export default function MapPicker({ initialLat = 20.5, initialLng = -103.4, onLocationSelect }: any) {
  const webviewRef = useRef<any>(null);

  const html = `
  <!doctype html>
  <html>
  <head>
    <meta name="viewport" content="initial-scale=1.0, maximum-scale=1.0"/>
    <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"/>
    <style>html,body,#map{height:100%;margin:0;padding:0}</style>
  </head>
  <body>
    <div id="map"></div>
    <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
    <script>
      const map = L.map('map').setView([${initialLat}, ${initialLng}], 13);
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',{attribution:'&copy; OSM'}).addTo(map);
      let marker = L.marker([${initialLat}, ${initialLng}]).addTo(map);
      function send(lat,lng){ 
        const msg = JSON.stringify({lat, lng});
        if(window.ReactNativeWebView && window.ReactNativeWebView.postMessage){
          window.ReactNativeWebView.postMessage(msg);
        }
      }
      map.on('click', function(e){
        const {lat,lng} = e.latlng;
        if(marker) marker.setLatLng(e.latlng);
        else marker = L.marker(e.latlng).addTo(map);
        send(lat,lng);
      });
      // enviar la inicial
      send(${initialLat}, ${initialLng});
    </script>
  </body>
  </html>
  `;

  return (
    <View style={styles.container}>
      <WebView
        ref={webviewRef}
        originWhitelist={["*"]}
        source={{ html }}
        onMessage={(e) => {
          try {
            const p = JSON.parse(e.nativeEvent.data);
            if (onLocationSelect) onLocationSelect(p);
          } catch (err) {
            // ignore
          }
        }}
        style={{ flex: 1 }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { height: 300, overflow: "hidden", borderWidth: 1, borderColor: "#ddd", borderRadius: 8 }
});
