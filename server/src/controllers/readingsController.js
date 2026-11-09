const { query } = require('../config/db');
const { isValidDateString, isFutureDate } = require('../utils/dateUtils');

const VALID_SLOTS = [
  'Morning (fasting)',
  'After breakfast',
  'After lunch',
  'After dinner',
];

function getSlotArticle(slot) {
  return /^[aeiou]/i.test(slot) ? 'an' : 'a';
}

function validateReadingPayload({ date, time_slot, value }) {
  // 1. Value required check
  if (value === undefined || value === null || value === '') {
    return 'Please enter a glucose value.';
  }

  // 2. Whole number between 40 and 600 check
  const numValue = Number(value);
  if (!Number.isInteger(numValue) || numValue < 40 || numValue > 600) {
    return 'Value must be between 40 and 600 mg/dl.';
  }

  // 3. Date format check
  if (!date || !isValidDateString(date)) {
    return 'Please enter a valid date in YYYY-MM-DD format.';
  }

  // 4. Future date check
  if (isFutureDate(date)) {
    return 'Date cannot be in the future.';
  }

  // 5. Time slot check
  if (!time_slot || !VALID_SLOTS.includes(time_slot)) {
    return `Please select a valid time slot (${VALID_SLOTS.join(', ')}).`;
  }

  return null;
}

// GET /api/readings with pagination & optional date filtering
async function getReadings(req, res, next) {
  try {
    const userId = req.user.id;
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limitParam = req.query.limit;
    const isAll = limitParam === 'all';
    const limit = isAll ? 1000 : Math.min(100, Math.max(1, parseInt(limitParam, 10) || 20));
    const offset = isAll ? 0 : (page - 1) * limit;

    const { date, startDate, endDate, slot } = req.query;

    let whereClause = 'WHERE user_id = $1';
    const params = [userId];
    let paramIndex = 2;

    if (date) {
      whereClause += ` AND date = $${paramIndex}`;
      params.push(date);
      paramIndex++;
    }

    if (startDate) {
      whereClause += ` AND date >= $${paramIndex}`;
      params.push(startDate);
      paramIndex++;
    }

    if (endDate) {
      whereClause += ` AND date <= $${paramIndex}`;
      params.push(endDate);
      paramIndex++;
    }

    if (slot && VALID_SLOTS.includes(slot)) {
      whereClause += ` AND time_slot = $${paramIndex}`;
      params.push(slot);
      paramIndex++;
    }

    // Count total matching
    const countResult = await query(
      `SELECT COUNT(*) as total FROM readings ${whereClause}`,
      params
    );
    const total = parseInt(countResult.rows[0].total, 10) || 0;

    // Fetch items
    const queryText = `
      SELECT id, user_id, TO_CHAR(date, 'YYYY-MM-DD') AS date, time_slot, value, created_at, updated_at
      FROM readings
      ${whereClause}
      ORDER BY date DESC,
        CASE time_slot
          WHEN 'Morning (fasting)' THEN 1
          WHEN 'After breakfast' THEN 2
          WHEN 'After lunch' THEN 3
          WHEN 'After dinner' THEN 4
          ELSE 5
        END ASC
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `;

    const itemsResult = await query(queryText, [...params, limit, offset]);

    res.status(200).json({
      readings: itemsResult.rows,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit) || 1,
      },
    });
  } catch (error) {
    next(error);
  }
}

