import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Share,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../src/constants/colors';
import { Card, Button } from '../../src/components';
import { useAuthStore } from '../../src/store/authStore';
import api from '../../src/services/api';

interface PartnerLink {
  id: string;
  primary_user_id: string;
  primary_user_name: string;
  partner_user_id: string;
  share_symptoms: boolean;
  share_mood: boolean;
  share_daily_status: boolean;
  enable_notifications: boolean;
  is_active: boolean;
}

interface Invite {
  id: string;
  invite_code: string;
  expires_at: string;
}

export default function PartnerScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [link, setLink] = useState<PartnerLink | null>(null);
  const [invite, setInvite] = useState<Invite | null>(null);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);

  // Sharing settings
  const [shareSymptoms, setShareSymptoms] = useState(true);
  const [shareMood, setShareMood] = useState(true);
  const [shareDailyStatus, setShareDailyStatus] = useState(true);
  const [enableNotifications, setEnableNotifications] = useState(true);

  useEffect(() => {
    fetchPartnerLink();
  }, []);

  const fetchPartnerLink = async () => {
    try {
      const response = await api.get('/partner/link');
      setLink(response.data);
      if (response.data) {
        setShareSymptoms(response.data.share_symptoms);
        setShareMood(response.data.share_mood);
        setShareDailyStatus(response.data.share_daily_status);
        setEnableNotifications(response.data.enable_notifications);
      }
    } catch (error) {
      console.error('Failed to fetch partner link:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateInvite = async () => {
    setCreating(true);
    try {
      const response = await api.post('/partner/invite', {
        share_symptoms: shareSymptoms,
        share_mood: shareMood,
        share_daily_status: shareDailyStatus,
        enable_notifications: enableNotifications,
      });
      setInvite(response.data);
    } catch (error) {
      Alert.alert('Error', 'Failed to create invite. Please try again.');
    } finally {
      setCreating(false);
    }
  };

  const handleShareInvite = async () => {
    if (!invite) return;
    
    try {
      await Share.share({
        message: `I'd like to connect with you on Adelphi Menopause Companion. Use this code to link our accounts: ${invite.invite_code}\n\nDownload the app and create a partner account to get started.`,
      });
    } catch (error) {
      console.error('Share failed:', error);
    }
  };

  const handleRevoke = () => {
    Alert.alert(
      'Revoke Partner Access',
      'Are you sure you want to remove partner access? They will no longer see your updates.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Revoke',
          style: 'destructive',
          onPress: async () => {
            try {
              await api.delete('/partner/link');
              setLink(null);
              Alert.alert('Access Revoked', 'Partner access has been removed.');
            } catch (error) {
              Alert.alert('Error', 'Failed to revoke access.');
            }
          },
        },
      ]
    );
  };

  const handleUpdateSettings = async () => {
    try {
      await api.put('/partner/settings', {
        share_symptoms: shareSymptoms,
        share_mood: shareMood,
        share_daily_status: shareDailyStatus,
        enable_notifications: enableNotifications,
      });
      Alert.alert('Settings Updated', 'Your sharing preferences have been saved.');
    } catch (error) {
      Alert.alert('Error', 'Failed to update settings.');
    }
  };

  // Partner user view
  if (user?.role === 'partner') {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color={Colors.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Partner Support</Text>
          <View style={{ width: 40 }} />
        </View>

        <ScrollView contentContainerStyle={styles.content}>
          {link ? (
            <>
              <Card style={styles.connectedCard}>
                <Ionicons name="heart" size={48} color={Colors.primary} />
                <Text style={styles.connectedTitle}>Connected</Text>
                <Text style={styles.connectedSubtitle}>
                  You are supporting {link.primary_user_name}
                </Text>
              </Card>

              <Button
                title="View Partner Dashboard"
                onPress={() => router.push('/partner/dashboard')}
                style={{ marginTop: 24 }}
              />
            </>
          ) : (
            <Card style={styles.notConnectedCard}>
              <Ionicons name="link-outline" size={48} color={Colors.textSecondary} />
              <Text style={styles.notConnectedTitle}>Not Connected</Text>
              <Text style={styles.notConnectedSubtitle}>
                Ask your partner to share an invite code with you
              </Text>
            </Card>
          )}
        </ScrollView>
      </SafeAreaView>
    );
  }

  // Primary user view
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={Colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Partner Support</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {link && link.is_active ? (
          // Connected state
          <>
            <Card style={styles.connectedCard}>
              <View style={styles.connectedIcon}>
                <Ionicons name="heart" size={32} color={Colors.primary} />
              </View>
              <Text style={styles.connectedTitle}>Partner Connected</Text>
              <Text style={styles.connectedSubtitle}>
                Your partner can now see your updates based on your sharing settings
              </Text>
            </Card>

            <Text style={styles.sectionTitle}>Sharing Settings</Text>
            <Text style={styles.sectionSubtitle}>
              Control what your partner can see
            </Text>

            <Card>
              <ToggleSetting
                label="Share symptom summaries"
                value={shareSymptoms}
                onChange={setShareSymptoms}
              />
              <ToggleSetting
                label="Share mood updates"
                value={shareMood}
                onChange={setShareMood}
              />
              <ToggleSetting
                label="Share daily status (easier/challenging day)"
                value={shareDailyStatus}
                onChange={setShareDailyStatus}
              />
              <ToggleSetting
                label="Send notifications to partner"
                value={enableNotifications}
                onChange={setEnableNotifications}
                isLast
              />
            </Card>

            <Button
              title="Save Settings"
              onPress={handleUpdateSettings}
              style={{ marginTop: 16 }}
            />

            <Button
              title="Revoke Partner Access"
              onPress={handleRevoke}
              variant="outline"
              style={{ marginTop: 12 }}
            />
          </>
        ) : invite ? (
          // Invite created state
          <>
            <Card style={styles.inviteCard}>
              <Ionicons name="mail" size={40} color={Colors.secondary} />
              <Text style={styles.inviteTitle}>Invite Created!</Text>
              <Text style={styles.inviteSubtitle}>
                Share this code with your partner
              </Text>
              <View style={styles.codeBox}>
                <Text style={styles.codeText}>{invite.invite_code}</Text>
              </View>
              <Text style={styles.inviteExpiry}>
                Expires: {new Date(invite.expires_at).toLocaleDateString()}
              </Text>
            </Card>

            <Button
              title="Share Invite Code"
              onPress={handleShareInvite}
              icon={<Ionicons name="share-outline" size={20} color="#fff" />}
              style={{ marginTop: 24 }}
            />

            <Button
              title="Create New Invite"
              onPress={() => setInvite(null)}
              variant="ghost"
              style={{ marginTop: 12 }}
            />
          </>
        ) : (
          // Initial state
          <>
            <Card style={styles.introCard}>
              <Ionicons name="people" size={48} color={Colors.primary} />
              <Text style={styles.introTitle}>Partner Support</Text>
              <Text style={styles.introSubtitle}>
                Invite your partner, spouse, or a trusted person to support you through your journey. They'll receive gentle updates and suggestions on how to help.
              </Text>
            </Card>

            <Text style={styles.sectionTitle}>What would you like to share?</Text>
            
            <Card>
              <ToggleSetting
                label="Share symptom summaries"
                description="High-level overview, no detailed medical info"
                value={shareSymptoms}
                onChange={setShareSymptoms}
              />
              <ToggleSetting
                label="Share mood updates"
                description="Let them know if you're having a tough day"
                value={shareMood}
                onChange={setShareMood}
              />
              <ToggleSetting
                label="Share daily status"
                description="Simple 'easier day / challenging day' signal"
                value={shareDailyStatus}
                onChange={setShareDailyStatus}
              />
              <ToggleSetting
                label="Enable notifications"
                description="Send alerts when you might need extra support"
                value={enableNotifications}
                onChange={setEnableNotifications}
                isLast
              />
            </Card>

            <View style={styles.privacyNote}>
              <Ionicons name="shield-checkmark" size={20} color={Colors.secondary} />
              <Text style={styles.privacyText}>
                Your partner will never see detailed medical information. You can revoke access at any time.
              </Text>
            </View>

            <Button
              title="Create Invite"
              onPress={handleCreateInvite}
              loading={creating}
              style={{ marginTop: 24 }}
            />
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

interface ToggleSettingProps {
  label: string;
  description?: string;
  value: boolean;
  onChange: (value: boolean) => void;
  isLast?: boolean;
}

const ToggleSetting: React.FC<ToggleSettingProps> = ({
  label,
  description,
  value,
  onChange,
  isLast,
}) => (
  <TouchableOpacity
    style={[
      styles.toggleItem,
      !isLast && styles.toggleItemBorder,
    ]}
    onPress={() => onChange(!value)}
  >
    <View style={styles.toggleInfo}>
      <Text style={styles.toggleLabel}>{label}</Text>
      {description && (
        <Text style={styles.toggleDescription}>{description}</Text>
      )}
    </View>
    <View style={[
      styles.toggle,
      value && styles.toggleActive,
    ]}>
      <View style={[
        styles.toggleCircle,
        value && styles.toggleCircleActive,
      ]} />
    </View>
  </TouchableOpacity>
);

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
  content: {
    padding: 20,
  },
  introCard: {
    alignItems: 'center',
    paddingVertical: 32,
    marginBottom: 24,
  },
  introTitle: {
    fontSize: 22,
    fontWeight: '600',
    color: Colors.text,
    marginTop: 16,
  },
  introSubtitle: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginTop: 12,
    lineHeight: 21,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 8,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginBottom: 16,
  },
  toggleItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
  },
  toggleItemBorder: {
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  toggleInfo: {
    flex: 1,
    marginRight: 12,
  },
  toggleLabel: {
    fontSize: 15,
    color: Colors.text,
  },
  toggleDescription: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  toggle: {
    width: 48,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.border,
    padding: 2,
    justifyContent: 'center',
  },
  toggleActive: {
    backgroundColor: Colors.secondary,
  },
  toggleCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#fff',
  },
  toggleCircleActive: {
    alignSelf: 'flex-end',
  },
  privacyNote: {
    flexDirection: 'row',
    gap: 10,
    backgroundColor: `${Colors.secondary}15`,
    padding: 14,
    borderRadius: 12,
    marginTop: 16,
  },
  privacyText: {
    flex: 1,
    fontSize: 13,
    color: Colors.secondary,
    lineHeight: 19,
  },
  connectedCard: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  connectedIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: `${Colors.primary}15`,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  connectedTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: Colors.text,
    marginTop: 12,
  },
  connectedSubtitle: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginTop: 8,
  },
  inviteCard: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  inviteTitle: {
    fontSize: 22,
    fontWeight: '600',
    color: Colors.text,
    marginTop: 16,
  },
  inviteSubtitle: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginTop: 8,
  },
  codeBox: {
    backgroundColor: Colors.surfaceSecondary,
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 12,
    marginTop: 20,
  },
  codeText: {
    fontSize: 28,
    fontWeight: 'bold',
    color: Colors.primary,
    letterSpacing: 4,
  },
  inviteExpiry: {
    fontSize: 12,
    color: Colors.textLight,
    marginTop: 12,
  },
  notConnectedCard: {
    alignItems: 'center',
    paddingVertical: 48,
  },
  notConnectedTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text,
    marginTop: 16,
  },
  notConnectedSubtitle: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginTop: 8,
  },
});
