const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const compression = require('compression');
const { testConnection } = require('./config/database');
require('dotenv').config();

// Initialisation de l'application Express
const app = express();
const PORT = process.env.PORT || 3000;

// Middlewares
app.use(helmet()); // Sécurité
app.use(cors()); // Gestion des CORS
app.use(express.json()); // Parsing du JSON
app.use(express.urlencoded({ extended: true })); // Parsing des formulaires
app.use(compression()); // Compression des réponses
app.use(morgan('dev')); // Logs de développement

// Routes de base
app.get('/', (req, res) => {
  res.json({ message: 'ImmoApp API is running' });
});

// Importation des routes
const propertyRoutes = require('./routes/property.routes');
const userRoutes = require('./routes/user.routes');
const authRoutes = require('./routes/auth.routes');
const estimationRoutes = require('./routes/estimation.routes');
const messageRoutes = require('./routes/message.routes');

// Enregistrement des routes
app.use('/api/properties', propertyRoutes);
app.use('/api/users', userRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/estimation', estimationRoutes);
app.use('/api/messages', messageRoutes);

// Gestion des erreurs 404
app.use((req, res, next) => {
  res.status(404).json({ message: 'Route not found' });
});

// Gestion des erreurs globales
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    message: 'Internal Server Error',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// Démarrage du serveur
const startServer = async () => {
  try {
    // Test de la connexion à la base de données
    const dbConnected = await testConnection();
    
    if (!dbConnected) {
      console.error('Could not connect to the database. Exiting...');
      process.exit(1);
    }
    
    // Démarrage du serveur
    app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
    });
  } catch (error) {
    console.error('Error starting server:', error);
    process.exit(1);
  }
};

// Lancer le serveur
startServer();

// Exportation pour les tests
module.exports = app;
