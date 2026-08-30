import React from "react";
import { ArrowLeft } from "lucide-react";
import BrandMark from "../components/BrandMark";
import { Link } from "react-router-dom";

const Error = () => {
  return (
    <div className="min-h-screen bg-black">
      <div className="flex items-center justify-center py-8">
        <BrandMark />
      </div>

      <div className="flex items-center justify-center px-4 py-12 md:py-24">
        <div className="lg:flex lg:items-center lg:space-x-10">
          <img
            src="https://illustrations.popsy.co/white/resistance-band.svg"
            alt="question-mark"
            className="h-[300px] w-auto"
          />
          <div>
            <p className="mt-6 text-sm font-semibold text-gray">404 error</p>
            <h1 className="mt-3 text-2xl font-semibold text-white md:text-3xl">
              We can&apos;t find that page
            </h1>
            <p className="mt-4 max-w-md text-gray">
              Sorry, the page you are looking for doesn&apos;t exist or has been moved.
            </p>
            <div className="mt-6 flex items-center space-x-3">
              <Link to="/">
                <button
                  type="button"
                  className="inline-flex items-center rounded-xl bg-red px-4 py-2.5 text-sm font-semibold text-white shadow-[0_8px_20px_-10px_rgba(225,29,72,0.8)]"
                >
                  <ArrowLeft size={16} className="mr-2" />
                  Go back
                </button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Error;
