import { createContext, useContext, useState, useCallback, type ReactNode } from "react";
import { View, Text, Pressable, StyleSheet, Animated, Linking, Platform } from "react-native";
import { useEffect, useRef } from "react";

type ToastType = "success" | "error";

interface Toast {
  id: string;
  type: ToastType;
  message: string;
  link?: string;
  linkText?: string;
}

interface ToastContextValue {
  showToast: (message: string, type: ToastType, link?: string, linkText?: string) => void;
}

const ToastContext = createContext<ToastContextValue | undefined>(undefined);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const showToast = useCallback(
    (message: string, type: ToastType, link?: string, linkText?: string) => {
      const id = String(Date.now());
      setToasts((prev) => [...prev, { id, type, message, link, linkText }]);

      // Auto-dismiss after 3 seconds
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, 3000);
    },
    []
  );

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <View style={styles.toastContainer}>
        {toasts.map((toast) => (
          <ToastItem key={toast.id} toast={toast} onDismiss={dismissToast} />
        ))}
      </View>
    </ToastContext.Provider>
  );
}

function ToastItem({ toast, onDismiss }: { toast: Toast; onDismiss: (id: string) => void }) {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(-50)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start();
  }, [fadeAnim, slideAnim]);

  const handleLinkPress = () => {
    if (toast.link) {
      Linking.openURL(toast.link);
    }
  };

  return (
    <Animated.View
      style={[
        styles.toast,
        toast.type === "success" ? styles.toastSuccess : styles.toastError,
        {
          opacity: fadeAnim,
          transform: [{ translateY: slideAnim }],
        },
      ]}
    >
      <View style={styles.toastContent}>
        <Text style={styles.toastIcon}>
          {toast.type === "success" ? "✓" : "✕"}
        </Text>
        <Text style={styles.toastMessage}>{toast.message}</Text>
        {toast.link && (
          <Pressable onPress={handleLinkPress} style={styles.toastLinkButton}>
            <Text style={styles.toastLinkText}>{toast.linkText || "Open"}</Text>
          </Pressable>
        )}
        <Pressable onPress={() => onDismiss(toast.id)} style={styles.toastClose}>
          <Text style={styles.toastCloseText}>✕</Text>
        </Pressable>
      </View>
    </Animated.View>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within ToastProvider");
  }
  return context;
}

const styles = StyleSheet.create({
  toastContainer: {
    position: "absolute",
    top: Platform.OS === "ios" ? 50 : 20,
    left: 16,
    right: 16,
    zIndex: 9999,
    alignItems: "center",
  },
  toast: {
    width: "100%",
    maxWidth: 500,
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 4,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  toastSuccess: {
    backgroundColor: "#10b981",
  },
  toastError: {
    backgroundColor: "#ef4444",
  },
  toastContent: {
    flexDirection: "row",
    alignItems: "center",
  },
  toastIcon: {
    fontSize: 18,
    color: "#fff",
    fontWeight: "700",
    marginRight: 10,
  },
  toastMessage: {
    flex: 1,
    fontSize: 14,
    color: "#fff",
    fontWeight: "500",
  },
  toastLinkButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    borderRadius: 6,
    marginLeft: 8,
  },
  toastLinkText: {
    fontSize: 13,
    color: "#fff",
    fontWeight: "600",
  },
  toastClose: {
    padding: 4,
    marginLeft: 8,
  },
  toastCloseText: {
    fontSize: 18,
    color: "#fff",
    lineHeight: 18,
  },
});

