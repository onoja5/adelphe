import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  RefreshControl,
  Linking,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../src/constants/colors';
import { Card, Button } from '../../src/components';
import api from '../../src/services/api';

interface Specialist {
  id: string;
  name: string;
  credentials: string;
  bio: string;
  specialties: string[];
  services: string[];
  is_online: boolean;
  location?: string;
  website?: string;
  phone?: string;
  email?: string;
  booking_link?: string;
}

const SPECIALTIES = [
  'All',
  'Menopause',
  'HRT',
  'Nutrition',
  'Therapy',
  'Fitness',
];

export default function SpecialistsScreen() {
  const router = useRouter();
  const [specialists, setSpecialists] = useState<Specialist[]>([]);
  const [filteredSpecialists, setFilteredSpecialists] = useState<Specialist[]>([]);
  const [selectedSpecialty, setSelectedSpecialty] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [showOnlineOnly, setShowOnlineOnly] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedSpecialist, setSelectedSpecialist] = useState<Specialist | null>(null);

  const fetchSpecialists = async () => {
    try {
      const response = await api.get('/specialists');
      setSpecialists(response.data);
      setFilteredSpecialists(response.data);
    } catch (error) {
      console.error('Failed to fetch specialists:', error);
    }
  };

  useEffect(() => {
    fetchSpecialists();
  }, []);

  useEffect(() => {
    let filtered = specialists;

    if (selectedSpecialty !== 'All') {
      filtered = filtered.filter(s =>
        s.specialties.some(sp =>
          sp.toLowerCase().includes(selectedSpecialty.toLowerCase())
        )
      );
    }

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        s =>
          s.name.toLowerCase().includes(query) ||
          s.bio.toLowerCase().includes(query) ||
          s.specialties.some(sp => sp.toLowerCase().includes(query))
      );
    }

    if (showOnlineOnly) {
      filtered = filtered.filter(s => s.is_online);
    }

    setFilteredSpecialists(filtered);
  }, [selectedSpecialty, searchQuery, showOnlineOnly, specialists]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchSpecialists();
    setRefreshing(false);
  };

  const handleContact = (type: 'website' | 'phone' | 'email' | 'booking', value?: string) => {
    if (!value) return;

    switch (type) {
      case 'website':
      case 'booking':
        Linking.openURL(value);
        break;
      case 'phone':
        Linking.openURL(`tel:${value}`);
        break;
      case 'email':
        Linking.openURL(`mailto:${value}`);
        break;
    }
  };

  // Detail View
  if (selectedSpecialist) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => setSelectedSpecialist(null)}
          >
            <Ionicons name="arrow-back" size={24} color={Colors.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Specialist</Text>
          <View style={{ width: 40 }} />
        </View>

        <ScrollView contentContainerStyle={styles.detailContent}>
          <View style={styles.detailHeader}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>
                {selectedSpecialist.name.charAt(0)}
              </Text>
            </View>
            <Text style={styles.detailName}>{selectedSpecialist.name}</Text>
            <Text style={styles.detailCredentials}>
              {selectedSpecialist.credentials}
            </Text>
            {selectedSpecialist.is_online && (
              <View style={styles.onlineBadge}>
                <Ionicons name="videocam" size={14} color={Colors.secondary} />
                <Text style={styles.onlineBadgeText}>Online consultations</Text>
              </View>
            )}
          </View>

          <Card style={styles.detailSection}>
            <Text style={styles.detailSectionTitle}>About</Text>
            <Text style={styles.detailBio}>{selectedSpecialist.bio}</Text>
          </Card>

          <Card style={styles.detailSection}>
            <Text style={styles.detailSectionTitle}>Specialties</Text>
            <View style={styles.tags}>
              {selectedSpecialist.specialties.map((s, i) => (
                <View key={i} style={styles.tag}>
                  <Text style={styles.tagText}>{s}</Text>
                </View>
              ))}
            </View>
          </Card>

          <Card style={styles.detailSection}>
            <Text style={styles.detailSectionTitle}>Services</Text>
            {selectedSpecialist.services.map((service, i) => (
              <View key={i} style={styles.serviceItem}>
                <Ionicons name="checkmark-circle" size={18} color={Colors.secondary} />
                <Text style={styles.serviceText}>{service}</Text>
              </View>
            ))}
          </Card>

          {selectedSpecialist.location && (
            <Card style={styles.detailSection}>
              <View style={styles.infoRow}>
                <Ionicons name="location" size={20} color={Colors.primary} />
                <Text style={styles.infoText}>{selectedSpecialist.location}</Text>
              </View>
            </Card>
          )}

          {/* Contact Options */}
          <View style={styles.contactButtons}>
            {selectedSpecialist.booking_link && (
              <Button
                title="Book Appointment"
                onPress={() => handleContact('booking', selectedSpecialist.booking_link)}
              />
            )}
            {selectedSpecialist.website && (
              <Button
                title="Visit Website"
                variant="outline"
                onPress={() => handleContact('website', selectedSpecialist.website)}
              />
            )}
            <View style={styles.contactRow}>
              {selectedSpecialist.phone && (
                <TouchableOpacity
                  style={styles.contactButton}
                  onPress={() => handleContact('phone', selectedSpecialist.phone)}
                >
                  <Ionicons name="call" size={20} color={Colors.primary} />
                  <Text style={styles.contactButtonText}>Call</Text>
                </TouchableOpacity>
              )}
              {selectedSpecialist.email && (
                <TouchableOpacity
                  style={styles.contactButton}
                  onPress={() => handleContact('email', selectedSpecialist.email)}
                >
                  <Ionicons name="mail" size={20} color={Colors.primary} />
                  <Text style={styles.contactButtonText}>Email</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  // List View
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={Colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Find a Specialist</Text>
        <View style={{ width: 40 }} />
      </View>

      {/* Search */}
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color={Colors.textSecondary} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search specialists..."
          placeholderTextColor={Colors.textLight}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      {/* Filters */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.filtersScroll}
        contentContainerStyle={styles.filtersContent}
      >
        {SPECIALTIES.map((specialty) => (
          <TouchableOpacity
            key={specialty}
            style={[
              styles.filterChip,
              selectedSpecialty === specialty && styles.filterChipActive,
            ]}
            onPress={() => setSelectedSpecialty(specialty)}
          >
            <Text
              style={[
                styles.filterText,
                selectedSpecialty === specialty && styles.filterTextActive,
              ]}
            >
              {specialty}
            </Text>
          </TouchableOpacity>
        ))}
        <TouchableOpacity
          style={[
            styles.filterChip,
            showOnlineOnly && styles.filterChipActive,
          ]}
          onPress={() => setShowOnlineOnly(!showOnlineOnly)}
        >
          <Ionicons
            name="videocam"
            size={16}
            color={showOnlineOnly ? '#fff' : Colors.textSecondary}
          />
          <Text
            style={[
              styles.filterText,
              showOnlineOnly && styles.filterTextActive,
            ]}
          >
            Online
          </Text>
        </TouchableOpacity>
      </ScrollView>

      {/* List */}
      <ScrollView
        style={styles.list}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {filteredSpecialists.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="search" size={48} color={Colors.textLight} />
            <Text style={styles.emptyText}>No specialists found</Text>
          </View>
        ) : (
          filteredSpecialists.map((specialist) => (
            <Card
              key={specialist.id}
              style={styles.specialistCard}
              onPress={() => setSelectedSpecialist(specialist)}
            >
              <View style={styles.cardHeader}>
                <View style={styles.cardAvatar}>
                  <Text style={styles.cardAvatarText}>
                    {specialist.name.charAt(0)}
                  </Text>
                </View>
                <View style={styles.cardInfo}>
                  <Text style={styles.cardName}>{specialist.name}</Text>
                  <Text style={styles.cardCredentials}>
                    {specialist.credentials}
                  </Text>
                </View>
                {specialist.is_online && (
                  <View style={styles.onlineIndicator}>
                    <Ionicons name="videocam" size={16} color={Colors.secondary} />
                  </View>
                )}
              </View>
              <View style={styles.cardSpecialties}>
                {specialist.specialties.slice(0, 3).map((s, i) => (
                  <View key={i} style={styles.smallTag}>
                    <Text style={styles.smallTagText}>{s}</Text>
                  </View>
                ))}
              </View>
              {specialist.location && (
                <View style={styles.cardLocation}>
                  <Ionicons name="location-outline" size={14} color={Colors.textSecondary} />
                  <Text style={styles.cardLocationText}>{specialist.location}</Text>
                </View>
              )}
            </Card>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    marginHorizontal: 20,
    paddingHorizontal: 16,
    borderRadius: 12,
    gap: 12,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 14,
    fontSize: 16,
    color: Colors.text,
  },
  filtersScroll: {
    maxHeight: 50,
    marginTop: 16,
  },
  filtersContent: {
    paddingHorizontal: 20,
    gap: 8,
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: Colors.surface,
  },
  filterChipActive: {
    backgroundColor: Colors.primary,
  },
  filterText: {
    fontSize: 14,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  filterTextActive: {
    color: '#fff',
  },
  list: {
    flex: 1,
    marginTop: 16,
  },
  listContent: {
    padding: 20,
    paddingTop: 0,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 16,
    color: Colors.textSecondary,
    marginTop: 16,
  },
  specialistCard: {
    marginBottom: 12,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  cardAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardAvatarText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  cardInfo: {
    flex: 1,
    marginLeft: 12,
  },
  cardName: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
  },
  cardCredentials: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  onlineIndicator: {
    backgroundColor: `${Colors.secondary}15`,
    padding: 8,
    borderRadius: 8,
  },
  cardSpecialties: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 12,
  },
  smallTag: {
    backgroundColor: Colors.surfaceSecondary,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  smallTagText: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  cardLocation: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 10,
  },
  cardLocationText: {
    fontSize: 13,
    color: Colors.textSecondary,
  },
  // Detail styles
  detailContent: {
    padding: 20,
  },
  detailHeader: {
    alignItems: 'center',
    marginBottom: 24,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#fff',
  },
  detailName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.text,
    marginTop: 16,
  },
  detailCredentials: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginTop: 4,
  },
  onlineBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: `${Colors.secondary}15`,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginTop: 12,
  },
  onlineBadgeText: {
    fontSize: 13,
    color: Colors.secondary,
  },
  detailSection: {
    marginBottom: 16,
  },
  detailSectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 12,
  },
  detailBio: {
    fontSize: 14,
    color: Colors.textSecondary,
    lineHeight: 21,
  },
  tags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  tag: {
    backgroundColor: `${Colors.primary}15`,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  tagText: {
    fontSize: 13,
    color: Colors.primary,
  },
  serviceItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 8,
  },
  serviceText: {
    fontSize: 14,
    color: Colors.text,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  infoText: {
    fontSize: 14,
    color: Colors.text,
  },
  contactButtons: {
    gap: 12,
    marginTop: 16,
  },
  contactRow: {
    flexDirection: 'row',
    gap: 12,
  },
  contactButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: Colors.surface,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  contactButtonText: {
    fontSize: 15,
    fontWeight: '500',
    color: Colors.primary,
  },
});
