import { useParams } from "react-router";
import LandingPage from "../../../components/LandingPage";
import { MARKETS, buildMarketPage } from "../../../data/markets";

export function loader({ params }) {
  if (!MARKETS[params.market]) throw new Response("Not Found", { status: 404 });
  return null;
}

export default function Page() {
  const { market } = useParams();
  return <LandingPage page={buildMarketPage(market)} />;
}
