const express = require('express');
const router = express.Router();
const auth = require('../../middleware/auth'); // Import the JWT auth middleware
const bookController = require('../../controllers/bookController');

// Route for searching books
router.get('/search', bookController.searchBooks);

// Route to request a book (Student/Staff)
router.post('/request/:bookId', auth, bookController.requestBook);

// Route to get all pending requests (Librarian only)
router.get('/requests/pending', auth, bookController.getPendingRequests);

// Route to get personal transaction history
router.get('/my-transactions', auth, bookController.getMyTransactions);

// Route to approve/reject a request (Librarian only)
router.put('/request/:requestId', auth, bookController.approveRequest);

// Route to issue a book (protected, requires student role)
// Example usage:
// POST /api/books/issue/book_id_here
router.post('/issue/:bookId', auth, (req, res, next) => {
  // Basic role check within the route handler before calling the controller
  // This is an extra layer of security, the controller also checks the role.
  if (req.user.role !== 'student') {
    return res.status(403).json({ msg: 'Access denied. Only students can issue books.' });
  }
  next();
}, bookController.issueBook);

// Route to return a book (protected, requires student role)
// Example usage:
// POST /api/books/return/book_id_here
router.post('/return/:bookId', auth, (req, res, next) => {
  if (req.user.role !== 'student') {
    return res.status(403).json({ msg: 'Access denied. Only students can return books.' });
  }
  next();
}, bookController.returnBook);

// Route to update book status (Damaged, Lost, Replaced) (Librarian only)
// Example usage:
// PUT /api/books/status/book_id_here
router.put('/status/:bookId', auth, (req, res, next) => {
  if (req.user.role !== 'librarian') {
    return res.status(403).json({ msg: 'Access denied. Only librarians can update book status.' });
  }
  next();
}, bookController.updateBookStatus);

module.exports = router;