require('dotenv').config();
const express = require('express');
const path = require('path');
const jwt = require('jsonwebtoken');
const connectDB = require('./models/db');
const User = require('./models/User');
const Event = require('./models/Event');
const Announcement = require('./models/Announcement');
const { authMiddleware, JWT_SECRET } = require('./middleware/auth');

// Connect to MongoDB
connectDB();

const app = express();

// Serve static files from PUBLIC folder
app.use(express.static(path.join(__dirname, 'public')));

// Parse JSON for API requests
app.use(express.json());

// API Routes
app.get('/api', (req, res) => {
  res.json({ message: 'Bethel Department API is working!', database: 'MongoDB Connected' });
});

// User Registration - REAL IMPLEMENTATION
app.post('/api/signup', async (req, res) => {
  try {
    const { name, email, password, studentId, institution, major } = req.body;
    
    // Validation
    if (!name || !email || !password) {
      return res.status(400).json({ 
        success: false, 
        message: 'Name, email, and password are required' 
      });
    }

    if (password.length < 6) {
      return res.status(400).json({ 
        success: false, 
        message: 'Password must be at least 6 characters' 
      });
    }
    
    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ 
        success: false, 
        message: 'User with this email already exists' 
      });
    }
    
    // Create new user
    const user = new User({
      name,
      email,
      password, // This will be automatically hashed by the pre-save hook
      studentId,
      institution,
      major
    });
    
    await user.save();

    // Create JWT token
    const token = jwt.sign(
      { userId: user._id, email: user.email, role: user.role }, 
      JWT_SECRET, 
      { expiresIn: '7d' }
    );
    
    res.json({ 
      success: true, 
      message: 'User registered successfully!',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        studentId: user.studentId
      }
    });
  } catch (error) {
    console.error('Signup error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error during registration',
      error: error.message 
    });
  }
});

// User Login - REAL IMPLEMENTATION
app.post('/api/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    // Validation
    if (!email || !password) {
      return res.status(400).json({ 
        success: false, 
        message: 'Email and password are required' 
      });
    }
    
    // Find user
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ 
        success: false, 
        message: 'Invalid email or password' 
      });
    }
    
    // Check password
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      return res.status(401).json({ 
        success: false, 
        message: 'Invalid email or password' 
      });
    }
    
    // Create JWT token
    const token = jwt.sign(
      { userId: user._id, email: user.email, role: user.role }, 
      JWT_SECRET, 
      { expiresIn: '7d' }
    );
    
    res.json({ 
      success: true, 
      message: 'Login successful!',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        studentId: user.studentId
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error during login',
      error: error.message 
    });
  }
});

// Get current user profile (protected route)
app.get('/api/me', authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId);
    if (!user) {
      return res.status(404).json({ 
        success: false, 
        message: 'User not found' 
      });
    }
    
    res.json({ 
      success: true, 
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        studentId: user.studentId,
        institution: user.institution,
        major: user.major
      }
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: 'Server error',
      error: error.message 
    });
  }
});

// Events API (protected - only authenticated users can create)
app.get('/api/events', async (req, res) => {
  try {
    const events = await Event.find({ isActive: true }).sort({ date: 1 });
    res.json({ success: true, events });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error fetching events', error: error.message });
  }
});

app.post('/api/events', authMiddleware, async (req, res) => {
  try {
    const event = new Event(req.body);
    await event.save();
    res.json({ success: true, message: 'Event created successfully', event });
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

app.post('/api/announcements', authMiddleware, async (req, res) => {
  try {
    const announcement = new Announcement({
      ...req.body,
      author: req.user.email
    });
    await announcement.save();
    res.json({ success: true, message: 'Announcement created successfully', announcement });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error creating announcement', error: error.message });
  }
});

// Test database connection
app.get('/api/test-db', async (req, res) => {
  try {
    const userCount = await User.countDocuments();
    const eventCount = await Event.countDocuments();
    
    res.json({ 
      success: true, 
      message: 'Database connection successful!',
      stats: {
        users: userCount,
        events: eventCount
      }
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: 'Database test failed', 
      error: error.message 
    });
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