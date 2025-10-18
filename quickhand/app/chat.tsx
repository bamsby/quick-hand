import { useLocalSearchParams } from "expo-router";
import { useState, useRef, useEffect } from "react";
import { View, Text, TextInput, Pressable, StyleSheet, ScrollView, Linking, ActivityIndicator, KeyboardAvoidingView, Platform } from "react-native";
import { ROLE_PRESETS, type RoleKey } from "../lib/roles";
import { runAgent, notionCreatePage, gmailCreateDraft } from "../lib/api";
import type { Message, ActionPlan } from "../lib/types";
import { ToastProvider, useToast } from "../lib/ui/toast";
import { NotionConfirmModal } from "../lib/ui/notion-confirm-modal";
import { GmailConfirmModal } from "../lib/ui/gmail-confirm-modal";
import { CheckpointModal } from "../lib/ui/checkpoint-modal";

interface PendingAction {
  messageId: string;
  actionId: string;
  action: ActionPlan;
}

function ChatContent() {
  const { role = "general" } = useLocalSearchParams<{ role?: RoleKey }>();
  const preset = ROLE_PRESETS[role as RoleKey] ?? ROLE_PRESETS.general;
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Message[]>([
    { id:"sys", role:"system", content:preset.systemPrompt }
  ]);
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<ScrollView>(null);
  const { showToast } = useToast();

  // Modal states
  const [notionModalVisible, setNotionModalVisible] = useState(false);
  const [gmailModalVisible, setGmailModalVisible] = useState(false);
  const [pendingAction, setPendingAction] = useState<PendingAction | null>(null);
  
  // Checkpoint modal states
  const [checkpointModalVisible, setCheckpointModalVisible] = useState(false);
  const [checkpointMessageId, setCheckpointMessageId] = useState<string | null>(null);
  const [actionsUnlocked, setActionsUnlocked] = useState<Set<string>>(new Set());

  useEffect(() => {
    scrollRef.current?.scrollToEnd({ animated: true });
  }, [messages]);

  const onSend = async () => {
    if (!input.trim() || loading) return;
    const userMsg: Message = { id: String(Date.now()), role:"user", content: input.trim() };
    setMessages((m) => [...m, userMsg]);
    setInput(""); 
    setLoading(true);
    try {
      const reply = await runAgent({ role: role as RoleKey, history: [...messages, userMsg] });
      setMessages((m) => [...m, reply]);
    } finally { 
      setLoading(false); 
    }
  };

  const executeAction = (messageId: string, actionId: string) => {
    const message = messages.find((m) => m.id === messageId);
    const action = message?.plan?.find((p) => p.id === actionId);
    
    if (!action) return;

    // Show confirmation modal based on action type
    setPendingAction({ messageId, actionId, action });
    
    if (action.action === "notion") {
      setNotionModalVisible(true);
    } else if (action.action === "gmail") {
      setGmailModalVisible(true);
    }
  };

  const confirmNotionAction = async (title: string) => {
    if (!pendingAction) return;
    
    setNotionModalVisible(false);
    const { messageId, actionId, action } = pendingAction;

    // Update action status to running
    setMessages((msgs) =>
      msgs.map((msg) => {
        if (msg.id === messageId && msg.plan) {
          return {
            ...msg,
            plan: msg.plan.map((p) =>
              p.id === actionId ? { ...p, status: "running" as const } : p
            ),
          };
        }
        return msg;
      })
    );

    try {
      const { pageUrl } = await notionCreatePage(
        title,
        action.params?.content || ""
      );

      // Update action status to done
      setMessages((msgs) =>
        msgs.map((msg) => {
          if (msg.id === messageId && msg.plan) {
            return {
              ...msg,
              plan: msg.plan.map((p) =>
                p.id === actionId ? { ...p, status: "done" as const, result: pageUrl } : p
              ),
            };
          }
          return msg;
        })
      );

      showToast("Page created!", "success", pageUrl, "Open");
    } catch (error) {
      console.error("Notion action error:", error);
      
      // Update action status to error
      setMessages((msgs) =>
        msgs.map((msg) => {
          if (msg.id === messageId && msg.plan) {
            return {
              ...msg,
              plan: msg.plan.map((p) =>
                p.id === actionId ? { ...p, status: "error" as const } : p
              ),
            };
          }
          return msg;
        })
      );

      showToast("Couldn't create Notion page. Check connection and try again.", "error");
    } finally {
      setPendingAction(null);
    }
  };

  const confirmGmailAction = async (recipients: string) => {
    if (!pendingAction) return;
    
    setGmailModalVisible(false);
    const { messageId, actionId, action } = pendingAction;

    // Update action status to running
    setMessages((msgs) =>
      msgs.map((msg) => {
        if (msg.id === messageId && msg.plan) {
          return {
            ...msg,
            plan: msg.plan.map((p) =>
              p.id === actionId ? { ...p, status: "running" as const } : p
            ),
          };
        }
        return msg;
      })
    );

    try {
      const { threadUrl } = await gmailCreateDraft(
        recipients,
        action.params?.subject || "",
        action.params?.body || ""
      );

      // Update action status to done
      setMessages((msgs) =>
        msgs.map((msg) => {
          if (msg.id === messageId && msg.plan) {
            return {
              ...msg,
              plan: msg.plan.map((p) =>
                p.id === actionId ? { ...p, status: "done" as const, result: threadUrl } : p
              ),
            };
          }
          return msg;
        })
      );

      showToast("Draft ready!", "success", threadUrl, "Open");
    } catch (error) {
      console.error("Gmail action error:", error);
      
      // Update action status to error
      setMessages((msgs) =>
        msgs.map((msg) => {
          if (msg.id === messageId && msg.plan) {
            return {
              ...msg,
              plan: msg.plan.map((p) =>
                p.id === actionId ? { ...p, status: "error" as const } : p
              ),
            };
          }
          return msg;
        })
      );

      showToast("Couldn't create draft. Check connection and try again.", "error");
    } finally {
      setPendingAction(null);
    }
  };

  const openCheckpointModal = (messageId: string) => {
    setCheckpointMessageId(messageId);
    setCheckpointModalVisible(true);
  };

  const closeCheckpointModal = () => {
    setCheckpointModalVisible(false);
    if (checkpointMessageId) {
      // Unlock actions so individual buttons appear
      setActionsUnlocked(prev => new Set(prev).add(checkpointMessageId));
      setCheckpointMessageId(null);
    }
  };

  const executeAllActions = async (editedActions: ActionPlan[]) => {
    if (!checkpointMessageId) return;
    
    setCheckpointModalVisible(false);
    const messageId = checkpointMessageId;
    setCheckpointMessageId(null);

    // Unlock actions so buttons appear
    setActionsUnlocked(prev => new Set(prev).add(messageId));

    const message = messages.find((m) => m.id === messageId);
    if (!message || !message.plan) return;

    // Use edited actions from the modal
    const pendingActions = editedActions.filter((a) => a.status === "pending");
    let successCount = 0;
    let errorCount = 0;

    for (const action of pendingActions) {
      // Update status to running
      setMessages((msgs) =>
        msgs.map((msg) => {
          if (msg.id === messageId && msg.plan) {
            return {
              ...msg,
              plan: msg.plan.map((p) =>
                p.id === action.id ? { ...p, status: "running" as const } : p
              ),
            };
          }
          return msg;
        })
      );

      try {
        let result: string | undefined;

        // Use the edited parameters from the checkpoint modal
        if (action.action === "notion") {
          const { pageUrl } = await notionCreatePage(
            action.params?.title || "Untitled",
            action.params?.content || ""
          );
          result = pageUrl;
        } else if (action.action === "gmail") {
          const { threadUrl } = await gmailCreateDraft(
            action.params?.to || "your.email@example.com",
            action.params?.subject || "",
            action.params?.body || ""
          );
          result = threadUrl;
        }

        // Update status to done
        setMessages((msgs) =>
          msgs.map((msg) => {
            if (msg.id === messageId && msg.plan) {
              return {
                ...msg,
                plan: msg.plan.map((p) =>
                  p.id === action.id ? { ...p, status: "done" as const, result } : p
                ),
              };
            }
            return msg;
          })
        );

        successCount++;
      } catch (error) {
        console.error(`Action ${action.id} error:`, error);

        // Update status to error
        setMessages((msgs) =>
          msgs.map((msg) => {
            if (msg.id === messageId && msg.plan) {
              return {
                ...msg,
                plan: msg.plan.map((p) =>
                  p.id === action.id ? { ...p, status: "error" as const } : p
                ),
              };
            }
            return msg;
          })
        );

        errorCount++;
      }
    }

    // Show summary toast
    if (errorCount === 0) {
      showToast(`${successCount} action${successCount !== 1 ? 's' : ''} completed!`, "success");
    } else {
      showToast(
        `${successCount} completed, ${errorCount} failed. Tap actions to retry.`,
        "error"
      );
    }
  };

  return (
    <KeyboardAvoidingView 
      style={{ flex: 1 }} 
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 0}
    >
      <View style={{ flex: 1 }}>
        <View style={styles.header}><Text style={styles.title}>{preset.label} Mode</Text></View>
        <ScrollView 
          ref={scrollRef} 
          style={{ flex: 1, padding: 16 }}
          contentContainerStyle={{ paddingBottom: 20 }}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
        >
          {messages.filter(m => m.role !== "system").map((m) => (
            <View key={m.id}>
              <View style={[styles.bubble, m.role==="user"?styles.user:styles.assistant]}>
                <Text>{m.content}</Text>
              </View>
              {m.citations && m.citations.length > 0 && (
                <View style={styles.citations}>
                  <Text style={styles.citationsTitle}>Sources:</Text>
                  {m.citations.map((citation) => (
                    <Pressable
                      key={citation.id}
                      style={styles.citationCard}
                      onPress={() => Linking.openURL(citation.url)}
                    >
                      <Text style={styles.citationNumber}>[{citation.id}]</Text>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.citationTitle}>{citation.title}</Text>
                        <Text style={styles.citationSnippet} numberOfLines={2}>
                          {citation.snippet}
                        </Text>
                      </View>
                    </Pressable>
                  ))}
                </View>
              )}
              {m.plan && m.plan.length > 0 && (
                <View style={styles.actionsCard}>
                  <Text style={styles.actionsTitle}>Proposed Actions:</Text>
                  {(() => {
                    const allPending = m.plan!.every((a) => a.status === "pending");
                    const shouldShowCheckpoint = 
                      m.plan!.length >= 2 && 
                      allPending && 
                      !actionsUnlocked.has(m.id);

                    if (shouldShowCheckpoint) {
                      return (
                        <Pressable
                          style={styles.reviewPlanButton}
                          onPress={() => openCheckpointModal(m.id)}
                        >
                          <Text style={styles.reviewPlanButtonText}>Review Plan</Text>
                        </Pressable>
                      );
                    }

                    return m.plan!.map((action) => (
                      <View key={action.id} style={styles.actionRow}>
                        <Pressable
                          style={[
                            styles.actionButton,
                            action.status === "done" && styles.actionDone,
                            action.status === "error" && styles.actionError,
                          ]}
                          onPress={() => executeAction(m.id, action.id)}
                          disabled={action.status === "running" || action.status === "done"}
                        >
                          {action.status === "running" ? (
                            <ActivityIndicator size="small" color="#fff" />
                          ) : (
                            <Text style={styles.actionButtonText}>
                              {action.status === "done" ? "✓ " : ""}
                              {action.label}
                            </Text>
                          )}
                        </Pressable>
                        {action.status === "done" && action.result && (
                          <Pressable onPress={() => Linking.openURL(action.result!)}>
                            <Text style={styles.resultLink}>Open →</Text>
                          </Pressable>
                        )}
                        {action.status === "error" && (
                          <Text style={styles.errorText}>Failed</Text>
                        )}
                      </View>
                    ));
                  })()}
                </View>
              )}
            </View>
          ))}
          {loading && (
            <View style={styles.loadingBubble}>
              <ActivityIndicator size="small" color="#16E0B4" />
              <Text style={styles.loadingText}>Thinking...</Text>
            </View>
          )}
        </ScrollView>
        <View style={styles.inputBar}>
          <TextInput 
            value={input} 
            onChangeText={setInput} 
            placeholder="Ask QuickHand…" 
            style={styles.input}
            editable={!loading}
            onSubmitEditing={onSend}
            returnKeyType="send"
            blurOnSubmit={false}
          />
          <Pressable onPress={onSend} style={[styles.send, loading && styles.sendDisabled]} disabled={loading}>
            <Text style={{ color:"white" }}>Send</Text>
          </Pressable>
        </View>

        {/* Confirmation Modals */}
        <NotionConfirmModal
          visible={notionModalVisible}
          onClose={() => {
            setNotionModalVisible(false);
            setPendingAction(null);
          }}
          onConfirm={confirmNotionAction}
          initialTitle={pendingAction?.action.params?.title || "Untitled"}
          content={pendingAction?.action.params?.content || ""}
        />

        <GmailConfirmModal
          visible={gmailModalVisible}
          onClose={() => {
            setGmailModalVisible(false);
            setPendingAction(null);
          }}
          onConfirm={confirmGmailAction}
          initialRecipients={pendingAction?.action.params?.to || "your.email@example.com"}
          subject={pendingAction?.action.params?.subject || ""}
        />

        <CheckpointModal
          visible={checkpointModalVisible}
          onClose={closeCheckpointModal}
          onRunAll={executeAllActions}
          actions={
            checkpointMessageId
              ? messages.find((m) => m.id === checkpointMessageId)?.plan || []
              : []
          }
        />
      </View>
    </KeyboardAvoidingView>
  );
}

