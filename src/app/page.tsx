import { ArrowRight } from "lucide-react";
import { Nav } from "~/components/nav";

export default function DashboardComponent() {
  return (
    <div>
      <Nav />
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-indigo-50 to-white px-4 py-12 sm:px-6 lg:px-8">
        <div className="max-w-3xl text-center">
          <div className="mb-8">
            <a
              href="#"
              className="inline-flex items-center space-x-2 rounded-full bg-indigo-100 px-4 py-2 text-sm font-medium text-indigo-700 transition duration-300 hover:bg-indigo-200"
            >
              <span className="font-semibold">What&apos;s new</span>
              <span className="inline-flex items-center space-x-1">
                <span>Just shipped v0.1.0</span>
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </span>
            </a>
          </div>
          <h1 className="mb-6 text-4xl font-extrabold tracking-tight text-gray-900 sm:text-5xl md:text-6xl">
            Native User Facing Integrations in{" "}
            <span className="text-indigo-600">Minutes</span>, not Months
          </h1>
          <p className="mb-10 text-xl leading-8 text-gray-600">
            Syncd handles all the stuff you don&apos;t want to - authentication,
            refresh tokens, rate limiting, basic auth, idiosynchratic API
            requirements, etc.
          </p>
          <div className="flex flex-col items-center justify-center space-y-4 sm:flex-row sm:space-x-4 sm:space-y-0">
            <a
              href="https://docs.syncd.dev"
              className="w-full rounded-md bg-indigo-600 px-8 py-3 text-base font-medium text-white shadow-sm transition duration-300 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 sm:w-auto"
            >
              View Documentation
            </a>
            <a
              href="#"
              className="w-full rounded-md border border-indigo-600 px-8 py-3 text-base font-medium text-indigo-600 transition duration-300 hover:bg-indigo-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 sm:w-auto"
            >
              Get Started
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
