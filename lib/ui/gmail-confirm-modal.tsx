import { useState } from "react";
import { View, Text, TextInput, Pressable, StyleSheet, ScrollView, Platform } from "react-native";
import { BaseModal } from "./modal";

interface GmailConfirmModalProps {
  visible: boolean;
  onClose: () => void;
  onConfirm: (recipients: string) => void;
  initialRecipients: string;
  subject: string;
  body: string;
}

export function GmailConfirmModal({
  visible,
  onClose,
  onConfirm,
  initialRecipients,
  subject,
  body,
}: GmailConfirmModalProps) {
  const [recipients, setRecipients] = useState(initialRecipients);

  const handleConfirm = () => {
    if (recipients.trim()) {
      onConfirm(recipients.trim());
    }
  };

  return (
    <BaseModal visible={visible} onClose={onClose} title="Draft Email">
      <View style={styles.container}>
        <Text style={styles.label}>Recipients</Text>
        <TextInput
          value={recipients}
          onChangeText={setRecipients}
          style={styles.input}
          placeholder="your.email@example.com"
          keyboardType="email-address"
          autoCapitalize="none"
          autoFocus
        />

        <Text style={styles.label}>Subject</Text>
        <View style={styles.previewBox}>
          <Text style={styles.previewText}>{subject}</Text>
        </View>

        <Text style={styles.label}>Message</Text>
        <ScrollView style={styles.bodyPreview} nestedScrollEnabled>
          <Text style={styles.bodyPreviewText}>{body}</Text>
        </ScrollView>

        <View style={styles.buttonRow}>
          <Pressable style={[styles.button, styles.cancelButton]} onPress={onClose}>
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </Pressable>
          <Pressable
            style={[
              styles.button,
              styles.confirmButton,
              !recipients.trim() && styles.buttonDisabled,
            ]}
            onPress={handleConfirm}
            disabled={!recipients.trim()}
          >
            <Text style={styles.confirmButtonText}>Create Draft</Text>
          </Pressable>
        </View>
      </View>
    </BaseModal>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1E293B",
    marginBottom: 8,
  },
  input: {
    borderWidth: 2,
    borderColor: "#E2E8F0",
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    backgroundColor: "#FFFFFF",
    color: "#1E293B",
  },
  previewBox: {
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: 12,
    padding: 16,
    backgroundColor: "#F8FAFC",
  },
  previewText: {
    fontSize: 15,
    color: "#64748B",
    fontWeight: "500",
  },
  bodyPreview: {
    maxHeight: 150,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: 12,
    padding: 16,
    backgroundColor: "#F8FAFC",
  },
  bodyPreviewText: {
    fontSize: 14,
    color: "#64748B",
    lineHeight: 20,
  },
  buttonRow: {
    flexDirection: "row",
    gap: 16,
    marginTop: 16,
  },
  button: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    ...Platform.select({
      ios: {
        shadowColor: "#1E293B",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  cancelButton: {
    backgroundColor: "#F1F5F9",
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#64748B",
  },
  confirmButton: {
    backgroundColor: "#4F7CFF",
    ...Platform.select({
      ios: {
        shadowColor: "#4F7CFF",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  confirmButtonText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  buttonDisabled: {
    opacity: 0.5,
  },
});

