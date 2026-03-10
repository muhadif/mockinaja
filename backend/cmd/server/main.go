package main

import (
	"log"
	"net/http"
	"os"

	"github.com/go-chi/chi/v5"
	"github.com/go-chi/chi/v5/middleware"
	"github.com/go-chi/cors"
	"github.com/graphql-go/handler"
	"github.com/joho/godotenv"
	"github.com/muhadif/mockinaja/backend/internal/auth"
	"github.com/muhadif/mockinaja/backend/internal/database"
	customgraphql "github.com/muhadif/mockinaja/backend/internal/graphql"
	"github.com/muhadif/mockinaja/backend/internal/router"
)

func main() {
	if err := godotenv.Load(); err != nil {
		log.Println("No .env file found; using environment variables.")
	}

	dsn := os.Getenv("DATABASE_URL")
	if dsn == "" {
		// Fallback local postgres url
		dsn = "host=localhost user=postgres password=postgres dbname=mockinaja port=5432 sslmode=disable"
	}

	database.Connect(dsn)

	r := chi.NewRouter()

	// Generic middlewares
	r.Use(middleware.Logger)
	r.Use(middleware.Recoverer)

	// Basic CORS
	r.Use(cors.Handler(cors.Options{
		AllowedOrigins:   []string{"*"}, // Adjust in prod to allow only Next.js site
		AllowedMethods:   []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"},
		AllowedHeaders:   []string{"Accept", "Authorization", "Content-Type", "X-CSRF-Token"},
		ExposedHeaders:   []string{"Link"},
		AllowCredentials: true,
		MaxAge:           300,
	}))

	// Auth Context
	r.Use(auth.ContextMiddleware)

	// GraphQL API route
	h := handler.New(&handler.Config{
		Schema:   &customgraphql.Schema,
		Pretty:   true,
		GraphiQL: false, // You can use Altair or Postman instead of playground
	})

	r.Handle("/graphql", h)

	// Mount the dynamically generated mock router at /mock/
	r.Mount("/mock", router.NewMockRouter())

	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	log.Printf("Connect to http://localhost:%s/graphql for GraphQL API", port)
	log.Fatal(http.ListenAndServe(":"+port, r))
}
