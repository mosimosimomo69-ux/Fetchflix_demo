import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getPersonDetails } from "@/lib/api/tmdb";
import { PersonDetailView } from "@/components/person/PersonDetailView";

type PersonPageProps = {
  params: Promise<{ id: string }>;
};

export async function generateMetadata({
  params,
}: PersonPageProps): Promise<Metadata> {
  const { id } = await params;
  const person = await getPersonDetails(Number(id)).catch(() => null);
  if (!person) return { title: "Cineby" };
  const role = person.gender === 1 ? "Actress" : "Actor";
  return {
    title: `${person.name} - Cineby`,
    description:
      person.biography?.slice(0, 160) ||
      `Explore movies and TV shows featuring ${role.toLowerCase()} ${person.name} on Cineby.`,
  };
}

export default async function PersonPage({ params }: PersonPageProps) {
  const { id } = await params;
  const personId = Number(id);
  if (isNaN(personId) || personId <= 0) notFound();

  const person = await getPersonDetails(personId).catch(() => null);
  if (!person) notFound();

  return <PersonDetailView person={person} />;
}
