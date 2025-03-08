import 'package:flutter/material.dart';
import 'package:flutter_map/flutter_map.dart';
import 'package:latlong2/latlong.dart';
import 'package:provider/provider.dart';
import '../models/property.dart';
import '../services/property_service.dart';
import '../widgets/property_card.dart';
import '../widgets/search_filter_bar.dart';

class HomeScreen extends StatefulWidget {
  const HomeScreen({Key? key}) : super(key: key);

  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> with SingleTickerProviderStateMixin {
  late TabController _tabController;
  bool _isLoading = true;
  List<Property> _properties = [];
  Map<String, dynamic> _filters = {};
  final MapController _mapController = MapController();

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 2, vsync: this);
    _loadProperties();
  }

  @override
  void dispose() {
    _tabController.dispose();
    super.dispose();
  }

  Future<void> _loadProperties() async {
    setState(() {
      _isLoading = true;
    });

    try {
      final propertyService = Provider.of<PropertyService>(context, listen: false);
      final properties = await propertyService.getProperties(_filters);

      setState(() {
        _properties = properties;
        _isLoading = false;
      });
    } catch (e) {
      setState(() {
        _isLoading = false;
      });
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Erreur lors du chargement des propriétés: $e')),
      );
    }
  }

  void _onFiltersChanged(Map<String, dynamic> filters) {
    setState(() {
      _filters = filters;
    });
    _loadProperties();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('ImmoApp'),
        backgroundColor: Colors.red,
        actions: [
          IconButton(
            icon: const Icon(Icons.notifications),
            onPressed: () {
              // TODO: Naviguer vers l'écran des notifications
            },
          ),
          IconButton(
            icon: const Icon(Icons.person),
            onPressed: () {
              // TODO: Naviguer vers l'écran de profil
            },
          ),
        ],
        bottom: TabBar(
          controller: _tabController,
          tabs: const [
            Tab(icon: Icon(Icons.list), text: 'Liste'),
            Tab(icon: Icon(Icons.map), text: 'Carte'),
          ],
        ),
      ),
      body: Column(
        children: [
          SearchFilterBar(
            onFiltersChanged: _onFiltersChanged,
          ),
          Expanded(
            child: _isLoading
                ? const Center(child: CircularProgressIndicator())
                : TabBarView(
                    controller: _tabController,
                    children: [
                      // Vue Liste
                      _properties.isEmpty
                          ? const Center(child: Text('Aucune propriété trouvée'))
                          : ListView.builder(
                              itemCount: _properties.length,
                              itemBuilder: (context, index) {
                                return PropertyCard(property: _properties[index]);
                              },
                            ),
                      
                      // Vue Carte
                      FlutterMap(
                        mapController: _mapController,
                        options: MapOptions(
                          center: _properties.isNotEmpty
                              ? LatLng(_properties[0].location.latitude, _properties[0].location.longitude)
                              : const LatLng(48.866667, 2.333333), // Paris par défaut
                          zoom: 12.0,
                        ),
                        children: [
                          TileLayer(
                            urlTemplate: 'https://api.mapbox.com/styles/v1/{id}/tiles/{z}/{x}/{y}?access_token={accessToken}',
                            additionalOptions: const {
                              'accessToken': 'YOUR_MAPBOX_ACCESS_TOKEN',
                              'id': 'mapbox/streets-v11',
                            },
                          ),
                          MarkerLayer(
                            markers: _properties.map((property) {
                              return Marker(
                                width: 40.0,
                                height: 40.0,
                                point: LatLng(property.location.latitude, property.location.longitude),
                                builder: (ctx) => GestureDetector(
                                  onTap: () {
                                    // TODO: Afficher les détails de la propriété
                                  },
                                  child: Container(
                                    decoration: BoxDecoration(
                                      color: Colors.red,
                                      shape: BoxShape.circle,
                                      border: Border.all(color: Colors.white, width: 2),
                                    ),
                                    child: Center(
                                      child: Text(
                                        '${property.price ~/ 1000}k',
                                        style: const TextStyle(
                                          color: Colors.white,
                                          fontWeight: FontWeight.bold,
                                          fontSize: 10,
                                        ),
                                      ),
                                    ),
                                  ),
                                ),
                              );
                            }).toList(),
                          ),
                        ],
                      ),
                    ],
                  ),
          ),
        ],
      ),
      floatingActionButton: FloatingActionButton(
        backgroundColor: Colors.red,
        child: const Icon(Icons.add),
        onPressed: () {
          // TODO: Naviguer vers l'écran de création d'annonce
        },
      ),
    );
  }
}
