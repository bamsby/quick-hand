import { useState, useEffect, useMemo } from "react";
import { View, Text, TextInput, Pressable, StyleSheet, ScrollView, ActivityIndicator, Platform } from "react-native";
import { BaseModal } from "./modal";
import type { Citation } from "../types";
import { notionListPages } from "../api";

interface NotionPage {
  id: string;
  title: string;
  url: string;
}

interface NotionConfirmModalProps {
  visible: boolean;
  onClose: () => void;
  onConfirm: (title: string, parentPageId?: string) => void;
  initialTitle: string;
  content: string;
  citations?: Citation[];
}

export function NotionConfirmModal({
  visible,
  onClose,
  onConfirm,
  initialTitle,
  content,
  citations,
}: NotionConfirmModalProps) {
  const [title, setTitle] = useState(initialTitle);
  const [pages, setPages] = useState<NotionPage[]>([]);
  const [selectedPageId, setSelectedPageId] = useState<string | undefined>();
  const [loadingPages, setLoadingPages] = useState(false);

  // Update title when modal becomes visible or initialTitle changes
  useEffect(() => {
    if (visible) {
      setTitle(initialTitle);
      fetchPages();
    }
  }, [visible, initialTitle]);

  const fetchPages = async () => {
    setLoadingPages(true);
    try {
      const fetchedPages = await notionListPages();
      // Pages are already sorted by the server: workspace-level first, then by creation time
      setPages(fetchedPages);
      // Auto-select first page if available
      if (fetchedPages.length > 0 && !selectedPageId) {
        setSelectedPageId(fetchedPages[0].id);
      }
    } catch (error) {
      console.error("Failed to fetch Notion pages:", error);
    } finally {
      setLoadingPages(false);
    }
  };

  // Format content with citations
  const formattedContent = useMemo(() => {
    if (!citations || citations.length === 0) {
      return content;
    }

    let result = content + "\n\n";
    result += "───────────────────\n\n";
    result += "📚 Sources:\n\n";
    
    citations.forEach((citation) => {
      result += `[${citation.id}] ${citation.title}\n`;
      result += `🔗 ${citation.url}\n\n`;
    });
    
    return result;
  }, [content, citations]);

  const handleConfirm = () => {
    if (title.trim()) {
      onConfirm(title.trim(), selectedPageId);
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

        <Text style={styles.label}>Save to Page</Text>
        {loadingPages ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="small" color="#16E0B4" />
            <Text style={styles.loadingText}>Loading pages...</Text>
          </View>
        ) : (
          <ScrollView style={styles.pageSelector} horizontal showsHorizontalScrollIndicator={false}>
            {pages.map((page) => (
              <Pressable
                key={page.id}
                style={[
                  styles.pageChip,
                  selectedPageId === page.id && styles.pageChipSelected
                ]}
                onPress={() => setSelectedPageId(page.id)}
              >
                <Text style={[
                  styles.pageChipText,
                  selectedPageId === page.id && styles.pageChipTextSelected
                ]}>
                  {page.title}
                </Text>
              </Pressable>
            ))}
          </ScrollView>
        )}

        <Text style={styles.label}>Content Preview</Text>
        <ScrollView style={styles.contentPreview} nestedScrollEnabled>
          <Text style={styles.contentText}>{formattedContent}</Text>
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
  loadingContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 16,
    backgroundColor: "#F8FAFC",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  loadingText: {
    fontSize: 15,
    color: "#64748B",
    fontWeight: "500",
  },
  pageSelector: {
    maxHeight: 60,
  },
  pageChip: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    marginRight: 12,
    borderRadius: 24,
    backgroundColor: "#F1F5F9",
    borderWidth: 2,
    borderColor: "#E2E8F0",
    ...Platform.select({
      ios: {
        shadowColor: "#1E293B",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
      },
      android: {
        elevation: 1,
      },
    }),
  },
  pageChipSelected: {
    backgroundColor: "#4F7CFF",
    borderColor: "#4F7CFF",
    ...Platform.select({
      ios: {
        shadowColor: "#4F7CFF",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  pageChipText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#64748B",
  },
  pageChipTextSelected: {
    color: "#FFFFFF",
  },
  contentPreview: {
    maxHeight: 150,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: 12,
    padding: 16,
    backgroundColor: "#F8FAFC",
  },
  contentText: {
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