// GET /api/readings/:id
async function getReadingById(req, res, next) {
  try {
    const userId = req.user.id;
    const id = parseInt(req.params.id, 10);

    const result = await query(
      `SELECT id, user_id, TO_CHAR(date, 'YYYY-MM-DD') AS date, time_slot, value, created_at, updated_at
       FROM readings WHERE id = $1 AND user_id = $2`,
      [id, userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Reading not found.' });
    }

    res.status(200).json({ reading: result.rows[0] });
  } catch (error) {
    next(error);
  }
}

// POST /api/readings
async function createReading(req, res, next) {
  try {
    const userId = req.user.id;
    const { date, time_slot, value } = req.body;

    const validationError = validateReadingPayload({ date, time_slot, value });
    if (validationError) {
      return res.status(400).json({ message: validationError });
    }

    const intValue = parseInt(value, 10);

    // Rule: Only one reading per slot per day
    const slotRes = await query(
      'SELECT id FROM readings WHERE user_id = $1 AND date = $2 AND time_slot = $3',
      [userId, date, time_slot]
    );
    if (slotRes.rows.length > 0) {
      const article = getSlotArticle(time_slot);
      return res.status(400).json({
        message: `You already have ${article} ${time_slot} reading for this date.`,
      });
    }

    // Rule: Maximum 4 readings per day
    const countRes = await query(
      'SELECT COUNT(*) as count FROM readings WHERE user_id = $1 AND date = $2',
      [userId, date]
    );
    const dayCount = parseInt(countRes.rows[0].count, 10) || 0;
    if (dayCount >= 4) {
      return res.status(400).json({ message: 'You can add only 4 readings per day.' });
    }

    const insertRes = await query(
      `INSERT INTO readings (user_id, date, time_slot, value)
       VALUES ($1, $2, $3, $4)
       RETURNING id, user_id, TO_CHAR(date, 'YYYY-MM-DD') AS date, time_slot, value, created_at, updated_at`,
      [userId, date, time_slot, intValue]
    );

    res.status(201).json({
      message: 'Reading added successfully.',
      reading: insertRes.rows[0],
    });
  } catch (error) {
    // Catch unique constraint violation as safety net
    if (error.code === '23505') {
      const article = getSlotArticle(req.body.time_slot || 'slot');
      return res.status(400).json({
        message: `You already have ${article} ${req.body.time_slot} reading for this date.`,
      });
    }
    next(error);
  }
}

// PUT /api/readings/:id
async function updateReading(req, res, next) {
  try {
    const userId = req.user.id;
    const id = parseInt(req.params.id, 10);
    const { date, time_slot, value } = req.body;

    // Check reading exists & belongs to user
    const existingRes = await query(
      `SELECT id, user_id, TO_CHAR(date, 'YYYY-MM-DD') AS date, time_slot, value
       FROM readings WHERE id = $1 AND user_id = $2`,
      [id, userId]
    );

    if (existingRes.rows.length === 0) {
      return res.status(404).json({ message: 'Reading not found.' });
    }

    const currentReading = existingRes.rows[0];
    const newDate = date || currentReading.date;
    const newSlot = time_slot || currentReading.time_slot;
    const newValue = value !== undefined ? value : currentReading.value;

    const validationError = validateReadingPayload({
      date: newDate,
      time_slot: newSlot,
      value: newValue,
    });
    if (validationError) {
      return res.status(400).json({ message: validationError });
    }

    const intValue = parseInt(newValue, 10);

    // If date changed, check max 4 readings on new date
    if (newDate !== currentReading.date) {
      const countRes = await query(
        'SELECT COUNT(*) as count FROM readings WHERE user_id = $1 AND date = $2',
        [userId, newDate]
      );
      const dayCount = parseInt(countRes.rows[0].count, 10) || 0;
      if (dayCount >= 4) {
        return res.status(400).json({ message: 'You can add only 4 readings per day.' });
      }
    }

    // Check slot uniqueness on target date (excluding self)
    const slotRes = await query(
      'SELECT id FROM readings WHERE user_id = $1 AND date = $2 AND time_slot = $3 AND id != $4',
      [userId, newDate, newSlot, id]
    );
    if (slotRes.rows.length > 0) {
      const article = getSlotArticle(newSlot);
      return res.status(400).json({
        message: `You already have ${article} ${newSlot} reading for this date.`,
      });
    }

    const updateRes = await query(
      `UPDATE readings
       SET date = $1, time_slot = $2, value = $3, updated_at = CURRENT_TIMESTAMP
       WHERE id = $4 AND user_id = $5
       RETURNING id, user_id, TO_CHAR(date, 'YYYY-MM-DD') AS date, time_slot, value, created_at, updated_at`,
      [newDate, newSlot, intValue, id, userId]
    );

    res.status(200).json({
      message: 'Reading updated successfully.',
      reading: updateRes.rows[0],
    });
  } catch (error) {
    if (error.code === '23505') {
      const article = getSlotArticle(req.body.time_slot || 'slot');
      return res.status(400).json({
        message: `You already have ${article} ${req.body.time_slot} reading for this date.`,
      });
    }
    next(error);
  }
}

// DELETE /api/readings/:id
async function deleteReading(req, res, next) {
  try {
    const userId = req.user.id;
    const id = parseInt(req.params.id, 10);

    const deleteRes = await query(
      'DELETE FROM readings WHERE id = $1 AND user_id = $2 RETURNING id',
      [id, userId]
    );

    if (deleteRes.rows.length === 0) {
      return res.status(404).json({ message: 'Reading not found.' });
    }

    res.status(200).json({ message: 'Reading deleted successfully.', id });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  VALID_SLOTS,
  getReadings,
  getReadingById,
  createReading,
  updateReading,
  deleteReading,
};
