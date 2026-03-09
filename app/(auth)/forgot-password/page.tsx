"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useSignIn } from "@clerk/nextjs";
import { Icon } from "@/components/ui/icon";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

type Step = "email" | "code" | "new-password";

export default function ForgotPasswordPage() {
  const { isLoaded, signIn, setActive } = useSignIn();
  const router = useRouter();

  const [step, setStep] = useState<Step>("email");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [resent, setResent] = useState(false);

  // --- Step 1: Request reset code ---

  async function handleRequestCode(e: React.FormEvent) {
    e.preventDefault();
    if (!isLoaded) return;

    if (!email.trim()) {
      setError("Email is required.");
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError("Enter a valid email address.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      await signIn.create({
        strategy: "reset_password_email_code",
        identifier: email,
      });
      setStep("code");
    } catch (err: unknown) {
      const clerkErr = err as { errors?: { message: string }[] };
      setError(
        clerkErr.errors?.[0]?.message ??
          "Something went wrong. Please try again."
      );
    } finally {
      setLoading(false);
    }
  }

  // --- Resend code ---

  async function handleResendCode() {
    if (!isLoaded || resending) return;

    setResending(true);
    setError("");
    setResent(false);

    try {
      await signIn.create({
        strategy: "reset_password_email_code",
        identifier: email,
      });
      setResent(true);
      setCode("");
    } catch (err: unknown) {
      const clerkErr = err as { errors?: { message: string }[] };
      setError(
        clerkErr.errors?.[0]?.message ??
          "Failed to resend code. Please try again."
      );
    } finally {
      setResending(false);
    }
  }

  // --- Step 2: Verify reset code ---

  async function handleVerifyCode(e: React.FormEvent) {
    e.preventDefault();
    if (!isLoaded) return;

    if (!code.trim()) {
      setError("Verification code is required.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const result = await signIn.attemptFirstFactor({
        strategy: "reset_password_email_code",
        code,
      });

      if (result.status === "needs_new_password") {
        setStep("new-password");
      } else if (result.status === "complete") {
        await setActive({ session: result.createdSessionId });
        router.push("/dashboard");
      }
    } catch (err: unknown) {
      const clerkErr = err as { errors?: { message: string }[] };
      setError(
        clerkErr.errors?.[0]?.message ?? "Invalid code. Please try again."
      );
    } finally {
      setLoading(false);
    }
  }

  // --- Step 3: Set new password ---

  async function handleResetPassword(e: React.FormEvent) {
    e.preventDefault();
    if (!isLoaded) return;

    if (newPassword.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const result = await signIn.resetPassword({ password: newPassword });

      if (result.status === "complete") {
        await setActive({ session: result.createdSessionId });
        router.push("/dashboard");
      }
    } catch (err: unknown) {
      const clerkErr = err as { errors?: { message: string }[] };
      setError(
        clerkErr.errors?.[0]?.message ??
          "Something went wrong. Please try again."
      );
    } finally {
      setLoading(false);
    }
  }

  // --- Step 3 UI: Set new password ---

  if (step === "new-password") {
    return (
      <Card className="w-full max-w-md bg-transparent shadow-none border-none">
        <CardHeader className="text-center">
          <CardTitle className="font-heading text-4xl text-white">
            Set new password
          </CardTitle>
          <CardDescription className="text-base text-neutral-400">
            Choose a new password for your account
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleResetPassword} noValidate className="space-y-4">
            <div className="space-y-2">
              <Label
                htmlFor="new-password"
                className="text-base text-neutral-300"
              >
                New password
              </Label>
              <Input
                id="new-password"
                type="password"
                autoFocus
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="bg-neutral-900 border-border text-white placeholder:text-neutral-500 h-11 text-base md:text-base"
              />
            </div>

            <div className="space-y-2">
              <Label
                htmlFor="confirm-password"
                className="text-base text-neutral-300"
              >
                Confirm password
              </Label>
              <Input
                id="confirm-password"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="bg-neutral-900 border-border text-white placeholder:text-neutral-500 h-11 text-base md:text-base"
              />
            </div>

            {error && <p className="text-base text-destructive">{error}</p>}

            <Button
              type="submit"
              disabled={loading}
              className="bg-buildstory-500 text-black hover:bg-buildstory-400 h-11 font-medium w-full text-base"
            >
              {loading && (
                <Icon
                  name="progress_activity"
                  className="animate-spin"
                  size="4"
                />
              )}
              Reset password
            </Button>
          </form>
        </CardContent>
      </Card>
    );
  }

  // --- Step 2 UI: Enter verification code ---

  if (step === "code") {
    return (
      <Card className="w-full max-w-md bg-transparent shadow-none border-none">
        <CardHeader className="text-center">
          <CardTitle className="font-heading text-4xl text-white">
            Check your email
          </CardTitle>
          <CardDescription className="text-base text-neutral-400">
            We sent a verification code to {email}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleVerifyCode} noValidate className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="code" className="text-base text-neutral-300">
                Verification code
              </Label>
              <Input
                id="code"
                type="text"
                inputMode="numeric"
                autoComplete="one-time-code"
                autoFocus
                placeholder="123456"
                maxLength={6}
                value={code}
                onChange={(e) =>
                  setCode(e.target.value.replace(/\D/g, "").slice(0, 6))
                }
                required
                className="bg-neutral-900 border-border text-white placeholder:text-neutral-500 h-11 font-mono text-center text-lg md:text-lg tracking-widest"
              />
            </div>

            {error && <p className="text-base text-destructive">{error}</p>}

            <Button
              type="submit"
              disabled={loading || code.length !== 6}
              className="bg-buildstory-500 text-black hover:bg-buildstory-400 h-11 font-medium w-full text-base"
            >
              {loading && (
                <Icon
                  name="progress_activity"
                  className="animate-spin"
                  size="4"
                />
              )}
              Verify
            </Button>
          </form>

          <div className="mt-6 flex flex-col items-center gap-2 text-base text-neutral-400">
            <p>
              Didn&apos;t receive a code?{" "}
              <button
                onClick={handleResendCode}
                disabled={resending}
                className="text-buildstory-400 hover:text-buildstory-500 cursor-pointer disabled:opacity-50"
              >
                {resending ? "Resending..." : "Resend code"}
              </button>
              {resent && (
                <span className="ml-2 text-sm text-green-500">Sent!</span>
              )}
            </p>
            <button
              onClick={() => {
                setStep("email");
                setCode("");
                setError("");
                setResent(false);
              }}
              className="text-buildstory-400 hover:text-buildstory-500 cursor-pointer"
            >
              Use a different email
            </button>
          </div>
        </CardContent>
      </Card>
    );
  }

  // --- Step 1 UI: Enter email ---

  return (
    <Card className="w-full max-w-md bg-transparent shadow-none border-none">
      <CardHeader className="text-center">
        <CardTitle className="font-heading text-4xl text-white">
          Reset your password
        </CardTitle>
        <CardDescription className="text-base text-neutral-400">
          Enter your email and we&apos;ll send you a reset code
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleRequestCode} noValidate className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email" className="text-base text-neutral-300">
              Email
            </Label>
            <Input
              id="email"
              type="email"
              autoFocus
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="bg-neutral-900 border-border text-white placeholder:text-neutral-500 h-11 text-base md:text-base"
            />
          </div>

          {error && <p className="text-base text-destructive">{error}</p>}

          <Button
            type="submit"
            disabled={loading}
            className="bg-buildstory-500 text-black hover:bg-buildstory-400 h-11 font-medium w-full text-base"
          >
            {loading && (
              <Icon
                name="progress_activity"
                className="animate-spin"
                size="4"
              />
            )}
            Send reset code
          </Button>
        </form>

        <p className="mt-6 text-center text-base text-neutral-400">
          Remember your password?{" "}
          <Link
            href="/sign-in"
            className="text-buildstory-400 hover:text-buildstory-500"
          >
            Sign in
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}
