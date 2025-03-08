class Property {
  final String id;
  final String title;
  final String description;
  final double price;
  final double area;
  final int rooms;
  final int bathrooms;
  final String type;
  final Location location;
  final List<String> images;
  final List<String> features;
  final String ownerId;
  final String ownerName;
  final String ownerType;
  final DateTime createdAt;
  final DateTime updatedAt;

  Property({
    required this.id,
    required this.title,
    required this.description,
    required this.price,
    required this.area,
    required this.rooms,
    required this.bathrooms,
    required this.type,
    required this.location,
    required this.images,
    required this.features,
    required this.ownerId,
    required this.ownerName,
    required this.ownerType,
    required this.createdAt,
    required this.updatedAt,
  });

  factory Property.fromJson(Map<String, dynamic> json) {
    return Property(
      id: json['id'],
      title: json['title'],
      description: json['description'],
      price: json['price'].toDouble(),
      area: json['area'].toDouble(),
      rooms: json['rooms'],
      bathrooms: json['bathrooms'],
      type: json['type'],
      location: Location.fromJson(json['location']),
      images: List<String>.from(json['images']),
      features: List<String>.from(json['features']),
      ownerId: json['owner']['id'],
      ownerName: json['owner']['name'],
      ownerType: json['owner']['type'],
      createdAt: DateTime.parse(json['createdAt']),
      updatedAt: DateTime.parse(json['updatedAt']),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'title': title,
      'description': description,
      'price': price,
      'area': area,
      'rooms': rooms,
      'bathrooms': bathrooms,
      'type': type,
      'location': location.toJson(),
      'images': images,
      'features': features,
      'owner': {
        'id': ownerId,
        'name': ownerName,
        'type': ownerType,
      },
      'createdAt': createdAt.toIso8601String(),
      'updatedAt': updatedAt.toIso8601String(),
    };
  }
}

class Location {
  final String address;
  final String city;
  final String postalCode;
  final double latitude;
  final double longitude;

  Location({
    required this.address,
    required this.city,
    required this.postalCode,
    required this.latitude,
    required this.longitude,
  });

  factory Location.fromJson(Map<String, dynamic> json) {
    return Location(
      address: json['address'],
      city: json['city'],
      postalCode: json['postalCode'],
      latitude: json['coordinates']['lat'],
      longitude: json['coordinates']['lng'],
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'address': address,
      'city': city,
      'postalCode': postalCode,
      'coordinates': {
        'lat': latitude,
        'lng': longitude,
      },
    };
  }
}
