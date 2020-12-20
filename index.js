const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const cors = require('cors');

const Review = mongoose.model(
  'Review',
  mongoose.Schema({
    formatted_address: { type: String, required: true },
    review_text: { type: String, required: true },
    floor: { type: Number, required: true },
    unit_number: { type: String, required: true },
    lat: { type: Number, required: true },
    lng: { type: Number, required: true },
  }),
);

mongoose.connect(process.env.DB, {
  useNewUrlParser: true,
  useCreateIndex: true,
  useUnifiedTopology: true,
});
const app = express();

app.use(
  cors({
    origin:
      process.env.NODE_ENV === 'production'
        ? 'https://ismylandlordnice.com'
        : '*',
  }),
);
app.use(bodyParser.json());

async function createReview(req, res, next) {
  try {
    const missingFields = [
      'formatted_address',
      'review_text',
      'floor',
      'unit_number',
      'lat',
      'lng',
    ].filter((k) => !req.body[k]);
    if (missingFields.length > 0) {
      return res
        .status(400)
        .json({ message: `Missing ${missingFields} in your input!` });
    }

    const r = new Review({
      formatted_address: req.body.formatted_address,
      review_text: req.body.review_text,
      floor: req.body.floor,
      unit_number: req.body.unit_number,
      lat: req.body.lat,
      lng: req.body.lng,
    });
    const review = await r.save();
    res.status(201).json(review);
  } catch (e) {
    console.error(e);
    res.status(500).json({
      message:
        'There is something wrong with the server! Please try again later!',
    });
  }
}

async function getReviews(req, res, next) {
  try {
    const missingFields = ['lat', 'lng'].filter((k) => !req.query[k]);
    if (missingFields.length > 0) {
      return res
        .status(400)
        .json({ message: `Missing ${missingFields} in your input!` });
    }
    const lat = parseFloat(req.query.lat);
    const lng = parseFloat(req.query.lng);
    const reviews = await Review.find({
      lat: { $lte: lat + 0.001, $gte: lat - 0.001 },
      lng: { $lte: lng + 0.001, $gte: lng - 0.001 },
    }).exec();
    res.status(200).json(reviews);
  } catch (e) {
    console.error(e);
    res.status(500).json({
      message:
        'There is something wrong with the server! Please try again later!',
    });
  }
}

const router = express.Router();
router.post('/reviews', createReview);
router.get('/reviews', getReviews);

app.use('/api', router);
app.listen(process.env.PORT, (err) => {
  if (err) throw err;
  console.log('UP AND RUNNING @', process.env.PORT);
});
