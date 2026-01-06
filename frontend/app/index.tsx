import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuthStore } from '../src/store/authStore';
import { Colors } from '../src/constants/colors';
import { Button } from '../src/components';

// Import the logo
const adelpheLogo = require('../assets/images/adelphe-logo.png');

export default function SplashScreen() {
  const router = useRouter();
  const { user, isInitialized } = useAuthStore();

  useEffect(() => {
    if (isInitialized) {
      if (user) {
        if (!user.has_completed_onboarding && user.role === 'primary') {
          router.replace('/onboarding');
        } else {
          router.replace('/(tabs)');
        }
      }
    }
  }, [isInitialized, user]);

  if (user) {
    return (
      <View style={styles.container}>
        <View style={styles.logoContainer}>
          <Text style={styles.title}>Adelphe Connect</Text>
          <Text style={styles.subtitle}>Menopause Companion</Text>
          <Image 
            source={adelpheLogo} 
            style={styles.logo}
            resizeMode="contain"
          />
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.logoContainer}>
        <Text style={styles.title}>Adelphe Connect</Text>
        <Text style={styles.subtitle}>Menopause Companion</Text>
        <Image 
          source={adelpheLogo} 
          style={styles.logo}
          resizeMode="contain"
        />
      </View>

      <View style={styles.content}>
        <Text style={styles.welcomeTitle}>Welcome</Text>
        <Text style={styles.welcomeText}>
          Your personal companion for understanding and managing menopause with confidence and support.
        </Text>
      </View>

      <View style={styles.buttons}>
        <Button
          title="Get Started"
          onPress={() => router.push('/auth/register')}
          size="large"
        />
        <Button
          title="I already have an account"
          onPress={() => router.push('/auth/login')}
          variant="ghost"
          size="large"
        />
        <Text style={styles.partnerLink}>
          Are you here to support someone?
        </Text>
        <Button
          title="Partner Access"
          onPress={() => router.push('/auth/partner-register')}
          variant="outline"
          size="small"
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
    paddingHorizontal: 24,
    paddingTop: 80,
    paddingBottom: 40,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  logoCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  logoText: {
    fontSize: 40,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: Colors.text,
  },
  subtitle: {
    fontSize: 16,
    color: Colors.textSecondary,
    marginTop: 4,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  welcomeTitle: {
    fontSize: 28,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 16,
    textAlign: 'center',
  },
  welcomeText: {
    fontSize: 16,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
    paddingHorizontal: 20,
  },
  buttons: {
    gap: 12,
    alignItems: 'center',
  },
  partnerLink: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginTop: 16,
    marginBottom: 8,
  },
});
