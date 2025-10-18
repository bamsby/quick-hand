import { View, Text, Pressable, StyleSheet, TextInput, ScrollView, Platform } from "react-native";
import { BaseModal } from "./modal";
import type { ActionPlan } from "../types";
import { useState, useEffect } from "react";

interface CheckpointModalProps {
  visible: boolean;
  onClose: () => void;
  onRunAll: (editedActions: ActionPlan[]) => void;
  actions: ActionPlan[];
}

function generateActionDescription(action: ActionPlan): string {
  switch (action.action) {
    case "summarize":
      return "summarize your query";
    case "notion":
      return "save to Notion";
    case "gmail":
      return "draft an email";
    default:
      return action.label.toLowerCase();
  }
}

function generateSummaryText(actions: ActionPlan[]): string {
  if (actions.length === 0) return "QuickHand will perform actions. Proceed?";
  
  const descriptions = actions.map(generateActionDescription);
  
  if (descriptions.length === 1) {
    return `QuickHand will ${descriptions[0]}. Proceed?`;
  } else if (descriptions.length === 2) {
    return `QuickHand will ${descriptions[0]} and ${descriptions[1]}. Proceed?`;
  } else {
    const lastDescription = descriptions[descriptions.length - 1];
    const otherDescriptions = descriptions.slice(0, -1).join(", ");
    return `QuickHand will ${otherDescriptions}, and ${lastDescription}. Proceed?`;
  }
}

export function CheckpointModal({
  visible,
  onClose,
  onRunAll,
  actions,
}: CheckpointModalProps) {
  const summaryText = generateSummaryText(actions);
  const [editedActions, setEditedActions] = useState<ActionPlan[]>(actions);
  const [expandedActionId, setExpandedActionId] = useState<string | null>(
    actions.length > 0 ? actions[0].id : null
  );

  // Reset edited actions and expanded state when modal becomes visible or actions change
  useEffect(() => {
    if (visible) {
      setEditedActions(actions);
      setExpandedActionId(actions.length > 0 ? actions[0].id : null);
    }
  }, [visible, actions]);

  const updateActionParam = (actionId: string, paramKey: string, value: string) => {
    setEditedActions((prev) =>
      prev.map((action) =>
        action.id === actionId
          ? { ...action, params: { ...action.params, [paramKey]: value } }
          : action
      )
    );
  };

  const toggleExpanded = (actionId: string) => {
    setExpandedActionId(expandedActionId === actionId ? null : actionId);
  };

  const handleRunAll = () => {
    onRunAll(editedActions);
  };

  return (
    <BaseModal visible={visible} onClose={onClose} title="Review Plan">
      <ScrollView style={styles.scrollContainer} nestedScrollEnabled>
        <View style={styles.container}>
          <Text style={styles.summaryText}>{summaryText}</Text>

          <View style={styles.actionsList}>
            {editedActions.map((action, index) => {
              const isExpanded = expandedActionId === action.id;
              return (
                <View key={action.id} style={[styles.actionCard, isExpanded && styles.actionCardExpanded]}>
                  <Pressable onPress={() => toggleExpanded(action.id)} style={styles.actionHeader}>
                    <Text style={styles.actionNumber}>{index + 1}.</Text>
                    <Text style={styles.actionLabel}>{action.label}</Text>
                    <Text style={styles.chevron}>{isExpanded ? "▲" : "▼"}</Text>
                  </Pressable>

                  {isExpanded && (
                    <View style={styles.expandedContent}>
                      {/* Notion-specific inputs */}
                      {action.action === "notion" && (
                        <>
                          <View style={styles.inputGroup}>
                            <Text style={styles.inputLabel}>Page Title</Text>
                            <TextInput
                              value={action.params?.title || ""}
                              onChangeText={(text) => updateActionParam(action.id, "title", text)}
                              style={styles.input}
                              placeholder="Enter page title"
                            />
                          </View>

                          {/* Notion content preview */}
                          {action.params?.content && (
                            <View style={styles.previewSection}>
                              <Text style={styles.previewLabel}>Content Preview</Text>
                              <ScrollView style={styles.previewBox} nestedScrollEnabled>
                                <Text style={styles.previewText}>
                                  {action.params.content}
                                </Text>
                              </ScrollView>
                            </View>
                          )}
                        </>
                      )}

                      {/* Gmail-specific inputs */}
                      {action.action === "gmail" && (
                        <>
                          <View style={styles.inputGroup}>
                            <Text style={styles.inputLabel}>Recipients</Text>
                            <TextInput
                              value={action.params?.to || ""}
                              onChangeText={(text) => updateActionParam(action.id, "to", text)}
                              style={styles.input}
                              placeholder="your.email@example.com"
                              keyboardType="email-address"
                              autoCapitalize="none"
                            />
                          </View>
                          <View style={styles.inputGroup}>
                            <Text style={styles.inputLabel}>Subject</Text>
                            <TextInput
                              value={action.params?.subject || ""}
                              onChangeText={(text) => updateActionParam(action.id, "subject", text)}
                              style={styles.input}
                              placeholder="Email subject"
                            />
                          </View>

                          {/* Gmail message preview */}
                          {action.params?.bodyText && (
                            <View style={styles.previewSection}>
                              <Text style={styles.previewLabel}>Message Preview</Text>
                              <ScrollView style={styles.previewBox} nestedScrollEnabled>
                                <Text style={styles.previewText}>
                                  {action.params.bodyText}
                                </Text>
                              </ScrollView>
                            </View>
                          )}
                        </>
                      )}
                    </View>
                  )}
                </View>
              );
            })}
          </View>

          <View style={styles.buttonRow}>
            <Pressable style={[styles.button, styles.cancelButton]} onPress={onClose}>
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </Pressable>
            <Pressable style={[styles.button, styles.runButton]} onPress={handleRunAll}>
              <Text style={styles.runButtonText}>Run All</Text>
            </Pressable>
          </View>
        </View>
      </ScrollView>
    </BaseModal>
  );
}

