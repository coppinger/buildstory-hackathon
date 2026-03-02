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
import { Separator } from "@/components/ui/separator";
import { GoogleIcon, GitHubIcon } from "@/components/icons";

export default function SignInPage() {
  const { isLoaded, signIn, setActive } = useSignIn();
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<{ email?: string; password?: string }>({});
  const [touched, setTouched] = useState<{ email?: boolean; password?: boolean }>({});
  const [loading, setLoading] = useState(false);
  const [oauthLoading, setOauthLoading] = useState<string | null>(null);

  // Second factor (2FA) state
  type SecondFactorStrategy = "totp" | "phone_code" | "email_code" | "backup_code";
  type SupportedFactor = { strategy: string; phoneNumberId?: string; emailAddressId?: string };
  const [needsSecondFactor, setNeedsSecondFactor] = useState(false);
  const [secondFactorStrategy, setSecondFactorStrategy] = useState<SecondFactorStrategy | null>(null);
  const [supportedFactors, setSupportedFactors] = useState<SupportedFactor[]>([]);
  const [code, setCode] = useState("");
  const [verifying, setVerifying] = useState(false);

  function validateField(field: "email" | "password", value: string) {
    if (field === "email") {
      if (!value.trim()) return "Email is required.";
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) return "Enter a valid email address.";
    }
    if (field === "password") {
      if (!value) return "Password is required.";
      if (value.length < 8) return "Password must be at least 8 characters.";
    }
    return undefined;
  }

  function validateAll() {
    const errors = {
      email: validateField("email", email),
      password: validateField("password", password),
    };
    setFieldErrors(errors);
    setTouched({ email: true, password: true });
    return !errors.email && !errors.password;
  }

  function handleBlur(field: "email" | "password") {
    setTouched((p) => ({ ...p, [field]: true }));
    const value = field === "email" ? email : password;
    setFieldErrors((p) => ({ ...p, [field]: validateField(field, value) }));
  }

  function handleChange(field: "email" | "password", value: string) {
    if (field === "email") setEmail(value);
    else setPassword(value);
    if (touched[field]) {
      setFieldErrors((p) => ({ ...p, [field]: validateField(field, value) }));
    }
  }

  async function handleOAuth(strategy: "oauth_google" | "oauth_github") {
    if (!isLoaded) return;
    setOauthLoading(strategy);
    try {
      await signIn.authenticateWithRedirect({
        strategy,
        redirectUrl: "/sign-in/sso-callback",
        redirectUrlComplete: "/dashboard",
      });
    } catch (err: unknown) {
      const clerkErr = err as { errors?: { message: string }[] };
      setError(clerkErr.errors?.[0]?.message ?? "OAuth sign-in failed.");
      setOauthLoading(null);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!isLoaded || !validateAll()) return;

    setLoading(true);
    setError("");

    try {
      const result = await signIn.create({
        identifier: email,
        password,
      });

      if (result.status === "complete") {
        await setActive({ session: result.createdSessionId });
        router.push("/dashboard");
      } else if (result.status === "needs_second_factor") {
        const factors = result.supportedSecondFactors;
        // Pick best strategy: prefer totp > phone_code > email_code
        const factor =
          factors?.find((f) => f.strategy === "totp") ??
          factors?.find((f) => f.strategy === "phone_code") ??
          factors?.find((f) => f.strategy === "email_code");

        if (!factor) {
          setError("Your account requires a verification method that isn't supported here. Please contact support.");
          return;
        }

        const strategy = factor.strategy as SecondFactorStrategy;

        if (strategy === "phone_code") {
          try {
            const phoneFactor = factor as { strategy: "phone_code"; phoneNumberId: string };
            await signIn.prepareSecondFactor({ strategy, phoneNumberId: phoneFactor.phoneNumberId });
          } catch {
            setError("Unable to send verification code. Please try again.");
            return;
          }
        } else if (strategy === "email_code") {
          try {
            const emailFactor = factor as { strategy: "email_code"; emailAddressId: string };
            await signIn.prepareSecondFactor({ strategy, emailAddressId: emailFactor.emailAddressId });
          } catch {
            setError("Unable to send verification code. Please try again.");
            return;
          }
        }

        setSupportedFactors(factors ?? []);
        setSecondFactorStrategy(strategy);
        setNeedsSecondFactor(true);
      }
    } catch (err: unknown) {
      const clerkErr = err as { errors?: { message: string }[] };
      setError(
        clerkErr.errors?.[0]?.message ?? "Something went wrong. Please try again."
      );
    } finally {
      setLoading(false);
    }
  }

  async function handleSecondFactor(e: React.FormEvent) {
    e.preventDefault();
    if (!isLoaded) return;

    setVerifying(true);
    setError("");

    try {
      const result = await signIn.attemptSecondFactor({
        strategy: secondFactorStrategy!,
        code,
      });

      if (result.status === "complete") {
        await setActive({ session: result.createdSessionId });
        router.push("/dashboard");
      } else {
        setError("Verification could not be completed. Please try again.");
      }
    } catch (err: unknown) {
      const clerkErr = err as { errors?: { message: string }[] };
      setError(
        clerkErr.errors?.[0]?.message ?? "Invalid code. Please try again."
      );
    } finally {
      setVerifying(false);
    }
  }

  // --- Second factor verification screen ---

  if (needsSecondFactor) {
    const title =
      secondFactorStrategy === "totp"
        ? "Enter authenticator code"
        : secondFactorStrategy === "phone_code"
          ? "Check your phone"
          : secondFactorStrategy === "backup_code"
            ? "Enter backup code"
            : "Check your email";

    const description =
      secondFactorStrategy === "totp"
        ? "Enter the 6-digit code from your authenticator app"
        : secondFactorStrategy === "phone_code"
          ? "We sent a verification code to your phone"
          : secondFactorStrategy === "backup_code"
            ? "Enter one of your backup codes"
            : "We sent a verification code to your email";

    const isBackupCode = secondFactorStrategy === "backup_code";

    return (
      <Card className="w-full max-w-md bg-transparent shadow-none border-none">
        <CardHeader className="text-center">
          <CardTitle className="font-heading text-4xl text-white">
            {title}
          </CardTitle>
          <CardDescription className="text-base text-neutral-400">
            {description}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSecondFactor} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="code" className="text-base text-neutral-300">
                {isBackupCode ? "Backup code" : "Verification code"}
              </Label>
              <Input
                id="code"
                type="text"
                inputMode={isBackupCode ? "text" : "numeric"}
                autoComplete="one-time-code"
                autoFocus
                placeholder={isBackupCode ? "Enter backup code" : "123456"}
                maxLength={isBackupCode ? 24 : 6}
                value={code}
                onChange={(e) =>
                  setCode(
                    isBackupCode
                      ? e.target.value
                      : e.target.value.replace(/\D/g, "").slice(0, 6)
                  )
                }
                required
                className="bg-neutral-900 border-border text-white placeholder:text-neutral-500 h-11 font-mono text-center text-lg md:text-lg tracking-widest"
              />
            </div>

            {error && <p className="text-base text-destructive">{error}</p>}

            <Button
              type="submit"
              disabled={verifying || (!isBackupCode && code.length !== 6) || !code.trim()}
              className="bg-buildstory-500 text-black hover:bg-buildstory-400 h-11 font-medium w-full text-base"
            >
              {verifying && <Icon name="progress_activity" className="animate-spin" size="4" />}
              Verify
            </Button>
          </form>

          <p className="mt-6 text-center text-base text-neutral-400">
            <button
              onClick={() => {
                // signIn.create() on the next submit will start a fresh attempt
                setNeedsSecondFactor(false);
                setSecondFactorStrategy(null);
                setSupportedFactors([]);
                setCode("");
                setError("");
              }}
              className="text-buildstory-400 hover:text-buildstory-500 cursor-pointer"
            >
              Back to sign in
            </button>
            {secondFactorStrategy !== "backup_code" && supportedFactors.some((f) => f.strategy === "backup_code") && (
              <>
                <span className="mx-2 text-neutral-600">&middot;</span>
                <button
                  onClick={() => {
                    setSecondFactorStrategy("backup_code");
                    setCode("");
                    setError("");
                  }}
                  className="text-buildstory-400 hover:text-buildstory-500 cursor-pointer"
                >
                  Use a backup code
                </button>
              </>
            )}
          </p>
        </CardContent>
      </Card>
    );
  }

  // --- Sign-in form ---

  return (
    <Card className="w-full max-w-md bg-transparent shadow-none border-none">
      <CardHeader className="text-center">
        <CardTitle className="font-heading text-4xl text-white">
          Welcome back
        </CardTitle>
        <CardDescription className="text-base text-neutral-400">
          Login to your account
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-3">
          <Button
            variant="outline"
            className="border-border bg-transparent text-white hover:bg-white/5 h-11 text-base"
            onClick={() => handleOAuth("oauth_google")}
            disabled={oauthLoading !== null}
          >
            {oauthLoading === "oauth_google" ? (
              <Icon name="progress_activity" className="animate-spin" size="4" />
            ) : (
              <GoogleIcon className="size-5" />
            )}
            Google
          </Button>
          <Button
            variant="outline"
            className="border-border bg-transparent text-white hover:bg-white/5 h-11 text-base"
            onClick={() => handleOAuth("oauth_github")}
            disabled={oauthLoading !== null}
          >
            {oauthLoading === "oauth_github" ? (
              <Icon name="progress_activity" className="animate-spin" size="4" />
            ) : (
              <GitHubIcon className="size-5" />
            )}
            GitHub
          </Button>
        </div>

        <div className="relative my-6">
          <Separator />
          <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-neutral-950 px-3 font-mono text-base text-neutral-500">
            or
          </span>
        </div>

        <form onSubmit={handleSubmit} noValidate className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email" className="text-base text-neutral-300">
              Email
            </Label>
            <Input
              id="email"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => handleChange("email", e.target.value)}
              onBlur={() => handleBlur("email")}
              aria-invalid={!!fieldErrors.email}
              className="bg-neutral-900 border-border text-white placeholder:text-neutral-500 h-11 text-base md:text-base"
            />
            {fieldErrors.email && <p className="text-sm text-destructive">{fieldErrors.email}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="password" className="text-base text-neutral-300">
              Password
            </Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => handleChange("password", e.target.value)}
              onBlur={() => handleBlur("password")}
              aria-invalid={!!fieldErrors.password}
              className="bg-neutral-900 border-border text-white placeholder:text-neutral-500 h-11 text-base md:text-base"
            />
            {fieldErrors.password && <p className="text-sm text-destructive">{fieldErrors.password}</p>}
          </div>

          {error && <p className="text-base text-destructive">{error}</p>}

          <Button
            type="submit"
            disabled={loading}
            className="bg-buildstory-500 text-black hover:bg-buildstory-400 h-11 font-medium w-full text-base"
          >
            {loading && <Icon name="progress_activity" className="animate-spin" size="4" />}
            Login
          </Button>
        </form>

        <p className="mt-6 text-center text-base text-neutral-400">
          Don&apos;t have an account?{" "}
          <Link
            href="/sign-up"
            className="text-buildstory-400 hover:text-buildstory-500"
          >
            Register
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}
