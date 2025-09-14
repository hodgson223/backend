const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const app = express();
const port = 4000;

// Middleware
app.use(cors());
app.use(express.json());

// MongoDB Connection
const mongoURI = 'mongodb+srv://Andrew:Jasper01@customer.bzjae.mongodb.net/test?retryWrites=true&w=majority&appName=customer';
mongoose.connect(mongoURI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log(' Connected to MongoDB Atlas'))
.catch((err) => console.error(' MongoDB connection error:', err));

// User Schema & Model
const UserSchema = new mongoose.Schema({
  email: { type: String, unique: true, required: true },
  passwordHash: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
});
const User = mongoose.model('User', UserSchema);

// Route Schema & Model
const RouteSchema = new mongoose.Schema({
  coordinates: {
    type: [[Number]], // Array of [lng, lat] pairs
    required: true,
    validate: {
      validator: function (arr) {
        return arr.every(pair =>
          Array.isArray(pair) &&
          pair.length === 2 &&
          typeof pair[0] === 'number' &&
          typeof pair[1] === 'number'
        );
      },
      message: 'Coordinates must be an array of [lng, lat] pairs.',
    },
  },
  comment: {
    type: String,
    required: true,
    trim: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});
const Route = mongoose.model('Route', RouteSchema);

// Test DB route
app.get('/test-db', async (req, res) => {
  try {
    const users = await User.find().limit(1);
    res.status(200).json({ message: 'Database connection is working!', usersFound: users.length });
  } catch (err) {
    res.status(500).json({ message: 'Database connection failed' });
  }
});

// Signup route
app.post('/signup', async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ message: 'Username and password are required' });
  }

  try {
    const existingUser = await User.findOne({ email: username });
    if (existingUser) {
      return res.status(409).json({ message: 'User already exists' });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const newUser = new User({ email: username, passwordHash });
    await newUser.save();

    res.status(201).json({
      message: 'Signup successful',
      username: newUser.email,
      userId: newUser._id,
    });
  } catch (err) {
    console.error('Signup error:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Signin placeholder route
app.post('/signin', (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ message: 'Username and password are required' });
  }
  res.status(200).json({ message: 'Signin successful (placeholder)', data: { username } });
});

// Save route with comment
app.post('/routes', async (req, res) => {
  const { coordinates, comment } = req.body;

  if (!coordinates || !Array.isArray(coordinates) || coordinates.length === 0) {
    return res.status(400).json({ message: 'Route coordinates are required.' });
  }
  if (!comment || typeof comment !== 'string') {
    return res.status(400).json({ message: 'Route comment is required.' });
  }

  try {
    const newRoute = new Route({ coordinates, comment });
    await newRoute.save();
    res.status(201).json({ message: 'Route saved successfully!', route: newRoute });
  } catch (err) {
    console.error('Error saving route:', err);
    res.status(500).json({ message: 'Server error saving route.' });
  }
});

app.get('/api/routes', async (req, res) => {
  try {
    const routes = await Route.find().sort({ createdAt: -1 });
    res.status(200).json({ routes }); 
  } catch (err) {
    console.error('Error fetching routes:', err);
    res.status(500).json({ message: 'Server error fetching routes' });
  }
});






// Start server
app.listen(port, () => {
  console.log(` Server running on http://localhost:${port}`);
});


