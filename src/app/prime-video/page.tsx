import { StreamingServicePage } from "@/components/streaming/StreamingServicePage";
import { STREAMING_SERVICES } from "@/lib/constants";

const service = STREAMING_SERVICES.find((s) => s.slug === "prime-video")!;

export const metadata = {
  title: `Prime Video - FetchFlix`,
  description: `Discover what's trending on Prime Video`,
};

export default function PrimeVideoPage() {
  return <StreamingServicePage service={service} />;
}
