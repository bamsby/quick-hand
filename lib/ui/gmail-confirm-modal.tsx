import { useState } from "react";
import { View, Text, TextInput, Pressable, StyleSheet, ScrollView } from "react-native";
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
    gap: 12,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    color: "#333",
    marginBottom: 4,
  },
  input: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    backgroundColor: "#fff",
  },
  previewBox: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    padding: 12,
    backgroundColor: "#f9f9f9",
  },
  previewText: {
    fontSize: 13,
    color: "#666",
  },
  bodyPreview: {
    maxHeight: 150,
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    padding: 12,
    backgroundColor: "#f9f9f9",
  },
  bodyPreviewText: {
    fontSize: 13,
    color: "#444",
    lineHeight: 20,
  },
  buttonRow: {
    flexDirection: "row",
    gap: 12,
    marginTop: 8,
  },
  button: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  cancelButton: {
    backgroundColor: "#f0f0f0",
  },
  cancelButtonText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#666",
  },
  confirmButton: {
    backgroundColor: "#16E0B4",
  },
  confirmButtonText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#fff",
  },
  buttonDisabled: {
    opacity: 0.5,
  },
});

