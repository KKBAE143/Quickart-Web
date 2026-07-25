import React, { useState } from 'react';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { FaFacebook, FaInstagram, FaLinkedin, FaTwitter, FaCheck, FaHeart } from 'react-icons/fa';

/**
 * A modern, responsive footer component with newsletter subscription
 * Designed for Quickart e-commerce platform with red brand colors
 */
const Footer = ({
  logoSrc = '/logo.png',
  companyName = 'QUICKART',
  description = 'Your trusted partner for fresh groceries and daily essentials, delivered fast to your doorstep.',
  usefulLinks = [
    { label: 'About Us', href: '/about' },
    { label: 'Shop', href: '/shop' },
    { label: 'Contact', href: '/contact' },
    { label: 'Privacy Policy', href: '/privacy' },
    { label: 'Terms & Conditions', href: '/terms' },
  ],
  socialLinks = [
    { label: 'Facebook', href: 'https://facebook.com', icon: <FaFacebook /> },
    { label: 'Instagram', href: 'https://instagram.com', icon: <FaInstagram /> },
    { label: 'Twitter', href: 'https://twitter.com', icon: <FaTwitter /> },
    { label: 'LinkedIn', href: 'https://linkedin.com', icon: <FaLinkedin /> },
  ],
  newsletterTitle = 'Subscribe to our Newsletter',
  newsletterDescription = 'Get the latest deals and offers delivered to your inbox.',
  onSubscribe,
  className,
  ...props
}) => {
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [subscriptionStatus, setSubscriptionStatus] = useState('idle');

  const handleSubscribe = async (event) => {
    event.preventDefault();
    if (!email || !onSubscribe || isSubmitting) return;

    setIsSubmitting(true);
    const success = await onSubscribe(email);

    setSubscriptionStatus(success ? 'success' : 'error');
    setIsSubmitting(false);

    if (success) {
      setEmail('');
    }

    // Reset the status message after 3 seconds
    setTimeout(() => {
      setSubscriptionStatus('idle');
    }, 3000);
  };

  return (
    <footer 
      className={cn(
        'border-t-4 border-red-600 bg-gradient-to-b from-white to-gray-50',
        className
      )} 
      {...props}
    >
      <div className="container mx-auto px-4 py-12 lg:py-16">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-4 lg:gap-12">
          
          {/* Company Info */}
          <div className="flex flex-col items-start gap-4">
            <div className="flex items-center gap-3 group">
              <img 
                src={logoSrc} 
                alt={`${companyName} Logo`} 
                className="h-12 w-12 rounded-lg shadow-md transition-all duration-300 group-hover:shadow-lg group-hover:shadow-red-500/20" 
              />
              <span className="text-2xl font-bold bg-gradient-to-r from-red-600 to-red-700 bg-clip-text text-transparent">
                {companyName}
              </span>
            </div>
            <p className="text-sm text-gray-600 leading-relaxed">
              {description}
            </p>
            <div className="mt-2">
              <p className="text-xs text-gray-500">
                © {new Date().getFullYear()} {companyName}. All rights reserved.
              </p>
            </div>
          </div>

          {/* Useful Links */}
          <div className="md:justify-self-center">
            <h3 className="mb-4 text-lg font-bold text-gray-800 border-b-2 border-red-600 pb-2 inline-block">
              Quick Links
            </h3>
            <ul className="space-y-3">
              {usefulLinks.map((link) => (
                <li key={link.label}>
                  <a
                    href={link.href}
                    className="text-sm text-gray-600 transition-all duration-300 hover:text-red-600 hover:translate-x-1 inline-block font-medium"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Follow Us */}
          <div className="md:justify-self-center">
            <h3 className="mb-4 text-lg font-bold text-gray-800 border-b-2 border-red-600 pb-2 inline-block">
              Follow Us
            </h3>
            <ul className="space-y-3">
              {socialLinks.map((link) => (
                <li key={link.label}>
                  <a
                    href={link.href}
                    aria-label={link.label}
                    className="flex items-center gap-3 text-sm text-gray-600 transition-all duration-300 hover:text-red-600 hover:translate-x-1 font-medium group"
                  >
                    <span className="text-xl group-hover:scale-125 transition-transform duration-300">
                      {link.icon}
                    </span>
                    <span>{link.label}</span>
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Newsletter */}
          <div>
            <h3 className="mb-4 text-lg font-bold text-gray-800 border-b-2 border-red-600 pb-2 inline-block">
              {newsletterTitle}
            </h3>
            <p className="text-sm text-gray-600 mb-4">
              {newsletterDescription}
            </p>
            <form onSubmit={handleSubscribe} className="relative w-full">
               <div className="relative flex gap-2">
                <Input
                  type="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={isSubmitting || subscriptionStatus !== 'idle'}
                  required
                  aria-label="Email for newsletter"
                  className="flex-1 focus:border-red-600 focus:ring-red-600 focus:shadow-lg focus:shadow-red-500/20 transition-all duration-300"
                />
                <Button
                  type="submit"
                  disabled={isSubmitting || subscriptionStatus !== 'idle'}
                  className="px-4 py-2 whitespace-nowrap bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 text-white shadow-lg transition-all duration-300 hover:shadow-xl disabled:opacity-50"
                >
                  {isSubmitting ? 'Sending...' : 'Subscribe'}
                </Button>
              </div>
              
              {/* Status Message Overlay */}
              {(subscriptionStatus === 'success' || subscriptionStatus === 'error') && (
                <div
                  key={subscriptionStatus}
                  className="animate-in fade-in absolute inset-0 flex items-center justify-center rounded-lg bg-white/95 text-center backdrop-blur-sm shadow-lg"
                >
                  {subscriptionStatus === 'success' ? (
                    <span className="font-semibold text-green-600 flex items-center gap-2">
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      <span className='flex items-center gap-2'>
                        <FaCheck /> Subscribed!
                      </span>
                    </span>
                  ) : (
                    <span className="font-semibold text-red-600 flex items-center gap-2">
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                      Failed. Try again.
                    </span>
                  )}
                </div>
              )}
            </form>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-12 pt-8 border-t border-gray-200">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-gray-600">
            <p className="text-center md:text-left">
              Made with <FaHeart className='inline mx-1 text-red-500' /> for fast and fresh grocery delivery
            </p>
            <div className="flex items-center gap-4">
              <a href="/privacy" className="hover:text-red-600 transition-colors">Privacy</a>
              <span className="text-gray-300">•</span>
              <a href="/terms" className="hover:text-red-600 transition-colors">Terms</a>
              <span className="text-gray-300">•</span>
              <a href="/cookies" className="hover:text-red-600 transition-colors">Cookies</a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

Footer.displayName = 'Footer';

export { Footer };
export default Footer;

