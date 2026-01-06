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
import { Button, SelectDropdown } from '../../src/components';
import { FOOD_TAGS, STRESS_SOURCES } from '../../src/constants';
import api from '../../src/services/api';

const SLEEP_QUALITY = [
  { value: 'poor', label: 'Poor', icon: 'sad-outline' },
  { value: 'fair', label: 'Fair', icon: 'remove-outline' },
  { value: 'good', label: 'Good', icon: 'happy-outline' },
  { value: 'excellent', label: 'Excellent', icon: 'happy' },
];

const EXERCISE_LEVELS = [
  { value: 'none', label: 'None' },
  { value: 'light', label: 'Light (walking, stretching)' },
  { value: 'moderate', label: 'Moderate (brisk walk, yoga)' },
  { value: 'intense', label: 'Intense (running, gym)' },
];

const STRESS_LEVELS = [
  { value: 'low', label: 'Low', color: Colors.secondary },
  { value: 'medium', label: 'Medium', color: Colors.warning },
  { value: 'high', label: 'High', color: Colors.error },
];

const WORK_OPTIONS = [
  { value: 'good', label: 'Good day', icon: 'thumbs-up' },
  { value: 'neutral', label: 'Neutral', icon: 'remove' },
  { value: 'tough', label: 'Tough day', icon: 'thumbs-down' },
];

