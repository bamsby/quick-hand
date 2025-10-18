import { useState } from "react";
import { View, Text, Pressable, StyleSheet, ActivityIndicator, Platform } from "react-native";
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
    gap: 20,
  },
  description: {
    fontSize: 16,
    color: "#64748B",
    lineHeight: 24,
    fontWeight: "500",
  },
  featureList: {
    gap: 16,
    marginVertical: 12,
  },
  featureItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 16,
    backgroundColor: "#F8FAFC",
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  featureBullet: {
    fontSize: 18,
    color: "#4F7CFF",
    fontWeight: "700",
    backgroundColor: "#EBF2FF",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  featureText: {
    flex: 1,
    fontSize: 15,
    color: "#1E293B",
    lineHeight: 22,
    fontWeight: "500",
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
    minHeight: 52,
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
  connectButton: {
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
  connectButtonText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  privacyNote: {
    fontSize: 13,
    color: "#94A3B8",
    textAlign: "center",
    marginTop: 8,
    fontWeight: "500",
  },
});

