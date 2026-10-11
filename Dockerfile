# ROLET web. One Node process: the match queue lives in memory, so this image
# must run as a single replica.
FROM node:20-alpine AS builder
# Wallet and crypto packages build native addons through node-gyp; the usb
# package also needs libudev headers.
RUN apk add --no-cache python3 make g++ linux-headers eudev-dev
RUN corepack enable
WORKDIR /app
# Public client values, inlined at build time. They are not secrets.
ENV NEXT_PUBLIC_RPC_ENDPOINT=/api/rpc
ENV NEXT_PUBLIC_SOLANA_NETWORK=devnet
ENV NEXT_PUBLIC_ROLET_PROGRAM_ID=mspQcUFhmAGYUsnBbcUndhaZiris53KtwYCjDHU91oH
ENV NEXT_PUBLIC_MAGICBLOCK_ER_ENDPOINT=https://devnet-eu.magicblock.app
COPY . .
RUN pnpm install --frozen-lockfile
RUN pnpm --filter web build

FROM node:20-alpine AS runner
RUN corepack enable
WORKDIR /app
ENV NODE_ENV=production
COPY --from=builder /app ./
EXPOSE 3001
CMD ["sh", "-c", "pnpm --filter web exec next start --port ${PORT:-3001}"]
