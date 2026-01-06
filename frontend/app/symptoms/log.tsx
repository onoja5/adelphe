import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  TextInput,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../src/constants/colors';
import { Button, Card, SelectDropdown } from '../../src/components';
import api from '../../src/services/api';

interface Symptom {
  id: string;
  name: string;
  description: string;
  category: string;
}

interface SelectedSymptom {
  symptom: Symptom;
  severity: string;
  severity_score: number;
  frequency: string;
  notes: string;
}

const SEVERITY_OPTIONS = [
  { value: 'mild', label: 'Mild' },
  { value: 'moderate', label: 'Moderate' },
  { value: 'severe', label: 'Severe' },
];

const FREQUENCY_OPTIONS = [
  { value: 'rare', label: 'Rare' },
  { value: 'sometimes', label: 'Sometimes' },
  { value: 'often', label: 'Often' },
  { value: 'constant', label: 'Constant' },
];

const CATEGORIES = ['all', 'physical', 'emotional', 'cognitive'];

export default function LogSymptomsScreen() {
  const router = useRouter();
  const [symptoms, setSymptoms] = useState<Symptom[]>([]);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedSymptoms, setSelectedSymptoms] = useState<SelectedSymptom[]>([]);
  const [step, setStep] = useState<'select' | 'details'>('select');
  const [loading, setLoading] = useState(false);
  const [currentDetailIndex, setCurrentDetailIndex] = useState(0);

  useEffect(() => {
    fetchSymptoms();
  }, []);

  const fetchSymptoms = async () => {
    try {
      const response = await api.get('/symptoms');
      setSymptoms(response.data);
    } catch (error) {
      console.error('Failed to fetch symptoms:', error);
    }
  };

  const filteredSymptoms = selectedCategory === 'all'
    ? symptoms
    : symptoms.filter(s => s.category === selectedCategory);

  const toggleSymptom = (symptom: Symptom) => {
    const exists = selectedSymptoms.find(s => s.symptom.id === symptom.id);
    if (exists) {
      setSelectedSymptoms(selectedSymptoms.filter(s => s.symptom.id !== symptom.id));
    } else {
      setSelectedSymptoms([
        ...selectedSymptoms,
        {
          symptom,
          severity: 'moderate',
          severity_score: 5,
          frequency: 'sometimes',
          notes: '',
        },
      ]);
    }
  };

  const isSelected = (symptomId: string) =>
    selectedSymptoms.some(s => s.symptom.id === symptomId);

  const updateSymptomDetail = (index: number, field: string, value: any) => {
    const updated = [...selectedSymptoms];
    updated[index] = { ...updated[index], [field]: value };
    setSelectedSymptoms(updated);
  };

  const handleContinue = () => {
    if (selectedSymptoms.length === 0) {
      Alert.alert('Select Symptoms', 'Please select at least one symptom to log.');
      return;
    }
    setStep('details');
    setCurrentDetailIndex(0);
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      // Save all symptoms
      await Promise.all(
        selectedSymptoms.map(s =>
          api.post('/symptom-logs', {
            symptom_id: s.symptom.id,
            symptom_name: s.symptom.name,
            severity: s.severity,
            severity_score: s.severity_score,
            frequency: s.frequency,
            notes: s.notes || null,
          })
        )
      );

      Alert.alert(
        'Symptoms Logged',
        `Successfully logged ${selectedSymptoms.length} symptom(s).`,
        [{ text: 'OK', onPress: () => router.back() }]
      );
    } catch (error) {
      console.error('Failed to save symptoms:', error);
      Alert.alert('Error', 'Failed to save symptoms. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const currentSymptom = selectedSymptoms[currentDetailIndex];

  if (step === 'details' && currentSymptom) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => {
              if (currentDetailIndex > 0) {
                setCurrentDetailIndex(currentDetailIndex - 1);
              } else {
                setStep('select');
              }
            }}
          >
            <Ionicons name="arrow-back" size={24} color={Colors.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Symptom Details</Text>
          <Text style={styles.progress}>
            {currentDetailIndex + 1} / {selectedSymptoms.length}
          </Text>
        </View>

        <ScrollView style={styles.scrollView} contentContainerStyle={styles.detailContent}>
          <Text style={styles.symptomName}>{currentSymptom.symptom.name}</Text>
          {currentSymptom.symptom.description && (
            <Text style={styles.symptomDesc}>{currentSymptom.symptom.description}</Text>
          )}

          {/* Severity Slider */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>How severe is it?</Text>
            <View style={styles.sliderContainer}>
              <Text style={styles.sliderLabel}>1</Text>
              <View style={styles.sliderTrack}>
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(num => (
                  <TouchableOpacity
                    key={num}
                    style={[
                      styles.sliderDot,
                      num <= currentSymptom.severity_score && styles.sliderDotActive,
                    ]}
                    onPress={() => {
                      updateSymptomDetail(currentDetailIndex, 'severity_score', num);
                      updateSymptomDetail(
                        currentDetailIndex,
                        'severity',
                        num <= 3 ? 'mild' : num <= 6 ? 'moderate' : 'severe'
                      );
                    }}
                  />
                ))}
              </View>
              <Text style={styles.sliderLabel}>10</Text>
            </View>
            <View style={styles.severityLabels}>
              <Text style={[styles.severityLabel, currentSymptom.severity === 'mild' && styles.severityLabelActive]}>
                Mild
              </Text>
              <Text style={[styles.severityLabel, currentSymptom.severity === 'moderate' && styles.severityLabelActive]}>
                Moderate
              </Text>
              <Text style={[styles.severityLabel, currentSymptom.severity === 'severe' && styles.severityLabelActive]}>
                Severe
              </Text>
            </View>
          </View>

          {/* Frequency */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>How often does it occur?</Text>
            <View style={styles.frequencyOptions}>
              {FREQUENCY_OPTIONS.map(opt => (
                <TouchableOpacity
                  key={opt.value}
                  style={[
                    styles.frequencyOption,
                    currentSymptom.frequency === opt.value && styles.frequencyOptionActive,
                  ]}
                  onPress={() => updateSymptomDetail(currentDetailIndex, 'frequency', opt.value)}
                >
                  <Text
                    style={[
                      styles.frequencyText,
                      currentSymptom.frequency === opt.value && styles.frequencyTextActive,
                    ]}
                  >
                    {opt.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Notes */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Additional notes (optional)</Text>
            <TextInput
              style={styles.notesInput}
              placeholder="Any additional details..."
              placeholderTextColor={Colors.textLight}
              multiline
              value={currentSymptom.notes}
              onChangeText={(text) => updateSymptomDetail(currentDetailIndex, 'notes', text)}
            />
          </View>
        </ScrollView>

        <View style={styles.footer}>
          {currentDetailIndex < selectedSymptoms.length - 1 ? (
            <Button
              title="Next Symptom"
              onPress={() => setCurrentDetailIndex(currentDetailIndex + 1)}
            />
          ) : (
            <Button
              title="Save All Symptoms"
              onPress={handleSave}
              loading={loading}
            />
          )}
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={Colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Log Symptoms</Text>
        <View style={{ width: 40 }} />
      </View>

      {/* Category Filter */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.categoryScroll}
        contentContainerStyle={styles.categoryContent}
      >
        {CATEGORIES.map(cat => (
          <TouchableOpacity
            key={cat}
            style={[
              styles.categoryChip,
              selectedCategory === cat && styles.categoryChipActive,
            ]}
            onPress={() => setSelectedCategory(cat)}
          >
            <Text
              style={[
                styles.categoryText,
                selectedCategory === cat && styles.categoryTextActive,
              ]}
            >
              {cat.charAt(0).toUpperCase() + cat.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Symptoms List */}
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.listContent}>
        {filteredSymptoms.map(symptom => (
          <TouchableOpacity
            key={symptom.id}
            style={[
              styles.symptomItem,
              isSelected(symptom.id) && styles.symptomItemSelected,
            ]}
            onPress={() => toggleSymptom(symptom)}
          >
            <View style={styles.symptomInfo}>
              <Text
                style={[
                  styles.symptomItemName,
                  isSelected(symptom.id) && styles.symptomItemNameSelected,
                ]}
              >
                {symptom.name}
              </Text>
              <Text style={styles.symptomCategory}>{symptom.category}</Text>
            </View>
            <View
              style={[
                styles.checkbox,
                isSelected(symptom.id) && styles.checkboxChecked,
              ]}
            >
              {isSelected(symptom.id) && (
                <Ionicons name="checkmark" size={16} color="#fff" />
              )}
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Selected Count & Continue */}
      <View style={styles.footer}>
        <View style={styles.selectedCount}>
          <Text style={styles.selectedText}>
            {selectedSymptoms.length} symptom{selectedSymptoms.length !== 1 ? 's' : ''} selected
          </Text>
        </View>
        <Button
          title="Continue"
          onPress={handleContinue}
          disabled={selectedSymptoms.length === 0}
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
  progress: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  categoryScroll: {
    maxHeight: 50,
  },
  categoryContent: {
    paddingHorizontal: 16,
    gap: 8,
  },
  categoryChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: Colors.surface,
  },
  categoryChipActive: {
    backgroundColor: Colors.primary,
  },
  categoryText: {
    fontSize: 14,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  categoryTextActive: {
    color: '#fff',
  },
  scrollView: {
    flex: 1,
  },
  listContent: {
    padding: 16,
  },
  detailContent: {
    padding: 20,
  },
  symptomItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.surface,
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  symptomItemSelected: {
    borderColor: Colors.primary,
    backgroundColor: `${Colors.primary}10`,
  },
  symptomInfo: {
    flex: 1,
  },
  symptomItemName: {
    fontSize: 16,
    fontWeight: '500',
    color: Colors.text,
  },
  symptomItemNameSelected: {
    color: Colors.primary,
  },
  symptomCategory: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginTop: 2,
    textTransform: 'capitalize',
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxChecked: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  footer: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  selectedCount: {
    marginBottom: 12,
  },
  selectedText: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  symptomName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: 8,
  },
  symptomDesc: {
    fontSize: 15,
    color: Colors.textSecondary,
    marginBottom: 24,
    lineHeight: 22,
  },
  section: {
    marginBottom: 28,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 16,
  },
  sliderContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  sliderLabel: {
    fontSize: 14,
    color: Colors.textSecondary,
    width: 20,
    textAlign: 'center',
  },
  sliderTrack: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  sliderDot: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: Colors.surfaceSecondary,
  },
  sliderDotActive: {
    backgroundColor: Colors.primary,
  },
  severityLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 12,
  },
  severityLabel: {
    fontSize: 13,
    color: Colors.textLight,
  },
  severityLabelActive: {
    color: Colors.primary,
    fontWeight: '600',
  },
  frequencyOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  frequencyOption: {
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 24,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  frequencyOptionActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  frequencyText: {
    fontSize: 14,
    color: Colors.text,
    fontWeight: '500',
  },
  frequencyTextActive: {
    color: '#fff',
  },
  notesInput: {
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: 16,
    fontSize: 15,
    color: Colors.text,
    minHeight: 100,
    textAlignVertical: 'top',
  },
});
