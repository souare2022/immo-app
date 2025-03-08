const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const propertyController = require('../controllers/property.controller');
const authMiddleware = require('../middlewares/auth.middleware');

// Middleware de validation pour la création/mise à jour d'une propriété
const validateProperty = [
  body('type').isIn(['apartment', 'house', 'land', 'commercial', 'other']),
  body('title').isString().isLength({ min: 5, max: 100 }),
  body('description').isString().isLength({ min: 10 }),
  body('price').isFloat({ min: 0 }),
  body('area').isFloat({ min: 0 }),
  body('rooms').isInt({ min: 0 }),
  body('bathrooms').isInt({ min: 0 }),
  body('address').isString(),
  body('city').isString(),
  body('postalCode').isString(),
  body('latitude').isFloat(),
  body('longitude').isFloat(),
  body('features').isArray()
];

/**
 * @route GET /api/properties
 * @desc Get all properties with filters
 * @access Public
 */
router.get('/', propertyController.getAllProperties);

/**
 * @route GET /api/properties/:id
 * @desc Get a property by ID
 * @access Public
 */
router.get('/:id', propertyController.getPropertyById);

/**
 * @route POST /api/properties
 * @desc Create a new property
 * @access Private
 */
router.post('/', authMiddleware, validateProperty, propertyController.createProperty);

/**
 * @route PUT /api/properties/:id
 * @desc Update a property
 * @access Private
 */
router.put('/:id', authMiddleware, validateProperty, propertyController.updateProperty);

/**
 * @route DELETE /api/properties/:id
 * @desc Delete a property
 * @access Private
 */
router.delete('/:id', authMiddleware, propertyController.deleteProperty);

/**
 * @route POST /api/properties/:id/images
 * @desc Upload images for a property
 * @access Private
 */
router.post('/:id/images', authMiddleware, propertyController.uploadPropertyImages);

/**
 * @route DELETE /api/properties/:id/images/:imageId
 * @desc Delete an image from a property
 * @access Private
 */
router.delete('/:id/images/:imageId', authMiddleware, propertyController.deletePropertyImage);

module.exports = router;
