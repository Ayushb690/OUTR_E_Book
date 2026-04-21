const Book = require('../models/Book');
const Transaction = require('../models/Transaction');
const User = require('../models/User'); // Import User model for borrow limit check
const LostHistory = require('../models/LostHistory');

// @desc    Request a book (Student)
// @route   POST /api/books/request/:bookId
// @access  Private (Student)
exports.requestBook = async (req, res) => {
  const { bookId } = req.params;
  const userId = req.user.id;

  try {
    const book = await Book.findById(bookId);
    if (!book) return res.status(404).json({ msg: 'Book not found' });
    if (book.availableCopies <= 0) return res.status(400).json({ msg: 'No copies available' });

    // Check if already requested/issued
    const existing = await Transaction.findOne({
      user: userId,
      book: bookId,
      status: { $in: ['requested', 'issued', 'overdue'] }
    });
    if (existing) return res.status(400).json({ msg: 'You already have an active request or issue for this book' });

    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + 14);

    const newRequest = new Transaction({
      book: bookId,
      user: userId,
      dueDate: dueDate,
      status: 'requested'
    });

    await newRequest.save();
    res.status(201).json({ msg: 'Request submitted successfully', request: newRequest });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
};

// @desc    Get all pending requests (Librarian)
// @route   GET /api/books/requests/pending
// @access  Private (Librarian)
exports.getPendingRequests = async (req, res) => {
  try {
    if (req.user.role !== 'librarian') return res.status(403).json({ msg: 'Unauthorized' });

    const requests = await Transaction.find({ status: 'requested' })
      .populate('book', 'title author isbn')
      .populate('user', 'name email memberId');
    
    res.json(requests);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
};

// @desc    Approve/Reject request (Librarian)
// @route   PUT /api/books/request/:requestId
// @access  Private (Librarian)
exports.approveRequest = async (req, res) => {
  const { action } = req.body; // 'approve' or 'reject'
  const { requestId } = req.params;

  try {
    if (req.user.role !== 'librarian') return res.status(403).json({ msg: 'Unauthorized' });

    const request = await Transaction.findById(requestId);
    if (!request) return res.status(404).json({ msg: 'Request not found' });
    if (request.status !== 'requested') return res.status(400).json({ msg: 'Request already processed' });

    if (action === 'approve') {
      const book = await Book.findOneAndUpdate(
        { _id: request.book, availableCopies: { $gt: 0 } },
        { $inc: { availableCopies: -1 } },
        { new: true }
      );

      if (!book) return res.status(400).json({ msg: 'Book no longer available' });

      request.status = 'issued';
      request.issueDate = new Date();
    } else {
      request.status = 'rejected';
    }

    await request.save();
    res.json({ msg: `Request ${action}d successfully`, request });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
};

// @desc    Get transactions for the logged-in user
// @route   GET /api/books/my-transactions
// @access  Private
exports.getMyTransactions = async (req, res) => {
  try {
    const transactions = await Transaction.find({ user: req.user.id })
      .populate('book', 'title author isbn')
      .sort({ issueDate: -1 });
    res.json(transactions);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
};

// @desc    Update book status (Damaged, Lost, Replaced)
// @route   PUT /api/books/status/:bookId
// @access  Private (Librarian only)
exports.updateBookStatus = async (req, res) => {
  const { reason, description } = req.body;
  const { bookId } = req.params;

  try {
    if (req.user.role !== 'librarian') {
      return res.status(403).json({ msg: 'Access denied. Librarian role required.' });
    }

    const book = await Book.findById(bookId);
    if (!book) {
      return res.status(404).json({ msg: 'Book not found' });
    }

    // Logic for 'lost'
    if (reason === 'lost') {
      if (book.totalCopies <= 0) {
        return res.status(400).json({ msg: 'Total stock is already 0.' });
      }
      
      book.totalCopies -= 1;
      // Also decrement available copies if any are available
      if (book.availableCopies > 0) {
        book.availableCopies -= 1;
      }
      await book.save();
    } else if (reason === 'replaced') {
      // Logic for 'replaced' - increment stock
      book.totalCopies += 1;
      book.availableCopies += 1;
      await book.save();
    }
    // 'damaged' logic: for now, we just record it in history. 
    // Depending on policy, we might want to decrement availableCopies but not totalCopies.

    // Create record in LostHistory for audit
    const historyRecord = new LostHistory({
      book: bookId,
      librarian: req.user.id,
      reason,
      description
    });

    await historyRecord.save();

    res.json({
      msg: `Book status updated to ${reason}`,
      book,
      historyRecord
    });

  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(400).json({ msg: 'Invalid book ID format.' });
    }
    res.status(500).send('Server Error');
  }
};

// @desc    Search for books
// @route   GET /api/books/search
// @access  Public (or Private, depending on requirements)
exports.searchBooks = async (req, res) => {
  const { title, author, isbn, available } = req.query;
  let query = {};

  try {
    // Build the query object based on provided parameters
    // Only add to query if the value is not an empty string or null/undefined
    if (title && title.trim() !== '') {
      query.title = { $regex: title.trim(), $options: 'i' };
    }

    if (author && author.trim() !== '') {
      query.author = { $regex: author.trim(), $options: 'i' };
    }

    if (isbn && isbn.trim() !== '') {
      query.isbn = isbn.trim();
    }

    if (available === 'true') {
      query.availableCopies = { $gt: 0 };
    } else if (available === 'false') {
      query.availableCopies = { $lte: 0 };
    }

    // Optimize query to only return specified fields
    const books = await Book.find(query).select('title author isbn availableCopies totalCopies description');

    res.json(books);

  } catch (err) {
    console.error('Search error:', err.message);
    if (err.name === 'BSONTypeError') {
      return res.status(400).json({ msg: 'Invalid search parameter format.' });
    }
    res.status(500).send('Server Error');
  }
};

// @desc    Issue a book to a student
// @route   POST /api/books/issue/:bookId
// @access  Private (Student role required)
exports.issueBook = async (req, res) => {
  const { bookId } = req.params;
  const userId = req.user.id; // User ID from JWT payload
  const userRole = req.user.role; // User role from JWT payload

  // Placeholder for maximum borrow limit per student
  // This should ideally be configurable or stored in the User model
  const MAX_BORROW_LIMIT = 5;

  try {
    // 1. Check if the user is a student
    if (userRole !== 'student') {
      return res.status(403).json({ msg: 'Access denied. Only students can borrow books.' });
    }

    // 2. Check if the student has reached their borrow limit
    const borrowedCount = await Transaction.countDocuments({ user: userId, status: { $in: ['issued', 'overdue'] } });
    if (borrowedCount >= MAX_BORROW_LIMIT) {
      return res.status(400).json({ msg: `Borrow limit reached. You can borrow a maximum of ${MAX_BORROW_LIMIT} books.` });
    }

    // 3. Atomically find the book, verify stock, and decrement availableCopies
    const book = await Book.findOneAndUpdate(
      { _id: bookId, availableCopies: { $gt: 0 } }, // Find book by ID and ensure availableCopies > 0
      { $inc: { availableCopies: -1 } },       // Decrement availableCopies by 1
      { new: true }                           // Return the updated document
    );

    if (!book) {
      return res.status(404).json({ msg: 'Book not found or no copies available.' });
    }

    // 4. Calculate dueDate (e.g., 14 days from now)
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + 14);

    // 5. Create a new Transaction record
    const newTransaction = new Transaction({
      book: bookId,
      user: userId,
      issueDate: new Date(),
      dueDate: dueDate,
      status: 'issued' // Default status is 'issued'
    });

    await newTransaction.save();

    res.status(201).json({
      msg: 'Book issued successfully!',
      transaction: newTransaction,
      bookTitle: book.title,
      dueDate: dueDate.toISOString().split('T')[0] // Format date for better readability
    });

  } catch (err) {
    console.error(err.message);
    // Handle potential errors during findOneAndUpdate or transaction save
    if (err.kind === 'ObjectId') {
      return res.status(400).json({ msg: 'Invalid book ID format.' });
    }
    res.status(500).send('Server Error');
  }
};

// @desc    Return a book
// @route   POST /api/books/return/:bookId
// @access  Private (Student role required)
exports.returnBook = async (req, res) => {
  const { bookId } = req.params;
  const userId = req.user.id;

  try {
    // 1. Find the active transaction for this user and book
    const transaction = await Transaction.findOne({
      user: userId,
      book: bookId,
      status: { $in: ['issued', 'overdue'] }
    });

    if (!transaction) {
      return res.status(404).json({ msg: 'Active transaction not found for this book.' });
    }

    // 2. Calculate fine if overdue (₹50/day)
    const today = new Date();
    const dueDate = new Date(transaction.dueDate);
    let fine = 0;

    if (today > dueDate) {
      const diffTime = Math.abs(today - dueDate);
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      fine = diffDays * 50;
    }

    // 3. Update Transaction record
    transaction.returnDate = today;
    transaction.fineAmount = fine;
    transaction.status = 'returned';
    await transaction.save();

    // 4. Increment the book stock
    await Book.findByIdAndUpdate(bookId, { $inc: { availableCopies: 1 } });

    res.json({
      msg: 'Book returned successfully!',
      fineAmount: fine,
      transaction
    });

  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(400).json({ msg: 'Invalid book ID format.' });
    }
    res.status(500).send('Server Error');
  }
};

// Add other book-related controller functions here if needed
