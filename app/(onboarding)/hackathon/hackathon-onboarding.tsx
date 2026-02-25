"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useWizard } from "@/components/onboarding/use-wizard";
import { Stepper } from "@/components/onboarding/stepper";
import { StepTransition } from "@/components/onboarding/step-transition";
import { RegistrationStep } from "@/components/onboarding/steps/registration-step";
import { BridgeStep } from "@/components/onboarding/steps/bridge-step";
import { ProjectStep } from "@/components/onboarding/steps/project-step";
import { CelebrationStep } from "@/components/onboarding/steps/celebration-step";
import { Icon } from "@/components/ui/icon";

type OnboardingState = {
  // Registration
  displayName: string;
  username: string;
  experienceLevel: "getting_started" | "built_a_few" | "ships_constantly" | null;
  teamPreference: "solo" | "has_team" | "has_team_open" | "looking_for_team" | null;
  // Bridge outcome
  bridgeChoice: "add_project" | "no_project" | "joining_team" | null;
  joiningTeamLeadId: string | null;
  joiningProjectId: string | null;
  // Project
  projectName: string;
  projectSlug: string;
  projectDescription: string;
  projectStartingPoint: "new" | "existing" | null;
  projectGoalText: string;
  projectRepoUrl: string;
};

const initialState: OnboardingState = {
  displayName: "",
  username: "",
  experienceLevel: null,
  teamPreference: null,
  bridgeChoice: null,
  joiningTeamLeadId: null,
  joiningProjectId: null,
  projectName: "",
  projectSlug: "",
  projectDescription: "",
  projectStartingPoint: null,
  projectGoalText: "",
  projectRepoUrl: "",
};

const stepperSteps = [
  { label: "Register", icon: <Icon name="person" size="3.5" /> },
  { label: "Build", icon: <Icon name="build" size="3.5" /> },
  { label: "Done", icon: <Icon name="check" size="3.5" /> },
];

const DEV_MOCK_STATE: Partial<OnboardingState> = {
  displayName: "Jane Builder",
  username: "janebuilder",
  experienceLevel: "built_a_few",
  teamPreference: "solo",
  projectName: "AI Recipe Remixer",
  projectSlug: "ai-recipe-remixer",
  projectDescription: "An AI-powered tool that remixes recipes based on dietary preferences.",
  projectStartingPoint: "new",
  projectGoalText: "Ship a working MVP with 3 cuisine styles",
  projectRepoUrl: "https://github.com/jane/recipe-remixer",
};

const STEP_LABELS = ["Register", "Bridge", "Project", "Celebration"];

interface HackathonOnboardingProps {
  eventId: string;
  initialDisplayName: string;
  isAlreadyRegistered: boolean;
  devMode?: boolean;
}

