require('dotenv').config(); // Add at the very top
const express = require('express');
const path = require('path');
const connectDB = require('./models/db');
const User = require('./models/User');
const Event = require('./models/Event');
const Announcement = require('./models/Announcement');

// Connect to MongoDB
connectDB();

const app = express();

// Test database connection
app.get('/api/test-db', async (req, res) => {
  try {
    // Try to create a test user
    const testUser = new User({
      name: 'Test User',
      email: 'test@bethel.com',
      password: 'test123',
      role: 'student'
    });
    
    await testUser.save();
    
    // Count users
    const userCount = await User.countDocuments();
    
    res.json({ 
      success: true, 
      message: 'Database connection successful!',
      userCount: userCount,
      testUser: 'Created successfully'
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: 'Database test failed', 
      error: error.message 
    });
  }
});

// Serve static files from PUBLIC folder
app.use(express.static(path.join(__dirname, 'public')));

// Parse JSON for API requests
app.use(express.json());

// API Routes
app.get('/api', (req, res) => {
  res.json({ message: 'Bethel Department API is working!', database: 'MongoDB Connected' });
});

// User Registration
app.post('/api/signup', async (req, res) => {
  try {
    const { name, email, password, studentId, institution, major } = req.body;
    
    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ success: false, message: 'User already exists' });
    }
    
    // Create new user
    const user = new User({
      name,
      email,
      password, // In production, hash this password!
      studentId,
      institution,
      major
    });
    
    await user.save();
    res.json({ success: true, message: 'User registered successfully', user: { name, email, studentId } });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
});

// User Login
app.post('/api/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    // Find user
    const user = await User.findOne({ email, password }); // In production, use hashed passwords!
    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }
    
    res.json({ 
      success: true, 
      message: 'Login successful', 
      user: { 
        name: user.name, 
        email: user.email, 
        role: user.role 
      } 
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
});

// Events API
app.get('/api/events', async (req, res) => {
  try {
    const events = await Event.find({ isActive: true }).sort({ date: 1 });
    res.json({ success: true, events });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error fetching events', error: error.message });
  }
});

app.post('/api/events', async (req, res) => {
  try {
    const event = new Event(req.body);
    await event.save();
    res.json({ success: true, message: 'Event created', event });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error creating event', error: error.message });
  }
});

// Announcements API
app.get('/api/announcements', async (req, res) => {
  try {
    const announcements = await Announcement.find().sort({ createdAt: -1 });
    res.json({ success: true, announcements });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error fetching announcements', error: error.message });
  }
});

app.post('/api/announcements', async (req, res) => {
  try {
    const announcement = new Announcement(req.body);
    await announcement.save();
    res.json({ success: true, message: 'Announcement created', announcement });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error creating announcement', error: error.message });
  }
});

// Serve HTML pages from PUBLIC folder
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/announcements', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'Announcements.html'));
});

app.get('/archives', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'Archives.html'));
});

app.get('/events', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'Events.html'));
});

app.get('/login', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'login.html'));
});

app.get('/signup', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'signup.html'));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Bethel Department app running on port ${PORT}`);
});