#!/bin/sh
# The API server workflow handles building + serving the medlar frontend.
# This dev server is kept for the proxy routing configuration only.
# It runs on PORT (default 8082) so it does NOT conflict with the API server (8080).
trap '' HUP PIPE
exec node dev-server.mjs
