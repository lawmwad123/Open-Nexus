import React from 'react';
import {
  View,
  StyleSheet,
  Modal,
  TouchableOpacity,
  Text,
  Pressable,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '@/constants/theme';
import { BlurView } from 'expo-blur';

interface UploadTypeSelectionModalProps {
  visible: boolean;
  onClose: () => void;
  onSelectType: (type: 'post' | 'challenge') => void;
}

const UploadTypeSelectionModal = ({ visible, onClose, onSelectType }: UploadTypeSelectionModalProps) => {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <BlurView intensity={20} style={styles.overlay}>
        <Pressable style={styles.overlay} onPress={onClose}>
          <View style={styles.modalContent}>
            <View style={styles.header}>
              <Text style={styles.title}>Select Upload Type</Text>
              <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                <Ionicons name="close" size={24} color={theme.colors.text} />
              </TouchableOpacity>
            </View>

            <View style={styles.optionsContainer}>
              <TouchableOpacity 
                style={styles.option}
                onPress={() => onSelectType('post')}
              >
                <Text style={styles.optionText}>Post</Text>
              </TouchableOpacity>

              <TouchableOpacity 
                style={styles.option}
                onPress={() => onSelectType('challenge')}
              >
                <Text style={styles.optionText}>Challenge</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Pressable>
      </BlurView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: theme.colors.darkLight,
    borderTopLeftRadius: theme.radius.xl,
    borderTopRightRadius: theme.radius.xl,
    padding: 20,
    paddingBottom: 40,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    color: theme.colors.text,
    fontSize: 20,
    fontFamily: 'Inter-Bold',
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: theme.colors.dark,
    justifyContent: 'center',
    alignItems: 'center',
  },
  optionsContainer: {
    gap: 20,
  },
  option: {
    padding: 15,
    backgroundColor: theme.colors.primary,
    borderRadius: theme.radius.md,
    alignItems: 'center',
  },
  optionText: {
    color: theme.colors.text,
    fontSize: 16,
    fontFamily: 'Inter-Medium',
  },
});

export default UploadTypeSelectionModal; 