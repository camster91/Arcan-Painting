import ServiceInquiryPage from "../../components/ServiceInquiryPage";

export const metadata = {
  title: "Interior Painting | Arcan Painting",
  description: "Contact Arcan Painting to discuss your interior painting project.",
  alternates: { canonical: "https://arcanpainting.ca/interior-painting" },
};

export default function Page() {
  return <ServiceInquiryPage serviceName="Interior Painting" />;
}
