import 'dart:convert';
import 'dart:io';
import 'package:dio/dio.dart';
import 'package:flutter/material.dart';
import 'package:flutter_dotenv/flutter_dotenv.dart';
import '../models/property.dart';

class PropertyService extends ChangeNotifier {
  final Dio _dio = Dio();
  final String _baseUrl = dotenv.env['API_URL'] ?? 'http://localhost:3000/api';
  
  String? _authToken;
  List<Property> _properties = [];
  List<Property> _favoriteProperties = [];
  
  // Getters
  List<Property> get properties => _properties;
  List<Property> get favoriteProperties => _favoriteProperties;
  
  // Setters
  set authToken(String? token) {
    _authToken = token;
    notifyListeners();
  }

  // Initialisation des en-têtes avec le token d'authentification
  Map<String, dynamic> get _headers {
    return {
      'Content-Type': 'application/json',
      'Authorization': _authToken != null ? 'Bearer $_authToken' : '',
    };
  }

  // Récupération de toutes les propriétés avec filtres
  Future<List<Property>> getProperties(Map<String, dynamic> filters) async {
    try {
      // Construction des paramètres de requête
      final queryParams = <String, dynamic>{};
      
      if (filters.containsKey('type') && filters['type'] != null) {
        queryParams['type'] = filters['type'];
      }
      
      if (filters.containsKey('minPrice') && filters['minPrice'] != null) {
        queryParams['minPrice'] = filters['minPrice'];
      }
      
      if (filters.containsKey('maxPrice') && filters['maxPrice'] != null) {
        queryParams['maxPrice'] = filters['maxPrice'];
      }
      
      if (filters.containsKey('minArea') && filters['minArea'] != null) {
        queryParams['minArea'] = filters['minArea'];
      }
      
      if (filters.containsKey('maxArea') && filters['maxArea'] != null) {
        queryParams['maxArea'] = filters['maxArea'];
      }
      
      if (filters.containsKey('location') && filters['location'] != null) {
        queryParams['location'] = filters['location'];
      }
      
      if (filters.containsKey('page') && filters['page'] != null) {
        queryParams['page'] = filters['page'];
      }
      
      if (filters.containsKey('limit') && filters['limit'] != null) {
        queryParams['limit'] = filters['limit'];
      }
      
      // Envoi de la requête
      final response = await _dio.get(
        '$_baseUrl/properties',
        queryParameters: queryParams,
        options: Options(headers: _headers),
      );
      
      if (response.statusCode == 200) {
        final data = response.data;
        final List<dynamic> propertiesData = data['properties'];
        
        _properties = propertiesData
            .map((propertyData) => Property.fromJson(propertyData))
            .toList();
        
        notifyListeners();
        return _properties;
      } else {
        throw Exception('Failed to load properties');
      }
    } catch (e) {
      throw Exception('Error fetching properties: $e');
    }
  }

  // Récupération d'une propriété par son ID
  Future<Property> getPropertyById(String id) async {
    try {
      final response = await _dio.get(
        '$_baseUrl/properties/$id',
        options: Options(headers: _headers),
      );
      
      if (response.statusCode == 200) {
        return Property.fromJson(response.data);
      } else {
        throw Exception('Failed to load property');
      }
    } catch (e) {
      throw Exception('Error fetching property: $e');
    }
  }

  // Création d'une nouvelle propriété
  Future<Map<String, dynamic>> createProperty(Map<String, dynamic> propertyData, List<File> images) async {
    try {
      // 1. Créer la propriété sans images
      final response = await _dio.post(
        '$_baseUrl/properties',
        data: json.encode(propertyData),
        options: Options(headers: _headers),
      );
      
      if (response.statusCode == 201) {
        final String propertyId = response.data['id'];
        
        // 2. Uploader les images si disponibles
        if (images.isNotEmpty) {
          await uploadPropertyImages(propertyId, images);
        }
        
        // 3. Récupérer la propriété mise à jour
        await getProperties({});
        
        return response.data;
      } else {
        throw Exception('Failed to create property');
      }
    } catch (e) {
      throw Exception('Error creating property: $e');
    }
  }

