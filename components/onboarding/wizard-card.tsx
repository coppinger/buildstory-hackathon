"use client";

import { Icon } from "@/components/ui/icon";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

interface WizardCardProps {
  title: string;
  description?: string;
  children: React.ReactNode;
  primaryLabel: string;
  onPrimary: () => void;
  primaryDisabled?: boolean;
  primaryLoading?: boolean;
  secondaryLabel?: string;
  onSecondary?: () => void;
}

export function WizardCard({
  title,
  description,
  children,
  primaryLabel,
  onPrimary,
  primaryDisabled,
  primaryLoading,
  secondaryLabel,
  onSecondary,
}: WizardCardProps) {
  return (
    <Card className="w-full max-w-md bg-transparent shadow-none border-none">
      <CardHeader className="text-center">
        <CardTitle className="font-heading text-4xl text-white">
          {title}
        </CardTitle>
        {description && (
          <CardDescription className="text-base text-neutral-400">
            {description}
          </CardDescription>
        )}
      </CardHeader>
      <CardContent className="space-y-4">
        {children}

        <div className="space-y-2 pt-2">
          <Button
            onClick={onPrimary}
            disabled={primaryDisabled || primaryLoading}
            className="bg-buildstory-500 text-black hover:bg-buildstory-400 h-11 font-medium w-full text-base"
          >
            {primaryLoading && <Icon name="progress_activity" className="animate-spin" size="4" />}
            {primaryLabel}
          </Button>

          {secondaryLabel && onSecondary && (
            <Button
              variant="ghost"
              onClick={onSecondary}
              className="h-11 w-full text-base text-neutral-400 hover:text-white"
            >
              {secondaryLabel}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
