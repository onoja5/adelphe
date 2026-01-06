import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../src/constants/colors';
import { Button } from '../../src/components';
import { EMOTION_TAGS } from '../../src/constants';
import api from '../../src/services/api';

const MOOD_LEVELS = [
  { score: 1, emoji: 'sad', label: 'Very Low', color: Colors.moodVeryLow },
  { score: 3, emoji: 'sad-outline', label: 'Low', color: Colors.moodLow },
  { score: 5, emoji: 'remove-outline', label: 'Neutral', color: Colors.moodNeutral },
  { score: 7, emoji: 'happy-outline', label: 'Good', color: Colors.moodGood },
  { score: 9, emoji: 'happy', label: 'Great', color: Colors.moodGreat },
];

export default function MoodCheckinScreen() {
  const router = useRouter();
  const [moodScore, setMoodScore] = useState<number | null>(null);
  const [selectedEmotions, setSelectedEmotions] = useState<string[]>([]);
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);

  const toggleEmotion = (emotion: string) => {
    if (selectedEmotions.includes(emotion)) {
      setSelectedEmotions(selectedEmotions.filter(e => e !== emotion));
    } else {
      setSelectedEmotions([...selectedEmotions, emotion]);
    }
  };

  const handleSave = async () => {
    if (moodScore === null) {
      Alert.alert('Select Mood', 'Please select how you are feeling today.');
      return;
    }

    setLoading(true);
    try {
      await api.post('/mood-logs', {
        mood_score: moodScore,
        emotions: selectedEmotions,
        description: description || null,
      });

      Alert.alert(
        'Mood Logged',
        'Thank you for checking in today!',
        [{ text: 'OK', onPress: () => router.back() }]
      );
    } catch (error) {
      console.error('Failed to save mood:', error);
      Alert.alert('Error', 'Failed to save your mood. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const selectedMood = MOOD_LEVELS.find(m => m.score === moodScore);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={Colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>How Are You Feeling?</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
        {/* Mood Selection */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Your mood right now</Text>
          <View style={styles.moodOptions}>
            {MOOD_LEVELS.map((mood) => (
              <TouchableOpacity
                key={mood.score}
                style={[
                  styles.moodOption,
                  moodScore === mood.score && {
                    backgroundColor: `${mood.color}20`,
                    borderColor: mood.color,
                  },
                ]}
                onPress={() => setMoodScore(mood.score)}
              >
                <Ionicons
                  name={mood.emoji as any}
                  size={32}
                  color={moodScore === mood.score ? mood.color : Colors.textSecondary}
                />
                <Text
                  style={[
                    styles.moodLabel,
                    moodScore === mood.score && { color: mood.color },
                  ]}
                >
                  {mood.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          {selectedMood && (
            <View style={[styles.selectedMoodDisplay, { backgroundColor: `${selectedMood.color}15` }]}>
              <Ionicons name={selectedMood.emoji as any} size={40} color={selectedMood.color} />
              <Text style={[styles.selectedMoodText, { color: selectedMood.color }]}>
                {selectedMood.label}
              </Text>
            </View>
          )}
        </View>

        {/* Emotion Tags */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>What emotions are you experiencing?</Text>
          <Text style={styles.sectionSubtitle}>Select all that apply</Text>
          <View style={styles.emotionTags}>
            {EMOTION_TAGS.map((emotion) => (
              <TouchableOpacity
                key={emotion}
                style={[
                  styles.emotionTag,
                  selectedEmotions.includes(emotion) && styles.emotionTagSelected,
                ]}
                onPress={() => toggleEmotion(emotion)}
              >
                <Text
                  style={[
                    styles.emotionTagText,
                    selectedEmotions.includes(emotion) && styles.emotionTagTextSelected,
                  ]}
                >
                  {emotion}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Free Text */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Describe how you feel (optional)</Text>
          <Text style={styles.sectionSubtitle}>
            Sometimes it's hard to find the right words - that's okay
          </Text>
          <TextInput
            style={styles.textInput}
            placeholder="I feel somehow... / I'm not quite sure, but... / Today is..."
            placeholderTextColor={Colors.textLight}
            multiline
            value={description}
            onChangeText={setDescription}
          />
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <Button
          title="Save Check-in"
          onPress={handleSave}
          loading={loading}
          disabled={moodScore === null}
        />
      </View>
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
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 20,
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 8,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginBottom: 16,
  },
  moodOptions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
  },
  moodOption: {
    flex: 1,
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    backgroundColor: Colors.surface,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  moodLabel: {
    fontSize: 11,
    color: Colors.textSecondary,
    marginTop: 6,
    textAlign: 'center',
  },
  selectedMoodDisplay: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 16,
    marginTop: 16,
    gap: 12,
  },
  selectedMoodText: {
    fontSize: 20,
    fontWeight: '600',
  },
  emotionTags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  emotionTag: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 24,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  emotionTagSelected: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  emotionTagText: {
    fontSize: 14,
    color: Colors.text,
  },
  emotionTagTextSelected: {
    color: '#fff',
  },
  textInput: {
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: 16,
    fontSize: 15,
    color: Colors.text,
    minHeight: 120,
    textAlignVertical: 'top',
    lineHeight: 22,
  },
  footer: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
});
