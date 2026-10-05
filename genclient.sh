#!/bin/bash
# Regenerates src/typed-client from the Canvas GraphQL schema. Uses CANVAS_BASE_URL and the
# first token in CANVAS_TOKENS from .env. Never hand-edit src/typed-client, rerun this instead.
set -e
cd "$(dirname "$0")"
set -a
. ./.env
set +a

# genql logs the request headers, so keep its output quiet to avoid printing the token
npx @genql/cli \
  --endpoint "$CANVAS_BASE_URL/api/graphql" \
  --output ./src/typed-client \
  -H "Authorization: Bearer ${CANVAS_TOKENS%%,*}" \
  -S DateTime:string \
  -S ISO8601DateTime:string \
  -S ISO8601Duration:string \
  -S JSON:any \
  -S StringMap:"Record<string, string>" \
  -S URL:string \
  > /dev/null

# genql writes extensionless relative imports, which node refuses to resolve in our ESM build
find ./src/typed-client -name '*.ts' -exec sed -i.bak -E \
  -e "s#from '\./runtime'#from './runtime/index.js'#" \
  -e "s#from '(\.\.?/[^'.]+)'#from '\1.js'#" {} +
find ./src/typed-client -name '*.bak' -delete

echo "Generated client in ./src/typed-client"
