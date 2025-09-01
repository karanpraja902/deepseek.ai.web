'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Check, Crown, Zap, Star, Settings, User, Bell, Shield, CreditCard, ArrowLeft, Loader2, Mail, Calendar, Clock } from 'lucide-react';
import { AppSidebar } from '@/components/app-sidebar';
import { StripeService } from '@/services/api/stripe';
import { UserApiService } from '@/services/api/user';
import { toast } from 'react-hot-toast';
import { useAuth } from '@/contexts/AuthContext';
import { AuthGuard } from '@/components/auth/AuthGuard';

interface UserProfile {
  id: string;
  email: string;
  username: string;
  name: string;
  avatar: string;
  preferences: {
    theme: 'light' | 'dark';
    language: string;
    aiModel: string;
    conversationStyle: 'formal' | 'casual' | 'technical';
    topics: string[];
  };
  subscription?: {
    plan: string;
    status: string;
    subscribedAt: Date;
    currentPeriodEnd?: Date;
    trialEnd?: Date;
  };
  createdAt: Date;
  lastActive: Date;
}

interface SubscriptionStatus {
  plan: string;
  status: string;
  currentPeriodEnd?: string;
  trialEnd?: string;
  daysLeft?: number;
}

const SettingsPageContent = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, userId, isLoading: authLoading } = useAuth();
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [subscriptionStatus, setSubscriptionStatus] = useState<SubscriptionStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeSection, setActiveSection] = useState('overview');
  
  // Use the actual logged-in user ID instead of static ID
  const currentUserId = userId;

  // Function to refresh user data
  const refreshUserData = async () => {
    try {
      // Fetch user profile
      if (currentUserId) {
        const profileResponse = await UserApiService.getUserProfile(currentUserId);
        if (profileResponse.success && profileResponse.data?.user) {
          console.log('User profile refreshed:', profileResponse.data.user);
          setUserProfile(profileResponse.data.user);
        }
      }

      // Fetch subscription status
      if (currentUserId) {
        const subscriptionResponse = await StripeService.getSubscriptionStatus(currentUserId);
        console.log('Subscription status refreshed:', subscriptionResponse);
        if (subscriptionResponse.success && subscriptionResponse.data) {
          setSubscriptionStatus(subscriptionResponse.data);
        }
      }
    } catch (err: any) {
      console.error('Failed to refresh user data:', err);
    }
  };

  // Fetch user profile and subscription status
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        setLoading(true);
        setError(null);
        await refreshUserData();
      } catch (err: any) {
        console.error('Failed to fetch user data:', err);
        setError(err.message || 'Failed to load user profile');
        toast.error('Failed to load user profile');
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, []);

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
            
            // Refresh user data to show updated subscription
            await refreshUserData();
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
      router.push(`/`);
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
            
            // Refresh user data
            const profileResponse = await UserApiService.getUserProfile(currentUserId);
            if (profileResponse.success && profileResponse.data?.user) {
              setUserProfile(profileResponse.data.user);
            }
            
           
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
    if (userProfile?.subscription?.trialEnd) {
      const trialEnd = new Date(userProfile.subscription.trialEnd);
      const now = new Date();
      const diffTime = trialEnd.getTime() - now.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return Math.max(0, diffDays);
    }
    if (userProfile?.subscription?.currentPeriodEnd) {
      const periodEnd = new Date(userProfile.subscription.currentPeriodEnd);
      const now = new Date();
      const diffTime = periodEnd.getTime() - now.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return Math.max(0, diffDays);
    }
    return 0;
  };

  // Get current plan name from user profile
  const getCurrentPlan = () => {
    if (userProfile?.subscription?.plan) {
      return userProfile.subscription.plan;
    }
    return "Free"; // Default fallback
  };

  // Get current plan status
  const getCurrentPlanStatus = () => {
    if (userProfile?.subscription?.status) {
      return userProfile.subscription.status;
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
      note: getCurrentPlan() === "Pro Trial" && userProfile?.subscription?.trialEnd 
        ? `Your trial ends on ${new Date(userProfile.subscription.trialEnd).toLocaleDateString()}.` 
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
      note: getCurrentPlan() === "Pro+" && userProfile?.subscription?.currentPeriodEnd 
        ? `Your subscription renews on ${new Date(userProfile.subscription.currentPeriodEnd).toLocaleDateString()}.` 
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
      note: getCurrentPlan() === "Ultra" && userProfile?.subscription?.currentPeriodEnd 
        ? `Your subscription renews on ${new Date(userProfile.subscription.currentPeriodEnd).toLocaleDateString()}.` 
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

  if (loading) {
    return (
      <div className="min-h-screen bg-white dark:bg-gray-700 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-blue-600" />
          <p className="text-gray-600 dark:text-gray-400">Loading your profile...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-white dark:bg-gray-700 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-500 mb-4">⚠️</div>
          <p className="text-gray-600 dark:text-gray-400 mb-4">{error}</p>
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
    <AuthGuard>
      <div className="bg-gray-900">
      {/* Header with back button - no sidebar */}
      <header className="sticky top-0 bg-gray-800/95 z-10 flex h-16 shrink-0 items-center gap-4 border-b border-gray-900 dark:border-gray-700 px-4 md:px-6  dark:bg-gray-800">
        <button
          onClick={handleBackToChat}
          className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-100 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span className="hidden sm:inline">Back to Chat</span>
        </button>
        <h1 className="text-lg font-semibold text-gray-100">Settings</h1>
      </header>

      {/* Main Content - Full Width with Responsive Layout */}
      <div className="flex-1 overflow-auto bg-900/95">
        <div className="max-w-7xl mx-auto p-4 md:p-6 lg:p-8 bg-gray-900/95">
          <div className="flex flex-col lg:flex-row gap-6 lg:gap-8">
            
            {/* Left Sidebar Menu - Responsive */}
            <div className="lg:w-64 lg:flex-shrink-0">
              <div className="bg-gray-50 dark:bg-gray-900 rounded-xl p-4 lg:p-6 border border-gray-200 dark:border-gray-700">
                <div className="mb-6">
                  {/* User Profile Section */}
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold text-lg">
                      {userProfile?.avatar ? (
                        <img src={userProfile.avatar} alt={userProfile.name} className="w-12 h-12 rounded-full" />
                      ) : (
                        userProfile?.name?.charAt(0)?.toUpperCase() || 'U'
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm truncate">{userProfile?.name || 'User'}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{getCurrentPlan()}</p>
                    </div>
                  </div>

                  {/* User Details */}
                  <div className="space-y-2 mb-4">
                    <div className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400">
                      <Mail className="w-3 h-3" />
                      <span className="truncate">{userProfile?.email || 'No email'}</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400">
                      <Calendar className="w-3 h-3" />
                      <span>Member since {userProfile?.createdAt ? new Date(userProfile.createdAt).toLocaleDateString() : 'Unknown'}</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400">
                      <Clock className="w-3 h-3" />
                      <span>Last active {userProfile?.lastActive ? new Date(userProfile.lastActive).toLocaleDateString() : 'Unknown'}</span>
                    </div>
                  </div>

                  {/* Current Plan Status */}
                  {userProfile?.subscription && (
                    <div className={`rounded-lg p-3 mb-4 border ${
                      getCurrentPlanStatus() === 'trial' 
                        ? 'bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800' 
                        : 'bg-green-50 dark:bg-green-950 border-green-200 dark:border-green-800'
                    }`}>
                      <p className={`text-xs font-medium ${
                        getCurrentPlanStatus() === 'trial' 
                          ? 'text-blue-800 dark:text-blue-200' 
                          : 'text-green-800 dark:text-green-200'
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
                          ? 'bg-gray-200 dark:bg-gray-800 text-gray-900 dark:text-gray-100' 
                          : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
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
                    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
                      <h2 className="text-xl font-semibold mb-4">Profile Overview</h2>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <h3 className="font-medium text-gray-900 dark:text-gray-100 mb-3">Personal Information</h3>
                          <div className="space-y-3">
                            <div>
                              <label className="text-sm text-gray-500 dark:text-gray-400">Full Name</label>
                              <p className="text-gray-900 dark:text-gray-100">{userProfile?.name || 'Not set'}</p>
                            </div>
                            <div>
                              <label className="text-sm text-gray-500 dark:text-gray-400">Email</label>
                              <p className="text-gray-900 dark:text-gray-100">{userProfile?.email || 'Not set'}</p>
                            </div>
                            <div>
                              <label className="text-sm text-gray-500 dark:text-gray-400">Username</label>
                              <p className="text-gray-900 dark:text-gray-100">{userProfile?.username || 'Not set'}</p>
                            </div>
                          </div>
                        </div>
                        <div>
                          <h3 className="font-medium text-gray-900 dark:text-gray-100 mb-3">Preferences</h3>
                          <div className="space-y-3">
                            <div>
                              <label className="text-sm text-gray-500 dark:text-gray-400">Theme</label>
                              <p className="text-gray-900 dark:text-gray-100 capitalize">{userProfile?.preferences?.theme || 'Not set'}</p>
                            </div>
                            <div>
                              <label className="text-sm text-gray-500 dark:text-gray-400">Language</label>
                              <p className="text-gray-900 dark:text-gray-100">{userProfile?.preferences?.language || 'Not set'}</p>
                            </div>
                            <div>
                              <label className="text-sm text-gray-500 dark:text-gray-400">AI Model</label>
                              <p className="text-gray-900 dark:text-gray-100">{userProfile?.preferences?.aiModel || 'Not set'}</p>
                            </div>
                            <div>
                              <label className="text-sm text-gray-500 dark:text-gray-400">Conversation Style</label>
                              <p className="text-gray-900 dark:text-gray-100 capitalize">{userProfile?.preferences?.conversationStyle || 'Not set'}</p>
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      {/* Subscription Information */}
                      {userProfile?.subscription && (
                        <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
                          <h3 className="font-medium text-gray-900 dark:text-gray-100 mb-3">Subscription Information</h3>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                              <div className="space-y-3">
                                <div>
                                  <label className="text-sm text-gray-500 dark:text-gray-400">Current Plan</label>
                                  <p className="text-gray-900 dark:text-gray-100 font-medium">{userProfile.subscription.plan}</p>
                                </div>
                                <div>
                                  <label className="text-sm text-gray-500 dark:text-gray-400">Status</label>
                                  <p className="text-gray-900 dark:text-gray-100 capitalize">{userProfile.subscription.status}</p>
                                </div>
                              </div>
                            </div>
                            <div>
                              <div className="space-y-3">
                                <div>
                                  <label className="text-sm text-gray-500 dark:text-gray-400">Subscribed On</label>
                                  <p className="text-gray-900 dark:text-gray-100">
                                    {userProfile.subscription.subscribedAt ? new Date(userProfile.subscription.subscribedAt).toLocaleDateString() : 'Not available'}
                                  </p>
                                </div>
                                {userProfile.subscription.trialEnd && (
                                  <div>
                                    <label className="text-sm text-gray-500 dark:text-gray-400">Trial Ends</label>
                                    <p className="text-gray-900 dark:text-gray-100">
                                      {new Date(userProfile.subscription.trialEnd).toLocaleDateString()}
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
                    <div className="bg-gray-50 dark:bg-gray-900 rounded-xl p-4 md:p-6 border border-gray-200 dark:border-gray-700">
                      <h3 className="text-lg font-semibold mb-2">Invite Team Members</h3>
                      <p className="text-gray-600 dark:text-gray-400 text-sm mb-4">
                        Accelerate your team with admin controls, analytics, and enterprise-grade security.
                      </p>
                      <button className="bg-gray-800 dark:bg-gray-700 hover:bg-gray-900 dark:hover:bg-gray-600 text-white px-4 py-2 rounded-lg font-medium transition-colors">
                        Invite Your Team
                      </button>
                    </div>
                  </>
                )}

                {/* Subscriptions Section */}
                {activeSection === 'subscriptions' && (
                  <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h2 className="text-xl font-semibold">Subscriptions</h2>
                      <button
                        onClick={refreshUserData}
                        className="flex items-center gap-2 px-3 py-2 text-sm bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                        </svg>
                        Refresh
                      </button>
                    </div>
                    
                    {/* Current Plan Summary */}
                    {userProfile?.subscription && (
                      <div className="mb-6 p-4 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950 dark:to-purple-950 border border-blue-200 dark:border-blue-800 rounded-lg">
                        <div className="flex items-center justify-between">
                          <div>
                            <h3 className="font-semibold text-lg text-gray-900 dark:text-gray-100">
                              Current Plan: {userProfile.subscription.plan}
                            </h3>
                            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                              Status: <span className="capitalize font-medium">{userProfile.subscription.status}</span>
                              {getDaysLeft() > 0 && (
                                <span className="ml-2">
                                  • {getDaysLeft()} days remaining
                                </span>
                              )}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                              Subscribed on {userProfile.subscription.subscribedAt ? new Date(userProfile.subscription.subscribedAt).toLocaleDateString() : 'Unknown'}
                            </p>
                            {userProfile.subscription.trialEnd && (
                              <p className="text-sm text-blue-600 dark:text-blue-400 font-medium">
                                Trial ends: {new Date(userProfile.subscription.trialEnd).toLocaleDateString()}
                              </p>
                            )}
                            {userProfile.subscription.currentPeriodEnd && (
                              <p className="text-sm text-green-600 dark:text-green-400 font-medium">
                                Renews: {new Date(userProfile.subscription.currentPeriodEnd).toLocaleDateString()}
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
                          ? 'border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-950' 
                          : plan.disabled
                          ? 'border-gray-300 bg-gray-100 dark:border-gray-600 dark:bg-gray-800 opacity-75'
                          : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800'
                      }`}
                    >
                      {/* Disabled Plan Overlay */}
                      {plan.disabled && (
                        <div className="absolute inset-0 bg-gray-200 dark:bg-gray-700 bg-opacity-50 dark:bg-opacity-50 rounded-xl flex items-center justify-center">
                          <div className="text-center">
                            <div className="text-gray-500 dark:text-gray-400 text-sm font-medium mb-1">
                              Plan Unavailable
                            </div>
                            <div className="text-gray-400 dark:text-gray-500 text-xs">
                              You have a higher-tier plan
                            </div>
                          </div>
                        </div>
                      )}
                      
                      <div className="flex items-center gap-2 mb-4">
                        {plan.icon}
                        <h3 className="text-lg font-semibold">{plan.name}</h3>
                        {plan.daysLeft && plan.daysLeft > 0 && (
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
                  <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
                    <h2 className="text-xl font-semibold mb-4">Integrations</h2>
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
                )}

                {/* Other sections can be added here */}
                {activeSection !== 'overview' && activeSection !== 'subscriptions' && activeSection !== 'integrations' && (
                  <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
                    <h2 className="text-xl font-semibold mb-4">{settingsMenuItems.find(item => item.section === activeSection)?.label || 'Section'}</h2>
                    <p className="text-gray-600 dark:text-gray-400">This section is coming soon.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
    </AuthGuard>
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
