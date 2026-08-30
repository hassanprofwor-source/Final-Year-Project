import React from "react";
import { SignIn as ClerkSignIn } from "@clerk/react";
import { dark } from "@clerk/ui/themes";
import BrandMark from "../components/BrandMark";
import "aos/dist/aos.css";

const clerkAppearance = {
  theme: dark,
  variables: {
    colorPrimary: "#e11d48",
    colorBackground: "#15171e",
    colorText: "#f4f1ec",
    colorTextSecondary: "#9ca3af",
    colorInputBackground: "#1c1f28",
    colorInputText: "#f4f1ec",
    borderRadius: "0.75rem",
  },
  elements: {
    card: "shadow-none border border-white/8 bg-surface",
    headerTitle: "text-white",
    headerSubtitle: "text-gray",
    socialButtonsBlockButton: "border-white/10 bg-elevated text-white",
    formButtonPrimary: "bg-red hover:bg-red/90",
    footerActionLink: "text-red",
  },
};

const SignIn = () => {
  return (
    <section className="relative min-h-screen bg-black">
      <div className="flex min-h-screen w-full flex-col items-center justify-center px-4 py-10 sm:px-6 lg:w-1/2 lg:px-8 xl:px-12">
        <div className="mb-8">
          <BrandMark glow />
        </div>
        <div className="w-full max-w-sm sm:max-w-md xl:max-w-lg">
          <p className="mb-6 text-center text-sm text-gray">
            Sign in to the Skyplate admin dashboard
          </p>
          <ClerkSignIn
            routing="virtual"
            fallbackRedirectUrl="/Home"
            appearance={clerkAppearance}
          />
        </div>
      </div>

      <div
        data-aos="slide-left"
        className="fixed right-0 top-0 hidden h-screen w-1/2 lg:block"
      >
        <img
          src="https://thumbs.dreamstime.com/b/baked-rolls-gourmet-squid-batter-garlic-sauce-japanese-food-vertical-photo-black-background-view-above-white-ginger-456472443.jpg"
          alt="Food"
          className="h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-black via-black/40 to-transparent" />
        <div className="absolute bottom-10 left-10 right-10">
          <p className="text-xs font-medium uppercase tracking-[0.22em] text-red">Skyplate</p>
          <p className="mt-2 max-w-sm text-2xl font-semibold text-white">
            A quieter, clearer way to run the restaurant.
          </p>
        </div>
      </div>
    </section>
  );
};

export default SignIn;
