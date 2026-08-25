import ServiceInquiryPage from "../../components/ServiceInquiryPage";

export const metadata = {
  title: "Commercial Painting | Arcan Painting",
  description: "Contact Arcan Painting to discuss your commercial painting project.",
  alternates: { canonical: "https://arcanpainting.ca/commercial-painting" },
};

export default function Page() {
  return <ServiceInquiryPage serviceName="Commercial Painting" />;
}
