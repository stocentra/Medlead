# MedLead: System Architecture Document

## 1. Executive Summary and Strategic Vision

MedLead is engineered as a sophisticated, multimodal clinical cognitive assistant. Its primary mission is not to replace the invaluable expertise of medical professionals but to exponentially augment their diagnostic, research, and decision-making capabilities. The platform targets a spectrum of medical experts, from students navigating complex clinical cases to seasoned specialists seeking the latest evidence-based insights. MedLead functions as an intelligent, ever-present collaborator, adept at understanding and processing vast streams of complex medical data, synthesizing this information with the most current global research, and delivering structured, reliable analysis to inform and elevate the quality of clinical decisions.

The core strategic pillar of the MedLead platform is the development of a proprietary **Data Flywheel**. This is not merely a feature but the foundational principle for our long-term competitive advantage. The architecture is meticulously designed to capture, anonymize, and structure every successful interaction between a clinician and the AI. These valuable data points, comprising the final engineered prompt, user-uploaded files (fully anonymized), and the model's response, are packaged into a standardized format (JSONL). This data is then securely stored in a scalable and cost-effective object storage solution. This continuous, automated process cultivates a rich, high-quality, and contextually relevant dataset of real-world medical interactions. In the future, this unique dataset will be the cornerstone for fine-tuning a custom, specialized MedLead AI model. This model, trained on nuanced clinical data, is envisioned to surpass the performance of any general-purpose AI in the medical domain, establishing MedLead's position as an indispensable tool in modern medicine.

## 2. Foundational Architectural Principles

The MedLead platform is constructed upon a set of robust, modern architectural principles designed to guarantee scalability, resilience, maintainability, and operational flexibility.

* **Decoupled Microservices:** The system's architecture is fundamentally based on a microservices pattern. Functionality is segregated into independent, single-responsibility services that communicate over well-defined APIs. This decoupling provides immense benefits: services can be developed, tested, deployed, and scaled independently of one another. It fosters fault isolation, preventing a failure in one component from cascading and bringing down the entire system. Furthermore, it allows for technological polyglotism; we can select the most appropriate technology for each service's specific requirements. This is exemplified by our choice of Go for the high-performance authentication service and Python for the AI and data processing service.

* **Containerization and Infrastructure Agnosticism:** Every backend service is encapsulated within a Docker container. This practice is central to our operational strategy. Containerization creates a consistent, immutable, and reproducible environment, eliminating the "it works on my machine" problem and ensuring that the software behaves identically across development, staging, and production environments. More importantly, it makes the entire system portable and vendor-agnostic. This principle was proven during our seamless migration from a managed Platform-as-a-Service (PaaS) to a self-hosted infrastructure on a dedicated server, a transition achieved with minimal friction and no changes to the application codebase.

* **Stateless Backend Services:** To achieve true horizontal scalability, all backend services (`go-api` and `api-python`) are designed to be stateless. They do not retain any session-specific data in memory or on local disk between requests. All state is externalized and managed through the central PostgreSQL database and stateless JSON Web Tokens (JWTs). This means any instance of a service can handle any request, allowing us to easily add or remove compute resources in response to traffic demands.

* **Security by Design:** Security is not an afterthought but a foundational layer of the architecture. A clear separation of concerns is enforced, with the `go-api` service designated as the sole authority and gatekeeper for authentication and authorization. It acts as a shield, ensuring that no request reaches downstream services like the AI engine without proper validation. This centralized security model simplifies auditing and protects the most critical components of the system.

## 3. Deep Dive into System Components

The MedLead ecosystem consists of four primary applications, each meticulously engineered for its specific role.

### 3.1. Go API (`go-api`): The Fortress and Source of Truth
* **Purpose and Role:** This service is the bedrock of the MedLead platform. It serves as the central hub for identity, authentication, user data management, and all administrative functions. It is the undisputed source of truth for any information related to user profiles and permissions. Its implementation in Go was a deliberate choice to ensure maximum performance, concurrency, and security for these critical operations.
* **Key Responsibilities:**
    * **User Lifecycle Management:** Handles the complete user journey, from initial registration to profile updates and account deletion.
    * **Secure Authentication:** Implements a robust login system, validates credentials against hashed passwords (bcrypt), and issues short-lived access tokens and long-lived refresh tokens using the JWT standard.
    * **Email Verification:** Manages the email verification workflow by generating unique tokens and dispatching transactional emails through the Resend service.
    * **Identity Verification Workflow:** Provides endpoints for users to upload verification documents, securely storing them on Cloudflare R2 and managing the `pending`, `verified`, and `rejected` states.
    * **Admin Backend:** Acts as the exclusive backend for the Admin Panel, exposing a suite of protected endpoints for managing users, reviewing verifications, creating discount codes, and monitoring the platform.
