import React, { useState, useEffect } from "react";
import { ChevronUp } from "lucide-react";
import { Facebook, Twitter, Youtube, Linkedin } from "lucide-react";

const Footer: React.FC = () => {
  const currentYear = new Date().getFullYear();
  const [showScroll, setShowScroll] = useState(false);

  useEffect(() => {
    const checkScrollTop = () => {
      if (!showScroll && window.pageYOffset > 400) {
        setShowScroll(true);
      } else if (showScroll && window.pageYOffset <= 400) {
        setShowScroll(false);
      }
    };

    window.addEventListener("scroll", checkScrollTop);
    return () => window.removeEventListener("scroll", checkScrollTop);
  }, [showScroll]);

  const scrollTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <footer className="bg-[#E6F0FA] text-gray-700 relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8 text-sm">
          <div>
            <h3 className="text-gray-900 font-semibold mb-4">Quick links</h3>
            <ul className="space-y-2">
              <li>
                <a
                  href="https://www.pmi.com/who-we-are/who-we-are-overview"
                  className="hover:underline"
                >
                  About us
                </a>
              </li>
              <li>
                <a
                  href="https://www.pmi.com/our-business"
                  className="hover:underline"
                >
                  Our business
                </a>
              </li>
              <li>
                <a
                  href="https://www.pmi.com/our-progress"
                  className="hover:underline"
                >
                  Our progress
                </a>
              </li>
              <li>
                <a
                  href="https://www.pmi.com/our-science"
                  className="hover:underline"
                >
                  Our science
                </a>
              </li>
              <li>
                <a
                  href="https://www.pmi.com/investor-relations"
                  className="hover:underline"
                >
                  Investor relations
                </a>
              </li>
              <li>
                <a
                  href="https://www.pmi.com/sustainability"
                  className="hover:underline"
                >
                  Sustainability
                </a>
              </li>
              <li>
                <a
                  href="https://www.pmi.com/careers/overview"
                  className="hover:underline"
                >
                  Careers
                </a>
              </li>
            </ul>
          </div>
          <div>
            <h3 className="text-gray-900 font-semibold mb-4">
              Other initiatives
            </h3>
            <ul className="space-y-2">
              <li>
                <a
                  href="https://www.pmiscience.com/"
                  className="hover:underline"
                >
                  PMI Science
                </a>
              </li>
              <li>
                <a href="https://pmiprivacy.com/" className="hover:underline">
                  PMI Privacy
                </a>
              </li>
              <li>
                <a
                  href="https://www.pmi.com/projects-with-a-heart"
                  className="hover:underline"
                >
                  Projects with a Heart
                </a>
              </li>
              <li>
                <a
                  href="https://www.pmi.com/unsmoke-your-world"
                  className="hover:underline"
                >
                  Unsmoke Your World
                </a>
              </li>
            </ul>
          </div>
          <div>
            <h3 className="text-gray-900 font-semibold mb-4">Legal</h3>
            <ul className="space-y-2">
              <li>
                <a
                  href="https://www.pmi.com/legal/conditions-of-use"
                  className="hover:underline"
                >
                  Terms of use
                </a>
              </li>
              <li>
                <a
                  href="https://www.pmi.com/legal/legal-documents"
                  className="hover:underline"
                >
                  Legal documents
                </a>
              </li>
              <li>
                <a
                  href="https://www.pmi.com/legal/social-media-rules-of-engagement"
                  className="hover:underline"
                >
                  Social media rules of engagement
                </a>
              </li>
              <li>
                <a href="#" className="hover:underline">
                  Cookie preferences
                </a>
              </li>
            </ul>
          </div>
          <div>
            <h3 className="text-gray-900 font-semibold mb-4">
              Product security
            </h3>
            <a
              href="https://www.pmi.com/productsecurity/vulnerability-disclosure"
              className="hover:underline"
            >
              Vulnerability disclosure
            </a>
          </div>
          <div>
            <h3 className="text-gray-900 font-semibold mb-4">Follow us on</h3>
            <div className="flex space-x-4">
              <a href="https://www.facebook.com/InsidePMI/">
                <Facebook size={24} />
              </a>
              <a href="https://twitter.com/InsidePMI">
                <Twitter size={24} />
              </a>
              <a href="https://www.youtube.com/channel/UC8Ljkwa0c7Njol3g7LGW2Ww">
                <Youtube size={24} />
              </a>
              <a href="https://www.linkedin.com/company/insidepmi/">
                <Linkedin size={24} />
              </a>
            </div>
            <div className="mt-4">
              <a
                href="https://www.pmi.com/pmi-newsletter-subscribe"
                className="text-gray-600 hover:underline"
              >
                PMI corporate newsletter
              </a>
            </div>
          </div>
        </div>

        <div className="mt-12 pt-8 border-t border-gray-300 text-center text-xs">
          <div className="flex flex-wrap justify-center space-x-6 mb-4">
            <a
              href="https://www.pmiprivacy.com/en/corporate-website"
              className="hover:underline"
            >
              Privacy Notice
            </a>
            <a
              href="https://www.pmi.com/faq-section"
              className="hover:underline"
            >
              FAQ
            </a>
            <a
              href="https://www.pmi.com/glossary-section/glossary"
              className="hover:underline"
            >
              Glossary
            </a>
            <a
              href="https://www.pmi.com/contact-us"
              className="hover:underline"
            >
              Contact Us
            </a>
            <a
              href="https://www.pmi.com/company-information"
              className="hover:underline"
            >
              Company Information
            </a>
          </div>
          © {currentYear} Philip Morris Products S.A.
        </div>
      </div>

      {showScroll && (
        <button
          onClick={scrollTop}
          className="fixed bottom-6 right-6 bg-[#0072CE] hover:bg-[#0056A3] text-white rounded-full p-3 shadow-md transition"
        >
          <ChevronUp size={24} />
        </button>
      )}
    </footer>
  );
};

export default Footer;
