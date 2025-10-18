import { View, Text, Pressable, StyleSheet, TextInput, ScrollView } from "react-native";
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
    gap: 16,
  },
  summaryText: {
    fontSize: 15,
    color: "#333",
    lineHeight: 22,
  },
  actionsList: {
    gap: 12,
  },
  actionCard: {
    backgroundColor: "#f9f9f9",
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: "transparent",
  },
  actionCardExpanded: {
    backgroundColor: "#f5f5f5",
    borderColor: "#e0e0e0",
  },
  actionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  actionNumber: {
    fontSize: 14,
    fontWeight: "600",
    color: "#16E0B4",
    minWidth: 20,
  },
  actionLabel: {
    fontSize: 14,
    color: "#333",
    fontWeight: "600",
    flex: 1,
  },
  chevron: {
    fontSize: 12,
    color: "#16E0B4",
    marginLeft: "auto",
  },
  expandedContent: {
    gap: 10,
    marginTop: 8,
  },
  inputGroup: {
    gap: 4,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: "#666",
  },
  input: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 6,
    padding: 10,
    fontSize: 14,
    backgroundColor: "#fff",
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
  runButton: {
    backgroundColor: "#16E0B4",
  },
  runButtonText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#fff",
  },
  previewSection: {
    gap: 4,
    marginTop: 8,
  },
  previewLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: "#666",
  },
  previewBox: {
    maxHeight: 150,
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 6,
    padding: 10,
    backgroundColor: "#fff",
  },
  previewText: {
    fontSize: 13,
    color: "#333",
    lineHeight: 20,
  },
});

