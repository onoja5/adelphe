import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  RefreshControl,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../src/constants/colors';
import { Card, Button } from '../../src/components';
import api from '../../src/services/api';

interface Group {
  id: string;
  name: string;
  description: string;
  topics: string[];
  member_count: number;
}

interface Post {
  id: string;
  user_name: string;
  content: string;
  reactions: Record<string, number>;
  comment_count: number;
  created_at: string;
}

export default function GroupDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [group, setGroup] = useState<Group | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [newPostContent, setNewPostContent] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [posting, setPosting] = useState(false);
  const [isJoined, setIsJoined] = useState(false);

  useEffect(() => {
    fetchData();
  }, [id]);

  const fetchData = async () => {
    if (!id) return;
    
    try {
      const [groupsRes, postsRes, joinedRes] = await Promise.all([
        api.get('/groups'),
        api.get(`/groups/${id}/posts`),
        api.get('/groups/joined'),
      ]);
      
      const foundGroup = groupsRes.data.find((g: Group) => g.id === id);
      setGroup(foundGroup || null);
      setPosts(postsRes.data);
      setIsJoined(joinedRes.data.some((g: Group) => g.id === id));
    } catch (error) {
      console.error('Failed to fetch group data:', error);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  };

  const handleJoin = async () => {
    if (!id) return;
    
    try {
      if (isJoined) {
        await api.delete(`/groups/${id}/leave`);
      } else {
        await api.post(`/groups/${id}/join`);
      }
      setIsJoined(!isJoined);
    } catch (error) {
      console.error('Failed to join/leave group:', error);
    }
  };

  const handleCreatePost = async () => {
    if (!id || !newPostContent.trim()) {
      Alert.alert('Empty Post', 'Please write something to share.');
      return;
    }
    
    setPosting(true);
    try {
      await api.post('/posts', {
        group_id: id,
        content: newPostContent.trim(),
      });
      setNewPostContent('');
      fetchData();
    } catch (error) {
      Alert.alert('Error', 'Failed to create post. Please try again.');
    } finally {
      setPosting(false);
    }
  };

  const handleReact = async (postId: string, reaction: string) => {
    try {
      await api.post(`/posts/${postId}/react/${reaction}`);
      fetchData();
    } catch (error) {
      console.error('Failed to react:', error);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    
    if (hours < 1) return 'Just now';
    if (hours < 24) return `${hours}h ago`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  if (!group) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color={Colors.text} />
          </TouchableOpacity>
        </View>
        <View style={styles.loading}>
          <Text style={styles.loadingText}>Loading...</Text>
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
        <Text style={styles.headerTitle} numberOfLines={1}>{group.name}</Text>
        <TouchableOpacity
          style={[
            styles.joinButton,
            isJoined && styles.joinedButton,
          ]}
          onPress={handleJoin}
        >
          <Text style={[
            styles.joinButtonText,
            isJoined && styles.joinedButtonText,
          ]}>
            {isJoined ? 'Joined' : 'Join'}
          </Text>
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.flex}
      >
        <ScrollView
          style={styles.content}
          contentContainerStyle={styles.contentContainer}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
        >
          {/* Group Info */}
          <Card style={styles.groupInfo}>
            <Text style={styles.groupDescription}>{group.description}</Text>
            <View style={styles.groupMeta}>
              <Ionicons name="people" size={16} color={Colors.textSecondary} />
              <Text style={styles.memberCount}>{group.member_count} members</Text>
            </View>
            {group.topics.length > 0 && (
              <View style={styles.topics}>
                {group.topics.map((topic, i) => (
                  <View key={i} style={styles.topicTag}>
                    <Text style={styles.topicTagText}>{topic}</Text>
                  </View>
                ))}
              </View>
            )}
          </Card>

          {/* Posts */}
          <Text style={styles.sectionTitle}>Posts</Text>
          
          {posts.length === 0 ? (
            <View style={styles.emptyPosts}>
              <Ionicons name="chatbubble-outline" size={40} color={Colors.textLight} />
              <Text style={styles.emptyText}>No posts yet</Text>
              <Text style={styles.emptySubtext}>Be the first to share something!</Text>
            </View>
          ) : (
            posts.map((post) => (
              <Card key={post.id} style={styles.postCard}>
                <View style={styles.postHeader}>
                  <View style={styles.postAvatar}>
                    <Text style={styles.postAvatarText}>
                      {post.user_name.charAt(0).toUpperCase()}
                    </Text>
                  </View>
                  <View style={styles.postInfo}>
                    <Text style={styles.postAuthor}>{post.user_name}</Text>
                    <Text style={styles.postDate}>{formatDate(post.created_at)}</Text>
                  </View>
                </View>
                <Text style={styles.postContent}>{post.content}</Text>
                <View style={styles.postActions}>
                  <View style={styles.reactions}>
                    {['❤️', '👍', '🤗'].map((emoji) => (
                      <TouchableOpacity
                        key={emoji}
                        style={styles.reactionButton}
                        onPress={() => handleReact(post.id, emoji)}
                      >
                        <Text style={styles.reactionEmoji}>{emoji}</Text>
                        {post.reactions[emoji] > 0 && (
                          <Text style={styles.reactionCount}>{post.reactions[emoji]}</Text>
                        )}
                      </TouchableOpacity>
                    ))}
                  </View>
                  <TouchableOpacity
                    style={styles.commentButton}
                    onPress={() => router.push(`/community/post/${post.id}`)}
                  >
                    <Ionicons name="chatbubble-outline" size={18} color={Colors.textSecondary} />
                    <Text style={styles.commentCount}>{post.comment_count}</Text>
                  </TouchableOpacity>
                </View>
              </Card>
            ))
          )}
        </ScrollView>

        {/* New Post Input */}
        {isJoined && (
          <View style={styles.newPostContainer}>
            <TextInput
              style={styles.newPostInput}
              placeholder="Share something with the group..."
              placeholderTextColor={Colors.textLight}
              value={newPostContent}
              onChangeText={setNewPostContent}
              multiline
            />
            <TouchableOpacity
              style={[
                styles.sendButton,
                !newPostContent.trim() && styles.sendButtonDisabled,
              ]}
              onPress={handleCreatePost}
              disabled={!newPostContent.trim() || posting}
            >
              <Ionicons
                name="send"
                size={20}
                color={newPostContent.trim() ? '#fff' : Colors.textLight}
              />
            </TouchableOpacity>
          </View>
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  flex: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
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
    flex: 1,
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text,
  },
  joinButton: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
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
  loading: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: Colors.textSecondary,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 20,
  },
  groupInfo: {
    marginBottom: 20,
  },
  groupDescription: {
    fontSize: 15,
    color: Colors.textSecondary,
    lineHeight: 22,
    marginBottom: 12,
  },
  groupMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  memberCount: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  topics: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 12,
  },
  topicTag: {
    backgroundColor: `${Colors.primary}15`,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  topicTagText: {
    fontSize: 13,
    color: Colors.primary,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 12,
  },
  emptyPosts: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 16,
    color: Colors.textSecondary,
    marginTop: 12,
  },
  emptySubtext: {
    fontSize: 14,
    color: Colors.textLight,
    marginTop: 4,
  },
  postCard: {
    marginBottom: 12,
  },
  postHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  postAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  postAvatarText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
  },
  postInfo: {
    marginLeft: 12,
  },
  postAuthor: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.text,
  },
  postDate: {
    fontSize: 13,
    color: Colors.textLight,
  },
  postContent: {
    fontSize: 15,
    color: Colors.text,
    lineHeight: 22,
    marginBottom: 16,
  },
  postActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
    paddingTop: 12,
  },
  reactions: {
    flexDirection: 'row',
    gap: 12,
  },
  reactionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  reactionEmoji: {
    fontSize: 18,
  },
  reactionCount: {
    fontSize: 13,
    color: Colors.textSecondary,
  },
  commentButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  commentCount: {
    fontSize: 13,
    color: Colors.textSecondary,
  },
  newPostContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    padding: 16,
    backgroundColor: Colors.surface,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    gap: 12,
  },
  newPostInput: {
    flex: 1,
    backgroundColor: Colors.background,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 15,
    color: Colors.text,
    maxHeight: 100,
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: Colors.surfaceSecondary,
  },
});
