// Custom Next.js server

const { default: axios } = require('axios')
const express = require('express')
const next = require('next')

const port = parseInt(process.env.PORT, 10) || 3000
const dev = process.env.NODE_ENV !== 'production'
const app = next({ dev })
const handle = app.getRequestHandler()

const cors = {
  origin: ['http://localhost:3000', 'https://windofchange.me', 'tauri://localhost'],
  default: "https://windofchange.me"
}

app.prepare().then(() => {
  const server = express()

  let initialized = false

  server.all('*', (req, res) => {
    // I tried using the 'cors' package but it didn't work for me with an array of origins.
    const origin = req.header('Origin') || `${req.protocol}://${req.header('Host')}`
    const goodOrigin = origin && cors.origin.includes(origin.toLowerCase()) ? origin : cors.default
    res.setHeader("Access-Control-Allow-Origin", goodOrigin)
    res.setHeader("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept")
    res.setHeader('Access-Control-Allow-Credentials', true)
    res.setHeader("Vary", "Origin")

    if (initialized || req.url === '/api/health') {
      return handle(req, res)
    } else {
      res.status(500).send('Server is starting...')
    }
  })

  server.listen(port, (err) => {
    if (err) throw err
    console.log(`Listening on http://localhost:${port}`)
  })

  // Ask the server to initialize itself.
  axios.get(`http://localhost:${port}/api/health`)
    .then(res => {
      initialized = true
      console.log('Server is ready.')
    })
    .catch(err => {
      throw new Error(`Could not initialize the server. Error: ${err.message}`)
    })
})