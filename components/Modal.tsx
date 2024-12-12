import React from 'react';
import { 
  Modal as RNModal, 
  View, 
  StyleSheet, 
  TouchableWithoutFeedback,
  Dimensions
} from 'react-native';
import { theme } from '@/constants/theme';

interface ModalProps {
  visible: boolean;
  onClose: () => void;
  children: React.ReactNode;
}

const { height: WINDOW_HEIGHT } = Dimensions.get('window');

export default function Modal({ visible, onClose, children }: ModalProps) {
  return (
    <RNModal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.overlay}>
          <TouchableWithoutFeedback>
            <View style={styles.content}>
              {children}
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </RNModal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  content: {
    backgroundColor: theme.colors.dark,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    maxHeight: WINDOW_HEIGHT * 0.9,
  },
}); 