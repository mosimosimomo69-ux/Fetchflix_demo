import { StreamingServicePage } from "@/components/streaming/StreamingServicePage";
import { STREAMING_SERVICES } from "@/lib/constants";

const service = STREAMING_SERVICES.find((s) => s.slug === "paramount-plus")!;

export const metadata = {
  title: `Paramount+ - FetchFlix`,
  description: `Discover what's trending on Paramount+`,
};

export default function ParamountPlusPage() {
  return <StreamingServicePage service={service} />;
}