export default function LifestyleLogScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  
  // Sleep
  const [sleepHours, setSleepHours] = useState('');
  const [sleepQuality, setSleepQuality] = useState<string | null>(null);
  
  // Food & Drink
  const [selectedFoodTags, setSelectedFoodTags] = useState<string[]>([]);
  const [waterIntake, setWaterIntake] = useState('');
  
  // Exercise
  const [exerciseIntensity, setExerciseIntensity] = useState<string | null>(null);
  const [exerciseMinutes, setExerciseMinutes] = useState('');
  
  // Stress
  const [stressLevel, setStressLevel] = useState<string | null>(null);
  const [stressSource, setStressSource] = useState<string | null>(null);
  
  // Work
  const [workDay, setWorkDay] = useState<string | null>(null);

  const toggleFoodTag = (tag: string) => {
    if (selectedFoodTags.includes(tag)) {
      setSelectedFoodTags(selectedFoodTags.filter(t => t !== tag));
    } else {
      setSelectedFoodTags([...selectedFoodTags, tag]);
    }
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      await api.post('/lifestyle-logs', {
        sleep_hours: sleepHours ? parseFloat(sleepHours) : null,
        sleep_quality: sleepQuality,
        food_tags: selectedFoodTags,
        water_intake: waterIntake ? parseInt(waterIntake) : null,
        exercise_intensity: exerciseIntensity,
        exercise_minutes: exerciseMinutes ? parseInt(exerciseMinutes) : null,
        stress_level: stressLevel,
        stress_source: stressSource,
        work_day: workDay,
      });

      Alert.alert(
        'Lifestyle Logged',
        'Your daily log has been saved!',
        [{ text: 'OK', onPress: () => router.back() }]
      );
    } catch (error) {
      console.error('Failed to save lifestyle:', error);
      Alert.alert('Error', 'Failed to save. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={Colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Daily Lifestyle</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
        {/* Sleep Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="moon" size={22} color={Colors.primary} />
            <Text style={styles.sectionTitle}>Sleep</Text>
          </View>
          
          <Text style={styles.label}>Hours of sleep</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g., 7.5"
            placeholderTextColor={Colors.textLight}
            keyboardType="decimal-pad"
            value={sleepHours}
            onChangeText={setSleepHours}
          />

          <Text style={styles.label}>Sleep quality</Text>
          <View style={styles.optionRow}>
            {SLEEP_QUALITY.map(opt => (
              <TouchableOpacity
                key={opt.value}
                style={[
                  styles.option,
                  sleepQuality === opt.value && styles.optionSelected,
                ]}
                onPress={() => setSleepQuality(opt.value)}
              >
                <Ionicons
                  name={opt.icon as any}
                  size={20}
                  color={sleepQuality === opt.value ? '#fff' : Colors.textSecondary}
                />
                <Text style={[
                  styles.optionText,
                  sleepQuality === opt.value && styles.optionTextSelected,
                ]}>
                  {opt.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Food & Drink Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="restaurant" size={22} color={Colors.warning} />
            <Text style={styles.sectionTitle}>Food & Drink</Text>
          </View>

          <Text style={styles.label}>What did you have today?</Text>
          <View style={styles.tags}>
            {FOOD_TAGS.map(tag => (
              <TouchableOpacity
                key={tag}
                style={[
                  styles.tag,
                  selectedFoodTags.includes(tag) && styles.tagSelected,
                ]}
                onPress={() => toggleFoodTag(tag)}
              >
                <Text style={[
                  styles.tagText,
                  selectedFoodTags.includes(tag) && styles.tagTextSelected,
                ]}>
                  {tag}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={styles.label}>Glasses of water</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g., 8"
            placeholderTextColor={Colors.textLight}
            keyboardType="number-pad"
            value={waterIntake}
            onChangeText={setWaterIntake}
          />
        </View>

        {/* Exercise Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="fitness" size={22} color={Colors.secondary} />
            <Text style={styles.sectionTitle}>Exercise</Text>
          </View>

          <SelectDropdown
            label="Activity level"
            placeholder="Select intensity"
            options={EXERCISE_LEVELS}
            value={exerciseIntensity}
            onChange={setExerciseIntensity}
          />

          {exerciseIntensity && exerciseIntensity !== 'none' && (
            <>
              <Text style={styles.label}>Minutes of exercise</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g., 30"
                placeholderTextColor={Colors.textLight}
                keyboardType="number-pad"
                value={exerciseMinutes}
                onChangeText={setExerciseMinutes}
              />
            </>
          )}
        </View>

        {/* Stress Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="pulse" size={22} color={Colors.error} />
            <Text style={styles.sectionTitle}>Stress</Text>
          </View>

          <Text style={styles.label}>Stress level today</Text>
          <View style={styles.stressRow}>
            {STRESS_LEVELS.map(level => (
              <TouchableOpacity
                key={level.value}
                style={[
                  styles.stressOption,
                  stressLevel === level.value && {
                    backgroundColor: level.color,
                    borderColor: level.color,
                  },
                ]}
                onPress={() => setStressLevel(level.value)}
              >
                <Text style={[
                  styles.stressText,
                  stressLevel === level.value && styles.stressTextSelected,
                ]}>
                  {level.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {stressLevel && stressLevel !== 'low' && (
            <SelectDropdown
              label="Main source of stress"
              placeholder="Select source"
              options={STRESS_SOURCES}
              value={stressSource}
              onChange={setStressSource}
            />
          )}
        </View>

        {/* Work Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="briefcase" size={22} color={Colors.info} />
            <Text style={styles.sectionTitle}>Work & Day</Text>
          </View>

          <Text style={styles.label}>How was your day?</Text>
          <View style={styles.workRow}>
            {WORK_OPTIONS.map(opt => (
              <TouchableOpacity
                key={opt.value}
                style={[
                  styles.workOption,
                  workDay === opt.value && styles.workOptionSelected,
                ]}
                onPress={() => setWorkDay(opt.value)}
              >
                <Ionicons
                  name={opt.icon as any}
                  size={24}
                  color={workDay === opt.value ? '#fff' : Colors.textSecondary}
                />
                <Text style={[
                  styles.workText,
                  workDay === opt.value && styles.workTextSelected,
                ]}>
                  {opt.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <Button
          title="Save Daily Log"
          onPress={handleSave}
          loading={loading}
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
    marginBottom: 28,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.text,
    marginBottom: 8,
    marginTop: 4,
  },
  input: {
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: 14,
    fontSize: 16,
    color: Colors.text,
    marginBottom: 12,
  },
  optionRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: Colors.surface,
  },
  optionSelected: {
    backgroundColor: Colors.primary,
  },
  optionText: {
    fontSize: 13,
    color: Colors.textSecondary,
  },
  optionTextSelected: {
    color: '#fff',
  },
  tags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  tag: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  tagSelected: {
    backgroundColor: Colors.warning,
    borderColor: Colors.warning,
  },
  tagText: {
    fontSize: 13,
    color: Colors.text,
  },
  tagTextSelected: {
    color: '#fff',
  },
  stressRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 16,
  },
  stressOption: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
  },
  stressText: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.text,
  },
  stressTextSelected: {
    color: '#fff',
  },
  workRow: {
    flexDirection: 'row',
    gap: 10,
  },
  workOption: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    backgroundColor: Colors.surface,
    gap: 8,
  },
  workOptionSelected: {
    backgroundColor: Colors.info,
  },
  workText: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  workTextSelected: {
    color: '#fff',
  },
  footer: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
});
