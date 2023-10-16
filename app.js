// Import required libraries
const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const cors = require('cors');
const cron = require('node-cron');

const app = express();
const port = 8080;

// MongoDB connection URL and database name
const dbURI = 'mongodb+srv://shahrozahmed787:sheroo123@cluster0.zxn7u7v.mongodb.net';
const dbName = 'savings';


// Connect to MongoDB
mongoose.connect(dbURI, { useNewUrlParser: true, useUnifiedTopology: true });

// Handle MongoDB connection events
mongoose.connection.on('connected', () => {
  console.log('Connected to the MongoDB database!');
});

mongoose.connection.on('error', (err) => {
  console.error('Error connecting to MongoDB:', err);
});



// Define a schema for certificates
const certificateSchema = new mongoose.Schema({
  amount: Number,
  interestRate: Number,
  purchaseDate: Date,
});

const Certificate = mongoose.model('Certificate', certificateSchema);


// Define a schema for savings
const savingSchema = new mongoose.Schema({
  amount: Number,
});

const Saving = mongoose.model('Saving', savingSchema);


// Middleware to parse JSON request bodies
app.use(bodyParser.json());
app.use(cors());




// Initialize savings account with ₹400,000 if it doesn't exist
async function initializeSavings() {
  try {
    let savings = await Saving.findOne();

    if (!savings) {
      savings = new Saving({ amount: 400000 });
      await savings.save();
      console.log('Savings account initialized with ₹400,000');
    }
  } catch (error) {
    console.error('Error initializing savings account:', error);
  }
}

// Initialize savings account when the server starts
initializeSavings();




// Function to calculate and add interest to savings
async function calculateAndAddInterest() {
  try {
    const currentDate = new Date();

    // Check if there's an existing savings document
    let savings = await Saving.findOne();

    if (!savings) {
      console.error('Savings account not found');
      return;
    }

    // Find certificates with the same date as the current date
    const certificates = await Certificate.find({ purchaseDate: currentDate });

    // Calculate the total interest for the certificates
    let totalInterest = 0;
    certificates.forEach((certificate) => {
      totalInterest += certificate.amount * certificate.interestRate;
    });

    // Update the savings with the calculated interest
    savings.amount += totalInterest;
    await savings.save();

    console.log('Interest added to savings:', totalInterest);
  } catch (error) {
    console.error('Error in calculateAndAddInterest:', error);
  }
}




// Schedule the function to run daily (you can adjust the cron schedule as needed)
cron.schedule('0 0 * * *', () => {
  console.log('Running daily interest calculation.');
  calculateAndAddInterest();
});




// API endpoint to add a certificate
app.post('/addCertificate', async (req, res) => {
  try {
    const { amount, interestRate, purchaseDate } = req.body;
    const certificate = new Certificate({ amount, interestRate, purchaseDate });

    // Save the certificate
    await certificate.save();

    console.log('Certificate saved to the database successfully!');
    res.status(201).json({ message: 'Certificate added successfully' });
  } catch (error) {
    console.error('Error saving certificate:', error);
    res.status(500).json({ error: 'An error occurred' });
  }
});




// API endpoint to withdraw from savings
app.post('/withdrawSavings', async (req, res) => {
  try {
    const { amountToWithdraw } = req.body;
    let savings = await Saving.findOne();

    if (!savings) {
      console.error('Savings account not found');
      return res.status(404).json({ error: 'Savings account not found' });
    }

    if (amountToWithdraw > savings.amount) {
      return res.status(400).json({ error: 'Insufficient funds' });
    }

    // Withdraw the specified amount from savings
    savings.amount -= amountToWithdraw;
    await savings.save();

    res.status(200).json({ message: 'Withdrawal successful' });
  } catch (error) {
    console.error('Error withdrawing from savings:', error);
    res.status(500).json({ error: 'An error occurred' });
  }
});




// API endpoint to get the total savings amount
app.get('/getTotalSavings', async (req, res) => {
  try {
    // Find the current savings document
    const savings = await Saving.findOne();

    if (!savings) {
      return res.status(404).json({ error: 'Savings account not found' });
    }

    res.status(200).json({ totalSavings: savings.amount });
  } catch (error) {
    console.error('Error fetching total savings:', error);
    res.status(500).json({ error: 'An error occurred' });
  }
});



// API endpoint to get all certificates
app.get('/getCertificates', async (req, res) => {
  try {
      const certificates = await Certificate.find();
      res.status(200).json({ certificates });
  } catch (error) {
      console.error('Error fetching certificates:', error);
      res.status(500).json({ error: 'An error occurred' });
  }
});

// Server-side code
app.get('/getCertificate/:id', async (req, res) => {
  try {
      const certificateID = req.params.id;
      // Use the certificateID to query your database and retrieve the certificate details
      // Send the certificate data in the response
      // Replace this with your actual database query
      const certificate = await Certificate.findById(certificateID);
      if (!certificate) {
          return res.status(404).json({ error: 'Certificate not found' });
      }
      res.status(200).json({ certificate });
  } catch (error) {
      console.error('Error fetching certificate details:', error);
      res.status(500).json({ error: 'An error occurred' });
  }
});



// API endpoint to edit a certificate
app.put('/editCertificate/:id', async (req, res) => {
  try {
      const certificateID = req.params.id;
      const { amount, interestRate, purchaseDate } = req.body;

      // Find the certificate by ID and update its data
      const certificate = await Certificate.findByIdAndUpdate(certificateID, {
          amount,
          interestRate,
          purchaseDate,
      });

      if (!certificate) {
          return res.status(404).json({ error: 'Certificate not found' });
      }

      res.status(200).json({ message: 'Certificate updated successfully' });
  } catch (error) {
      console.error('Error editing certificate:', error);
      res.status(500).json({ error: 'An error occurred' });
  }
});




// API endpoint to delete a certificate
app.delete('/deleteCertificate/:id', async (req, res) => {
  try {
      const certificateID = req.params.id;

      // Find the certificate by ID and delete it
      const certificate = await Certificate.findByIdAndDelete(certificateID);

      if (!certificate) {
          return res.status(404).json({ error: 'Certificate not found' });
      }

      res.status(200).json({ message: 'Certificate deleted successfully' });
  } catch (error) {
      console.error('Error deleting certificate:', error);
      res.status(500).json({ error: 'An error occurred' });
  }
});



// Start the server
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
