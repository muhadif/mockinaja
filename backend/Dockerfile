FROM golang:1.25-alpine AS builder
 
WORKDIR /app
 
# Install dependencies
COPY go.mod go.sum .
RUN go mod tidy
 
# Copy source code
COPY . .
 
# Build the application
RUN CGO_ENABLED=0 GOOS=linux go build -o main ./cmd/server/main.go
 
# Final stage
FROM alpine:latest
 
WORKDIR /app
 
# Copy binary from builder
COPY --from=builder /app/main .
 
# Expose port
EXPOSE 8080
 
# Command to run
CMD ["./main"]