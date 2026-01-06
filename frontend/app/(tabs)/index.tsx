import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
} from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../src/constants/colors';
import { Card, QuickActionCard } from '../../src/components';
import { useAuthStore } from '../../src/store/authStore';
import api from '../../src/services/api';

interface DashboardData {
  has_logged_symptoms_today: boolean;
  has_logged_mood_today: boolean;
  has_logged_lifestyle_today: boolean;
  today_mood_score: number | null;
  today_symptom_count: number;
  suggestions: Array<{
    type: string;
    title: string;
    description: string;
  }>;
}

export default function HomeScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [dashboard, setDashboard] = useState<DashboardData | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);

  const fetchDashboard = async () => {
    try {
      const response = await api.get('/dashboard');
      setDashboard(response.data);
    } catch (error) {
      console.error('Failed to fetch dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchDashboard();
    }, [])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchDashboard();
    setRefreshing(false);
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  const getMoodColor = (score: number) => {
    if (score >= 8) return Colors.moodGreat;
    if (score >= 6) return Colors.moodGood;
    if (score >= 4) return Colors.moodNeutral;
    if (score >= 2) return Colors.moodLow;
    return Colors.moodVeryLow;
  };

  const getMoodEmoji = (score: number) => {
    if (score >= 8) return 'happy';
    if (score >= 6) return 'happy-outline';
    if (score >= 4) return 'remove-outline';
    if (score >= 2) return 'sad-outline';
    return 'sad';
  };

  // Partner view
  if (user?.role === 'partner') {
    return (
      <SafeAreaView style={styles.container}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
        >
          <View style={styles.header}>
            <Text style={styles.greeting}>{getGreeting()},</Text>
            <Text style={styles.name}>{user?.name}</Text>
          </View>

          <Card style={styles.partnerCard}>
            <Ionicons name="heart" size={40} color={Colors.primary} />
            <Text style={styles.partnerTitle}>Partner Support Mode</Text>
            <Text style={styles.partnerSubtitle}>
              View how you can support your partner today
            </Text>
            <TouchableOpacity
              style={styles.partnerButton}
              onPress={() => router.push('/partner/dashboard')}
            >
              <Text style={styles.partnerButtonText}>View Dashboard</Text>
              <Ionicons name="arrow-forward" size={20} color={Colors.primary} />
            </TouchableOpacity>
          </Card>
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>{getGreeting()},</Text>
            <Text style={styles.name}>{user?.name}</Text>
          </View>
          <TouchableOpacity
            style={styles.notificationButton}
            onPress={() => {}}
          >
            <Ionicons name="notifications-outline" size={24} color={Colors.text} />
          </TouchableOpacity>
        </View>

        {/* Today's Status */}
        <Card style={styles.statusCard}>
          <Text style={styles.cardTitle}>Today's Check-ins</Text>
          <View style={styles.statusRow}>
            <View style={styles.statusItem}>
              <View style={[
                styles.statusIcon,
                dashboard?.has_logged_mood_today && styles.statusIconComplete
              ]}>
                <Ionicons
                  name={dashboard?.has_logged_mood_today ? 'checkmark' : 'happy-outline'}
                  size={20}
                  color={dashboard?.has_logged_mood_today ? '#fff' : Colors.textSecondary}
                />
              </View>
              <Text style={styles.statusLabel}>Mood</Text>
              {dashboard?.today_mood_score && (
                <View style={[
                  styles.moodBadge,
                  { backgroundColor: getMoodColor(dashboard.today_mood_score) + '20' }
                ]}>
                  <Ionicons
                    name={getMoodEmoji(dashboard.today_mood_score) as any}
                    size={16}
                    color={getMoodColor(dashboard.today_mood_score)}
                  />
                </View>
              )}
            </View>
            <View style={styles.statusItem}>
              <View style={[
                styles.statusIcon,
                dashboard?.has_logged_symptoms_today && styles.statusIconComplete
              ]}>
                <Ionicons
                  name={dashboard?.has_logged_symptoms_today ? 'checkmark' : 'pulse-outline'}
                  size={20}
                  color={dashboard?.has_logged_symptoms_today ? '#fff' : Colors.textSecondary}
                />
              </View>
              <Text style={styles.statusLabel}>Symptoms</Text>
              {dashboard?.today_symptom_count > 0 && (
                <Text style={styles.statusCount}>{dashboard.today_symptom_count}</Text>
              )}
            </View>
            <View style={styles.statusItem}>
              <View style={[
                styles.statusIcon,
                dashboard?.has_logged_lifestyle_today && styles.statusIconComplete
              ]}>
                <Ionicons
                  name={dashboard?.has_logged_lifestyle_today ? 'checkmark' : 'leaf-outline'}
                  size={20}
                  color={dashboard?.has_logged_lifestyle_today ? '#fff' : Colors.textSecondary}
                />
              </View>
              <Text style={styles.statusLabel}>Lifestyle</Text>
            </View>
          </View>
        </Card>

        {/* Quick Actions */}
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <View style={styles.quickActions}>
          <QuickActionCard
            title="Log Symptoms"
            icon="pulse"
            iconColor={Colors.primary}
            onPress={() => router.push('/symptoms/log')}
          />
          <QuickActionCard
            title="How I Feel"
            icon="happy"
            iconColor={Colors.secondary}
            onPress={() => router.push('/mood/checkin')}
          />
          <QuickActionCard
            title="Lifestyle"
            icon="leaf"
            iconColor={Colors.warning}
            onPress={() => router.push('/lifestyle/log')}
          />
          <QuickActionCard
            title="Partner"
            icon="heart"
            iconColor={Colors.info}
            onPress={() => router.push('/partner')}
          />
        </View>

        {/* Suggestions */}
        {dashboard?.suggestions && dashboard.suggestions.length > 0 && (
          <>
            <Text style={styles.sectionTitle}>Suggested for You</Text>
            {dashboard.suggestions.map((suggestion, index) => (
              <Card key={index} style={styles.suggestionCard}>
                <View style={styles.suggestionIcon}>
                  <Ionicons
                    name={
                      suggestion.type === 'checkin' ? 'clipboard-outline' :
                      suggestion.type === 'mood' ? 'happy-outline' :
                      suggestion.type === 'reminder' ? 'water-outline' :
                      'walk-outline'
                    }
                    size={24}
                    color={Colors.secondary}
                  />
                </View>
                <View style={styles.suggestionContent}>
                  <Text style={styles.suggestionTitle}>{suggestion.title}</Text>
                  <Text style={styles.suggestionDescription}>{suggestion.description}</Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color={Colors.textLight} />
              </Card>
            ))}
          </>
        )}

        {/* Quick Links */}
        <Text style={styles.sectionTitle}>Explore</Text>
        <View style={styles.exploreGrid}>
          <TouchableOpacity
            style={styles.exploreItem}
            onPress={() => router.push('/specialists')}
          >
            <Ionicons name="medical" size={24} color={Colors.primary} />
            <Text style={styles.exploreText}>Specialists</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.exploreItem}
            onPress={() => router.push('/community/events')}
          >
            <Ionicons name="calendar" size={24} color={Colors.secondary} />
            <Text style={styles.exploreText}>Events</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.exploreItem}
            onPress={() => router.push('/symptoms/history')}
          >
            <Ionicons name="analytics" size={24} color={Colors.warning} />
            <Text style={styles.exploreText}>Insights</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scrollContent: {
    padding: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 24,
  },
  greeting: {
    fontSize: 16,
    color: Colors.textSecondary,
  },
  name: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.text,
  },
  notificationButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusCard: {
    marginBottom: 24,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 16,
  },
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statusItem: {
    alignItems: 'center',
    gap: 8,
  },
  statusIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.surfaceSecondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusIconComplete: {
    backgroundColor: Colors.secondary,
  },
  statusLabel: {
    fontSize: 13,
    color: Colors.textSecondary,
  },
  statusCount: {
    fontSize: 12,
    color: Colors.primary,
    fontWeight: '600',
  },
  moodBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 16,
  },
  quickActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 12,
    marginBottom: 24,
  },
  suggestionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  suggestionIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: `${Colors.secondary}15`,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  suggestionContent: {
    flex: 1,
  },
  suggestionTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.text,
  },
  suggestionDescription: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  exploreGrid: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  exploreItem: {
    flex: 1,
    backgroundColor: Colors.surface,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    gap: 8,
  },
  exploreText: {
    fontSize: 13,
    color: Colors.text,
    fontWeight: '500',
  },
  partnerCard: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  partnerTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: Colors.text,
    marginTop: 16,
  },
  partnerSubtitle: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginTop: 8,
    marginBottom: 24,
  },
  partnerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: `${Colors.primary}15`,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 24,
  },
  partnerButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.primary,
  },
});