export default function Chat() {
  return (
    <ToastProvider>
      <ChatContent />
    </ToastProvider>
  );
}

const styles = StyleSheet.create({
  header:{ padding:16, borderBottomWidth:1, borderColor:"#eee" },
  title:{ fontSize:18, fontWeight:"600" },
  bubble:{ marginBottom:10, padding:12, borderRadius:12, backgroundColor:"#f7f7f7" },
  user:{ alignSelf:"flex-end", backgroundColor:"#def7f1" },
  assistant:{ alignSelf:"flex-start" },
  citations: {
    marginTop: 8,
    marginBottom: 12,
    padding: 12,
    backgroundColor: "#fafafa",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#e0e0e0",
  },
  citationsTitle: {
    fontSize: 12,
    fontWeight: "600",
    color: "#666",
    marginBottom: 8,
  },
  citationCard: {
    flexDirection: "row",
    padding: 10,
    marginBottom: 6,
    backgroundColor: "#fff",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#e8e8e8",
  },
  citationNumber: {
    fontSize: 12,
    fontWeight: "700",
    color: "#16E0B4",
    marginRight: 8,
  },
  citationTitle: {
    fontSize: 13,
    fontWeight: "600",
    color: "#333",
    marginBottom: 4,
  },
  citationSnippet: {
    fontSize: 12,
    color: "#666",
    lineHeight: 16,
  },
  actionsCard: {
    marginTop: 8,
    marginBottom: 12,
    padding: 12,
    backgroundColor: "#f0f9ff",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#bae6fd",
  },
  actionsTitle: {
    fontSize: 12,
    fontWeight: "600",
    color: "#0c4a6e",
    marginBottom: 10,
  },
  actionRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  actionButton: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 16,
    backgroundColor: "#16E0B4",
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 40,
  },
  actionButtonText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
  },
  actionDone: {
    backgroundColor: "#10b981",
  },
  actionError: {
    backgroundColor: "#ef4444",
  },
  resultLink: {
    marginLeft: 8,
    color: "#16E0B4",
    fontSize: 14,
    fontWeight: "600",
  },
  errorText: {
    marginLeft: 8,
    color: "#ef4444",
    fontSize: 12,
  },
  reviewPlanButton: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: "#16E0B4",
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  reviewPlanButtonText: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "600",
  },
  loadingBubble: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    padding: 12,
    borderRadius: 12,
    backgroundColor: "#f7f7f7",
    marginBottom: 10,
  },
  loadingText: {
    marginLeft: 8,
    color: "#666",
    fontSize: 14,
  },
  inputBar:{ flexDirection:"row", padding:12, borderTopWidth:1, borderColor:"#eee" },
  input:{ flex:1, padding:12, backgroundColor:"#f0f0f0", borderRadius:8, marginRight:8 },
  send:{ paddingHorizontal:16, justifyContent:"center", borderRadius:8, backgroundColor:"#16E0B4" },
  sendDisabled: { opacity: 0.5 },
});

