import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../src/constants/colors';
import { Button, Input } from '../../src/components';
import { useAuthStore } from '../../src/store/authStore';
import api from '../../src/services/api';

export default function PartnerRegisterScreen() {
  const router = useRouter();
  const { register, isLoading } = useAuthStore();
  
  const [step, setStep] = useState<'account' | 'code'>('account');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [inviteCode, setInviteCode] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [linking, setLinking] = useState(false);

  const validateAccount = () => {
    const newErrors: Record<string, string> = {};
    
    if (!name.trim()) newErrors.name = 'Name is required';
    if (!email) newErrors.email = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(email)) newErrors.email = 'Please enter a valid email';
    if (!password) newErrors.password = 'Password is required';
    else if (password.length < 6) newErrors.password = 'Password must be at least 6 characters';
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleCreateAccount = async () => {
    if (!validateAccount()) return;
    
    try {
      await register(email, password, name, 'partner');
      setStep('code');
    } catch (error: any) {
      Alert.alert('Registration Failed', error.message);
    }
  };

  const handleLinkAccount = async () => {
    if (!inviteCode.trim()) {
      setErrors({ inviteCode: 'Please enter the invite code' });
      return;
    }
    
    setLinking(true);
    try {
      const response = await api.post(`/partner/accept/${inviteCode}`);
      Alert.alert(
        'Successfully Linked!',
        `You are now connected with ${response.data.primary_user_name}`,
        [{ text: 'Continue', onPress: () => router.replace('/(tabs)') }]
      );
    } catch (error: any) {
      Alert.alert('Link Failed', error.response?.data?.detail || 'Invalid or expired invite code');
    } finally {
      setLinking(false);
    }
  };

  const handleSkip = () => {
    router.replace('/(tabs)');
  };

  if (step === 'code') {
    return (
      <SafeAreaView style={styles.container}>
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={styles.header}>
            <View style={styles.iconContainer}>
              <Ionicons name="link" size={40} color={Colors.secondary} />
            </View>
            <Text style={styles.title}>Enter Invite Code</Text>
            <Text style={styles.subtitle}>
              Ask your partner to share their invite code from the Adelphi app
            </Text>
          </View>

          <View style={styles.form}>
            <Input
              label="Invite Code"
              placeholder="Enter 8-character code"
              value={inviteCode}
              onChangeText={(text) => setInviteCode(text.toUpperCase())}
              error={errors.inviteCode}
              autoCapitalize="characters"
              maxLength={8}
            />

            <Button
              title="Link Account"
              onPress={handleLinkAccount}
              loading={linking}
              size="large"
            />

            <Button
              title="Skip for now"
              onPress={handleSkip}
              variant="ghost"
              size="large"
            />

            <Text style={styles.skipNote}>
              You can link your account later from Settings
            </Text>
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color={Colors.text} />
          </TouchableOpacity>

          <View style={styles.header}>
            <View style={styles.iconContainer}>
              <Ionicons name="heart" size={40} color={Colors.primary} />
            </View>
            <Text style={styles.title}>Partner Support</Text>
            <Text style={styles.subtitle}>
              Create an account to support someone through their menopause journey
            </Text>
          </View>

          <View style={styles.form}>
            <Input
              label="Your Name"
              placeholder="Enter your name"
              value={name}
              onChangeText={setName}
              error={errors.name}
              leftIcon="person-outline"
            />

            <Input
              label="Email"
              placeholder="Enter your email"
              keyboardType="email-address"
              autoCapitalize="none"
              value={email}
              onChangeText={setEmail}
              error={errors.email}
              leftIcon="mail-outline"
            />

            <Input
              label="Password"
              placeholder="Create a password"
              secureTextEntry
              value={password}
              onChangeText={setPassword}
              error={errors.password}
              leftIcon="lock-closed-outline"
            />

            <Button
              title="Create Partner Account"
              onPress={handleCreateAccount}
              loading={isLoading}
              size="large"
            />
          </View>

          <View style={styles.footer}>
            <Text style={styles.footerText}>Already have an account? </Text>
            <TouchableOpacity onPress={() => router.push('/auth/login')}>
              <Text style={styles.footerLink}>Sign In</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingBottom: 24,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  header: {
    alignItems: 'center',
    marginTop: 24,
    marginBottom: 32,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: `${Colors.primary}15`,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
  },
  form: {
    gap: 16,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 24,
  },
  footerText: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  footerLink: {
    fontSize: 14,
    color: Colors.primary,
    fontWeight: '600',
  },
  skipNote: {
    fontSize: 13,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
});
