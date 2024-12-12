import React from 'react';
import { View, Text, StyleSheet, Pressable, Modal } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '@/constants/theme';
import { heightPercentage } from '@/helpers/common';

interface PostOptionsModalProps {
  visible: boolean;
  onClose: () => void;
  onDelete: () => void;
  onEdit?: () => void;
  deleting: boolean;
}

const PostOptionsModal: React.FC<PostOptionsModalProps> = ({
  visible,
  onClose,
  onDelete,
  onEdit,
  deleting
}) => {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <Pressable style={styles.overlay} onPress={onClose}>
        <View style={styles.modalContent}>
          {onEdit && (
            <Pressable style={styles.option} onPress={onEdit}>
              <Ionicons name="pencil" size={24} color={theme.colors.text} />
              <Text style={styles.optionText}>Edit Post</Text>
            </Pressable>
          )}
          
          <Pressable 
            style={[styles.option, styles.deleteOption]} 
            onPress={onDelete}
            disabled={deleting}
          >
            <Ionicons name="trash" size={24} color={theme.colors.error} />
            <Text style={[styles.optionText, styles.deleteText]}>
              {deleting ? 'Deleting...' : 'Delete Post'}
            </Text>
          </Pressable>
        </View>
      </Pressable>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: theme.colors.dark,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: heightPercentage(2),
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    gap: 12,
  },
  optionText: {
    color: theme.colors.text,
    fontSize: 16,
    fontFamily: 'Inter-Medium',
  },
  deleteOption: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: theme.colors.border,
  },
  deleteText: {
    color: theme.colors.error,
  },
});

export default PostOptionsModal; 