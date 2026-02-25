"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useSignUp } from "@clerk/nextjs";
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

export default function SignUpPage() {
  const { isLoaded, signUp, setActive } = useSignUp();
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<{ email?: string; password?: string }>({});
  const [touched, setTouched] = useState<{ email?: boolean; password?: boolean }>({});
  const [loading, setLoading] = useState(false);
  const [oauthLoading, setOauthLoading] = useState<string | null>(null);
  const [pendingVerification, setPendingVerification] = useState(false);
  const [code, setCode] = useState("");

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
      await signUp.authenticateWithRedirect({
        strategy,
        redirectUrl: "/sign-up/sso-callback",
        redirectUrlComplete: "/hackathon",
      });
    } catch (err: unknown) {
      const clerkErr = err as { errors?: { message: string }[] };
      setError(clerkErr.errors?.[0]?.message ?? "OAuth sign-up failed.");
      setOauthLoading(null);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!isLoaded || !validateAll()) return;

    setLoading(true);
    setError("");

    try {
      await signUp.create({
        emailAddress: email,
        password,
      });

      await signUp.prepareEmailAddressVerification({
        strategy: "email_code",
      });

      setPendingVerification(true);
    } catch (err: unknown) {
      const clerkErr = err as { errors?: { message: string }[] };
      setError(
        clerkErr.errors?.[0]?.message ?? "Something went wrong. Please try again."
      );
    } finally {
      setLoading(false);
    }
  }

  async function handleVerify(e: React.FormEvent) {
    e.preventDefault();
    if (!isLoaded) return;

    setLoading(true);
    setError("");

    try {
      const result = await signUp.attemptEmailAddressVerification({
        code,
      });

      if (result.status === "complete") {
        await setActive({ session: result.createdSessionId });
        router.push("/hackathon");
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

  if (pendingVerification) {
    return (
      <Card className="w-full max-w-md bg-transparent shadow-none border-none">
        <CardHeader className="text-center">
          <CardTitle className="font-heading text-4xl text-white">
            Check your email
          </CardTitle>
          <CardDescription className="text-base text-neutral-400">
            We sent a verification code to{" "}
            <span className="text-white">{email}</span>
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleVerify} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="code" className="text-base text-neutral-300">
                Verification code
              </Label>
              <Input
                id="code"
                type="text"
                inputMode="numeric"
                autoComplete="one-time-code"
                placeholder="123456"
                maxLength={6}
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
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
              {loading && <Icon name="progress_activity" className="animate-spin" size="4" />}
              Verify
            </Button>
          </form>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-md bg-transparent shadow-none border-none">
      <CardHeader className="text-center">
        <CardTitle className="font-heading text-4xl text-white">
          Create an account
        </CardTitle>
        <CardDescription className="text-base text-neutral-400">
          Sign up to get started
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
              placeholder="Min. 8 characters"
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
            Sign up
          </Button>
        </form>

        <p className="mt-6 text-center text-base text-neutral-400">
          Already have an account?{" "}
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
