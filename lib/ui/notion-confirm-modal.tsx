import { useState, useEffect, useMemo } from "react";
import { View, Text, TextInput, Pressable, StyleSheet, ScrollView, ActivityIndicator } from "react-native";
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
  loadingContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    padding: 12,
    backgroundColor: "#f9f9f9",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#ddd",
  },
  loadingText: {
    fontSize: 13,
    color: "#666",
  },
  pageSelector: {
    maxHeight: 50,
  },
  pageChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 8,
    borderRadius: 20,
    backgroundColor: "#f0f0f0",
    borderWidth: 1,
    borderColor: "#ddd",
  },
  pageChipSelected: {
    backgroundColor: "#16E0B4",
    borderColor: "#16E0B4",
  },
  pageChipText: {
    fontSize: 13,
    fontWeight: "500",
    color: "#666",
  },
  pageChipTextSelected: {
    color: "#fff",
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

