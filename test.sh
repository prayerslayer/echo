#!/bin/bash

curl localhost:3000
curl -X PUT -H "Content-Type: application/json" -d '{"json_supported": true}'  localhost:3000
curl -H "X-Weird-Header: LOL" localhost:3000
curl -X POST -d "form_data_supported=yes" localhost:3000
curl -X DELETE localhost:3000/foo
