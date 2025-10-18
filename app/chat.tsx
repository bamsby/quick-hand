import { useLocalSearchParams } from "expo-router";
import { useState, useRef, useEffect } from "react";
import { View, Text, TextInput, Pressable, StyleSheet, ScrollView, Linking, ActivityIndicator, KeyboardAvoidingView, Platform, Alert, Image } from "react-native";
import { useRouter } from "expo-router";
import { ROLE_PRESETS, type RoleKey } from "../lib/roles";
import { runAgent, notionCreatePage, gmailCreateDraft, checkNotionConnection, checkGmailConnection, disconnectNotion, disconnectGmail } from "../lib/api";
import type { Message, ActionPlan, IntegrationStatus } from "../lib/types";
import { ToastProvider, useToast } from "../lib/ui/toast";
import { NotionConfirmModal } from "../lib/ui/notion-confirm-modal";
import { NotionConnectModal } from "../lib/ui/notion-connect-modal";
import { GmailConfirmModal } from "../lib/ui/gmail-confirm-modal";
import { GmailConnectModal } from "../lib/ui/gmail-connect-modal";
import { CheckpointModal } from "../lib/ui/checkpoint-modal";
import { initiateNotionOAuth } from "../lib/notion-oauth";
import { initiateGmailOAuth } from "../lib/gmail-oauth";
import { getCurrentUser, signOut, getIntegrationStatus } from "../lib/auth-helpers";

interface PendingAction {
  messageId: string;
  actionId: string;
  action: ActionPlan;
}

