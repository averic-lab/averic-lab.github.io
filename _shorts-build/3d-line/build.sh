#!/bin/sh
cd "$(dirname "$0")"
npx esbuild main.js --bundle --format=iife --loader:.png=dataurl --outfile=main.bundle.js --log-level=warning
