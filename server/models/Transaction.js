const mongoose = require('mongoose');

const TransactionSchema = new mongoose.Schema({
  book: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Book',
    required: true
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  issueDate: {
    type: Date,
    default: Date.now
  },
  dueDate: {
    type: Date,
    required: true
  },
  returnDate: {
    type: Date
  },
  fineAmount: {
    type: Number,
    default: 0
  },
  currentFine: {
    type: Number,
    default: 0
  },
  status: {
    type: String,
    enum: ['requested', 'issued', 'returned', 'overdue', 'rejected'],
    default: 'requested'
  }
});

module.exports = mongoose.model('Transaction', TransactionSchema);