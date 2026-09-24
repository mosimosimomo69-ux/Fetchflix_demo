import { StreamingServicePage } from "@/components/streaming/StreamingServicePage";
import { STREAMING_SERVICES } from "@/lib/constants";

const service = STREAMING_SERVICES.find((s) => s.slug === "disney-plus")!;

export const metadata = {
  title: `Disney+ - FetchFlix`,
  description: `Discover what's trending on Disney+`,
};

export default function DisneyPlusPage() {
  return <StreamingServicePage service={service} />;
}
