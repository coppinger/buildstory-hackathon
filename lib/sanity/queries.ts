import { client } from "./client";

export interface Sponsor {
  _id: string;
  name: string;
  logo: {
    asset: {
      _ref: string;
    };
  };
  websiteUrl?: string;
  tier?: string;
  displayOrder?: number;
}

export interface VolunteerRole {
  _id: string;
  title: string;
  description: string;
  displayOrder?: number;
}

export interface FeaturedProject {
  _id: string;
  title: string;
  builderName: string;
  blurb: string;
  image: {
    asset: {
      _ref: string;
    };
  };
  projectSlug?: string;
  eventSlug?: string;
  displayOrder?: number;
}

const sponsorsQuery = `*[_type == "sponsor"] | order(displayOrder asc) {
  _id, name, logo, websiteUrl, tier, displayOrder
}`;

const volunteerRolesQuery = `*[_type == "volunteerRole"] | order(displayOrder asc) {
  _id, title, description, displayOrder
}`;

export async function getSponsors(): Promise<Sponsor[]> {
  return client.fetch(sponsorsQuery, {}, { next: { revalidate: 60 } });
}

export async function getVolunteerRoles(): Promise<VolunteerRole[]> {
  return client.fetch(volunteerRolesQuery, {}, { next: { revalidate: 60 } });
}

export async function getFeaturedProjects(
  eventSlug?: string,
  limit = 4,
): Promise<FeaturedProject[]> {
  // When an eventSlug is provided, return both event-tagged entries and
  // evergreen entries (those with no eventSlug). When no slug is provided,
  // return everything.
  const filter = eventSlug
    ? `*[_type == "featuredProject" && (eventSlug == $eventSlug || !defined(eventSlug))]`
    : `*[_type == "featuredProject"]`;

  return client.fetch(
    `${filter} | order(displayOrder asc)[0...$limit] {
      _id, title, builderName, blurb, image, projectSlug, eventSlug, displayOrder
    }`,
    { eventSlug: eventSlug ?? null, limit },
    { next: { revalidate: 60 } },
  );
}
