#!/bin/bash

# Copy README.md from ../ to ./
cp ../README.md ./

# Copy LICENSE.md from ../ to ./
cp ../LICENSE.md ./

npm run build

npm version patch

npm publish



