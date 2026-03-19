"use client";

import { useState } from 'react';

const faqs = [
  {
    question: "How do I place an order?",
    answer: "Browse products, add to cart, checkout with your details and payment. You'll get order confirmation instantly with tracking details."
  },
  {
    question: "What are your business hours?",
    answer: "We are available Monday to Saturday, 9AM to 7PM IST via WhatsApp and email. Orders are processed 24/7."
  },
  {
    question: "Do you provide GST invoices?",
    answer: "Yes! All orders include proper GST billing. Enter your GST number during profile setup or checkout for business purchases."
  },
  {
    question: "What is your minimum order value?",
    answer: "No minimum order value! Order as few or as many items as you need. Perfect for both small and large businesses."
  },
  {
    question: "How long does delivery take?",
    answer: "Most orders ship within 24 hours. Delivery time: Metro cities 2-3 days, other cities 4-7 days across India."
  },
  {
    question: "What payment methods do you accept?",
    answer: "We accept UPI, Credit/Debit Cards, Net Banking, Wallets (Paytm/PhonePe), and GST invoicing for verified businesses."
  },
  {
    question: "Can I return or exchange products?",
    answer: "Yes! 7-day easy returns for defective/wrong items. Contact us via WhatsApp before returning for smooth process."
  },
  {
    question: "Do you ship all over India?",
    answer: "Yes! We ship PAN India via DTDC, Delhivery, BlueDart. Free shipping on orders above ₹5000."
  },
  {
    question: "How can I track my order?",
    answer: "Use Track Order page with your order ID or check your email/WhatsApp for live tracking links."
  },
  {
    question: "Is this wholesale pricing?",
    answer: "Yes! Bulk discounts auto-applied (5+ cartons). GST registered businesses get exclusive rates."
  }
];

export default function FAQPage() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-purple-50 to-pink-50 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-20">
          <div className="inline-flex items-center gap-3 px-8 py-4 bg-white rounded-3xl shadow-2xl mb-8">
            <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-600 rounded-2xl flex items-center justify-center shadow-xl">
              <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-gray-900 via-purple-900 to-pink-900 bg-clip-text text-transparent">
                Frequently Asked
              </h1>
              <p className="text-2xl text-transparent bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text">
                Questions
              </p>
              <p className="text-lg text-gray-600 mt-3 max-w-2xl mx-auto">
                Find answers to common queries or contact us for personalized support
              </p>
            </div>
          </div>
        </div>

        {/* FAQ Items */}
        <div className="space-y-4">
          {faqs.map((faq, index) => (
            <div key={index} className="bg-white rounded-3xl shadow-xl border border-gray-100 overflow-hidden hover:shadow-2xl transition-all hover:-translate-y-1">
              <button
                onClick={() => setOpenIndex(openIndex === index ? null : index)}
                className="w-full flex items-center justify-between p-8 text-left hover:bg-gray-50 transition-colors"
              >
                <div>
                  <h3 className="text-xl font-bold text-gray-900">{faq.question}</h3>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`w-3 h-3 rounded-full transition-all ${openIndex === index ? 'bg-purple-600 scale-110' : 'bg-gray-300 group-hover:bg-gray-400'}`}></span>
                  <svg className={`w-5 h-5 text-gray-500 transition-transform ${openIndex === index ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </button>
              
              <div className={`overflow-hidden transition-all duration-300 ${openIndex === index ? 'max-h-96' : 'max-h-0'}`}>
                <div className="p-8 pt-0 pb-12 bg-gradient-to-r from-purple-50 to-pink-50 border-t border-gray-100">
                  <p className="text-gray-700 leading-relaxed text-lg">{faq.answer}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* CTA Section */}
        <div className="mt-20 text-center">
          <div className="bg-gradient-to-r from-emerald-500 to-teal-600 p-12 rounded-3xl shadow-2xl text-white">
            <svg className="w-24 h-24 mx-auto mb-8 opacity-80" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Still have questions?
            </h2>
            <p className="text-xl opacity-90 mb-8 max-w-2xl mx-auto">
              Our team is ready to help you 24/7
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a 
                href="https://wa.me/918160872204"
                target="_blank" 
                rel="noopener noreferrer"
                className="px-8 py-4 bg-white/20 backdrop-blur-sm rounded-2xl font-semibold hover:bg-white/30 transition-all flex items-center gap-3"
              >
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                </svg>
                WhatsApp Chat
              </a>
              <a 
                href="mailto:ecomzone.sales@gmail.com"
                className="px-8 py-4 bg-white/20 backdrop-blur-sm rounded-2xl font-semibold hover:bg-white/30 transition-all flex items-center gap-3"
              >
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z"/>
                </svg>
                Send Email
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