* **Technology Stack:**
    * **Language:** Go
    * **Database Interaction:** PostgreSQL with the `jackc/pgx/v5` library, specifically using `pgxpool` for highly concurrent and efficient database connection pooling.
    * **Web Framework:** Standard Library `net/http` for a lightweight and high-performance server.

### 3.2. Python API (`api-python`): The Orchestrator and Intelligence Core
* **Purpose and Role:** This service is the brain of the MedLead platform. It orchestrates all complex AI interactions, acting as the intelligent bridge between the user and the Large Language Model.
* **Key Responsibilities:**
    * **Authenticated Request Handling:** Receives chat requests from the frontend and initiates the authentication process.
    * **Inter-Service Authentication:** Validates the user's JWT by making a secure, server-to-server API call to the `go-api` service, retrieving the full user profile upon success.
    * **Dynamic Prompt Engineering:** This is the service's most critical function. It dynamically constructs a sophisticated, multi-part system prompt tailored to each user. It injects contextual information from the user's profile (e.g., "You are advising a 'resident' specializing in 'cardiology' in 'Germany'...") to guide the AI's response.
    * **AI Model Interaction:** Manages all communication with the Google Gemini 2.5 Pro model, including intelligently enabling or disabling the Google Search tool based on the query's content.
    * **Data Flywheel Implementation:** After a successful AI response is generated, it queues a non-blocking background task to persist the anonymized interaction data to the `medlead-training-data` bucket on Cloudflare R2.
* **Technology Stack:**
    * **Language:** Python 3.12
    * **Framework:** FastAPI, leveraging its asynchronous capabilities for high-concurrency I/O operations.
    * **AI Library:** `google-generativeai` for interacting with the Gemini API.
    * **HTTP Client:** `httpx` for making asynchronous server-to-server requests to the `go-api`.

### 3.3. Frontend (`frontend`): The Clinical Interface
* **Purpose and Role:** A modern, responsive Single Page Application (SPA) providing the primary user interface for medical professionals.
* **Key Responsibilities:**
    * Delivers a fluid and intuitive user registration and login experience.
    * Features a real-time chat interface powered by WebSockets, providing a seamless conversational experience.
    * Manages user sessions and JWTs securely within the browser, featuring an automatic token refresh mechanism to prevent session expiry.
    * Provides dedicated pages for users to manage their profile, track their verification status, and view notifications.
* **Technology Stack:**
    * **Framework:** React 18+ with Vite for a fast development experience and optimized builds.
    * **Language:** TypeScript for type safety and improved code quality.
    * **State Management:** Zustand, a lightweight and powerful state management library.
    * **Styling:** Tailwind CSS for a utility-first styling approach.

### 3.4. Admin Panel (`admin-panel`): The Command Center
* **Purpose and Role:** A comprehensive SPA designed for administrators and verifiers to manage and monitor the entire platform.
* **Key Responsibilities:**
    * Provides a complete overview of the user base with tools for searching, viewing details, and managing user accounts.
    * A dedicated interface for the identity verification workflow.
    * Dashboards for financial reporting, user analytics, and system health monitoring.
    * Tools for managing platform-wide settings like discount codes and for sending notifications to users.
* **Technology Stack:**
    * **Framework:** React 18+ with Vite.
    * **Language:** TypeScript.
    * **UI Library:** Material-UI (MUI), chosen for its rich set of pre-built components ideal for data-dense dashboards.
    * **State Management:** Zustand.

## 4. Infrastructure and Deployment Strategy

The MedLead platform operates on a self-hosted infrastructure, a deliberate choice to maximize control, performance, and cost-effectiveness.

* **Compute Infrastructure:**
    * **Provider:** OVH, a reputable European cloud provider.
    * **Server:** The backend services and database run on a dedicated virtual private server located in Frankfurt, Germany, ensuring low latency for European users.
    * **Specifications:** The server is provisioned with 4 CPU Cores, 8 GB of RAM, and 50 GB of NVMe Storage, providing ample resources for both application logic and the database.
    * **Operating System:** Linux Ubuntu (LTS).
    * **Deployment:** The `go-api` and `api-python` services are deployed as Docker containers on the server. A `docker-compose.yml` file defines the services, networks, and environment variables, simplifying the process of starting, stopping, and updating the application stack.

