import dynamic from "next/dynamic";

const CrayonAgent = dynamic(() => import("../components/CrayonAgent"), {
  ssr: false
});

export default function AgentPage() {
  return <CrayonAgent />;
}
