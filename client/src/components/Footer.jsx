import React from 'react'
import { Footer as ModernFooter } from './ui/footer'
import { FaFacebook, FaInstagram, FaLinkedin, FaTwitter, FaYoutube, FaEnvelope, FaPhone, FaMapMarkerAlt } from "react-icons/fa";
import toast from 'react-hot-toast';

const Footer = () => {
  // Newsletter subscription handler
  const handleNewsletterSubscribe = async (email) => {
    try {
      // Simulate API call - Replace with actual API endpoint
      console.log('Subscribing email:', email);
      
      // You can add your actual API call here
      // const response = await axios.post('/api/newsletter/subscribe', { email });
      
      // Simulate a delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Show success toast
      toast.success('Successfully subscribed to newsletter!', {
        duration: 3000,
        position: 'top-center',
        style: {
          background: '#DC2626',
          color: '#fff',
        },
      });
      
      return true;
    } catch (error) {
      console.error('Newsletter subscription error:', error);
      
      // Show error toast
      toast.error('Failed to subscribe. Please try again later.', {
        duration: 3000,
        position: 'top-center',
      });
      
      return false;
    }
  };

  // Useful links configuration
  const usefulLinks = [
    { label: 'About Us', href: '/about' },
    { label: 'Shop Now', href: '/' },
    { label: 'Categories', href: '/category' },
    { label: 'Contact Us', href: '/contact' },
    { label: 'Become a Rider', href: '/register-rider' },
    { label: 'Privacy Policy', href: '/privacy' },
    { label: 'Terms & Conditions', href: '/terms' },
  ];

  // Social media links
  const socialLinks = [
    { label: 'Facebook', href: 'https://facebook.com', icon: <FaFacebook /> },
    { label: 'Instagram', href: 'https://instagram.com', icon: <FaInstagram /> },
    { label: 'Twitter', href: 'https://twitter.com', icon: <FaTwitter /> },
    { label: 'LinkedIn', href: 'https://linkedin.com', icon: <FaLinkedin /> },
  ];

  return (
    <ModernFooter
      logoSrc="/logo.png"
      companyName="QUICKART"
      description="Your trusted partner for fresh groceries and daily essentials. Fast delivery, quality products, and the best prices - all at your fingertips."
      usefulLinks={usefulLinks}
      socialLinks={socialLinks}
      newsletterTitle="Subscribe to Our Newsletter"
      newsletterDescription="Get exclusive deals, new product alerts, and special offers delivered straight to your inbox!"
      onSubscribe={handleNewsletterSubscribe}
    />
  )
}

export default Footer
