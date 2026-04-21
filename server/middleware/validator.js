const { body, validationResult } = require('express-validator');

// Validation result middleware
const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  next();
};

const bookValidation = [
  body('isbn').matches(/^(?=(?:\D*\d){10}(?:(?:\D*\d){3})?$)[\d-]+$/).withMessage('Invalid ISBN format'),
  body('totalCopies').isInt({ min: 0 }).withMessage('Stock cannot be negative')
];

module.exports = { validate, bookValidation };