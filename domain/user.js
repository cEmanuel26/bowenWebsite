const {
  addDoc,
  collection,
  getFirestore,
  getDocs,
  getDoc,
  doc,
  query,
  where,
  updateDoc,
} = require('firebase/firestore');
const { randomUUID } = require('crypto');
const path = require('path');
const { firebaseApp } = require('../firebase');
const firebaseAdmin = require('firebase-admin');
const bcrypt = require('bcrypt');
// Initialize Firebase Admin SDK with your service account credentials
if (!firebaseAdmin.apps.length) {
  firebaseAdmin.initializeApp({
    credential: firebaseAdmin.credential.cert(
      require(path.join(
        __dirname,
        './bowentherapy-42520-firebase-adminsdk-fbsvc-1f75f8b89c.json'
      ))
    ),
    databaseURL: 'https://bowentherapy-42520.firebaseio.com',
  });
}

const db = firebaseAdmin.firestore(); // Initialize Firestore
class User {
  constructor(username, password) {
    this.username = username;
    this.password = password;
  }
}

class UserAppointment {
  constructor(firstname, lastname, phone, move, address, message, details) {
    this.firstname = firstname;
    this.lastname = lastname;
    this.phone = phone;
    this.move = move;
    this.address = address;
    this.message = message;
    this.details = details;
  }
}

const firestore = (() => {
  try {
    return getFirestore(firebaseApp);
  } catch (error) {
    console.error('Error initializing Firestore:', error);
    throw error;
  }
})();

async function getAppointments() {
  try {
    // Fetch appointments from Firestore
    const appointmentsSnapshot = await getDocs(
      collection(firestore, 'appointments')
    );
    const appointments = [];
    console.log('Fetched appointments count:', appointmentsSnapshot.size); // Log the count of fetched appointments

    appointmentsSnapshot.forEach((doc) => {
      const data = doc.data();
      console.log('Fetched appointment data:', data); // Log the data of each fetched appointment
      appointments.push({
        id: doc.id,
        ...data,
        email: data.email, // Ensure the email field is included (this will be fetched later)
      });
    });

    // If appointments are fetched, proceed with getting the emails
    for (let appointment of appointments) {
      console.log('Fetching email for userId:', appointment.userId); // Log userId of each appointment
      try {
        // Try fetching user email based on userId from the appointment
        const email = await getUserEmailById(appointment.userId);
        appointment.email = email; // Assign the email to the appointment
      } catch (err) {
        console.error(
          `Error fetching email for appointment ID ${appointment.id}:`,
          err
        );
        appointment.email = 'Email not found'; // Default value if email fetch fails
      }
    }

    console.log('Final appointments list with emails:', appointments); // Log the final appointments list
    return appointments;
  } catch (error) {
    console.error('Error fetching appointments:', error);
    throw error;
  }
}
async function checkAppointments(time, date) {
  try {
    // Query the database for appointments on the selected date and time
    const appointments = await db
      .collection('appointments') // Your appointments collection
      .where('time', '==', time)
      .where('date', '==', date)
      .get();

    return appointments.size; // Returns the count of appointments at this time
  } catch (error) {
    console.error('Error checking appointments:', error);
    throw new Error('Failed to check appointments');
  }
}
async function getUserEmailById(userId) {
  try {
    console.log('Looking for user with ID:', userId); // Log the userId being searched
    const q = query(
      collection(firestore, 'users'),
      where('id', '==', userId) // Search by the 'id' field in the 'users' collection
    );
    const querySnapshot = await getDocs(q);

    if (!querySnapshot.empty) {
      // Assuming the first document is the user, since user IDs should be unique
      const userDoc = querySnapshot.docs[0];
      console.log('Fetched userDoc:', userDoc.data()); // Log the found user
      return userDoc.data().email; // Return the user's email
    } else {
      console.log(`User not found for userId: ${userId}`);
      throw new Error('User not found');
    }
  } catch (error) {
    console.error('Error getting user email:', error);
    throw error;
  }
}

