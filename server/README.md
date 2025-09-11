# Secure File Vault - Backend API

This document provides instructions and API documentation for the backend service of the Secure File Vault application. The server is built with Node.js and Express, and it uses LevelDB for data persistence.

## Installation

To get started, install the necessary Node.js dependencies:

```bash
npm install
```

## Running the Server

To start the server, run the following command. By default, the server will listen on port 5000.

```bash
node server.js
```

## API Endpoints

The API provides endpoints for user management and file storage. All data is exchanged in JSON format.

---

### User Management

#### 1. Register a New User

*   **Endpoint:** `POST /register`
*   **Description:** Creates a new user account. It hashes the user's password and generates a unique `userId` and `storageId` for them.
*   **Request Body:**
    *   `username` (string, required): The desired username.
    *   `name` (string, required): The user's full name.
    *   `password` (string, required): The user's password.
    *   `publicKey` (string, required): The user's public RSA key in HEX SPKI format.
*   **Example Request:**
    ```bash
    curl -X POST -H "Content-Type: application/json" -d '{
      "username": "testuser",
      "name": "Test User",
      "password": "password123",
      "publicKey": "mypublickeyhex"
    }' http://localhost:5000/register
    ```
*   **Success Response (201):**
    ```json
    {
      "userId": "a_unique_user_id"
    }
    ```
*   **Error Responses:**
    *   `400 Bad Request`: If required fields are missing or the username is already taken.
    *   `500 Internal Server Error`: If there's a server-side failure.

#### 2. Log In

*   **Endpoint:** `POST /login`
*   **Description:** Authenticates a user and returns their `userId` and `publicKey`.
*   **Request Body:**
    *   `username` (string, required): The user's username.
    *   `password` (string, required): The user's password.
*   **Example Request:**
    ```bash
    curl -X POST -H "Content-Type: application/json" -d '{
      "username": "testuser",
      "password": "password123"
    }' http://localhost:5000/login
    ```
*   **Success Response (200):**
    ```json
    {
      "userId": "a_unique_user_id",
      "publicKey": "the_users_public_key_hex"
    }
    ```
*   **Error Responses:**
    *   `401 Unauthorized`: If the credentials are invalid.
    *   `404 Not Found`: If the user does not exist.

---

### File Management

All file management endpoints require a `userId` in the URL and are authenticated.

#### 1. Upload a File

*   **Endpoint:** `POST /upload/:userId`
*   **Description:** Uploads an encrypted file and its associated encrypted metadata. The server stores the file content directly to disk and the metadata in the database.
*   **Headers:**
    *   `Content-Type`: `application/octet-stream` (or any raw binary type).
    *   `X-Encrypted-Metadata` (string, required): A string containing the encrypted metadata for the file (e.g., filename, content type).
*   **Request Body:** The raw binary content of the encrypted file.
*   **Example Request:**
    ```bash
    curl -X POST \
         -H "X-Encrypted-Metadata: some_encrypted_metadata_string" \
         --data-binary "@path/to/your/encrypted/file.enc" \
         http://localhost:5000/upload/a_unique_user_id
    ```
*   **Success Response (201):**
    ```json
    {
      "fileId": "a_unique_file_id"
    }
    ```
*   **Error Responses:**
    *   `400 Bad Request`: If the file content or metadata header is missing.
    *   `404 Not Found`: If the user does not exist.

#### 2. List Files

*   **Endpoint:** `GET /files/:userId`
*   **Description:** Retrieves a list of all files belonging to a user. It returns the `fileId` and the encrypted metadata for each file.
*   **Example Request:**
    ```bash
    curl http://localhost:5000/files/a_unique_user_id
    ```
*   **Success Response (200):**
    ```json
    [
      {
        "fileId": "a_unique_file_id_1",
        "encryptedMetadata": "some_encrypted_metadata_string_1"
      },
      {
        "fileId": "a_unique_file_id_2",
        "encryptedMetadata": "some_encrypted_metadata_string_2"
      }
    ]
    ```
*   **Error Responses:**
    *   `404 Not Found`: If the user does not exist.

#### 3. Download a File

*   **Endpoint:** `GET /download/:userId/:fileId`
*   **Description:** Downloads the raw encrypted content of a specific file.
*   **Example Request:**
    ```bash
    curl -o "downloaded_file.enc" \
         http://localhost:5000/download/a_unique_user_id/a_unique_file_id
    ```
*   **Success Response (200):** The raw binary content of the encrypted file.
*   **Error Responses:**
    *   `404 Not Found`: If the user or file does not exist.

#### 4. Delete a File

*   **Endpoint:** `DELETE /file/:userId/:fileId`
*   **Description:** Deletes a specific file and its metadata. This action is restricted to the file owner.
*   **Example Request:**
    ```bash
    curl -X DELETE http://localhost:5000/file/a_unique_user_id/a_unique_file_id
    ```
*   **Success Response (200):**
    ```json
    {
      "message": "File deleted successfully"
    }
    ```
*   **Error Responses:**
    *   `403 Forbidden`: If the user is not the owner of the file.
    *   `404 Not Found`: If the file does not exist.
    *   `500 Internal Server Error`: If there's a server-side failure.

