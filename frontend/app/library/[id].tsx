import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../src/constants/colors';
import api from '../../src/services/api';

interface Article {
  id: string;
  title: string;
  summary: string;
  content: string;
  category: string;
  tags: string[];
  stages: string[];
  symptom_tags: string[];
  audience: string;
  created_at: string;
}

export default function ArticleDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [article, setArticle] = useState<Article | null>(null);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchArticle();
  }, [id]);

  const fetchArticle = async () => {
    if (!id) return;
    
    try {
      const response = await api.get(`/articles/${id}`);
      setArticle(response.data);
    } catch (error) {
      console.error('Failed to fetch article:', error);
      Alert.alert('Error', 'Failed to load article');
    } finally {
      setLoading(false);
    }
  };

  const toggleBookmark = async () => {
    if (!id) return;
    
    try {
      if (isBookmarked) {
        await api.delete(`/articles/bookmark/${id}`);
      } else {
        await api.post(`/articles/bookmark/${id}`);
      }
      setIsBookmarked(!isBookmarked);
    } catch (error) {
      console.error('Failed to toggle bookmark:', error);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    });
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loading}>
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!article) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color={Colors.text} />
          </TouchableOpacity>
        </View>
        <View style={styles.loading}>
          <Text style={styles.loadingText}>Article not found</Text>
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
        <TouchableOpacity style={styles.bookmarkButton} onPress={toggleBookmark}>
          <Ionicons
            name={isBookmarked ? 'bookmark' : 'bookmark-outline'}
            size={24}
            color={isBookmarked ? Colors.primary : Colors.text}
          />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
        <View style={styles.meta}>
          <View style={styles.categoryBadge}>
            <Text style={styles.categoryBadgeText}>{article.category}</Text>
          </View>
          <Text style={styles.date}>{formatDate(article.created_at)}</Text>
        </View>

        <Text style={styles.title}>{article.title}</Text>
        <Text style={styles.summary}>{article.summary}</Text>

        {/* Stages */}
        {article.stages.length > 0 && (
          <View style={styles.stagesContainer}>
            <Text style={styles.stagesLabel}>Relevant for:</Text>
            <View style={styles.stages}>
              {article.stages.map((stage, i) => (
                <View key={i} style={styles.stageBadge}>
                  <Text style={styles.stageBadgeText}>{stage}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Main Content */}
        <View style={styles.articleContent}>
          {article.content.split('\n').map((paragraph, index) => {
            // Handle bold text with **
            if (paragraph.startsWith('**') && paragraph.endsWith('**')) {
              return (
                <Text key={index} style={styles.contentHeading}>
                  {paragraph.replace(/\*\*/g, '')}
                </Text>
              );
            }
            // Handle bullet points
            if (paragraph.startsWith('- ')) {
              return (
                <View key={index} style={styles.bulletPoint}>
                  <Text style={styles.bullet}>•</Text>
                  <Text style={styles.bulletText}>{paragraph.substring(2)}</Text>
                </View>
              );
            }
            // Regular paragraph
            if (paragraph.trim()) {
              return (
                <Text key={index} style={styles.paragraph}>
                  {paragraph}
                </Text>
              );
            }
            return <View key={index} style={styles.spacer} />;
          })}
        </View>

        {/* Tags */}
        {article.tags.length > 0 && (
          <View style={styles.tagsSection}>
            <Text style={styles.tagsLabel}>Tags</Text>
            <View style={styles.tags}>
              {article.tags.map((tag, i) => (
                <View key={i} style={styles.tag}>
                  <Text style={styles.tagText}>{tag}</Text>
                </View>
              ))}
            </View>
          </View>
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
  bookmarkButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
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
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 20,
  },
  meta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  categoryBadge: {
    backgroundColor: `${Colors.primary}15`,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  categoryBadgeText: {
    fontSize: 13,
    color: Colors.primary,
    fontWeight: '500',
    textTransform: 'capitalize',
  },
  date: {
    fontSize: 13,
    color: Colors.textLight,
  },
  title: {
    fontSize: 26,
    fontWeight: 'bold',
    color: Colors.text,
    lineHeight: 34,
    marginBottom: 12,
  },
  summary: {
    fontSize: 16,
    color: Colors.textSecondary,
    lineHeight: 24,
    marginBottom: 20,
  },
  stagesContainer: {
    backgroundColor: Colors.surface,
    padding: 16,
    borderRadius: 12,
    marginBottom: 24,
  },
  stagesLabel: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginBottom: 8,
  },
  stages: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  stageBadge: {
    backgroundColor: `${Colors.secondary}15`,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  stageBadgeText: {
    fontSize: 13,
    color: Colors.secondary,
  },
  articleContent: {
    marginBottom: 24,
  },
  contentHeading: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text,
    marginTop: 20,
    marginBottom: 12,
  },
  paragraph: {
    fontSize: 16,
    color: Colors.text,
    lineHeight: 26,
    marginBottom: 12,
  },
  bulletPoint: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  bullet: {
    fontSize: 16,
    color: Colors.primary,
    marginRight: 10,
    marginTop: 2,
  },
  bulletText: {
    flex: 1,
    fontSize: 16,
    color: Colors.text,
    lineHeight: 24,
  },
  spacer: {
    height: 8,
  },
  tagsSection: {
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    paddingTop: 20,
  },
  tagsLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 12,
  },
  tags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  tag: {
    backgroundColor: Colors.surfaceSecondary,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  tagText: {
    fontSize: 13,
    color: Colors.textSecondary,
  },
});
