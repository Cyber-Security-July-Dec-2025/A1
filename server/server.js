const express = require('express');
const { Level } = require('level');
const { v4: uuidv4 } = require('uuid');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const { SERVER_PORT } = require('./config');

const app = express();
const port = SERVER_PORT;

// --- Middleware ---
app.use(cors());
app.use(express.json());

// --- Database & Storage Setup ---
const db = new Level('secure-vault-db', { valueEncoding: 'json' });
const storageDir = path.join(__dirname, 'storage');
fs.mkdirSync(storageDir, { recursive: true });

// --- Password Hashing ---
const hashPassword = (password, salt) => crypto.pbkdf2Sync(password, salt, 100000, 64, 'sha512').toString('hex');

// --- User Endpoints ---
app.post('/register', async (req, res) => {
  try {
    const { username, name, password, publicKey } = req.body;
    if (!username || !name || !password || !publicKey) {
      return res.status(400).json({ error: 'All fields are required' });
    }
    for await (const [key, value] of db.iterator({ gte: 'user:', lte: 'user:~' })) {
      if (value.username === username) {
        return res.status(400).json({ error: 'Username already taken' });
      }
    }
    const userId = uuidv4();
    const storageId = uuidv4(); // ID for storage folder
    const salt = crypto.randomBytes(16).toString('hex');
    const passwordHash = hashPassword(password, salt);

    const user = { userId, username, name, passwordHash, salt, publicKey, storageId };
    await db.put(`user:${userId}`, user);

    // Create a dedicated storage directory for the user
    const userStorageDir = path.join(storageDir, storageId);
    fs.mkdirSync(userStorageDir, { recursive: true });

    res.status(201).json({ userId });
  } catch (error) {
    console.error('Registration failed:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password are required' });
    }
    let user, userId;
    for await (const [key, value] of db.iterator({ gte: 'user:', lte: 'user:~' })) {
      if (value.username === username) {
        userId = value.userId;
        user = value;
        break;
      }
    }
    if (!user || hashPassword(password, user.salt) !== user.passwordHash) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    res.json({ userId, publicKey: user.publicKey });
  } catch (error) {
    console.error('Login failed:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// --- File Endpoints ---
app.post('/file/:userId', express.raw({ limit: '100mb', type: '*/*' }), async (req, res) => {
  try {
    const { userId } = req.params;
    const encryptedKey = req.headers['x-encrypted-key'];
    const encryptedMetadata = req.headers['x-encrypted-metadata'];
    console.log('Server received X-Encrypted-Key:', encryptedKey);
    console.log('Server received X-Encrypted-Metadata:', encryptedMetadata);
    if (!encryptedKey || !encryptedMetadata) {
      return res.status(400).json({ error: 'x-encrypted-key and x-encrypted-metadata headers are required' });
    }

    const user = await db.get(`user:${userId}`);
    const fileId = uuidv4();
    const filePath = path.join(storageDir, user.storageId, `${fileId}.enc`);
    await fs.promises.writeFile(filePath, req.body);

    const metadata = { fileId, ownerId: userId, encryptedKey, encryptedMetadata };
    await db.put(`filemeta:${fileId}`, metadata);

    res.status(201).json({ fileId });
  } catch (error) {
    if (error.notFound) return res.status(404).json({ error: 'User not found' });
    console.error('Upload failed:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/files/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const files = [];
    for await (const [key, value] of db.iterator({ gte: 'filemeta:', lte: 'filemeta:~' })) {
      if (value.ownerId === userId) {
        console.log('Server sending encryptedKey:', value.encryptedKey);
        console.log('Server sending encryptedMetadata:', value.encryptedMetadata);
        files.push({ fileId: value.fileId, encryptedKey: value.encryptedKey, encryptedMetadata: value.encryptedMetadata });
      }
    }
    res.json(files);
  } catch (error) {
    console.error('Failed to list files:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/file/:fileId', async (req, res) => {
  try {
    const { fileId } = req.params;
    const metadata = await db.get(`filemeta:${fileId}`);
    const owner = await db.get(`user:${metadata.ownerId}`);

    const filePath = path.join(storageDir, owner.storageId, `${fileId}.enc`);

    if (fs.existsSync(filePath)) {
      res.setHeader('Content-Type', 'application/octet-stream');
      fs.createReadStream(filePath).pipe(res);
    } else {
      res.status(404).json({ error: 'File not found' });
    }
  } catch (error) {
    if (error.notFound) return res.status(404).json({ error: 'File not found' });
    console.error('Download failed:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.delete('/file/:userId/:fileId', async (req, res) => {
  try {
    const { userId, fileId } = req.params;
    
    // Validate parameters
    if (!userId || !fileId) {
      return res.status(400).json({ error: 'User ID and File ID are required' });
    }

    console.log(`Delete request for fileId: ${fileId} by userId: ${userId}`);
    
    // Get file metadata
    const metadata = await db.get(`filemeta:${fileId}`);
    console.log('Found file metadata:', { fileId: metadata.fileId, ownerId: metadata.ownerId });

    // Check ownership
    if (metadata.ownerId !== userId) {
      return res.status(403).json({ error: 'Forbidden: You do not have permission to delete this file' });
    }

    // Get user info for storage path
    const owner = await db.get(`user:${metadata.ownerId}`);
    const filePath = path.join(storageDir, owner.storageId, `${fileId}.enc`);
    
    console.log(`Attempting to delete file at path: ${filePath}`);

    // Delete the physical file
    try {
      await fs.promises.unlink(filePath);
      console.log('Physical file deleted successfully');
    } catch (fileError) {
      console.warn('Physical file deletion failed (may not exist):', fileError.message);
      // Continue with metadata deletion even if physical file doesn't exist
    }

    // Delete the metadata
    await db.del(`filemeta:${fileId}`);
    console.log('File metadata deleted successfully');

    res.json({ message: 'File deleted successfully' });
  } catch (error) {
    console.error('Delete failed:', error);
    if (error.notFound) {
      return res.status(404).json({ error: 'File not found' });
    }
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'OK', timestamp: new Date().toISOString() });
});

app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});