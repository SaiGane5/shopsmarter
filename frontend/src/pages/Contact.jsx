import React, { useState, useContext } from 'react';
import ThemeContext from '../context/ThemeContext';

const Contact = () => {
  const { darkMode } = useContext(ThemeContext);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState(null);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitStatus(null);

    // Simulate form submission
    try {
      await new Promise(resolve => setTimeout(resolve, 2000));
      setSubmitStatus('success');
      setFormData({ name: '', email: '', subject: '', message: '' });
    } catch (error) {
      setSubmitStatus('error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const contactMethods = [
    {
      icon: "📧",
      title: "Email Us",
      description: "Get in touch via email",
      contact: "support@shopsmarter.com",
      action: "mailto:support@shopsmarter.com"
    },
    {
      icon: "📞",
      title: "Call Us",
      description: "Speak to our support team",
      contact: "+1 (555) 123-4567",
      action: "tel:+15551234567"
    },
    {
      icon: "💬",
      title: "Live Chat",
      description: "Chat with us in real-time",
      contact: "Available 24/7",
      action: "#"
    },
    {
      icon: "📍",
      title: "Visit Us",
      description: "Our headquarters",
      contact: "123 Tech Street, SF, CA 94105",
      action: "https://maps.google.com"
    }
  ];

  const faqItems = [
    {
      question: "How does AI image search work?",
      answer: "Our AI uses advanced computer vision models to analyze the visual features of your uploaded image and find products with similar characteristics in our database."
    },
    {
      question: "Is my data secure?",
      answer: "Yes, we take data security seriously. All uploaded images are processed securely and deleted after analysis. We use industry-standard encryption for all transactions."
    },
    {
      question: "What image formats are supported?",
      answer: "We support JPG, PNG, JPEG, and WebP formats. For best results, use high-quality images with good lighting and clear product visibility."
    },
    {
      question: "How accurate are the search results?",
      answer: "Our AI achieves over 99% accuracy in product matching. Results improve continuously as our machine learning models learn from user interactions."
    },
    {
      question: "Can I return products?",
      answer: "Yes, we offer a 30-day return policy for all purchases. Items must be in original condition with tags attached."
    }
  ];

  return (
    <div className={`min-h-screen ${darkMode ? 'bg-gray-900 text-white' : 'bg-gray-50'}`}>
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
          <div className="text-center">
            <h1 className="text-4xl font-extrabold text-white sm:text-5xl md:text-6xl">
              Contact Us
            </h1>
            <p className="mt-6 max-w-3xl mx-auto text-xl text-gray-100">
              Have a question or need help? We're here to assist you with anything you need.
            </p>
          </div>
        </div>
      </div>

      {/* Contact Methods */}
      <div className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold">Get In Touch</h2>
            <p className="mt-4 text-lg text-gray-600">
              Choose your preferred way to reach us
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {contactMethods.map((method, index) => (
              <a
                key={index}
                href={method.action}
                className={`block p-6 rounded-xl ${darkMode ? 'bg-gray-800 hover:bg-gray-700' : 'bg-white hover:bg-gray-50'} shadow-lg hover:shadow-xl transition-all duration-300 text-center group`}
              >
                <div className="text-4xl mb-4">{method.icon}</div>
                <h3 className="text-xl font-semibold mb-2 group-hover:text-indigo-600 transition-colors">
                  {method.title}
                </h3>
                <p className="text-gray-600 text-sm mb-3">{method.description}</p>
                <p className="font-medium text-indigo-600">{method.contact}</p>
              </a>
            ))}
          </div>
        </div>
      </div>

      {/* Contact Form */}
      <div className={`py-16 ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold">Send Us a Message</h2>
            <p className="mt-4 text-lg text-gray-600">
              Fill out the form below and we'll get back to you within 24 hours
            </p>
          </div>
          
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="name" className="block text-sm font-medium mb-2">
                  Full Name *
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  required
                  className={`w-full px-4 py-3 rounded-lg border ${
                    darkMode 
                      ? 'bg-gray-700 border-gray-600 text-white focus:border-indigo-500' 
                      : 'bg-white border-gray-300 text-gray-900 focus:border-indigo-500'
                  } focus:ring-2 focus:ring-indigo-200 transition-colors`}
                  placeholder="Enter your full name"
                />
              </div>
              <div>
                <label htmlFor="email" className="block text-sm font-medium mb-2">
                  Email Address *
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  required
                  className={`w-full px-4 py-3 rounded-lg border ${
                    darkMode 
                      ? 'bg-gray-700 border-gray-600 text-white focus:border-indigo-500' 
                      : 'bg-white border-gray-300 text-gray-900 focus:border-indigo-500'
                  } focus:ring-2 focus:ring-indigo-200 transition-colors`}
                  placeholder="Enter your email address"
                />
              </div>
            </div>
            
            <div>
              <label htmlFor="subject" className="block text-sm font-medium mb-2">
                Subject *
              </label>
              <select
                id="subject"
                name="subject"
                value={formData.subject}
                onChange={handleInputChange}
                required
                className={`w-full px-4 py-3 rounded-lg border ${
                  darkMode 
                    ? 'bg-gray-700 border-gray-600 text-white focus:border-indigo-500' 
                    : 'bg-white border-gray-300 text-gray-900 focus:border-indigo-500'
                } focus:ring-2 focus:ring-indigo-200 transition-colors`}
              >
                <option value="">Select a subject</option>
                <option value="general">General Inquiry</option>
                <option value="support">Technical Support</option>
                <option value="billing">Billing Question</option>
                <option value="partnership">Partnership Opportunity</option>
                <option value="feedback">Feedback</option>
                <option value="other">Other</option>
              </select>
            </div>
            
            <div>
              <label htmlFor="message" className="block text-sm font-medium mb-2">
                Message *
              </label>
              <textarea
                id="message"
                name="message"
                value={formData.message}
                onChange={handleInputChange}
                required
                rows={6}
                className={`w-full px-4 py-3 rounded-lg border ${
                  darkMode 
                    ? 'bg-gray-700 border-gray-600 text-white focus:border-indigo-500' 
                    : 'bg-white border-gray-300 text-gray-900 focus:border-indigo-500'
                } focus:ring-2 focus:ring-indigo-200 transition-colors resize-vertical`}
                placeholder="Tell us how we can help you..."
              />
            </div>

            {submitStatus === 'success' && (
              <div className="p-4 bg-green-100 border border-green-400 text-green-700 rounded-lg">
                Thank you for your message! We'll get back to you within 24 hours.
              </div>
            )}

            {submitStatus === 'error' && (
              <div className="p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg">
                There was an error sending your message. Please try again.
              </div>
            )}
            
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-4 px-6 rounded-lg text-lg font-medium hover:from-indigo-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
            >
              {isSubmitting ? (
                <div className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-3"></div>
                  Sending Message...
                </div>
              ) : (
                'Send Message'
              )}
            </button>
          </form>
        </div>
      </div>

      {/* FAQ Section */}
      <div className="py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold">Frequently Asked Questions</h2>
            <p className="mt-4 text-lg text-gray-600">
              Find quick answers to common questions
            </p>
          </div>
          <div className="space-y-6">
            {faqItems.map((item, index) => (
              <div key={index} className={`p-6 rounded-xl ${darkMode ? 'bg-gray-800' : 'bg-white'} shadow-lg`}>
                <h3 className="text-lg font-semibold mb-3 text-indigo-600">
                  {item.question}
                </h3>
                <p className="text-gray-600 leading-relaxed">
                  {item.answer}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Contact;
