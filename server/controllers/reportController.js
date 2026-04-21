const Transaction = require('../models/Transaction');
const Book = require('../models/Book');
const PurchaseOrder = require('../models/PurchaseOrder');

// 1. Get Overdue List
exports.getOverdueList = async (req, res) => {
  try {
    const overdueList = await Transaction.aggregate([
      { $match: { status: 'overdue' } },
      {
        $lookup: {
          from: 'users',
          localField: 'user',
          foreignField: '_id',
          as: 'studentInfo'
        }
      },
      { $unwind: '$studentInfo' },
      {
        $project: {
          'studentInfo.name': 1,
          'studentInfo.email': 1,
          dueDate: 1,
          currentFine: 1
        }
      }
    ]);
    res.json(overdueList);
  } catch (err) {
    res.status(500).send('Server Error');
  }
};

// 2. Get Stock Summary
exports.getStockSummary = async (req, res) => {
  try {
    const summary = await Book.aggregate([
      { $unwind: '$genre' },
      {
        $group: {
          _id: '$genre',
          totalStock: { $sum: '$totalCopies' },
          availableStock: { $sum: '$availableCopies' }
        }
      }
    ]);
    res.json(summary);
  } catch (err) {
    res.status(500).send('Server Error');
  }
};

// 3. Get Purchase History
exports.getPurchaseHistory = async (req, res) => {
  try {
    const history = await PurchaseOrder.aggregate([
      { $match: { status: 'received' } },
      {
        $group: {
          _id: '$supplier',
          totalSpent: { $sum: '$totalAmount' },
          orderCount: { $sum: 1 }
        }
      },
      {
        $lookup: {
          from: 'suppliers',
          localField: '_id',
          foreignField: '_id',
          as: 'supplierInfo'
        }
      },
      { $unwind: '$supplierInfo' }
    ]);
    res.json(history);
  } catch (err) {
    res.status(500).send('Server Error');
  }
};