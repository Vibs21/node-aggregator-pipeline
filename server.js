const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');

const MONGO_URI =
  'mongodb+srv://vaibhav:connect%4012345@cluster0.kqnkd.mongodb.net/store';

mongoose
  .connect(MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log('Connected to MongoDB Atlas! 🚀'))
  .catch((err) => console.error('MongoDB connection error:', err));

const salesSchema = new mongoose.Schema({
  date: Date,
  store: String,
  items: [
    {
      name: String,
      quantity: Number,
      price: Number,
    },
  ],
});

const Sales = mongoose.model('sales', salesSchema);

const app = express();
app.use(bodyParser.json());

// api to get all the records
app.get('/api/sales', async (req, res) => {
  try {
    const allSales = await Sales.find();
    res.json(allSales);
  } catch (err) {
    console.error('error:', err);
    res.status(500).send('Internal Server Error');
  }
});

//aggregate-api
app.get('/api/aggregatedSales', async (req, res) => {
  try {
    const aggregatedData = await Sales.aggregate([
      {
        $unwind: '$items',
      },
      {
        $group: {
          _id: {
            store: '$store',
            month: { $dateToString: { format: '%Y-%m', date: '$date' } },
          },
          totalRevenue: {
            $sum: { $multiply: ['$items.quantity', '$items.price'] },
          },
          averagePrice: { $avg: '$items.price' },
        },
      },
      {
        $project: {
          _id: 0,
          store: '$_id.store',
          month: '$_id.month',
          totalRevenue: 1,
          averagePrice: 1,
        },
      },
      {
        $sort: { store: 1, month: 1 },
      },
    ]);

    res.json(aggregatedData);
  } catch (err) {
    console.error('error:', err);
    res.status(500).send('Internal Server Error');
  }
});

app.listen(3000, () => {
  console.log(`Server started at`);
});
