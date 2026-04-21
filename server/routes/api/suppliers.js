const express = require('express');
const router = express.Router();
const auth = require('../../middleware/auth');
const supplierController = require('../../controllers/supplierController');

// All supplier routes are protected
router.get('/', auth, supplierController.getSuppliers);
router.get('/:id', auth, supplierController.getSupplierById);
router.post('/', auth, supplierController.createSupplier);
router.put('/:id', auth, supplierController.updateSupplier);
router.delete('/:id', auth, supplierController.deleteSupplier);

module.exports = router;