const styles = StyleSheet.create({
  scrollContainer: {
    maxHeight: 500,
  },
  container: {
    gap: 20,
  },
  summaryText: {
    fontSize: 16,
    color: "#1E293B",
    lineHeight: 24,
    fontWeight: "500",
    backgroundColor: "#EBF2FF",
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#4F7CFF",
  },
  actionsList: {
    gap: 16,
  },
  actionCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 16,
    borderWidth: 2,
    borderColor: "#E2E8F0",
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
  actionCardExpanded: {
    backgroundColor: "#F8FAFC",
    borderColor: "#4F7CFF",
    ...Platform.select({
      ios: {
        shadowColor: "#4F7CFF",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 8,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  actionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  actionNumber: {
    fontSize: 16,
    fontWeight: "700",
    color: "#4F7CFF",
    minWidth: 24,
    backgroundColor: "#EBF2FF",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    textAlign: "center",
  },
  actionLabel: {
    fontSize: 16,
    color: "#1E293B",
    fontWeight: "600",
    flex: 1,
  },
  chevron: {
    fontSize: 14,
    color: "#4F7CFF",
    marginLeft: "auto",
    fontWeight: "600",
  },
  expandedContent: {
    gap: 16,
    marginTop: 16,
  },
  inputGroup: {
    gap: 8,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#1E293B",
  },
  input: {
    borderWidth: 2,
    borderColor: "#E2E8F0",
    borderRadius: 10,
    padding: 14,
    fontSize: 15,
    backgroundColor: "#FFFFFF",
    color: "#1E293B",
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
  runButton: {
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
  runButtonText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  previewSection: {
    gap: 8,
    marginTop: 12,
  },
  previewLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#1E293B",
  },
  previewBox: {
    maxHeight: 150,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: 10,
    padding: 14,
    backgroundColor: "#F8FAFC",
  },
  previewText: {
    fontSize: 14,
    color: "#64748B",
    lineHeight: 20,
  },
});

