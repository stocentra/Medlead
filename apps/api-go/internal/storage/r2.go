package storage

import (
	"context"
	"fmt"
	"io"
	"time"

	"github.com/aws/aws-sdk-go-v2/aws"
	"github.com/aws/aws-sdk-go-v2/config"
	"github.com/aws/aws-sdk-go-v2/credentials"
	"github.com/aws/aws-sdk-go-v2/service/s3"
	"github.com/google/uuid"
)

// R2Uploader handles file uploads to an R2 bucket.
type R2Uploader struct {
	Client        *s3.Client
	PresignClient *s3.PresignClient
	BucketName    string
}

// NewR2Uploader creates a new uploader instance for R2.
func NewR2Uploader(endpoint, accessKeyID, secretAccessKey, bucketName string) (*R2Uploader, error) {
	resolver := aws.EndpointResolverWithOptionsFunc(func(service, region string, options ...interface{}) (aws.Endpoint, error) {
		return aws.Endpoint{
			URL: endpoint,
		}, nil
	})

	cfg, err := config.LoadDefaultConfig(context.TODO(),
		config.WithEndpointResolverWithOptions(resolver),
		config.WithCredentialsProvider(credentials.NewStaticCredentialsProvider(accessKeyID, secretAccessKey, "")),
		config.WithRegion("auto"),
	)
	if err != nil {
		return nil, fmt.Errorf("failed to load s3 config: %w", err)
	}

	client := s3.NewFromConfig(cfg)
	presignClient := s3.NewPresignClient(client)

	return &R2Uploader{
		Client:        client,
		PresignClient: presignClient,
		BucketName:    bucketName,
	}, nil
}

// UploadFile uploads a file to the R2 bucket.
func (u *R2Uploader) UploadFile(ctx context.Context, userID uuid.UUID, file io.Reader, objectKey string) error {
	_, err := u.Client.PutObject(ctx, &s3.PutObjectInput{
		Bucket: &u.BucketName,
		Key:    &objectKey,
		Body:   file,
	})
	if err != nil {
		return fmt.Errorf("failed to upload file to r2: %w", err)
	}
	return nil
}

// GetPresignedURL generates a temporary, secure URL to download a private object.
func (u *R2Uploader) GetPresignedURL(ctx context.Context, objectKey string) (string, error) {
	presignedRequest, err := u.PresignClient.PresignGetObject(ctx, &s3.GetObjectInput{
		Bucket: &u.BucketName,
		Key:    &objectKey,
	}, func(opts *s3.PresignOptions) {
		opts.Expires = time.Duration(15 * time.Minute) // URL is valid for 15 minutes
	})
	if err != nil {
		return "", fmt.Errorf("failed to generate presigned url: %w", err)
	}
	return presignedRequest.URL, nil
}
