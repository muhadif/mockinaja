package customgraphql

import (
	"errors"

	"github.com/graphql-go/graphql"
	"github.com/muhadif/mockinaja/backend/internal/auth"
	"github.com/muhadif/mockinaja/backend/internal/database"
	"github.com/muhadif/mockinaja/backend/internal/models"
)

var userType = graphql.NewObject(
	graphql.ObjectConfig{
		Name: "User",
		Fields: graphql.Fields{
			"id":        &graphql.Field{Type: graphql.String},
			"email":     &graphql.Field{Type: graphql.String},
			"name":      &graphql.Field{Type: graphql.String},
			"createdAt": &graphql.Field{Type: graphql.String},
		},
	},
)

var authPayloadType = graphql.NewObject(
	graphql.ObjectConfig{
		Name: "AuthPayload",
		Fields: graphql.Fields{
			"token": &graphql.Field{Type: graphql.String},
			"user":  &graphql.Field{Type: userType},
		},
	},
)

var mockEndpointType = graphql.NewObject(
	graphql.ObjectConfig{
		Name: "MockEndpoint",
		Fields: graphql.Fields{
			"id":              &graphql.Field{Type: graphql.String},
			"projectId":       &graphql.Field{Type: graphql.String},
			"path":            &graphql.Field{Type: graphql.String},
			"method":          &graphql.Field{Type: graphql.String},
			"statusCode":      &graphql.Field{Type: graphql.Int},
			"responseHeaders": &graphql.Field{Type: graphql.String},
			"responseBody":    &graphql.Field{Type: graphql.String},
			"delayMs":         &graphql.Field{Type: graphql.Int},
			"rateLimitTokens": &graphql.Field{Type: graphql.Int},
			"rateLimitWindow": &graphql.Field{Type: graphql.Int},
			"authHeader":      &graphql.Field{Type: graphql.String},
			"createdAt":       &graphql.Field{Type: graphql.String},
		},
	},
)

var projectType = graphql.NewObject(
	graphql.ObjectConfig{
		Name: "Project",
		Fields: graphql.Fields{
			"id":          &graphql.Field{Type: graphql.String},
			"name":        &graphql.Field{Type: graphql.String},
			"description": &graphql.Field{Type: graphql.String},
			"userId":      &graphql.Field{Type: graphql.String},
			"endpoints": &graphql.Field{
				Type: graphql.NewList(mockEndpointType),
				Resolve: func(p graphql.ResolveParams) (interface{}, error) {
					var endpoints []models.MockEndpoint
					project := p.Source.(models.Project)
					database.DB.Where("project_id = ?", project.ID).Find(&endpoints)
					return endpoints, nil
				},
			},
			"createdAt": &graphql.Field{Type: graphql.String},
		},
	},
)

var queryType = graphql.NewObject(
	graphql.ObjectConfig{
		Name: "Query",
		Fields: graphql.Fields{
			"projects": &graphql.Field{
				Type:        graphql.NewList(projectType),
				Description: "Get all projects for the authenticated user",
				Resolve: func(p graphql.ResolveParams) (interface{}, error) {
					userID := auth.UserIDFromContext(p.Context)
					if userID == "" {
						return nil, errors.New("unauthorized")
					}
					var projects []models.Project
					database.DB.Where("user_id = ?", userID).Find(&projects)
					return projects, nil
				},
			},
			"project": &graphql.Field{
				Type:        projectType,
				Description: "Get a single project by ID",
				Args: graphql.FieldConfigArgument{
					"id": &graphql.ArgumentConfig{Type: graphql.NewNonNull(graphql.String)},
				},
				Resolve: func(p graphql.ResolveParams) (interface{}, error) {
					userID := auth.UserIDFromContext(p.Context)
					if userID == "" {
						return nil, errors.New("unauthorized")
					}
					projectID := p.Args["id"].(string)

					var project models.Project
					if err := database.DB.Where("id = ? AND user_id = ?", projectID, userID).First(&project).Error; err != nil {
						return nil, errors.New("project not found or unauthorized")
					}
					return project, nil
				},
			},
			"mockEndpoint": &graphql.Field{
				Type:        mockEndpointType,
				Description: "Get a single mock endpoint by ID",
				Args: graphql.FieldConfigArgument{
					"id": &graphql.ArgumentConfig{Type: graphql.NewNonNull(graphql.String)},
				},
				Resolve: func(p graphql.ResolveParams) (interface{}, error) {
					userID := auth.UserIDFromContext(p.Context)
					if userID == "" {
						return nil, errors.New("unauthorized")
					}
					endpointID := p.Args["id"].(string)

					var endpoint models.MockEndpoint
					if err := database.DB.Preload("Project").Where("id = ?", endpointID).First(&endpoint).Error; err != nil {
						return nil, errors.New("endpoint not found or unauthorized")
					}

					if endpoint.Project.UserID != userID {
						return nil, errors.New("unauthorized")
					}
					return endpoint, nil
				},
			},
		},
	})