export function HackathonOnboarding({
  eventId,
  initialDisplayName,
  isAlreadyRegistered,
  devMode = false,
}: HackathonOnboardingProps) {
  const router = useRouter();
  const flowStarted = useRef(false);

  const [state, setState] = useState<OnboardingState>({
    ...initialState,
    displayName: initialDisplayName !== "User" ? initialDisplayName : "",
  });

  const wizard = useWizard({ totalSteps: 4 });

  // Redirect if already registered on a fresh page visit (not mid-flow)
  useEffect(() => {
    if (isAlreadyRegistered && !flowStarted.current) {
      router.replace("/dashboard");
    }
  }, [isAlreadyRegistered, router]);

  const update = useCallback(
    (partial: Partial<OnboardingState>) => {
      setState((prev) => ({ ...prev, ...partial }));
    },
    []
  );

  // Show nothing while redirecting an already-registered user
  if (isAlreadyRegistered && !flowStarted.current) {
    return null;
  }

  // Map wizard step to stepper step (0=Register, 1/2=Build, 3=Done)
  const stepperIndex =
    wizard.currentStep === 0 ? 0 : wizard.currentStep <= 2 ? 1 : 2;

  function handleBridgeChoice(choice: "add_project" | "no_project" | "joining_team") {
    update({ bridgeChoice: choice });
    if (choice === "add_project") {
      wizard.next(); // go to project step
    } else if (choice === "no_project") {
      wizard.goTo(3); // skip to celebration
    }
  }

  function handleJoinTeam(teamLeadId: string | null, projectId: string | null) {
    update({
      bridgeChoice: "joining_team",
      joiningTeamLeadId: teamLeadId,
      joiningProjectId: projectId,
    });
    wizard.goTo(3); // skip to celebration
  }

  const celebrationVariant =
    state.bridgeChoice === "add_project" || state.bridgeChoice === null
      ? "with_project"
      : state.bridgeChoice === "joining_team"
        ? "joining_team"
        : "no_project";

  function handleDevFillState() {
    update(DEV_MOCK_STATE);
  }

  return (
    <div className="w-full max-w-2xl mx-auto">
      {/* Dev toolbar — only rendered in dev mode */}
      {devMode && (
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 flex items-center gap-1 rounded-full border border-amber-400/30 bg-neutral-950/95 px-3 py-1.5 shadow-lg backdrop-blur text-xs">
          <span className="text-amber-400 font-mono mr-2">DEV</span>
          {STEP_LABELS.map((label, i) => (
            <button
              key={i}
              onClick={() => wizard.goTo(i)}
              className={`px-2.5 py-1 rounded-full cursor-pointer transition-colors ${
                wizard.currentStep === i
                  ? "bg-amber-400 text-neutral-950 font-medium"
                  : "text-neutral-400 hover:text-white hover:bg-neutral-800"
              }`}
            >
              {label}
            </button>
          ))}
          <div className="w-px h-4 bg-neutral-700 mx-1" />
          <button
            onClick={handleDevFillState}
            className="px-2.5 py-1 rounded-full text-neutral-400 hover:text-white hover:bg-neutral-800 cursor-pointer"
            title="Fill all fields with mock data"
          >
            Fill
          </button>
          <button
            onClick={() => {
              setState({ ...initialState, displayName: initialDisplayName !== "User" ? initialDisplayName : "" });
              wizard.goTo(0);
            }}
            className="px-2.5 py-1 rounded-full text-neutral-400 hover:text-white hover:bg-neutral-800 cursor-pointer"
            title="Reset all state"
          >
            Reset
          </button>
        </div>
      )}

      <Stepper
        steps={stepperSteps}
        currentStep={stepperIndex}
        className="mb-10"
      />

      <StepTransition stepKey={wizard.currentStep}>
        {wizard.currentStep === 0 && (
          <RegistrationStep
            eventId={eventId}
            initialDisplayName={initialDisplayName}
            devMode={devMode}
            onComplete={() => {
              flowStarted.current = true;
              wizard.next();
            }}
            state={{
              displayName: state.displayName,
              username: state.username,
              experienceLevel: state.experienceLevel,
              teamPreference: state.teamPreference,
            }}
            update={update}
          />
        )}

        {wizard.currentStep === 1 && (
          <BridgeStep
            onChoose={handleBridgeChoice}
            onJoinTeam={handleJoinTeam}
          />
        )}

        {wizard.currentStep === 2 && (
          <ProjectStep
            eventId={eventId}
            devMode={devMode}
            onComplete={() => wizard.next()}
            onBack={() => wizard.back()}
            state={{
              projectName: state.projectName,
              projectSlug: state.projectSlug,
              projectDescription: state.projectDescription,
              projectStartingPoint: state.projectStartingPoint,
              projectGoalText: state.projectGoalText,
              projectRepoUrl: state.projectRepoUrl,
            }}
            update={update}
          />
        )}

        {wizard.currentStep === 3 && (
          <CelebrationStep
            variant={celebrationVariant}
            state={{
              displayName: state.displayName,
              experienceLevel: state.experienceLevel,
              teamPreference: state.teamPreference,
              projectName: state.projectName,
              projectGoalText: state.projectGoalText,
              projectSlug: state.projectSlug,
            }}
          />
        )}
      </StepTransition>
    </div>
  );
}
