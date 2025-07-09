#!/bin/bash

# Copy README.md from ../ to ./
cp ../README.md ./

# Copy LICENSE.md from ../ to ./
cp ../LICENSE.md ./

bun run build

npm version patch

if [ "$1" = "--tag" ] && [ "$2" = "beta" ]; then
  npm publish --tag beta
else
  npm publish
fi

