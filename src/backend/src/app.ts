import express from 'express'
import { corsMiddleware } from './config/cors'

const app = express()

app.use(express.json())
app.use(corsMiddleware)

app.get('/', (req, res) => {
  res.send('API Active')
})

const port = process.env.PORT || 3000

app.listen(port, () => {
  console.log(`Server is running on localhost:${port}`)
})
