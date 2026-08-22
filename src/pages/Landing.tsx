import Header from '../components/Header';
import Hero from '../components/Hero';
import Features from '../components/Features';
import HowItWorks from '../components/HowItWorks';
import SocialProof from '../components/SocialProof';
import Footer from '../components/Footer';

function App() {
  return (
    <div className="min-h-screen bg-[#0a0a1a] text-white">
      <Header />
      <main>
        <Hero />
        <Features />
        <HowItWorks />
        <SocialProof />
      </main>
      <Footer />
    </div>
  );
}

export default App;
