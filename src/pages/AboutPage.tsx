import { Link } from "react-router-dom";
import { PublicTabs } from "../components/PublicTabs";

export function AboutPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-emerald-50 via-white to-cyan-50 text-gray-900">
      <PublicTabs />

      <main className="mx-auto w-full max-w-5xl px-4 py-8 sm:px-6 sm:py-10">
        <section className="rounded-2xl border border-emerald-100 bg-white p-6 shadow-sm sm:p-8">
          <h1 className="text-3xl font-bold text-emerald-900 sm:text-4xl">About Goods Recycling</h1>
          <p className="mt-4 text-sm leading-7 text-gray-700 sm:text-base">
            Goods Recycling empowers you to effortlessly turn your unwanted goods into real, tangible cash support
            for the community causes you care about. We are a local non-profit organization providing an easy service
            that transforms unwanted items into meaningful help.
          </p>
          <p className="mt-4 text-sm leading-7 text-gray-700 sm:text-base">
            We provide a way for neighbors to conveniently help neighbors in need by recycling clothing and household
            goods at donation bins located throughout our community. We work directly with charity partners to make
            sure needed items are reused nearby.
          </p>
          <p className="mt-4 text-sm leading-7 text-gray-700 sm:text-base">
            We have successfully raised and distributed hundreds of thousands of dollars to charities, making a
            difference to people across the District, Maryland, and Virginia. We have also distributed hundreds of
            thousands of pieces of clothing neighbor to neighbor and continue to do so every day.
          </p>
        </section>

        <section className="mt-6 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm sm:p-8">
          <h2 className="text-2xl font-bold text-emerald-900">What Is Goods Recycling?</h2>
          <p className="mt-4 text-sm leading-7 text-gray-700 sm:text-base">
            Goods Recycling is a small, local nonprofit organization focused on helping our community recycle clothing
            responsibly while supplying needed items to local charity partners. We sort donations locally so our
            charity partners can rely on us to meet clothing needs throughout the seasons.
          </p>
        </section>

        <section className="mt-6 rounded-2xl border border-cyan-200 bg-cyan-50 p-6 sm:p-8">
          <h2 className="text-2xl font-bold text-cyan-900">Portal Highlights</h2>
          <ul className="mt-4 grid grid-cols-1 gap-3 text-sm text-cyan-950 sm:grid-cols-2">
            <li className="rounded-lg bg-white px-4 py-3">Smooth login for charity users and administrators</li>
            <li className="rounded-lg bg-white px-4 py-3">Submit and edit item requests</li>
            <li className="rounded-lg bg-white px-4 py-3">Track request and delivery status</li>
            <li className="rounded-lg bg-white px-4 py-3">Data syncing to Google Sheets</li>
          </ul>
        </section>

        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <Link
            to="/"
            className="rounded-lg bg-[#2E7D5E] px-5 py-3 text-center text-sm font-semibold text-white hover:bg-[#246B4E]"
          >
            Go To Home
          </Link>
          <Link
            to="/login"
            className="rounded-lg border border-emerald-300 bg-white px-5 py-3 text-center text-sm font-semibold text-emerald-800 hover:bg-emerald-50"
          >
            Sign In To Portal
          </Link>
        </div>
      </main>
    </div>
  );
}
