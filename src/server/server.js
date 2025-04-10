const express = require('express');
const mongoose = require('mongoose');
const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;
const cors = require('cors');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(__dirname, '..', 'uploads');
fs.mkdir(uploadsDir, { recursive: true })
    .then(() => console.log('Uploads directory created/verified'))
    .catch(err => console.error('Error creating uploads directory:', err));

// MongoDB connection with better error handling
mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/equichain')
    .then(() => {
        console.log('Successfully connected to MongoDB.');
    })
    .catch((err) => {
        console.error('MongoDB connection error:', err);
    });

// Log MongoDB events
mongoose.connection.on('error', err => {
    console.error('MongoDB error:', err);
});

mongoose.connection.on('disconnected', () => {
    console.log('MongoDB disconnected');
});

// Define File Schema
const fileSchema = new mongoose.Schema({
    userId: { type: String, required: true },
    originalName: { type: String, required: true },
    fileName: { type: String, required: true },
    filePath: { type: String, required: true },
    fileType: { type: String, required: true },
    uploadDate: { type: Date, default: Date.now },
    schemeId: { type: String, required: true }
});

const File = mongoose.model('File', fileSchema);

// Configure multer for file storage
const storage = multer.diskStorage({
    destination: async function (req, file, cb) {
        // Create user-specific directory
        const userDir = path.join(__dirname, '..', 'uploads', req.body.userId);
        try {
            await fs.mkdir(userDir, { recursive: true });
            cb(null, userDir);
        } catch (error) {
            cb(error, null);
        }
    },
    filename: function (req, file, cb) {
        // Generate unique filename
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({ storage: storage });

// API Endpoints

// Upload multiple files
app.post('/api/upload', upload.array('files'), async (req, res) => {
    try {
        const { userId, schemeId } = req.body;
        if (!userId || !schemeId) {
            return res.status(400).json({ error: 'userId and schemeId are required' });
        }

        const uploadedFiles = [];

        for (const file of req.files) {
            const fileDoc = new File({
                userId,
                schemeId,
                originalName: file.originalname,
                fileName: file.filename,
                filePath: file.path,
                fileType: file.mimetype
            });

            await fileDoc.save();
            uploadedFiles.push({
                id: fileDoc._id,
                originalName: file.originalname,
                fileName: file.filename
            });
        }

        res.json({
            message: 'Files uploaded successfully',
            files: uploadedFiles
        });
    } catch (error) {
        console.error('Upload error:', error);
        res.status(500).json({ error: 'Error uploading files' });
    }
});

// Get files by userId and schemeId
app.get('/api/files/:userId/:schemeId', async (req, res) => {
    try {
        const { userId, schemeId } = req.params;
        const files = await File.find({ userId, schemeId });
        res.json(files);
    } catch (error) {
        res.status(500).json({ error: 'Error retrieving files' });
    }
});

// Delete file
app.delete('/api/files/:fileId', async (req, res) => {
    try {
        const file = await File.findById(req.params.fileId);
        if (!file) {
            return res.status(404).json({ error: 'File not found' });
        }

        // Delete from filesystem
        await fs.unlink(file.filePath);
        // Delete from MongoDB
        await File.deleteOne({ _id: req.params.fileId });

        res.json({ message: 'File deleted successfully' });
    } catch (error) {
        res.status(500).json({ error: 'Error deleting file' });
    }
});

// Download file
app.get('/api/download/:fileId', async (req, res) => {
    try {
        const file = await File.findById(req.params.fileId);
        if (!file) {
            return res.status(404).json({ error: 'File not found' });
        }

        res.download(file.filePath, file.originalName);
    } catch (error) {
        res.status(500).json({ error: 'Error downloading file' });
    }
});

// Start server only after MongoDB connects
mongoose.connection.once('open', () => {
    const PORT = process.env.PORT || 5000;
    app.listen(PORT, () => {
        console.log(`Server running on port ${PORT}`);
        console.log(`Files will be stored in: ${uploadsDir}`);
    });
});
