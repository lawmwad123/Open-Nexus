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

interface MediaSelectionModalProps {
  visible: boolean;
  onClose: () => void;
  onSelectOption: (option: 'takePhoto' | 'takeVideo' | 'choosePhoto' | 'chooseVideo') => void;
}

const MediaSelectionModal = ({ visible, onClose, onSelectOption }: MediaSelectionModalProps) => {
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
              <Text style={styles.title}>Add Media</Text>
              <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                <Ionicons name="close" size={24} color={theme.colors.text} />
              </TouchableOpacity>
            </View>

            <View style={styles.optionsContainer}>
              <View style={styles.optionsRow}>
                <TouchableOpacity 
                  style={styles.option}
                  onPress={() => onSelectOption('takePhoto')}
                >
                  <View style={styles.iconContainer}>
                    <Ionicons name="camera" size={32} color={theme.colors.text} />
                  </View>
                  <Text style={styles.optionText}>Take Photo</Text>
                </TouchableOpacity>

                <TouchableOpacity 
                  style={styles.option}
                  onPress={() => onSelectOption('takeVideo')}
                >
                  <View style={styles.iconContainer}>
                    <Ionicons name="videocam" size={32} color={theme.colors.text} />
                  </View>
                  <Text style={styles.optionText}>Take Video</Text>
                </TouchableOpacity>
              </View>

              <View style={styles.optionsRow}>
                <TouchableOpacity 
                  style={styles.option}
                  onPress={() => onSelectOption('choosePhoto')}
                >
                  <View style={styles.iconContainer}>
                    <Ionicons name="images" size={32} color={theme.colors.text} />
                  </View>
                  <Text style={styles.optionText}>Choose Photo</Text>
                </TouchableOpacity>

                <TouchableOpacity 
                  style={styles.option}
                  onPress={() => onSelectOption('chooseVideo')}
                >
                  <View style={styles.iconContainer}>
                    <Ionicons name="film" size={32} color={theme.colors.text} />
                  </View>
                  <Text style={styles.optionText}>Choose Video</Text>
                </TouchableOpacity>
              </View>
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
  optionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 15,
  },
  option: {
    flex: 1,
    alignItems: 'center',
    gap: 8,
  },
  iconContainer: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: theme.colors.dark,
    justifyContent: 'center',
    alignItems: 'center',
  },
  optionText: {
    color: theme.colors.text,
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    textAlign: 'center',
  },
});

export default MediaSelectionModal; 