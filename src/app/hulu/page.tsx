import { StreamingServicePage } from "@/components/streaming/StreamingServicePage";
import { STREAMING_SERVICES } from "@/lib/constants";

const service = STREAMING_SERVICES.find((s) => s.slug === "hulu")!;

export const metadata = {
  title: `Hulu - FetchFlix`,
  description: `Discover what's trending on Hulu`,
};

export default function HuluPage() {
  return <StreamingServicePage service={service} />;
}
