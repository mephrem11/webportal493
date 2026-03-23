import { Link } from "react-router-dom";
import {
  CheckCircle,
  Users,
  Package,
  Clock,
  Heart,
  ArrowRight,
  ExternalLink,
} from "lucide-react";

interface Partner {
  id: string;
  name: string;
  location: string;
  description: string;
  website?: string;
  logo: string;
  categories: string[];
}

const partners: Partner[] = [
  {
    id: "1",
    name: "Path Forward",
    location: "Arlington, VA",
    description:
      "Providing transitional housing and support services for individuals experiencing homelessness.",
    website: "https://pathforward.org",
    logo: "",
    categories: ["Clothing", "Household Items", "Bedding"],
  },
  {
    id: "2",
    name: "Downtown Day Services",
    location: "Washington, DC",
    description:
      "Day services center offering meals, showers, and resource assistance to unhoused neighbors.",
    website: "https://downtownday.org",
    logo: "",
    categories: ["Clothing", "Hygiene", "Towels"],
  },
  {
    id: "3",
    name: "A Wider Circle",
    location: "Silver Spring, MD",
    description:
      "Moving families from poverty to stability through furniture, essential household items, and skill-building.",
    website: "https://awidercircle.org",
    logo: "",
    categories: ["Household Items", "Furniture", "Clothing"],
  },
  {
    id: "4",
    name: "Cornerstones",
    location: "Reston, VA",
    description:
      "Building community, changing lives through affordable housing, education and human services.",
    website: "https://cornerstonesva.org",
    logo: "",
    categories: ["Clothing", "Backpacks", "Household Items"],
  },
];

const benefits = [
  {
    icon: <Package className="text-[#00C853]" size={28} />,
    title: "Free Quality Goods",
    desc: "Access a wide variety of donated goods at no cost to your organization.",
  },
  {
    icon: <Clock className="text-[#00C853]" size={28} />,
    title: "Real-Time Inventory",
    desc: "View available donations and submit requests through our online portal.",
  },
  {
    icon: <Users className="text-[#00C853]" size={28} />,
    title: "Flexible Pickup",
    desc: "Set recurring weekly pickup schedules that work for your team.",
  },
  {
    icon: <Heart className="text-[#00C853]" size={28} />,
    title: "Quality Assurance",
    desc: "All donations are inspected and sorted before distribution.",
  },
];

const steps = [
  { number: "1", title: "Apply Online", desc: "Complete our partner application form." },
  { number: "2", title: "Review", desc: "Our team reviews your application within 5 business days." },
  { number: "3", title: "Onboarding", desc: "Attend a brief orientation and set up your portal account." },
  { number: "4", title: "Start Receiving", desc: "Begin requesting and scheduling deliveries." },
];

export function Partners() {
  return (
    <div className="min-h-screen bg-white">
      {/* Hero */}
      <section className="bg-gradient-to-br from-[#00C853] to-[#00A843] text-white py-20 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Our Partner Network</h1>
          <p className="text-xl text-white/90 mb-8 max-w-2xl mx-auto">
            We partner with leading local nonprofits to bring goods to the people who need them most.
          </p>
          <Link
            to="/apply"
            className="inline-flex items-center gap-2 bg-white text-[#00C853] px-8 py-4 rounded-full font-bold text-lg hover:shadow-xl transition-all"
          >
            Apply for Partnership
            <ArrowRight size={20} />
          </Link>
        </div>
      </section>

      {/* Current Partners */}
      <section className="max-w-5xl mx-auto px-6 py-16">
        <h2 className="text-3xl font-bold text-gray-900 text-center mb-2">
          Current Partners
        </h2>
        <p className="text-gray-600 text-center mb-12">
          Organizations currently receiving goods through our network
        </p>

        <div className="grid md:grid-cols-2 gap-6">
          {partners.map((partner) => (
            <div
              key={partner.id}
              className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="text-lg font-bold text-gray-900">{partner.name}</h3>
                  <p className="text-sm text-gray-500">{partner.location}</p>
                </div>
                {partner.logo && (
                  <img src={partner.logo} alt={partner.name} className="h-10 w-auto" />
                )}
              </div>
              <p className="text-gray-600 text-sm mb-4">{partner.description}</p>
              <div className="flex flex-wrap gap-1.5 mb-4">
                {partner.categories.map((cat) => (
                  <span
                    key={cat}
                    className="text-xs bg-green-50 text-green-700 px-2.5 py-1 rounded-full"
                  >
                    {cat}
                  </span>
                ))}
              </div>
              {partner.website && (
                <a
                  href={partner.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-sm text-[#00C853] hover:underline"
                >
                  <ExternalLink size={14} />
                  Visit website
                </a>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* Benefits */}
      <section className="bg-gray-50 py-16 px-6">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-gray-900 text-center mb-10">
            Benefits of Partnering with Us
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {benefits.map((b) => (
              <div key={b.title} className="bg-white rounded-xl p-5 text-center shadow-sm">
                <div className="flex justify-center mb-3">{b.icon}</div>
                <h3 className="font-bold text-gray-900 mb-2 text-sm">{b.title}</h3>
                <p className="text-xs text-gray-600">{b.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How to Become a Partner */}
      <section className="max-w-4xl mx-auto px-6 py-16">
        <h2 className="text-3xl font-bold text-gray-900 text-center mb-10">
          How to Become a Partner
        </h2>
        <div className="grid md:grid-cols-4 gap-6">
          {steps.map((step) => (
            <div key={step.number} className="text-center">
              <div className="w-12 h-12 bg-[#00C853] rounded-full flex items-center justify-center mx-auto mb-3">
                <span className="text-white font-bold text-lg">{step.number}</span>
              </div>
              <h3 className="font-bold text-gray-900 mb-1">{step.title}</h3>
              <p className="text-sm text-gray-600">{step.desc}</p>
            </div>
          ))}
        </div>

        <div className="text-center mt-12">
          <Link
            to="/apply"
            className="inline-flex items-center gap-2 bg-[#00C853] hover:bg-[#00B248] text-white px-8 py-4 rounded-full font-bold text-lg transition-colors"
          >
            <CheckCircle size={20} />
            Apply Now
          </Link>
        </div>
      </section>
    </div>
  );
}
