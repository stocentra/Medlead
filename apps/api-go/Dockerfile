# --- Build Stage ---
# Use the official Go image as a builder
FROM golang:1.24-alpine AS builder

# Set the working directory inside the container
WORKDIR /app

# Copy the module files to leverage Docker layer caching
COPY apps/api-go/go.mod ./
COPY apps/api-go/go.sum ./

# Download dependencies
RUN go mod download

# Copy the rest of the source code for this service
COPY apps/api-go/ ./

# --- THE FIX IS HERE ---
# Build the application by explicitly pointing to the correct main package
# located in the ./cmd/api/ directory.
RUN CGO_ENABLED=0 go build -o /server ./cmd/api

# --- Final Stage ---
# Use a minimal, non-root image for the final container
FROM gcr.io/distroless/static-debian11

WORKDIR /

# Copy the built binary from the builder stage
COPY --from=builder /server /server

# Expose the port the app runs on
EXPOSE 8080

# Command to run the executable
CMD ["/server"]