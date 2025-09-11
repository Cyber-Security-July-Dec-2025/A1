# Docker Setup for Secure File Vault

This guide explains how to dockerize and run your Secure File Vault application using Docker and Docker Compose.

## Prerequisites

- Docker (version 20.10 or higher)
- Docker Compose (version 2.0 or higher)

## Project Structure

```
secure-file-vault/
├── client/                 # React frontend
│   ├── Dockerfile
│   ├── nginx.conf
│   └── .dockerignore
├── server/                 # Node.js backend
│   ├── Dockerfile
│   └── .dockerignore
├── docker-compose.yml      # Multi-container orchestration
├── env.example            # Environment variables template
└── DOCKER_README.md       # This file
```

## Quick Start

1. **Clone and navigate to the project directory:**
   ```bash
   cd /Users/anirudh/Documents/secure-file-vault
   ```

2. **Build and start all services:**
   ```bash
   docker-compose up --build
   ```

3. **Access the application:**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:5000

## Available Commands

### Build and Run
```bash
# Build and start all services
docker-compose up --build

# Run in detached mode (background)
docker-compose up -d --build

# Start only specific services
docker-compose up server
docker-compose up client
```

### Development
```bash
# View logs
docker-compose logs

# View logs for specific service
docker-compose logs server
docker-compose logs client

# Follow logs in real-time
docker-compose logs -f
```

### Management
```bash
# Stop all services
docker-compose down

# Stop and remove volumes (WARNING: This will delete all data)
docker-compose down -v

# Restart services
docker-compose restart

# Rebuild and restart
docker-compose up --build --force-recreate
```

### Debugging
```bash
# Access container shell
docker-compose exec server sh
docker-compose exec client sh

# Check container status
docker-compose ps

# View resource usage
docker stats
```

## Services

### Server (Backend)
- **Port:** 5000
- **Technology:** Node.js with Express
- **Database:** LevelDB (persistent volume)
- **Storage:** File storage (persistent volume)
- **Health Check:** `/health` endpoint

### Client (Frontend)
- **Port:** 3000 (mapped to container port 80)
- **Technology:** React with Vite, served by Nginx
- **Proxy:** API requests proxied to backend
- **Build:** Multi-stage Docker build for optimization

## Volumes

- `server_storage`: Persistent storage for encrypted files
- `server_db`: Persistent storage for LevelDB database

## Environment Variables

Copy `env.example` to `.env` and modify as needed:
```bash
cp env.example .env
```

## Production Considerations

### Security
- Containers run as non-root users
- Health checks implemented
- Security headers configured in Nginx
- Volumes properly isolated

### Performance
- Multi-stage builds for smaller images
- Nginx with gzip compression
- Optimized Docker layers

### Monitoring
- Health check endpoints
- Structured logging
- Container restart policies

## Troubleshooting

### Common Issues

1. **Port already in use:**
   ```bash
   # Check what's using the port
   lsof -i :3000
   lsof -i :5000
   
   # Kill the process or change ports in docker-compose.yml
   ```

2. **Permission issues:**
   ```bash
   # Fix ownership
   sudo chown -R $USER:$USER .
   ```

3. **Build failures:**
   ```bash
   # Clean build
   docker-compose down
   docker system prune -f
   docker-compose up --build
   ```

4. **Database issues:**
   ```bash
   # Reset database (WARNING: Data loss)
   docker-compose down -v
   docker-compose up --build
   ```

### Logs
```bash
# Check all logs
docker-compose logs

# Check specific service logs
docker-compose logs server
docker-compose logs client

# Follow logs
docker-compose logs -f server
```

## Development vs Production

### Development
- Use `docker-compose up` for development
- Volumes are mounted for live code changes
- Debug mode enabled

### Production
- Use `docker-compose -f docker-compose.prod.yml up` (if you create one)
- Optimized builds
- Security hardening
- Resource limits

## Next Steps

1. **Environment Configuration:** Set up proper environment variables
2. **SSL/TLS:** Configure HTTPS for production
3. **Monitoring:** Add logging and monitoring solutions
4. **Backup:** Implement backup strategies for volumes
5. **Scaling:** Configure load balancing if needed

## Support

If you encounter issues:
1. Check the logs: `docker-compose logs`
2. Verify Docker is running: `docker --version`
3. Check port availability: `lsof -i :3000 :5000`
4. Rebuild containers: `docker-compose up --build --force-recreate`
