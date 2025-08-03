# --- Build Stage ---
# Use the official Go image as a builder
FROM golang:1.24-alpine AS builder

# Set the working directory inside the container
WORKDIR /app

# --- THIS IS THE CORRECTED PART ---
# Copy only the go.mod file first.
COPY apps/api-go/go.mod ./

# Download dependencies. This will create a go.sum file inside the container
# if any dependencies exist. It won't fail if there are none.
RUN go mod download

# Now, copy the rest of the source code for this service
COPY apps/api-go/ ./

# Build the application
RUN CGO_ENABLED=0 go build -o /server ./cmd

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