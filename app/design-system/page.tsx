import type { Metadata } from "next";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Icon } from "@/components/ui/icon";
import {
  Avatar,
  AvatarFallback,
  AvatarGroup,
  AvatarGroupCount,
} from "@/components/ui/avatar";

export const metadata: Metadata = {
  title: "Design System",
  description: "The Buildstory design system — colors, typography, components, and patterns.",
};

function Section({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="space-y-6">
      <div>
        <h2 className="font-heading text-3xl italic">{title}</h2>
        {description && (
          <p className="text-muted-foreground mt-1">{description}</p>
        )}
      </div>
      {children}
    </section>
  );
}

function Subsection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-3">
      <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
        {title}
      </h3>
      {children}
    </div>
  );
}

function ColorSwatch({
  name,
  className,
  textClassName,
}: {
  name: string;
  className: string;
  textClassName?: string;
}) {
  return (
    <div className="space-y-1.5">
      <div className={`h-12 w-full border ${className}`} />
      <p className={`text-xs font-mono ${textClassName ?? "text-muted-foreground"}`}>
        {name}
      </p>
    </div>
  );
}

export default function DesignSystemPage() {
  return (
    <div className="min-h-dvh bg-background text-foreground">
      {/* Header */}
      <header className="border-b">
        <div className="mx-auto max-w-8xl px-6 py-12 md:py-20">
          <img
            src="/buildstory-logo.svg"
            alt="Buildstory"
            className="h-9 w-auto mb-6"
          />
          <p className="text-sm font-mono text-muted-foreground mb-2">
            buildstory/design-system
          </p>
          <h1 className="font-heading text-5xl md:text-7xl italic">
            Design System
          </h1>
          <p className="text-lg text-muted-foreground mt-4 max-w-2xl">
            The visual language behind Buildstory. Sharp edges, high contrast,
            and a serif-sans pairing that signals craft.
          </p>
        </div>
      </header>

      <div className="mx-auto max-w-8xl px-6 py-12 space-y-20">
        {/* Colors */}
        <Section
          title="Colors"
          description="OKLCH-based color system with a brand orange accent. Neutral palette for UI, buildstory orange for action."
        >
          <Subsection title="Brand — Buildstory Orange">
            <div className="grid grid-cols-5 md:grid-cols-11 gap-2">
              {[
                { name: "50", cls: "bg-buildstory-50" },
                { name: "100", cls: "bg-buildstory-100" },
                { name: "200", cls: "bg-buildstory-200" },
                { name: "300", cls: "bg-buildstory-300" },
                { name: "400", cls: "bg-buildstory-400" },
                { name: "500", cls: "bg-buildstory-500" },
                { name: "600", cls: "bg-buildstory-600" },
                { name: "700", cls: "bg-buildstory-700" },
                { name: "800", cls: "bg-buildstory-800" },
                { name: "900", cls: "bg-buildstory-900" },
                { name: "950", cls: "bg-buildstory-950" },
              ].map((c) => (
                <ColorSwatch key={c.name} name={c.name} className={c.cls} />
              ))}
            </div>
          </Subsection>

          <Subsection title="Semantic">
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
              <ColorSwatch name="background" className="bg-background" />
              <ColorSwatch name="foreground" className="bg-foreground" />
              <ColorSwatch name="primary" className="bg-primary" />
              <ColorSwatch name="secondary" className="bg-secondary" />
              <ColorSwatch name="muted" className="bg-muted" />
              <ColorSwatch name="accent" className="bg-accent" />
              <ColorSwatch name="destructive" className="bg-destructive" />
              <ColorSwatch name="card" className="bg-card" />
              <ColorSwatch name="border" className="bg-border" />
              <ColorSwatch name="input" className="bg-input" />
            </div>
          </Subsection>

          <Subsection title="Charts">
            <div className="grid grid-cols-5 gap-2">
              <ColorSwatch name="chart-1" className="bg-chart-1" />
              <ColorSwatch name="chart-2" className="bg-chart-2" />
              <ColorSwatch name="chart-3" className="bg-chart-3" />
              <ColorSwatch name="chart-4" className="bg-chart-4" />
              <ColorSwatch name="chart-5" className="bg-chart-5" />
            </div>
          </Subsection>
        </Section>

        <Separator />

        {/* Typography */}
        <Section
          title="Typography"
          description="Advercase for headings, Figtree for body, DM Mono for code. Tight tracking at large sizes, open at small."
        >
          <Subsection title="Fonts">
            <div className="space-y-6">
              <div className="space-y-1">
                <p className="text-xs font-mono text-muted-foreground">
                  font-heading — Advercase
                </p>
                <p className="font-heading text-4xl italic">
                  The quick brown fox jumps over the lazy dog
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-xs font-mono text-muted-foreground">
                  font-sans — Figtree
                </p>
                <p className="font-sans text-4xl">
                  The quick brown fox jumps over the lazy dog
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-xs font-mono text-muted-foreground">
                  font-mono — DM Mono
                </p>
                <p className="font-mono text-4xl">
                  The quick brown fox jumps over the lazy dog
                </p>
              </div>
            </div>
          </Subsection>

          <Subsection title="Type Scale">
            <div className="space-y-4 overflow-x-auto">
              {[
                { label: "7xl", cls: "text-7xl", size: "4.25rem / 68px" },
                { label: "6xl", cls: "text-6xl", size: "3.5rem / 56px" },
                { label: "5xl", cls: "text-5xl", size: "3rem / 48px" },
                { label: "4xl", cls: "text-4xl", size: "2.5rem / 40px" },
                { label: "3xl", cls: "text-3xl", size: "2rem / 32px" },
                { label: "2xl", cls: "text-2xl", size: "1.75rem / 28px" },
                { label: "xl", cls: "text-xl", size: "1.5rem / 24px" },
                { label: "lg", cls: "text-lg", size: "1.25rem / 20px" },
                { label: "base", cls: "text-base", size: "1rem / 16px" },
                { label: "sm", cls: "text-sm", size: "0.875rem / 14px" },
                { label: "xs", cls: "text-xs", size: "0.75rem / 12px" },
              ].map((t) => (
                <div key={t.label} className="flex items-baseline gap-4">
                  <span className="text-xs font-mono text-muted-foreground w-20 shrink-0">
                    {t.label}
                  </span>
                  <span className={t.cls}>Buildstory</span>
                  <span className="text-xs font-mono text-muted-foreground shrink-0">
                    {t.size}
                  </span>
                </div>
              ))}
            </div>
          </Subsection>
        </Section>

        <Separator />

        {/* Icons */}
        <Section
          title="Icons"
          description="Google Material Symbols (Sharp, Filled) via the Icon component. Sizes from 3 (0.75rem) to 8 (2rem)."
        >
          <Subsection title="Sizes">
            <div className="flex items-end gap-6">
              {(
                [
                  { size: "3", label: "3" },
                  { size: "3.5", label: "3.5" },
                  { size: "4", label: "4" },
                  { size: "5", label: "5" },
                  { size: "6", label: "6" },
                  { size: "8", label: "8" },
                ] as const
              ).map((s) => (
                <div key={s.label} className="flex flex-col items-center gap-2">
                  <Icon name="star" size={s.size} />
                  <span className="text-xs font-mono text-muted-foreground">
                    {s.label}
                  </span>
                </div>
              ))}
            </div>
          </Subsection>

          <Subsection title="Common Icons">
            <div className="flex flex-wrap gap-4">
              {[
                "home",
                "search",
                "settings",
                "person",
                "notifications",
                "edit",
                "delete",
                "add",
                "check",
                "close",
                "arrow_forward",
                "arrow_back",
                "visibility",
                "favorite",
                "share",
                "code",
                "link",
                "group",
                "rocket_launch",
                "construction",
                "emoji_events",
                "trending_up",
              ].map((name) => (
                <div
                  key={name}
                  className="flex flex-col items-center gap-1.5 w-16"
                >
                  <div className="flex items-center justify-center h-10 w-10 border">
                    <Icon name={name} size="5" />
                  </div>
                  <span className="text-[10px] font-mono text-muted-foreground text-center leading-tight truncate w-full">
                    {name}
                  </span>
                </div>
              ))}
            </div>
          </Subsection>
        </Section>

        <Separator />

        {/* Buttons */}
        <Section
          title="Buttons"
          description="Six variants and seven sizes. Default has no border radius — sharp edges are core to the identity."
        >
          <Subsection title="Variants">
            <div className="flex flex-wrap items-center gap-3">
              <Button variant="default">Default</Button>
              <Button variant="secondary">Secondary</Button>
              <Button variant="outline">Outline</Button>
              <Button variant="ghost">Ghost</Button>
              <Button variant="link">Link</Button>
              <Button variant="destructive">Destructive</Button>
            </div>
          </Subsection>

          <Subsection title="Sizes">
            <div className="flex flex-wrap items-end gap-3">
              <Button size="xs">Extra Small</Button>
              <Button size="sm">Small</Button>
              <Button size="default">Default</Button>
              <Button size="lg">Large</Button>
            </div>
          </Subsection>

          <Subsection title="With Icons">
            <div className="flex flex-wrap items-center gap-3">
              <Button>
                <Icon name="add" size="4" />
                Create Project
              </Button>
              <Button variant="outline">
                <Icon name="code" size="4" />
                View Code
              </Button>
              <Button variant="ghost" size="icon">
                <Icon name="settings" size="5" />
              </Button>
              <Button variant="ghost" size="icon-sm">
                <Icon name="close" size="4" />
              </Button>
            </div>
          </Subsection>

          <Subsection title="Brand CTA">
            <div className="flex flex-wrap items-center gap-3">
              <Button className="bg-buildstory-500 text-black hover:bg-buildstory-400">
                Join the Hackathon
              </Button>
              <Button variant="outline">Learn More</Button>
            </div>
          </Subsection>

          <Subsection title="States">
            <div className="flex flex-wrap items-center gap-3">
              <Button disabled>Disabled</Button>
              <Button variant="outline" disabled>
                Disabled Outline
              </Button>
            </div>
          </Subsection>
        </Section>

        <Separator />

        {/* Badges */}
        <Section
          title="Badges"
          description="Six variants for labeling and status. Rounded pill shape with tight padding."
        >
          <div className="flex flex-wrap items-center gap-3">
            <Badge variant="default">Default</Badge>
            <Badge variant="secondary">Secondary</Badge>
            <Badge variant="outline">Outline</Badge>
            <Badge variant="destructive">Destructive</Badge>
            <Badge variant="ghost">Ghost</Badge>
            <Badge variant="link">Link</Badge>
          </div>
        </Section>

        <Separator />

        {/* Cards */}
        <Section
          title="Cards"
          description="Container component with border, no background in dark mode. Responsive padding scales with viewport."
        >
          <div className="grid md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Project Card</CardTitle>
                <CardDescription>
                  A sample card showing the header, content, and footer
                  composition.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Cards are the primary container for grouped content. They use
                  sharp borders with no radius, consistent with the overall
                  design language.
                </p>
              </CardContent>
              <CardFooter>
                <Button variant="outline" size="sm">
                  View Project
                </Button>
              </CardFooter>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Stat Card</CardTitle>
                <CardDescription>With a large number display</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-4xl font-heading italic">247</p>
                <p className="text-sm text-muted-foreground mt-1">
                  projects shipped
                </p>
              </CardContent>
            </Card>
          </div>
        </Section>

        <Separator />

        {/* Form Elements */}
        <Section
          title="Form Elements"
          description="Inputs, textareas, and labels. Sharp borders, generous height (h-12 for inputs), and clear focus states."
        >
          <div className="grid md:grid-cols-2 gap-6 max-w-3xl">
            <div className="space-y-2">
              <Label>Text Input</Label>
              <Input placeholder="Enter your project name..." />
            </div>

            <div className="space-y-2">
              <Label>Disabled Input</Label>
              <Input placeholder="Not editable" disabled />
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label>Textarea</Label>
              <Textarea placeholder="Describe what you're building..." />
            </div>
          </div>
        </Section>

        <Separator />

        {/* Avatars */}
        <Section
          title="Avatars"
          description="Circular avatars with fallback initials. Three sizes and group composition for team displays."
        >
          <Subsection title="Sizes">
            <div className="flex items-center gap-4">
              <Avatar size="sm">
                <AvatarFallback>S</AvatarFallback>
              </Avatar>
              <Avatar size="default">
                <AvatarFallback>M</AvatarFallback>
              </Avatar>
              <Avatar size="lg">
                <AvatarFallback>L</AvatarFallback>
              </Avatar>
            </div>
          </Subsection>

          <Subsection title="Group">
            <AvatarGroup>
              <Avatar>
                <AvatarFallback>A</AvatarFallback>
              </Avatar>
              <Avatar>
                <AvatarFallback>B</AvatarFallback>
              </Avatar>
              <Avatar>
                <AvatarFallback>C</AvatarFallback>
              </Avatar>
              <AvatarGroupCount>+5</AvatarGroupCount>
            </AvatarGroup>
          </Subsection>
        </Section>

        <Separator />

        {/* Spacing & Radius */}
        <Section
          title="Spacing & Radius"
          description="Zero base radius. Sharp edges by default — roundness increases through the radius scale when needed."
        >
          <Subsection title="Border Radius Scale">
            <div className="flex flex-wrap items-end gap-4">
              {[
                { label: "0 (default)", cls: "rounded-none" },
                { label: "xl (4px)", cls: "rounded-xl" },
                { label: "2xl (8px)", cls: "rounded-2xl" },
                { label: "3xl (12px)", cls: "rounded-3xl" },
                { label: "4xl (16px)", cls: "rounded-4xl" },
                { label: "full", cls: "rounded-full" },
              ].map((r) => (
                <div key={r.label} className="flex flex-col items-center gap-2">
                  <div
                    className={`h-16 w-16 bg-muted border ${r.cls}`}
                  />
                  <span className="text-xs font-mono text-muted-foreground text-center">
                    {r.label}
                  </span>
                </div>
              ))}
            </div>
          </Subsection>
        </Section>

        <Separator />

        {/* Design Principles */}
        <Section
          title="Principles"
          description="The decisions that shape every component."
        >
          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                icon: "crop_square",
                title: "Sharp Edges",
                text: "Zero default border radius. Rectangular forms signal precision and intentionality. Every rounded corner is a deliberate choice.",
              },
              {
                icon: "contrast",
                title: "High Contrast",
                text: "OKLCH color space for perceptually uniform luminance. Dark-first design with clear foreground/background separation.",
              },
              {
                icon: "format_size",
                title: "Serif + Sans",
                text: "Advercase for headings, Figtree for body. The pairing balances editorial elegance with technical clarity.",
              },
              {
                icon: "palette",
                title: "Brand Orange",
                text: "Buildstory-500 (#ff980a) as the primary accent. Used sparingly for CTAs and highlights — never as decoration.",
              },
              {
                icon: "dark_mode",
                title: "Dark First",
                text: "The interface defaults to dark mode. Light mode is supported but dark is the primary canvas for the builder aesthetic.",
              },
              {
                icon: "accessibility_new",
                title: "Accessible",
                text: "Visible focus rings, ARIA labels on interactive elements, and sufficient color contrast across all surfaces.",
              },
            ].map((p) => (
              <Card key={p.title} className="border-muted">
                <CardContent className="pt-6 space-y-2">
                  <Icon name={p.icon} size="6" className="text-buildstory-500" />
                  <h3 className="font-medium">{p.title}</h3>
                  <p className="text-sm text-muted-foreground">{p.text}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </Section>

        {/* Footer */}
        <div className="border-t pt-8 pb-12">
          <p className="text-sm text-muted-foreground font-mono">
            buildstory design system — last updated march 2026
          </p>
        </div>
      </div>
    </div>
  );
}
