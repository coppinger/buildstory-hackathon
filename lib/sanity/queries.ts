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
