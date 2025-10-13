const express = require('express');
const path = require('path');
const app = express();

// Serve static files (your public)
app.use(express.static(path.join(__dirname, 'public')));

// Parse JSON for API requests
app.use(express.json());

// API Routes
app.get('/api', (req, res) => {
  res.json({ message: 'Bethel Department API is working!' });
});

// Handle form submissions
app.post('/api/login', (req, res) => {
  const { email, password } = req.body;
  // Add your login logic here
  res.json({ success: true, message: 'Login endpoint' });
});

app.post('/api/signup', (req, res) => {
  const { email, password, name } = req.body;
  // Add your signup logic here
  res.json({ success: true, message: 'Signup endpoint' });
});

// Serve your HTML pages with proper routes
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