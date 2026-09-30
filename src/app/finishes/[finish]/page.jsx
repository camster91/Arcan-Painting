import { useParams } from "react-router";
import LandingPage from "../../../components/LandingPage";
import { FINISH_PAGES } from "../../../data/landingPages";

export function loader({ params }) {
  if (!FINISH_PAGES[params.finish]) throw new Response("Not Found", { status: 404 });
  return null;
}

export default function Page() {
  const { finish } = useParams();
  return <LandingPage page={FINISH_PAGES[finish]} />;
}
