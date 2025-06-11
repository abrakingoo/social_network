FROM golang:1.24.3-alpine3.22 AS builder

ENV CGO_ENABLED=1
ENV GOOS=linux
ENV GOARCH=amd64

# Set the working directory inside the container
WORKDIR /app

# Copy go.mod and go.sum first to leverage Docker cache
COPY go.mod go.sum ./

# Download Go modules dependencies
# This step is cached unless go.mod or go.sum changes
RUN go mod download
RUN apk update && apk add --no-cache build-base

# Copy the rest of the application source code
COPY . .


EXPOSE 8000

CMD ["go","run","."]
