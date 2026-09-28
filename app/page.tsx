import Navbar from "@/components/ui/Navbar";
import StatusBar from "@/components/ui/StatusBar";
import Footer from "@/components/ui/Footer";
import Hero from "@/components/sections/Hero";
import Work from "@/components/sections/Work";
import Capabilities from "@/components/sections/Capabilities";
import DataScience from "@/components/sections/DataScience";
import Stack from "@/components/sections/Stack";
import About from "@/components/sections/About";
import Writing from "@/components/sections/Writing";
import Contact from "@/components/sections/Contact";
import SectionAnimations from "@/components/effects/SectionAnimations";

export default function Home() {
  return (
    <>
      <StatusBar />
      <Navbar />
      <main>
        <Hero />
        <Work />
        <Capabilities />
        <DataScience />
        <Stack />
        <About />
        <Writing />
        <Contact />
      </main>
      <Footer />
      <SectionAnimations />
    </>
  );
}
