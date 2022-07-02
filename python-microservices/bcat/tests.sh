#!/bin/bash
API_URL=$1
TOKEN=$2
DIR=$3
# run all *.robot tests starting in this directory and setting the server url from env var
robot --variable server:$API_URL --variable token:$TOKEN $DIR
