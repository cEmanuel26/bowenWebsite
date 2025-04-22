const dotenv = require('dotenv');
const express = require('express');
const path = require('path');
const bcrypt = require('bcrypt');
const passport = require('passport');
const nodemailer = require('nodemailer');
const { getAuth } = require('firebase-admin/auth');
const multer = require('multer');
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
  addReview,
  getApprovedReviews,
  getAllReviews,
  approveReview,
  deleteReview,
  firebaseAdmin,
  db,
  admin,
} = require('./domain/user');
const { randomUUID } = require('crypto');
const { getFirestore } = require('firebase-admin/firestore');
const upload = multer({ storage: multer.memoryStorage() });
const app = express();
const storage = admin.storage();
const bucket = storage.bucket(); // Use the bucket
console.log('Starting server...');
// Initialize environment variables
dotenv.config();
// Initialize Firebase Admin SDK with your service account credentials

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
const rateLimit = require('express-rate-limit');

const contactFormLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Limit each IP to 5 requests per window
  message: 'Prea multe incercari, incearca mai tarziu.',
});

const initializePassport = require('./passport-config');
initializePassport(
  passport,
  (email) => getUserByEmail(email),
  (id) => getUserById(id)
);

app.set('view engine', 'ejs');
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
app.use(async (req, res, next) => {
  if (req.user) {
    try {
      // Find the user document using the ID from the authenticated user
      const userQuery = await db
        .collection('users')
        .where('id', '==', req.user.id)
        .get();

      if (!userQuery.empty) {
        const userDoc = userQuery.docs[0];
        const userData = userDoc.data();

        // Set locals with the specific user's data
        res.locals.email = req.user.email;
        res.locals.isAdmin = req.user.isAdmin;
        res.locals.user = {
          ...req.user,
          profilePic: userData.profilePic || null,
        };
      } else {
        // User not found in the database
        res.locals.email = req.user.email;
        res.locals.isAdmin = req.user.isAdmin;
        res.locals.user = { ...req.user, profilePic: null };
      }
    } catch (error) {
      console.error('Error fetching user data for middleware:', error);
      // Default values in case of error
      res.locals.email = req.user.email;
      res.locals.isAdmin = req.user.isAdmin;
      res.locals.user = { ...req.user, profilePic: null };
    }
  } else {
    // Not logged in
    res.locals.email = '';
    res.locals.isAdmin = false;
    res.locals.user = null;
  }
  next();
});

// Routes

app.get('/', async (req, res) => {
  try {
    const reviews = await getApprovedReviews();
    res.render('index.ejs', {
      email: req.user ? req.user.email : '',
      isAdmin: req.user ? req.user.isAdmin : false,
      reviews: reviews,
    });
  } catch (error) {
    console.error('Error fetching reviews for homepage:', error);
    res.render('index.ejs', {
      email: req.user ? req.user.email : '',
      isAdmin: req.user ? req.user.isAdmin : false,
      reviews: [],
    });
  }
});

