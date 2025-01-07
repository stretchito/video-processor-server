import express from 'express';
import { corsMiddleware, jsonMiddleware } from './middleware/cors';
import { healthCheck } from './routes/health';
import { processVideoHandler } from './routes/processVideo';
import { getJobStatus } from './routes/jobStatus';
import ffmpeg from 'fluent-ffmpeg';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Configure ffmpeg path
const configureFfmpeg = () => {
  try {
    // For production environment (Render.com uses this path)
    const ffmpegPath = process.env.NODE_ENV === 'production' 
      ? '/usr/bin/ffmpeg'  // Default Linux FFmpeg path
      : 'ffmpeg';          // Use system PATH in development
    
    console.log('Configuring FFmpeg with path:', ffmpegPath);
    ffmpeg.setFfmpegPath(ffmpegPath);

    // Verify FFmpeg is working
    ffmpeg.getAvailableFormats((err, formats) => {
      if (err) {
        console.error('Error checking FFmpeg:', err);
      } else {
        console.log('FFmpeg is properly configured. Available formats:', Object.keys(formats).length);
      }
    });
  } catch (error) {
    console.error('Error configuring FFmpeg:', error);
    throw error;
  }
};

// Configure FFmpeg before starting the server
configureFfmpeg();

const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(corsMiddleware);
app.use(jsonMiddleware);

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Routes
app.get('/health', healthCheck);
app.post('/process-video', processVideoHandler);
app.get('/job-status/:jobId', getJobStatus);

// Error handling middleware
app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Server error:', err);
  res.status(500).json({ error: 'Internal server error', message: err.message });
});

// Start server
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
  console.log('Environment:', process.env.NODE_ENV);
  
  // Test FFmpeg version
  ffmpeg.getAvailableCodecs((err, codecs) => {
    if (err) {
      console.error('Error getting FFmpeg codecs:', err);
    } else {
      console.log('FFmpeg codecs available:', Object.keys(codecs).length);
    }
  });
});

export default app;
