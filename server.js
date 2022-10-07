import express from 'express'
import { resolve } from 'path'
import fs from 'fs'

import ssr from './happyFramework/ssr.js'
import App from './build/App.js'

const app = express()


const html = fs.readFileSync('public/index.html', 'utf-8')

app.get('/', (req, res) => {
  res.send(
    ssr(html, App, {})
  )
})

app.get('/build/index.js', (req, res) => {
  res.sendFile(
    resolve(`build/index.js`)
  )
})

app.get('/:file', (req, res) => {
  res.sendFile(
    resolve(`public/${req.params.file}`)
  )
})

const port = process.env.PORT || 3000
app.listen(
  port,
  () => port === 3000 && console.log('http://localhost:3000'),
)

