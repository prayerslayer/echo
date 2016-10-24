const express = require('express')
const bodyParser = require('body-parser')
const color = require('colors')
const RECORDED_REQUESTS = []
const SUPPORTED_VERBS = [
  'GET',
  'POST',
  'PATCH',
  'PUT',
  'OPTIONS',
  'DELETE',
]

const app = express()
app.use(bodyParser.json())
app.use(bodyParser.text())
app.use(bodyParser.urlencoded({
  extended: true
}))

// converts json object to urlencoded string (key=value)
function toUrlencoded(json) {
  return Object
    .keys(json)
    .reduce((agg, key) => agg + `${key}=${json[key]}
`, '')
}

function headers(headers) {
  return Object
    .keys(headers)
    .reduce((agg, key, i, arr) => agg + `  ${key}: ${headers[key]}${i < arr.length - 1 ? '\n' : ''}`, '')
}

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
  return color[VERB_COLORS[method]](method)
}

// outputs request information to stdout
// method, timestamp, path, body
function print(req) {
  const m = color.bold(colorizeMethod(req.method))
  const h = color.gray(headers(req.headers))
  const p = color.bold(color.white(req.path))
  //const now = color.yellow(req.timestamp.toISOString())
  console.log(m, p)
  //console.log(now)
  console.log(h)
  if (req.body) {
    console.log(color.gray(body(req)))
  } else {
    console.log()
  }
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
app.get('/_requests', (req, res) => {
  res.status(200)
    .json(RECORDED_REQUESTS)
})

// register listeners for all supported http verbs
SUPPORTED_VERBS.map(verb => verb.toLowerCase())
  .forEach(verb => app[verb]('/*', echo))

// start the server
const PORT = 3000 || process.env.PORT
app.listen(PORT)
console.log(`Echo API ready at ${PORT}`)
