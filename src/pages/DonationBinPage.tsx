import { Link } from "react-router-dom";
import { PublicTabs } from "../components/PublicTabs";

export function DonationBinPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-emerald-50 via-white to-amber-50 text-gray-900">
      <PublicTabs />

      <main className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 sm:py-10">
        <section className="rounded-2xl border border-emerald-200 bg-white p-6 shadow-sm sm:p-8">
          <h1 className="text-3xl font-bold text-emerald-900 sm:text-4xl">
            Donation Bin - What to Give and What Not to Give
          </h1>
          <p className="mt-4 text-sm leading-7 text-gray-700 sm:text-base">
            Use this guide before dropping items in a Goods Recycling donation bin. This helps us sort quickly and
            deliver useful items to local charity partners.
          </p>
        </section>

        <section className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
          <article className="rounded-2xl border border-emerald-200 bg-emerald-50 p-6 shadow-sm sm:p-8">
            <h2 className="text-2xl font-bold text-emerald-900">What to Give</h2>
            <ul className="mt-4 space-y-3 text-sm text-emerald-950 sm:text-base">
              <li className="rounded-lg bg-white px-4 py-3">Gently used clothing and shoes.</li>
              <li className="rounded-lg bg-white px-4 py-3">Accessories: purses, school bags, belts, seasonal accessories, jewelry.</li>
              <li className="rounded-lg bg-white px-4 py-3">Useful gifts you no longer need.</li>
              <li className="rounded-lg bg-white px-4 py-3">New diapers, linens, and blankets.</li>
              <li className="rounded-lg bg-white px-4 py-3">Usable, non-broken electronics: smartphones, tablets, laptops, headphones, consoles, cameras.</li>
              <li className="rounded-lg bg-white px-4 py-3">Kitchen appliances: blenders, mixers, juicers (for example KitchenAid, Vitamix, Breville).</li>
            </ul>
          </article>

          <article className="rounded-2xl border border-rose-200 bg-rose-50 p-6 shadow-sm sm:p-8">
            <h2 className="text-2xl font-bold text-rose-900">What NOT to Give</h2>
            <ul className="mt-4 space-y-3 text-sm text-rose-950 sm:text-base">
              <li className="rounded-lg bg-white px-4 py-3">Dirty, stained, ripped, or broken items.</li>
              <li className="rounded-lg bg-white px-4 py-3">Furniture and mattresses (anything that cannot fit inside the bin).</li>
              <li className="rounded-lg bg-white px-4 py-3">Food.</li>
              <li className="rounded-lg bg-white px-4 py-3">Books.</li>
              <li className="rounded-lg bg-white px-4 py-3">Glass items.</li>
              <li className="rounded-lg bg-white px-4 py-3">Ceramic items.</li>
            </ul>
          </article>
        </section>

        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <Link
            to="/how-it-works"
            className="rounded-lg border border-emerald-300 bg-white px-5 py-3 text-center text-sm font-semibold text-emerald-800 hover:bg-emerald-50"
          >
            Learn How It Works
          </Link>
          <Link
            to="/login"
            className="rounded-lg bg-[#2E7D5E] px-5 py-3 text-center text-sm font-semibold text-white hover:bg-[#246B4E]"
          >
            Login To Charity Portal
          </Link>
        </div>
      </main>
    </div>
  );
}
