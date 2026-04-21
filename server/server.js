require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const app = express();

// Initialize Cron Jobs
const initCronJobs = require('./config/cron');
initCronJobs();

// Connect to MongoDB
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('MongoDB Connected...');
  } catch (err) {
    console.error(err.message);
    process.exit(1);
  }
};

connectDB();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// Set EJS View Engine
app.set('view engine', 'ejs');

// Define Page Routes
app.get('/', (req, res) => res.render('index'));
app.get('/login', (req, res) => res.render('login'));
app.get('/register', (req, res) => res.render('register'));
app.get('/dashboard', (req, res) => res.render('dashboard'));
app.get('/books', (req, res) => res.render('books'));
app.get('/requests', (req, res) => res.render('requests'));
app.get('/suppliers', (req, res) => res.render('suppliers'));
app.get('/reports', (req, res) => res.render('reports'));

// Define API Routes
app.use('/api/auth', require('./routes/api/auth'));
app.use('/api/books', require('./routes/api/books'));
app.use('/api/purchase-orders', require('./routes/api/purchaseOrders'));
app.use('/api/suppliers', require('./routes/api/suppliers'));
app.use('/api/reports', require('./routes/api/reports'));

// Global error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ msg: 'Server error' });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => console.log(`Server started on port ${PORT}`));