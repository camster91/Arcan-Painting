import PremiumShell from "@/components/premium/PremiumShell";
import {
  Section,
  SectionHeading,
  ButtonLink,
} from "@/components/premium/primitives";
export default function DesignSystem() {
  return (
    <PremiumShell>
      <Section>
        <SectionHeading
          as="h1"
          eyebrow="Internal design reference"
          title="Arcan foundations."
        >
          Shared tokens and components for a quieter, more confident identity.
        </SectionHeading>
        <div className="p-swatches">
          {["ink", "ink-soft", "paper", "stone", "gold"].map((name) => (
            <div key={name}>
              <div
                style={{
                  background: `var(--p-${name})`,
                  height: 100,
                  border: "1px solid var(--p-line)",
                }}
              />
              <p>{name}</p>
            </div>
          ))}
        </div>
        <SectionHeading
          eyebrow="Editorial typography"
          title={
            <>
              Colour. Pattern. <em>Texture.</em>
            </>
          }
        >
          Display serif paired with clear sans-serif body copy. Warm paper, deep
          navy and restrained brass.
        </SectionHeading>
        <div className="p-component-actions">
          <ButtonLink href="/contact">Primary action</ButtonLink>
          <ButtonLink href="/projects" subtle>
            Secondary action
          </ButtonLink>
        </div>
        <ul className="p-detail-list">
          <li>Shared responsive gutters and a 1320px content width.</li>
          <li>Visible keyboard focus and generous touch targets.</li>
          <li>Reduced-motion support. No animation-dependent content.</li>
        </ul>
      </Section>
    </PremiumShell>
  );
}
