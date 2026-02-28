"use client";

import { useState, useCallback, useEffect, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Stepper } from "@/components/onboarding/stepper";
import { StepTransition } from "@/components/onboarding/step-transition";
import { WizardCard } from "@/components/onboarding/wizard-card";
import { IdentityStep } from "@/components/onboarding/steps/identity-step";
import { ExperienceStep } from "@/components/onboarding/steps/experience-step";
import { CommitmentLevelStep } from "@/components/onboarding/steps/commitment-level-step";
import { TeamPreferenceStep } from "@/components/onboarding/steps/team-preference-step";
import { BridgeStep } from "@/components/onboarding/steps/bridge-step";
import { ProjectBasicsStep } from "@/components/onboarding/steps/project-basics-step";
import { StartingPointStep } from "@/components/onboarding/steps/starting-point-step";
import { ProjectGoalStep } from "@/components/onboarding/steps/project-goal-step";
import { CelebrationStep } from "@/components/onboarding/steps/celebration-step";
import {
  completeRegistration,
  createOnboardingProject,
} from "@/app/(onboarding)/hackathon/actions";
import { setUsernameAfterSignUp } from "@/app/(auth)/sign-up/actions";
import { Icon } from "@/components/ui/icon";
import { USERNAME_REGEX } from "@/lib/constants";

type StepId =
  | "identity"
  | "experience"
  | "commitment_level"
  | "team_preference"
  | "bridge"
  | "project_basics"
  | "starting_point"
  | "project_goal"
  | "celebration";

type OnboardingState = {
  // Registration
  displayName: string;
  username: string;
  countryCode: string;
  region: string;
  experienceLevel:
    | "getting_started"
    | "built_a_few"
    | "ships_constantly"
    | null;
  commitmentLevel:
    | "all_in"
    | "daily"
    | "nights_weekends"
    | "not_sure"
    | null;
  teamPreference:
    | "solo"
    | "has_team"
    | "has_team_open"
    | "looking_for_team"
    | null;
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
  countryCode: "",
  region: "",
  experienceLevel: null,
  commitmentLevel: null,
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
  { label: "Register", icon: <Icon name="person" size="5" /> },
  { label: "Build", icon: <Icon name="build" size="5" /> },
  { label: "Done", icon: <Icon name="check" size="5" /> },
];

const DEV_MOCK_STATE: Partial<OnboardingState> = {
  displayName: "Jane Builder",
  username: "janebuilder",
  countryCode: "IE",
  region: "IE-D",
  experienceLevel: "built_a_few",
  commitmentLevel: "daily",
  teamPreference: "solo",
  projectName: "AI Recipe Remixer",
  projectSlug: "ai-recipe-remixer",
  projectDescription:
    "An AI-powered tool that remixes recipes based on dietary preferences.",
  projectStartingPoint: "new",
  projectGoalText: "Ship a working MVP with 3 cuisine styles",
  projectRepoUrl: "https://github.com/jane/recipe-remixer",
};

const ALL_STEPS: StepId[] = [
  "identity",
  "experience",
  "commitment_level",
  "team_preference",
  "bridge",
  "project_basics",
  "starting_point",
  "project_goal",
  "celebration",
];

const STEP_LABELS: Record<StepId, string> = {
  identity: "Identity",
  experience: "Experience",
  commitment_level: "Commitment",
  team_preference: "Team Pref",
  bridge: "Bridge",
  project_basics: "Proj Basics",
  starting_point: "Start Pt",
  project_goal: "Proj Goal",
  celebration: "Celebration",
};

// Sub-step counts per phase: Register (4), Build (4), Done (1)
const SUB_STEP_COUNTS = [4, 4, 1];

function getStepperIndex(step: StepId): number {
  switch (step) {
    case "identity":
    case "experience":
    case "commitment_level":
    case "team_preference":
      return 0;
    case "bridge":
    case "project_basics":
    case "starting_point":
    case "project_goal":
      return 1;
    case "celebration":
      return 2;
  }
}

function getSubStepIndex(step: StepId): number {
  switch (step) {
    case "identity":
      return 0;
    case "experience":
      return 1;
    case "commitment_level":
      return 2;
    case "team_preference":
      return 3;
    case "bridge":
      return 0;
    case "project_basics":
      return 1;
    case "starting_point":
      return 2;
    case "project_goal":
      return 3;
    case "celebration":
      return 0;
  }
}

interface HackathonOnboardingProps {
  eventId: string;
  initialDisplayName: string;
  initialUsername?: string;
  initialCountryCode?: string;
  initialRegion?: string;
  initialExperienceLevel?: "getting_started" | "built_a_few" | "ships_constantly" | null;
  isAlreadyRegistered: boolean;
  devMode?: boolean;
}

