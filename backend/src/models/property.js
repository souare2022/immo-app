const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Property = sequelize.define('Property', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  userId: {
    type: DataTypes.UUID,
    allowNull: false,
  },
  type: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      isIn: [['apartment', 'house', 'land', 'commercial', 'other']],
    },
  },
  title: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: false,
  },
  price: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
  },
  area: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
  },
  rooms: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  bathrooms: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  address: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  city: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  postalCode: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  latitude: {
    type: DataTypes.DECIMAL(10, 8),
    allowNull: false,
  },
  longitude: {
    type: DataTypes.DECIMAL(11, 8),
    allowNull: false,
  },
  features: {
    type: DataTypes.JSONB,
    defaultValue: [],
  },
  status: {
    type: DataTypes.STRING,
    allowNull: false,
    defaultValue: 'pending',
    validate: {
      isIn: [['pending', 'active', 'sold', 'archived']],
    },
  },
}, {
  tableName: 'properties',
  timestamps: true,
});

// Association will be set up in index.js model loader
// Property.belongsTo(User, { foreignKey: 'userId' });
// Property.hasMany(PropertyImage, { foreignKey: 'propertyId' });

module.exports = Property;
