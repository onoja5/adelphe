import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../src/constants/colors';
import { Card } from '../../src/components';
import api from '../../src/services/api';

interface PartnerDashboard {
  primary_user_name: string;
  today_status: 'easier' | 'challenging' | 'neutral';
  recent_mood_trend: 'improving' | 'declining' | 'stable';
  suggested_actions: string[];
  last_updated: string;
}

export default function PartnerDashboardScreen() {
  const router = useRouter();
  const [dashboard, setDashboard] = useState<PartnerDashboard | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchDashboard = async () => {
    try {
      const response = await api.get('/partner/dashboard');
      setDashboard(response.data);
    } catch (error) {
      console.error('Failed to fetch partner dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchDashboard();
    setRefreshing(false);
  };

  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'challenging':
        return {
          icon: 'heart-outline',
          color: Colors.warning,
          title: 'Today might be challenging',
          subtitle: 'A little extra support could really help',
        };
      case 'easier':
        return {
          icon: 'sunny',
          color: Colors.secondary,
          title: 'Today seems like an easier day',
          subtitle: 'A great time to connect positively',
        };
      default:
        return {
          icon: 'remove-circle-outline',
          color: Colors.textSecondary,
          title: 'No specific status for today',
          subtitle: 'Check in with a kind message',
        };
    }
  };

  const getTrendConfig = (trend: string) => {
    switch (trend) {
      case 'improving':
        return { icon: 'trending-up', color: Colors.secondary, label: 'Improving' };
      case 'declining':
        return { icon: 'trending-down', color: Colors.warning, label: 'Needs support' };
      default:
        return { icon: 'remove', color: Colors.textSecondary, label: 'Stable' };
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loading}>
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!dashboard) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color={Colors.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Partner Dashboard</Text>
          <View style={{ width: 40 }} />
        </View>
        <View style={styles.emptyState}>
          <Ionicons name="link-outline" size={48} color={Colors.textLight} />
          <Text style={styles.emptyText}>No partner link found</Text>
        </View>
      </SafeAreaView>
    );
  }

  const statusConfig = getStatusConfig(dashboard.today_status);
  const trendConfig = getTrendConfig(dashboard.recent_mood_trend);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={Colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Partner Dashboard</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Partner Name */}
        <View style={styles.nameSection}>
          <Text style={styles.supportingText}>Supporting</Text>
          <Text style={styles.partnerName}>{dashboard.primary_user_name}</Text>
        </View>

        {/* Today's Status */}
        <Card style={[styles.statusCard, { backgroundColor: `${statusConfig.color}15` }]}>
          <View style={[styles.statusIcon, { backgroundColor: statusConfig.color }]}>
            <Ionicons name={statusConfig.icon as any} size={32} color="#fff" />
          </View>
          <Text style={[styles.statusTitle, { color: statusConfig.color }]}>
            {statusConfig.title}
          </Text>
          <Text style={styles.statusSubtitle}>{statusConfig.subtitle}</Text>
        </Card>

        {/* Mood Trend */}
        <Card style={styles.trendCard}>
          <View style={styles.trendHeader}>
            <Text style={styles.trendLabel}>Recent Mood Trend</Text>
            <View style={[styles.trendBadge, { backgroundColor: `${trendConfig.color}15` }]}>
              <Ionicons name={trendConfig.icon as any} size={16} color={trendConfig.color} />
              <Text style={[styles.trendBadgeText, { color: trendConfig.color }]}>
                {trendConfig.label}
              </Text>
            </View>
          </View>
        </Card>

        {/* Suggested Actions */}
        <Text style={styles.sectionTitle}>How You Can Help</Text>
        {dashboard.suggested_actions.map((action, index) => (
          <Card key={index} style={styles.actionCard}>
            <View style={styles.actionNumber}>
              <Text style={styles.actionNumberText}>{index + 1}</Text>
            </View>
            <Text style={styles.actionText}>{action}</Text>
          </Card>
        ))}

        {/* Quick Messages */}
        <Text style={styles.sectionTitle}>Send Some Love</Text>
        <View style={styles.quickMessages}>
          {['❤️', '🤗', '☕', '💪', '🌸'].map((emoji, index) => (
            <TouchableOpacity key={index} style={styles.emojiButton}>
              <Text style={styles.emoji}>{emoji}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Learn More */}
        <Card style={styles.learnCard} onPress={() => router.push('/(tabs)/library')}>
          <Ionicons name="book" size={24} color={Colors.info} />
          <View style={styles.learnContent}>
            <Text style={styles.learnTitle}>Learn About Menopause</Text>
            <Text style={styles.learnSubtitle}>
              Understanding her experience helps you support better
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color={Colors.textLight} />
        </Card>
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
  loading: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: Colors.textSecondary,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: Colors.textSecondary,
    marginTop: 16,
  },
  content: {
    padding: 20,
  },
  nameSection: {
    alignItems: 'center',
    marginBottom: 24,
  },
  supportingText: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  partnerName: {
    fontSize: 28,
    fontWeight: 'bold',
    color: Colors.text,
    marginTop: 4,
  },
  statusCard: {
    alignItems: 'center',
    paddingVertical: 32,
    marginBottom: 16,
  },
  statusIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  statusTitle: {
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
  },
  statusSubtitle: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginTop: 8,
    textAlign: 'center',
  },
  trendCard: {
    marginBottom: 24,
  },
  trendHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  trendLabel: {
    fontSize: 15,
    color: Colors.text,
  },
  trendBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  trendBadgeText: {
    fontSize: 13,
    fontWeight: '500',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 12,
  },
  actionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    marginBottom: 10,
  },
  actionNumber: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionNumberText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },
  actionText: {
    flex: 1,
    fontSize: 15,
    color: Colors.text,
    lineHeight: 21,
  },
  quickMessages: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 24,
  },
  emojiButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emoji: {
    fontSize: 28,
  },
  learnCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  learnContent: {
    flex: 1,
  },
  learnTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.text,
  },
  learnSubtitle: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginTop: 2,
  },
});