var mutationType = graphql.NewObject(graphql.ObjectConfig{
	Name: "Mutation",
	Fields: graphql.Fields{
		"register": &graphql.Field{
			Type:        authPayloadType,
			Description: "Register a new user",
			Args: graphql.FieldConfigArgument{
				"email":    &graphql.ArgumentConfig{Type: graphql.NewNonNull(graphql.String)},
				"name":     &graphql.ArgumentConfig{Type: graphql.NewNonNull(graphql.String)},
				"password": &graphql.ArgumentConfig{Type: graphql.NewNonNull(graphql.String)},
			},
			Resolve: func(params graphql.ResolveParams) (interface{}, error) {
				email := params.Args["email"].(string)
				name := params.Args["name"].(string)
				password := params.Args["password"].(string)

				hash, err := auth.HashPassword(password)
				if err != nil {
					return nil, err
				}

				user := models.User{
					Email:    email,
					Name:     name,
					Password: hash,
				}
				if err := database.DB.Create(&user).Error; err != nil {
					return nil, err
				}

				token, err := auth.GenerateToken(user.ID)
				if err != nil {
					return nil, err
				}

				return map[string]interface{}{
					"token": token,
					"user":  user,
				}, nil
			},
		},
		"login": &graphql.Field{
			Type:        authPayloadType,
			Description: "Login a user",
			Args: graphql.FieldConfigArgument{
				"email":    &graphql.ArgumentConfig{Type: graphql.NewNonNull(graphql.String)},
				"password": &graphql.ArgumentConfig{Type: graphql.NewNonNull(graphql.String)},
			},
			Resolve: func(params graphql.ResolveParams) (interface{}, error) {
				email := params.Args["email"].(string)
				password := params.Args["password"].(string)

				var user models.User
				if err := database.DB.Where("email = ?", email).First(&user).Error; err != nil {
					return nil, errors.New("invalid credentials")
				}

				if !auth.CheckPasswordHash(password, user.Password) {
					return nil, errors.New("invalid credentials")
				}

				token, err := auth.GenerateToken(user.ID)
				if err != nil {
					return nil, err
				}

				return map[string]interface{}{
					"token": token,
					"user":  user,
				}, nil
			},
		},
		"createProject": &graphql.Field{
			Type:        projectType,
			Description: "Create new project",
			Args: graphql.FieldConfigArgument{
				"name":        &graphql.ArgumentConfig{Type: graphql.NewNonNull(graphql.String)},
				"description": &graphql.ArgumentConfig{Type: graphql.String},
			},
			Resolve: func(params graphql.ResolveParams) (interface{}, error) {
				userID := auth.UserIDFromContext(params.Context)
				if userID == "" {
					return nil, errors.New("unauthorized: missing or invalid token")
				}

				project := models.Project{
					Name:        params.Args["name"].(string),
					Description: params.Args["description"].(string),
					UserID:      userID,
				}
				database.DB.Create(&project)
				return project, nil
			},
		},
		"createMockEndpoint": &graphql.Field{
			Type:        mockEndpointType,
			Description: "Create new mock endpoint",
			Args: graphql.FieldConfigArgument{
				"projectId":       &graphql.ArgumentConfig{Type: graphql.NewNonNull(graphql.String)},
				"path":            &graphql.ArgumentConfig{Type: graphql.NewNonNull(graphql.String)},
				"method":          &graphql.ArgumentConfig{Type: graphql.NewNonNull(graphql.String)},
				"statusCode":      &graphql.ArgumentConfig{Type: graphql.NewNonNull(graphql.Int)},
				"responseHeaders": &graphql.ArgumentConfig{Type: graphql.String},
				"responseBody":    &graphql.ArgumentConfig{Type: graphql.String},
				"delayMs":         &graphql.ArgumentConfig{Type: graphql.Int},
				"rateLimitTokens": &graphql.ArgumentConfig{Type: graphql.Int},
				"rateLimitWindow": &graphql.ArgumentConfig{Type: graphql.Int},
				"authHeader":      &graphql.ArgumentConfig{Type: graphql.String},
			},
			Resolve: func(params graphql.ResolveParams) (interface{}, error) {
				userID := auth.UserIDFromContext(params.Context)
				if userID == "" {
					return nil, errors.New("unauthorized: missing or invalid token")
				}
				projectID := params.Args["projectId"].(string)

				// Verify the project belongs to the user
				var project models.Project
				if err := database.DB.Where("id = ? AND user_id = ?", projectID, userID).First(&project).Error; err != nil {
					return nil, errors.New("unauthorized or project not found")
				}

				endpoint := models.MockEndpoint{
					ProjectID:  projectID,
					Path:       params.Args["path"].(string),
					Method:     params.Args["method"].(string),
					StatusCode: params.Args["statusCode"].(int),
				}
				if rh, ok := params.Args["responseHeaders"].(string); ok {
					endpoint.ResponseHeaders = rh
				}
				if rb, ok := params.Args["responseBody"].(string); ok {
					endpoint.ResponseBody = rb
				}
				if delay, ok := params.Args["delayMs"].(int); ok {
					endpoint.DelayMs = &delay
				}
				if tokens, ok := params.Args["rateLimitTokens"].(int); ok {
					endpoint.RateLimitTokens = &tokens
				}
				if window, ok := params.Args["rateLimitWindow"].(int); ok {
					endpoint.RateLimitWindow = &window
				}
				if authH, ok := params.Args["authHeader"].(string); ok {
					endpoint.AuthHeader = authH
				}
				database.DB.Create(&endpoint)
				return endpoint, nil
			},
		},
		"editProject": &graphql.Field{
			Type:        projectType,
			Description: "Edit an existing project",
			Args: graphql.FieldConfigArgument{
				"id":          &graphql.ArgumentConfig{Type: graphql.NewNonNull(graphql.String)},
				"name":        &graphql.ArgumentConfig{Type: graphql.String},
				"description": &graphql.ArgumentConfig{Type: graphql.String},
			},
			Resolve: func(params graphql.ResolveParams) (interface{}, error) {
				userID := auth.UserIDFromContext(params.Context)
				if userID == "" {
					return nil, errors.New("unauthorized: missing or invalid token")
				}

				projectID := params.Args["id"].(string)
				var project models.Project
				if err := database.DB.Where("id = ? AND user_id = ?", projectID, userID).First(&project).Error; err != nil {
					return nil, errors.New("project not found or unauthorized")
				}

				if name, ok := params.Args["name"].(string); ok {
					project.Name = name
				}
				if desc, ok := params.Args["description"].(string); ok {
					project.Description = desc
				}

				database.DB.Save(&project)
				return project, nil
			},
		},
		"deleteProject": &graphql.Field{
			Type:        graphql.Boolean,
			Description: "Delete a project by ID",
			Args: graphql.FieldConfigArgument{
				"id": &graphql.ArgumentConfig{Type: graphql.NewNonNull(graphql.String)},
			},
			Resolve: func(params graphql.ResolveParams) (interface{}, error) {
				userID := auth.UserIDFromContext(params.Context)
				if userID == "" {
					return nil, errors.New("unauthorized: missing or invalid token")
				}

				projectID := params.Args["id"].(string)
				// Delete all endpoints first
				database.DB.Where("project_id = ?", projectID).Delete(&models.MockEndpoint{})

				// Delete the project
				result := database.DB.Where("id = ? AND user_id = ?", projectID, userID).Delete(&models.Project{})
				if result.Error != nil || result.RowsAffected == 0 {
					return false, errors.New("project not found or unauthorized to delete")
				}
				return true, nil
			},
		},
		"editMockEndpoint": &graphql.Field{
			Type:        mockEndpointType,
			Description: "Edit an existing mock endpoint",
			Args: graphql.FieldConfigArgument{
				"id":              &graphql.ArgumentConfig{Type: graphql.NewNonNull(graphql.String)},
				"path":            &graphql.ArgumentConfig{Type: graphql.String},
				"method":          &graphql.ArgumentConfig{Type: graphql.String},
				"statusCode":      &graphql.ArgumentConfig{Type: graphql.Int},
				"responseHeaders": &graphql.ArgumentConfig{Type: graphql.String},
				"responseBody":    &graphql.ArgumentConfig{Type: graphql.String},
				"delayMs":         &graphql.ArgumentConfig{Type: graphql.Int},
				"rateLimitTokens": &graphql.ArgumentConfig{Type: graphql.Int},
				"rateLimitWindow": &graphql.ArgumentConfig{Type: graphql.Int},
				"authHeader":      &graphql.ArgumentConfig{Type: graphql.String},
			},
			Resolve: func(params graphql.ResolveParams) (interface{}, error) {
				userID := auth.UserIDFromContext(params.Context)
				if userID == "" {
					return nil, errors.New("unauthorized: missing or invalid token")
				}

				endpointID := params.Args["id"].(string)
				var endpoint models.MockEndpoint
				if err := database.DB.Preload("Project").Where("id = ?", endpointID).First(&endpoint).Error; err != nil {
					return nil, errors.New("endpoint not found")
				}

				if endpoint.Project.UserID != userID {
					return nil, errors.New("unauthorized")
				}

				if path, ok := params.Args["path"].(string); ok {
					endpoint.Path = path
				}
				if method, ok := params.Args["method"].(string); ok {
					endpoint.Method = method
				}
				if statusCode, ok := params.Args["statusCode"].(int); ok {
					endpoint.StatusCode = statusCode
				}
				if rh, ok := params.Args["responseHeaders"].(string); ok {
					endpoint.ResponseHeaders = rh
				}
				if rb, ok := params.Args["responseBody"].(string); ok {
					endpoint.ResponseBody = rb
				}
				if delay, ok := params.Args["delayMs"].(int); ok {
					endpoint.DelayMs = &delay
				}
				if tokens, ok := params.Args["rateLimitTokens"].(int); ok {
					endpoint.RateLimitTokens = &tokens
				}
				if window, ok := params.Args["rateLimitWindow"].(int); ok {
					endpoint.RateLimitWindow = &window
				}
				if authH, ok := params.Args["authHeader"].(string); ok {
					endpoint.AuthHeader = authH
				}

				database.DB.Save(&endpoint)
				return endpoint, nil
			},
		},
		"deleteMockEndpoint": &graphql.Field{
			Type:        graphql.Boolean,
			Description: "Delete a mock endpoint by ID",
			Args: graphql.FieldConfigArgument{
				"id": &graphql.ArgumentConfig{Type: graphql.NewNonNull(graphql.String)},
			},
			Resolve: func(params graphql.ResolveParams) (interface{}, error) {
				userID := auth.UserIDFromContext(params.Context)
				if userID == "" {
					return nil, errors.New("unauthorized: missing or invalid token")
				}

				endpointID := params.Args["id"].(string)
				var endpoint models.MockEndpoint
				if err := database.DB.Preload("Project").Where("id = ?", endpointID).First(&endpoint).Error; err != nil {
					return nil, errors.New("endpoint not found")
				}

				if endpoint.Project.UserID != userID {
					return nil, errors.New("unauthorized")
				}

				database.DB.Delete(&endpoint)
				return true, nil
			},
		},
	},
})

var Schema, _ = graphql.NewSchema(
	graphql.SchemaConfig{
		Query:    queryType,
		Mutation: mutationType,
	},
)
