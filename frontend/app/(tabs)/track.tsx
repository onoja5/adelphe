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

export default function TrackScreen() {
  const router = useRouter();
  const [recentSymptoms, setRecentSymptoms] = useState<any[]>([]);
  const [recentMoods, setRecentMoods] = useState<any[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = async () => {
    try {
      const [symptomsRes, moodsRes] = await Promise.all([
        api.get('/symptom-logs?days=7'),
        api.get('/mood-logs?days=7'),
      ]);
      setRecentSymptoms(symptomsRes.data.slice(0, 5));
      setRecentMoods(moodsRes.data.slice(0, 5));
    } catch (error) {
      console.error('Failed to fetch tracking data:', error);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'severe': return Colors.error;
      case 'moderate': return Colors.warning;
      default: return Colors.secondary;
    }
  };

  const getMoodColor = (score: number) => {
    if (score >= 7) return Colors.moodGreat;
    if (score >= 5) return Colors.moodNeutral;
    return Colors.moodLow;
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        <Text style={styles.title}>Track Your Journey</Text>
        <Text style={styles.subtitle}>Log symptoms, mood, and lifestyle daily</Text>

        {/* Log Options */}
        <View style={styles.logOptions}>
          <TouchableOpacity
            style={styles.logCard}
            onPress={() => router.push('/symptoms/log')}
          >
            <View style={[styles.logIcon, { backgroundColor: `${Colors.primary}15` }]}>
              <Ionicons name="pulse" size={28} color={Colors.primary} />
            </View>
            <Text style={styles.logTitle}>Log Symptoms</Text>
            <Text style={styles.logDesc}>Track physical and emotional symptoms</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.logCard}
            onPress={() => router.push('/mood/checkin')}
          >
            <View style={[styles.logIcon, { backgroundColor: `${Colors.secondary}15` }]}>
              <Ionicons name="happy" size={28} color={Colors.secondary} />
            </View>
            <Text style={styles.logTitle}>How I Feel</Text>
            <Text style={styles.logDesc}>Mood and emotional check-in</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.logCard}
            onPress={() => router.push('/lifestyle/log')}
          >
            <View style={[styles.logIcon, { backgroundColor: `${Colors.warning}15` }]}>
              <Ionicons name="leaf" size={28} color={Colors.warning} />
            </View>
            <Text style={styles.logTitle}>Lifestyle</Text>
            <Text style={styles.logDesc}>Sleep, food, exercise & stress</Text>
          </TouchableOpacity>
        </View>

        {/* View History */}
        <TouchableOpacity
          style={styles.historyButton}
          onPress={() => router.push('/symptoms/history')}
        >
          <Ionicons name="analytics" size={20} color={Colors.primary} />
          <Text style={styles.historyText}>View History & Insights</Text>
          <Ionicons name="chevron-forward" size={20} color={Colors.primary} />
        </TouchableOpacity>

        {/* Recent Symptoms */}
        {recentSymptoms.length > 0 && (
          <>
            <Text style={styles.sectionTitle}>Recent Symptoms</Text>
            {recentSymptoms.map((log, index) => (
              <Card key={index} style={styles.recentCard}>
                <View style={styles.recentHeader}>
                  <Text style={styles.recentName}>{log.symptom_name}</Text>
                  <View style={[
                    styles.severityBadge,
                    { backgroundColor: `${getSeverityColor(log.severity)}15` }
                  ]}>
                    <Text style={[
                      styles.severityText,
                      { color: getSeverityColor(log.severity) }
                    ]}>
                      {log.severity}
                    </Text>
                  </View>
                </View>
                <Text style={styles.recentDate}>{formatDate(log.logged_at)}</Text>
              </Card>
            ))}
          </>
        )}

        {/* Recent Moods */}
        {recentMoods.length > 0 && (
          <>
            <Text style={styles.sectionTitle}>Recent Moods</Text>
            <View style={styles.moodHistory}>
              {recentMoods.map((mood, index) => (
                <View key={index} style={styles.moodDay}>
                  <View style={[
                    styles.moodCircle,
                    { backgroundColor: getMoodColor(mood.mood_score) }
                  ]}>
                    <Text style={styles.moodScore}>{mood.mood_score}</Text>
                  </View>
                  <Text style={styles.moodDate}>
                    {new Date(mood.logged_at).toLocaleDateString('en-US', { weekday: 'short' })}
                  </Text>
                </View>
              ))}
            </View>
          </>
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
  scrollContent: {
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.text,
  },
  subtitle: {
    fontSize: 15,
    color: Colors.textSecondary,
    marginTop: 4,
    marginBottom: 24,
  },
  logOptions: {
    gap: 12,
    marginBottom: 24,
  },
  logCard: {
    backgroundColor: Colors.surface,
    padding: 16,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  logIcon: {
    width: 56,
    height: 56,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
  },
  logDesc: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  historyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: `${Colors.primary}10`,
    padding: 14,
    borderRadius: 12,
    gap: 8,
    marginBottom: 24,
  },
  historyText: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.primary,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 12,
  },
  recentCard: {
    marginBottom: 8,
  },
  recentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  recentName: {
    fontSize: 15,
    fontWeight: '500',
    color: Colors.text,
  },
  severityBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  severityText: {
    fontSize: 12,
    fontWeight: '500',
    textTransform: 'capitalize',
  },
  recentDate: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginTop: 4,
  },
  moodHistory: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: Colors.surface,
    padding: 16,
    borderRadius: 16,
    marginBottom: 24,
  },
  moodDay: {
    alignItems: 'center',
    gap: 8,
  },
  moodCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  moodScore: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
  },
  moodDate: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
});
