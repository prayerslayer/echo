const express = require('express')
const bodyParser = require('body-parser')
const color = require('colors')
const cors = require('cors')
const SUPPORTED_VERBS = [
  'GET',
  'POST',
  'PATCH',
  'PUT',
  'OPTIONS',
  'DELETE',
]
let RECORDED_REQUESTS = []

const app = express()
app.use(cors())
app.use(bodyParser.json())
app.use(bodyParser.text())
app.use(bodyParser.urlencoded({
  extended: true
}))

// converts json object to a string
// takes function that will be passed key and value and is expected to return a string
function stringifyJSONForPrinting(formatFn) {
  return function(json) {
    return Object
      .keys(json)
      .reduce((agg, key, i, arr) => agg + `${formatFn(key, json[key])}${i < arr.length - 1 ? '\n' : ''}`, '')
  }
}

// converts json object to urlencoded string (key=value)
const toUrlencoded = stringifyJSONForPrinting((key, val) => `${key}=${val}`)

// converts header object into a string (key: value)
const headers = stringifyJSONForPrinting((key, val) => `  ${color.dim(key)}: ${val}`)

// returns proper stringified version of request body depending on content type
function body(req) {
  if (!req.body || Object.keys(req.body).length === 0) {
    return ''
  }
  const content = req.headers['content-type']
  switch (content) {
    case 'application/json':
      return JSON.stringify(req.body, null, 2)
    case 'application/x-www-form-urlencoded':
      return toUrlencoded(req.body)
    case 'text/plain':
      return req.body
    default:
      return String(req.body)
  }
}

// returns colorized string for method
function colorizeMethod(method) {
  // green/red = modifying
  // yellow = possibly modifying
  // white = neutral
  const VERB_COLORS = {
    'GET': 'white',
    'POST': 'green',
    'PATCH': 'green',
    'PUT': 'yellow',
    'OPTIONS': 'white',
    'DELETE': 'red',
  }
  const colorForMethod = VERB_COLORS[method] || 'bgBlack'
  return color[colorForMethod]('● ') + method
}

// outputs request information to stdout
// method, timestamp, path, body
function print(req) {
  const m = colorizeMethod(req.method)
  const h = color.gray(headers(req.headers))
  const p = color.bold(color.white(req.path))
  console.log(m, p)
  console.log(h)
  if (req.body) {
    console.log(color.gray(body(req)))
  }
  console.log()
}

// records, prints to stdout and returns the request
function echo(req, res) {
  const nonCircularReq = Object.assign({}, {
    method: req.method,
    path: req.path,
    timestamp: new Date(),
    headers: req.headers,
    body: req.method === 'GET' ? undefined : req.body
  })
  RECORDED_REQUESTS.push(nonCircularReq)
  print(nonCircularReq)
  res.status(200)
    .type('json')
    .send(JSON.stringify(nonCircularReq))
}

// endpoint to retrieve all recorded requests
app.get('/_requests', (_, res) => {
  res.status(200)
    .json(RECORDED_REQUESTS)
})

// endpoint to clear recorded requests
app.delete('/_requests', (_, res) => {
  RECORDED_REQUESTS = []
  res.status(200)
})

// register listeners for all supported http verbs
SUPPORTED_VERBS.map(verb => verb.toLowerCase())
  .forEach(verb => app[verb]('/*', echo))

// start the server
const PORT = 3000 || process.env.PORT
app.listen(PORT)
console.log(`Echo API ready at ${PORT}`)
