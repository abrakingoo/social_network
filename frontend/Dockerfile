FROM node:24-alpine3.22 as builder

# set working directory
WORKDIR /app

ENV NEXT_TELEMETRY_DISABLED 1

COPY package*.json ./


RUN npm i -D


# copy the rest of the application code
COPY . .

# Build the NextJS app
RUN npm run build



FROM node:24-alpine3.22 as runner
WORKDIR /app

ENV NODE_ENV production
ENV NEXT_TELEMETRY_DISABLED 1


RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs


COPY --from=builder --chown=nextjs:nodejs /app/.next ./.next
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json

USER nextjs

EXPOSE 3000

ENV PORT 3000

CMD ["npm","run","start"]
