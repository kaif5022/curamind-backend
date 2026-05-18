import path from 'path';
import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import connectDB from './config/db.js';
import { notFound, errorHandler } from './middleware/errorMiddleware.js';
import authRoutes from './routes/authRoutes.js';
import patientRoutes from './routes/patientRoutes.js';
import appointmentRoutes from './routes/appointmentRoutes.js';

// Load env vars
dotenv.config();

// Connect to database
connectDB();

const app = express();

// Middleware
app.use(express.json());
app.use(cors({
  origin: function (origin, callback) {
    if (!origin) return callback(null, true);
    
    const allowed = [
      "https://curamind-frontend.vercel.app",
      process.env.FRONTEND_URL
    ].filter(Boolean);

    if (allowed.includes(origin) || 
        origin.startsWith("http://localhost") || 
        origin.startsWith("http://127.0.0.1") || 
        origin.startsWith("http://192.168.") || 
        origin.startsWith("http://10.") || 
        origin.startsWith("http://172.")) {
      callback(null, true);
    } else {
      callback(null, true); // Fallback for dev ease, adjust for prod strictness if needed
    }
  },
  credentials: true
}));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/patients', patientRoutes);
app.use('/api/appointments', appointmentRoutes);

// Make uploads folder static
const __dirname = path.resolve();
app.use('/uploads', cors(), express.static(path.join(__dirname, '/uploads')));

// Root route
app.get('/', (req, res) => {
  res.send('CuraMind API is running...');
});

// Error Handling Middleware
app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
});
