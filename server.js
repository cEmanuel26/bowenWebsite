var dotenv = require('dotenv');
const express = require('express');
const path = require('path');
const bcrypt = require('bcrypt');
const passport = require('passport');
const nodemailer = require('nodemailer');
const flash = require('express-flash');
const session = require('express-session');
const methodOverride = require('method-override');
const {
  addUser,
  getUserByEmail,
  getUserById,
  addAppointment,
  getAppointments,
  updateUserPassword,
  saveResetTokenForUser,
  verifyResetToken,
  checkAppointments,
} = require('./domain/user');
const { randomUUID } = require('crypto');

const app = express();

// Initialize environment variables
dotenv.config();

// Create the email transporter (global for reuse)
const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com', // Google's SMTP host
  port: 465, // SMTP SSL port
  secure: true, // True for port 465, false for other ports
  auth: {
    user: process.env.EMAIL_USER, // Your Gmail address
    pass: process.env.EMAIL_PASS, // Your app-specific password
  },
});

const initializePassport = require('./passport-config');
initializePassport(
  passport,
  (email) => getUserByEmail(email),
  (id) => getUserById(id)
);

app.set('view-engine', 'ejs');
app.use(express.urlencoded({ extended: true }));
app.use(express.json()); // Add this middleware to parse JSON request bodies
app.use(flash());
app.use(
  session({
    secret: process.env.SESSION_SECRET || 'default_secret',
    resave: false,
    saveUninitialized: false,
  })
);
app.use(methodOverride('_method'));
app.use(passport.initialize());
app.use(passport.session());
app.use((req, res, next) => {
  res.locals.email = req.user ? req.user.email : '';
  res.locals.isAdmin = req.user ? req.user.isAdmin : false;
  next();
});

// Routes

app.get('/', (req, res) => {
  res.render('index.ejs', {
    email: req.user ? req.user.email : '',
    isAdmin: req.user ? req.user.isAdmin : false,
  });
});

app.get('/about', (req, res) => {
  res.render('about.ejs', { email: req.user ? req.user.email : '' });
});

app.get('/admin', isAdmin, async (req, res) => {
  const appointments = await getAppointments();
  res.render('admin.ejs', {
    email: req.user ? req.user.email : '',
    appointments,
  });
});

app.get('/forgotPassword', (req, res) => {
  res.render('forgotPassword.ejs');
});
app.get('/newPassword', (req, res) => {
  const token = req.query.token;
  res.render('newPassword.ejs', { token });
});

app.get('/contact', (req, res) => {
  res.render('contact.ejs', { email: req.user ? req.user.email : '' });
});

app.get('/appointments', (req, res) => {
  if (req.isAuthenticated()) {
    res.redirect('/appointmentsLogged');
  } else {
    res.render('appointments.ejs', { email: '' });
  }
});

app.get('/benefits', (req, res) => {
  res.render('benefits.ejs', { email: req.user ? req.user.email : '' });
});

app.get('/appointmentsLogged', isLoggedIn, (req, res) => {
  res.render('appointmentsLogged.ejs', {
    email: req.user ? req.user.email : '',
    messages: req.flash(),
  });
});

app.post('/register', isNotLoggedIn, async (req, res) => {
  try {
    const hashedPassword = await bcrypt.hash(req.body.regpassword, 10);
    await addUser(req.body.regusername, hashedPassword);
    res.redirect('/appointments');
  } catch (e) {
    res.redirect('/appointments');
  }
});

app.post('/forgotPassword', async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res
      .status(400)
      .json({ success: false, message: 'Email is required.' });
  }

  try {
    const user = await getUserByEmail(email);
    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: 'User not found.' });
    }

    const token = randomUUID();
    await saveResetTokenForUser(email, token);

    const result = await sendPasswordResetEmail(email, token);

    return res.status(result.success ? 200 : 500).json(result);
  } catch (error) {
    console.error('Forgot password error:', error);
    return res
      .status(500)
      .json({ success: false, message: 'Internal Server Error' });
  }
});

