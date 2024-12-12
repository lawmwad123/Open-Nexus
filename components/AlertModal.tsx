import React from 'react';
import { Modal, View, Text, StyleSheet, Pressable } from 'react-native';
import { theme } from '@/constants/theme';
import { heightPercentage } from '@/helpers/common';

interface AlertModalProps {
  visible: boolean;
  title: string;
  message: string;
  buttons: {
    text: string;
    onPress: () => void;
    style?: 'default' | 'cancel' | 'destructive';
  }[];
}

const AlertModal: React.FC<AlertModalProps> = ({
  visible,
  title,
  message,
  buttons
}) => {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
    >
      <View style={styles.overlay}>
        <View style={styles.alertContainer}>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.message}>{message}</Text>
          <View style={styles.buttonContainer}>
            {buttons.map((button, index) => (
              <Pressable
                key={index}
                style={[
                  styles.button,
                  button.style === 'destructive' && styles.destructiveButton,
                  button.style === 'cancel' && styles.cancelButton,
                  index > 0 && styles.buttonMargin
                ]}
                onPress={button.onPress}
              >
                <Text
                  style={[
                    styles.buttonText,
                    button.style === 'destructive' && styles.destructiveText,
                    button.style === 'cancel' && styles.cancelText
                  ]}
                >
                  {button.text}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  alertContainer: {
    backgroundColor: theme.colors.dark,
    borderRadius: theme.radius.lg,
    padding: heightPercentage(3),
    width: '80%',
    maxWidth: 400,
  },
  title: {
    color: theme.colors.text,
    fontSize: 20,
    fontFamily: 'Inter-Bold',
    marginBottom: 8,
  },
  message: {
    color: theme.colors.textLight,
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    marginBottom: heightPercentage(3),
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
  },
  button: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: theme.radius.md,
    backgroundColor: theme.colors.primary,
  },
  buttonMargin: {
    marginLeft: 8,
  },
  destructiveButton: {
    backgroundColor: theme.colors.error,
  },
  cancelButton: {
    backgroundColor: theme.colors.darkLight,
  },
  buttonText: {
    color: theme.colors.text,
    fontSize: 16,
    fontFamily: 'Inter-Medium',
  },
  destructiveText: {
    color: theme.colors.text,
  },
  cancelText: {
    color: theme.colors.text,
  },
});

export default AlertModal; 