* **Database Infrastructure:**
    * **Type:** PostgreSQL.
    * **Hosting:** The database is self-hosted on the same OVH server. This co-location strategy minimizes network latency to near-zero for database queries originating from the backend services, resulting in faster API response times.
    * **Operational Responsibility:** The internal team is fully responsible for the database's operational lifecycle, including initial setup, security hardening, implementing a robust backup and recovery strategy (e.g., daily `pg_dump` to a separate storage), and performing regular maintenance and updates.

* **Networking and Content Delivery:**
    * **DNS and Security Proxy:** Cloudflare is a critical component of the infrastructure. It manages the DNS for the `medlead.ir` domain and acts as a reverse proxy for all backend traffic. The `api.medlead.ir` and `model.medlead.ir` DNS records point to the OVH server's IP address. This setup provides essential security features like DDoS mitigation, a Web Application Firewall (WAF), and automatic SSL/TLS encryption for all API traffic.
    * **Frontend Hosting:** The static assets for the `frontend` and `admin-panel` applications are deployed directly to Cloudflare Pages. This leverages Cloudflare's global edge network to deliver the user interface with extremely low latency to users anywhere in the world.

* **External Services and Storage:**
    * **Object Storage:** Cloudflare R2 remains the chosen solution for unstructured data due to its scalability and low cost. The two buckets, `medlead-verification-documents` and `medlead-training-data`, serve distinct but critical functions for security and future growth.
    * **Transactional Email:** Resend provides a reliable, API-driven service for sending all transactional emails, ensuring high deliverability for critical communications like account verification.

## 5. Critical Data and Interaction Flows

### User Onboarding and Verification Flow:
1.  **Registration:** A new user signs up on the `frontend`. This triggers a `POST` request to the `go-api`.
2.  **Database Creation:** The `go-api` hashes the password, creates a user record in PostgreSQL with `verification_status: 'not_submitted'`, and generates a unique email verification token.
3.  **Email Dispatch:** The `go-api` sends a verification email via Resend in a non-blocking background task (goroutine).
4.  **Email Confirmation:** The user clicks the link, sending a `GET` request to the `go-api`, which validates the token and nullifies it in the database.
5.  **Document Submission:** The user logs in and uploads their identity document via the `frontend`. The file is sent in a `multipart/form-data` request to a protected endpoint on the `go-api`.
6.  **Secure Storage:** The `go-api` streams the file directly to the `medlead-verification-documents` bucket on Cloudflare R2 and updates the user's status to `pending`.
7.  **Admin Review:** An administrator in the `admin-panel` sees the pending verification. They click to view the document.
8.  **Secure Access:** The `admin-panel` requests a short-lived, pre-signed URL from the `go-api`. The `go-api` generates this secure URL for the specific object in R2, allowing the admin's browser to download the file directly and securely without the file ever passing through the `go-api` server.
9.  **Final Decision:** The admin approves the submission. This action sends a final `POST` request to the `go-api`, which updates the user's `verification_status` to `verified`.

### Core AI Chat Request Flow:
1.  **User Query:** A fully verified user sends a message from the `frontend` chat interface.
2.  **Request to AI Service:** The `frontend` sends the query and conversation history, along with the user's JWT, to the `api-python` service.
3.  **Authentication Handshake:** The `api-python` service receives the request. Its first action is to authenticate the user. It does this by making an asynchronous, server-to-server `GET` request to the `go-api`'s `/users/me` endpoint, passing along the user's JWT.
4.  **Authorization Grant:** The `go-api` validates the JWT. If valid, it returns the full, detailed user profile as a JSON response to the `api-python` service.
5.  **Prompt Engineering:** Now in possession of the user's trusted profile data, the `api-python` service's prompt engine constructs the final, context-rich system prompt.
6.  **AI Invocation:** The service makes an asynchronous call to the Google Gemini API, sending the engineered prompt and the user's query.
7.  **Response Delivery:** Upon receiving the response from Gemini, `api-python` immediately streams the text back to the waiting `frontend`.
8.  **Data Flywheel Task:** Concurrently, `api-python` triggers a background task. This task creates the `TrainingRecord`, anonymizes any sensitive data, and uploads the resulting JSON object to the `medlead-training-data` bucket in Cloudflare R2. This crucial step is completely decoupled from the user's response time.