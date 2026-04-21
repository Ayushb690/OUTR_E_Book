const PurchaseOrder = require('../models/PurchaseOrder');
const Book = require('../models/Book');

// @desc    Create a new purchase order
exports.createPurchaseOrder = async (req, res) => {
  const { orderNumber, supplier, items, expectedDeliveryDate, totalAmount } = req.body;
  try {
    if (req.user.role !== 'librarian') {
      return res.status(403).json({ msg: 'Librarian access required' });
    }

    let order = await PurchaseOrder.findOne({ orderNumber });
    if (order) return res.status(400).json({ msg: 'Order number already exists' });

    const newPurchaseOrder = new PurchaseOrder({
      orderNumber,
      supplier,
      items,
      expectedDeliveryDate,
      totalAmount
    });

    await newPurchaseOrder.save();
    res.status(201).json(newPurchaseOrder);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
};

// @desc    Update Purchase Order Status (e.g., mark as RECEIVED)
// @route   PUT /api/purchase-orders/:id/status
// @access  Private (Librarian)
exports.updateOrderStatus = async (req, res) => {
  const { status } = req.body;

  try {
    if (req.user.role !== 'librarian') {
      return res.status(403).json({ msg: 'Librarian access required' });
    }

    let order = await PurchaseOrder.findById(req.params.id);
    if (!order) return res.status(404).json({ msg: 'Order not found' });

    // If already received, don't process again
    if (order.status === 'received') {
      return res.status(400).json({ msg: 'Order already marked as received' });
    }

    // Logic for 'RECEIVED'
    if (status === 'received') {
      for (const item of order.items) {
        await Book.findByIdAndUpdate(item.book, {
          $inc: { 
            totalCopies: item.quantity, 
            availableCopies: item.quantity 
          }
        });
      }
      order.deliveryDate = Date.now();
    }

    order.status = status;
    await order.save();

    res.json(order);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
};

exports.getPurchaseOrders = async (req, res) => {
  try {
    const orders = await PurchaseOrder.find().populate('supplier', 'name').populate('items.book', 'title');
    res.json(orders);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
};

exports.getPurchaseOrderById = async (req, res) => {
  try {
    const order = await PurchaseOrder.findById(req.params.id).populate('supplier', 'name').populate('items.book', 'title');
    if (!order) return res.status(404).json({ msg: 'Order not found' });
    res.json(order);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
};