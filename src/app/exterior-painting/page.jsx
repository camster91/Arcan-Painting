import ServiceInquiryPage from "../../components/ServiceInquiryPage";

export const metadata = {
  title: "Exterior Painting | Arcan Painting",
  description: "Contact Arcan Painting to discuss your exterior painting project.",
  alternates: { canonical: "https://arcanpainting.ca/exterior-painting" },
};

export default function Page() {
  return <ServiceInquiryPage serviceName="Exterior Painting" />;
}
