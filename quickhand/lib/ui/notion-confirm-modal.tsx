import { useState } from "react";
import { View, Text, TextInput, Pressable, StyleSheet, ScrollView } from "react-native";
import { BaseModal } from "./modal";

interface NotionConfirmModalProps {
  visible: boolean;
  onClose: () => void;
  onConfirm: (title: string) => void;
  initialTitle: string;
  content: string;
}

export function NotionConfirmModal({
  visible,
  onClose,
  onConfirm,
  initialTitle,
  content,
}: NotionConfirmModalProps) {
  const [title, setTitle] = useState(initialTitle);

  const handleConfirm = () => {
    if (title.trim()) {
      onConfirm(title.trim());
    }
  };

  return (
    <BaseModal visible={visible} onClose={onClose} title="Save to Notion">
      <View style={styles.container}>
        <Text style={styles.label}>Page Title</Text>
        <TextInput
          value={title}
          onChangeText={setTitle}
          style={styles.input}
          placeholder="Enter page title"
          autoFocus
        />

        <Text style={styles.label}>Content Preview</Text>
        <ScrollView style={styles.contentPreview} nestedScrollEnabled>
          <Text style={styles.contentText}>{content}</Text>
        </ScrollView>

        <View style={styles.buttonRow}>
          <Pressable style={[styles.button, styles.cancelButton]} onPress={onClose}>
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </Pressable>
          <Pressable
            style={[styles.button, styles.confirmButton, !title.trim() && styles.buttonDisabled]}
            onPress={handleConfirm}
            disabled={!title.trim()}
          >
            <Text style={styles.confirmButtonText}>Create Page</Text>
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
  contentPreview: {
    maxHeight: 150,
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    padding: 12,
    backgroundColor: "#f9f9f9",
  },
  contentText: {
    fontSize: 13,
    color: "#666",
    lineHeight: 18,
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

