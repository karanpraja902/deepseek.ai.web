'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { Check, Crown, Zap, Star, Settings, User, Bell, Shield, CreditCard, ArrowLeft } from 'lucide-react';
import { AppSidebar } from '../../../components/app-sidebar';

const SettingsPage = () => {
  const router = useRouter();

  const handleBackToChat = () => {
    // Try to go back to the previous page, or fallback to home
    if (window.history.length > 1) {
      router.back();
    } else {
      router.push('/');
    }
  };

  const user = {
    name: "vimal kamal",
    email: "chansinghal414@gmail.com",
    plan: "Pro Trial",
    daysLeft: 14
  };

  const subscriptionPlans = [
    {
      name: "Pro Trial",
      daysLeft: 14,
      price: "Free",
      description: "Unlimited Tab completions, extended Agent limits, and access to most features.",
      note: "Your subscription will start on September 14th.",
      features: [
        "Unlimited tab completions",
        "Extended Agent limits", 
        "Access to most features",
        "14 days free trial"
      ],
      buttonText: "Start Pro Now",
      buttonStyle: "bg-blue-600 hover:bg-blue-700 text-white",
      current: true,
      icon: <Crown className="w-5 h-5" />
    },
    {
      name: "Pro+",
      price: "$20/month",
      description: "3.5x higher limits than Pro for OpenAI, Claude, Gemini and Grok models.",
      features: [
        "3.5x higher limits than Pro",
        "OpenAI, Claude, Gemini access",
        "Grok models included",
        "OpenRouter API access",
        "Priority support"
      ],
      buttonText: "Upgrade to Pro+",
      buttonStyle: "bg-gray-800 hover:bg-gray-900 text-white border border-gray-600",
      current: false,
      icon: <Zap className="w-5 h-5" />
    },
    {
      name: "Ultra",
      price: "$40/month",
      description: "20x higher limits for OpenAI, Claude, Gemini, Grok models, and early access to advanced features.",
      features: [
        "20x higher limits",
        "All AI models included",
        "Early access to features",
        "Premium support",
        "Advanced analytics"
      ],
      buttonText: "Upgrade to Ultra",
      buttonStyle: "bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white",
      current: false,
      icon: <Star className="w-5 h-5" />
    }
  ];

  const integrations = [
    {
      name: "GitHub",
      description: "Connect GitHub for Background Agents, Bugbot and enhanced codebase context",
      connected: false,
      icon: "🐙"
    },
    {
      name: "Slack", 
      description: "Work with Background Agents from Slack",
      connected: false,
      icon: "💬"
    },
    {
      name: "Linear",
      description: "Connect a Linear workspace to delegate issues to Background Agents",
      connected: false,
      icon: "📋"
    }
  ];

  const settingsMenuItems = [
    { icon: <User className="w-4 h-4" />, label: "Overview", active: true },
    { icon: <Settings className="w-4 h-4" />, label: "Settings", active: false },
    { icon: <Shield className="w-4 h-4" />, label: "Integrations", active: false },
    { icon: <User className="w-4 h-4" />, label: "Background Agents", active: false },
    { icon: <Zap className="w-4 h-4" />, label: "Bugbot", active: false },
    { icon: <CreditCard className="w-4 h-4" />, label: "Usage", active: false },
    { icon: <CreditCard className="w-4 h-4" />, label: "Billing & Invoices", active: false },
    { icon: <Settings className="w-4 h-4" />, label: "Docs", active: false },
    { icon: <Bell className="w-4 h-4" />, label: "Contact Us", active: false }
  ];

  return (
    <div className="min-h-screen bg-white dark:bg-gray-700">
      {/* Header with back button - no sidebar */}
      <header className="sticky top-0 z-10 flex h-16 shrink-0 items-center gap-4 border-b border-gray-200 dark:border-gray-700 px-4 md:px-6 bg-white dark:bg-gray-800">
        <button
          onClick={handleBackToChat}
          className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span className="hidden sm:inline">Back to Chat</span>
        </button>
        <h1 className="text-lg font-semibold">Settings</h1>
      </header>

      {/* Main Content - Full Width with Responsive Layout */}
      <div className="flex-1 overflow-auto">
        <div className="max-w-7xl mx-auto p-4 md:p-6 lg:p-8">
          <div className="flex flex-col lg:flex-row gap-6 lg:gap-8">
            
            {/* Left Sidebar Menu - Responsive */}
            <div className="lg:w-64 lg:flex-shrink-0">
              <div className="bg-gray-50 dark:bg-gray-900 rounded-xl p-4 lg:p-6 border border-gray-200 dark:border-gray-700">
                <div className="mb-6">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-8 h-8 bg-gray-300 dark:bg-gray-600 rounded-full flex items-center justify-center">
                      <User className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="font-medium text-sm">{user.name}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">{user.plan} • {user.email}</p>
                    </div>
                  </div>
                </div>

                <nav className="space-y-1">
                  {settingsMenuItems.map((item, index) => (
                    <a
                      key={index}
                      href="#"
                      className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
                        item.active 
                          ? 'bg-gray-200 dark:bg-gray-800 text-gray-900 dark:text-gray-100' 
                          : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
                      }`}
                    >
                      {item.icon}
                      {item.label}
                    </a>
                  ))}
                </nav>
              </div>
            </div>

            {/* Main Content Area */}
            <div className="flex-1 min-w-0">
              <div className="space-y-6 lg:space-y-8">
                {/* Subscription Plans */}
                <div>
                  <h2 className="text-xl font-semibold mb-4">Subscription Plans</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 md:gap-6">
                {subscriptionPlans.map((plan, index) => (
                  <div
                    key={index}
                    className={`relative rounded-xl border p-4 md:p-6 ${
                      plan.current 
                        ? 'border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-950' 
                        : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800'
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-4">
                      {plan.icon}
                      <h3 className="text-lg font-semibold">{plan.name}</h3>
                      {plan.daysLeft && (
                        <span className="text-sm text-blue-600 dark:text-blue-400 font-medium">
                          {plan.daysLeft} Days Left
                        </span>
                      )}
                    </div>

                    <p className="text-2xl font-bold mb-2">{plan.price}</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">{plan.description}</p>
                    
                    {plan.note && (
                      <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">{plan.note}</p>
                    )}

                    <ul className="space-y-2 mb-6">
                      {plan.features.map((feature, featureIndex) => (
                        <li key={featureIndex} className="flex items-center gap-2 text-sm">
                          <Check className="w-4 h-4 text-green-500" />
                          {feature}
                        </li>
                      ))}
                    </ul>

                    <button className={`w-full py-2 px-4  rounded-lg font-medium transition-colors ${plan.buttonStyle}`}>
                      {plan.buttonText}
                    </button>
                  </div>
                  ))}
                  </div>
                </div>

                {/* Team Invitation Section */}
                <div className="bg-gray-50 dark:bg-gray-900 rounded-xl p-4 md:p-6 border border-gray-200 dark:border-gray-700">
                <h3 className="text-lg font-semibold mb-2">Invite Team Members</h3>
                <p className="text-gray-600 dark:text-gray-400 text-sm mb-4">
                  Accelerate your team with admin controls, analytics, and enterprise-grade security.
                </p>
                <button className="bg-gray-800 dark:bg-gray-700 hover:bg-gray-900 dark:hover:bg-gray-600 text-white px-4 py-2 rounded-lg font-medium transition-colors">
                  Invite Your Team
                </button>
                </div>

                {/* Integrations */}
                <div>
                  <h3 className="text-lg font-semibold mb-4">Integrations</h3>
                  <div className="space-y-4">
                    {integrations.map((integration, index) => (
                      <div key={index} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
                        <div className="flex items-center gap-3 min-w-0">
                          <span className="text-2xl flex-shrink-0">{integration.icon}</span>
                          <div className="min-w-0">
                            <h4 className="font-medium">{integration.name}</h4>
                            <p className="text-sm text-gray-600 dark:text-gray-400">{integration.description}</p>
                          </div>
                        </div>
                        <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors flex-shrink-0 w-full sm:w-auto">
                          Connect
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;
