// passport-config.js
const LocalStrategy = require('passport-local').Strategy;
const bcrypt = require('bcrypt');
const admin = require('firebase-admin');
const db = admin.firestore();

function initialize(passport) {
  passport.use(
    new LocalStrategy(
      { usernameField: 'email' },
      async (email, password, done) => {
        try {
          let userRecord;

          try {
            // 1. Try to get user from Firebase Auth
            userRecord = await admin.auth().getUserByEmail(email);
          } catch (err) {
            if (err.code === 'auth/user-not-found') {
              // 2. If not found in Auth, check Firestore
              const usersRef = db.collection('users');
              const snapshot = await usersRef.where('email', '==', email).get();

              if (snapshot.empty) {
                return done(null, false, {
                  message: 'No user found with that email',
                });
              }

              const userData = snapshot.docs[0].data();
              const docId = snapshot.docs[0].id;

              // 3. Register user in Firebase Auth with plain password (optional)
              userRecord = await admin.auth().createUser({
                uid: docId,
                email: userData.email,
                password: userData.password, // Assuming it's already plain-text at registration
              });
            } else {
              throw err;
            }
          }

          const uid = userRecord.uid;

          // 4. Get user data from Firestore
          const userDoc = await db.collection('users').doc(uid).get();
          if (!userDoc.exists) {
            return done(null, false, {
              message: 'User found in Auth but not in database',
            });
          }

          const user = userDoc.data();

          // 5. Check password
          if (!password || !user.password) {
            return done(null, false, {
              message: 'Missing password information',
            });
          }

          const match = await bcrypt.compare(password, user.password);
          if (!match) {
            return done(null, false, { message: 'Incorrect password' });
          }

          return done(null, { uid, email, ...user });
        } catch (error) {
          console.error('Login error:', error);
          return done(null, false, { message: 'Login failed' });
        }
      }
    )
  );

  passport.serializeUser((user, done) => {
    done(null, user.uid);
  });

  passport.deserializeUser(async (uid, done) => {
    try {
      const userDoc = await db.collection('users').doc(uid).get();
      if (!userDoc.exists) {
        return done(new Error('User not found during deserialization'));
      }
      done(null, userDoc.data());
    } catch (err) {
      done(err);
    }
  });
}

module.exports = initialize;
