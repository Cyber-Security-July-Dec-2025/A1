# Secure File Vault - Frontend

This document provides information about the frontend application for the Secure File Vault. The client is built with React and Vite, providing a modern and responsive user interface for secure file storage and management.

## Features

- **End-to-End Encryption**: All files are encrypted client-side before upload
- **Secure Authentication**: Username/password authentication with secure key management
- **Responsive Design**: Built with Tailwind CSS for a clean, modern interface
- **File Management**: Upload, download, and manage encrypted files

## Installation

To get started, install the necessary dependencies:

```bash
npm install
```

## Configuration

The application can be configured by modifying the configuration file:

```javascript
// src/config/apiConfig.js
export const SERVER_HOST = 'localhost';
export const SERVER_PORT = 5000; // Change to 5001 for macOS if needed
```

> **Note for macOS users**: If port 5000 is already in use by AirPlay Receiver, change the port to 5001 in both client and server config files.

## Running the Application

Start the development server with hot reloading:

```bash
npm run dev
```

The application will be available at `http://localhost:5000` by default.

## Building for Production

To create an optimized production build:

```bash
npm run build
```

The build output will be located in the `dist` directory.

## Key Technologies

- **React**: Frontend library for building user interfaces
- **Vite**: Next-generation frontend tooling for fast development
- **Tailwind CSS**: Utility-first CSS framework
- **Web Cryptography API**: For client-side encryption operations
- **React Router**: For navigation between authentication and file management views
