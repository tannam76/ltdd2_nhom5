import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

const API = 'https://YOUR-SERVICE.onrender.com/api/latest';

export default function App() {
  const [reading, setReading] = useState(null);
  const [status, setStatus] = useState('Đang kết nối…');

  useEffect(() => {
    let active = true;
    let timer;
    let controller;

    async function refresh() {
      controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 8000);

      try {
        const response = await fetch(API, { signal: controller.signal });

        if (response.status === 404) {
          if (active) {
            setReading(null);
            setStatus('Đang chờ dữ liệu từ ESP32');
          }
          return;
        }

        if (!response.ok) throw new Error(`HTTP ${response.status}`);

        const data = await response.json();
        const receivedAt = Date.parse(data.receivedAt);
        if (
          !Number.isFinite(data.temperature) ||
          !Number.isFinite(data.humidity) ||
          !Number.isInteger(data.adc) ||
          typeof data.alarm !== 'boolean' ||
          !Number.isFinite(receivedAt)
        ) {
          throw new Error('Invalid reading');
        }

        if (active) {
          setReading(data);
          setStatus(
            Date.now() - receivedAt > 15000
              ? 'Dữ liệu cũ • đang chờ ESP32'
              : 'Đang nhận dữ liệu',
          );
        }
      } catch {
        if (active) setStatus('Mất kết nối API • đang thử lại');
      } finally {
        clearTimeout(timeout);
        if (active) timer = setTimeout(refresh, 3000);
      }
    }

    refresh();
    return () => {
      active = false;
      clearTimeout(timer);
      controller?.abort();
    };
  }, []);

  return (
    <View style={styles.screen}>
      <Text style={styles.title}>Giám sát ESP32</Text>
      <Text style={styles.detail}>{status}</Text>
      {reading && (
        <View style={styles.card}>
          <Text style={styles.detail}>Nhiệt độ  {reading.temperature} °C</Text>
          <Text style={styles.detail}>Độ ẩm  {reading.humidity}%</Text>
          <Text style={styles.detail}>Tín hiệu ADC  {reading.adc}</Text>
          <Text
            style={[
              styles.detail,
              { color: reading.alarm ? '#b91c1c' : '#166534' },
            ]}
          >
            Cảnh báo {reading.alarm ? 'BẬT' : 'TẮT'}
          </Text>
          <Text>
            Cập nhật {new Date(reading.receivedAt).toLocaleTimeString('vi-VN')}
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    paddingTop: 72,
    paddingHorizontal: 24,
    backgroundColor: '#f1f5f9',
  },
  title: { fontSize: 30, fontWeight: '700', color: '#0f172a' },
  card: {
    marginTop: 18,
    padding: 18,
    borderRadius: 12,
    backgroundColor: '#fff',
    gap: 4,
  },
  detail: { fontSize: 17, marginVertical: 5, color: '#334155' },
});
