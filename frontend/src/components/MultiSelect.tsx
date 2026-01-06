import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  FlatList,
  SafeAreaView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../constants/colors';
import Button from './Button';

interface MultiSelectProps {
  label?: string;
  placeholder?: string;
  options: string[];
  values: string[];
  onChange: (values: string[]) => void;
  error?: string;
}

export const MultiSelect: React.FC<MultiSelectProps> = ({
  label,
  placeholder = 'Select options',
  options,
  values,
  onChange,
  error,
}) => {
  const [modalVisible, setModalVisible] = useState(false);
  const [tempValues, setTempValues] = useState<string[]>(values);

  const toggleOption = (option: string) => {
    if (tempValues.includes(option)) {
      setTempValues(tempValues.filter((v) => v !== option));
    } else {
      setTempValues([...tempValues, option]);
    }
  };

  const handleSave = () => {
    onChange(tempValues);
    setModalVisible(false);
  };

  const handleOpen = () => {
    setTempValues(values);
    setModalVisible(true);
  };

  return (
    <View style={styles.container}>
      {label && <Text style={styles.label}>{label}</Text>}
      <TouchableOpacity
        style={[styles.selectButton, error && styles.selectError]}
        onPress={handleOpen}
      >
        <Text style={[styles.selectText, values.length === 0 && styles.placeholder]}>
          {values.length > 0 ? `${values.length} selected` : placeholder}
        </Text>
        <Ionicons name="chevron-down" size={20} color={Colors.textSecondary} />
      </TouchableOpacity>
      
      {values.length > 0 && (
        <View style={styles.tagsContainer}>
          {values.map((v) => (
            <View key={v} style={styles.tag}>
              <Text style={styles.tagText}>{v}</Text>
              <TouchableOpacity onPress={() => onChange(values.filter((val) => val !== v))}>
                <Ionicons name="close-circle" size={16} color={Colors.textSecondary} />
              </TouchableOpacity>
            </View>
          ))}
        </View>
      )}
      
      {error && <Text style={styles.error}>{error}</Text>}

      <Modal
        visible={modalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setModalVisible(false)}
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{label || 'Select'}</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Ionicons name="close" size={24} color={Colors.text} />
              </TouchableOpacity>
            </View>
            <FlatList
              data={options}
              keyExtractor={(item) => item}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[
                    styles.optionItem,
                    tempValues.includes(item) && styles.optionSelected,
                  ]}
                  onPress={() => toggleOption(item)}
                >
                  <Text
                    style={[
                      styles.optionText,
                      tempValues.includes(item) && styles.optionTextSelected,
                    ]}
                  >
                    {item}
                  </Text>
                  <View style={[
                    styles.checkbox,
                    tempValues.includes(item) && styles.checkboxSelected,
                  ]}>
                    {tempValues.includes(item) && (
                      <Ionicons name="checkmark" size={14} color="#fff" />
                    )}
                  </View>
                </TouchableOpacity>
              )}
            />
            <View style={styles.modalFooter}>
              <Button title="Done" onPress={handleSave} />
            </View>
          </View>
        </SafeAreaView>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.text,
    marginBottom: 8,
  },
  selectButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  selectError: {
    borderColor: Colors.error,
  },
  selectText: {
    fontSize: 16,
    color: Colors.text,
  },
  placeholder: {
    color: Colors.textLight,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 8,
    gap: 8,
  },
  tag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: `${Colors.primary}15`,
    borderRadius: 16,
    paddingVertical: 4,
    paddingHorizontal: 12,
    gap: 4,
  },
  tagText: {
    fontSize: 13,
    color: Colors.primary,
  },
  error: {
    fontSize: 12,
    color: Colors.error,
    marginTop: 4,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: Colors.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '70%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text,
  },
  optionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  optionSelected: {
    backgroundColor: `${Colors.primary}10`,
  },
  optionText: {
    fontSize: 16,
    color: Colors.text,
  },
  optionTextSelected: {
    color: Colors.primary,
    fontWeight: '500',
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxSelected: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  modalFooter: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
});

export default MultiSelect;