  // Upload des images pour une propriété
  Future<List<dynamic>> uploadPropertyImages(String propertyId, List<File> images) async {
    try {
      final formData = FormData();
      
      // Ajouter chaque image au FormData
      for (var i = 0; i < images.length; i++) {
        final file = images[i];
        final fileName = file.path.split('/').last;
        
        formData.files.add(
          MapEntry(
            'images',
            await MultipartFile.fromFile(
              file.path,
              filename: fileName,
            ),
          ),
        );
      }
      
      // Envoyer la requête d'upload
      final response = await _dio.post(
        '$_baseUrl/properties/$propertyId/images',
        data: formData,
        options: Options(
          headers: {
            'Authorization': _authToken != null ? 'Bearer $_authToken' : '',
            'Content-Type': 'multipart/form-data',
          },
        ),
      );
      
      if (response.statusCode == 201) {
        return response.data['images'];
      } else {
        throw Exception('Failed to upload images');
      }
    } catch (e) {
      throw Exception('Error uploading images: $e');
    }
  }

  // Mise à jour d'une propriété
  Future<Map<String, dynamic>> updateProperty(String id, Map<String, dynamic> propertyData) async {
    try {
      final response = await _dio.put(
        '$_baseUrl/properties/$id',
        data: json.encode(propertyData),
        options: Options(headers: _headers),
      );
      
      if (response.statusCode == 200) {
        // Mettre à jour la liste des propriétés
        await getProperties({});
        return response.data;
      } else {
        throw Exception('Failed to update property');
      }
    } catch (e) {
      throw Exception('Error updating property: $e');
    }
  }

  // Suppression d'une propriété
  Future<void> deleteProperty(String id) async {
    try {
      final response = await _dio.delete(
        '$_baseUrl/properties/$id',
        options: Options(headers: _headers),
      );
      
      if (response.statusCode == 200) {
        // Mettre à jour la liste des propriétés
        _properties.removeWhere((property) => property.id == id);
        _favoriteProperties.removeWhere((property) => property.id == id);
        notifyListeners();
      } else {
        throw Exception('Failed to delete property');
      }
    } catch (e) {
      throw Exception('Error deleting property: $e');
    }
  }

  // Ajouter/retirer une propriété aux favoris
  Future<void> toggleFavorite(Property property) async {
    try {
      if (_authToken == null) {
        throw Exception('User must be logged in to add favorites');
      }
      
      final isFavorite = _favoriteProperties.any((p) => p.id == property.id);
      
      if (isFavorite) {
        // Retirer des favoris
        await _dio.delete(
          '$_baseUrl/users/favorites/${property.id}',
          options: Options(headers: _headers),
        );
        
        _favoriteProperties.removeWhere((p) => p.id == property.id);
      } else {
        // Ajouter aux favoris
        await _dio.post(
          '$_baseUrl/users/favorites',
          data: json.encode({'propertyId': property.id}),
          options: Options(headers: _headers),
        );
        
        _favoriteProperties.add(property);
      }
      
      notifyListeners();
    } catch (e) {
      throw Exception('Error toggling favorite: $e');
    }
  }

  // Récupérer les propriétés favorites de l'utilisateur
  Future<List<Property>> getFavoriteProperties() async {
    try {
      if (_authToken == null) {
        return [];
      }
      
      final response = await _dio.get(
        '$_baseUrl/users/favorites',
        options: Options(headers: _headers),
      );
      
      if (response.statusCode == 200) {
        final List<dynamic> favoritesData = response.data;
        
        _favoriteProperties = favoritesData
            .map((favoriteData) => Property.fromJson(favoriteData['property']))
            .toList();
        
        notifyListeners();
        return _favoriteProperties;
      } else {
        throw Exception('Failed to load favorite properties');
      }
    } catch (e) {
      throw Exception('Error fetching favorite properties: $e');
    }
  }
}
