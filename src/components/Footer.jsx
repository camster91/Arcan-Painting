import { Mail, MapPin, Facebook, Instagram, Linkedin } from "lucide-react";
import { useTheme, getThemeColors } from "@/utils/useTheme";

export default function Footer() {
  const currentYear = new Date().getFullYear();
  const { mounted } = useTheme();
  const themeColors = getThemeColors(false); // Always use light mode colors

  // Don't render until mounted to avoid hydration mismatch
  if (!mounted) {
    return null;
  }

  return (
    <footer
      className="relative py-16 transition-colors duration-300"
      style={{
        backgroundColor: themeColors.bgSecondary,
        borderTop: `1px solid ${themeColors.border}`,
      }}
    >
      <div className="max-w-7xl mx-auto px-6">
        {/* Main Content */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
          {/* Company Info */}
          <div>
            <div className="flex items-center gap-3 mb-4">
              <img
                src="https://ucarecdn.com/d3a2d3b6-b78f-4d6c-94bf-ce75c42de977/-/format/auto/"
                alt="Arcan Painting logo"
                className="w-10 h-10 rounded-lg bg-white object-contain"
              />
              <h3
                className="text-xl font-bold"
                style={{ color: themeColors.text }}
              >
                Arcan and Sons
              </h3>
            </div>
            <p
              className="text-sm mb-4"
              style={{ color: themeColors.textSecondary }}
            >
              Professional painting services across the Greater Toronto Area.
              Family-owned business with generations of craftsmanship.
            </p>
            <div className="flex items-center gap-2 mb-2">
              <Mail size={16} style={{ color: themeColors.primary }} />
              <a
                href="mailto:info@arcanpainting.ca"
                className="text-sm transition-colors"
                style={{ color: themeColors.textSecondary }}
                onMouseEnter={(e) =>
                  (e.target.style.color = themeColors.primary)
                }
                onMouseLeave={(e) =>
                  (e.target.style.color = themeColors.textSecondary)
                }
              >
                info@arcanpainting.ca
              </a>
            </div>
            <div className="flex items-center gap-2">
              <MapPin size={16} style={{ color: themeColors.primary }} />
              <span
                className="text-sm"
                style={{ color: themeColors.textSecondary }}
              >
                Greater Toronto Area
              </span>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4
              className="text-lg font-semibold mb-4"
              style={{ color: themeColors.text }}
            >
              Quick Links
            </h4>
            <ul className="space-y-2">
              {[
                { href: "#services", label: "Services" },
                { href: "#portfolio", label: "Our Work" },
                { href: "#about", label: "About Us" },
                { href: "#contact", label: "Get Estimate" },
                { href: "/admin", label: "Admin" },
              ].map((link, index) => (
                <li key={index}>
                  <a
                    href={link.href}
                    className="text-sm transition-colors"
                    style={{ color: themeColors.textMuted }}
                    onMouseEnter={(e) =>
                      (e.target.style.color = themeColors.primary)
                    }
                    onMouseLeave={(e) =>
                      (e.target.style.color = themeColors.textMuted)
                    }
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact & Social */}
          <div>
            <h4
              className="text-lg font-semibold mb-4"
              style={{ color: themeColors.text }}
            >
              Connect With Us
            </h4>
            <p
              className="text-sm mb-4"
              style={{ color: themeColors.textSecondary }}
            >
              Follow us for project updates and painting tips
            </p>
            <div className="flex gap-3 mb-4">
              <a
                href="#"
                className="p-2 rounded-lg bg-blue-600 hover:bg-blue-700 transition-colors"
                aria-label="Facebook"
              >
                <Facebook size={18} className="text-white" />
              </a>
              <a
                href="#"
                className="p-2 rounded-lg bg-pink-600 hover:bg-pink-700 transition-colors"
                aria-label="Instagram"
              >
                <Instagram size={18} className="text-white" />
              </a>
              <a
                href="#"
                className="p-2 rounded-lg bg-blue-700 hover:bg-blue-800 transition-colors"
                aria-label="LinkedIn"
              >
                <Linkedin size={18} className="text-white" />
              </a>
            </div>
            <div
              className="space-y-1 text-xs"
              style={{ color: themeColors.textMuted }}
            >
              <div>✓ Licensed & Insured</div>
              <div>✓ Quality Guaranteed</div>
              <div>✓ Local Business</div>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div
          className="pt-8 border-t text-center"
          style={{ borderColor: themeColors.border }}
        >
          <p className="text-sm" style={{ color: themeColors.textMuted }}>
            © {currentYear} Arcan and Sons. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
