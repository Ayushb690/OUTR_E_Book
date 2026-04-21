const express = require('express');
const router = express.Router();
const auth = require('../../middleware/auth');
const reportController = require('../../controllers/reportController');

// All reports are Librarian/Staff accessible
router.get('/overdue', auth, reportController.getOverdueList);
router.get('/stock-summary', auth, reportController.getStockSummary);
router.get('/purchase-history', auth, reportController.getPurchaseHistory);

module.exports = router;