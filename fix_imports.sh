#!/bin/bash
find src/app/api/marketing -type f -name "*.js" | while read -r f; do
  depth=$(echo "$f" | awk -F"/" '{print NF}')
  # src/app/api/marketing/facebook/route.js is depth 6
  # src/app/api/marketing/facebook/ads/route.js is depth 7
  if [ "$depth" -eq 6 ]; then
    sed -i -E 's/(\.\.\/)+utils\//\.\.\/\.\.\/utils\//g' "$f"
  elif [ "$depth" -eq 7 ]; then
    sed -i -E 's/(\.\.\/)+utils\//\.\.\/\.\.\/\.\.\/utils\//g' "$f"
  fi
done
