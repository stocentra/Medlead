# MedLead: Comprehensive API Reference Guide

## 1. Overview and Core Concepts

Welcome to the MedLead API documentation. This guide is the definitive resource for developers building client applications that interact with the MedLead backend infrastructure. A thorough understanding of this document is essential for successful integration.

The MedLead backend is architected as a set of decoupled microservices. As a developer, you will primarily interact with two distinct APIs, each serving a specific domain of responsibility:

* **Go API (Authentication & Data Core):** This is the foundational service for all user-related data, authentication, and platform management. It is the single source of truth for profiles, verification status, and administrative data.
* **Python API (AI Engine):** This service is the intelligent core of the platform, responsible for orchestrating all interactions with the language model, including prompt engineering and managing AI-specific logic.

### 1.1. Base URLs

All API endpoints are versioned to ensure backward compatibility.

* **Authentication & Data API (`go-api`):** `https://api.medlead.ir/v1`
* **AI Model API (`api-python`):** `https://model.medlead.ir/api/v1`

### 1.2. Authentication: The JWT Workflow

Security is paramount in the MedLead ecosystem. All protected endpoints across both APIs are secured using the **JWT Bearer Token** standard (JSON Web Token). A successful authentication flow is a prerequisite for accessing any user-specific or protected resource.

**The Authentication Flow:**

1.  **Initial Login:** The client application sends the user's email and password to the `POST /auth/login` endpoint on the Go API.
2.  **Token Issuance:** Upon successful credential validation, the Go API generates and returns two distinct tokens:
    * **`access_token`:** A short-lived token (15-minute expiry) that grants access to protected resources. Its limited lifespan is a security measure to mitigate the risk of a compromised token.
    * **`refresh_token`:** A long-lived token (7-day expiry) whose sole purpose is to obtain a new `access_token` without requiring the user to re-enter their credentials. This token should be stored securely by the client (e.g., in a secure, HttpOnly cookie or secure storage).
3.  **Making Authenticated Requests:** For every subsequent request to a protected endpoint (on either the Go or Python API), the client **must** include the `access_token` in the `Authorization` header with the `Bearer` scheme.

    **Example Header:**
    ```
    Authorization: Bearer <your_access_token>
    ```

4.  **Handling Token Expiry:** When a request fails with a `401 Unauthorized` status, the client should assume the `access_token` has expired. It must then make a request to the `POST /auth/refresh` endpoint, sending its stored `refresh_token`.
5.  **Session Renewal:** If the `refresh_token` is valid, the Go API will issue a new `access_token`. The client application should replace its expired token with this new one and seamlessly retry the original failed request. This entire process should be transparent to the user.

## 2. Go API (`api.medlead.ir`): The Data and Identity Service

This service, written in Go for performance and reliability, is the authoritative source for all core platform data.

### 2.1. Public Authentication Endpoints

These endpoints are accessible without an authentication token and manage the initial stages of the user lifecycle.

#### **`POST /auth/register`**
This endpoint is used to create a new user account in the MedLead system.

* **Purpose:** Onboards a new medical professional by collecting their initial details. Upon successful creation, it triggers a background process to send a verification email.
* **Request Body (`RegisterRequest`):**
    ```json
    {
      "email": "jane.doe@universityclinic.com",
      "password": "A-very-strong-password-with-symbols-123!",
      "full_name": "Dr. Jane Doe",
      "country": "Germany",
      "professional_level": "resident",
      "phone_number": "+491234567890"
    }
    ```
* **Field Descriptions:**
    * `email` (string, required): A unique email address for the user.
    * `password` (string, required): The user's chosen password. Must meet complexity requirements enforced by the client.
    * `full_name` (string, required): The user's full name.
    * `country` (string, required): The user's country of practice.
    * `professional_level` (string, required): An enum representing the user's professional status (e.g., `medical_student_stager`, `resident`, `specialist`).
    * `phone_number` (string, optional): The user's contact phone number.
* **Successful Response:** `201 Created` with the full `Profile` object of the newly created user (excluding sensitive fields like the password hash).

#### **`POST /auth/login`**
Authenticates a user based on their credentials and provides the necessary tokens to establish a session.

* **Purpose:** Verifies a user's identity and issues the JWTs required for accessing protected parts of the application. The user's email must be verified before login is permitted.
* **Request Body (`LoginRequest`):**
    ```json
    {
      "email": "jane.doe@universityclinic.com",
      "password": "A-very-strong-password-with-symbols-123!"
    }
    ```
* **Successful Response:** `200 OK` with a `LoginResponse` object containing the tokens and the user profile.
    ```json
    {
      "access_token": "ey...",
      "refresh_token": "ey...",
      "user": {
        "id": "c3a2b1f0-...",
        "email": "jane.doe@universityclinic.com",
        "full_name": "Dr. Jane Doe",
        "verification_status": "not_submitted",
        ...
      }
    }
    ```

#### **`POST /auth/refresh`**
Used to obtain a new `access_token` when the current one has expired.

* **Purpose:** Allows for seamless session renewal without interrupting the user experience.
* **Request Body:**
    ```json
    {
      "refresh_token": "<the_long_lived_refresh_token>"
    }
    ```
* **Successful Response:** `200 OK` with a `RefreshResponse` object containing the new `access_token`.
    ```json
    {
      "access_token": "ey..."
    }
    ```

### 2.2. Protected User Endpoints

These endpoints require a valid `access_token` in the `Authorization` header.

#### **`GET /users/me`**
Retrieves the complete, detailed profile of the currently authenticated user.

