import { useState } from "react";
import { View, Text, Pressable, StyleSheet, ActivityIndicator } from "react-native";
import { BaseModal } from "./modal";

interface NotionConnectModalProps {
  visible: boolean;
  onClose: () => void;
  onConnect: () => Promise<void>;
}

export function NotionConnectModal({
  visible,
  onClose,
  onConnect,
}: NotionConnectModalProps) {
  const [connecting, setConnecting] = useState(false);

  const handleConnect = async () => {
    setConnecting(true);
    try {
      await onConnect();
    } finally {
      setConnecting(false);
    }
  };

  return (
    <BaseModal visible={visible} onClose={onClose} title="Connect to Notion">
      <View style={styles.container}>
        <Text style={styles.description}>
          To save content to Notion, you need to connect your Notion workspace.
        </Text>

        <View style={styles.featureList}>
          <View style={styles.featureItem}>
            <Text style={styles.featureBullet}>✓</Text>
            <Text style={styles.featureText}>
              Save research and notes directly to your workspace
            </Text>
          </View>
          <View style={styles.featureItem}>
            <Text style={styles.featureBullet}>✓</Text>
            <Text style={styles.featureText}>
              Create pages with formatted content
            </Text>
          </View>
          <View style={styles.featureItem}>
            <Text style={styles.featureBullet}>✓</Text>
            <Text style={styles.featureText}>
              Secure OAuth connection (you can revoke anytime)
            </Text>
          </View>
        </View>

        <View style={styles.buttonRow}>
          <Pressable
            style={[styles.button, styles.cancelButton]}
            onPress={onClose}
            disabled={connecting}
          >
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </Pressable>
          <Pressable
            style={[
              styles.button,
              styles.connectButton,
              connecting && styles.buttonDisabled,
            ]}
            onPress={handleConnect}
            disabled={connecting}
          >
            {connecting ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Text style={styles.connectButtonText}>Connect Notion</Text>
            )}
          </Pressable>
        </View>

        <Text style={styles.privacyNote}>
          QuickHand will only access pages you grant permission to.
        </Text>
      </View>
    </BaseModal>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 16,
  },
  description: {
    fontSize: 14,
    color: "#666",
    lineHeight: 20,
  },
  featureList: {
    gap: 12,
    marginVertical: 8,
  },
  featureItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
  },
  featureBullet: {
    fontSize: 16,
    color: "#16E0B4",
    fontWeight: "600",
  },
  featureText: {
    flex: 1,
    fontSize: 13,
    color: "#555",
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
    minHeight: 44,
  },
  cancelButton: {
    backgroundColor: "#f0f0f0",
  },
  cancelButtonText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#666",
  },
  connectButton: {
    backgroundColor: "#16E0B4",
  },
  connectButtonText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#fff",
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  privacyNote: {
    fontSize: 11,
    color: "#999",
    textAlign: "center",
    marginTop: 4,
  },
});

