# Sample Architecture Document

This is a sample architecture document you can use to test the doc-diagram-pdf skill.

## System Overview

Our system follows a clean layered architecture with clear separation of concerns.

## Architecture Layers

### 1. API Layer
- REST API endpoints
- Request validation
- Response formatting
- Authentication middleware

### 2. Service Layer
- Business logic
- Transaction management
- Data transformation
- Business rules enforcement

### 3. Repository Layer
- Data access abstraction
- Query building
- Cache integration
- Connection pooling

### 4. Infrastructure Layer
- PostgreSQL database
- Redis cache
- Message queue (RabbitMQ)
- External APIs

## Data Flow

### Write Operation Flow
1. Client sends POST request
2. API layer validates request
3. Service layer processes business logic
4. Repository layer persists to database
5. Cache is invalidated
6. Success response returned

### Read Operation Flow
1. Client sends GET request
2. API layer validates request
3. Service checks cache
4. If cache miss, repository queries database
5. Result cached for future requests
6. Response returned to client

## Technology Stack

- **Framework**: FastAPI (Python)
- **Database**: PostgreSQL 15
- **Cache**: Redis 7
- **Message Queue**: RabbitMQ
- **ORM**: SQLAlchemy
- **API Documentation**: OpenAPI/Swagger

## Design Principles

- Separation of concerns
- Dependency injection
- Interface-based programming
- Testability
- Scalability
