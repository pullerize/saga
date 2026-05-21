import { LandingHeader } from "@/components/landing/LandingHeader";
import { HeroSection } from "@/components/landing/HeroSection";
import { WhyUsSection } from "@/components/landing/WhyUsSection";
import { CTAConsultation } from "@/components/landing/CTAConsultation";
import { FeaturesSection } from "@/components/landing/FeaturesSection";
import { ProcessSection } from "@/components/landing/ProcessSection";
import { PortfolioSection } from "@/components/landing/PortfolioSection";
// import { ReviewsSection } from "@/components/landing/ReviewsSection";
import { PartnersSection } from "@/components/landing/PartnersSection";
import { FAQSection } from "@/components/landing/FAQSection";
import { LandingFooter } from "@/components/landing/LandingFooter";
import { SiteEditToolbar } from "@/components/site-edit/SiteEditToolbar";

export default function HomePage() {
  return (
    <div className="min-h-screen flex flex-col">
      <LandingHeader />
      <main className="flex-1">
        <HeroSection />
        <WhyUsSection />
        <CTAConsultation />
        <FeaturesSection />
        <ProcessSection />
        <PortfolioSection />
        {/* <ReviewsSection /> */}
        <PartnersSection />
        <FAQSection />
      </main>
      <LandingFooter />
      {/* Inline-редактор контента — кнопка видна только админам */}
      <SiteEditToolbar />
    </div>
  );
}