app.get('/about', (req, res) => {
  res.render('about.ejs', { email: req.user ? req.user.email : '' });
});
app.get('/reviews', isLoggedIn, (req, res) => {
  res.render('reviews.ejs', { email: req.user ? req.user.email : '' });
});
app.get('/admin-reviews', isAdmin, (req, res) => {
  res.render('admin-reviews.ejs', { email: req.user ? req.user.email : '' });
});
app.get('/admin', isAdmin, async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const pageSize = 10; // Set the number of appointments per page

  try {
    // Fetch the total number of appointments to calculate the total pages
    const totalAppointmentsSnapshot = await db.collection('appointments').get();
    const totalAppointmentsCount = totalAppointmentsSnapshot.size;
    const totalPages = Math.ceil(totalAppointmentsCount / pageSize);

    // Set up query for the current page
    let appointmentsQuery = db
      .collection('appointments')
      .orderBy('selectedDate') // Ensure ordering for pagination
      .limit(pageSize);

    // Apply pagination for the current page using `startAfter` if not on the first page
    if (page > 1) {
      // Get the last document from the previous page to start after
      const lastDocSnapshot = await db
        .collection('appointments')
        .orderBy('selectedDate')
        .limit((page - 1) * pageSize)
        .get();
      const lastDoc = lastDocSnapshot.docs[lastDocSnapshot.docs.length - 1]; // Last document from previous page
      appointmentsQuery = appointmentsQuery.startAfter(lastDoc); // Set the starting point for the query
    }

    // Get the appointments for the current page
    const appointmentsSnapshot = await appointmentsQuery.get();
    const appointments = appointmentsSnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    res.render('admin.ejs', {
      email: req.user ? req.user.email : '',
      appointments,
      currentPage: page,
      totalPages,
    });
  } catch (error) {
    console.error('Error fetching appointments:', error);
    res.status(500).send('Error fetching appointments');
  }
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
app.post('/contact-form', contactFormLimiter, async (req, res) => {
  try {
    const { name, email, message, honeypot } = req.body;

    // If honeypot field is filled, reject submission
    if (honeypot) {
      console.log('Honeypot triggered, likely spam bot');
      req.flash('error', 'Spam detected.');
      return res.redirect('/contact');
    }

    if (!name || !email || !message) {
      req.flash('error', 'All fields are required.');
      return res.redirect('/contact');
    }

    await transporter.sendMail({
      to: process.env.EMAIL_USER_SEND, // Replace with the specific email address
      html: `
        <p><strong>Name:</strong> ${name}</p>
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>Message:</strong></p>
        <p>${message}</p>
      `,
    });

    req.flash('success', 'Mesajul tau a fost trimis cu succes!');
    res.redirect('/contact');
  } catch (error) {
    console.error('Error sending email:', error);
    req.flash('error', 'Nu s-a putut trimite mesajul.Incearca mai tarziu!');
    res.redirect('/contact');
  }
});

app.post('/submit-review', contactFormLimiter, isLoggedIn, async (req, res) => {
  try {
    const { name, rating, reviewText } = req.body;

    if (!name || !rating || !reviewText) {
      req.flash('error', 'Toate câmpurile sunt obligatorii.');
      return res.redirect('/review');
    }

    await addReview(req.user.id, name, rating, reviewText);

    req.flash(
      'success',
      'Review-ul a fost trimis cu succes și este în așteptare pentru aprobare.'
    );
    res.redirect('/');
  } catch (error) {
    console.error('Error submitting review:', error);
    req.flash('error', 'A apărut o eroare. Vă rugăm să încercați din nou.');
    res.redirect('/');
  }
});

// Add routes for admin to manage reviews
app.get('/admin/reviews', isAdmin, async (req, res) => {
  try {
    const reviews = await getAllReviews();
    res.render('admin-reviews.ejs', {
      email: req.user.email,
      reviews: reviews,
    });
  } catch (error) {
    console.error('Error fetching reviews for admin:', error);
    res.render('admin-reviews.ejs', {
      email: req.user.email,
      reviews: [],
    });
  }
});

// Approve review route
app.post('/admin/reviews/approve/:id', isAdmin, async (req, res) => {
  try {
    const reviewId = req.params.id;
    await approveReview(reviewId);
    res.redirect('/admin/reviews');
  } catch (error) {
    console.error('Error approving review:', error);
    res.status(500).send('Error approving review');
  }
});

// Delete review route
app.post('/admin/reviews/delete/:id', isAdmin, async (req, res) => {
  try {
    const reviewId = req.params.id;
    await deleteReview(reviewId);
    res.redirect('/admin/reviews');
  } catch (error) {
    console.error('Error deleting review:', error);
    res.status(500).send('Error deleting review');
  }
});
app.post('/register', isNotLoggedIn, async (req, res) => {
  try {
    const email = req.body.regusername;
    const password = req.body.regpassword;

    // 1. Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    // 2. Create the user in Firebase Auth
    const userRecord = await addUser(email, password);
    const uid = userRecord.uid;
    console.log('User created successfully:', uid);

    // 3. Save the hashed password + other details to Firestore
    await db.collection('users').doc(uid).set({
      id: uid, // Store UID explicitly
      email: email,
      password: hashedPassword,
      isAdmin: false, // Set admin role to false by default
      createdAt: new Date(),
    });

    // 4. Send the verification email
    const emailSent = await sendVerificationEmail(email);
    if (!emailSent) {
      console.warn('Failed to send verification email to:', email);
      req.flash(
        'warning',
        'Contul a fost creat, dar emailul de verificare nu a putut fi trimis. Vă rugăm să contactați suportul.'
      );
    }

    // 5. Show the "please verify your email" page
    res.render('checkEmail');
  } catch (e) {
    console.error('Registration error:', e);
    req.flash('error', 'Registration failed: ' + e.message);
    res.redirect('/register');
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

app.get('/booked-counts', async (req, res) => {
  try {
    const snapshot = await db.collection('appointments').get();
    const counts = {};

    snapshot.forEach((doc) => {
      const data = doc.data();
      const key = `${data.selectedDate}-${data.selectedTime}`;

      counts[key] = (counts[key] || 0) + 1;
    });

    res.json(counts);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch booked counts' });
  }
});
app.get('/check-booking', async (req, res) => {
  const { date, time } = req.query;

  try {
    const snapshot = await db
      .collection('appointments')
      .where('selectedDate', '==', date)
      .where('selectedTime', '==', time)
      .get();

    snapshot.forEach((doc) => {
      console.log(
        'Date:',
        doc.data().selectedDate,
        '| Time:',
        doc.data().selectedTime
      );
    });

    res.json({ count: snapshot.size });
  } catch (error) {
    console.error('Error checking booking count:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});
app.get('/fully-booked', async (req, res) => {
  try {
    const snapshot = await db.collection('appointments').get();

    const bookingMap = {};

    snapshot.forEach((doc) => {
      const { selectedDate, selectedTime } = doc.data();
      const key = `${selectedDate}_${selectedTime}`;
      bookingMap[key] = (bookingMap[key] || 0) + 1;
    });

    const fullyBooked = [];

    for (const key in bookingMap) {
      if (bookingMap[key] >= 3) {
        const [date, time] = key.split('_');
        fullyBooked.push({ date, time });
      }
    }

    res.json(fullyBooked);
  } catch (err) {
    console.error('Error fetching fully booked slots:', err);
    res.status(500).json({ error: 'Server error' });
  }
});
app.post(
  '/bookAppointment',
  contactFormLimiter,
  isLoggedIn,
  async (req, res) => {
    const { date, time } = req.body;
    const userId = req.user.id;

    if (!date || !time || !userId) {
      return res.status(400).json({ message: 'Missing required information.' });
    }

    try {
      // Check if the user has already booked the same time slot
      const existingAppointment = await db
        .collection('appointments')
        .where('userId', '==', userId)
        .where('date', '==', date)
        .where('time', '==', time)
        .get();

      if (!existingAppointment.empty) {
        return res.status(400).json({
          message: 'You already have an appointment for this time slot.',
        });
      }

      // Check if the slot is already fully booked (3 users)
      const slotCount = await checkAppointments(time, date);

      if (slotCount >= 3) {
        return res
          .status(400)
          .json({ message: 'This time slot is fully booked.' });
      }

      // If not fully booked, proceed with creating the appointment
      await db.collection('appointments').add({
        date,
        time,
        userId,
        createdAt: new Date().toISOString(),
      });

      // Send a success response
      res.status(200).json({ message: 'Appointment successfully booked.' });
    } catch (error) {
      console.error('Error booking appointment:', error);
      res.status(500).json({ message: 'Failed to book appointment', error });
    }
  }
);

app.post('/newPassword', contactFormLimiter, async (req, res) => {
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
app.post(
  '/upload',
  contactFormLimiter,
  upload.single('profilePic'),
  async (req, res) => {
    if (!req.user || !req.user.id) {
      return res.status(401).json({ success: false, message: 'Not logged in' });
    }

    const file = req.file;
    if (!file) {
      return res
        .status(400)
        .json({ success: false, message: 'No file uploaded' });
    }

    try {
      const bucket = admin.storage().bucket();

      // Create a user-specific file path to ensure uniqueness
      const fileName = `profilePics/user_${req.user.id}/${Date.now()}_${
        file.originalname
      }`;
      const fileUpload = bucket.file(fileName);

      const stream = fileUpload.createWriteStream({
        metadata: {
          contentType: file.mimetype,
        },
      });

      stream.on('error', (err) => {
        console.error('Upload error:', err);
        res.status(500).json({ success: false, message: 'Upload failed' });
      });

      stream.on('finish', async () => {
        try {
          // Make file publicly accessible
          await fileUpload.makePublic();
          const imageUrl = `https://storage.googleapis.com/${bucket.name}/${fileName}`;

          // Find user document by ID and update profile picture
          const userQuery = await db
            .collection('users')
            .where('id', '==', req.user.id)
            .get();

          if (!userQuery.empty) {
            const userDoc = userQuery.docs[0];
            await db.collection('users').doc(userDoc.id).update({
              profilePic: imageUrl,
            });

            // Update the session data to include the new profile pic
            if (req.user) {
              req.user.profilePic = imageUrl;
            }

            res.json({ success: true, imageUrl });
          } else {
            res.status(404).json({ success: false, message: 'User not found' });
          }
        } catch (error) {
          console.error('Error saving image URL:', error);
          res.status(500).json({
            success: false,
            message: 'Upload succeeded but failed to update user',
          });
        }
      });

      stream.end(file.buffer);
    } catch (error) {
      console.error('Error in upload process:', error);
      res
        .status(500)
        .json({ success: false, message: 'Internal server error' });
    }
  }
);

app.delete('/appointments/delete/:id', async (req, res) => {
  const appointmentId = req.params.id;

  try {
    const appointmentRef = db.collection('appointments').doc(appointmentId);
    const doc = await appointmentRef.get();

    // If appointment doesn't exist, send a JSON response with a 404 status
    if (!doc.exists) {
      return res.status(404).json({ error: 'Appointment not found.' });
    }

    // Delete the appointment from Firestore
    await appointmentRef.delete();

    // Send a JSON response indicating successful deletion
    res.status(200).json({ message: 'Appointment deleted successfully!' });
  } catch (error) {
    console.error('Error deleting appointment:', error);

    // Send a JSON error response in case of failure
    res.status(500).json({ error: 'Failed to delete appointment.' });
  }
});

app.put('/appointments/:id', async (req, res) => {
  const appointmentId = req.params.id;
  const updatedData = req.body;

  try {
    const appointmentRef = db.collection('appointments').doc(appointmentId);

    // Check if the document exists first (optional)
    const docSnap = await appointmentRef.get();
    if (!docSnap.exists) {
      return res.status(404).json({ message: 'Appointment not found' });
    }

    await appointmentRef.update(updatedData);

    res.status(200).json({ message: 'Appointment updated successfully' });
  } catch (error) {
    console.error('Error updating appointment:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});
app.post(
  '/appointmentRegister',
  contactFormLimiter,
  isLoggedIn,
  async (req, res) => {
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

      // Check if all required fields are filled
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

      // Check if user already has an appointment for the same date and time
      const existingAppointmentSnapshot = await db
        .collection('appointments')
        .where('userId', '==', userId) // Check if the user already has an appointment
        .where('selectedDate', '==', selectedDate) // Check if the date is the same
        .where('selectedTime', '==', selectedTime) // Check if the time is the same
        .get();

      // If there is an existing appointment for the same date and time, prevent the booking
      if (!req.user.isAdmin && !existingAppointmentSnapshot.empty) {
        req.flash('error', 'A-ti facut deja programare pentru aceasta ora!');
        return res.redirect('/appointmentsLogged');
      }

      // Proceed with booking the appointment
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

      // Add the appointment to the database
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

      req.flash('success', 'Programarea a fost facuta cu succes');
      res.redirect('/appointmentsLogged');
    } catch (e) {
      console.error('Error adding appointment:', e.message); // Log any error
      req.flash(
        'error',
        'Failed to register appointment. Please check your input and try again.'
      );
      res.redirect('/appointmentsLogged');
    }
  }
);

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

app.post('/login', isNotLoggedIn, async (req, res, next) => {
  passport.authenticate('local', async (err, user, info) => {
    if (err || !user) {
      req.flash('error', info?.message || 'Login failed');
      return res.redirect('/appointments');
    }

    try {
      // ✅ Get the Firebase user to check email verification
      const firebaseUser = await firebaseAdmin
        .auth()
        .getUserByEmail(user.email);

      if (!firebaseUser.emailVerified) {
        req.flash('error', 'Please verify your email before logging in.');
        return res.redirect('/appointments');
      }

      req.logIn(user, (err) => {
        if (err) {
          console.error('Login error:', err);
          return res.redirect('/appointments');
        }

        // ✅ Store UID and email in session
        req.session.user = {
          uid: user.id,
          email: user.email,
        };

        console.log('Logged in user ID:', user.id);

        // ✅ Redirect based on user type
        if (user.isAdmin) {
          return res.redirect('/admin');
        } else {
          return res.redirect('/appointmentsLogged');
        }
      });
    } catch (firebaseError) {
      console.error('Error checking email verification:', firebaseError);
      req.flash('error', 'Unable to verify email status.');
      return res.redirect('/appointments');
    }
  })(req, res, next);
});

async function sendPasswordResetEmail(email, token) {
  try {
    const resetLink = `http://localhost:3000/newPassword?token=${token}`;

    await transporter.sendMail({
      to: email,
      subject: 'Resetează parola ta',
      html: `
      <p>Bună,</p>
      <p>Ai solicitat o resetare a parolei. Apasă pe link-ul de mai jos pentru a seta o parolă nouă:</p>
      <a href="${resetLink}">${resetLink}</a>
      <p>Dacă nu ai solicitat acest lucru, poți ignora acest email în siguranță.</p>
      `,
    });

    console.log('Password reset link sent to:', email);

    return { success: true, message: 'Password reset email sent.' };
  } catch (error) {
    console.error('Error sending reset email:', error);
    return { success: false, message: 'Failed to send reset email.' };
  }
}
async function sendVerificationEmail(userEmail) {
  const actionCodeSettings = {
    url: 'http://localhost:3000/login', // After verification, redirect here
    handleCodeInApp: false,
  };

  try {
    console.log('Generating verification link for:', userEmail);
    const link = await getAuth().generateEmailVerificationLink(
      userEmail,
      actionCodeSettings
    );
    console.log('Generated link:', link);

    // Send this link via email
    console.log('Attempting to send email to:', userEmail);
    await sendEmail(
      userEmail,
      'Verificare email',
      `Apasa acest link sa-ti verifici emailul: ${link}`
    );
    console.log('Verification email sent successfully!');
    return true;
  } catch (err) {
    console.error('Error sending verification email:', err);
    return false;
  }
}
async function sendEmail(to, subject, html) {
  console.log(
    `Setting up email transport with user: ${process.env.EMAIL_USER}`
  );

  const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 465,
    secure: true,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  try {
    console.log('Sending email...');
    const info = await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to,
      subject,
      html,
    });
    console.log('Email sent! Message ID:', info.messageId);
    return true;
  } catch (emailError) {
    console.error('Failed to send email:', emailError);
    return false;
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

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server started on port ${PORT}`);
});