* **Purpose:** Allows the client application to fetch all profile information for display and context, including sensitive details not sent at login.
* **Successful Response:** `200 OK` with the user's full `Profile` object as defined in the system's data models.

#### **`PATCH /users/me`**
Updates a subset of the authenticated user's profile information.

* **Purpose:** Allows users to modify their personal and professional details. Only the fields provided in the request body will be updated.
* **Request Body (`UpdateProfileRequest`):**
    ```json
    {
      "full_name": "Dr. Jane Marie Doe",
      "phone_number": "+490987654321",
      "university": "Heidelberg University"
    }
    ```
* **Successful Response:** `200 OK` with the entire, updated `Profile` object.

#### **`POST /users/upload-document`**
Uploads a file for the user identity verification process.

* **Purpose:** This is a critical step in the user's journey to becoming a verified professional on the platform. The request must be `multipart/form-data`.
* **Form Field:** The request must contain a single file field named `document`. The file should be a common image format (JPG, PNG) or a PDF.
* **Successful Response:** `202 Accepted`. This indicates the file has been received and is queued for review. The user's `verification_status` is automatically transitioned to `pending`.
* **Error Response:** `413 Payload Too Large` if the file exceeds the server's size limit (e.g., 10MB).

### 2.3. Protected Admin Endpoints

These endpoints are strictly for administrative use and require an `access_token` from a user with the `admin` role. Access attempts by regular users will result in a `403 Forbidden` error.

#### **`GET /admin/users`**
Fetches a paginated and searchable list of all users on the platform.

* **Purpose:** Provides the core data for the user management table in the admin panel.
* **Query Parameters:**
    * `page` (integer, optional, default: 1): The page number to retrieve.
    * `pageSize` (integer, optional, default: 10): The number of users per page.
    * `search` (string, optional): A search term to filter users by `full_name` or `email`.
* **Successful Response:** `200 OK` with a `UserListResponse` object containing the list of users and pagination metadata.

#### **`POST /admin/verifications/{userID}`**
Sets the verification status of a user after reviewing their documents.

* **Purpose:** The final step in the identity verification workflow.
* **Path Parameter:** `userID` (string, required): The UUID of the user being reviewed.
* **Request Body:**
    ```json
    {
      "action": "approve",
      "reason": "Document is clear and valid."
    }
    ```
    * `action` can be either `approve` (sets status to `verified`) or `reject` (sets status to `rejected`).
* **Successful Response:** `204 No Content`, indicating the status was updated successfully.

#### **`GET /admin/plans`**
Retrieves a list of all active subscription plans available in the system.

* **Purpose:** Used to populate the "Assign to Plan" dropdown in the discount code creation form in the admin panel.
* **Successful Response:** `200 OK` with an array of `Plan` objects.

#### **`POST /admin/discounts`**
Creates a new discount code.

* **Purpose:** Allows administrators to generate new promotional codes.
* **Request Body (`CreateDiscountCodeRequest`):**
    ```json
    {
      "code": "SUMMER2025",
      "discount_percentage": 15,
      "plan_id": 2,
      "expiration_date": "2025-09-30T23:59:59Z",
      "usage_limit": 100
    }
    ```
    * `plan_id` (integer, optional): If provided, links the code to a specific subscription plan. If `null`, the code is generic.
* **Successful Response:** `201 Created` with the newly created `DiscountCode` object.

## 3. Python API (`model.medlead.ir`): The AI Gateway

This service, written in Python with FastAPI, is the sole entry point for all AI-related functionality. Every endpoint is protected and requires a valid `access_token`.

### 3.1. Core Chat Endpoint

#### **`POST /api/v1/chat`**
This is the primary endpoint for all conversational interactions with the MedLead AI assistant.

* **Purpose:** Receives a user's query and conversation history, orchestrates the entire AI response generation process, and returns the model's answer. It also triggers the background task for the Data Flywheel.
* **Request Body (`ChatRequest`):**
    ```json
    {
      "query": "What are the latest ESC guidelines for managing atrial fibrillation in patients with heart failure?",
      "history": [
        { "role": "user", "content": "Tell me about atrial fibrillation." },
        { "role": "assistant", "content": "Atrial fibrillation (AF) is the most common cardiac arrhythmia..." }
      ]
    }
    ```
* **Field Descriptions:**
    * `query` (string, required): The user's most recent message or question.
    * `history` (array of `Message` objects, optional): The preceding conversation history, which is crucial for maintaining context.
* **Successful Response:** `200 OK` with a `ChatResponse` object.
    ```json
    {
      "response": "The 2023 ESC Guidelines for the management of atrial fibrillation emphasize..."
    }
    ```

## 4. General Error Handling

Client applications should be prepared to handle standard HTTP status codes.

* **`400 Bad Request`:** This indicates an issue with the client's request itself. The response body will often contain a `detail` field with a human-readable explanation, such as "User query cannot be empty." or "Invalid JSON body."
* **`401 Unauthorized`:** This almost always means the provided `access_token` is either missing, malformed, or expired. The client should initiate the token refresh flow.
* **`403 Forbidden`:** The user's token is valid (they are authenticated), but they do not have the necessary permissions for the requested resource (e.g., a regular user attempting to access `GET /admin/users`).
* **`404 Not Found`:** The specific resource requested could not be found, e.g., `GET /admin/users/non-existent-uuid`.
* **`500 Internal Server Error`:** This indicates an unexpected problem on the server side that prevented the request from being fulfilled. The client should inform the user that a temporary problem has occurred.
* **`503 Service Unavailable`:** This specific error is used by the `api-python` service to indicate that it could not connect to a critical downstream service, such as the `go-api` for authentication. The client should treat this as a temporary outage.