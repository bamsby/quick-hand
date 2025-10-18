import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from "react-native";
import { signInWithEmail, signUpWithEmail, resetPassword } from "../auth-helpers";

interface AuthModalProps {
  onAuthSuccess: () => void;
}

type AuthMode = "signin" | "signup" | "reset";

export function AuthModal({ onAuthSuccess }: AuthModalProps) {
  const [mode, setMode] = useState<AuthMode>("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSignIn = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert("Error", "Please enter both email and password");
      return;
    }

    setLoading(true);
    try {
      const result = await signInWithEmail(email.trim(), password);
      
      if (result.success) {
        onAuthSuccess();
      } else {
        // Handle specific error cases
        if (result.error?.includes("Invalid login credentials") || result.error?.includes("invalid credentials")) {
          Alert.alert(
            "Invalid Credentials",
            "The email or password is incorrect. Please try again or sign up for a new account.",
            [
              { text: "Try Again", style: "cancel" },
              { text: "Sign Up", onPress: () => setMode("signup") }
            ]
          );
        } else {
          Alert.alert("Sign In Failed", result.error || "Unknown error");
        }
      }
    } catch (error) {
      Alert.alert("Error", "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleSignUp = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert("Error", "Please enter both email and password");
      return;
    }

    if (password.length < 6) {
      Alert.alert("Error", "Password must be at least 6 characters");
      return;
    }

    setLoading(true);
    try {
      const result = await signUpWithEmail(email.trim(), password);
      
      if (result.success) {
        if (result.needsEmailConfirmation) {
          Alert.alert(
            "Check Your Email", 
            "We've sent you a confirmation link. Please check your email and click the link to verify your account.",
            [{ text: "OK", onPress: () => setMode("signin") }]
          );
        } else {
          onAuthSuccess();
        }
      } else {
        // Handle specific error cases
        if (result.error?.includes("User already registered") || result.error?.includes("already registered")) {
          Alert.alert(
            "Account Already Exists",
            "This email is already registered. Would you like to sign in instead?",
            [
              { text: "Cancel", style: "cancel" },
              { text: "Sign In", onPress: () => setMode("signin") }
            ]
          );
        } else {
          Alert.alert("Sign Up Failed", result.error || "Unknown error");
        }
      }
    } catch (error) {
      Alert.alert("Error", "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async () => {
    if (!email.trim()) {
      Alert.alert("Error", "Please enter your email address");
      return;
    }

    setLoading(true);
    try {
      const result = await resetPassword(email.trim());
      
      if (result.success) {
        Alert.alert(
          "Reset Link Sent", 
          "We've sent you a password reset link. Please check your email.",
          [{ text: "OK", onPress: () => setMode("signin") }]
        );
      } else {
        Alert.alert("Reset Failed", result.error || "Unknown error");
      }
    } catch (error) {
      Alert.alert("Error", "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = () => {
    if (mode === "signin") {
      handleSignIn();
    } else if (mode === "signup") {
      handleSignUp();
    } else if (mode === "reset") {
      handleResetPassword();
    }
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container} 
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.content}>
          <Text style={styles.title}>Welcome to QuickHand</Text>
          <Text style={styles.subtitle}>
            {mode === "signin" && "Sign in to continue"}
            {mode === "signup" && "Create your account"}
            {mode === "reset" && "Reset your password"}
          </Text>

          <View style={styles.form}>
            <TextInput
              style={styles.input}
              placeholder="Email"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              editable={!loading}
            />

            {mode !== "reset" && (
              <TextInput
                style={styles.input}
                placeholder="Password"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                autoCapitalize="none"
                autoCorrect={false}
                editable={!loading}
              />
            )}

            <Pressable
              style={[styles.button, loading && styles.buttonDisabled]}
              onPress={handleSubmit}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.buttonText}>
                  {mode === "signin" && "Sign In"}
                  {mode === "signup" && "Sign Up"}
                  {mode === "reset" && "Send Reset Link"}
                </Text>
              )}
            </Pressable>

            <View style={styles.links}>
              {mode === "signin" && (
                <>
                  <Pressable onPress={() => setMode("signup")}>
                    <Text style={styles.linkText}>Don't have an account? Sign up</Text>
                  </Pressable>
                  <Pressable onPress={() => setMode("reset")}>
                    <Text style={styles.linkText}>Forgot password?</Text>
                  </Pressable>
                </>
              )}
              
              {mode === "signup" && (
                <Pressable onPress={() => setMode("signin")}>
                  <Text style={styles.linkText}>Already have an account? Sign in</Text>
                </Pressable>
              )}
              
              {mode === "reset" && (
                <Pressable onPress={() => setMode("signin")}>
                  <Text style={styles.linkText}>Back to sign in</Text>
                </Pressable>
              )}
            </View>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: "center",
  },
  content: {
    padding: 24,
    maxWidth: 400,
    alignSelf: "center",
    width: "100%",
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
    textAlign: "center",
    marginBottom: 8,
    color: "#1a1a1a",
  },
  subtitle: {
    fontSize: 16,
    textAlign: "center",
    marginBottom: 32,
    color: "#666",
  },
  form: {
    gap: 16,
  },
  input: {
    borderWidth: 1,
    borderColor: "#e0e0e0",
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    backgroundColor: "#fafafa",
  },
  button: {
    backgroundColor: "#007AFF",
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
    marginTop: 8,
  },
  buttonDisabled: {
    backgroundColor: "#ccc",
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  links: {
    gap: 12,
    marginTop: 24,
  },
  linkText: {
    color: "#007AFF",
    fontSize: 14,
    textAlign: "center",
    textDecorationLine: "underline",
  },
});
