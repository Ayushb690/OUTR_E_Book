require('dotenv').config();
const mongoose = require('mongoose');
const fs = require('fs');
const csv = require('csv-parser');
const Book = require('./models/Book');

const importCSV = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('MongoDB Connected for Import...');

    const books = [];
    fs.createReadStream('Engineering_books_complete.csv')
      .pipe(csv())
      .on('data', (row) => {
        // Map CSV columns to Book model
        // title,author,description,price,quantity,availability,isbn
        books.push({
          title: row.title,
          author: row.author,
          description: row.description,
          isbn: row.isbn,
          totalCopies: parseInt(row.quantity) || 1,
          availableCopies: row.availability === 'true' ? parseInt(row.quantity) : 0,
          publisher: 'Imported',
          genre: ['Engineering']
        });
      })
      .on('end', async () => {
        console.log(`CSV file successfully processed. Found ${books.length} books.`);
        
        for (const bookData of books) {
          try {
            // Use findOneAndUpdate with upsert to avoid duplicate ISBN errors
            await Book.findOneAndUpdate(
              { isbn: bookData.isbn },
              bookData,
              { upsert: true, new: true }
            );
          } catch (err) {
            console.error(`Error importing book ${bookData.isbn}:`, err.message);
          }
        }
        
        console.log('Book import completed.');
        process.exit();
      });

  } catch (err) {
    console.error('Import failed:', err.message);
    process.exit(1);
  }
};

importCSV();
