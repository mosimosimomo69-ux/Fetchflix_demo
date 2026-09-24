import { StreamingServicePage } from "@/components/streaming/StreamingServicePage";
import { STREAMING_SERVICES } from "@/lib/constants";

const service = STREAMING_SERVICES.find((s) => s.slug === "apple-tv")!;

export const metadata = {
  title: `Apple TV+ - FetchFlix`,
  description: `Discover what's trending on Apple TV+`,
};

export default function AppleTVPage() {
  return <StreamingServicePage service={service} />;
}
