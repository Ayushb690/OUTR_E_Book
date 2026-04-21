const express = require('express');
const router = express.Router();
const auth = require('../../middleware/auth'); // Import the JWT auth middleware
const purchaseOrderController = require('../../controllers/purchaseOrderController');

// Create Purchase Order (protected route, only librarians)
router.post('/', auth, purchaseOrderController.createPurchaseOrder);

// Get all Purchase Orders (protected route, librarians and staff)
router.get('/', auth, purchaseOrderController.getPurchaseOrders);

// Get Purchase Order by ID (protected route, librarians and staff)
router.get('/:id', auth, purchaseOrderController.getPurchaseOrderById);

// Update Purchase Order Status (protected route, only librarians)
router.put('/:id/status', auth, purchaseOrderController.updateOrderStatus);

module.exports = router;