// src/pages/ContactUsPage.jsx
import React from 'react';
import Header from '../components/common/Header';
import Footer from '../components/common/Footer';

// Import your new section components
import ContactFormSection from '../components/contact/ContactFormSection';
import ContactInfoCard from '../components/contact/ContactInfoCard';
import FaqCard from '../components/contact/FaqCard';

const ContactUs = () => {
  return (
    <div className="min-h-screen bg-white text-gray-800">
      <Header />

      <ContactFormSection />

      {/* Section 2: Contact Info & FAQ */}
      <section className="bg-white px-4 py-20 md:py-24">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12">
          <ContactInfoCard />
          <FaqCard />
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default ContactUs;