async function updateUserPassword(email, plainPassword) {
  try {
    // First, find the user by email
    const q = query(
      collection(firestore, 'users'),
      where('email', '==', email)
    );
    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
      throw new Error('User not found');
    }

    const userDoc = querySnapshot.docs[0];
    const userRef = doc(firestore, 'users', userDoc.id);

    // Hash the new password
    const hashedPassword = await bcrypt.hash(plainPassword, 10);

    // Update the user document with the hashed password
    await updateDoc(userRef, {
      password: hashedPassword,
    });

    console.log('Password updated successfully');
  } catch (error) {
    console.error('Error updating user password:', error);
    throw error;
  }
}

async function addAppointment(
  firstname,
  lastname,
  phone,
  move,
  address,
  message,
  details,
  userId,
  selectedDate,
  selectedTime
) {
  try {
    const email = await getUserEmailById(userId);
    const appointment = new UserAppointment(
      firstname,
      lastname,
      phone,
      move,
      address,
      message,
      details
    );

    // Manually split the selectedTime to extract the time portion (HH:mm)
    const timeParts = selectedTime.split(':'); // This gives us [hour, minute, second]
    const formattedTime = `${timeParts[0]}:${timeParts[1]}`; // We only need hours and minutes

    const appointmentData = {
      ...appointment,
      userId,
      email,
      selectedDate,
      selectedTime: formattedTime, // Store the time in HH:mm format
      createdAt: new Date().toISOString(),
    };

    console.log(
      'Appointment data before saving to Firestore:',
      appointmentData
    ); // Log appointment data

    await addDoc(collection(firestore, 'appointments'), appointmentData);
    console.log('Appointment saved successfully');
  } catch (error) {
    console.error('Error saving appointment:', error); // Log error if any
    throw error;
  }
}

async function addUser(email, password, isAdmin = false) {
  const existingUser = await getUserByEmail(email);
  if (existingUser) {
    throw new Error('User already exists with this email');
  }

  const userId = randomUUID(); // Generate a unique userId
  console.log('Saving user with ID:', userId);

  await addDoc(collection(firestore, 'users'), {
    id: userId, // Store the generated userId in the 'users' document
    email,
    password,
    isAdmin,
  });
}

async function getUserByEmail(email) {
  try {
    const q = query(
      collection(firestore, 'users'),
      where('email', '==', email)
    );
    const querySnapshot = await getDocs(q);
    let user = undefined;
    querySnapshot.forEach((doc) => {
      if (!user) {
        user = doc.data();
      }
    });
    return user;
  } catch (e) {
    console.error('Error getting user by email:', e);
    throw e;
  }
}
// Save reset token directly inside 'users' collection with the email as the document ID
async function saveResetTokenForUser(email, token) {
  try {
    const resetTokenData = {
      token: token,
      email: email,
      createdAt: firebaseAdmin.firestore.FieldValue.serverTimestamp(),
      expiryDate: Date.now() + 3600000, // 1 hour from now
    };

    await db.collection('passwordResetTokens').add(resetTokenData);
    console.log('Reset token saved to passwordResetTokens collection');
  } catch (error) {
    console.error('Error saving reset token:', error);
    throw error;
  }
}

const verifyResetToken = async (token) => {
  try {
    const snapshot = await db
      .collection('passwordResetTokens')
      .where('token', '==', token)
      .limit(1)
      .get();

    if (snapshot.empty) {
      return { success: false, message: 'Invalid or expired token' };
    }

    const doc = snapshot.docs[0];
    const data = doc.data();

    if (Date.now() > data.expiryDate) {
      return { success: false, message: 'Token has expired' };
    }

    return { success: true, email: data.email, ref: doc.ref };
  } catch (error) {
    console.error('Error verifying reset token:', error);
    return { success: false, message: 'Error verifying token' };
  }
};

async function getUserById(id) {
  const q = query(collection(firestore, 'users'), where('id', '==', id));
  const querySnapshot = await getDocs(q);
  let user = undefined;
  querySnapshot.forEach((doc) => {
    if (!user) {
      user = doc.data();
    }
  });
  return user;
}

module.exports = {
  addUser,
  getUserByEmail,
  getUserById,
  addAppointment,
  getAppointments,
  updateUserPassword,
  saveResetTokenForUser,
  verifyResetToken,
  checkAppointments,
};
