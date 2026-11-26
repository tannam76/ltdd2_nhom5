const express = require('express')
const app = express()
const token = process.env.DEVICE_TOKEN
if (!token) throw new Error('Set DEVICE_TOKEN')
let latest = null

app.use(express.json({limit: '2kb'}))
app.get('/', (_, res) => res.json({status: 'ok'}))
app.get('/api/latest', (_, res) => {
  res.set('Cache-Control', 'no-store')
  res.status(latest ? 200 : 404).json(latest ?? {error: 'Waiting for ESP32'})
})
app.post('/api/readings', (req, res) => {
  if (req.get('Authorization') !== 'Bearer ' + token) {
    return res.status(401).json({error: 'Unauthorized'})
  }
  const {temperature, humidity, adc, alarm} = req.body ?? {}
  if (!Number.isFinite(temperature) || temperature < -40 || temperature > 80 ||
      !Number.isFinite(humidity) || humidity < 0 || humidity > 100 ||
      !Number.isInteger(adc) || adc < 0 || adc > 4095 ||
      typeof alarm !== 'boolean') {
    return res.status(400).json({error: 'Invalid reading'})
  }
  latest = {temperature, humidity, adc, alarm, receivedAt: new Date().toISOString()}
  res.sendStatus(204)
})
app.listen(process.env.PORT || 3000, '0.0.0.0')