const cron = require('node-cron');
const Transaction = require('../models/Transaction');

const initCronJobs = () => {
  // Run every midnight (00:00)
  cron.schedule('0 0 * * *', async () => {
    console.log('Running Midnight Fine Calculation Job...');
    
    try {
      const today = new Date();
      
      // Find all transactions that are 'issued' or 'overdue' and past due date
      const transactions = await Transaction.find({
        status: { $in: ['issued', 'overdue'] },
        dueDate: { $lt: today }
      });

      for (const transaction of transactions) {
        const dueDate = new Date(transaction.dueDate);
        const diffTime = Math.abs(today - dueDate);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        const fine = diffDays * 50;

        transaction.currentFine = fine;
        transaction.status = 'overdue'; // Automatically mark as overdue if past due date
        await transaction.save();
      }

      console.log(`Updated fines for ${transactions.length} transactions.`);
    } catch (err) {
      console.error('Error in fine calculation cron job:', err.message);
    }
  });
};

module.exports = initCronJobs;