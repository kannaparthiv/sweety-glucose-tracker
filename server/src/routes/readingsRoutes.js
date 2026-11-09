const express = require('express');
const router = express.Router();
const readingsController = require('../controllers/readingsController');
const authMiddleware = require('../middleware/authMiddleware');

router.use(authMiddleware);

router.get('/', readingsController.getReadings);
router.post('/', readingsController.createReading);
router.get('/:id', readingsController.getReadingById);
router.put('/:id', readingsController.updateReading);
router.delete('/:id', readingsController.deleteReading);

module.exports = router;
