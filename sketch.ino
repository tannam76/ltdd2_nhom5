#include <DHT.h>
#include <HTTPClient.h>
#include <WiFi.h>
#include <WiFiClientSecure.h>

constexpr int DHT_PIN = 14;
constexpr int ANALOG_PIN = 34;
constexpr int RED_LED_PIN = 26;
constexpr int RELAY_PIN = 22;

constexpr float TEMP_THRESHOLD = 35.0;
constexpr int ADC_THRESHOLD = 2500;
constexpr unsigned long DHT_INTERVAL_MS = 2000;

const char* READINGS_URL =
    "https://YOUR-SERVICE.onrender.com/api/readings";
const char* DEVICE_TOKEN = "REPLACE_WITH_YOUR_DEVICE_TOKEN";

DHT dht(DHT_PIN, DHT22);

float temperature = NAN;
float humidity = NAN;
unsigned long lastDhtRead = 0;

void sendReading(float temp, float hum, int adc, bool alarm) {
  if (isnan(temp) || isnan(hum)) {
    Serial.println("API POST skipped: invalid DHT reading");
    return;
  }
  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("API POST skipped: Wi-Fi disconnected");
    return;
  }

  char body[128];
  snprintf(body, sizeof(body),
           "{\"temperature\":%.1f,\"humidity\":%.1f,\"adc\":%d,\"alarm\":%s}",
           temp, hum, adc, alarm ? "true" : "false");

  WiFiClientSecure client;
  client.setInsecure();  // Demo only: skips TLS certificate validation.

  HTTPClient http;
  http.setConnectTimeout(10000);
  http.setTimeout(10000);

  if (!http.begin(client, READINGS_URL)) {
    Serial.println("API POST failed: unable to open URL");
    return;
  }

  http.addHeader("Content-Type", "application/json");
  http.addHeader("Authorization", String("Bearer ") + DEVICE_TOKEN);
  const int status = http.POST(String(body));
  Serial.printf("API POST: %d\n", status);
  if (status < 0) {
    Serial.printf("API error: %s\n", http.errorToString(status).c_str());
  }
  http.end();
}

void setup() {
  Serial.begin(115200);

  pinMode(RED_LED_PIN, OUTPUT);
  pinMode(RELAY_PIN, OUTPUT);
  digitalWrite(RED_LED_PIN, LOW);
  digitalWrite(RELAY_PIN, HIGH);

  analogReadResolution(12);
  dht.begin();

  WiFi.mode(WIFI_STA);
  WiFi.setAutoReconnect(true);
  WiFi.begin("Wokwi-GUEST", "", 6);
}

void loop() {
  const unsigned long now = millis();
  const int analogValue = analogRead(ANALOG_PIN);
  const bool readDht = now - lastDhtRead >= DHT_INTERVAL_MS;

  if (readDht) {
    lastDhtRead = now;
    temperature = dht.readTemperature();
    humidity = dht.readHumidity();
  }

  const bool hot = !isnan(temperature) && temperature >= TEMP_THRESHOLD;
  const bool alarm = hot || analogValue >= ADC_THRESHOLD;

  digitalWrite(RED_LED_PIN, alarm ? HIGH : LOW);
  digitalWrite(RELAY_PIN, alarm ? LOW : HIGH);

  if (readDht) {
    Serial.printf("Nhiet do: %.1f C | Do am: %.1f %% | ADC: %d | Canh bao: %s\n",
                  temperature, humidity, analogValue, alarm ? "BAT" : "TAT");
    sendReading(temperature, humidity, analogValue, alarm);
  }

  delay(50);
}
