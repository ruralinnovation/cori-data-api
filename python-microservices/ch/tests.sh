#!/bin/bash
API_URL=$1
# run all *.robot tests starting in this directory and setting the server url from env var
robot --variable server:$API_URL .
