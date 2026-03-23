import { Link } from "react-router-dom";
import { PublicTabs } from "../components/PublicTabs";

export function HowItWorksPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-cyan-50 via-white to-emerald-50 text-gray-900">
      <PublicTabs />

      <main className="mx-auto w-full max-w-5xl px-4 py-8 sm:px-6 sm:py-10">
        <section className="rounded-2xl border border-cyan-200 bg-white p-6 shadow-sm sm:p-8">
          <h1 className="text-3xl font-bold text-cyan-900 sm:text-4xl">How Goods Recycling Works</h1>
          <p className="mt-4 text-sm leading-7 text-gray-700 sm:text-base">
            We provide a way for neighbors to conveniently help neighbors in need by recycling clothing and household
            goods at donation bins across the community. We sort all donations into many categories designed around
            real charity partner needs.
          </p>
          <p className="mt-4 text-sm leading-7 text-gray-700 sm:text-base">
            Seasonal matching is part of our process. For example, dresses and ball gowns are stored for special
            events, while winter items are stored in warmer months so supplies are ready when demand rises.
          </p>
        </section>

        <section className="mt-6 rounded-2xl border border-emerald-200 bg-white p-6 shadow-sm sm:p-8">
          <h2 className="text-2xl font-bold text-emerald-900">Charity Partner Portal Flow</h2>
          <ol className="mt-4 space-y-3 text-sm text-gray-700 sm:text-base">
            <li className="rounded-lg border border-gray-200 bg-gray-50 px-4 py-3">1. Charity logs in securely.</li>
            <li className="rounded-lg border border-gray-200 bg-gray-50 px-4 py-3">2. Charity submits a request or recurring wish list.</li>
            <li className="rounded-lg border border-gray-200 bg-gray-50 px-4 py-3">3. System stores request and syncs key records.</li>
            <li className="rounded-lg border border-gray-200 bg-gray-50 px-4 py-3">4. Sorting team and staff view and update request status.</li>
            <li className="rounded-lg border border-gray-200 bg-gray-50 px-4 py-3">5. Sponsor schedules deliveries; charities view weekly delivery dates.</li>
          </ol>
        </section>

        <section className="mt-6 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm sm:p-8">
          <h2 className="text-2xl font-bold text-gray-900">Do I Need To Use The Donation Bin?</h2>
          <p className="mt-4 text-sm leading-7 text-gray-700 sm:text-base">
            If you prefer shipping, we can provide labels so you can send donations directly. We sort and catalog
            items, determine marketplace value, subtract shipping costs, and donate 50% of the remainder to the
            charity you choose. The remaining 50% supports operating costs that keep the service running.
          </p>
          <p className="mt-4 text-sm leading-7 text-gray-700 sm:text-base">
            We also sort donations into many operational categories to support specific community partners. For
            example, formalwear can be stored year-round and shared for military family events, while winter clothing
            is staged during warmer months so inventory is ready when cold-weather demand increases.
          </p>
          <p className="mt-4 text-sm leading-7 text-gray-700 sm:text-base">
            When you partner with Goods Recycling, you do more than donate goods. You support critical community
            service providers with meaningful local impact.
          </p>
        </section>

        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <Link
            to="/donation-bin"
            className="rounded-lg bg-cyan-700 px-5 py-3 text-center text-sm font-semibold text-white hover:bg-cyan-800"
          >
            Donation Bin Guide
          </Link>
          <Link
            to="/login"
            className="rounded-lg border border-cyan-300 bg-white px-5 py-3 text-center text-sm font-semibold text-cyan-800 hover:bg-cyan-50"
          >
            Login To Portal
          </Link>
        </div>
      </main>
    </div>
  );
}