export function HackathonOnboarding({
  eventId,
  initialDisplayName,
  initialUsername = "",
  initialCountryCode = "",
  initialRegion = "",
  initialExperienceLevel = null,
  isAlreadyRegistered,
  devMode = false,
}: HackathonOnboardingProps) {
  const router = useRouter();
  const [flowStarted, setFlowStarted] = useState(false);

  const [currentStep, setCurrentStep] = useState<StepId>("identity");

  // Capture signup username from sessionStorage (set during sign-up for OAuth users)
  const [signupUsername] = useState<string>(() => {
    if (initialUsername) return ""; // Already persisted to DB
    if (typeof window !== "undefined") {
      const stored = sessionStorage.getItem("signup_username");
      sessionStorage.removeItem("signup_username");
      if (stored && USERNAME_REGEX.test(stored)) {
        return stored;
      }
    }
    return "";
  });

  const [state, setState] = useState<OnboardingState>(() => {
    return {
      ...initialState,
      displayName: initialDisplayName !== "User" ? initialDisplayName : "",
      username: initialUsername || signupUsername,
      countryCode: initialCountryCode,
      region: initialRegion,
      experienceLevel: initialExperienceLevel,
    };
  });

  // Track the effective "existing" username (from DB or sessionStorage being persisted)
  const [effectiveExistingUsername, setEffectiveExistingUsername] = useState(
    initialUsername || signupUsername
  );
  const [usernameStatus, setUsernameStatus] = useState(
    (initialUsername || signupUsername) ? "available" : "idle"
  );

  // For OAuth users: persist the username chosen during sign-up to the DB
  useEffect(() => {
    if (!signupUsername) return;

    setUsernameAfterSignUp(signupUsername).then((result) => {
      if (!result.success) {
        // Username was taken between sign-up and now — reveal the field
        setEffectiveExistingUsername("");
        setUsernameStatus("idle");
      }
    });
  }, [signupUsername]);
  const [slugStatus, setSlugStatus] = useState("idle");
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  // Redirect if already registered on a fresh page visit (not mid-flow)
  useEffect(() => {
    if (isAlreadyRegistered && !flowStarted) {
      router.replace("/dashboard");
    }
  }, [isAlreadyRegistered, flowStarted, router]);

  const update = useCallback(
    (partial: Partial<OnboardingState>) => {
      setState((prev) => ({ ...prev, ...partial }));
    },
    []
  );

  // Show nothing while redirecting an already-registered user
  if (isAlreadyRegistered && !flowStarted) {
    return null;
  }

  // --- Server action handlers ---

  function handleRegistrationSubmit() {
    if (devMode) {
      setFlowStarted(true);
      setCurrentStep("bridge");
      return;
    }

    if (
      !state.displayName.trim() ||
      usernameStatus !== "available" ||
      !state.experienceLevel ||
      !state.teamPreference
    )
      return;

    setError(null);
    startTransition(async () => {
      const result = await completeRegistration({
        displayName: state.displayName.trim(),
        username: state.username.trim().toLowerCase(),
        country: state.countryCode || null,
        region: state.region.trim() || null,
        experienceLevel: state.experienceLevel!,
        commitmentLevel: state.commitmentLevel,
        teamPreference: state.teamPreference!,
        eventId,
      });
      if (result.success) {
        setFlowStarted(true);
        setCurrentStep("bridge");
      } else {
        setError(result.error);
      }
    });
  }

  function handleProjectSubmit() {
    if (devMode) {
      setCurrentStep("celebration");
      return;
    }

    const canSubmit =
      state.projectName.trim() &&
      state.projectDescription.trim() &&
      state.projectStartingPoint &&
      slugStatus !== "taken";

    if (!canSubmit) return;

    setError(null);
    startTransition(async () => {
      const result = await createOnboardingProject({
        name: state.projectName,
        slug: state.projectSlug,
        description: state.projectDescription,
        startingPoint: state.projectStartingPoint!,
        goalText: state.projectGoalText,
        repoUrl: state.projectRepoUrl,
        eventId,
      });
      if (result.success) {
        setCurrentStep("celebration");
      } else {
        setError(result.error);
      }
    });
  }

  // --- Navigation ---

  function navigateNext() {
    setError(null);
    switch (currentStep) {
      case "identity":
        setCurrentStep("experience");
        break;
      case "experience":
        setCurrentStep("commitment_level");
        break;
      case "commitment_level":
        setCurrentStep("team_preference");
        break;
      case "team_preference":
        handleRegistrationSubmit();
        break;
      case "project_basics":
        setCurrentStep("starting_point");
        break;
      case "starting_point":
        setCurrentStep("project_goal");
        break;
      case "project_goal":
        handleProjectSubmit();
        break;
    }
  }

  function navigateBack() {
    setError(null);
    switch (currentStep) {
      case "experience":
        setCurrentStep("identity");
        break;
      case "commitment_level":
        setCurrentStep("experience");
        break;
      case "team_preference":
        setCurrentStep("commitment_level");
        break;
      case "project_basics":
        setCurrentStep("bridge");
        break;
      case "starting_point":
        setCurrentStep("project_basics");
        break;
      case "project_goal":
        setCurrentStep("starting_point");
        break;
    }
  }

  function handleBridgeChoice(
    choice: "add_project" | "no_project" | "joining_team"
  ) {
    update({ bridgeChoice: choice });
    if (choice === "add_project") {
      setCurrentStep("project_basics");
    } else if (choice === "no_project") {
      setCurrentStep("celebration");
    }
  }

  function handleJoinTeam(
    teamLeadId: string | null,
    projectId: string | null
  ) {
    update({
      bridgeChoice: "joining_team",
      joiningTeamLeadId: teamLeadId,
      joiningProjectId: projectId,
    });
    setCurrentStep("celebration");
  }

  // --- Derived state ---

  const celebrationVariant =
    state.bridgeChoice === "add_project" || state.bridgeChoice === null
      ? "with_project"
      : state.bridgeChoice === "joining_team"
        ? "joining_team"
        : "no_project";

  function isPrimaryDisabled(): boolean {
    if (devMode) return false;
    switch (currentStep) {
      case "identity":
        return !state.displayName.trim() || usernameStatus !== "available";
      case "experience":
        return !state.experienceLevel;
      case "commitment_level":
        return !state.commitmentLevel;
      case "team_preference":
        return !state.teamPreference || isPending;
      case "project_basics":
        return (
          !state.projectName.trim() ||
          !state.projectDescription.trim() ||
          slugStatus === "taken"
        );
      case "starting_point":
        return !state.projectStartingPoint;
      case "project_goal":
        return isPending;
      default:
        return false;
    }
  }

  return (
    <div className="w-full max-w-2xl mx-auto">
      {/* Dev toolbar */}
      {devMode && (
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 flex items-center gap-1 rounded-full border border-amber-400/30 bg-neutral-950/95 px-3 py-1.5 shadow-lg backdrop-blur text-xs">
          <span className="text-amber-400 font-mono mr-2">DEV</span>
          {ALL_STEPS.map((stepId) => (
            <button
              key={stepId}
              onClick={() => setCurrentStep(stepId)}
              className={`px-2.5 py-1 rounded-full cursor-pointer transition-colors ${
                currentStep === stepId
                  ? "bg-amber-400 text-neutral-950 font-medium"
                  : "text-neutral-400 hover:text-white hover:bg-neutral-800"
              }`}
            >
              {STEP_LABELS[stepId]}
            </button>
          ))}
          <div className="w-px h-4 bg-neutral-700 mx-1" />
          <button
            onClick={() => update(DEV_MOCK_STATE)}
            className="px-2.5 py-1 rounded-full text-neutral-400 hover:text-white hover:bg-neutral-800 cursor-pointer"
            title="Fill all fields with mock data"
          >
            Fill
          </button>
          <button
            onClick={() => {
              setState({
                ...initialState,
                displayName:
                  initialDisplayName !== "User" ? initialDisplayName : "",
                username: effectiveExistingUsername,
                countryCode: initialCountryCode,
                region: initialRegion,
                experienceLevel: initialExperienceLevel,
              });
              setCurrentStep("identity");
            }}
            className="px-2.5 py-1 rounded-full text-neutral-400 hover:text-white hover:bg-neutral-800 cursor-pointer"
            title="Reset all state"
          >
            Reset
          </button>
        </div>
      )}

      {currentStep !== "celebration" && (
        <Stepper
          steps={stepperSteps}
          currentStep={getStepperIndex(currentStep)}
          subStepCounts={SUB_STEP_COUNTS}
          currentSubStep={getSubStepIndex(currentStep)}
          className="mb-10 md:mb-24"
        />
      )}

      <StepTransition stepKey={currentStep}>
        {currentStep === "identity" && (
          <WizardCard
            label="Hackathon 00"
            title="Let's get you set up."
            description="How you'll appear to other participants."
            primaryLabel="Continue"
            onPrimary={navigateNext}
            primaryDisabled={isPrimaryDisabled()}
          >
            <IdentityStep
              displayName={state.displayName}
              username={state.username}
              countryCode={state.countryCode}
              region={state.region}
              onUpdate={update}
              onUsernameStatusChange={setUsernameStatus}
              initialDisplayName={initialDisplayName}
              existingUsername={effectiveExistingUsername}
            />
          </WizardCard>
        )}

        {currentStep === "experience" && (
          <WizardCard
            title="Experience building with AI"
            description="This helps us tailor resources and match you with the right people."
            primaryLabel="Continue"
            onPrimary={navigateNext}
            primaryDisabled={isPrimaryDisabled()}
            secondaryLabel="Back"
            onSecondary={navigateBack}
          >
            <ExperienceStep
              value={state.experienceLevel}
              onChange={(v) =>
                update({
                  experienceLevel:
                    v as OnboardingState["experienceLevel"],
                })
              }
            />
          </WizardCard>
        )}

        {currentStep === "commitment_level" && (
          <WizardCard
            title="How much time can you commit?"
            description="No wrong answer — this helps us set expectations and match you with others on a similar schedule."
            primaryLabel="Continue"
            onPrimary={navigateNext}
            primaryDisabled={isPrimaryDisabled()}
            secondaryLabel="Back"
            onSecondary={navigateBack}
          >
            <CommitmentLevelStep
              value={state.commitmentLevel}
              onChange={(v) =>
                update({
                  commitmentLevel:
                    v as OnboardingState["commitmentLevel"],
                })
              }
            />
          </WizardCard>
        )}

        {currentStep === "team_preference" && (
          <WizardCard
            title="How do you want to build?"
            description="Go solo or team up. You can always change this later."
            primaryLabel="Join the hackathon"
            onPrimary={navigateNext}
            primaryDisabled={isPrimaryDisabled()}
            primaryLoading={isPending}
            secondaryLabel="Back"
            onSecondary={navigateBack}
          >
            <TeamPreferenceStep
              value={state.teamPreference}
              onChange={(v) =>
                update({
                  teamPreference:
                    v as OnboardingState["teamPreference"],
                })
              }
            />
            {error && (
              <p className="text-sm text-red-400 font-mono text-center">
                {error}
              </p>
            )}
          </WizardCard>
        )}

        {currentStep === "bridge" && (
          <BridgeStep
            onChoose={handleBridgeChoice}
            onJoinTeam={handleJoinTeam}
            onBack={() => setCurrentStep("team_preference")}
          />
        )}

        {currentStep === "project_basics" && (
          <WizardCard
            title="Tell us about your project."
            description="Don't overthink it — you can update everything later."
            primaryLabel="Continue"
            onPrimary={navigateNext}
            primaryDisabled={isPrimaryDisabled()}
            secondaryLabel="Back"
            onSecondary={navigateBack}
          >
            <ProjectBasicsStep
              projectName={state.projectName}
              projectSlug={state.projectSlug}
              projectDescription={state.projectDescription}
              onUpdate={update}
              onSlugStatusChange={setSlugStatus}
            />
          </WizardCard>
        )}

        {currentStep === "starting_point" && (
          <WizardCard
            title="Starting point"
            description="Are you starting fresh or adding to something you've already got?"
            primaryLabel="Continue"
            onPrimary={navigateNext}
            primaryDisabled={isPrimaryDisabled()}
            secondaryLabel="Back"
            onSecondary={navigateBack}
          >
            <StartingPointStep
              value={state.projectStartingPoint}
              onChange={(v) =>
                update({
                  projectStartingPoint:
                    v as OnboardingState["projectStartingPoint"],
                })
              }
            />
          </WizardCard>
        )}

        {currentStep === "project_goal" && (
          <WizardCard
            title="Your goal"
            description={'What does "done" look like at the end of the week?'}
            primaryLabel="Create project"
            onPrimary={navigateNext}
            primaryDisabled={isPrimaryDisabled()}
            primaryLoading={isPending}
            secondaryLabel="Back"
            onSecondary={navigateBack}
          >
            <ProjectGoalStep
              projectGoalText={state.projectGoalText}
              projectRepoUrl={state.projectRepoUrl}
              showRepoUrl={state.projectStartingPoint === "existing"}
              onUpdate={update}
            />
            {error && (
              <p className="text-sm text-red-400 font-mono text-center">
                {error}
              </p>
            )}
          </WizardCard>
        )}

        {currentStep === "celebration" && (
          <CelebrationStep
            variant={celebrationVariant}
            state={{
              displayName: state.displayName,
              username: state.username,
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
