#!/bin/bash
npm login
pnpm build

if [ "$1" = "--tag" ] && [ "$2" = "beta" ]; then
  npm publish --tag beta --access public
else
  npm version patch
  npm publish --access public
fi
