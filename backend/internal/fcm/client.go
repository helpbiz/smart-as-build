package fcm

import (
	"context"
	"log"

	"smart-as/internal/config"
)

type FCMClient struct {
	enabled bool
}

func NewClient(cfg *config.FCMConfig) (*FCMClient, error) {
	if cfg == nil || cfg.CredentialsFile == "" {
		log.Println("FCM: Credentials not configured, push notifications disabled")
		return &FCMClient{enabled: false}, nil
	}

	log.Println("FCM: Client initialized successfully")
	return &FCMClient{enabled: true}, nil
}

func (f *FCMClient) IsEnabled() bool {
	return f.enabled
}

func (f *FCMClient) SendNotification(ctx context.Context, token string, title string, body string, data map[string]string) error {
	if !f.enabled {
		log.Printf("FCM: Notification skipped (disabled) - Title: %s, Body: %s", title, body)
		return nil
	}

	log.Printf("FCM: Would send notification to %s - Title: %s, Body: %s", token, title, body)
	return nil
}

func (f *FCMClient) SendToMultiple(ctx context.Context, tokens []string, title string, body string, data map[string]string) error {
	if !f.enabled {
		log.Printf("FCM: Bulk notification skipped (disabled)")
		return nil
	}

	log.Printf("FCM: Would send bulk notification to %d tokens - Title: %s, Body: %s", len(tokens), title, body)
	return nil
}
