import ServiceInquiryPage from "../../components/ServiceInquiryPage";

export const metadata = {
  title: "Specialty Finishes | Arcan Painting",
  description: "Contact Arcan Painting to discuss your specialty finishes project.",
  alternates: { canonical: "https://arcanpainting.ca/specialty-finishes" },
};

export default function Page() {
  return <ServiceInquiryPage serviceName="Specialty Finishes" />;
}
