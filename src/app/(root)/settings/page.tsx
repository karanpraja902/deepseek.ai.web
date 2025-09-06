'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Check, Crown, Zap, Star, Settings, User, Bell, Shield, CreditCard, ArrowLeft, Loader2, Mail, Calendar, Clock } from 'lucide-react';
import { StripeService } from '@/services/api/stripe';
import { UserApiService } from '@/services/api/user';
import { toast } from 'react-hot-toast';
import { useAuth } from '@/contexts/AuthContext';


interface SubscriptionStatus {
  plan: string;
  status: string;
  currentPeriodEnd?: string;
  trialEnd?: string;
  subscribedAt?: string;
  daysLeft?: number;
}

const SettingsPageContent = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, userId, isLoading: authLoading, refreshUser } = useAuth();
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);
  const [subscriptionStatus, setSubscriptionStatus] = useState<SubscriptionStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeSection, setActiveSection] = useState('overview');
  // Use the actual logged-in user ID instead of static ID
  const currentUserId = userId;
  console.log("settings page user:", user);

  // Function to refresh subscription data only (user profile comes from AuthContext)
  const refreshSubscriptionData = async () => {
    try {
      // Fetch subscription status
      if (currentUserId) {
        const subscriptionResponse = await StripeService.getSubscriptionStatus(currentUserId);
        console.log('Subscription status refreshed:', subscriptionResponse);
        if (subscriptionResponse.success && subscriptionResponse.data) {
          setSubscriptionStatus(subscriptionResponse.data);
        }
      }
    } catch (err: any) {
      console.error('Failed to refresh subscription data:', err);
    }
  };

  // Fetch subscription status only (user profile comes from AuthContext)
  useEffect(() => {
    const fetchSubscriptionData = async () => {
      try {
        setLoading(true);
        setError(null);
        await refreshSubscriptionData();
      } catch (err: any) {
        console.error('Failed to fetch subscription data:', err);
        setError(err.message || 'Failed to load subscription data');
        toast.error('Failed to load subscription data');
      } finally {
        setLoading(false);
      }
    };

    if (currentUserId) {
      fetchSubscriptionData();
    } else {
      setLoading(false);
    }
  }, [currentUserId]);

  // Handle success/cancel URL parameters
  useEffect(() => {
    const success = searchParams.get('success');
    const canceled = searchParams.get('canceled');
    const plan = searchParams.get('plan');
    const sessionId = searchParams.get('session_id');

    if (success === 'true' && plan) {
      // Update user subscription based on the plan they subscribed to
      const updateSubscription = async () => {
        try {
          let subscriptionData;
          
          if (plan === 'pro-trial') {
            subscriptionData = {
              plan: 'Pro Trial',
              status: 'trial',
              subscribedAt: new Date(),
              trialEnd: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14 days from now
            };
          } else if (plan === 'pro-plus') {
            subscriptionData = {
              plan: 'Pro+',
              status: 'active',
              subscribedAt: new Date(),
              currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
            };
          } else if (plan === 'ultra') {
            subscriptionData = {
              plan: 'Ultra',
              status: 'active',
              subscribedAt: new Date(),
              currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
            };
          }

          if (subscriptionData && currentUserId) {
            await UserApiService.updateUserSubscription(currentUserId, subscriptionData);
            
            // Refresh subscription data to show updated subscription
            await refreshSubscriptionData();
          }
        } catch (error) {
          console.error('Failed to update subscription after successful payment:', error);
        }
      };

      updateSubscription();

      
      
      // Clean up URL parameters
      router.replace('/settings');
    }

    if (canceled === 'true') {
      toast.error('Payment was canceled. You can try again anytime.', {
        duration: 4000
      });
      // Clean up URL parameters
      router.replace('/settings');
    }
  }, [searchParams, router, currentUserId]);

  const handleBackToChat = () => {
    // Try to go back to the previous page, or fallback to home
    if (window.history.length > 1) {
      window.history.back();
    }
  };

  const handleSubscriptionClick = async (planKey: string, planName: string) => {
    try {
      setLoadingPlan(planKey);
      console.log('handleSubscriptionClick:', planKey, planName);
      
      // Different handling for Pro Trial vs paid plans
      if (planKey === 'pro-trial') {
        // toast.loading(`Activating ${planName}...`, {
        //   id: 'stripe-checkout'
        // });
        
        // For Pro Trial, we can update immediately since it's free
        try {
          if (currentUserId) {
            await UserApiService.updateUserSubscription(currentUserId, {
              plan: planName,
              status: 'trial',
              subscribedAt: new Date(),
              trialEnd: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14 days from now
            });
            console.log('Pro Trial subscription updated:', currentUserId, planName);
            
            // Refresh subscription data
            await refreshSubscriptionData();
            
           
          }
        } catch (updateError) {
          console.error('Failed to update Pro Trial subscription:', updateError);
          toast.error('Failed to activate trial. Please try again.', {
            id: 'stripe-checkout'
          });
        }
      } else {
        // For paid plans, redirect to Stripe checkout
        
        
        if (currentUserId) {
          toast.loading(`Redirecting to ${planName} checkout...`, {
            id: 'stripe-checkout'
          });
          await StripeService.redirectToCheckout(planKey, currentUserId);
        }
      }
    } catch (error: any) {
      console.error('Subscription error:', error);
      toast.error(error.message || `Failed to ${planKey === 'pro-trial' ? 'activate trial' : 'redirect to checkout'}`, {
        id: 'stripe-checkout'
      });
    } finally {
      setLoadingPlan(null);
    }
  };

  // Calculate days left in trial or subscription
  const getDaysLeft = () => {
    if (subscriptionStatus?.trialEnd) {
      const trialEnd = new Date(subscriptionStatus.trialEnd);
      const now = new Date();
      const diffTime = trialEnd.getTime() - now.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return Math.max(0, diffDays);
    }
    if (subscriptionStatus?.currentPeriodEnd) {
      const periodEnd = new Date(subscriptionStatus.currentPeriodEnd);
      const now = new Date();
      const diffTime = periodEnd.getTime() - now.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return Math.max(0, diffDays);
    }
    return 0;
  };

  // Get current plan name from subscription status
  const getCurrentPlan = () => {
    if (subscriptionStatus?.plan) {
      return subscriptionStatus.plan;
    }
    return "Free"; // Default fallback
  };

  // Get current plan status
  const getCurrentPlanStatus = () => {
    if (subscriptionStatus?.status) {
      return subscriptionStatus.status;
    }
    return "inactive";
  };

  const subscriptionPlans = [
    {
      key: "pro-trial",
      name: "Pro Trial",
      daysLeft: getCurrentPlan() === "Pro Trial" ? getDaysLeft() : undefined,
      price: "Free",
      description: "limited access to most features, 14 days free trial",
      note: getCurrentPlan() === "Pro Trial" && subscriptionStatus?.trialEnd 
        ? `Your trial ends on ${new Date(subscriptionStatus.trialEnd).toLocaleDateString()}.` 
        : getCurrentPlan() === "Pro+" || getCurrentPlan() === "Ultra"
        ? "You already have a higher-tier plan"
        : "Your subscription will start on September 14th.",
      features: [
        "Limited access to most features",
        "14 days free trial", 
        "Demo mode",
        "Daily token limit",
      ],
      buttonText: getCurrentPlan() === "Pro Trial" ? "Current Plan" : 
                  getCurrentPlan() === "Pro+" || getCurrentPlan() === "Ultra" ? "Not Available" : "Start Pro Now",
      buttonStyle: getCurrentPlan() === "Pro Trial" 
        ? "bg-green-600 hover:bg-green-700 text-white cursor-not-allowed" 
        : getCurrentPlan() === "Pro+" || getCurrentPlan() === "Ultra"
        ? "bg-gray-400 cursor-not-allowed text-white"
        : "bg-blue-600 hover:bg-blue-700 text-white",
      current: getCurrentPlan() === "Pro Trial",
      disabled: getCurrentPlan() === "Pro+" || getCurrentPlan() === "Ultra",
      icon: <Crown className="w-5 h-5" />
    },
    {
      key: "pro-plus",
      name: "Pro+",
      daysLeft: getCurrentPlan() === "Pro+" ? getDaysLeft() : undefined,
      price: "$20/month",
      description: "Access to all features, image generation, and deepresearch",
      note: getCurrentPlan() === "Pro+" && subscriptionStatus?.currentPeriodEnd 
        ? `Your subscription renews on ${new Date(subscriptionStatus.currentPeriodEnd).toLocaleDateString()}.` 
        : undefined,
      features: [
        "Access to all features",
        "1000 tokens per day",
        "Priority support",
        "OpenRouter API access",
        "Early access to features"
      ],
      buttonText: getCurrentPlan() === "Pro+" ? "Current Plan" : "Upgrade to Pro+",
      buttonStyle: getCurrentPlan() === "Pro+" 
        ? "bg-green-600 hover:bg-green-700 text-white cursor-not-allowed" 
        : "bg-gray-800 hover:bg-gray-900 text-white border border-gray-600",
      current: getCurrentPlan() === "Pro+",
      icon: <Zap className="w-5 h-5" />
    },
    {
      key: "ultra",
      name: "Ultra",
      daysLeft: getCurrentPlan() === "Ultra" ? getDaysLeft() : undefined,
      price: "$40/month",
      description: "20x higher limits for OpenAI, Claude, Gemini, Grok models, and early access to advanced features.",
      note: getCurrentPlan() === "Ultra" && subscriptionStatus?.currentPeriodEnd 
        ? `Your subscription renews on ${new Date(subscriptionStatus.currentPeriodEnd).toLocaleDateString()}.` 
        : undefined,
      features: [
        "20x higher limits",
        "All AI models included",
        "Early access to features",
        "Premium support",
        "Advanced analytics"
      ],
      buttonText: getCurrentPlan() === "Ultra" ? "Current Plan" : "Upgrade to Ultra",
      buttonStyle: getCurrentPlan() === "Ultra" 
        ? "bg-green-600 hover:bg-green-700 text-white cursor-not-allowed" 
        : "bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white",
      current: getCurrentPlan() === "Ultra",
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
    { icon: <User className="w-4 h-4" />, label: "Overview", section: "overview", active: activeSection === "overview" },
    { icon: <CreditCard className="w-4 h-4" />, label: "Subscriptions", section: "subscriptions", active: activeSection === "subscriptions" },
    { icon: <Shield className="w-4 h-4" />, label: "Integrations", section: "integrations", active: activeSection === "integrations" },
    { icon: <User className="w-4 h-4" />, label: "Background Agents", section: "background-agents", active: activeSection === "background-agents" },
    { icon: <Zap className="w-4 h-4" />, label: "Bugbot", section: "bugbot", active: activeSection === "bugbot" },
    { icon: <CreditCard className="w-4 h-4" />, label: "Usage", section: "usage", active: activeSection === "usage" },
    { icon: <CreditCard className="w-4 h-4" />, label: "Billing & Invoices", section: "billing", active: activeSection === "billing" },
    { icon: <Settings className="w-4 h-4" />, label: "Docs", section: "docs", active: activeSection === "docs" },
    { icon: <Bell className="w-4 h-4" />, label: "Contact Us", section: "contact", active: activeSection === "contact" }
  ];

  // if (loading) {
  //   return (
  //     <div className="min-h-screen bg-white dark:bg-gray-700 flex items-center justify-center">
  //       <div className="text-center">
  //         <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-blue-600" />
  //         <p className="text-gray-600 dark:text-gray-400">Loading your profile...</p>
  //       </div>
  //     </div>
  //   );
  // }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-700/80 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-400 mb-4">⚠️</div>
          <p className="text-gray-100 mb-4">{error}</p>
          <button 
            onClick={() => window.location.reload()} 
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
      <div className="bg-gray-800/90">
      {/* Header with back button - no sidebar */}
      <header className="sticky top-0 bg-gray-800/95 z-10 flex h-16 shrink-0 items-center gap-4 border-b border-gray-600 px-4 md:px-6">
        <button
          onClick={handleBackToChat}
          className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-100 hover:text-gray-200 hover:bg-gray-600 rounded-lg transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span className="hidden sm:inline">Back to Chat</span>
        </button>
        <h1 className="text-lg font-semibold text-gray-100">Settings</h1>
      </header>

      {/* Main Content - Full Width with Responsive Layout */}
      {user && <div className="flex-1 overflow-auto bg-gray-800/90">
        <div className="max-w-7xl mx-auto p-4 md:p-6 lg:p-8">
          <div className="flex flex-col lg:flex-row gap-6 lg:gap-8">
            
            {/* Left Sidebar Menu - Responsive */}
            <div className="lg:w-64 lg:flex-shrink-0">
              <div className="bg-gray-900/90 rounded-xl p-4 lg:p-6 border border-gray-600">
                <div className="mb-6">
                  {/* User Profile Section */}
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold text-lg">
                      {user?.avatar ? (
                        <img src={user.avatar} alt={user.name} className="w-12 h-12 rounded-full" />
                      ) : (
                        user?.name?.charAt(0)?.toUpperCase() || 'U'
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm truncate text-gray-100">{user?.name || 'User'}</p>
                      <p className="text-xs text-gray-300 truncate">{getCurrentPlan()}</p>
                    </div>
                  </div>

                  {/* User Details */}
                  <div className="space-y-2 mb-4">
                    <div className="flex items-center gap-2 text-xs text-gray-300">
                      <Mail className="w-3 h-3" />
                      <span className="truncate">{user?.email || 'No email'}</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-gray-300">
                      <Calendar className="w-3 h-3" />
                      <span>Member since Unknown</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-gray-300">
                      <Clock className="w-3 h-3" />
                      <span>Last active Unknown</span>
                    </div>
                  </div>

                  {/* Current Plan Status */}
                  {subscriptionStatus && (
                    <div className={`rounded-lg p-3 mb-4 border ${
                      getCurrentPlanStatus() === 'trial' 
                        ? 'bg-blue-900/50 border-blue-400' 
                        : 'bg-green-900/50 border-green-400'
                    }`}>
                      <p className={`text-xs font-medium ${
                        getCurrentPlanStatus() === 'trial' 
                          ? 'text-blue-200' 
                          : 'text-green-200'
                      }`}>
                        {getCurrentPlanStatus() === 'trial' 
                          ? `Trial ends in ${getDaysLeft()} days`
                          : `Plan active - renews in ${getDaysLeft()} days`
                        }
                      </p>
                    </div>
                  )}
                </div>

                <nav className="space-y-1">
                  {settingsMenuItems.map((item, index) => (
                    <button
                      key={index}
                      onClick={() => setActiveSection(item.section)}
                      className={`w-full text-left flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
                        item.active 
                          ? 'bg-gray-600 text-gray-100' 
                          : 'text-gray-300 hover:bg-gray-700'
                      }`}
                    >
                      {item.icon}
                      {item.label}
                    </button>
                  ))}
                </nav>
              </div>
            </div>

            {/* Main Content Area */}
            <div className="flex-1 min-w-0">
              <div className="space-y-6 lg:space-y-8">
                                {/* Overview Section */}
                {activeSection === 'overview' && (
                  <>
                    {/* User Profile Overview */}
                    <div className="bg-gray-900/90 rounded-xl border border-gray-600 p-6">
                      <h2 className="text-xl font-semibold mb-4 text-gray-100">Profile Overview</h2>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <h3 className="font-medium text-gray-100 mb-3">Personal Information</h3>
                          <div className="space-y-3">
                            <div>
                              <label className="text-sm text-gray-300">Full Name</label>
                              <p className="text-gray-100">{user?.name || 'Not set'}</p>
                            </div>
                            <div>
                              <label className="text-sm text-gray-300">Email</label>
                              <p className="text-gray-100">{user?.email || 'Not set'}</p>
                            </div>
                            <div>
                              <label className="text-sm text-gray-300">Username</label>
                              <p className="text-gray-100">{user?.username || 'Not set'}</p>
                            </div>
                          </div>
                        </div>
                        <div>
                          <h3 className="font-medium text-gray-100 mb-3">Preferences</h3>
                          <div className="space-y-3">
                            <div>
                              <label className="text-sm text-gray-300">Theme</label>
                              <p className="text-gray-100 capitalize">{user?.preferences?.theme || 'Not set'}</p>
                            </div>
                            <div>
                              <label className="text-sm text-gray-300">Language</label>
                              <p className="text-gray-100">{user?.preferences?.language || 'Not set'}</p>
                            </div>
                            <div>
                              <label className="text-sm text-gray-300">AI Model</label>
                              <p className="text-gray-100">{user?.preferences?.aiModel || 'Not set'}</p>
                            </div>
                            <div>
                              <label className="text-sm text-gray-300">Conversation Style</label>
                              <p className="text-gray-100 capitalize">{user?.preferences?.conversationStyle || 'Not set'}</p>
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      {/* Subscription Information */}
                      {subscriptionStatus && (
                        <div className="mt-6 pt-6 border-t border-gray-600">
                          <h3 className="font-medium text-gray-100 mb-3">Subscription Information</h3>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                              <div className="space-y-3">
                                <div>
                                  <label className="text-sm text-gray-300">Current Plan</label>
                                  <p className="text-gray-100 font-medium">{subscriptionStatus.plan}</p>
                                </div>
                                <div>
                                  <label className="text-sm text-gray-300">Status</label>
                                  <p className="text-gray-100 capitalize">{subscriptionStatus.status}</p>
                                </div>
                              </div>
                            </div>
                            <div>
                              <div className="space-y-3">
                                <div>
                                  <label className="text-sm text-gray-300">Subscribed On</label>
                                  <p className="text-gray-100">
                                    {subscriptionStatus.subscribedAt ? new Date(subscriptionStatus.subscribedAt).toLocaleDateString() : 'Not available'}
                                  </p>
                                </div>
                                {subscriptionStatus.trialEnd && (
                                  <div>
                                    <label className="text-sm text-gray-300">Trial Ends</label>
                                    <p className="text-gray-100">
                                      {new Date(subscriptionStatus.trialEnd).toLocaleDateString()}
                                    </p>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Team Invitation Section */}
                    <div className="bg-gray-900/90 rounded-xl p-4 md:p-6 border border-gray-600">
                      <h3 className="text-lg font-semibold mb-2 text-gray-100">Invite Team Members</h3>
                      <p className="text-gray-300 text-sm mb-4">
                        Accelerate your team with admin controls, analytics, and enterprise-grade security.
                      </p>
                      <button className="bg-gray-600 hover:bg-gray-500 text-white px-4 py-2 rounded-lg font-medium transition-colors">
                        Invite Your Team
                      </button>
                    </div>
                  </>
                )}

                {/* Subscriptions Section */}
                {activeSection === 'subscriptions' && (
                  <div className="bg-gray-900/90 rounded-xl border border-gray-600 p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h2 className="text-xl font-semibold text-gray-100">Subscriptions</h2>
                      <button
                        onClick={async () => {
                          await refreshUser();
                          await refreshSubscriptionData();
                        }}
                        className="flex items-center gap-2 px-3 py-2 text-sm bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                        </svg>
                        Refresh
                      </button>
                    </div>
                    
                    {/* Current Plan Summary */}
                    {subscriptionStatus && (
                      <div className="mb-6 p-4 bg-gradient-to-r from-blue-900/50 to-purple-900/50 border border-blue-400 rounded-lg">
                        <div className="flex items-center justify-between">
                          <div>
                            <h3 className="font-semibold text-lg text-gray-100">
                              Current Plan: {subscriptionStatus.plan}
                            </h3>
                            <p className="text-sm text-gray-300 mt-1">
                              Status: <span className="capitalize font-medium">{subscriptionStatus.status}</span>
                              {getDaysLeft() > 0 && (
                                <span className="ml-2">
                                  • {getDaysLeft()} days remaining
                                </span>
                              )}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-sm text-gray-300">
                              Subscribed on {subscriptionStatus.subscribedAt ? new Date(subscriptionStatus.subscribedAt).toLocaleDateString() : 'Unknown'}
                            </p>
                            {subscriptionStatus.trialEnd && (
                              <p className="text-sm text-blue-300 font-medium">
                                Trial ends: {new Date(subscriptionStatus.trialEnd).toLocaleDateString()}
                              </p>
                            )}
                            {subscriptionStatus.currentPeriodEnd && (
                              <p className="text-sm text-green-300 font-medium">
                                Renews: {new Date(subscriptionStatus.currentPeriodEnd).toLocaleDateString()}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    )}
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 md:gap-6">
                      {subscriptionPlans.map((plan, index) => (
                                            <div
                      key={index}
                      className={`relative rounded-xl border p-4 md:p-6 ${
                        plan.current 
                          ? 'border-blue-400 bg-blue-900/50' 
                          : plan.disabled
                          ? 'border-gray-500 bg-gray-800/50 opacity-75'
                          : 'border-gray-600 bg-gray-900/90'
                      }`}
                    >
                      {/* Disabled Plan Overlay */}
                      {plan.disabled && (
                        <div className="absolute inset-0 bg-gray-700 bg-opacity-50 rounded-xl flex items-center justify-center">
                          <div className="text-center">
                            <div className="text-gray-300 text-sm font-medium mb-1">
                              Plan Unavailable
                            </div>
                            <div className="text-gray-400 text-xs">
                              You have a higher-tier plan
                            </div>
                          </div>
                        </div>
                      )}
                      
                      <div className="flex items-center gap-2 mb-4">
                        {plan.icon}
                        <h3 className="text-lg font-semibold text-gray-100">{plan.name}</h3>
                        {plan.daysLeft && plan.daysLeft > 0 && (
                          <span className="text-sm text-blue-300 font-medium">
                            {plan.daysLeft} Days Left
                          </span>
                        )}
                      </div>

                          <p className="text-2xl font-bold mb-2 text-gray-100">{plan.price}</p>
                          <p className="text-sm text-gray-300 mb-4">{plan.description}</p>
                          
                          {plan.note && (
                            <p className="text-sm text-gray-400 mb-4">{plan.note}</p>
                          )}

                          <ul className="space-y-2 mb-6">
                            {plan.features.map((feature, featureIndex) => (
                              <li key={featureIndex} className="flex items-center gap-2 text-sm text-gray-100">
                                <Check className="w-4 h-4 text-green-400" />
                                {feature}
                              </li>
                            ))}
                          </ul>

                                              <button 
                      onClick={() => plan.current || plan.disabled ? null : handleSubscriptionClick(plan.key, plan.name)}
                      disabled={loadingPlan === plan.key || plan.current || plan.disabled}
                      className={`w-full py-2 px-4 rounded-lg font-medium transition-colors flex items-center justify-center gap-2 ${plan.buttonStyle} ${
                        loadingPlan === plan.key || plan.current || plan.disabled ? 'opacity-75 cursor-not-allowed' : ''
                      }`}
                    >
                      {loadingPlan === plan.key ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Processing...
                        </>
                      ) : (
                        plan.buttonText
                      )}
                    </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Integrations Section */}
                {activeSection === 'integrations' && (
                  <div className="bg-gray-900/90 rounded-xl border border-gray-600 p-6">
                    <h2 className="text-xl font-semibold mb-4 text-gray-100">Integrations</h2>
                    <div className="space-y-4">
                      {integrations.map((integration, index) => (
                        <div key={index} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 border border-gray-600 rounded-lg bg-gray-700/50">
                          <div className="flex items-center gap-3 min-w-0">
                            <span className="text-2xl flex-shrink-0">{integration.icon}</span>
                            <div className="min-w-0">
                              <h4 className="font-medium text-gray-100">{integration.name}</h4>
                              <p className="text-sm text-gray-300">{integration.description}</p>
                            </div>
                          </div>
                          <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors flex-shrink-0 w-full sm:w-auto">
                            Connect
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Other sections can be added here */}
                {activeSection !== 'overview' && activeSection !== 'subscriptions' && activeSection !== 'integrations' && (
                  <div className="bg-gray-900/90 rounded-xl border border-gray-600 p-6">
                    <h2 className="text-xl font-semibold mb-4 text-gray-100">{settingsMenuItems.find(item => item.section === activeSection)?.label || 'Section'}</h2>
                    <p className="text-gray-300">This section is coming soon.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>}
    </div>
  );
};

const SettingsPage = () => {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-screen"><Loader2 className="h-8 w-8 animate-spin" /></div>}>
      <SettingsPageContent />
    </Suspense>
  );
};

export default SettingsPage;
