const Supplier = require('../models/Supplier');

// @desc    Get all suppliers
// @route   GET /api/suppliers
// @access  Private (Librarian/Staff)
exports.getSuppliers = async (req, res) => {
  try {
    const suppliers = await Supplier.find().sort({ dateAdded: -1 });
    res.json(suppliers);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
};

// @desc    Get supplier by ID
// @route   GET /api/suppliers/:id
// @access  Private (Librarian/Staff)
exports.getSupplierById = async (req, res) => {
  try {
    const supplier = await Supplier.findById(req.params.id);
    if (!supplier) return res.status(404).json({ msg: 'Supplier not found' });
    res.json(supplier);
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') return res.status(404).json({ msg: 'Supplier not found' });
    res.status(500).send('Server Error');
  }
};

// @desc    Create a supplier
// @route   POST /api/suppliers
// @access  Private (Librarian)
exports.createSupplier = async (req, res) => {
  const { name, contactPerson, email, phone, address } = req.body;
  try {
    let supplier = await Supplier.findOne({ name });
    if (supplier) return res.status(400).json({ msg: 'Supplier already exists' });

    supplier = new Supplier({ name, contactPerson, email, phone, address });
    await supplier.save();
    res.json(supplier);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
};

// @desc    Update supplier
// @route   PUT /api/suppliers/:id
// @access  Private (Librarian)
exports.updateSupplier = async (req, res) => {
  const { name, contactPerson, email, phone, address } = req.body;
  const supplierFields = { name, contactPerson, email, phone, address };

  try {
    let supplier = await Supplier.findById(req.params.id);
    if (!supplier) return res.status(404).json({ msg: 'Supplier not found' });

    supplier = await Supplier.findByIdAndUpdate(
      req.params.id,
      { $set: supplierFields },
      { new: true }
    );
    res.json(supplier);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
};

// @desc    Delete supplier
// @route   DELETE /api/suppliers/:id
// @access  Private (Librarian)
exports.deleteSupplier = async (req, res) => {
  try {
    const supplier = await Supplier.findById(req.params.id);
    if (!supplier) return res.status(404).json({ msg: 'Supplier not found' });

    await Supplier.findByIdAndDelete(req.params.id);
    res.json({ msg: 'Supplier removed' });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
};