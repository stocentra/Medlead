# --- Build Stage ---
# Use the official Go image as a builder
FROM golang:1.21-alpine AS builder

# Set the working directory inside the container
WORKDIR /app

# --- THIS IS THE CORRECTED PART ---
# Copy go.mod and go.sum files from their specific path in the monorepo
# into the current working directory (/app)
COPY apps/api-go/go.mod apps/api-go/go.sum ./
RUN go mod download

# Copy the source code of the api-go service into the container
COPY apps/api-go/ ./

# Build the application by pointing to the main package inside the cmd directory
RUN CGO_ENABLED=0 go build -o /server ./cmd

# --- Final Stage ---
# Use a minimal, non-root image for the final container
FROM gcr.io/distroless/static-debian11

WORKDIR /

# Copy the built binary from the builder stage
COPY --from=builder /server /server

# Expose the port the app runs on (Koyeb sets this to 8080)
EXPOSE 8080

# Command to run the executable
CMD ["/server"]