# ESP32 telemetry demo

The repository root is the Express backend. The Expo client is in `app/`, and
`sketch.ino` contains the ESP32 sketch for the existing Wokwi circuit.

## Deploy the API to Render

Create a Web Service from this repository and use:

- Root Directory: leave blank
- Build Command: `npm ci`
- Start Command: `npm start`
- Environment Variable: `DEVICE_TOKEN` set to a unique demo token

The API accepts authenticated readings at `POST /api/readings` and returns
the latest reading at `GET /api/latest`. The in-memory reading is cleared when
the service restarts.

## Configure Wokwi

Use the existing project circuit: <https://wokwi.com/projects/481732995822596097>.
The sketch uses GPIO 14 for DHT22, GPIO 34 for ADC, GPIO 26 for the warning LED,
and GPIO 22 for the relay. The alarm is on at 35 °C or ADC 2500 and above.

Replace `YOUR-SERVICE` in `sketch.ino` with the Render service hostname and set
`DEVICE_TOKEN` to the same value configured in Render. Keep the real token out
of public source; use a placeholder in any public Wokwi or GitHub copy.

## Run the Expo app

Replace `YOUR-SERVICE` in `app/App.js` with the Render service hostname, then:

```powershell
cd app
npm ci
npm start
```

Open the project in Expo Go. The app polls the latest reading every three
seconds and marks data older than 15 seconds as stale.
