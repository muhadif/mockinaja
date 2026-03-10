package router

import (
	"bytes"
	"encoding/json"
	"io"
	"net/http"
	"strings"
	"sync"
	"time"

	"github.com/brianvoe/gofakeit/v6"
	"github.com/go-chi/chi/v5"
	"github.com/muhadif/mockinaja/backend/internal/database"
	"github.com/muhadif/mockinaja/backend/internal/models"
	"golang.org/x/time/rate"
)

var limiters = sync.Map{}

func getLimiter(endpointID string, tokens, window int) *rate.Limiter {
	limiter, exists := limiters.Load(endpointID)
	if !exists {
		// rate = events per second
		r := rate.Limit(float64(tokens) / float64(window))
		newLimiter := rate.NewLimiter(r, tokens)
		limiters.Store(endpointID, newLimiter)
		return newLimiter
	}
	return limiter.(*rate.Limiter)
}

func parseDynamicResponse(body string, r *http.Request) string {
	if !strings.Contains(body, "{{") {
		return body
	}

	parsed := body

	// Basic Query string replace: {{ request.query.key }}
	for key, values := range r.URL.Query() {
		if len(values) > 0 {
			placeholder := "{{ request.query." + key + " }}"
			parsed = strings.ReplaceAll(parsed, placeholder, values[0])
		}
	}

	// Basic JSON Body replace: {{ request.body.key }}
	if r.Body != nil {
		bodyBytes, _ := io.ReadAll(r.Body)
		r.Body = io.NopCloser(bytes.NewBuffer(bodyBytes)) // restore body
		var jsonBody map[string]interface{}
		if err := json.Unmarshal(bodyBytes, &jsonBody); err == nil {
			for key, val := range jsonBody {
				if strVal, ok := val.(string); ok {
					placeholder := "{{ request.body." + key + " }}"
					parsed = strings.ReplaceAll(parsed, placeholder, strVal)
				}
			}
		}
	}

	// Fake data generation: anything surrounded by {name}, {uuid}, etc.
	parsed = gofakeit.Generate(parsed)

	return parsed
}

func NewMockRouter() *chi.Mux {
	r := chi.NewRouter()

	r.HandleFunc("/{projectID}/*", func(w http.ResponseWriter, r *http.Request) {
		projectID := chi.URLParam(r, "projectID")

		// The wildcard route "*" returns everything after the slash.
		// So if route is /mock/{id}/api/test, wildcard is "api/test"
		wildcardPath := chi.URLParam(r, "*")
		path := "/" + wildcardPath // Add leading slash to match user configuration in UI
		if wildcardPath == "" {
			path = "/"
		}

		method := r.Method

		// Look up matching endpoint from the database scoped by projectID
		var endpoint models.MockEndpoint
		result := database.DB.Where("project_id = ? AND path = ? AND method = ?", projectID, path, method).First(&endpoint)

		if result.Error != nil {
			http.Error(w, "Mock endpoint not found", http.StatusNotFound)
			return
		}

		// 1. Authentication Check
		if endpoint.AuthHeader != "" {
			reqAuth := r.Header.Get("Authorization")
			if reqAuth != endpoint.AuthHeader {
				http.Error(w, "Unauthorized: Invalid or missing token", http.StatusUnauthorized)
				return
			}
		}

		// 2. Rate Limiting
		if endpoint.RateLimitTokens != nil && endpoint.RateLimitWindow != nil {
			limiter := getLimiter(endpoint.ID, *endpoint.RateLimitTokens, *endpoint.RateLimitWindow)
			if !limiter.Allow() {
				http.Error(w, "Rate limit exceeded", http.StatusTooManyRequests)
				return
			}
		}

		// 3. Simulated Latency/Delay
		if endpoint.DelayMs != nil && *endpoint.DelayMs > 0 {
			time.Sleep(time.Duration(*endpoint.DelayMs) * time.Millisecond)
		}

		// Parse response headers
		if endpoint.ResponseHeaders != "" {
			var headers map[string]string
			if err := json.Unmarshal([]byte(endpoint.ResponseHeaders), &headers); err == nil {
				for k, v := range headers {
					w.Header().Set(k, v)
				}
			}
		}

		// 4. Dynamic Response Parsing
		finalBody := endpoint.ResponseBody
		if finalBody != "" {
			finalBody = parseDynamicResponse(finalBody, r)
		}

		w.WriteHeader(endpoint.StatusCode)
		if finalBody != "" {
			w.Write([]byte(finalBody))
		}
	})

	return r
}
