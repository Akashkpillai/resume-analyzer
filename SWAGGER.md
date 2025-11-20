# Swagger API Documentation Guide

## Overview

The Resume Analyzer API includes comprehensive Swagger/OpenAPI documentation for all endpoints. This interactive documentation allows you to test the API directly from your browser.

## Accessing Swagger UI

Once the backend server is running, access Swagger UI at:

**http://localhost:3001/api**

## Features

### 1. Interactive API Testing
- Test all endpoints directly from the browser
- See request/response examples
- Validate API behavior without using external tools

### 2. Authentication
- Click the **"Authorize"** button (top right)
- Enter your JWT token in the format: `Bearer <your-token>`
- Or just enter the token without "Bearer" prefix
- The token will be automatically included in all authenticated requests

### 3. Endpoint Documentation

#### Authentication Endpoints (`/auth`)
- **POST /auth/register** - Register a new user
- **POST /auth/login** - Login and get JWT token
- **GET /auth/profile** - Get current user profile (requires authentication)

#### Resume Endpoints (`/resumes`)
- **POST /resumes/upload** - Upload resume files (PDF only, multiple)
- **GET /resumes** - Get all resumes with pagination and filters
- **GET /resumes/stats** - Get statistics and skill frequency
- **GET /resumes/:id** - Get a specific resume by ID
- **DELETE /resumes/:id** - Delete a resume

## Using Swagger UI

### Step 1: Get Authentication Token

1. Navigate to the `/auth/register` or `/auth/login` endpoint
2. Click "Try it out"
3. Enter your credentials:
   ```json
   {
     "email": "user@example.com",
     "password": "password123",
     "name": "John Doe"  // Only for register
   }
   ```
4. Click "Execute"
5. Copy the `access_token` from the response

### Step 2: Authorize

1. Click the **"Authorize"** button at the top
2. Paste your token (or `Bearer <token>`)
3. Click "Authorize"
4. Click "Close"

### Step 3: Test Endpoints

Now you can test any authenticated endpoint:

1. Expand the endpoint you want to test
2. Click "Try it out"
3. Fill in any required parameters
4. Click "Execute"
5. View the response

## Example: Uploading a Resume

1. Go to **POST /resumes/upload**
2. Click "Try it out"
3. Click "Choose File" and select one or more PDF files
4. Click "Execute"
5. View the parsed resume data in the response

## Example: Filtering Resumes

1. Go to **GET /resumes**
2. Click "Try it out"
3. Set query parameters:
   - `page`: 1
   - `limit`: 10
   - `search`: "developer" (optional)
   - `skill`: "JavaScript" (optional)
4. Click "Execute"
5. View the filtered results

## Response Schemas

All endpoints include detailed response schemas showing:
- Response structure
- Data types
- Example values
- Error responses

## Error Handling

Swagger documents all possible error responses:
- **400** - Bad Request (validation errors)
- **401** - Unauthorized (invalid/missing token)
- **404** - Not Found (resource doesn't exist)
- **409** - Conflict (e.g., email already exists)

## Exporting API Spec

You can export the OpenAPI specification:
- Click the URL shown at the top of Swagger UI
- Or access: http://localhost:3001/api-json
- Use this spec with other tools (Postman, Insomnia, etc.)

## Tips

1. **Persistent Authorization**: The token persists across page refreshes
2. **Schema Validation**: Swagger validates your requests before sending
3. **Response Examples**: Each endpoint shows example responses
4. **Try Multiple Scenarios**: Test different parameter combinations

## Troubleshooting

### Token Not Working
- Ensure you copied the full token
- Check token hasn't expired (default: 7 days)
- Try logging in again to get a fresh token

### CORS Errors
- Ensure backend CORS is configured correctly
- Check `FRONTEND_URL` in backend `.env`

### File Upload Issues
- Maximum file size: 10MB per PDF
- Supported formats: PDF only
- Check files are not corrupted

## Next Steps

- Use Swagger to understand the API structure
- Test all endpoints before integrating with frontend
- Share the Swagger URL with your team for API documentation
- Export the OpenAPI spec for API client generation