app.post('/checkAppointments', async (req, res) => {
  const { time, date } = req.body;

  if (!time || !date) {
    return res.status(400).json({ message: 'Time and date are required.' });
  }

  try {
    // Adjust this query depending on your database structure
    const appointmentsRef = db.collection('appointments');

    // Query the database to count how many appointments exist for the given date and time
    const snapshot = await appointmentsRef
      .where('time', '==', time)
      .where('date', '==', date)
      .get();

    const bookedCount = snapshot.size; // Get the number of documents (appointments)

    res.json({ bookedCount });
  } catch (error) {
    console.error('Error checking appointments:', error);
    res.status(500).json({ message: 'Error checking appointments', error });
  }
});
app.post('/bookAppointment', isLoggedIn, async (req, res) => {
  const { date, time } = req.body;
  const userId = req.user.id;

  if (!date || !time || !userId) {
    return res.status(400).json({ message: 'Missing required information.' });
  }

  try {
    // Create a new appointment entry
    await db.collection('appointments').add({
      date,
      time,
      userId,
      // Add other relevant details like name, phone, etc.
    });

    // Send a success response
    res.status(200).json({ message: 'Appointment successfully booked.' });
  } catch (error) {
    console.error('Error booking appointment:', error);
    res.status(500).json({ message: 'Failed to book appointment', error });
  }
});
app.post('/newPassword', async (req, res) => {
  const { token, newPassword } = req.body;

  if (!token || !newPassword) {
    return res.status(400).json({
      success: false,
      message: 'Token and new password are required.',
    });
  }

  const verifyResult = await verifyResetToken(token);

  if (!verifyResult || !verifyResult.success) {
    return res.status(400).json({
      success: false,
      message: verifyResult?.message || 'Invalid or expired token.',
    });
  }

  try {
    const email = verifyResult.email; // Make sure `verifyResetToken` returns the email
    await updateUserPassword(email, newPassword);
    await verifyResult.ref.delete(); // Delete token after use

    res.redirect('/login?reset=success');
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: 'An error occurred while resetting password.',
    });
  }
});

app.post('/appointmentRegister', isLoggedIn, async (req, res) => {
  console.log('Appointment form submitted:', req.body); // Log the form data
  const userId = req.user.id; // Use req.user.id instead of req.session.userId
  if (!userId) {
    return res.status(400).send('User not logged in');
  }

  try {
    const {
      lastname,
      firstname,
      phone,
      move,
      address,
      message,
      details,
      selectedDate,
      selectedTime,
    } = req.body;

    if (
      !lastname?.trim() ||
      !firstname?.trim() ||
      !phone?.trim() ||
      !move?.trim() ||
      !address?.trim()
    ) {
      req.flash(
        'error',
        'All fields are required. Please fill out all fields.'
      );
      return res.redirect('/appointmentsLogged');
    }

    console.log('Form data before adding appointment:', {
      lastname,
      firstname,
      phone,
      move,
      address,
      message,
      details,
      selectedDate,
      selectedTime,
    });

    await addAppointment(
      lastname.trim(),
      firstname.trim(),
      phone.trim(),
      move.trim(),
      address.trim(),
      message.trim(),
      details.trim(),
      userId,
      selectedDate,
      selectedTime
    );
    req.flash('success', 'Appointment registered successfully!');
    res.redirect('/appointmentsLogged');
  } catch (e) {
    console.error('Error adding appointment:', e.message); // Log any error
    req.flash(
      'error',
      'Failed to register appointment. Please check your input and try again.'
    );
    res.redirect('/appointmentsLogged');
  }
});

app.delete('/logout', (req, res) => {
  req.logout(function (err) {
    if (err) {
      return next(err);
    }
    res.redirect('/appointments');
  });
});

app.get('/login', isNotLoggedIn, (req, res) => {
  res.render('appointments.ejs');
});

app.post(
  '/login',
  isNotLoggedIn,
  passport.authenticate('local', {
    successRedirect: '/appointmentsLogged',
    failureRedirect: '/appointments',
    failureFlash: true,
  }),
  (req, res) => {
    console.log('User ID:', req.user.id); // Check if the user ID is set
    if (req.user.isAdmin) {
      res.redirect('/admin');
    } else {
      res.redirect('/appointmentsLogged');
    }
  }
);

async function sendPasswordResetEmail(email, token) {
  try {
    const resetLink = `http://localhost:3000/newPassword?token=${token}`;

    await transporter.sendMail({
      to: email,
      subject: 'Reset your password',
      html: `
        <p>Hello,</p>
        <p>You requested a password reset. Click the link below to set a new password:</p>
        <a href="${resetLink}">${resetLink}</a>
        <p>If you did not request this, you can safely ignore this email.</p>
      `,
    });

    console.log('Password reset link sent to:', email);

    return { success: true, message: 'Password reset email sent.' };
  } catch (error) {
    console.error('Error sending reset email:', error);
    return { success: false, message: 'Failed to send reset email.' };
  }
}

function isLoggedIn(req, res, next) {
  if (req.isAuthenticated()) {
    return next();
  }
  res.redirect('/appointments');
}

function isAdmin(req, res, next) {
  if (req.isAuthenticated() && req.user.isAdmin) {
    return next();
  }
  req.flash('error', 'Not authorized');
  res.redirect('/appointmentsLogged');
}

function isNotLoggedIn(req, res, next) {
  if (req.isAuthenticated()) {
    return res.redirect('/');
  }
  next();
}

app.use(express.static(path.join(__dirname, 'public')));

app.listen(3000);
