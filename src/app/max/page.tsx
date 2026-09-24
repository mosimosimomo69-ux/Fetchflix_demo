import { StreamingServicePage } from "@/components/streaming/StreamingServicePage";
import { STREAMING_SERVICES } from "@/lib/constants";

const service = STREAMING_SERVICES.find((s) => s.slug === "max")!;

export const metadata = {
  title: `Max - FetchFlix`,
  description: `Discover what's trending on Max`,
};

export default function MaxPage() {
  return <StreamingServicePage service={service} />;
}
