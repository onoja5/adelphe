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

interface SymptomLog {
  id: string;
  symptom_name: string;
  severity: string;
  severity_score: number;
  frequency: string;
  notes: string;
  logged_at: string;
}

interface MoodLog {
  id: string;
  mood_score: number;
  emotions: string[];
  description: string;
  logged_at: string;
}

interface Insight {
  type: string;
  title: string;
  data: any;
}

export default function HistoryScreen() {
  const router = useRouter();
  const [tab, setTab] = useState<'symptoms' | 'moods' | 'insights'>('symptoms');
  const [symptomLogs, setSymptomLogs] = useState<SymptomLog[]>([]);
  const [moodLogs, setMoodLogs] = useState<MoodLog[]>([]);
  const [insights, setInsights] = useState<Insight[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = async () => {
    try {
      const [symptomsRes, moodsRes, insightsRes] = await Promise.all([
        api.get('/symptom-logs?days=30'),
        api.get('/mood-logs?days=30'),
        api.get('/insights'),
      ]);
      setSymptomLogs(symptomsRes.data);
      setMoodLogs(moodsRes.data);
      setInsights(insightsRes.data.insights || []);
    } catch (error) {
      console.error('Failed to fetch history:', error);
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
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'severe': return Colors.error;
      case 'moderate': return Colors.warning;
      default: return Colors.secondary;
    }
  };

  const getMoodColor = (score: number) => {
    if (score >= 8) return Colors.moodGreat;
    if (score >= 6) return Colors.moodGood;
    if (score >= 4) return Colors.moodNeutral;
    if (score >= 2) return Colors.moodLow;
    return Colors.moodVeryLow;
  };

  const renderSymptoms = () => (
    <>
      {symptomLogs.length === 0 ? (
        <View style={styles.emptyState}>
          <Ionicons name="pulse-outline" size={48} color={Colors.textLight} />
          <Text style={styles.emptyText}>No symptoms logged yet</Text>
          <TouchableOpacity
            style={styles.emptyButton}
            onPress={() => router.push('/symptoms/log')}
          >
            <Text style={styles.emptyButtonText}>Log your first symptom</Text>
          </TouchableOpacity>
        </View>
      ) : (
        symptomLogs.map((log) => (
          <Card key={log.id} style={styles.logCard}>
            <View style={styles.logHeader}>
              <Text style={styles.logName}>{log.symptom_name}</Text>
              <View style={[
                styles.severityBadge,
                { backgroundColor: `${getSeverityColor(log.severity)}15` }
              ]}>
                <Text style={[
                  styles.severityText,
                  { color: getSeverityColor(log.severity) }
                ]}>
                  {log.severity} ({log.severity_score}/10)
                </Text>
              </View>
            </View>
            <View style={styles.logMeta}>
              <Text style={styles.logFrequency}>{log.frequency}</Text>
              <Text style={styles.logDate}>{formatDate(log.logged_at)}</Text>
            </View>
            {log.notes && (
              <Text style={styles.logNotes}>{log.notes}</Text>
            )}
          </Card>
        ))
      )}
    </>
  );

  const renderMoods = () => (
    <>
      {moodLogs.length === 0 ? (
        <View style={styles.emptyState}>
          <Ionicons name="happy-outline" size={48} color={Colors.textLight} />
          <Text style={styles.emptyText}>No mood entries yet</Text>
          <TouchableOpacity
            style={styles.emptyButton}
            onPress={() => router.push('/mood/checkin')}
          >
            <Text style={styles.emptyButtonText}>Log how you feel</Text>
          </TouchableOpacity>
        </View>
      ) : (
        moodLogs.map((log) => (
          <Card key={log.id} style={styles.logCard}>
            <View style={styles.moodHeader}>
              <View style={[
                styles.moodCircle,
                { backgroundColor: getMoodColor(log.mood_score) }
              ]}>
                <Text style={styles.moodScore}>{log.mood_score}</Text>
              </View>
              <View style={styles.moodInfo}>
                <Text style={styles.moodLabel}>
                  {log.mood_score >= 7 ? 'Feeling good' : log.mood_score >= 4 ? 'Okay' : 'Challenging day'}
                </Text>
                <Text style={styles.logDate}>{formatDate(log.logged_at)}</Text>
              </View>
            </View>
            {log.emotions.length > 0 && (
              <View style={styles.emotionTags}>
                {log.emotions.map((emotion, i) => (
                  <View key={i} style={styles.emotionTag}>
                    <Text style={styles.emotionText}>{emotion}</Text>
                  </View>
                ))}
              </View>
            )}
            {log.description && (
              <Text style={styles.logNotes}>{log.description}</Text>
            )}
          </Card>
        ))
      )}
    </>
  );

  const renderInsights = () => (
    <>
      {insights.length === 0 ? (
        <View style={styles.emptyState}>
          <Ionicons name="analytics-outline" size={48} color={Colors.textLight} />
          <Text style={styles.emptyText}>Not enough data for insights yet</Text>
          <Text style={styles.emptySubtext}>
            Keep tracking your symptoms and mood to see patterns
          </Text>
        </View>
      ) : (
        insights.map((insight, index) => (
          <Card key={index} style={styles.insightCard}>
            <View style={styles.insightIcon}>
              <Ionicons
                name={
                  insight.type === 'symptoms' ? 'pulse' :
                  insight.type === 'mood' ? 'happy' : 'bulb'
                }
                size={24}
                color={Colors.secondary}
              />
            </View>
            <Text style={styles.insightTitle}>{insight.title}</Text>
            {insight.type === 'symptoms' && insight.data && (
              <View style={styles.topSymptoms}>
                {insight.data.map((item: any, i: number) => (
                  <View key={i} style={styles.topSymptomItem}>
                    <Text style={styles.topSymptomName}>{item.name}</Text>
                    <Text style={styles.topSymptomCount}>{item.count}x</Text>
                  </View>
                ))}
              </View>
            )}
            {insight.type === 'mood' && insight.data && (
              <Text style={styles.insightValue}>
                Average: {insight.data.average}/10 ({insight.data.total_logs} entries)
              </Text>
            )}
            {insight.type === 'pattern' && insight.data && (
              <Text style={styles.insightMessage}>{insight.data.message}</Text>
            )}
          </Card>
        ))
      )}
    </>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={Colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>History & Insights</Text>
        <View style={{ width: 40 }} />
      </View>

      {/* Tabs */}
      <View style={styles.tabs}>
        {['symptoms', 'moods', 'insights'].map((t) => (
          <TouchableOpacity
            key={t}
            style={[styles.tab, tab === t && styles.tabActive]}
            onPress={() => setTab(t as any)}
          >
            <Text style={[styles.tabText, tab === t && styles.tabTextActive]}>
              {t.charAt(0).toUpperCase() + t.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {tab === 'symptoms' && renderSymptoms()}
        {tab === 'moods' && renderMoods()}
        {tab === 'insights' && renderInsights()}
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
  tabs: {
    flexDirection: 'row',
    marginHorizontal: 20,
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: 4,
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 10,
  },
  tabActive: {
    backgroundColor: Colors.primary,
  },
  tabText: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.textSecondary,
  },
  tabTextActive: {
    color: '#fff',
  },
  content: {
    flex: 1,
    marginTop: 16,
  },
  contentContainer: {
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
  emptySubtext: {
    fontSize: 14,
    color: Colors.textLight,
    marginTop: 8,
    textAlign: 'center',
  },
  emptyButton: {
    marginTop: 20,
    backgroundColor: Colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 24,
  },
  emptyButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },
  logCard: {
    marginBottom: 12,
  },
  logHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  logName: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
    flex: 1,
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
  logMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  logFrequency: {
    fontSize: 13,
    color: Colors.textSecondary,
    textTransform: 'capitalize',
  },
  logDate: {
    fontSize: 13,
    color: Colors.textLight,
  },
  logNotes: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginTop: 12,
    fontStyle: 'italic',
  },
  moodHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  moodCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  moodScore: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
  },
  moodInfo: {
    flex: 1,
  },
  moodLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
  },
  emotionTags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 12,
  },
  emotionTag: {
    backgroundColor: `${Colors.primary}15`,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 16,
  },
  emotionText: {
    fontSize: 13,
    color: Colors.primary,
  },
  insightCard: {
    marginBottom: 16,
  },
  insightIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: `${Colors.secondary}15`,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  insightTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 12,
  },
  topSymptoms: {
    gap: 8,
  },
  topSymptomItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: Colors.surfaceSecondary,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  topSymptomName: {
    fontSize: 14,
    color: Colors.text,
  },
  topSymptomCount: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.primary,
  },
  insightValue: {
    fontSize: 15,
    color: Colors.textSecondary,
  },
  insightMessage: {
    fontSize: 14,
    color: Colors.textSecondary,
    lineHeight: 20,
  },
});
