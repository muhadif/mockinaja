package auth

import (
	"context"
	"net/http"
	"strings"
)

type contextKey string

const UserIDKey contextKey = "userID"

// ContextMiddleware parses the JWT from the Authorization header and
// adds the UserID to the request context. It does not block requests
// if the token is missing or invalid, as some GraphQL queries (like login/register)
// must be publicly accessible.
func ContextMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		authHeader := r.Header.Get("Authorization")
		if authHeader == "" || !strings.HasPrefix(authHeader, "Bearer ") {
			next.ServeHTTP(w, r)
			return
		}

		tokenString := strings.TrimPrefix(authHeader, "Bearer ")
		claims, err := ValidateToken(tokenString)
		if err != nil || claims == nil {
			next.ServeHTTP(w, r)
			return
		}

		// Add UserID to context
		ctx := context.WithValue(r.Context(), UserIDKey, claims.UserID)
		next.ServeHTTP(w, r.WithContext(ctx))
	})
}

// UserIDFromContext retrieves the user ID from the GraphQL resolver context.
func UserIDFromContext(ctx context.Context) string {
	if val := ctx.Value(UserIDKey); val != nil {
		if id, ok := val.(string); ok {
			return id
		}
	}
	return ""
}
