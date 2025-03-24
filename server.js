var dotenv = require('dotenv');
const express = require('express');
const path = require('path');
const bcrypt = require('bcrypt');
const passport = require('passport');
const flash = require('express-flash');
const session = require('express-session');
const methodOverride = require('method-override');

// const {
//   signInWithEmailAndPassword,
//   createUserWithEmailAndPassword,
//   onAuthStateChanged,
// } = require('firebase/auth');
// const { auth } = require('./firebase');

// if (process.env.NODE_ENV !== 'production') {
//   dotenv.config();
// }

// const signIn = async (email, password) => {
//   try {
//     const userCredential = await signInWithEmailAndPassword(
//       auth,
//       email,
//       password
//     );
//     console.log('User signed in:', userCredential.user);
//   } catch (error) {
//     console.error('Error signing in:', error.message);
//   }
// };
// const signUp = async (email, password) => {
//   try {
//     const userCredential = await createUserWithEmailAndPassword(
//       auth,
//       email,
//       password
//     );
//     console.log('User registered:', userCredential.user);
//   } catch (error) {
//     console.error('Error registering:', error.message);
//   }
// };

const app = express();

const users = [
  {
    id: '1742815888198 ',
    email: 'test@test.com',
    password: '$2b$10$WRZvj3Nj3XY.KwEuXeiOIekGmzgmFHfy7QRd.9yx1PLGkSaGBdwSi',
  },
];
const initializePassport = require('./passport-config');
initializePassport(
  passport,
  (email) => users.find((user) => user.email === email),
  (id) => users.find((user) => user.id === id)
);

app.set('view-engine', 'ejs');
app.use(express.urlencoded({ extended: false }));
app.use(flash());
app.use(
  session({
    secret: process.env.SESSION_SECRET || 'default_secret', // provide a default secret
    resave: false,
    saveUninitialized: false,
  })
);
app.use(methodOverride('_method'));
app.use(passport.initialize());
app.use(passport.session());

app.get('/', isLoggedIn, (req, res) => {
  res.render('index.ejs', { email: req.user ? req.user.email : '' });
});

app.get('/views/partials/header.ejs', (req, res) => {
  res.render('/views/partials/header.ejs', {
    email: req.user ? req.user.email : '',
  });
});
app.get('/about', (req, res) => {
  res.render('about.ejs', { email: req.user ? req.user.email : '' });
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

app.get('/appointments', (req, res) => {
  res.render('appointments.ejs', { email: '' });
});
app.get('/appointmentsLogged', (req, res) => {
  res.render('appointmentsLogged.ejs', {
    email: req.user ? req.user.email : '',
  });
});

app.post('/register', isNotLoggedIn, async (req, res) => {
  try {
    const hashedPassword = await bcrypt.hash(req.body.regpassword, 10);
    users.push({
      id: Date.now().toString(),
      email: req.body.regusername,
      password: hashedPassword,
    });
    res.redirect('/appointments');
  } catch {
    res.redirect('/appointments');
  }
  console.log(users);
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
  })
);
function isLoggedIn(req, res, next) {
  if (req.isAuthenticated()) {
    return next();
  }
  res.redirect('/appointments');
}
function isNotLoggedIn(req, res, next) {
  if (req.isAuthenticated()) {
    return res.redirect('/');
  }
  next();
}

app.use(express.static(path.join(__dirname, 'public')));

app.listen(3000);
