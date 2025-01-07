import cors from 'cors';
import express from 'express';

// Configure CORS with specific options
export const corsMiddleware = cors({
  origin: [
    'https://54f66a8e-79e4-4758-9da5-a31898a050e3.lovableproject.com',
    'http://localhost:5173', // For local development
    /\.lovableproject\.com$/, // Allow all subdomains of lovableproject.com
    'https://video-processor-server.onrender.com' // Allow the server itself
  ],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
  optionsSuccessStatus: 200 // Some legacy browsers (IE11, various SmartTVs) choke on 204
});

export const jsonMiddleware = express.json();
