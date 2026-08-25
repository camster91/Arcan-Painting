import ServiceInquiryPage from "../../components/ServiceInquiryPage";

export const metadata = {
  title: "Wallpaper Services | Arcan Painting",
  description: "Contact Arcan Painting to discuss your wallpaper services project.",
  alternates: { canonical: "https://arcanpainting.ca/wallpaper-services" },
};

export default function Page() {
  return <ServiceInquiryPage serviceName="Wallpaper Services" />;
}
