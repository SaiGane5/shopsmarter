import React, { useContext } from 'react';
import ThemeContext from '../context/ThemeContext';

const About = () => {
  const { darkMode } = useContext(ThemeContext);

  const features = [
    {
      icon: "🤖",
      title: "AI-Powered Search",
      description: "Advanced computer vision technology analyzes your images to find similar products with incredible accuracy."
    },
    {
      icon: "🔍",
      title: "Smart Recommendations",
      description: "Our machine learning algorithms learn from your preferences to suggest products you'll love."
    },
    {
      icon: "⚡",
      title: "Lightning Fast",
      description: "Get results in seconds with our optimized search infrastructure and FAISS indexing."
    },
    {
      icon: "🛡️",
      title: "Secure Shopping",
      description: "Shop with confidence using our secure Stripe payment processing and data protection."
    }
  ];

  const teamMembers = [
    {
      name: "Alex Chen",
      role: "Lead AI Engineer",
      image: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-1.2.1&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80",
      description: "Expert in computer vision and machine learning with 8+ years of experience."
    },
    {
      name: "Sarah Johnson",
      role: "Product Designer",
      image: "https://images.unsplash.com/photo-1494790108755-2616b612b786?ixlib=rb-1.2.1&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80",
      description: "UX/UI designer passionate about creating intuitive shopping experiences."
    },
    {
      name: "Mike Rodriguez",
      role: "Backend Engineer",
      image: "https://images.unsplash.com/photo-1519244703995-f4e0f30006d5?ixlib=rb-1.2.1&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80",
      description: "Full-stack developer specializing in scalable e-commerce solutions."
    }
  ];

  return (
    <div className={`min-h-screen ${darkMode ? 'bg-gray-900 text-white' : 'bg-gray-50'}`}>
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 lg:py-32">
          <div className="text-center">
            <h1 className="text-4xl font-extrabold text-white sm:text-5xl md:text-6xl">
              About ShopSmarter
            </h1>
            <p className="mt-6 max-w-3xl mx-auto text-xl text-gray-100 leading-relaxed">
              We're revolutionizing online shopping with AI-powered image search technology. 
              Find products instantly by simply uploading a photo.
            </p>
          </div>
        </div>
      </div>

      {/* Mission Section */}
      <div className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl font-bold mb-6">Our Mission</h2>
              <p className="text-lg text-gray-600 mb-6">
                At ShopSmarter, we believe shopping should be effortless and intuitive. Our mission is to bridge 
                the gap between what you see and what you can buy, using cutting-edge AI technology.
              </p>
              <p className="text-lg text-gray-600 mb-6">
                Whether you spotted something amazing on social media, saw a product in real life, or just have 
                a vague idea of what you're looking for, our AI-powered search helps you find it instantly.
              </p>
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <div className="text-3xl font-bold text-indigo-600">10M+</div>
                  <div className="text-sm text-gray-500">Products Indexed</div>
                </div>
                <div>
                  <div className="text-3xl font-bold text-indigo-600">99.2%</div>
                  <div className="text-sm text-gray-500">Search Accuracy</div>
                </div>
                <div>
                  <div className="text-3xl font-bold text-indigo-600">500K+</div>
                  <div className="text-sm text-gray-500">Happy Customers</div>
                </div>
                <div>
                  <div className="text-3xl font-bold text-indigo-600">&lt;2s</div>
                  <div className="text-sm text-gray-500">Average Search Time</div>
                </div>
              </div>
            </div>
            <div className="relative">
              <img
                src="https://images.unsplash.com/photo-1559136555-9303baea8ebd?ixlib=rb-4.0.3&auto=format&fit=crop&w=1470&q=80"
                alt="AI Technology"
                className="rounded-lg shadow-xl"
              />
              <div className="absolute inset-0 bg-gradient-to-tr from-indigo-600/20 to-purple-600/20 rounded-lg"></div>
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className={`py-16 ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold">Why Choose ShopSmarter?</h2>
            <p className="mt-4 text-lg text-gray-600">
              Discover the technology and features that make us different
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <div key={index} className={`text-center p-6 rounded-xl ${darkMode ? 'bg-gray-700' : 'bg-gray-50'} hover:shadow-lg transition-shadow duration-300`}>
                <div className="text-4xl mb-4">{feature.icon}</div>
                <h3 className="text-xl font-semibold mb-3">{feature.title}</h3>
                <p className="text-gray-600">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Team Section */}
      <div className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold">Meet Our Team</h2>
            <p className="mt-4 text-lg text-gray-600">
              The passionate people behind ShopSmarter's innovation
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {teamMembers.map((member, index) => (
              <div key={index} className={`text-center p-6 rounded-xl ${darkMode ? 'bg-gray-800' : 'bg-white'} shadow-lg hover:shadow-xl transition-shadow duration-300`}>
                <img
                  src={member.image}
                  alt={member.name}
                  className="w-24 h-24 rounded-full mx-auto mb-4 object-cover"
                />
                <h3 className="text-xl font-semibold mb-2">{member.name}</h3>
                <p className="text-indigo-600 font-medium mb-3">{member.role}</p>
                <p className="text-gray-600 text-sm">{member.description}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Technology Section */}
      <div className={`py-16 ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold">Our Technology Stack</h2>
            <p className="mt-4 text-lg text-gray-600">
              Built with cutting-edge technologies for optimal performance
            </p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-8">
            {[
              { name: "OpenAI CLIP", logo: "🤖" },
              { name: "FAISS", logo: "🔍" },
              { name: "React", logo: "⚛️" },
              { name: "Flask", logo: "🐍" },
              { name: "Stripe", logo: "💳" },
              { name: "PostgreSQL", logo: "🗄️" }
            ].map((tech, index) => (
              <div key={index} className={`text-center p-4 rounded-lg ${darkMode ? 'bg-gray-700' : 'bg-gray-50'} hover:shadow-md transition-shadow duration-300`}>
                <div className="text-3xl mb-2">{tech.logo}</div>
                <div className="text-sm font-medium">{tech.name}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default About;
