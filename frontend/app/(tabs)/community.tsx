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

interface Group {
  id: string;
  name: string;
  description: string;
  topics: string[];
  member_count: number;
}

interface Event {
  id: string;
  title: string;
  description: string;
  event_type: string;
  is_online: boolean;
  start_time: string;
}

export default function CommunityScreen() {
  const router = useRouter();
  const [tab, setTab] = useState<'groups' | 'events'>('groups');
  const [groups, setGroups] = useState<Group[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [joinedGroups, setJoinedGroups] = useState<string[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = async () => {
    try {
      const [groupsRes, eventsRes, joinedRes] = await Promise.all([
        api.get('/groups'),
        api.get('/events'),
        api.get('/groups/joined'),
      ]);
      setGroups(groupsRes.data);
      setEvents(eventsRes.data);
      setJoinedGroups(joinedRes.data.map((g: Group) => g.id));
    } catch (error) {
      console.error('Failed to fetch community data:', error);
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

  const handleJoinGroup = async (groupId: string) => {
    try {
      if (joinedGroups.includes(groupId)) {
        await api.delete(`/groups/${groupId}/leave`);
        setJoinedGroups(joinedGroups.filter(id => id !== groupId));
      } else {
        await api.post(`/groups/${groupId}/join`);
        setJoinedGroups([...joinedGroups, groupId]);
      }
    } catch (error) {
      console.error('Failed to join/leave group:', error);
    }
  };

  const formatEventDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  };

  const getEventTypeIcon = (type: string) => {
    switch (type) {
      case 'webinar': return 'videocam';
      case 'walk': return 'walk';
      case 'exercise': return 'fitness';
      default: return 'calendar';
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Community</Text>
        <Text style={styles.subtitle}>Connect, share, and support each other</Text>
      </View>

      {/* Tabs */}
      <View style={styles.tabs}>
        <TouchableOpacity
          style={[styles.tab, tab === 'groups' && styles.tabActive]}
          onPress={() => setTab('groups')}
        >
          <Ionicons
            name="people"
            size={20}
            color={tab === 'groups' ? Colors.primary : Colors.textSecondary}
          />
          <Text style={[styles.tabText, tab === 'groups' && styles.tabTextActive]}>
            Groups
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, tab === 'events' && styles.tabActive]}
          onPress={() => setTab('events')}
        >
          <Ionicons
            name="calendar"
            size={20}
            color={tab === 'events' ? Colors.primary : Colors.textSecondary}
          />
          <Text style={[styles.tabText, tab === 'events' && styles.tabTextActive]}>
            Events
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {tab === 'groups' ? (
          <>
            {groups.map((group) => (
              <Card key={group.id} style={styles.groupCard}>
                <TouchableOpacity
                  onPress={() => router.push(`/community/${group.id}`)}
                  style={styles.groupContent}
                >
                  <View style={styles.groupIcon}>
                    <Ionicons name="people" size={24} color={Colors.primary} />
                  </View>
                  <View style={styles.groupInfo}>
                    <Text style={styles.groupName}>{group.name}</Text>
                    <Text style={styles.groupDesc} numberOfLines={2}>
                      {group.description}
                    </Text>
                    <View style={styles.groupMeta}>
                      <Ionicons name="person" size={14} color={Colors.textSecondary} />
                      <Text style={styles.groupMembers}>
                        {group.member_count} members
                      </Text>
                    </View>
                  </View>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.joinButton,
                    joinedGroups.includes(group.id) && styles.joinedButton,
                  ]}
                  onPress={() => handleJoinGroup(group.id)}
                >
                  <Text
                    style={[
                      styles.joinButtonText,
                      joinedGroups.includes(group.id) && styles.joinedButtonText,
                    ]}
                  >
                    {joinedGroups.includes(group.id) ? 'Joined' : 'Join'}
                  </Text>
                </TouchableOpacity>
              </Card>
            ))}
          </>
        ) : (
          <>
            {events.map((event) => (
              <Card
                key={event.id}
                style={styles.eventCard}
                onPress={() => router.push(`/community/event/${event.id}`)}
              >
                <View style={styles.eventHeader}>
                  <View style={[styles.eventIcon, { backgroundColor: `${Colors.secondary}15` }]}>
                    <Ionicons
                      name={getEventTypeIcon(event.event_type) as any}
                      size={24}
                      color={Colors.secondary}
                    />
                  </View>
                  <View style={styles.eventBadge}>
                    <Text style={styles.eventBadgeText}>
                      {event.is_online ? 'Online' : 'In Person'}
                    </Text>
                  </View>
                </View>
                <Text style={styles.eventTitle}>{event.title}</Text>
                <Text style={styles.eventDesc} numberOfLines={2}>
                  {event.description}
                </Text>
                <View style={styles.eventTime}>
                  <Ionicons name="time" size={16} color={Colors.primary} />
                  <Text style={styles.eventTimeText}>
                    {formatEventDate(event.start_time)}
                  </Text>
                </View>
              </Card>
            ))}
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
  header: {
    paddingHorizontal: 20,
    paddingTop: 8,
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
  },
  tabs: {
    flexDirection: 'row',
    marginHorizontal: 20,
    marginTop: 20,
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: 4,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 10,
    gap: 8,
  },
  tabActive: {
    backgroundColor: `${Colors.primary}15`,
  },
  tabText: {
    fontSize: 15,
    fontWeight: '500',
    color: Colors.textSecondary,
  },
  tabTextActive: {
    color: Colors.primary,
  },
  content: {
    flex: 1,
    marginTop: 16,
  },
  contentContainer: {
    padding: 20,
    paddingTop: 0,
  },
  groupCard: {
    marginBottom: 12,
  },
  groupContent: {
    flexDirection: 'row',
    gap: 12,
  },
  groupIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: `${Colors.primary}15`,
    alignItems: 'center',
    justifyContent: 'center',
  },
  groupInfo: {
    flex: 1,
  },
  groupName: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
  },
  groupDesc: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginTop: 4,
    lineHeight: 18,
  },
  groupMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 8,
  },
  groupMembers: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  joinButton: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
    alignSelf: 'flex-start',
    marginTop: 12,
  },
  joinedButton: {
    backgroundColor: `${Colors.secondary}15`,
  },
  joinButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },
  joinedButtonText: {
    color: Colors.secondary,
  },
  eventCard: {
    marginBottom: 12,
  },
  eventHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  eventIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  eventBadge: {
    backgroundColor: `${Colors.info}15`,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  eventBadgeText: {
    fontSize: 12,
    color: Colors.info,
    fontWeight: '500',
  },
  eventTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 6,
  },
  eventDesc: {
    fontSize: 14,
    color: Colors.textSecondary,
    lineHeight: 20,
  },
  eventTime: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 12,
  },
  eventTimeText: {
    fontSize: 14,
    color: Colors.primary,
    fontWeight: '500',
  },
});
