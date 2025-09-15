#!/bin/bash

# # Copy README.md from ../ to ./
# cp ../README.md ./

# Copy LICENSE.md from ../ to ./
cp ../LICENSE.md ./

npm run build

if [ "$1" = "--tag" ] && [ "$2" = "beta" ]; then
  npm publish --tag beta
else
  npm version patch
  npm publish
fi

