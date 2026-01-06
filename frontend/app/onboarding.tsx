import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../src/constants/colors';
import { Button, Input, SelectDropdown, MultiSelect } from '../src/components';
import { AGE_RANGES, ETHNICITIES, COUNTRIES, MENOPAUSE_STAGES, MEDICAL_CONDITIONS } from '../src/constants';
import { useAuthStore } from '../src/store/authStore';
import api from '../src/services/api';

const TOTAL_STEPS = 4;

export default function OnboardingScreen() {
  const router = useRouter();
  const { updateUser } = useAuthStore();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);

  // Form data
  const [ageRange, setAgeRange] = useState<string | null>(null);
  const [ethnicity, setEthnicity] = useState<string | null>(null);
  const [country, setCountry] = useState<string | null>(null);
  const [menopauseStage, setMenopauseStage] = useState<string | null>(null);
  const [medicalConditions, setMedicalConditions] = useState<string[]>([]);
  const [medicalNotes, setMedicalNotes] = useState('');
  const [consentDataStorage, setConsentDataStorage] = useState(false);
  const [consentResearch, setConsentResearch] = useState(false);
  const [consentPartnerInvites, setConsentPartnerInvites] = useState(false);

  const handleNext = () => {
    if (step < TOTAL_STEPS) {
      setStep(step + 1);
    } else {
      handleComplete();
    }
  };

  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1);
    }
  };

  const handleComplete = async () => {
    if (!consentDataStorage) {
      Alert.alert('Consent Required', 'Please accept the data storage consent to continue.');
      return;
    }

    setLoading(true);
    try {
      await api.post('/onboarding/complete', {
        age_range: ageRange,
        ethnicity,
        country,
        menopause_stage: menopauseStage,
        medical_conditions: medicalConditions,
        medical_notes: medicalNotes,
        consent_data_storage: consentDataStorage,
        consent_research: consentResearch,
        consent_partner_invites: consentPartnerInvites,
      });

      updateUser({ has_completed_onboarding: true });
      router.replace('/(tabs)');
    } catch (error: any) {
      Alert.alert('Error', 'Failed to save your information. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const renderStep1 = () => (
    <View style={styles.stepContent}>
      <Text style={styles.stepTitle}>Tell us about yourself</Text>
      <Text style={styles.stepSubtitle}>
        This helps us personalize your experience. All fields are optional.
      </Text>

      <SelectDropdown
        label="Age Range"
        placeholder="Select your age range"
        options={AGE_RANGES}
        value={ageRange}
        onChange={setAgeRange}
      />

      <SelectDropdown
        label="Ethnicity"
        placeholder="Select your ethnicity"
        options={ETHNICITIES}
        value={ethnicity}
        onChange={setEthnicity}
      />

      <SelectDropdown
        label="Country / Region"
        placeholder="Select your country"
        options={COUNTRIES}
        value={country}
        onChange={setCountry}
      />
    </View>
  );

  const renderStep2 = () => (
    <View style={styles.stepContent}>
      <Text style={styles.stepTitle}>Your Menopause Stage</Text>
      <Text style={styles.stepSubtitle}>
        This helps us show you relevant content and features.
      </Text>

      <View style={styles.stageOptions}>
        {MENOPAUSE_STAGES.map((stage) => (
          <TouchableOpacity
            key={stage.value}
            style={[
              styles.stageOption,
              menopauseStage === stage.value && styles.stageOptionSelected,
            ]}
            onPress={() => setMenopauseStage(stage.value)}
          >
            <Text
              style={[
                styles.stageOptionText,
                menopauseStage === stage.value && styles.stageOptionTextSelected,
              ]}
            >
              {stage.label}
            </Text>
            {menopauseStage === stage.value && (
              <Ionicons name="checkmark-circle" size={20} color={Colors.primary} />
            )}
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  const renderStep3 = () => (
    <View style={styles.stepContent}>
      <Text style={styles.stepTitle}>Health Information</Text>
      <Text style={styles.stepSubtitle}>
        Select any conditions relevant to exercise or recommendations.
      </Text>

      <MultiSelect
        label="Medical Conditions"
        placeholder="Select any that apply"
        options={MEDICAL_CONDITIONS}
        values={medicalConditions}
        onChange={setMedicalConditions}
      />

      <Input
        label="Additional Notes (optional)"
        placeholder="Any other health information you'd like to share..."
        value={medicalNotes}
        onChangeText={setMedicalNotes}
        multiline
        numberOfLines={3}
      />
    </View>
  );

  const renderStep4 = () => (
    <View style={styles.stepContent}>
      <Text style={styles.stepTitle}>Consent & Privacy</Text>
      <Text style={styles.stepSubtitle}>
        We take your privacy seriously. Please review and consent to the following.
      </Text>

      <TouchableOpacity
        style={styles.consentItem}
        onPress={() => setConsentDataStorage(!consentDataStorage)}
      >
        <View style={[
          styles.checkbox,
          consentDataStorage && styles.checkboxChecked,
        ]}>
          {consentDataStorage && (
            <Ionicons name="checkmark" size={14} color="#fff" />
          )}
        </View>
        <View style={styles.consentTextContainer}>
          <Text style={styles.consentLabel}>Data Storage & Processing *</Text>
          <Text style={styles.consentDescription}>
            I consent to Adelphi storing and processing my data to provide personalized support.
          </Text>
        </View>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.consentItem}
        onPress={() => setConsentResearch(!consentResearch)}
      >
        <View style={[
          styles.checkbox,
          consentResearch && styles.checkboxChecked,
        ]}>
          {consentResearch && (
            <Ionicons name="checkmark" size={14} color="#fff" />
          )}
        </View>
        <View style={styles.consentTextContainer}>
          <Text style={styles.consentLabel}>Research & Analytics (Optional)</Text>
          <Text style={styles.consentDescription}>
            I consent to my anonymized data being used for menopause research.
          </Text>
        </View>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.consentItem}
        onPress={() => setConsentPartnerInvites(!consentPartnerInvites)}
      >
        <View style={[
          styles.checkbox,
          consentPartnerInvites && styles.checkboxChecked,
        ]}>
          {consentPartnerInvites && (
            <Ionicons name="checkmark" size={14} color="#fff" />
          )}
        </View>
        <View style={styles.consentTextContainer}>
          <Text style={styles.consentLabel}>Partner Invitations (Optional)</Text>
          <Text style={styles.consentDescription}>
            I may want to invite a partner to support me through the app.
          </Text>
        </View>
      </TouchableOpacity>

      <View style={styles.disclaimer}>
        <Ionicons name="information-circle" size={20} color={Colors.info} />
        <Text style={styles.disclaimerText}>
          This app does not replace professional medical advice. Always consult your healthcare provider for medical decisions.
        </Text>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.progressContainer}>
          {[1, 2, 3, 4].map((s) => (
            <View
              key={s}
              style={[
                styles.progressDot,
                s <= step && styles.progressDotActive,
              ]}
            />
          ))}
        </View>
        <Text style={styles.progressText}>Step {step} of {TOTAL_STEPS}</Text>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {step === 1 && renderStep1()}
        {step === 2 && renderStep2()}
        {step === 3 && renderStep3()}
        {step === 4 && renderStep4()}
      </ScrollView>

      <View style={styles.footer}>
        {step > 1 && (
          <Button
            title="Back"
            onPress={handleBack}
            variant="outline"
            style={styles.backButton}
          />
        )}
        <Button
          title={step === TOTAL_STEPS ? 'Get Started' : 'Continue'}
          onPress={handleNext}
          loading={loading}
          style={styles.nextButton}
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
    paddingHorizontal: 24,
    paddingTop: 16,
    alignItems: 'center',
  },
  progressContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  progressDot: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: Colors.border,
  },
  progressDotActive: {
    backgroundColor: Colors.primary,
  },
  progressText: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginTop: 8,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 24,
  },
  stepContent: {
    gap: 8,
  },
  stepTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: 8,
  },
  stepSubtitle: {
    fontSize: 15,
    color: Colors.textSecondary,
    marginBottom: 24,
    lineHeight: 22,
  },
  stageOptions: {
    gap: 12,
  },
  stageOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.surface,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  stageOptionSelected: {
    borderColor: Colors.primary,
    backgroundColor: `${Colors.primary}10`,
  },
  stageOptionText: {
    fontSize: 16,
    color: Colors.text,
  },
  stageOptionTextSelected: {
    color: Colors.primary,
    fontWeight: '500',
  },
  consentItem: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  checkboxChecked: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  consentTextContainer: {
    flex: 1,
  },
  consentLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 4,
  },
  consentDescription: {
    fontSize: 13,
    color: Colors.textSecondary,
    lineHeight: 18,
  },
  disclaimer: {
    flexDirection: 'row',
    gap: 12,
    backgroundColor: `${Colors.info}15`,
    padding: 16,
    borderRadius: 12,
    marginTop: 16,
  },
  disclaimerText: {
    flex: 1,
    fontSize: 13,
    color: Colors.info,
    lineHeight: 18,
  },
  footer: {
    flexDirection: 'row',
    padding: 24,
    gap: 12,
  },
  backButton: {
    flex: 1,
  },
  nextButton: {
    flex: 2,
  },
});
