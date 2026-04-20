"use client";

import { useState } from 'react';
import Link from 'next/link';

export default function ContactPage() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    subject: '',
    message: ''
  });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";
      const res = await fetch(`${apiUrl}/email/contact`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      if (res.ok) {
        setSuccess(true);
        setFormData({ name: '', email: '', phone: '', subject: '', message: '' });
      }
    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 py-12 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-6 py-3 bg-white rounded-3xl shadow-xl mb-6">
            <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl flex items-center justify-center">
              <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
            <div>
              <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                Get In Touch
              </h1>
              <p className="text-xl text-gray-600 mt-2">
                We'd love to hear from you. Send us a message!
              </p>
            </div>
          </div>
        </div>

        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Contact Info */}
          <div className="space-y-8">
            <div className="bg-white rounded-3xl p-8 shadow-2xl border border-gray-100">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Contact Information</h2>
              
              <div className="space-y-6">
                {/* WhatsApp */}
                <a href="https://wa.me/918160872204" target="_blank" rel="noopener noreferrer" className="group flex items-start gap-4 p-6 bg-gradient-to-r from-emerald-50 to-teal-50 rounded-2xl hover:shadow-xl transition-all hover:-translate-y-1 border border-emerald-100">
                  <div className="w-16 h-16 bg-gradient-to-br from-emerald-500 to-green-600 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-lg group-hover:shadow-emerald-500/25">
                    <svg className="w-7 h-7 fill-current text-white" viewBox="0 0 24 24">
                      <path d="M12.017 0C5.396 0 .029 5.367.029 11.987c0 1.613.268 3.18.749 4.632L0 24l6.38-1.675a11.963 11.963 0 006.637 1.849c6.621 0 11.987-5.367 11.987-11.987C24.004 5.367 18.638 0 12.017 0zm5.286 17.338a9.746 9.746 0 01-3.547 1.18c-.435.099-.884.15-1.345.15-.993 0-1.746-.747-1.746-1.669 0-.513.175-.942.489-1.295.05-.062 1.013-1.318 1.064-1.427.091-.36.091-.771-.2-1.116-.319-.367-1.108-.73-1.72-.93a11.83 11.83 0 01-1.249-.6c-.34-.22-.64-.5-.89-.82-.41-.49-.58-1.05-.58-1.694 0-1.253 1.063-2.27 2.374-2.27 1.094 0 1.722.692 1.78 1.5a2.71 2.71 0 01-.121.932c.174.186.598.722.598 1.16 0 .597.25 1.066.55 1.395.233.238.523.435.862.582.14.043.288.08.44.08.17 0 .337-.031.497-.094.265-.12.416-.431.416-.868 0-.499-.274-.916-.64-1.016-.063-.009-.126-.012-.19-.012-.167 0-.334.056-.5.167-.277.187-.466.47-.466 1.153 0 .706.475 1.24.95 1.24.063 0 .126-.007.189-.02.125-.025.236-.07.336-.14a1.68 1.68 0 00.482-.465c.125-.2.219-.45.219-.72 0-.296-.09-.55-.272-.737-.146-.15-.337-.23-.537-.23-.198 0-.36.062-.487.187-.256.25-.416.692-.416 1.182 0 .733.475 1.307.95 1.307.089 0 .178-.009.267-.027z"/>
                    </svg>
                  </div>
                  <div>
                    <p className="font-bold text-lg text-gray-900 mb-1">WhatsApp</p>
                    <p className="text-2xl font-bold text-emerald-600 group-hover:text-emerald-700">+91 8160872204</p>
                    <p className="text-sm text-gray-600 mt-1">Fastest way to connect. Available 24/7</p>
                  </div>
                </a>

                {/* Email */}
                <a href="mailto:ecomzone.sales@gmail.com" className="group flex items-start gap-4 p-6 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl hover:shadow-xl transition-all hover:-translate-y-1 border border-blue-100">
                  <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-lg group-hover:shadow-blue-500/25">
                    <svg className="w-7 h-7 fill-current text-white" viewBox="0 0 24 24">
                      <path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z"/>
                    </svg>
                  </div>
                  <div>
                    <p className="font-bold text-lg text-gray-900 mb-1">Email</p>
                    <p className="text-lg font-medium text-blue-600 group-hover:text-blue-700">ecomzone.sales@gmail.com</p>
                    <p className="text-sm text-gray-600 mt-1">Response within 12 hours</p>
                  </div>
                </a>

                {/* Phone */}
                <div className="group flex items-start gap-4 p-6 bg-gradient-to-r from-orange-50 to-amber-50 rounded-2xl hover:shadow-xl transition-all hover:-translate-y-1 border border-orange-100">
                  <div className="w-16 h-16 bg-gradient-to-br from-orange-500 to-amber-600 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-lg group-hover:shadow-orange-500/25">
                    <svg className="w-7 h-7 fill-current text-white" viewBox="0 0 24 24">
                      <path d="M6.62 10.79c1.44 2.83 3.76 5.14 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z"/>
                    </svg>
                  </div>
                  <div>
                    <p className="font-bold text-lg text-gray-900 mb-1">Phone</p>
                    <p className="text-lg font-medium text-orange-600 group-hover:text-orange-700">+91 8160872204</p>
                    <p className="text-sm text-gray-600 mt-1">Mon-Sat 9AM-7PM</p>
                  </div>
                </div>

                {/* Location */}
                <div className="group flex items-start gap-4 p-6 bg-gradient-to-r from-purple-50 to-pink-50 rounded-2xl hover:shadow-xl transition-all hover:-translate-y-1 border border-purple-100">
                  <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-600 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-lg group-hover:shadow-purple-500/25">
                    <svg className="w-7 h-7 fill-current text-white" viewBox="0 0 24 24">
                      <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
                    </svg>
                  </div>
                  <div>
                    <p className="font-bold text-lg text-gray-900 mb-1">Visit Us</p>
                    <p className="text-sm text-gray-600">Surat, Gujarat, India</p>
                    <p className="text-xs text-gray-500 mt-1">By appointment only</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Link href="/track" className="group block p-6 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-2xl hover:shadow-2xl hover:-translate-y-2 transition-all">
                <svg className="w-12 h-12 mx-auto mb-4 opacity-75 group-hover:opacity-100 transition" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                </svg>
                <h3 className="text-xl font-bold text-center mb-2">Track Order</h3>
                <p className="text-center opacity-90">Check delivery status instantly</p>
              </Link>

              <Link href="/profile" className="group block p-6 bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-2xl hover:shadow-2xl hover:-translate-y-2 transition-all">
                <svg className="w-12 h-12 mx-auto mb-4 opacity-75 group-hover:opacity-100 transition" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                <h3 className="text-xl font-bold text-center mb-2">My Profile</h3>
                <p className="text-center opacity-90">Update your information</p>
              </Link>
            </div>
          </div>

          {/* Contact Form */}
          <div>
            <div className="bg-white rounded-3xl p-8 shadow-2xl border border-gray-100">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Send us a Message</h2>
              <p className="text-gray-600 mb-8">Have a question? We'd love to hear from you.</p>

              {success ? (
                <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-8 text-center">
                  <div className="w-20 h-20 bg-emerald-100 rounded-2xl mx-auto flex items-center justify-center mb-4">
                    <svg className="w-10 h-10 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <h3 className="text-2xl font-bold text-emerald-800 mb-2">Message Sent!</h3>
                  <p className="text-emerald-700">We'll get back to you within 12 hours.</p>
                  <button 
                    onClick={() => setSuccess(false)}
                    className="mt-6 px-8 py-3 bg-emerald-600 text-white font-semibold rounded-xl hover:shadow-lg transition-all"
                  >
                    Send Another Message
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Full Name *
                    </label>
                    <input
                      required
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({...formData, name: e.target.value})}
                      className="w-full p-4 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition shadow-sm"
                      placeholder="Enter your full name"
                    />
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Email *
                      </label>
                      <input
                        required
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData({...formData, email: e.target.value})}
                        className="w-full p-4 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition shadow-sm"
                        placeholder="your.email@example.com"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Phone (WhatsApp)
                      </label>
                      <input
                        type="tel"
                        value={formData.phone}
                        onChange={(e) => setFormData({...formData, phone: e.target.value})}
                        className="w-full p-4 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition shadow-sm"
                        placeholder="+91 12345 67890"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Subject *
                    </label>
                    <input
                      required
                      type="text"
                      value={formData.subject}
                      onChange={(e) => setFormData({...formData, subject: e.target.value})}
                      className="w-full p-4 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition shadow-sm"
                      placeholder="What's this about?"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Message *
                    </label>
                    <textarea
                      required
                      rows={5}
                      value={formData.message}
                      onChange={(e) => setFormData({...formData, message: e.target.value})}
                      className="w-full p-4 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition shadow-sm resize-vertical"
                      placeholder="Tell us more about your query..."
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-6 px-8 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold text-lg rounded-2xl hover:shadow-2xl hover:-translate-y-1 transition-all disabled:opacity-50 flex items-center justify-center gap-3"
                  >
                    {loading ? (
                      <>
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
                        Sending...
                      </>
                    ) : (
                      'Send Message'
                    )}
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

