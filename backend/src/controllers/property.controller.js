const { validationResult } = require('express-validator');
const Property = require('../models/property');
const PropertyImage = require('../models/propertyImage');
const mongoose = require('mongoose');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { Op } = require('sequelize');

// Configuration de multer pour l'upload de fichiers
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = 'uploads/properties';
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}_${path.basename(file.originalname)}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // Limite de 5MB
  fileFilter: (req, file, cb) => {
    const filetypes = /jpeg|jpg|png|webp/;
    const mimetype = filetypes.test(file.mimetype);
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
    
    if (mimetype && extname) {
      return cb(null, true);
    }
    cb(new Error('Formats d\'image autorisés: jpeg, jpg, png, webp'));
  },
}).array('images', 10); // Maximum 10 images

/**
 * @desc Get all properties with filters
 * @route GET /api/properties
 * @access Public
 */
exports.getAllProperties = async (req, res) => {
  try {
    const {
      type,
      minPrice,
      maxPrice,
      minArea,
      maxArea,
      location,
      page = 1,
      limit = 20,
    } = req.query;

    // Construire les conditions de filtrage
    const filters = {};
    
    if (type) {
      filters.type = type;
    }
    
    if (minPrice || maxPrice) {
      filters.price = {};
      if (minPrice) filters.price[Op.gte] = parseFloat(minPrice);
      if (maxPrice) filters.price[Op.lte] = parseFloat(maxPrice);
    }
    
    if (minArea || maxArea) {
      filters.area = {};
      if (minArea) filters.area[Op.gte] = parseFloat(minArea);
      if (maxArea) filters.area[Op.lte] = parseFloat(maxArea);
    }
    
    if (location) {
      filters[Op.or] = [
        { city: { [Op.iLike]: `%${location}%` } },
        { postalCode: { [Op.iLike]: `%${location}%` } },
        { address: { [Op.iLike]: `%${location}%` } },
      ];
    }
    
    // Statut actif uniquement
    filters.status = 'active';

    // Pagination
    const pageNumber = parseInt(page, 10);
    const limitNumber = parseInt(limit, 10);
    const offset = (pageNumber - 1) * limitNumber;

    // Récupérer les propriétés
    const { count, rows: properties } = await Property.findAndCountAll({
      where: filters,
      limit: limitNumber,
      offset,
      order: [['createdAt', 'DESC']],
      include: [
        {
          model: PropertyImage,
          as: 'images',
          attributes: ['id', 'url'],
        },
      ],
    });

    // Formater la réponse
    res.json({
      total: count,
      page: pageNumber,
      limit: limitNumber,
      properties,
    });
  } catch (error) {
    console.error('Error fetching properties:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

/**
 * @desc Get a property by ID
 * @route GET /api/properties/:id
 * @access Public
 */
exports.getPropertyById = async (req, res) => {
  try {
    const { id } = req.params;

    const property = await Property.findByPk(id, {
      include: [
        {
          model: PropertyImage,
          as: 'images',
          attributes: ['id', 'url'],
        },
      ],
    });

    if (!property) {
      return res.status(404).json({ message: 'Property not found' });
    }

    res.json(property);
  } catch (error) {
    console.error('Error fetching property:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

/**
 * @desc Create a new property
 * @route POST /api/properties
 * @access Private
 */
exports.createProperty = async (req, res) => {
  try {
    // Validation des entrées
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    // Créer la propriété
    const property = await Property.create({
      ...req.body,
      userId: req.user.id,
      status: 'pending', // Les propriétés sont en attente de validation par défaut
    });

    res.status(201).json({
      id: property.id,
      status: property.status,
      message: 'Votre annonce a été créée et est en attente de validation.',
    });
  } catch (error) {
    console.error('Error creating property:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

/**
 * @desc Update a property
 * @route PUT /api/properties/:id
 * @access Private
 */
exports.updateProperty = async (req, res) => {
  try {
    const { id } = req.params;

    // Validation des entrées
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    // Vérifier si la propriété existe et appartient à l'utilisateur
    const property = await Property.findByPk(id);

    if (!property) {
      return res.status(404).json({ message: 'Property not found' });
    }

    // Vérifier si l'utilisateur est le propriétaire
    if (property.userId !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized' });
    }

    // Mise à jour de la propriété
    await property.update({
      ...req.body,
      status: 'pending', // Retour en attente de validation après modification
    });

    res.json({
      id: property.id,
      status: property.status,
      message: 'Votre annonce a été mise à jour et est en attente de validation.',
    });
  } catch (error) {
    console.error('Error updating property:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

/**
 * @desc Delete a property
 * @route DELETE /api/properties/:id
 * @access Private
 */
exports.deleteProperty = async (req, res) => {
  try {
    const { id } = req.params;

    // Vérifier si la propriété existe et appartient à l'utilisateur
    const property = await Property.findByPk(id);

    if (!property) {
      return res.status(404).json({ message: 'Property not found' });
    }

    // Vérifier si l'utilisateur est le propriétaire
    if (property.userId !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized' });
    }

    // Supprimer les images associées
    await PropertyImage.destroy({ where: { propertyId: id } });

    // Supprimer la propriété
    await property.destroy();

    res.json({ message: 'Property deleted successfully' });
  } catch (error) {
    console.error('Error deleting property:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

/**
 * @desc Upload images for a property
 * @route POST /api/properties/:id/images
 * @access Private
 */
exports.uploadPropertyImages = async (req, res) => {
  try {
    const { id } = req.params;

    // Vérifier si la propriété existe et appartient à l'utilisateur
    const property = await Property.findByPk(id);

    if (!property) {
      return res.status(404).json({ message: 'Property not found' });
    }

    // Vérifier si l'utilisateur est le propriétaire
    if (property.userId !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized' });
    }

    // Upload des images
    upload(req, res, async (err) => {
      if (err) {
        return res.status(400).json({ message: err.message });
      }

      if (!req.files || req.files.length === 0) {
        return res.status(400).json({ message: 'No images uploaded' });
      }

      // Enregistrer les informations des images dans la base de données
      const imagePromises = req.files.map((file, index) => {
        return PropertyImage.create({
          propertyId: id,
          url: `/uploads/properties/${file.filename}`,
          order: index,
        });
      });

      const images = await Promise.all(imagePromises);

      res.status(201).json({
        message: 'Images uploaded successfully',
        images: images.map(img => ({ id: img.id, url: img.url })),
      });
    });
  } catch (error) {
    console.error('Error uploading images:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

/**
 * @desc Delete an image from a property
 * @route DELETE /api/properties/:id/images/:imageId
 * @access Private
 */
exports.deletePropertyImage = async (req, res) => {
  try {
    const { id, imageId } = req.params;

    // Vérifier si la propriété existe et appartient à l'utilisateur
    const property = await Property.findByPk(id);

    if (!property) {
      return res.status(404).json({ message: 'Property not found' });
    }

    // Vérifier si l'utilisateur est le propriétaire
    if (property.userId !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized' });
    }

    // Vérifier si l'image existe et appartient à la propriété
    const image = await PropertyImage.findOne({
      where: { id: imageId, propertyId: id },
    });

    if (!image) {
      return res.status(404).json({ message: 'Image not found' });
    }

    // Supprimer le fichier image
    const filePath = path.join(__dirname, '..', '..', image.url);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    // Supprimer l'entrée dans la base de données
    await image.destroy();

    res.json({ message: 'Image deleted successfully' });
  } catch (error) {
    console.error('Error deleting image:', error);
    res.status(500).json({ message: 'Server error' });
  }
};
