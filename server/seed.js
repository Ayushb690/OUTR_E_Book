require('dotenv').config();
const mongoose = require('mongoose');
const fs = require('fs');
const csv = require('csv-parser');
const User = require('./models/User');
const Book = require('./models/Book');
const Supplier = require('./models/Supplier');
const Transaction = require('./models/Transaction');
const bcrypt = require('bcryptjs');

const seedDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('MongoDB Connected for Seeding...');
    
    // Clear existing data
    await User.deleteMany({});
    await Book.deleteMany({});
    await Supplier.deleteMany({});
    await Transaction.deleteMany({});
    console.log('Existing data cleared.');

    const salt = await bcrypt.genSalt(10);
    const password = await bcrypt.hash('admin123', salt);

    // Create 2 Librarians (Admins)
    await User.create([
      { 
        name: 'Admin One', 
        email: 'admin1@test.com', 
        password, 
        role: 'librarian',
        memberId: 'LIB001'
      },
      { 
        name: 'Admin Two', 
        email: 'admin2@test.com', 
        password, 
        role: 'librarian',
        memberId: 'LIB002'
      }
    ]);
    console.log('2 Admin accounts created.');

    // Create 5 Students
    const students = [];
    for (let i = 1; i <= 5; i++) {
      students.push({
        name: `Student ${i}`,
        email: `student${i}@test.com`,
        password,
        role: 'student',
        memberId: `STU00${i}`
      });
    }
    await User.insertMany(students);
    console.log('5 Student accounts created.');

    // Create default Supplier
    await Supplier.create({ 
      name: 'Global Engineering Books', 
      email: 'sales@global-eng.com', 
      phone: '1234567890',
      contactPerson: 'John Supplier',
      address: '123 Tech Avenue'
    });
    console.log('Default supplier created.');

    // Import books from CSV
    const books = [];
    console.log('Processing CSV file...');
    
    fs.createReadStream('Engineering_books_complete.csv')
      .pipe(csv())
      .on('data', (row) => {
        books.push({
          title: row.title,
          author: row.author,
          description: row.description,
          isbn: row.isbn,
          totalCopies: parseInt(row.quantity) || 1,
          availableCopies: row.availability === 'true' ? (parseInt(row.quantity) || 1) : 0,
          publisher: 'Imported',
          genre: ['Engineering']
        });
      })
      .on('end', async () => {
        console.log(`CSV processed. Importing ${books.length} books...`);
        
        try {
          await Book.insertMany(books, { ordered: false });
          console.log('Database Seeded Successfully with CSV data and dummy users.');
        } catch (err) {
          if (err.code === 11000) {
            console.warn('Some duplicate ISBNs were skipped.');
          } else {
            console.error('Error during batch insert:', err.message);
          }
        }
        
        process.exit();
      });

  } catch (err) {
    console.error('Seeding failed:', err.message);
    process.exit(1);
  }
};

seedDB();