function ChatContent() {
  const { role = "general" } = useLocalSearchParams<{ role?: RoleKey }>();
  const router = useRouter();
  const preset = ROLE_PRESETS[role as RoleKey] ?? ROLE_PRESETS.general;
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Message[]>([
    { id:"sys", role:"system", content:preset.systemPrompt }
  ]);
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<ScrollView>(null);
  const { showToast } = useToast();

  // User and auth states
  const [user, setUser] = useState<any>(null);
  const [signingOut, setSigningOut] = useState(false);

  // Modal states
  const [notionModalVisible, setNotionModalVisible] = useState(false);
  const [notionConnectModalVisible, setNotionConnectModalVisible] = useState(false);
  const [gmailModalVisible, setGmailModalVisible] = useState(false);
  const [gmailConnectModalVisible, setGmailConnectModalVisible] = useState(false);
  const [pendingAction, setPendingAction] = useState<PendingAction | null>(null);
  
  // Disconnect confirmation states
  const [disconnectModalVisible, setDisconnectModalVisible] = useState(false);
  const [disconnectType, setDisconnectType] = useState<'notion' | 'gmail' | null>(null);
  const [disconnecting, setDisconnecting] = useState(false);
  
  // Checkpoint modal states
  const [checkpointModalVisible, setCheckpointModalVisible] = useState(false);
  const [checkpointMessageId, setCheckpointMessageId] = useState<string | null>(null);
  const [actionsUnlocked, setActionsUnlocked] = useState<Set<string>>(new Set());

  // Integration status
  const [notionConnectionStatus, setNotionConnectionStatus] = useState<IntegrationStatus | null>(null);
  const [gmailConnectionStatus, setGmailConnectionStatus] = useState<IntegrationStatus | null>(null);

  useEffect(() => {
    scrollRef.current?.scrollToEnd({ animated: true });
  }, [messages]);

  // Load user data and integration status on mount
  useEffect(() => {
    async function loadUserData() {
      try {
        const currentUser = await getCurrentUser();
        setUser(currentUser);
        
        // Load integration status
        const [notionStatus, gmailStatus] = await Promise.all([
          getIntegrationStatus('notion'),
          getIntegrationStatus('gmail')
        ]);
        
        setNotionConnectionStatus(notionStatus);
        setGmailConnectionStatus(gmailStatus);
      } catch (error) {
        console.error("Error loading user data:", error);
      }
    }
    
    loadUserData();
  }, []);

  const handleSignOut = async () => {
    // For web testing, let's skip the alert and go straight to sign out
    if (Platform.OS === 'web') {
      setSigningOut(true);
      try {
        const result = await signOut();
        
        if (result.success) {
          setUser(null);
          setNotionConnectionStatus(null);
          setGmailConnectionStatus(null);
          showToast("Signed out successfully", "success");
          
          // Force a page reload to trigger authentication check
          setTimeout(() => {
            window.location?.reload?.();
          }, 1000);
        } else {
          console.error("Sign out failed:", result.error);
          showToast(result.error || "Failed to sign out", "error");
        }
      } catch (error) {
        console.error("Sign out error:", error);
        showToast("Something went wrong. Please try again.", "error");
      } finally {
        setSigningOut(false);
      }
    } else {
      // Use Alert for mobile
      Alert.alert(
        "Sign Out",
        "Are you sure you want to sign out? You'll need to sign in again to use the app.",
        [
          { text: "Cancel", style: "cancel" },
          {
            text: "Sign Out",
            style: "destructive",
            onPress: async () => {
              setSigningOut(true);
              try {
                const result = await signOut();
                
                if (result.success) {
                  setUser(null);
                  setNotionConnectionStatus(null);
                  setGmailConnectionStatus(null);
                  showToast("Signed out successfully", "success");
                } else {
                  console.error("Sign out failed:", result.error);
                  showToast(result.error || "Failed to sign out", "error");
                }
              } catch (error) {
                console.error("Sign out error:", error);
                showToast("Something went wrong. Please try again.", "error");
              } finally {
                setSigningOut(false);
              }
            }
          }
        ]
      );
    }
  };

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

  const executeAction = async (messageId: string, actionId: string) => {
    const message = messages.find((m) => m.id === messageId);
    const action = message?.plan?.find((p) => p.id === actionId);
    
    if (!action) return;

    // Set pending action
    setPendingAction({ messageId, actionId, action });

    // For Notion actions, check connection first
    if (action.action === "notion") {
      const status = await checkNotionConnection();
      setNotionConnectionStatus(status);
      
      if (!status.connected) {
        // Show connection modal
        setNotionConnectModalVisible(true);
      } else {
        // Already connected, show confirm modal
        setNotionModalVisible(true);
      }
    } else if (action.action === "gmail") {
      // Check Gmail connection first
      const status = await checkGmailConnection();
      setGmailConnectionStatus(status);
      
      if (!status.connected) {
        // Show connection modal
        setGmailConnectModalVisible(true);
      } else {
        // Already connected, show confirm modal
        setGmailModalVisible(true);
      }
    }
  };

  const handleNotionConnect = async () => {
    const result = await initiateNotionOAuth();
    
    if (result.success) {
      setNotionConnectModalVisible(false);
      setNotionConnectionStatus({
        connected: true,
        workspaceName: result.workspaceName,
      });
      showToast(
        `Connected to ${result.workspaceName || "Notion"}!`,
        "success"
      );
      
      // After successful connection, show the confirm modal
      if (pendingAction) {
        setNotionModalVisible(true);
      }
    } else {
      showToast(
        result.error || "Failed to connect to Notion. Please try again.",
        "error"
      );
    }
  };

  const handleGmailConnect = async () => {
    const result = await initiateGmailOAuth();
    
    if (result.success) {
      setGmailConnectModalVisible(false);
      setGmailConnectionStatus({
        connected: true,
        workspaceName: result.email,
      });
      showToast(
        `Connected to ${result.email || "Gmail"}!`,
        "success"
      );
      
      // After successful connection, show the confirm modal
      if (pendingAction) {
        setGmailModalVisible(true);
      }
    } else {
      showToast(
        result.error || "Failed to connect to Gmail. Please try again.",
        "error"
      );
    }
  };

  const handleNotionDisconnect = async () => {
    setDisconnecting(true);
    // Immediately update UI to show disconnection
    setNotionConnectionStatus({ connected: false });
    setDisconnectModalVisible(false);
    setDisconnectType(null);
    
    try {
      const result = await disconnectNotion();
      if (result.success) {
        showToast("Notion disconnected successfully", "success");
      } else {
        // Revert the UI change if disconnect failed
        setNotionConnectionStatus({ connected: true });
        showToast("Failed to disconnect Notion", "error");
      }
    } catch (error) {
      console.error("Notion disconnect error:", error);
      // Revert the UI change if disconnect failed
      setNotionConnectionStatus({ connected: true });
      showToast("Failed to disconnect Notion. Please try again.", "error");
    } finally {
      setDisconnecting(false);
    }
  };

  const handleGmailDisconnect = async () => {
    setDisconnecting(true);
    // Immediately update UI to show disconnection
    setGmailConnectionStatus({ connected: false });
    setDisconnectModalVisible(false);
    setDisconnectType(null);
    
    try {
      const result = await disconnectGmail();
      if (result.success) {
        showToast("Gmail disconnected successfully", "success");
      } else {
        // Revert the UI change if disconnect failed
        setGmailConnectionStatus({ connected: true });
        showToast("Failed to disconnect Gmail", "error");
      }
    } catch (error) {
      console.error("Gmail disconnect error:", error);
      // Revert the UI change if disconnect failed
      setGmailConnectionStatus({ connected: true });
      showToast("Failed to disconnect Gmail. Please try again.", "error");
    } finally {
      setDisconnecting(false);
    }
  };

  const showDisconnectConfirmation = (type: 'notion' | 'gmail') => {
    setDisconnectType(type);
    setDisconnectModalVisible(true);
  };

  const confirmNotionAction = async (title: string, parentPageId?: string) => {
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
        action.params?.content || "",
        action.params?.citations || [],
        parentPageId
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
        action.params?.bodyHTML || action.params?.body || ""
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

    // Check all auth requirements together
    const hasNotionActions = editedActions.some((a) => a.action === "notion" && a.status === "pending");
    const hasGmailActions = editedActions.some((a) => a.action === "gmail" && a.status === "pending");
    
    const missingConnections: string[] = [];
    
    if (hasNotionActions) {
      const notionStatus = await checkNotionConnection();
      if (!notionStatus.connected) {
        missingConnections.push("Notion");
      }
    }
    
    if (hasGmailActions) {
      const gmailStatus = await checkGmailConnection();
      if (!gmailStatus.connected) {
        missingConnections.push("Gmail");
      }
    }
    
    if (missingConnections.length > 0) {
      const serviceList = missingConnections.join(" and ");
      showToast(`Please connect ${serviceList} first to run all actions.`, "error");
      return;
    }

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
            action.params?.content || "",
            action.params?.citations || []
          );
          result = pageUrl;
        } else if (action.action === "gmail") {
          const { threadUrl } = await gmailCreateDraft(
            action.params?.to || "your.email@example.com",
            action.params?.subject || "",
            action.params?.bodyHTML || action.params?.body || "",
            action.params?.citations || []
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
        <View style={styles.header}>
          <View style={styles.headerContent}>
            <View style={styles.headerLeft}>
              <Pressable 
                style={styles.backButton}
                onPress={() => router.push('/')}
              >
                <Text style={styles.backButtonText}>‹</Text>
              </Pressable>
              <View style={styles.roleTag}>
                <Text style={styles.roleTagText}>{preset.label}</Text>
              </View>
            </View>
            <View style={styles.headerRight}>
              <View style={styles.headerInfo}>
                {user?.email && (
                  <Text style={styles.userEmail}>{user.email}</Text>
                )}
                <View style={styles.integrationStatus}>
                  
                  {notionConnectionStatus?.connected && (
                    <Pressable 
                      style={[
                        styles.statusBadge,
                        disconnecting && disconnectType === 'notion' && styles.statusBadgeDisconnecting
                      ]}
                       onPress={() => {
                         if (disconnecting) return; // Prevent multiple clicks
                         showDisconnectConfirmation('notion');
                       }}
                      disabled={disconnecting}
                    >
                      {disconnecting && disconnectType === 'notion' ? (
                        <ActivityIndicator size="small" color="#FFFFFF" />
                      ) : (
                        <Text style={styles.statusText}>✓ Notion</Text>
                      )}
                    </Pressable>
                  )}
                  {gmailConnectionStatus?.connected && (
                    <Pressable 
                      style={[
                        styles.statusBadge,
                        disconnecting && disconnectType === 'gmail' && styles.statusBadgeDisconnecting
                      ]}
                       onPress={() => {
                         if (disconnecting) return; // Prevent multiple clicks
                         showDisconnectConfirmation('gmail');
                       }}
                      disabled={disconnecting}
                    >
                      {disconnecting && disconnectType === 'gmail' ? (
                        <ActivityIndicator size="small" color="#FFFFFF" />
                      ) : (
                        <Text style={styles.statusText}>✓ Gmail</Text>
                      )}
                    </Pressable>
                  )}
                </View>
              </View>
               <Pressable 
                 style={[styles.signOutIconButton, signingOut && styles.signOutButtonDisabled]}
                 onPress={handleSignOut}
                 disabled={signingOut}
               >
                {signingOut ? (
                  <ActivityIndicator size="small" color="#ef4444" />
                ) : (
                  <Text style={styles.signOutIconText}>⏻</Text>
                )}
              </Pressable>
            </View>
          </View>
        </View>
        <ScrollView 
          ref={scrollRef} 
          style={{ flex: 1, padding: 16 }}
          contentContainerStyle={{ paddingBottom: 20 }}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
        >
          {messages.filter(m => m.role !== "system").map((m, index) => {
            // Use message ID if available, otherwise fallback to index
            const messageKey = m.id || `message-${index}`;
            return (
            <View key={messageKey}>
              {/* Only show main content if no structured content, or if structured content is different */}
              {(!m.structured?.bullets || m.structured.bullets.length === 0) && (
                <View style={[styles.bubble, m.role==="user"?styles.user:styles.assistant]}>
                  <Text style={m.role==="user"?styles.userText:styles.assistantText}>{m.content}</Text>
                </View>
              )}
              
              {/* Show structured answer if available and different from main content */}
              {m.structured?.answer && m.structured.answer !== m.content && (
                <View style={styles.structuredAnswer}>
                  <Text style={styles.structuredAnswerText}>{m.structured.answer}</Text>
                </View>
              )}
              {/* Structured content - bullets */}
              {m.structured?.bullets && m.structured.bullets.length > 0 && (
                <View style={styles.bullets}>
                  <Text style={styles.bulletsTitle}>Key Points:</Text>
                  {m.structured.bullets.map((bullet, index) => (
                    <View key={index} style={styles.bulletItem}>
                      <Text style={styles.bulletDot}>•</Text>
                      <Text style={styles.bulletText}>{bullet}</Text>
                    </View>
                  ))}
                </View>
              )}

              {/* Followup questions */}
              {m.structured?.followups && m.structured.followups.length > 0 && (
                <View style={styles.followups}>
                  <Text style={styles.followupsTitle}>Suggested Questions:</Text>
                  <View style={styles.followupChips}>
                    {m.structured.followups.map((followup, index) => (
                      <Pressable
                        key={index}
                        style={styles.followupChip}
                        onPress={() => setInput(followup)}
                      >
                        <Text style={styles.followupChipText}>{followup}</Text>
                      </Pressable>
                    ))}
                  </View>
                </View>
              )}

              {/* Citations - use structured citations if available, fallback to legacy */}
              {((m.structured?.citations && m.structured.citations.length > 0) || (m.citations && m.citations.length > 0)) && (
                <View style={styles.citations}>
                  <Text style={styles.citationsTitle}>Sources:</Text>
                  {(m.structured?.citations || m.citations || []).map((citation) => (
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
                        <View key="checkpoint-container">
                          <Pressable
                            style={styles.reviewPlanButton}
                            onPress={() => openCheckpointModal(m.id)}
                          >
                            <Text style={styles.reviewPlanButtonText}>Review Plan</Text>
                          </Pressable>
                        </View>
                      );
                    }

                    return (
                      <>
                        {m.plan!.map((action) => (
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
                        ))}
                      </>
                    );
                  })()}
                </View>
              )}
            </View>
            );
          })}
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
            multiline
            textAlignVertical="top"
            maxLength={5000}
          />
          <Pressable onPress={onSend} style={[styles.send, loading && styles.sendDisabled]} disabled={loading}>
            <Text style={{ color:"white" }}>Send</Text>
          </Pressable>
        </View>

        {/* Confirmation Modals */}
        <NotionConnectModal
          visible={notionConnectModalVisible}
          onClose={() => {
            setNotionConnectModalVisible(false);
            setPendingAction(null);
          }}
          onConnect={handleNotionConnect}
        />

        <GmailConnectModal
          visible={gmailConnectModalVisible}
          onClose={() => {
            setGmailConnectModalVisible(false);
            setPendingAction(null);
          }}
          onConnect={handleGmailConnect}
        />

        <NotionConfirmModal
          visible={notionModalVisible}
          onClose={() => {
            setNotionModalVisible(false);
            setPendingAction(null);
          }}
          onConfirm={confirmNotionAction}
          initialTitle={pendingAction?.action.params?.title || "Untitled"}
          content={pendingAction?.action.params?.content || ""}
          citations={pendingAction?.action.params?.citations || []}
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
          body={pendingAction?.action.params?.bodyText || ""}
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

        {/* Disconnect Confirmation Modal */}
        {disconnectModalVisible && (
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>
                Disconnect {disconnectType === 'notion' ? 'Notion' : 'Gmail'}?
              </Text>
              <Text style={styles.modalMessage}>
                Are you sure you want to disconnect {disconnectType === 'notion' ? 'Notion' : 'Gmail'}? 
                You'll need to reconnect to use {disconnectType === 'notion' ? 'Notion' : 'Gmail'} features.
              </Text>
              <View style={styles.modalButtons}>
                <Pressable
                  style={[styles.modalButton, styles.modalButtonCancel]}
                  onPress={() => {
                    setDisconnectModalVisible(false);
                    setDisconnectType(null);
                  }}
                >
                  <Text style={styles.modalButtonCancelText}>Cancel</Text>
                </Pressable>
                <Pressable
                  style={[styles.modalButton, styles.modalButtonConfirm]}
                  onPress={() => {
                    if (disconnectType === 'notion') {
                      handleNotionDisconnect();
                    } else if (disconnectType === 'gmail') {
                      handleGmailDisconnect();
                    }
                  }}
                >
                  <Text style={styles.modalButtonConfirmText}>Disconnect</Text>
                </Pressable>
              </View>
            </View>
          </View>
        )}
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
  header:{ 
    padding: 16, 
    borderBottomWidth:0, 
    backgroundColor: "#4F7CFF",
    ...Platform.select({
      ios: {
        shadowColor: "#4F7CFF",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
      },
      android: {
        elevation: 6,
      },
    }),
  },
  headerContent: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    flex: 1,
  },
  headerRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  headerInfo: {
    alignItems: "flex-end",
    gap: 4,
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(255,255,255,0.25)",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.4)",
    ...Platform.select({
      ios: {
        shadowColor: "#000000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  backButtonText: {
    fontSize: 20,
    color: "#FFFFFF",
    fontWeight: "700",
    textAlign: "center",
    lineHeight: 20,
    includeFontPadding: false,
    textAlignVertical: "center",
  },
  roleTag: {
    backgroundColor: "rgba(255,255,255,0.1)",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.3)",
  },
  roleTagText: {
    fontSize: 10,
    fontWeight: "500",
    color: "rgba(255,255,255,0.9)",
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },
  signOutIconButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(255,255,255,0.25)",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.4)",
    ...Platform.select({
      ios: {
        shadowColor: "#000000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  signOutButtonDisabled: {
    opacity: 0.5,
  },
  signOutIconText: {
    fontSize: 18,
    color: "#FFFFFF",
    fontWeight: "700",
  },
  userEmail: {
    fontSize: 12,
    color: "rgba(255,255,255,0.8)",
  },
  integrationStatus: {
    flexDirection: "row",
    gap: 8,
  },
  statusBadge: {
    backgroundColor: "rgba(255,255,255,0.2)",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.3)",
    minHeight: 24,
    minWidth: 60,
    ...Platform.select({
      ios: {
        shadowColor: "#000000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
      },
      android: {
        elevation: 1,
      },
    }),
  },
  statusBadgeDisconnecting: {
    backgroundColor: "rgba(255,255,255,0.1)",
    opacity: 0.7,
  },
  statusText: {
    color: "#FFFFFF",
    fontSize: 10,
    fontWeight: "600",
  },
  bubble:{ 
    marginBottom:16, 
    padding:16, 
    borderRadius:16, 
    backgroundColor:"#FFFFFF",
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
  user:{ 
    alignSelf:"flex-end", 
    backgroundColor:"#4F7CFF",
    maxWidth: "80%",
  },
  assistant:{ 
    alignSelf:"flex-start",
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    maxWidth: "95%",
    flexShrink: 1,
  },
  userText: {
    color: "#FFFFFF",
    fontSize: 16,
    lineHeight: 22,
    flexWrap: "wrap",
  },
  assistantText: {
    color: "#1E293B",
    fontSize: 16,
    lineHeight: 22,
    flexWrap: "wrap",
  },
  citations: {
    marginTop: 12,
    marginBottom: 16,
    padding: 16,
    backgroundColor: "#EBF2FF",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#4F7CFF",
    ...Platform.select({
      ios: {
        shadowColor: "#4F7CFF",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  citationsTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#1E293B",
    marginBottom: 12,
  },
  citationCard: {
    flexDirection: "row",
    padding: 12,
    marginBottom: 8,
    backgroundColor: "#FFFFFF",
    borderRadius: 10,
    borderWidth: 1,
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
  citationNumber: {
    fontSize: 12,
    fontWeight: "700",
    color: "#4F7CFF",
    marginRight: 10,
    backgroundColor: "#EBF2FF",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  citationTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#1E293B",
    marginBottom: 4,
  },
  citationSnippet: {
    fontSize: 13,
    color: "#64748B",
    lineHeight: 18,
  },
  bullets: {
    marginTop: 12,
    marginBottom: 16,
    padding: 16,
    backgroundColor: "#F0F9FF",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#0EA5E9",
    ...Platform.select({
      ios: {
        shadowColor: "#0EA5E9",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  bulletsTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#1E293B",
    marginBottom: 12,
  },
  bulletItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 8,
  },
  bulletDot: {
    fontSize: 16,
    color: "#0EA5E9",
    marginRight: 8,
    marginTop: 2,
  },
  bulletText: {
    flex: 1,
    fontSize: 14,
    color: "#1E293B",
    lineHeight: 20,
    flexWrap: "wrap",
  },
  followups: {
    marginTop: 12,
    marginBottom: 16,
    padding: 16,
    backgroundColor: "#F0FDF4",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#22C55E",
    ...Platform.select({
      ios: {
        shadowColor: "#22C55E",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  followupsTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#1E293B",
    marginBottom: 12,
  },
  followupChips: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  followupChip: {
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#22C55E",
    ...Platform.select({
      ios: {
        shadowColor: "#22C55E",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
      },
      android: {
        elevation: 1,
      },
    }),
  },
  followupChipText: {
    fontSize: 13,
    color: "#22C55E",
    fontWeight: "500",
  },
  actionsCard: {
    marginTop: 12,
    marginBottom: 16,
    padding: 16,
    backgroundColor: "#EBF2FF",
    borderRadius: 12,
    borderWidth: 2,
    borderColor: "#4F7CFF",
    ...Platform.select({
      ios: {
        shadowColor: "#4F7CFF",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  actionsTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#1E293B",
    marginBottom: 12,
  },
  actionRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  actionButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 20,
    backgroundColor: "#4F7CFF",
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 44,
    ...Platform.select({
      ios: {
        shadowColor: "#4F7CFF",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  actionButtonText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "600",
  },
  actionDone: {
    backgroundColor: "#10B981",
  },
  actionError: {
    backgroundColor: "#EF4444",
  },
  resultLink: {
    marginLeft: 12,
    color: "#4F7CFF",
    fontSize: 14,
    fontWeight: "600",
    textDecorationLine: "underline",
  },
  errorText: {
    marginLeft: 12,
    color: "#EF4444",
    fontSize: 13,
    fontWeight: "500",
  },
  reviewPlanButton: {
    paddingVertical: 16,
    paddingHorizontal: 24,
    backgroundColor: "#4F7CFF",
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    ...Platform.select({
      ios: {
        shadowColor: "#4F7CFF",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.4,
        shadowRadius: 8,
      },
      android: {
        elevation: 6,
      },
    }),
  },
  reviewPlanButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
  },
  loadingBubble: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    padding: 16,
    borderRadius: 16,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    marginBottom: 16,
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
  loadingText: {
    marginLeft: 12,
    color: "#64748B",
    fontSize: 15,
    fontWeight: "500",
  },
  inputBar:{ 
    flexDirection:"row", 
    padding:20, 
    borderTopWidth:0, 
    alignItems:"flex-end",
    backgroundColor: "#FFFFFF",
    ...Platform.select({
      ios: {
        shadowColor: "#1E293B",
        shadowOffset: { width: 0, height: -2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  input:{ 
    flex:1, 
    padding:16, 
    backgroundColor:"#F8FAFC", 
    borderRadius:12, 
    marginRight:12, 
    minHeight:48, 
    maxHeight:120,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    fontSize: 16,
  },
  send:{ 
    paddingHorizontal:20, 
    paddingVertical:16, 
    justifyContent:"center", 
    borderRadius:12, 
    backgroundColor:"#4F7CFF",
    ...Platform.select({
      ios: {
        shadowColor: "#4F7CFF",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  sendDisabled: { 
    opacity: 0.5,
    backgroundColor: "#94A3B8",
  },
  modalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
    margin: 20,
    maxWidth: 400,
    width: '90%',
    ...Platform.select({
      ios: {
        shadowColor: '#000000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: 12,
    textAlign: 'center',
  },
  modalMessage: {
    fontSize: 16,
    color: '#64748B',
    lineHeight: 22,
    marginBottom: 24,
    textAlign: 'center',
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalButtonCancel: {
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  modalButtonConfirm: {
    backgroundColor: '#EF4444',
  },
  modalButtonCancelText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#64748B',
  },
  modalButtonConfirmText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  structuredAnswer: {
    marginTop: 12,
    marginBottom: 16,
    padding: 16,
    backgroundColor: "#FEF3C7",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#F59E0B",
    ...Platform.select({
      ios: {
        shadowColor: "#F59E0B",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  structuredAnswerText: {
    fontSize: 14,
    color: "#1E293B",
    lineHeight: 20,
  },
});

