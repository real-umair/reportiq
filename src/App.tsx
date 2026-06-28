import React, { useState, useEffect } from "react";
import { supabase, supabaseAuth, supabaseDb, getAuthHeaders } from "./lib/supabase";
import { Profile, Client, Report, Integration } from "./types";
import {
  FileText,
  LayoutDashboard,
  Users,
  ClipboardList,
  Plug,
  Settings as SettingsIcon,
  LogOut,
  Mail,
  Lock,
  User,
  Building,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  ShieldAlert,
  Check,
  Building2,
  Globe,
  Plus,
  Compass,
  X,
  Calendar
} from "lucide-react";

// Modular components import
import PublicReport from "./components/PublicReport";
import Dashboard from "./components/Dashboard";
import Clients from "./components/Clients";
import Reports from "./components/Reports";
import Settings from "./components/Settings";
import ClientPortal from "./components/ClientPortal";

// Free Tools component imports
import ToolsHome from "./components/tools/ToolsHome";
import ToolClientReport from "./components/tools/ToolClientReport";
import ToolAgencyReport from "./components/tools/ToolAgencyReport";
import ToolSeoReport from "./components/tools/ToolSeoReport";
import ToolClientEmail from "./components/tools/ToolClientEmail";
import ToolMonthlyReport from "./components/tools/ToolMonthlyReport";
import ToolKpiReport from "./components/tools/ToolKpiReport";
import ToolSocialMedia from "./components/tools/ToolSocialMedia";
import ToolInvoice from "./components/tools/ToolInvoice";
import ToolProjectStatus from "./components/tools/ToolProjectStatus";
import ToolOnboarding from "./components/tools/ToolOnboarding";
import ToolCompetitorAnalysis from "./components/tools/ToolCompetitorAnalysis";
import ToolWeeklyReport from "./components/tools/ToolWeeklyReport";
import ToolPpcReport from "./components/tools/ToolPpcReport";
import ToolScopeOfWork from "./components/tools/ToolScopeOfWork";
import ToolPostMortem from "./components/tools/ToolPostMortem";
import ToolOnboardingQuestionnaire from "./components/tools/ToolOnboardingQuestionnaire";

// Blog component imports
import BlogHome from "./components/blog/BlogHome";
import BlogPost from "./components/blog/BlogPost";
import BlogAdmin from "./components/blog/BlogAdmin";

const ALL_TOOLS = [
  { name: 'Client Report Generator', desc: 'Generate a professional client report instantly with AI.', route: '/tools/client-report-generator', category: 'reports' },
  { name: 'Agency Report Template', desc: 'Create professional agency reports in seconds with executive summaries.', route: '/tools/agency-report-template', category: 'reports' },
  { name: 'SEO Report Generator', desc: 'Generate professional SEO performance reports targeting search keywords.', route: '/tools/seo-report-generator', category: 'seo' },
  { name: 'Client Update Email Writer', desc: 'Draft professional, encouraging client update emails detailing accomplishments.', route: '/tools/client-update-email', category: 'emails' },
  { name: 'Monthly Report Template', desc: 'Produce high-quality monthly progress reports for your business.', route: '/tools/monthly-report-template', category: 'reports' },
  { name: 'KPI Report Generator', desc: 'Compile detailed KPI summary reports containing key metric analyses.', route: '/tools/kpi-report-generator', category: 'reports' },
  { name: 'Social Media Report Generator', desc: 'Analyze social channel performance and generate breakdown summaries.', route: '/tools/social-media-report', category: 'social' },
  { name: 'Invoice Description Writer', desc: 'Write professional descriptions for invoice line items.', route: '/tools/invoice-description-writer', category: 'finance' },
  { name: 'Project Status Report Writer', desc: 'Track project health, bottlenecks, and planned milestones.', route: '/tools/project-status-report', category: 'reports' },
  { name: 'Client Onboarding Email Writer', desc: 'Draft warm client onboarding emails welcoming new customers.', route: '/tools/client-onboarding-email', category: 'emails' },
  { name: 'Competitor Analysis Generator', desc: 'Create competitor analysis summaries to compare market positioning.', route: '/tools/competitor-analysis-generator', category: 'seo' },
  { name: 'Weekly Progress Report Generator', desc: 'Create weekly project progress updates detailing accomplishments.', route: '/tools/weekly-report-generator', category: 'reports' },
  { name: 'PPC Ads Performance Report Writer', desc: 'Compile conversion, ROAS, CPA, and click metrics for advertising reports.', route: '/tools/ppc-performance-report', category: 'ads' },
  { name: 'Scope of Work (SOW) Generator', desc: 'Draft comprehensive project SOW outlines specifying deliverables.', route: '/tools/scope-of-work-generator', category: 'contracts' },
  { name: 'Project Post-Mortem Debrief Writer', desc: 'Run retrospectives and highlight successes, bottlenecks, and learnings.', route: '/tools/project-post-mortem-generator', category: 'management' },
  { name: 'Client Onboarding Checklist Writer', desc: 'Generate onboarding questionnaires to align project kickoff requirements.', route: '/tools/onboarding-questionnaire-generator', category: 'onboarding' }
];

export default function App() {
  // Public shareable link detection routing
  const [publicSlug, setPublicSlug] = useState<string | null>(() => {
    const path = window.location.pathname;
    const match = path.match(/^\/r\/([a-zA-Z0-9_-]+)/) || path.match(/^\/a\/[a-zA-Z0-9_-]+\/r\/([a-zA-Z0-9_-]+)/);
    return match ? match[1] : null;
  });
  
  // Client portal route detection routing
  const [isClientPortal, setIsClientPortal] = useState(() => {
    const path = window.location.pathname;
    return path === "/portal" || path.startsWith("/portal/");
  });

  // Tools route detection routing
  const [activeToolRoute, setActiveToolRoute] = useState<string | null>(() => {
    const path = window.location.pathname;
    return (path === "/tools" || path.startsWith("/tools/")) ? path : null;
  });

  // Blog route detection routing
  const [activeBlogRoute, setActiveBlogRoute] = useState<string | null>(() => {
    const path = window.location.pathname;
    if (path === "/blog" || path.startsWith("/blog/")) return path;
    return null;
  });

  const [activeLandingFaq, setActiveLandingFaq] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  // Lock modal state
  const [lockModal, setLockModal] = useState<{
    isOpen: boolean;
    featureName: string;
    unlockPlan: "Starter" | "Pro";
    price: string;
  }>({
    isOpen: false,
    featureName: "",
    unlockPlan: "Starter",
    price: "",
  });

  const showLock = (feature: string, plan: "Starter" | "Pro", price: string) => {
    setLockModal({
      isOpen: true,
      featureName: feature,
      unlockPlan: plan,
      price: price
    });
  };

  const triggerUpgrade = async (targetPlan: "starter" | "pro") => {
    if (profile?.email === "farooquiumair18@gmail.com") {
      try {
        if (!user) throw new Error("No active user session found.");
        await supabaseDb.updateProfile(user.id, {
          plan: targetPlan,
        });
        alert(`Admin plan successfully updated to ${targetPlan}!`);
        setPaymentBanner({ type: "success", plan: targetPlan });
        await loadUserProfile(user.id);
        setActiveTab("settings");
      } catch (err: any) {
        alert("Upgrade failed: " + err.message);
      }
      return;
    }

    try {
      const authHeaders = await getAuthHeaders();
      const response = await fetch("/api/billing/checkout", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          ...authHeaders
        },
        body: JSON.stringify({ 
          productId: targetPlan, 
          email: profile?.email || "",
          paymentType: billingCycle
        }),
      });
      if (!response.ok) throw new Error("Failed to contact checkout billing endpoint.");
      const data = await response.json();
      if (data.checkoutUrl) {
        window.location.href = data.checkoutUrl;
      } else {
        throw new Error("No valid checkout URL returned.");
      }
    } catch (err: any) {
      alert("Upgrade failed: " + err.message);
    }
  };

  const handleLockUpgrade = async () => {
    const targetPlan = lockModal.unlockPlan.toLowerCase() as "starter" | "pro";
    setLockModal(prev => ({ ...prev, isOpen: false }));
    await triggerUpgrade(targetPlan);
  };

  // Support AI Chat states
  const [chatOpen, setChatOpen] = useState(false);
  const [chatInput, setChatInput] = useState("");
  const [chatMessages, setChatMessages] = useState<{ role: "user" | "assistant"; content: string }[]>([
    { role: "assistant", content: "Hello! How can I help you with ReportIQ today?" }
  ]);
  const [chatSending, setChatSending] = useState(false);

  const handleSendChatMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    const text = chatInput.trim();
    if (!text || chatSending) return;

    const userMessage = { role: "user" as const, content: text };
    setChatMessages(prev => [...prev, userMessage]);
    setChatInput("");
    setChatSending(true);

    const lowerText = text.toLowerCase();
    const isRecommendation = 
      lowerText.includes("recommendation") || 
      lowerText.includes("recommend") || 
      lowerText.includes("suggestion") || 
      lowerText.includes("suggest") || 
      lowerText.includes("feedback") || 
      lowerText.includes("feature request");

    const isEscalation = 
      lowerText.includes("complaint") || 
      lowerText.includes("escalate") || 
      lowerText.includes("contact support") || 
      lowerText.includes("contacting support") || 
      lowerText.includes("support team") || 
      lowerText.includes("not solved") || 
      lowerText.includes("cannot be solved") || 
      lowerText.includes("can't solve") || 
      lowerText.includes("representative") || 
      lowerText.includes("human support") ||
      lowerText.includes("human");

    if (isEscalation) {
      const subject = "ReportIQ Support Complaint Request";
      const bodyText = `From: ${profile?.fullName || 'User'} (${profile?.email || user?.email || 'User Email'})\n\nHi ReportIQ Support Team,\n\nI would like to file a complaint regarding the following issue:\n\n${text}\n\nBest regards,`;
      const url = `https://mail.google.com/mail/?view=cm&fs=1&to=support@reportiq.xyz&su=${encodeURIComponent(subject)}&body=${encodeURIComponent(bodyText)}`;
      window.open(url, "_blank");
      setChatMessages(prev => [
        ...prev,
        { 
          role: "assistant", 
          content: `✓ Opened Gmail in a new tab to file your complaint to support@reportiq.xyz. Please check the new tab, adjust any details, and click 'Send'.` 
        }
      ]);
      setChatSending(false);
      return;
    }

    if (isRecommendation) {
      const subject = "ReportIQ Support Recommendation Request";
      const bodyText = `From: ${profile?.fullName || 'User'} (${profile?.email || user?.email || 'User Email'})\n\nHi ReportIQ Support Team,\n\nI would like to suggest the following recommendation/feedback:\n\n${text}\n\nBest regards,`;
      const url = `https://mail.google.com/mail/?view=cm&fs=1&to=support@reportiq.xyz&su=${encodeURIComponent(subject)}&body=${encodeURIComponent(bodyText)}`;
      window.open(url, "_blank");
      setChatMessages(prev => [
        ...prev,
        { 
          role: "assistant", 
          content: `✓ Opened Gmail in a new tab to submit your recommendation to support@reportiq.xyz. Please check the new tab, adjust any details, and click 'Send'.` 
        }
      ]);
      setChatSending(false);
      return;
    }

    try {
      const history = chatMessages.concat(userMessage);
      const response = await fetch("/api/support/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: history })
      });
      if (!response.ok) throw new Error("Chat assistant currently offline.");
      const data = await response.json();
      if (data.message) {
        setChatMessages(prev => [...prev, data.message]);
      } else {
        throw new Error("Invalid reply from support AI.");
      }
    } catch (err: any) {
      setChatMessages(prev => [...prev, { role: "assistant", content: "Sorry, I am having trouble connecting. " + err.message }]);
    } finally {
      setChatSending(false);
    }
  };

  // Auth states
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [authLoading, setAuthLoading] = useState(true);

  // Forms states
  const [showAuthForm, setShowAuthForm] = useState<"login" | "signup" | "forgot" | null>(null);
  const [isResetPassword, setIsResetPassword] = useState(() => {
    return window.location.pathname === "/reset-password";
  });
  const [selectedPlan, setSelectedPlan] = useState<"free" | "starter" | "pro">("free");
  const [authEmail, setAuthEmail] = useState("");
  const [authPassword, setAuthPassword] = useState("");
  const [authFullName, setAuthFullName] = useState("");
  const [authAgencyName, setAuthAgencyName] = useState("");
  const [authError, setAuthError] = useState<string | null>(null);
  const [authSubmitting, setAuthSubmitting] = useState(false);
  const [signupSuccess, setSignupSuccess] = useState(false);
  const [resending, setResending] = useState(false);
  const [resendMessage, setResendMessage] = useState<string | null>(null);

  // Active section tab views
  const [activeTab, setActiveTab] = useState<string>(() => {
    const path = window.location.pathname;
    if (path.startsWith("/reports")) return "reports";
    if (path.startsWith("/clients")) return "clients";
    if (path.startsWith("/settings")) return "settings";
    if (path === "/admin/blog") return "blog";
    return "dashboard";
  });
  const [selectedReportId, setSelectedReportId] = useState<string | null>(() => {
    const path = window.location.pathname;
    const match = path.match(/^\/reports\/([a-zA-Z0-9_-]+)/);
    return match ? match[1] : null;
  });

  // Supabase sync data states
  const [clients, setClients] = useState<Client[]>([]);
  const [reports, setReports] = useState<Report[]>([]);
  const [integrations, setIntegrations] = useState<Integration[]>([]);
  const [dataLoading, setDataLoading] = useState(false);
  const [workspaceOwnerId, setWorkspaceOwnerId] = useState<string>("");
  const [teamRole, setTeamRole] = useState<'owner' | 'viewer' | 'editor' | 'admin'>("owner");

  // Marketing pages states
  const [activeMarketingPage, setActiveMarketingPage] = useState<"about" | "contact" | "privacy" | "terms" | "docs" | null>(() => {
    const path = window.location.pathname;
    if (path === "/about") return "about";
    if (path === "/contact") return "contact";
    if (path === "/privacy") return "privacy";
    if (path === "/terms") return "terms";
    return null;
  });
  const [contactSubmitting, setContactSubmitting] = useState(false);
  const [contactSuccess, setContactSuccess] = useState(false);
  const [paymentBanner, setPaymentBanner] = useState<{ type: "success" | "cancel"; plan: string } | null>(null);
  const [docsActiveTab, setDocsActiveTab] = useState<"guide" | "plans" | "faq">("guide");
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(null);
  const [showStickyCta, setShowStickyCta] = useState(false);
  const [billingCycle, setBillingCycle] = useState<"monthly" | "lifetime">("monthly");

  // Global event listener to open login/signup modals from page components
  useEffect(() => {
    const handleOpenAuth = (e: Event) => {
      const customEvent = e as CustomEvent;
      setAuthError(null);
      if (customEvent.detail) {
        if (typeof customEvent.detail === "string") {
          setShowAuthForm(customEvent.detail as any);
        } else {
          if (customEvent.detail.email) {
            setAuthEmail(customEvent.detail.email);
          }
          setShowAuthForm(customEvent.detail.mode || "signup");
        }
      } else {
        setShowAuthForm("signup");
      }
    };
    window.addEventListener("open-auth", handleOpenAuth);
    return () => window.removeEventListener("open-auth", handleOpenAuth);
  }, []);

  // Track scroll depth and localStorage check for sticky CTA
  useEffect(() => {
    const dismissedAt = localStorage.getItem("sticky-cta-dismissed-at");
    if (dismissedAt) {
      const hoursSinceDismiss = (Date.now() - parseInt(dismissedAt, 10)) / (1000 * 60 * 60);
      if (hoursSinceDismiss < 24) return;
    }

    const handleScroll = () => {
      const scrollTop = window.scrollY || document.documentElement.scrollTop;
      const docHeight = document.documentElement.scrollHeight - document.documentElement.clientHeight;
      if (docHeight <= 0) return;
      const scrollPercent = (scrollTop / docHeight) * 100;

      if (scrollPercent >= 30) {
        setShowStickyCta(true);
      } else {
        setShowStickyCta(false);
      }
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleDismissSticky = () => {
    localStorage.setItem("sticky-cta-dismissed-at", Date.now().toString());
    setShowStickyCta(false);
  };

  // Sync state transitions back to the browser's address bar
  useEffect(() => {
    if (publicSlug || isClientPortal || isResetPassword || activeToolRoute || activeBlogRoute) return;

    let path = "/";
    if (!user) {
      if (activeMarketingPage === "about") path = "/about";
      else if (activeMarketingPage === "features") path = "/features";
      else if (activeMarketingPage === "contact") path = "/contact";
      else if (activeMarketingPage === "privacy") path = "/privacy";
      else if (activeMarketingPage === "terms") path = "/terms";
    } else {
      if (activeTab === "reports") {
        path = selectedReportId ? `/reports/${selectedReportId}` : "/reports";
      } else if (activeTab === "clients") {
        path = "/clients";
      } else if (activeTab === "settings") {
        path = "/settings";
      } else if (activeTab === "blog") {
        path = "/admin/blog";
      } else if (activeTab === "dashboard") {
        path = "/";
      }
    }

    if (window.location.pathname !== path) {
      window.history.pushState(null, "", path);
    }
  }, [activeTab, selectedReportId, publicSlug, isClientPortal, isResetPassword, user, activeMarketingPage, activeBlogRoute]);

  // Dynamic canonical link update on route transitions
  useEffect(() => {
    const link: HTMLLinkElement | null = document.querySelector("link[rel='canonical']");
    const canonicalUrl = window.location.origin + window.location.pathname;
    if (link) {
      link.setAttribute("href", canonicalUrl);
    } else {
      const newLink = document.createElement("link");
      newLink.setAttribute("rel", "canonical");
      newLink.setAttribute("href", canonicalUrl);
      document.head.appendChild(newLink);
    }
  }, [publicSlug, isClientPortal, activeToolRoute, activeBlogRoute, activeMarketingPage, activeTab, selectedReportId]);

  // Handle browser back/forward buttons (popstate)
  useEffect(() => {
    const handlePopState = () => {
      const path = window.location.pathname;
      
      if (path === "/tools" || path.startsWith("/tools/")) {
        setActiveToolRoute(path);
        setPublicSlug(null);
        setIsClientPortal(false);
        setActiveMarketingPage(null);
        setActiveBlogRoute(null);
        return;
      } else {
        setActiveToolRoute(null);
      }

      if (path === "/blog" || path.startsWith("/blog/")) {
        setActiveBlogRoute(path);
        setPublicSlug(null);
        setIsClientPortal(false);
        setActiveMarketingPage(null);
        setActiveToolRoute(null);
        return;
      } else {
        setActiveBlogRoute(null);
      }

      if (path === "/admin/blog") {
        setActiveTab("blog");
        setPublicSlug(null);
        setIsClientPortal(false);
        setActiveMarketingPage(null);
        setActiveToolRoute(null);
        return;
      }

      const rMatch = path.match(/^\/r\/([a-zA-Z0-9_-]+)/);
      if (rMatch) {
        setPublicSlug(rMatch[1]);
        return;
      } else {
        setPublicSlug(null);
      }

      if (path === "/portal" || path.startsWith("/portal/")) {
        setIsClientPortal(true);
        return;
      } else {
        setIsClientPortal(false);
      }

      if (path === "/about") {
        setActiveMarketingPage("about");
      } else if (path === "/features") {
        setActiveMarketingPage("features");
      } else if (path === "/contact") {
        setActiveMarketingPage("contact");
      } else if (path === "/privacy") {
        setActiveMarketingPage("privacy");
      } else if (path === "/terms") {
        setActiveMarketingPage("terms");
      } else {
        setActiveMarketingPage(null);
      }

      if (path.startsWith("/reports")) {
        setActiveTab("reports");
        const reportMatch = path.match(/^\/reports\/([a-zA-Z0-9_-]+)/);
        setSelectedReportId(reportMatch ? reportMatch[1] : null);
      } else if (path === "/clients") {
        setActiveTab("clients");
        setSelectedReportId(null);
      } else if (path === "/settings") {
        setActiveTab("settings");
        setSelectedReportId(null);
      } else {
        setActiveTab("dashboard");
        setSelectedReportId(null);
      }
    };

    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  // Sync auth updates
  useEffect(() => {
    const unsubscribe = supabaseAuth.onAuthStateChange(async currentUser => {
      setUser(currentUser);
      if (currentUser) {
        await loadUserProfile(currentUser.id);
      } else {
        setProfile(null);
      }
      setAuthLoading(false);
    });
    return unsubscribe;
  }, []);

  // Trigger loads when user changes
  useEffect(() => {
    if (user) {
      loadApplicationData();
    } else {
      setClients([]);
      setReports([]);
      setIntegrations([]);
    }
  }, [user]);

  // Handle Polar post-payment redirect callbacks
  useEffect(() => {
    if (!user) return;
    
    const params = new URLSearchParams(window.location.search);
    const success = params.get("payment_success") === "true";
    const cancel = params.get("payment_cancel") === "true";
    const planChoice = params.get("plan_choice") as "starter" | "pro";

    if (success && planChoice) {
      console.log(`[Billing Callback] Payment Success detected. Activating plan: ${planChoice} for User ID: ${user.id}...`);
      
      const activatePlanInstance = async () => {
        try {
          await supabaseDb.updateProfile(user.id, {
            plan: planChoice,
          });

          // Show elegant success notification toast
          setPaymentBanner({ type: "success", plan: planChoice });
          
          // Refresh user profile in React layout
          await loadUserProfile(user.id);
          
          // Go to settings tab
          setActiveTab("settings");

          // Clear parameters to clean up URL
          const newUrl = window.location.pathname;
          window.history.replaceState({}, document.title, newUrl);
        } catch (e) {
          console.error("Failed to activate plan after successful checkout:", e);
        }
      };
      activatePlanInstance();
    } else if (cancel && planChoice) {
      console.log(`[Billing Callback] Payment Cancelled detected for plan: ${planChoice}`);
      
      // Show elegant cancellation alert banner
      setPaymentBanner({ type: "cancel", plan: planChoice });
      
      // Go to settings tab
      setActiveTab("settings");

      // Clear params to clean up URL
      const newUrl = window.location.pathname;
      window.history.replaceState({}, document.title, newUrl);
    }
  }, [user]);

  async function loadUserProfile(uid: string) {
    try {
      const dbProfile = await supabaseDb.getProfile(uid);
      if (dbProfile) {
        setProfile(dbProfile);
      } else {
        console.warn("Profile document not available under profiles table.");
      }
    } catch (err: any) {
      console.error("Failed to load user profile:", err);
    }
  }

  // Load database directories
  async function loadApplicationData() {
    if (!user) return;
    const uid = user.id;

    try {
      setDataLoading(true);

      // Get team context
      const context = await supabaseDb.getTeamContext(uid);
      setWorkspaceOwnerId(context.ownerId);
      setTeamRole(context.role);

      const ownerId = context.ownerId;

      // 1. Load clients
      const loadedClients = await supabaseDb.getClients(ownerId);
      setClients(loadedClients);

      // 2. Load reports
      const loadedReports = await supabaseDb.getReports(ownerId);
      setReports(loadedReports);

      // 3. Load integrations
      setIntegrations([]);

    } catch (err: any) {
      console.error("Database loading error sync failed:", err);
    } finally {
      setDataLoading(false);
    }
  }

  // Reload action callbacks
  const handleReloadData = () => {
    if (user) {
      loadUserProfile(user.id);
      loadApplicationData();
    }
  };

  // Resend Supabase signup email confirmation helper
  const handleResendConfirmation = async () => {
    if (!authEmail.trim()) {
      setAuthError("Please enter your email address to resend the confirmation link.");
      return;
    }
    setResending(true);
    setResendMessage(null);
    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: authEmail.trim(),
      });
      if (error) throw error;
      setResendMessage("Verification email resent!");
      setTimeout(() => setResendMessage(null), 5000);
    } catch (err: any) {
      console.error("Resend confirmation failure:", err);
      setAuthError(err?.message || "Failed to resend confirmation email.");
    } finally {
      setResending(false);
    }
  };

  // Trigger login auth form submission
  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    setAuthSubmitting(true);

    const emailInput = authEmail.trim();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailInput) {
      setAuthError("Email address is required.");
      setAuthSubmitting(false);
      return;
    }

    if (!emailRegex.test(emailInput)) {
      setAuthError("Please enter a valid email address (e.g., name@example.com).");
      setAuthSubmitting(false);
      return;
    }

    if (showAuthForm !== "forgot" && !authPassword.trim()) {
      setAuthError("Password is required.");
      setAuthSubmitting(false);
      return;
    }

    try {
      if (showAuthForm === "forgot") {
        const { error } = await supabase.auth.resetPasswordForEmail(emailInput, {
          redirectTo: `${window.location.origin}/reset-password`
        });
        if (error) throw error;
        alert("Password reset email sent! Please check your inbox.");
        setAuthEmail("");
        setShowAuthForm("login");
        return;
      }

      if (showAuthForm === "signup") {
        if (!authAgencyName.trim()) {
          setAuthError("All fields are required for sign up.");
          setAuthSubmitting(false);
          return;
        }

        const newUser = await supabaseAuth.signUp(
          emailInput,
          authPassword,
          authFullName.trim(),
          authAgencyName.trim(),
          "free"
        );

        setSignupSuccess(true);
        setAuthError(null);
        // Do not close the dialog or empty inputs immediately so they know what happened,
        // or clear inputs except email for easy login later
        setAuthPassword("");
        setAuthFullName("");
        setAuthAgencyName("");
        return; // Avoid closing dialog
      } else {
        const loggedInUser = await supabaseAuth.signIn(emailInput, authPassword);
        setUser(loggedInUser);
        
        // Load their profile
        const dbProfile = await supabaseDb.getProfile(loggedInUser.id);
        if (dbProfile) {
          setProfile(dbProfile);
        }
      }

      // Close auth dialog and reset inputs
      setAuthEmail("");
      setAuthPassword("");
      setAuthFullName("");
      setAuthAgencyName("");
      setShowAuthForm(null);
    } catch (err: any) {
      console.error("Authentication execution failure:", err);
      let errMsg = err?.message || "Verify your credentials and try again.";
      const lowerMsg = errMsg.toLowerCase();
      
      if (lowerMsg.includes("email not confirmed")) {
        errMsg = "Please check your inbox for a confirmation email from Supabase and click the link before signing in";
      } else if (lowerMsg.includes("rate limit") || lowerMsg.includes("email rate limit") || lowerMsg.includes("too many requests")) {
        errMsg = "Registration rate limit exceeded. Supabase limits outgoing verification emails to protect against abuse. Please wait a few minutes before trying again. Tip: You can turn off 'Confirm email' under Supabase -> Authentication -> Providers -> Email in your Supabase dashboard to allow instant signs-up during development without sending verification links.";
      } else if (lowerMsg.includes("invalid login credentials") || lowerMsg.includes("invalid credentials")) {
        errMsg = "Invalid login credentials. Please check your email and password, or create a new account if you haven't registered yet.";
      }
      setAuthError(errMsg);
    } finally {
      setAuthSubmitting(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await supabaseAuth.signOut();
    } catch (err) {
      console.warn("Auth signOut call error handled gracefully:", err);
    }
    setProfile(null);
    setUser(null);
    setActiveTab("dashboard");
    setSelectedReportId(null);
    window.location.href = "/";
  };

  // If reset password routing matches
  if (isResetPassword) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6">
        <div className="w-full max-w-md bg-white border border-slate-200 rounded-2xl p-8 shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <FileText className="w-5 h-5 text-indigo-600" />
            <h3 className="text-lg font-bold font-display text-slate-950">Reset Password</h3>
          </div>
          <p className="text-xs text-slate-500 mb-6 font-sans">
            Enter your new password to regain access to your ReportIQ account.
          </p>
          <ResetPasswordForm onComplete={() => {
            setIsResetPassword(false);
            window.history.pushState(null, "", "/");
            setShowAuthForm("login");
          }} />
        </div>
      </div>
    );
  }

  // If public reports URL matches
  if (publicSlug) {
    return <PublicReport slug={publicSlug} />;
  }

  if (isClientPortal) {
    return <ClientPortal />;
  }

  if (authLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6">
        <div className="flex flex-col items-center space-y-3">
          <div className="w-10 h-10 rounded-full border-4 border-indigo-600 border-t-transparent animate-spin"></div>
          <p className="text-slate-400 font-mono text-[10px] uppercase tracking-widest animate-pulse">
            Authenticating Platform Keys...
          </p>
        </div>
      </div>
    );
  }

  if (activeBlogRoute) {
    let blogComponent = <BlogHome />;
    if (activeBlogRoute === "/admin/blog") {
      blogComponent = <BlogAdmin />;
    } else if (activeBlogRoute.startsWith("/blog/")) {
      blogComponent = <BlogPost />;
    }

    return (
      <div className="min-h-screen bg-slate-50 flex flex-col font-sans text-slate-700 animate-fade-in">
        <header className="bg-white/80 backdrop-blur-md border-b border-slate-200 sticky top-0 z-40 px-6 sm:px-12 py-4">
          <div className="max-w-6xl mx-auto flex items-center justify-between">
            <a 
              href="/"
              className="flex items-center gap-2 cursor-pointer select-none no-underline"
              onClick={(e) => {
                e.preventDefault();
                setActiveBlogRoute(null);
                setActiveToolRoute(null);
                setActiveMarketingPage(null);
                window.history.pushState(null, "", "/");
                window.dispatchEvent(new PopStateEvent('popstate'));
              }}
            >
              <div className="w-9 h-9 bg-indigo-600 rounded-xl flex items-center justify-center text-white shadow-sm shadow-indigo-200 shrink-0">
                <FileText className="w-5 h-5" />
              </div>
              <span className="font-extrabold font-display text-slate-950 tracking-tight text-lg">
                ReportIQ
              </span>
            </a>

            <div className="hidden md:flex items-center gap-6">
              <a
                href="/features"
                onClick={(e) => {
                  e.preventDefault();
                  setActiveMarketingPage("features");
                  window.history.pushState(null, "", "/features");
                  window.dispatchEvent(new PopStateEvent('popstate'));
                }}
                className="text-xs font-semibold text-slate-600 hover:text-indigo-600 transition-colors cursor-pointer no-underline"
              >
                Features
              </a>
              <a
                href="/about"
                onClick={(e) => {
                  e.preventDefault();
                  setActiveMarketingPage("about");
                  window.history.pushState(null, "", "/about");
                  window.dispatchEvent(new PopStateEvent('popstate'));
                }}
                className="text-xs font-semibold text-slate-600 hover:text-indigo-600 transition-colors cursor-pointer no-underline"
              >
                About
              </a>
              <a
                href="/contact"
                onClick={(e) => {
                  e.preventDefault();
                  setContactSuccess(false);
                  setActiveMarketingPage("contact");
                  window.history.pushState(null, "", "/contact");
                  window.dispatchEvent(new PopStateEvent('popstate'));
                }}
                className="text-xs font-semibold text-slate-600 hover:text-indigo-600 transition-colors cursor-pointer no-underline"
              >
                Contact
              </a>
              <a
                href="/docs"
                onClick={(e) => {
                  e.preventDefault();
                  setDocsActiveTab("guide");
                  setOpenFaqIndex(null);
                  setActiveMarketingPage("docs");
                  window.history.pushState(null, "", "/docs");
                  window.dispatchEvent(new PopStateEvent('popstate'));
                }}
                className="text-xs font-semibold text-slate-600 hover:text-indigo-600 transition-colors cursor-pointer no-underline"
              >
                Docs
              </a>
              <a
                href="/portal"
                onClick={(e) => {
                  e.preventDefault();
                  setIsClientPortal(true);
                  window.history.pushState(null, "", "/portal");
                  window.dispatchEvent(new PopStateEvent('popstate'));
                }}
                className="text-xs font-bold text-indigo-600 hover:text-indigo-755 transition-colors cursor-pointer flex items-center gap-1 no-underline"
              >
                <Globe className="w-3 h-3" />
                Client Portal
              </a>
              <a
                href="/tools"
                onClick={(e) => {
                  e.preventDefault();
                  setActiveToolRoute("/tools");
                  setActiveBlogRoute(null);
                  window.history.pushState(null, "", "/tools");
                  window.dispatchEvent(new PopStateEvent('popstate'));
                }}
                className="text-xs font-bold text-indigo-600 hover:text-indigo-755 transition-colors cursor-pointer no-underline"
              >
                Free Tools
              </a>
              <a
                href="/blog"
                onClick={(e) => {
                  e.preventDefault();
                  setActiveBlogRoute("/blog");
                  setActiveToolRoute(null);
                  window.history.pushState(null, "", "/blog");
                  window.dispatchEvent(new PopStateEvent('popstate'));
                }}
                className="text-xs font-bold text-indigo-600 hover:text-indigo-755 transition-colors cursor-pointer no-underline"
              >
                Blog
              </a>
              <a
                href="/privacy"
                onClick={(e) => {
                  e.preventDefault();
                  setActiveMarketingPage("privacy");
                  window.history.pushState(null, "", "/privacy");
                  window.dispatchEvent(new PopStateEvent('popstate'));
                }}
                className="text-xs font-semibold text-slate-600 hover:text-indigo-600 transition-colors cursor-pointer no-underline"
              >
                Privacy
              </a>
              <a
                href="/terms"
                onClick={(e) => {
                  e.preventDefault();
                  setActiveMarketingPage("terms");
                  window.history.pushState(null, "", "/terms");
                  window.dispatchEvent(new PopStateEvent('popstate'));
                }}
                className="text-xs font-semibold text-slate-600 hover:text-indigo-600 transition-colors cursor-pointer no-underline"
              >
                Terms
              </a>
            </div>

            <div className="flex items-center gap-4">
              {user ? (
                <button
                  onClick={() => {
                    setActiveBlogRoute(null);
                    setActiveToolRoute(null);
                    setActiveTab("dashboard");
                    window.history.pushState(null, "", "/");
                    window.dispatchEvent(new PopStateEvent('popstate'));
                  }}
                  className="px-4 py-2 bg-indigo-600 text-white text-xs font-semibold rounded-xl hover:bg-indigo-700 hover:shadow-md transition-all cursor-pointer shadow-xs flex items-center gap-1.5 font-sans border-none"
                >
                  Go to Dashboard
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              ) : (
                <>
                  <button
                    onClick={() => {
                      setAuthError(null);
                      setShowAuthForm("login");
                    }}
                    className="text-sm font-semibold text-slate-600 hover:text-slate-900 transition-colors cursor-pointer bg-transparent border-none"
                  >
                    Sign In
                  </button>
                  <button
                    onClick={() => {
                      setAuthError(null);
                      setShowAuthForm("signup");
                    }}
                    className="px-4 py-2 bg-indigo-600 text-white text-xs font-semibold rounded-xl hover:bg-indigo-700 hover:shadow-md transition-all cursor-pointer shadow-xs border-none"
                  >
                    Create Account
                  </button>
                </>
              )}
            </div>
          </div>
        </header>

        <main className="flex-1">
          {blogComponent}
        </main>

        <footer className="bg-white border-t border-slate-200 py-10 text-center text-xs text-slate-400">
          <div className="max-w-6xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
            <p>© 2026 ReportIQ · Professional Intelligent Client Portals</p>
            <div className="flex items-center gap-5 flex-wrap justify-center font-semibold text-slate-555">
              <a
                href="/features"
                onClick={(e) => {
                  e.preventDefault();
                  setActiveMarketingPage("features");
                  window.history.pushState(null, "", "/features");
                  window.dispatchEvent(new PopStateEvent('popstate'));
                }}
                className="hover:text-indigo-600 transition-colors cursor-pointer no-underline"
              >
                Features
              </a>
              <a
                href="/about"
                onClick={(e) => {
                  e.preventDefault();
                  setActiveMarketingPage("about");
                  window.history.pushState(null, "", "/about");
                  window.dispatchEvent(new PopStateEvent('popstate'));
                }}
                className="hover:text-indigo-600 transition-colors cursor-pointer no-underline"
              >
                About Us
              </a>
              <a
                href="/contact"
                onClick={(e) => {
                  e.preventDefault();
                  setContactSuccess(false);
                  setActiveMarketingPage("contact");
                  window.history.pushState(null, "", "/contact");
                  window.dispatchEvent(new PopStateEvent('popstate'));
                }}
                className="hover:text-indigo-600 transition-colors cursor-pointer no-underline"
              >
                Contact
              </a>
              <a
                href="/docs"
                onClick={(e) => {
                  e.preventDefault();
                  setDocsActiveTab("guide");
                  setOpenFaqIndex(null);
                  setActiveMarketingPage("docs");
                  window.history.pushState(null, "", "/docs");
                  window.dispatchEvent(new PopStateEvent('popstate'));
                }}
                className="hover:text-indigo-600 transition-colors cursor-pointer no-underline"
              >
                Documentation
              </a>
              <a
                href="/blog"
                onClick={(e) => {
                  e.preventDefault();
                  setActiveBlogRoute("/blog");
                  setActiveToolRoute(null);
                  window.history.pushState(null, "", "/blog");
                  window.dispatchEvent(new PopStateEvent('popstate'));
                }}
                className="hover:text-indigo-600 transition-colors cursor-pointer no-underline"
              >
                Blog
              </a>
              <a
                href="/tools"
                onClick={(e) => {
                  e.preventDefault();
                  setActiveToolRoute("/tools");
                  setActiveBlogRoute(null);
                  window.history.pushState(null, "", "/tools");
                  window.dispatchEvent(new PopStateEvent('popstate'));
                }}
                className="hover:text-indigo-600 transition-colors cursor-pointer font-bold text-indigo-600 no-underline"
              >
                Free Tools
              </a>
              <a
                href="/privacy"
                onClick={(e) => {
                  e.preventDefault();
                  setActiveMarketingPage("privacy");
                  window.history.pushState(null, "", "/privacy");
                  window.dispatchEvent(new PopStateEvent('popstate'));
                }}
                className="hover:text-indigo-600 transition-colors cursor-pointer no-underline"
              >
                Privacy Policy
              </a>
              <a
                href="/terms"
                onClick={(e) => {
                  e.preventDefault();
                  setActiveMarketingPage("terms");
                  window.history.pushState(null, "", "/terms");
                  window.dispatchEvent(new PopStateEvent('popstate'));
                }}
                className="hover:text-indigo-600 transition-colors cursor-pointer no-underline"
              >
                Terms of Service
              </a>
            </div>
          </div>
        </footer>

        {showStickyCta && !user && (
          <div className="fixed bottom-0 left-0 right-0 z-50 bg-indigo-700 border-t border-indigo-600 text-white shadow-2xl py-4.5 px-6 sm:px-12 flex flex-col sm:flex-row items-center justify-between gap-4 animate-slide-up font-sans">
            <div className="flex items-center gap-3 text-left">
              <div className="w-10 h-10 bg-white/10 border border-white/20 rounded-xl flex items-center justify-center shrink-0">
                <Sparkles className="w-5 h-5 text-indigo-200 animate-pulse" />
              </div>
              <div>
                <h4 className="font-extrabold font-display text-sm sm:text-base leading-tight">
                  Stop writing reports manually.
                </h4>
                <p className="text-indigo-100 text-xs sm:text-sm font-medium">
                  Sign up free in 30 seconds to generate unlimited reports and invite clients to white-labeled portals.
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-4 shrink-0 w-full sm:w-auto">
              <button
                onClick={() => {
                  setAuthError(null);
                  setShowAuthForm("signup");
                }}
                className="w-full sm:w-auto px-6 py-2.5 bg-white text-indigo-700 font-bold rounded-xl hover:bg-indigo-50 shadow-md transition-all cursor-pointer text-xs sm:text-sm text-center border-none animate-pulse"
              >
                Get Started Free &rarr;
              </button>
              <button
                onClick={handleDismissSticky}
                className="text-indigo-200 hover:text-white p-2 rounded-lg hover:bg-white/10 cursor-pointer transition-colors border-none bg-transparent"
                title="Dismiss"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>
        )}
      </div>
    );
  }

  if (activeToolRoute) {
    let toolComponent = <ToolsHome />;
    switch (activeToolRoute) {
      case "/tools":
        toolComponent = <ToolsHome />;
        break;
      case "/tools/client-report-generator":
        toolComponent = <ToolClientReport />;
        break;
      case "/tools/agency-report-template":
        toolComponent = <ToolAgencyReport />;
        break;
      case "/tools/seo-report-generator":
        toolComponent = <ToolSeoReport />;
        break;
      case "/tools/client-update-email":
        toolComponent = <ToolClientEmail />;
        break;
      case "/tools/monthly-report-template":
        toolComponent = <ToolMonthlyReport />;
        break;
      case "/tools/kpi-report-generator":
        toolComponent = <ToolKpiReport />;
        break;
      case "/tools/social-media-report":
        toolComponent = <ToolSocialMedia />;
        break;
      case "/tools/invoice-description-writer":
        toolComponent = <ToolInvoice />;
        break;
      case "/tools/project-status-report":
        toolComponent = <ToolProjectStatus />;
        break;
      case "/tools/client-onboarding-email":
        toolComponent = <ToolOnboarding />;
        break;
      case "/tools/competitor-analysis-generator":
        toolComponent = <ToolCompetitorAnalysis />;
        break;
      case "/tools/weekly-report-generator":
        toolComponent = <ToolWeeklyReport />;
        break;
      case "/tools/ppc-performance-report":
        toolComponent = <ToolPpcReport />;
        break;
      case "/tools/scope-of-work-generator":
        toolComponent = <ToolScopeOfWork />;
        break;
      case "/tools/project-post-mortem-generator":
        toolComponent = <ToolPostMortem />;
        break;
      case "/tools/onboarding-questionnaire-generator":
        toolComponent = <ToolOnboardingQuestionnaire />;
        break;
    }

    return (
      <div className="min-h-screen bg-slate-50 flex flex-col font-sans text-slate-700 animate-fade-in">
        <header className="bg-white/80 backdrop-blur-md border-b border-slate-200 sticky top-0 z-40 px-6 sm:px-12 py-4">
          <div className="max-w-6xl mx-auto flex items-center justify-between">
            <a 
              href="/"
              className="flex items-center gap-2 cursor-pointer select-none no-underline"
              onClick={(e) => {
                e.preventDefault();
                setActiveBlogRoute(null);
                setActiveToolRoute(null);
                setActiveMarketingPage(null);
                window.history.pushState(null, "", "/");
                window.dispatchEvent(new PopStateEvent('popstate'));
              }}
            >
              <div className="w-9 h-9 bg-indigo-600 rounded-xl flex items-center justify-center text-white shadow-sm shadow-indigo-200 shrink-0">
                <FileText className="w-5 h-5" />
              </div>
              <span className="font-extrabold font-display text-slate-950 tracking-tight text-lg">
                ReportIQ
              </span>
            </a>

            <div className="hidden md:flex items-center gap-6">
              <a
                href="/features"
                onClick={(e) => {
                  e.preventDefault();
                  setActiveMarketingPage("features");
                  window.history.pushState(null, "", "/features");
                  window.dispatchEvent(new PopStateEvent('popstate'));
                }}
                className="text-xs font-semibold text-slate-600 hover:text-indigo-600 transition-colors cursor-pointer no-underline"
              >
                Features
              </a>
              <a
                href="/about"
                onClick={(e) => {
                  e.preventDefault();
                  setActiveMarketingPage("about");
                  window.history.pushState(null, "", "/about");
                  window.dispatchEvent(new PopStateEvent('popstate'));
                }}
                className="text-xs font-semibold text-slate-600 hover:text-indigo-600 transition-colors cursor-pointer no-underline"
              >
                About
              </a>
              <a
                href="/contact"
                onClick={(e) => {
                  e.preventDefault();
                  setContactSuccess(false);
                  setActiveMarketingPage("contact");
                  window.history.pushState(null, "", "/contact");
                  window.dispatchEvent(new PopStateEvent('popstate'));
                }}
                className="text-xs font-semibold text-slate-600 hover:text-indigo-600 transition-colors cursor-pointer no-underline"
              >
                Contact
              </a>
              <a
                href="/docs"
                onClick={(e) => {
                  e.preventDefault();
                  setDocsActiveTab("guide");
                  setOpenFaqIndex(null);
                  setActiveMarketingPage("docs");
                  window.history.pushState(null, "", "/docs");
                  window.dispatchEvent(new PopStateEvent('popstate'));
                }}
                className="text-xs font-semibold text-slate-600 hover:text-indigo-600 transition-colors cursor-pointer no-underline"
              >
                Docs
              </a>
              <a
                href="/portal"
                onClick={(e) => {
                  e.preventDefault();
                  setIsClientPortal(true);
                  window.history.pushState(null, "", "/portal");
                  window.dispatchEvent(new PopStateEvent('popstate'));
                }}
                className="text-xs font-bold text-indigo-600 hover:text-indigo-755 transition-colors cursor-pointer flex items-center gap-1 no-underline"
              >
                <Globe className="w-3 h-3" />
                Client Portal
              </a>
              <a
                href="/tools"
                onClick={(e) => {
                  e.preventDefault();
                  setActiveToolRoute("/tools");
                  setActiveBlogRoute(null);
                  window.history.pushState(null, "", "/tools");
                  window.dispatchEvent(new PopStateEvent('popstate'));
                }}
                className="text-xs font-bold text-indigo-600 hover:text-indigo-755 transition-colors cursor-pointer no-underline"
              >
                Free Tools
              </a>
              <a
                href="/blog"
                onClick={(e) => {
                  e.preventDefault();
                  setActiveBlogRoute("/blog");
                  setActiveToolRoute(null);
                  window.history.pushState(null, "", "/blog");
                  window.dispatchEvent(new PopStateEvent('popstate'));
                }}
                className="text-xs font-bold text-indigo-600 hover:text-indigo-755 transition-colors cursor-pointer no-underline"
              >
                Blog
              </a>
              <a
                href="/privacy"
                onClick={(e) => {
                  e.preventDefault();
                  setActiveMarketingPage("privacy");
                  window.history.pushState(null, "", "/privacy");
                  window.dispatchEvent(new PopStateEvent('popstate'));
                }}
                className="text-xs font-semibold text-slate-600 hover:text-indigo-600 transition-colors cursor-pointer no-underline"
              >
                Privacy
              </a>
              <a
                href="/terms"
                onClick={(e) => {
                  e.preventDefault();
                  setActiveMarketingPage("terms");
                  window.history.pushState(null, "", "/terms");
                  window.dispatchEvent(new PopStateEvent('popstate'));
                }}
                className="text-xs font-semibold text-slate-600 hover:text-indigo-600 transition-colors cursor-pointer no-underline"
              >
                Terms
              </a>
            </div>

            <div className="flex items-center gap-4">
              {user ? (
                <button
                  onClick={() => {
                    setActiveToolRoute(null);
                    setActiveTab("dashboard");
                    window.history.pushState(null, "", "/");
                    window.dispatchEvent(new PopStateEvent('popstate'));
                  }}
                  className="px-4 py-2 bg-indigo-600 text-white text-xs font-semibold rounded-xl hover:bg-indigo-700 hover:shadow-md transition-all cursor-pointer shadow-xs flex items-center gap-1.5 font-sans border-none"
                >
                  Go to Dashboard
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              ) : (
                <>
                  <button
                    onClick={() => {
                      setAuthError(null);
                      setShowAuthForm("login");
                    }}
                    className="text-sm font-semibold text-slate-600 hover:text-slate-900 transition-colors cursor-pointer bg-transparent border-none"
                  >
                    Sign In
                  </button>
                  <button
                    onClick={() => {
                      setAuthError(null);
                      setShowAuthForm("signup");
                    }}
                    className="px-4 py-2 bg-indigo-600 text-white text-xs font-semibold rounded-xl hover:bg-indigo-700 hover:shadow-md transition-all cursor-pointer shadow-xs border-none"
                  >
                    Create Account
                  </button>
                </>
              )}
            </div>
          </div>
        </header>

        <main className="flex-1">
          {toolComponent}
        </main>

        <footer className="bg-white border-t border-slate-200 py-10 text-center text-xs text-slate-400">
          <div className="max-w-6xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
            <p>© 2026 ReportIQ · Professional Intelligent Client Portals</p>
            <div className="flex items-center gap-5 flex-wrap justify-center font-semibold text-slate-555">
              <a
                href="/features"
                onClick={(e) => {
                  e.preventDefault();
                  setActiveMarketingPage("features");
                  window.history.pushState(null, "", "/features");
                  window.dispatchEvent(new PopStateEvent('popstate'));
                }}
                className="hover:text-indigo-600 transition-colors cursor-pointer no-underline"
              >
                Features
              </a>
              <a
                href="/about"
                onClick={(e) => {
                  e.preventDefault();
                  setActiveMarketingPage("about");
                  window.history.pushState(null, "", "/about");
                  window.dispatchEvent(new PopStateEvent('popstate'));
                }}
                className="hover:text-indigo-600 transition-colors cursor-pointer no-underline"
              >
                About Us
              </a>
              <a
                href="/contact"
                onClick={(e) => {
                  e.preventDefault();
                  setContactSuccess(false);
                  setActiveMarketingPage("contact");
                  window.history.pushState(null, "", "/contact");
                  window.dispatchEvent(new PopStateEvent('popstate'));
                }}
                className="hover:text-indigo-600 transition-colors cursor-pointer no-underline"
              >
                Contact
              </a>
              <a
                href="/docs"
                onClick={(e) => {
                  e.preventDefault();
                  setDocsActiveTab("guide");
                  setOpenFaqIndex(null);
                  setActiveMarketingPage("docs");
                  window.history.pushState(null, "", "/docs");
                  window.dispatchEvent(new PopStateEvent('popstate'));
                }}
                className="hover:text-indigo-600 transition-colors cursor-pointer no-underline"
              >
                Documentation
              </a>
              <a
                href="/blog"
                onClick={(e) => {
                  e.preventDefault();
                  setActiveBlogRoute("/blog");
                  setActiveToolRoute(null);
                  window.history.pushState(null, "", "/blog");
                  window.dispatchEvent(new PopStateEvent('popstate'));
                }}
                className="hover:text-indigo-600 transition-colors cursor-pointer no-underline"
              >
                Blog
              </a>
              <a
                href="/tools"
                onClick={(e) => {
                  e.preventDefault();
                  setActiveToolRoute("/tools");
                  setActiveBlogRoute(null);
                  window.history.pushState(null, "", "/tools");
                  window.dispatchEvent(new PopStateEvent('popstate'));
                }}
                className="hover:text-indigo-600 transition-colors cursor-pointer font-bold text-indigo-600 no-underline"
              >
                Free Tools
              </a>
              <a
                href="/privacy"
                onClick={(e) => {
                  e.preventDefault();
                  setActiveMarketingPage("privacy");
                  window.history.pushState(null, "", "/privacy");
                  window.dispatchEvent(new PopStateEvent('popstate'));
                }}
                className="hover:text-indigo-600 transition-colors cursor-pointer no-underline"
              >
                Privacy Policy
              </a>
              <a
                href="/terms"
                onClick={(e) => {
                  e.preventDefault();
                  setActiveMarketingPage("terms");
                  window.history.pushState(null, "", "/terms");
                  window.dispatchEvent(new PopStateEvent('popstate'));
                }}
                className="hover:text-indigo-600 transition-colors cursor-pointer no-underline"
              >
                Terms of Service
              </a>
            </div>
          </div>
        </footer>

        {activeMarketingPage && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/45 animate-fade-in backdrop-blur-xs">
            <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-2xl p-8 shadow-2xl relative animate-scale-up text-sm font-sans max-h-[85vh] overflow-y-auto">
              <button
                onClick={() => {
                  setActiveMarketingPage(null);
                  setContactSuccess(false);
                }}
                className="absolute top-6 right-6 text-slate-400 hover:text-slate-655 p-1.5 rounded-xl hover:bg-slate-50 cursor-pointer transition-colors"
                title="Close"
              >
                <X className="w-5 h-5" />
              </button>

              {activeMarketingPage === "about" && (
                <div>
                  <div className="flex items-center gap-3.5 mb-4 text-left">
                    <div className="p-3 bg-indigo-50 border border-indigo-100 rounded-2xl text-indigo-655 shrink-0">
                      <FileText className="w-6 h-6" />
                    </div>
                    <div>
                      <span className="text-xs font-bold font-mono tracking-widest text-indigo-600 uppercase">Our Mission</span>
                      <h3 className="text-xl font-bold font-display text-slate-950">About ReportIQ</h3>
                    </div>
                  </div>
                  <h4 className="text-sm font-bold text-slate-800 mb-2 leading-relaxed text-left">
                    Automated report delivery, built for fast-moving client teams & creative freelancers.
                  </h4>
                  <p className="text-slate-550 leading-relaxed mb-6 text-xs text-left">
                    ReportIQ was established to eliminate the tedious admin burden of manual agency report writing. 
                    We believe consulting and support teams should spend their time aligning strategy and producing results—not copying and pasting metrics into formatted tables or drafting summaries.
                  </p>
                </div>
              )}

              {activeMarketingPage === "contact" && (
                <div>
                  <div className="flex items-center gap-3.5 mb-4 text-left">
                    <div className="p-3 bg-indigo-50 border border-indigo-100 rounded-2xl text-indigo-655 shrink-0">
                      <Mail className="w-6 h-6" />
                    </div>
                    <div>
                      <span className="text-xs font-bold font-mono tracking-widest text-indigo-600 uppercase">Support Center</span>
                      <h3 className="text-xl font-bold font-display text-slate-950">Contact Our Team</h3>
                    </div>
                  </div>
                  <p className="text-slate-550 mb-6 text-xs leading-relaxed text-left">
                    Have questions about ReportIQ? Contact support directly at <strong className="text-slate-900 font-semibold font-mono text-[11px]">support@reportiq.xyz</strong>.
                  </p>
                  <div className="pt-2">
                    <a
                      href="https://mail.google.com/mail/?view=cm&fs=1&to=support@reportiq.xyz&su=ReportIQ%20Support%20Inquiry"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-755 text-white font-bold rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer shadow-sm text-xs text-center border-none no-underline hover:text-white"
                    >
                      <Mail className="w-4 h-4 shrink-0 text-indigo-200" />
                      Open Gmail to Email Us
                    </a>
                  </div>
                </div>
              )}

              {activeMarketingPage === "privacy" && (
                <div className="text-xs text-left">
                  <h3 className="text-xl font-bold font-display text-slate-950 mb-4">Privacy Policy</h3>
                  <p className="text-slate-550 leading-relaxed">
                    At ReportIQ, we treat your agency and client information with absolute integrity.
                  </p>
                </div>
              )}

              {activeMarketingPage === "terms" && (
                <div className="text-xs text-left">
                  <h3 className="text-xl font-bold font-display text-slate-950 mb-4">Terms of Service</h3>
                  <p className="text-slate-550 leading-relaxed">
                    By accessing the ReportIQ hosting portal, you and your agency accept our service rules.
                  </p>
                </div>
              )}

              {activeMarketingPage === "docs" && (
                <div className="text-xs text-left">
                  <h3 className="text-xl font-bold font-display text-slate-955 mb-4">Documentation</h3>
                  <p className="text-slate-550 leading-relaxed">
                    Welcome to the documentation guide for ReportIQ tools.
                  </p>
                </div>
              )}

              {activeMarketingPage === "features" && (
                <div className="space-y-10 text-xs sm:text-sm text-slate-600">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-100 text-left">
                    <div className="flex items-center gap-3.5">
                      <div className="p-3 bg-indigo-50 border border-indigo-100 rounded-2xl text-indigo-655 shrink-0">
                        <Sparkles className="w-6 h-6 text-indigo-600 animate-pulse" />
                      </div>
                      <div>
                        <span className="text-xs font-bold font-mono tracking-widest text-indigo-600 uppercase">Platform Overview</span>
                        <h3 className="text-xl font-bold font-display text-slate-950">Why Agencies Choose ReportIQ</h3>
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        setActiveMarketingPage(null);
                        setAuthError(null);
                        setShowAuthForm("signup");
                      }}
                      className="px-4.5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl transition-all shadow-xs border-none cursor-pointer w-fit"
                    >
                      Sign Up Free
                    </button>
                  </div>

                  {/* Why choose details */}
                  <div className="space-y-4 text-left">
                    <div className="grid grid-cols-1 gap-4">
                      <div className="p-5 border border-slate-200 bg-slate-50/50 rounded-2xl">
                        <h4 className="font-extrabold text-slate-955 text-sm mb-1.5">AI Client Reporting Tool</h4>
                        <p className="text-slate-550 text-xs leading-relaxed">
                          Writing monthly client reports is a time-consuming manual task. Freelancers and digital agencies spend hours copying metrics and writing summaries. ReportIQ eliminates this. Our AI powered client reporting tool reads rough notes and generates a complete professional report in 30 seconds.
                        </p>
                      </div>
                      
                      <div className="p-5 border border-slate-200 bg-slate-50/50 rounded-2xl">
                        <h4 className="font-extrabold text-slate-955 text-sm mb-1.5">SEO, PPC & Social Media Analytics</h4>
                        <p className="text-slate-550 text-xs leading-relaxed">
                          From SEO performance reports to social media analytics summaries, project status updates to monthly retainer reports — ReportIQ handles every document type your agency sends. Built specifically for SEO agencies, social media managers, web designers, PPC specialists, and content teams.
                        </p>
                      </div>

                      <div className="p-5 border border-slate-200 bg-slate-50/50 rounded-2xl">
                        <h4 className="font-extrabold text-slate-955 text-sm mb-1.5">Shareable Branded Links</h4>
                        <p className="text-slate-550 text-xs leading-relaxed">
                          Every report generated by ReportIQ includes a unique shareable link your client opens instantly in their browser. No downloads or email attachments. Branded client reports make your agency look world class.
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Who uses ReportIQ */}
                  <div className="text-left border-t border-slate-100 pt-8">
                    <h4 className="font-extrabold font-display text-slate-955 text-base mb-3">Who Uses ReportIQ?</h4>
                    <p className="text-slate-500 text-xs leading-normal mb-4">Modern creators & agencies across various niches:</p>
                    <div className="flex flex-wrap gap-2">
                      {[
                        "Content writers and copywriters",
                        "SEO professionals",
                        "Social media managers",
                        "PPC and advertising specialists",
                        "Web designers and developers",
                        "Marketing consultants",
                        "Growth hackers",
                        "Virtual assistants"
                      ].map((u, i) => (
                        <span key={i} className="px-2.5 py-1 bg-slate-100 border border-slate-200 text-slate-700 rounded-lg text-xs font-semibold">
                          {u}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Testimonials */}
                  <div className="text-left border-t border-slate-100 pt-8">
                    <h4 className="font-extrabold font-display text-slate-955 text-base mb-4">Loved by Freelancers & Agencies Worldwide</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {[
                        {
                          name: "Sarah Mitchell",
                          title: "SEO Freelancer, London UK",
                          text: "I used to spend every Sunday writing client reports. ReportIQ completely changed that. My reports now take 30 seconds and look more professional than before."
                        },
                        {
                          name: "James Rodriguez",
                          title: "Digital Agency Owner, New York",
                          text: "We manage 12 clients and reporting was killing our team. ReportIQ saves us at least 40 hours a month. The AI writing quality is genuinely impressive."
                        },
                        {
                          name: "Priya Sharma",
                          title: "Social Media Manager, Toronto",
                          text: "The shareable link feature is brilliant. My clients love opening their report on their phone instead of downloading a PDF. Makes me look premium."
                        },
                        {
                          name: "Marcus Chen",
                          title: "PPC Specialist, Sydney",
                          text: "I was skeptical about AI writing but the output is genuinely professional. I barely edit the reports at all. My clients are happier and I get my weekends back."
                        }
                      ].map((item, idx) => (
                        <div key={idx} className="bg-white border border-slate-150 p-4 rounded-xl flex flex-col justify-between shadow-3xs">
                          <p className="text-slate-650 text-xs leading-relaxed italic mb-3">"{item.text}"</p>
                          <div>
                            <h5 className="font-bold text-slate-900 text-xs leading-none mb-0.5">{item.name}</h5>
                            <p className="text-[10px] text-slate-400 font-medium">{item.title}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* FAQ Accordion */}
                  <div className="text-left border-t border-slate-100 pt-8">
                    <h4 className="font-extrabold font-display text-slate-955 text-base mb-4">Frequently Asked Questions</h4>
                    <div className="space-y-3.5">
                      {[
                        {
                          q: "What is ReportIQ?",
                          a: "ReportIQ is an AI powered client reporting tool built for freelancers and digital agencies. Instead of spending hours writing monthly client updates, you enter your rough notes and our AI generates a complete professional report in 30 seconds. Every report gets a unique shareable link you send directly to your client."
                        },
                        {
                          q: "Is ReportIQ free to use?",
                          a: "Yes. ReportIQ has a completely free plan that includes 3 client reports per month and 2 active clients with no credit card required. Paid plans start at $29 per month for freelancers and agencies who need more reports, custom branding, and advanced features."
                        },
                        {
                          q: "How does AI client report generation work?",
                          a: "You enter the work you completed for your client, add any key metrics or results, choose your preferred tone and length, and click generate. ReportIQ AI reads your notes and writes a polished professional client report with proper sections including work completed, key results, and coming up next. The whole process takes under 30 seconds."
                        },
                        {
                          q: "Can I send the report directly to my client?",
                          a: "Yes. Every report gets a unique public link like reportiq.xyz/r/abc123 that you can copy and send to your client via email, WhatsApp, or any messaging app. Your client opens the link instantly in their browser with no account or login required."
                        },
                        {
                          q: "Is my client data secure?",
                          a: "Yes. All data is stored in an encrypted Supabase PostgreSQL database with row level security enabled. Only you can access your clients and reports. We never share or sell your data."
                        }
                      ].map((item, idx) => (
                        <div key={idx} className="border border-slate-200 bg-white p-4 rounded-xl">
                          <h5 className="font-bold text-slate-800 text-xs mb-1">{item.q}</h5>
                          <p className="text-slate-500 text-xs leading-relaxed">{item.a}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* CTA at the bottom of modal */}
                  <div className="border-t border-slate-100 pt-8 text-center space-y-4">
                    <h4 className="font-extrabold font-display text-slate-900 text-base">Ready to automate your client reporting?</h4>
                    <p className="text-slate-500 text-xs max-w-sm mx-auto">Get started in 30 seconds. No credit card required. Cancel or upgrade anytime.</p>
                    <button
                      onClick={() => {
                        setActiveMarketingPage(null);
                        setAuthError(null);
                        setShowAuthForm("signup");
                      }}
                      className="px-6.5 py-3 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl transition-all shadow-md border-none cursor-pointer inline-flex items-center gap-2"
                    >
                      Create Free Account
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {showAuthForm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/45 animate-fade-in backdrop-blur-xs">
            <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-md p-6 shadow-xl relative animate-scale-up">
              <button
                onClick={() => {
                  setAuthError(null);
                  setShowAuthForm(null);
                }}
                className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-50 cursor-pointer"
              >
                <Plus className="w-5 h-5 rotate-45 transform" />
              </button>

              <div className="flex items-center gap-2 mb-2">
                <FileText className="w-5 h-5 text-indigo-600" />
                <h3 className="text-lg font-bold font-display text-slate-950">
                  {showAuthForm === "signup" ? "Create Account" : "Access Platform"}
                </h3>
              </div>

              {authError && (
                <div className="mb-4">
                  <div className="p-3 bg-red-50 border border-red-100 text-red-700 text-xs font-medium rounded-xl flex gap-1.5 items-start text-left">
                    <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5" />
                    <span>{authError}</span>
                  </div>
                </div>
              )}

              <form onSubmit={handleAuthSubmit} className="space-y-4 font-sans text-sm">
                {showAuthForm === "signup" && (
                  <>
                    <div>
                      <label className="block text-xs font-bold font-mono uppercase tracking-wider text-slate-500 mb-1.5">
                        Author Full Name
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="Jane Smith"
                        value={authFullName}
                        onChange={e => setAuthFullName(e.target.value)}
                        className="w-full rounded-xl border border-slate-200 bg-slate-50/50 p-2.5"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold font-mono uppercase tracking-wider text-slate-500 mb-1.5">
                        Agency / Freelancer Title *
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="Smith Digital"
                        value={authAgencyName}
                        onChange={e => setAuthAgencyName(e.target.value)}
                        className="w-full rounded-xl border border-slate-200 bg-slate-50/50 p-2.5"
                      />
                    </div>
                  </>
                )}

                <div>
                  <label className="block text-xs font-bold font-mono uppercase tracking-wider text-slate-500 mb-1.5">
                    Email Address *
                  </label>
                  <input
                    type="email"
                    required
                    placeholder="jane@smith.com"
                    value={authEmail}
                    onChange={e => setAuthEmail(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50/50 p-2.5"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold font-mono uppercase tracking-wider text-slate-500 mb-1.5">
                    Account Password *
                  </label>
                  <input
                    type="password"
                    required
                    placeholder="Min. 6 alphanumeric"
                    value={authPassword}
                    onChange={e => setAuthPassword(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50/50 p-2.5"
                    minLength={6}
                  />
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={authSubmitting}
                    className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-sm transition-all"
                  >
                    {authSubmitting ? "Connecting..." : showAuthForm === "signup" ? "Register Onboard & Start" : "Access Portal Workspace"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    );
  }

  // Render Landing Screen if NOT logged in
  if (!user) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col font-sans text-slate-700">
        {/* Navigation line bar layout */}
        <header className="bg-white/80 backdrop-blur-md border-b border-slate-200 sticky top-0 z-40 px-6 sm:px-12 py-4">
          <div className="max-w-6xl mx-auto flex items-center justify-between">
            <a 
              href="/"
              className="flex items-center gap-2 cursor-pointer select-none no-underline"
              onClick={(e) => {
                e.preventDefault();
                setActiveBlogRoute(null);
                setActiveToolRoute(null);
                setActiveMarketingPage(null);
                window.history.pushState(null, "", "/");
                window.dispatchEvent(new PopStateEvent('popstate'));
              }}
            >
              <div className="w-9 h-9 bg-indigo-600 rounded-xl flex items-center justify-center text-white shadow-sm shadow-indigo-200 shrink-0">
                <FileText className="w-5 h-5" />
              </div>
              <span className="font-extrabold font-display text-slate-950 tracking-tight text-lg">
                ReportIQ
              </span>
            </a>

            <div className="hidden md:flex items-center gap-6">
              <a
                href="/features"
                onClick={(e) => {
                  e.preventDefault();
                  setActiveMarketingPage("features");
                  window.history.pushState(null, "", "/features");
                  window.dispatchEvent(new PopStateEvent('popstate'));
                }}
                className="text-xs font-semibold text-slate-600 hover:text-indigo-600 transition-colors cursor-pointer no-underline"
              >
                Features
              </a>
              <a
                href="/about"
                onClick={(e) => {
                  e.preventDefault();
                  setActiveMarketingPage("about");
                  window.history.pushState(null, "", "/about");
                  window.dispatchEvent(new PopStateEvent('popstate'));
                }}
                className="text-xs font-semibold text-slate-600 hover:text-indigo-600 transition-colors cursor-pointer no-underline"
              >
                About
              </a>
              <a
                href="/contact"
                onClick={(e) => {
                  e.preventDefault();
                  setContactSuccess(false);
                  setActiveMarketingPage("contact");
                  window.history.pushState(null, "", "/contact");
                  window.dispatchEvent(new PopStateEvent('popstate'));
                }}
                className="text-xs font-semibold text-slate-600 hover:text-indigo-600 transition-colors cursor-pointer no-underline"
              >
                Contact
              </a>
              <a
                href="/docs"
                onClick={(e) => {
                  e.preventDefault();
                  setDocsActiveTab("guide");
                  setOpenFaqIndex(null);
                  setActiveMarketingPage("docs");
                  window.history.pushState(null, "", "/docs");
                  window.dispatchEvent(new PopStateEvent('popstate'));
                }}
                className="text-xs font-semibold text-slate-600 hover:text-indigo-600 transition-colors cursor-pointer no-underline"
              >
                Docs
              </a>
              <a
                href="/portal"
                onClick={(e) => {
                  e.preventDefault();
                  setIsClientPortal(true);
                  window.history.pushState(null, "", "/portal");
                  window.dispatchEvent(new PopStateEvent('popstate'));
                }}
                className="text-xs font-bold text-indigo-600 hover:text-indigo-755 transition-colors cursor-pointer flex items-center gap-1 no-underline"
              >
                <Globe className="w-3 h-3" />
                Client Portal
              </a>
              <a
                href="/tools"
                onClick={(e) => {
                  e.preventDefault();
                  setActiveToolRoute("/tools");
                  setActiveBlogRoute(null);
                  window.history.pushState(null, "", "/tools");
                  window.dispatchEvent(new PopStateEvent('popstate'));
                }}
                className="text-xs font-bold text-indigo-600 hover:text-indigo-755 transition-colors cursor-pointer no-underline"
              >
                Free Tools
              </a>
              <a
                href="/blog"
                onClick={(e) => {
                  e.preventDefault();
                  setActiveBlogRoute("/blog");
                  setActiveToolRoute(null);
                  window.history.pushState(null, "", "/blog");
                  window.dispatchEvent(new PopStateEvent('popstate'));
                }}
                className="text-xs font-bold text-indigo-600 hover:text-indigo-755 transition-colors cursor-pointer no-underline"
              >
                Blog
              </a>
              <a
                href="/privacy"
                onClick={(e) => {
                  e.preventDefault();
                  setActiveMarketingPage("privacy");
                  window.history.pushState(null, "", "/privacy");
                  window.dispatchEvent(new PopStateEvent('popstate'));
                }}
                className="text-xs font-semibold text-slate-600 hover:text-indigo-600 transition-colors cursor-pointer no-underline"
              >
                Privacy
              </a>
              <a
                href="/terms"
                onClick={(e) => {
                  e.preventDefault();
                  setActiveMarketingPage("terms");
                  window.history.pushState(null, "", "/terms");
                  window.dispatchEvent(new PopStateEvent('popstate'));
                }}
                className="text-xs font-semibold text-slate-600 hover:text-indigo-600 transition-colors cursor-pointer no-underline"
              >
                Terms
              </a>
            </div>

            <div className="flex items-center gap-4">
              <button
                onClick={() => {
                  setAuthError(null);
                  setShowAuthForm("login");
                }}
                className="text-sm font-semibold text-slate-600 hover:text-slate-900 transition-colors cursor-pointer bg-transparent border-none"
              >
                Sign In
              </button>
              <button
                onClick={() => {
                  setAuthError(null);
                  setShowAuthForm("signup");
                }}
                className="px-4 py-2 bg-indigo-600 text-white text-xs font-semibold rounded-xl hover:bg-indigo-700 hover:shadow-md transition-all cursor-pointer shadow-xs border-none"
              >
                Create Account
              </button>
            </div>
          </div>
        </header>

        {/* Hero Banner Section with Search Dashboard */}
        <main className="flex-1">
          <section className="relative px-6 py-12 sm:py-24 text-center max-w-5xl mx-auto">
            {/* Stars rating trust badge */}
            <div className="flex flex-wrap items-center justify-center gap-1.5 mb-5 text-amber-500 font-sans text-xs">
              <div className="flex text-amber-400 text-sm tracking-tighter">★★★★★</div>
              <span className="text-slate-500 font-semibold">Rated 4.9/5 by 500+ Agency Owners & Freelancers</span>
              <span className="px-1.5 py-0.5 bg-emerald-50 border border-emerald-100 text-emerald-700 font-bold font-mono rounded text-[8px] uppercase tracking-wider select-none">Verified Reviews</span>
            </div>

            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 border border-indigo-100 text-indigo-755 font-bold rounded-full text-[10px] sm:text-xs font-mono uppercase tracking-wider mb-6 animate-pulse select-none">
              <Sparkles className="w-3.5 h-3.5 text-indigo-650 animate-spin" style={{ animationDuration: '3s' }} />
              🔥 Limited Promo: Get Lifetime Pro for $99 (Only 32 licenses left!)
            </div>
            <h1 className="text-3xl sm:text-6xl font-black font-display text-slate-955 tracking-tight leading-tight mb-6">
              AI Client Reporting for<br />
              <span className="text-indigo-600 bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent font-sans">Freelancers & Agencies</span>
            </h1>
            <p className="text-slate-550 text-base sm:text-lg leading-relaxed max-w-2xl mx-auto mb-10 font-sans">
              Stop writing reports manually. Search or select one of our 16 free utilities below to draft scopes of work, competitive intelligence, and monthly client summaries in seconds.
            </p>

            {/* Interactive Search Dashboard Card */}
            <div className="max-w-2xl mx-auto bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-md text-left mb-8">
              <input
                type="text"
                placeholder="Search 16 tools (e.g. scope of work, competitor, SEO, weekly...)"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-slate-50/50 outline-none p-3.5 text-sm focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100 transition-all placeholder:text-slate-400 font-sans"
              />
              
              <div className="flex flex-wrap items-center gap-3 mt-4.5">
                <button
                  onClick={() => {
                    setAuthError(null);
                    setShowAuthForm("signup");
                  }}
                  className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl transition-all shadow-sm border-none cursor-pointer"
                >
                  Get Started for Free
                </button>
                <button
                  onClick={() => {
                    setActiveToolRoute("/tools");
                    window.history.pushState(null, "", "/tools");
                    window.dispatchEvent(new PopStateEvent('popstate'));
                  }}
                  className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-all border-none cursor-pointer"
                >
                  Explore All 16 Tools &rarr;
                </button>
              </div>
            </div>

            {/* Trusted Brand Partner Logos Infinite Marquee */}
            <div className="max-w-4xl mx-auto border-t border-slate-200/80 pt-10 pb-8 text-center overflow-hidden select-none relative mb-8">
              <p className="text-[10px] font-extrabold font-mono tracking-widest text-slate-400 uppercase mb-6">
                COMPATIBLE WITH AND TRUSTED BY TEAMS FROM 500+ COMPANIES
              </p>
              
              {/* Fade masks for smooth edges */}
              <div className="absolute top-16 bottom-8 left-0 w-24 bg-gradient-to-r from-slate-50 to-transparent z-10 pointer-events-none" />
              <div className="absolute top-16 bottom-8 right-0 w-24 bg-gradient-to-l from-slate-50 to-transparent z-10 pointer-events-none" />

              <div className="flex w-max animate-marquee gap-14 items-center text-slate-400 font-sans pr-14 font-black select-none">
                {[
                  { name: "Vercel", color: "hover:text-slate-900" },
                  { name: "HubSpot", color: "hover:text-orange-600" },
                  { name: "Stripe", color: "hover:text-indigo-600" },
                  { name: "Shopify", color: "hover:text-emerald-700" },
                  { name: "Webflow", color: "hover:text-blue-600" },
                  { name: "Slack", color: "hover:text-purple-650" },
                  { name: "Notion", color: "hover:text-slate-905" },
                  { name: "Figma", color: "hover:text-rose-500" },
                  { name: "Salesforce", color: "hover:text-sky-500" },
                  { name: "Asana", color: "hover:text-pink-500" },
                  { name: "Miro", color: "hover:text-amber-500" },
                  { name: "Airbnb", color: "hover:text-rose-500" },
                  { name: "Linear", color: "hover:text-slate-800" },
                  { name: "Zoom", color: "hover:text-blue-500" }
                ].map((logo, idx) => (
                  <span 
                    key={idx} 
                    className={`transition-colors duration-205 cursor-default text-base sm:text-lg tracking-wider ${logo.color}`}
                  >
                    {logo.name}
                  </span>
                ))}
                
                {/* Second set for loop */}
                {[
                  { name: "Vercel", color: "hover:text-slate-900" },
                  { name: "HubSpot", color: "hover:text-orange-600" },
                  { name: "Stripe", color: "hover:text-indigo-600" },
                  { name: "Shopify", color: "hover:text-emerald-700" },
                  { name: "Webflow", color: "hover:text-blue-600" },
                  { name: "Slack", color: "hover:text-purple-650" },
                  { name: "Notion", color: "hover:text-slate-905" },
                  { name: "Figma", color: "hover:text-rose-500" },
                  { name: "Salesforce", color: "hover:text-sky-500" },
                  { name: "Asana", color: "hover:text-pink-500" },
                  { name: "Miro", color: "hover:text-amber-500" },
                  { name: "Airbnb", color: "hover:text-rose-500" },
                  { name: "Linear", color: "hover:text-slate-800" },
                  { name: "Zoom", color: "hover:text-blue-500" }
                ].map((logo, idx) => (
                  <span 
                    key={`loop-${idx}`} 
                    className={`transition-colors duration-205 cursor-default text-base sm:text-lg tracking-wider ${logo.color}`}
                  >
                    {logo.name}
                  </span>
                ))}
              </div>
            </div>

            {/* Live Filtered Results grid */}
            {searchQuery && (
              <div className="max-w-3xl mx-auto grid grid-cols-1 sm:grid-cols-2 gap-4 text-left p-2 bg-slate-100/50 border border-slate-200/60 rounded-3xl mb-12">
                {ALL_TOOLS.filter(t => 
                  t.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                  t.desc.toLowerCase().includes(searchQuery.toLowerCase())
                ).length > 0 ? (
                  ALL_TOOLS.filter(t => 
                    t.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                    t.desc.toLowerCase().includes(searchQuery.toLowerCase())
                  ).map((t, idx) => (
                    <div 
                      key={idx}
                      onClick={() => {
                        setActiveToolRoute(t.route);
                        window.history.pushState(null, "", t.route);
                        window.dispatchEvent(new PopStateEvent('popstate'));
                      }}
                      className="bg-white border border-slate-200 hover:border-indigo-400 p-4 rounded-2xl cursor-pointer transition-all shadow-3xs flex flex-col justify-between group"
                    >
                      <div>
                        <h4 className="font-extrabold text-sm text-slate-900 group-hover:text-indigo-650 transition-colors">{t.name}</h4>
                        <p className="text-xs text-slate-505 mt-1 leading-relaxed">{t.desc}</p>
                      </div>
                      <span className="text-[10px] font-bold text-indigo-650 mt-3 flex items-center gap-1 group-hover:translate-x-0.5 transition-transform">
                        Launch Free Tool &rarr;
                      </span>
                    </div>
                  ))
                ) : (
                  <div className="col-span-full py-8 text-center text-slate-400 text-xs font-medium">
                    No matching tools found. Try searching for "report", "SOW", "competitor", or "email".
                  </div>
                )}
              </div>
            )}
          </section>

          {/* Value Prop Columns grid */}
          <section className="bg-white border-y border-slate-200 py-20 px-6 sm:px-12">
            <div className="max-w-5xl mx-auto">
              <h2 className="text-3xl font-black font-display text-slate-950 text-center mb-3">
                Seamless client alignment in four steps
              </h2>
              <p className="text-slate-550 text-xs font-mono uppercase tracking-wider text-center mb-16">
                Automating deliverable summaries with zero friction
              </p>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                {[
                  {
                    step: "01",
                    title: "Add Client Profile",
                    desc: "Onboard customer parameters, company tags, and key contacts dynamically.",
                  },
                  {
                    step: "02",
                    title: "Connect Work Tooling",
                    desc: "Add custom metrics logs and manual milestones from your past week's accomplishments.",
                  },
                  {
                    step: "03",
                    title: "AI Writes Summary",
                    desc: "Our Groq Llama compiler compiles detailed progress, KPIs, and goals in seconds.",
                  },
                  {
                    step: "04",
                    title: "Share Dynamic Portals",
                    desc: "Deliver beautiful web-based customized links with secure visual tracking metrics.",
                  },
                ].map((item, id) => (
                  <div key={id} className="relative p-6 border border-slate-100 rounded-2xl bg-slate-50 shadow-2xs">
                    <span className="absolute -top-3.5 left-4 px-2 bg-indigo-600 text-white rounded-lg text-xs font-mono font-bold py-1">
                      {item.step}
                    </span>
                    <h3 className="font-bold font-display text-slate-900 mt-2 mb-2">{item.title}</h3>
                    <p className="text-slate-500 text-xs leading-relaxed">{item.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* Security & Data Privacy Guarantee Section */}
          <section className="bg-slate-100/50 border-b border-slate-200 py-16 px-6 sm:px-12">
            <div className="max-w-4xl mx-auto text-left">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
                <div>
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-indigo-50 border border-indigo-150 text-indigo-700 font-bold rounded-xl text-[10px] font-mono uppercase tracking-wider mb-4">
                    <ShieldCheck className="w-3.5 h-3.5 text-indigo-650 animate-pulse" />
                    Enterprise-Grade Protection
                  </div>
                  <h2 className="text-2xl sm:text-3xl font-black font-display text-slate-950 tracking-tight mb-4">
                    Your client data is private, secure, and protected.
                  </h2>
                  <p className="text-slate-550 text-xs sm:text-sm leading-relaxed mb-6 font-sans">
                    Agencies trust ReportIQ because we place security and integrity at the heart of our platform. We enforce strict data policies to ensure your agency output and client metrics are shielded.
                  </p>
                  
                  <div className="flex items-center gap-4">
                    <div className="px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-center shadow-3xs">
                      <span className="block text-slate-900 font-extrabold text-sm leading-none mb-1">AES-256</span>
                      <span className="text-[9px] font-bold font-mono text-slate-400 uppercase tracking-wider">Database Keys</span>
                    </div>
                    <div className="px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-center shadow-3xs">
                      <span className="block text-slate-900 font-extrabold text-sm leading-none mb-1">SSL/TLS</span>
                      <span className="text-[9px] font-bold font-mono text-slate-400 uppercase tracking-wider">Secure Transit</span>
                    </div>
                    <div className="px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-center shadow-3xs">
                      <span className="block text-slate-900 font-extrabold text-sm leading-none mb-1">GDPR Compliant</span>
                      <span className="text-[9px] font-bold font-mono text-slate-400 uppercase tracking-wider">Data Protection</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  {[
                    {
                      title: "Zero LLM Training Data Use",
                      desc: "We strictly enforce a zero-retention policy with our LLM partners. Your custom client logs, agency descriptions, and metrics are never used to train public AI models."
                    },
                    {
                      title: "Isolated Supabase Databases",
                      desc: "All client records and report details are stored using secure Row Level Security (RLS) configurations, ensuring complete tenant isolation and data protection."
                    },
                    {
                      title: "Your Brand, Your IP",
                      desc: "All generated reports are 100% your proprietary assets. When you export or share them, they carry your agency branding and authority with no system traces."
                    }
                  ].map((feat, idx) => (
                    <div key={idx} className="bg-white border border-slate-205 p-5 rounded-2xl shadow-3xs flex gap-4 text-left">
                      <div className="w-8 h-8 bg-emerald-50 border border-emerald-100 rounded-lg flex items-center justify-center text-emerald-600 shrink-0 mt-0.5">
                        <Check className="w-4 h-4" />
                      </div>
                      <div>
                        <h4 className="font-extrabold text-sm text-slate-900 leading-snug mb-1">{feat.title}</h4>
                        <p className="text-slate-500 text-xs leading-relaxed">{feat.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </section>

          {/* Value Demonstration Section */}
          <section className="bg-white border-b border-slate-200 py-20 px-6 sm:px-12">
            <div className="max-w-5xl mx-auto">
              <h2 className="text-3xl font-black font-display text-slate-950 text-center mb-3">
                See what ReportIQ generates in 30 seconds
              </h2>
              <p className="text-slate-550 text-xs font-mono uppercase tracking-wider text-center mb-16">
                Real AI generated report example — this is what your clients receive
              </p>

              {/* Mock Report Preview Card */}
              <div className="max-w-3xl mx-auto border border-slate-200 rounded-3xl shadow-lg overflow-hidden bg-slate-50/50 mb-10 text-left font-sans">
                {/* Purple brand bar */}
                <div className="h-2.5 w-full bg-indigo-650 shrink-0"></div>
                
                <div className="p-6 sm:p-10">
                  <div className="flex flex-col gap-4 mb-6 pb-6 border-b border-slate-200">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white shadow-xs">
                        <FileText className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="font-bold text-slate-955 font-display tracking-tight text-base leading-tight">Smith Digital Agency</p>
                        <p className="text-[10px] text-slate-500 font-mono">CLIENT PORTAL PREVIEW</p>
                      </div>
                    </div>
                    <h3 className="text-xl sm:text-2xl font-extrabold font-display text-slate-955 tracking-tight leading-normal mt-2">
                      Monthly Marketing Performance Report
                    </h3>
                    <div className="flex flex-wrap items-center gap-x-6 gap-y-2 mt-1 text-xs sm:text-sm text-slate-500">
                      <span className="flex items-center gap-1.5">
                        <Building2 className="w-4 h-4 text-slate-400" />
                        Client partner: Acme Store
                      </span>
                      <span className="flex items-center gap-1.5">
                        <Calendar className="w-4 h-4 text-slate-400" />
                        Period: May 2026
                      </span>
                    </div>
                  </div>

                  {/* Executive Summary */}
                  <div className="bg-white rounded-2xl border border-slate-200 p-6 mb-6 shadow-3xs relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-1.5 h-full bg-indigo-600" />
                    <div className="absolute top-4 right-4 bg-indigo-50 text-indigo-750 text-[9px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded">
                      AI Executive Summary
                    </div>
                    <h4 className="font-display font-bold text-slate-900 mb-2 text-sm sm:text-base">Executive Summary</h4>
                    <p className="text-slate-700 leading-relaxed text-xs sm:text-sm italic">
                      "This month we achieved significant growth across all key performance areas. Organic traffic increased by 47% following our technical SEO improvements and content publishing strategy. The Google Ads campaign delivered a 3.2x return on ad spend, our strongest performance this quarter."
                    </p>
                  </div>

                  {/* Work sections */}
                  <div className="space-y-5">
                    {[
                      {
                        title: "Work Completed This Period",
                        content: "Published 8 SEO optimized blog posts targeting high volume keywords. Fixed 23 technical SEO errors identified in our site audit. Built 14 high quality backlinks from domain authority 40+ websites. Redesigned the product pages to improve conversion rate."
                      },
                      {
                        title: "Key Results and Metrics",
                        content: "Organic traffic: 14,200 visitors (+47% vs last month). Google Ads ROAS: 3.2x. Conversion rate: 2.8% (up from 1.9%). 6 keywords now ranking on page 1 of Google. Email open rate: 34%."
                      },
                      {
                        title: "Coming Up Next Month",
                        content: "Launch the loyalty rewards program. Begin Instagram and TikTok paid advertising. A/B test two new landing page designs. Expand Google Ads to 3 additional cities."
                      }
                    ].map((section, idx) => (
                      <div key={idx} className="bg-white rounded-2xl border-y border-r border-l-[6px] border-slate-200 p-6 shadow-3xs" style={{ borderLeftColor: "#4f46e5" }}>
                        <div className="flex items-center gap-3 mb-3">
                          <div className="w-7 h-7 bg-indigo-50 rounded-lg flex items-center justify-center shrink-0">
                            <Check className="w-4 h-4 text-indigo-650" />
                          </div>
                          <h4 className="text-sm sm:text-base font-bold font-display text-slate-955">
                            {section.title}
                          </h4>
                        </div>
                        <p className="text-slate-700 leading-relaxed text-xs sm:text-sm pl-10 whitespace-pre-wrap">
                          {section.content}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="text-center space-y-4">
                <p className="text-slate-550 text-xs sm:text-sm font-medium">
                  This report was generated in 28 seconds from rough bullet points.
                </p>
                <button
                  onClick={() => {
                    setAuthError(null);
                    setShowAuthForm("signup");
                  }}
                  className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 hover:shadow-md text-white font-bold leading-none text-xs sm:text-sm rounded-xl transition-all inline-flex items-center gap-2 cursor-pointer shadow-sm border-none animate-pulse"
                >
                  Try It Free
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </section>

          {/* Simulated pricing bento layout block */}
          <section id="pricing-section" className="py-20 px-6 sm:px-12 max-w-5xl mx-auto text-center">
            <h2 className="text-2xl sm:text-3.5xl font-black font-display text-slate-955 mb-3">
              Humble and transparent plans
            </h2>
            <p className="text-slate-550 text-xs font-mono uppercase tracking-wider mb-12">
              Scale client registry quotas dynamically
            </p>

            {/* Billing Cycle Toggle */}
            <div className="flex items-center justify-center gap-3 mb-12">
              <button
                type="button"
                onClick={() => setBillingCycle("monthly")}
                className={`px-4 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                  billingCycle === "monthly"
                    ? "bg-slate-900 text-white shadow-sm"
                    : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
                }`}
              >
                Monthly Billing
              </button>
              <button
                type="button"
                onClick={() => setBillingCycle("lifetime")}
                className={`px-4 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer relative ${
                  billingCycle === "lifetime"
                    ? "bg-indigo-650 text-white shadow-sm"
                    : "bg-white text-indigo-600 border border-slate-200 hover:bg-slate-50"
                }`}
              >
                Lifetime Access (Save 90%)
                <span className="absolute -top-3 -right-3 bg-red-500 text-white text-[8px] px-1.5 py-0.5 rounded-full uppercase tracking-wider font-extrabold animate-bounce">
                  Hot
                </span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-left items-center max-w-5xl mx-auto">
              {[
                {
                  title: "Free Plan",
                  price: "$0",
                  periodLabel: "/ forever",
                  limit: "Basic consulting features",
                  feats: [
                    "3 reports per month",
                    "2 active clients",
                    "Manual notes input",
                    "Upload document to generate report",
                    "Shareable public report link",
                    "Basic agency name on reports",
                    "AI Support Chat",
                    "Report filtering and sorting"
                  ],
                  buttonText: "Select Free Plan",
                  planKey: "free" as const,
                },
                {
                  title: billingCycle === "lifetime" ? "Starter Lifetime" : "Starter Plan",
                  price: billingCycle === "lifetime" ? "$49" : "$29",
                  periodLabel: billingCycle === "lifetime" ? "one-time payment" : "/ month",
                  limit: billingCycle === "lifetime" ? "Lifetime access for freelancers" : "Perfect for freelancers",
                  feats: [
                    "20 reports per month",
                    "10 active clients",
                    "Everything in Free plus:",
                    "Custom brand logo on all reports",
                    "Image, document & link attachments",
                    "Different report tones & lengths",
                    "AI powered section writer",
                    "Priority email support"
                  ],
                  buttonText: billingCycle === "lifetime" ? "Get Lifetime Starter" : "Select Starter Plan",
                  planKey: "starter" as const,
                  badgeText: billingCycle === "lifetime" ? "Popular" : undefined,
                },
                {
                  title: billingCycle === "lifetime" ? "Pro Lifetime" : "Pro Plan",
                  price: billingCycle === "lifetime" ? "$99" : "$79",
                  periodLabel: billingCycle === "lifetime" ? "one-time payment" : "/ month",
                  limit: billingCycle === "lifetime" ? "Lifetime access for agencies" : "For scaling agencies",
                  feats: [
                    "Unlimited reports",
                    "Unlimited clients",
                    "Everything in Starter plus:",
                    "White label — zero ReportIQ branding",
                    "Report analytics & view logs",
                    "Client feedback log viewer",
                    "Client portal logins",
                    "Priority 24h support",
                    "Branded agency URLs"
                  ],
                  buttonText: billingCycle === "lifetime" ? "Get Lifetime Pro" : "Upgrade to Pro",
                  planKey: "pro" as const,
                  featured: true, // Pro plan card stands out
                  badgeText: billingCycle === "lifetime" ? "Highly Recommended" : "Best Value"
                },
              ].map((card, i) => (
                <div
                  key={i}
                  className={`border rounded-3xl p-6 flex flex-col justify-between transition-all duration-300 ${
                    card.featured 
                      ? "bg-slate-900 text-white border-indigo-500 shadow-xl scale-105 min-h-[460px] relative z-10" 
                      : "bg-white text-slate-700 border-slate-200 shadow-2xs hover:shadow-md min-h-[420px]"
                  }`}
                >
                  {card.badgeText && (
                    <div className="absolute -top-3.5 left-1/2 transform -translate-x-1/2 bg-indigo-600 text-white text-[10px] font-mono leading-none tracking-widest uppercase font-bold px-3 py-1.5 rounded-full shadow-sm">
                      {card.badgeText}
                    </div>
                  )}
                  <div>
                    <div className="flex items-center justify-between">
                      <span className={`font-bold font-display text-lg ${card.featured ? "text-white" : "text-slate-955"}`}>{card.title}</span>
                    </div>
                    <p className={`text-[10px] font-mono mt-1 ${card.featured ? "text-indigo-300" : "text-slate-400"}`}>{card.limit}</p>
                    <div className="my-5">
                      <span className={`text-3xl font-extrabold font-display ${card.featured ? "text-white" : "text-slate-950"}`}>{card.price}</span>
                      <span className={`text-xs font-mono ${card.featured ? "text-slate-400" : "text-slate-400"}`}> {card.periodLabel}</span>
                    </div>
 
                    <ul className={`space-y-2 border-t pt-4 ${card.featured ? "border-slate-800" : "border-slate-100"}`}>
                      {card.feats.map((f, id) => (
                        <li key={id} className="flex gap-2 text-xs leading-normal font-sans">
                          <Check className={`w-4 h-4 shrink-0 mt-0.5 ${card.featured ? "text-indigo-400" : "text-emerald-500"}`} />
                          <span className={card.featured ? "text-slate-350" : "text-slate-650"}>{f}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
 
                  <button
                    onClick={() => {
                      setSelectedPlan(card.planKey);
                      setAuthError(null);
                      setShowAuthForm("signup");
                    }}
                    className={`w-full mt-6 py-2.5 font-semibold text-xs rounded-xl shadow-xs cursor-pointer text-center transition-all ${
                      card.featured 
                        ? "bg-indigo-600 hover:bg-indigo-700 text-white" 
                        : "bg-indigo-50 hover:bg-indigo-100 text-indigo-750 font-bold"
                    }`}
                  >
                    {card.buttonText}
                  </button>
                </div>
              ))}
            </div>
          </section>
        </main>

        <footer className="bg-white border-t border-slate-200 py-10 text-center text-xs text-slate-400">
          <div className="max-w-6xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
            <p>© 2026 ReportIQ · Professional Intelligent Client Portals</p>
            <div className="flex items-center gap-5 flex-wrap justify-center font-semibold text-slate-555">
              <a
                href="/features"
                onClick={(e) => {
                  e.preventDefault();
                  setActiveMarketingPage("features");
                  window.history.pushState(null, "", "/features");
                  window.dispatchEvent(new PopStateEvent('popstate'));
                }}
                className="hover:text-indigo-600 transition-colors cursor-pointer no-underline"
              >
                Features
              </a>
              <a
                href="/about"
                onClick={(e) => {
                  e.preventDefault();
                  setActiveMarketingPage("about");
                  window.history.pushState(null, "", "/about");
                  window.dispatchEvent(new PopStateEvent('popstate'));
                }}
                className="hover:text-indigo-600 transition-colors cursor-pointer no-underline"
              >
                About Us
              </a>
              <a
                href="/contact"
                onClick={(e) => {
                  e.preventDefault();
                  setContactSuccess(false);
                  setActiveMarketingPage("contact");
                  window.history.pushState(null, "", "/contact");
                  window.dispatchEvent(new PopStateEvent('popstate'));
                }}
                className="hover:text-indigo-600 transition-colors cursor-pointer no-underline"
              >
                Contact
              </a>
              <a
                href="/docs"
                onClick={(e) => {
                  e.preventDefault();
                  setDocsActiveTab("guide");
                  setOpenFaqIndex(null);
                  setActiveMarketingPage("docs");
                  window.history.pushState(null, "", "/docs");
                  window.dispatchEvent(new PopStateEvent('popstate'));
                }}
                className="hover:text-indigo-600 transition-colors cursor-pointer no-underline"
              >
                Documentation
              </a>
              <a
                href="/blog"
                onClick={(e) => {
                  e.preventDefault();
                  setActiveBlogRoute("/blog");
                  setActiveToolRoute(null);
                  window.history.pushState(null, "", "/blog");
                  window.dispatchEvent(new PopStateEvent('popstate'));
                }}
                className="hover:text-indigo-600 transition-colors cursor-pointer no-underline"
              >
                Blog
              </a>
              <a
                href="/tools"
                onClick={(e) => {
                  e.preventDefault();
                  setActiveToolRoute("/tools");
                  setActiveBlogRoute(null);
                  window.history.pushState(null, "", "/tools");
                  window.dispatchEvent(new PopStateEvent('popstate'));
                }}
                className="hover:text-indigo-600 transition-colors cursor-pointer font-bold text-indigo-600 no-underline"
              >
                Free Tools
              </a>
              <a
                href="/privacy"
                onClick={(e) => {
                  e.preventDefault();
                  setActiveMarketingPage("privacy");
                  window.history.pushState(null, "", "/privacy");
                  window.dispatchEvent(new PopStateEvent('popstate'));
                }}
                className="hover:text-indigo-600 transition-colors cursor-pointer no-underline"
              >
                Privacy Policy
              </a>
              <a
                href="/terms"
                onClick={(e) => {
                  e.preventDefault();
                  setActiveMarketingPage("terms");
                  window.history.pushState(null, "", "/terms");
                  window.dispatchEvent(new PopStateEvent('popstate'));
                }}
                className="hover:text-indigo-600 transition-colors cursor-pointer no-underline"
              >
                Terms of Service
              </a>
            </div>
          </div>
        </footer>

        {/* Auth Floating Modal cards */}
        {showAuthForm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/45 animate-fade-in backdrop-blur-xs">
            <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-md p-6 shadow-xl relative animate-scale-up">
              <button
                onClick={() => {
                  setAuthError(null);
                  setSignupSuccess(false);
                  setResendMessage(null);
                  setShowAuthForm(null);
                }}
                className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-50 cursor-pointer"
              >
                <Plus className="w-5 h-5 rotate-45 transform" />
              </button>

              <div className="flex items-center gap-2 mb-2">
                <FileText className="w-5 h-5 text-indigo-600" />
                <h3 className="text-lg font-bold font-display text-slate-950">
                  {signupSuccess ? "Verify Email" : showAuthForm === "signup" ? "Create Account" : showAuthForm === "forgot" ? "Reset Password" : "Access Platform"}
                </h3>
              </div>
              <p className="text-xs text-slate-500 mb-6">
                {signupSuccess
                  ? "Your account verification link has been sent"
                  : showAuthForm === "signup"
                  ? "Onboard your agency brand metrics in seconds and compose free"
                  : showAuthForm === "forgot"
                  ? "Enter your email address to receive a password reset link."
                  : "Welcome back! Enter credentials to continue"}
              </p>

              {authError && (
                <div className="mb-4 space-y-2">
                  <div className="p-3.5 bg-red-50 border border-red-100 text-red-700 text-xs font-medium rounded-xl flex gap-1.5 items-start">
                    <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5" />
                    <span className="leading-relaxed text-left">{authError}</span>
                  </div>
                  {authError.includes("confirmation email") && (
                    <button
                      type="button"
                      onClick={handleResendConfirmation}
                      disabled={resending}
                      className="w-full py-2 px-3 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-semibold text-xs rounded-lg transition-all border border-indigo-200 cursor-pointer flex items-center justify-center gap-1.5 shadow-sm"
                    >
                      {resending ? (
                        <>
                          <div className="w-3.5 h-3.5 border-2 border-indigo-750 border-t-transparent rounded-full animate-spin"></div>
                          Resending verification link...
                        </>
                      ) : resendMessage ? (
                        resendMessage
                      ) : (
                        "Resend confirmation email"
                      )}
                    </button>
                  )}
                </div>
              )}

              {signupSuccess ? (
                <div className="space-y-5 py-2 text-center font-sans">
                  <div className="w-12 h-12 bg-green-50 text-green-600 rounded-full flex items-center justify-center mx-auto border border-green-100">
                    <Check className="w-6 h-6" />
                  </div>
                  <div className="space-y-2">
                    <h4 className="text-sm font-bold text-slate-900">Account created!</h4>
                    <p className="text-xs text-slate-500 leading-relaxed max-w-sm mx-auto">
                      Please check your email and click the confirmation link, then come back to sign in.
                    </p>
                  </div>
                  <div className="pt-3">
                    <button
                      type="button"
                      onClick={() => {
                        setSignupSuccess(false);
                        setAuthError(null);
                        setResendMessage(null);
                        setShowAuthForm("login");
                      }}
                      className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-xs transition-all cursor-pointer text-center"
                    >
                      Go to Sign In
                    </button>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleAuthSubmit} className="space-y-4 font-sans text-sm">
                  {showAuthForm === "signup" && (
                    <>
                      <div>
                        <label className="block text-xs font-bold font-mono uppercase tracking-wider text-slate-500 mb-1.5">
                          Author Full Name
                        </label>
                        <div className="relative">
                          <User className="absolute left-3 top-3.5 w-4 h-4 text-slate-400" />
                          <input
                            type="text"
                            required
                            placeholder="e.g. Jane Smith"
                            value={authFullName}
                            onChange={e => setAuthFullName(e.target.value)}
                            className="w-full rounded-xl border border-slate-200 bg-slate-50/50 outline-none p-2.5 pl-10 focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-bold font-mono uppercase tracking-wider text-slate-500 mb-1.5">
                          Agency / Freelancer Title *
                        </label>
                        <div className="relative">
                          <Building className="absolute left-3 top-3.5 w-4 h-4 text-slate-400" />
                          <input
                            type="text"
                            required
                            placeholder="e.g. Smith Digital"
                            value={authAgencyName}
                            onChange={e => setAuthAgencyName(e.target.value)}
                            className="w-full rounded-xl border border-slate-200 bg-slate-50/50 outline-none p-2.5 pl-10 focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100"
                          />
                        </div>
                      </div>
                    </>
                  )}

                  <div>
                    <label className="block text-xs font-bold font-mono uppercase tracking-wider text-slate-500 mb-1.5">
                      Email Address *
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-3.5 w-4 h-4 text-slate-400" />
                      <input
                        type="email"
                        required
                        placeholder="e.g. jane@smith.com"
                        value={authEmail}
                        onChange={e => setAuthEmail(e.target.value)}
                        className="w-full rounded-xl border border-slate-200 bg-slate-50/50 outline-none p-2.5 pl-10 focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100"
                      />
                    </div>
                  </div>

                  {showAuthForm !== "forgot" && (
                    <div>
                      <div className="flex justify-between items-center mb-1.5">
                        <label className="block text-xs font-bold font-mono uppercase tracking-wider text-slate-500">
                          Account Password *
                        </label>
                        {showAuthForm === "login" && (
                          <button
                            type="button"
                            onClick={() => {
                              setAuthError(null);
                              setShowAuthForm("forgot");
                            }}
                            className="text-[10px] text-indigo-600 hover:underline font-semibold cursor-pointer"
                          >
                            Forgot Password?
                          </button>
                        )}
                      </div>
                      <div className="relative">
                        <Lock className="absolute left-3 top-3.5 w-4 h-4 text-slate-400" />
                        <input
                          type="password"
                          required
                          placeholder="Min. 6 alphanumeric"
                          value={authPassword}
                          onChange={e => setAuthPassword(e.target.value)}
                          className="w-full rounded-xl border border-slate-200 bg-slate-50/50 outline-none p-2.5 pl-10 focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100"
                          minLength={6}
                        />
                      </div>
                    </div>
                  )}

                  <div className="pt-2">
                    <button
                      type="submit"
                      disabled={authSubmitting}
                      className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-sm transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      {authSubmitting ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                          Connecting...
                        </>
                      ) : showAuthForm === "signup" ? (
                        "Register Onboard & Start"
                      ) : showAuthForm === "forgot" ? (
                        "Send Reset Link"
                      ) : (
                        "Access Portal Workspace"
                      )}
                    </button>
                  </div>

                  <div className="pt-2.5 border-t border-slate-100 text-center text-xs text-slate-500">
                    {showAuthForm === "signup" ? (
                      <span>
                        Already have an account?{" "}
                        <button
                          type="button"
                          onClick={() => {
                            setAuthError(null);
                            setSignupSuccess(false);
                            setResendMessage(null);
                            setShowAuthForm("login");
                          }}
                          className="text-indigo-600 hover:underline font-semibold cursor-pointer"
                        >
                          Sign In &rarr;
                        </button>
                      </span>
                    ) : showAuthForm === "forgot" ? (
                      <span>
                        Back to{" "}
                        <button
                          type="button"
                          onClick={() => {
                            setAuthError(null);
                            setShowAuthForm("login");
                          }}
                          className="text-indigo-600 hover:underline font-semibold cursor-pointer"
                        >
                          Sign In &rarr;
                        </button>
                      </span>
                    ) : (
                      <span>
                        Are you a new provider?{" "}
                        <button
                          type="button"
                          onClick={() => {
                            setAuthError(null);
                            setSignupSuccess(false);
                            setResendMessage(null);
                            setShowAuthForm("signup");
                          }}
                          className="text-indigo-600 hover:underline font-semibold cursor-pointer"
                        >
                          Create Account &rarr;
                        </button>
                      </span>
                    )}
                  </div>
                </form>
              )}
            </div>
          </div>
        )}

        {/* Marketing pages floating modal overlay */}
        {activeMarketingPage && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/45 animate-fade-in backdrop-blur-xs">
            <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-2xl p-8 shadow-2xl relative animate-scale-up text-sm font-sans max-h-[85vh] overflow-y-auto">
              <button
                onClick={() => {
                  setActiveMarketingPage(null);
                  setContactSuccess(false);
                  window.history.pushState(null, "", "/");
                }}
                className="absolute top-6 right-6 text-slate-400 hover:text-slate-600 p-1.5 rounded-xl hover:bg-slate-50 cursor-pointer transition-colors"
                title="Close"
              >
                <X className="w-5 h-5" />
              </button>

              {activeMarketingPage === "about" && (
                <div>
                  <div className="flex items-center gap-3.5 mb-4 text-left">
                    <div className="p-3 bg-indigo-50 border border-indigo-100 rounded-2xl text-indigo-650 shrink-0">
                      <FileText className="w-6 h-6" />
                    </div>
                    <div>
                      <span className="text-xs font-bold font-mono tracking-widest text-indigo-600 uppercase">Our Mission</span>
                      <h3 className="text-xl font-bold font-display text-slate-950">About ReportIQ</h3>
                    </div>
                  </div>
                  <h4 className="text-sm font-bold text-slate-800 mb-2 leading-relaxed text-left">
                    Automated report delivery, built for fast-moving client teams & creative freelancers.
                  </h4>
                  <p className="text-slate-550 leading-relaxed mb-6 text-xs text-left">
                    ReportIQ was established to eliminate the tedious admin burden of manual agency report writing. 
                    We believe consulting and support teams should spend their time aligning strategy and producing results—not copying and pasting metrics into formatted tables or drafting summaries.
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 border-t border-slate-100 pt-6 text-left">
                    <div className="p-4 bg-slate-50 border border-slate-100 rounded-2xl">
                      <span className="text-indigo-600 font-bold text-lg">01.</span>
                      <h5 className="font-bold text-xs text-slate-900 mt-1 mb-1">Seamless Process</h5>
                      <p className="text-slate-450 text-[11px] leading-normal">
                        Import client metrics and records directly from your preferred project trackers and data engines.
                      </p>
                    </div>
                    <div className="p-4 bg-slate-50 border border-slate-100 rounded-2xl">
                      <span className="text-indigo-600 font-bold text-lg">02.</span>
                      <h5 className="font-bold text-xs text-slate-900 mt-1 mb-1">Tailored AI Drafting</h5>
                      <p className="text-slate-450 text-[11px] leading-normal">
                        Our intelligent text model drafts executive summaries, structured milestones, and key metrics in seconds.
                      </p>
                    </div>
                    <div className="p-4 bg-slate-50 border border-slate-100 rounded-2xl">
                      <span className="text-indigo-600 font-bold text-lg">03.</span>
                      <h5 className="font-bold text-xs text-slate-900 mt-1 mb-1">Premium White-Labeling</h5>
                      <p className="text-slate-450 text-[11px] leading-normal">
                        Publish public-facing branded hosting links that align flawlessly with your client's agency theme.
                      </p>
                    </div>
                    <div className="p-4 bg-slate-50 border border-slate-100 rounded-2xl">
                      <span className="text-indigo-600 font-bold text-lg">04.</span>
                      <h5 className="font-bold text-xs text-slate-900 mt-1 mb-1">Custody & Protection</h5>
                      <p className="text-slate-450 text-[11px] leading-normal">
                        Strict data protection guidelines mean your metric states are guarded securely and never trained upon.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {activeMarketingPage === "contact" && (
                <div>
                  <div className="flex items-center gap-3.5 mb-4 text-left">
                    <div className="p-3 bg-indigo-50 border border-indigo-100 rounded-2xl text-indigo-650 shrink-0">
                      <Mail className="w-6 h-6" />
                    </div>
                    <div>
                      <span className="text-xs font-bold font-mono tracking-widest text-indigo-600 uppercase">Support Center</span>
                      <h3 className="text-xl font-bold font-display text-slate-950">Contact Our Team</h3>
                    </div>
                  </div>
                  <p className="text-slate-550 mb-6 text-xs leading-relaxed text-left">
                    Have questions about customized integrations, agency scale limits, or white-label hosting? 
                    Get in touch with our Support team. Drop us a note below or reach us directly at <strong className="text-slate-900 font-semibold font-mono text-[11px]">support@reportiq.xyz</strong>.
                  </p>

                  {contactSuccess ? (
                    <div className="p-6 bg-emerald-50 border border-emerald-100 rounded-2xl text-center">
                      <span className="text-xs font-bold font-mono text-emerald-700 block mb-1">✓ SUBMISSION SUCCESSFUL</span>
                      <p className="text-xs text-emerald-600 leading-normal">
                        Thank you! Your message has been received properly. An account manager will review and reply via email within 4 business hours.
                      </p>
                    </div>
                  ) : (
                    <div className="pt-2">
                      <a
                        href="https://mail.google.com/mail/?view=cm&fs=1&to=support@reportiq.xyz&su=ReportIQ%20Support%20Inquiry&body=Hi%20ReportIQ%20Support%20Team%2C%0A%0AI%20have%20an%20inquiry%20regarding%20ReportIQ%3A%0A%0A%5BEnter%20your%20message%20here%5D%0A%0ABest%20regards%2C"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-750 text-white font-bold rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer shadow-sm text-xs text-center border-none no-underline hover:text-white"
                      >
                        <Mail className="w-4 h-4 shrink-0 text-indigo-200" />
                        Open Gmail to Email Us
                      </a>
                    </div>
                  )}
                </div>
              )}

              {activeMarketingPage === "privacy" && (
                <div className="text-xs text-left">
                  <div className="flex items-center gap-3.5 mb-4 border-b border-slate-100 pb-4">
                    <div className="p-3 bg-indigo-50 border border-indigo-100 rounded-2xl text-indigo-650 shrink-0">
                      <ShieldCheck className="w-6 h-6 text-indigo-600" />
                    </div>
                    <div>
                      <span className="text-xs font-bold font-mono tracking-widest text-indigo-600 uppercase">Information Security</span>
                      <h3 className="text-xl font-bold font-display text-slate-950">Privacy Policy</h3>
                    </div>
                  </div>
                  <div className="space-y-4 text-slate-550 leading-relaxed">
                    <p>
                      At ReportIQ, we treat your agency and client information with absolute integrity. This Privacy Policy details how we structure, process, and secure the metadata ingested into our secure systems.
                    </p>
                    <div>
                      <h4 className="font-bold text-slate-800 uppercase tracking-wider text-[10px] mb-1">1. Information Custody</h4>
                      <p>
                        We collect only critical reference points (such as project milestones, client tags, and custom metadata) required to draft, store, and serve client reports. We never extract client lists or integration fields for alternative services.
                      </p>
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-800 uppercase tracking-wider text-[10px] mb-1">2. Strict Zero Data Sales</h4>
                      <p>
                        Your internal workspace data is completely private to you. We strictly do not sell, license, transfer, or commercialize your report metrics, client logs, or agency statistics to any analytics bureaus or third parties.
                      </p>
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-850 uppercase tracking-wider text-[10px] mb-1">3. Robust Server Safeguards</h4>
                      <p>
                        All databases are protected with AES-256 standard encryption keys. SSL/TLS connections shield all data packets transmitted between your agency devices and our databases.
                      </p>
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-850 uppercase tracking-wider text-[10px] mb-1">4. Generative AI Safety Rules</h4>
                      <p>
                        When summarizing data, our models adhere to strict zero-retention policies. Your private enterprise details or client metrics are never utilized to train public machine learning datasets.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {activeMarketingPage === "terms" && (
                <div className="text-xs text-left">
                  <div className="flex items-center gap-3.5 mb-4 border-b border-slate-100 pb-4">
                    <div className="p-3 bg-indigo-50 border border-indigo-100 rounded-2xl text-indigo-650 shrink-0">
                      <Globe className="w-6 h-6 text-indigo-600" />
                    </div>
                    <div>
                      <span className="text-xs font-bold font-mono tracking-widest text-indigo-600 uppercase">Usage Guidelines</span>
                      <h3 className="text-xl font-bold font-display text-slate-950">Terms of Service</h3>
                    </div>
                  </div>
                  <div className="space-y-4 text-slate-550 leading-relaxed text-left">
                    <p>
                      By accessing the ReportIQ hosting portal, you and your agency accept our service rules and usage guidelines. Please read them thoroughly.
                    </p>
                    <div>
                      <h4 className="font-bold text-slate-800 uppercase tracking-wider text-[10px] mb-1">1. Lawful client Processing</h4>
                      <p>
                        You represents that you possess explicit consent and appropriate clearances to process and publish materials containing representative metrics, metrics tracking, or personal identifiers of any client registered in your workspace.
                      </p>
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-800 uppercase tracking-wider text-[10px] mb-1">2. Fair Service Usage Limits</h4>
                      <p>
                        To ensure optimal system performance, we enforce fair rate limit boundaries matching your active subscription tier. Automated compilation tools or crawler scrapers are strictly prohibited.
                      </p>
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-800 uppercase tracking-wider text-[10px] mb-1">3. Security Responsibilities</h4>
                      <p>
                        You are solely responsible for maintaining the privacy of session credentials, and unlinking active seats or reports when terminating relationships with external clients.
                      </p>
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-800 uppercase tracking-wider text-[10px] mb-1">4. Ownership Rights</h4>
                      <p>
                        All executive outputs, white-label properties, report PDFs, metrics graphs, and shared folders completed through your workspace remain 100% your team’s proprietary asset.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {activeMarketingPage === "docs" && (
                <div className="text-xs text-left">
                  <div className="flex items-center gap-3.5 mb-6 border-b border-slate-100 pb-4">
                    <div className="p-3 bg-indigo-50 border border-indigo-100 rounded-2xl text-indigo-650 shrink-0">
                      <Compass className="w-6 h-6 text-indigo-600" />
                    </div>
                    <div>
                      <span className="text-xs font-bold font-mono tracking-widest text-indigo-600 uppercase">Knowledge Base</span>
                      <h3 className="text-xl font-bold font-display text-slate-950">ReportIQ Documentation Hub</h3>
                    </div>
                  </div>

                  {/* Tabs Selector Navigation */}
                  <div className="flex gap-1.5 p-1 bg-slate-50 border border-slate-200/60 rounded-xl mb-6 font-semibold">
                    <button
                      type="button"
                      onClick={() => setDocsActiveTab("guide")}
                      className={`flex-1 py-2 text-center rounded-lg transition-all cursor-pointer ${
                        docsActiveTab === "guide"
                          ? "bg-white text-indigo-650 shadow-2xs font-bold"
                          : "text-slate-500 hover:text-slate-900"
                      }`}
                    >
                      📖 Getting Started
                    </button>
                    <button
                      type="button"
                      onClick={() => setDocsActiveTab("plans")}
                      className={`flex-1 py-2 text-center rounded-lg transition-all cursor-pointer ${
                        docsActiveTab === "plans"
                          ? "bg-white text-indigo-650 shadow-2xs font-bold"
                          : "text-slate-500 hover:text-slate-900"
                      }`}
                    >
                      💎 Plans & Features
                    </button>
                    <button
                      type="button"
                      onClick={() => setDocsActiveTab("faq")}
                      className={`flex-1 py-2 text-center rounded-lg transition-all cursor-pointer ${
                        docsActiveTab === "faq"
                          ? "bg-white text-indigo-650 shadow-2xs font-bold"
                          : "text-slate-500 hover:text-slate-900"
                      }`}
                    >
                      ❓ FAQ Guide
                    </button>
                  </div>

                  {/* Tab Contents */}
                  {docsActiveTab === "guide" && (
                    <div className="space-y-5">
                      <h4 className="text-sm font-bold text-slate-900 mb-1">How to Use ReportIQ (Step-by-Step)</h4>
                      <p className="text-slate-500 leading-relaxed">
                        ReportIQ makes client communication painless. Follow this comprehensive walkthrough to set up your agency workspace, ingest metrics, and deliver beautiful automated reporting dashboards.
                      </p>

                      <div className="space-y-4 pt-2">
                        {[
                          {
                            step: "Step 1",
                            title: "Onboard Clients & Contacts",
                            desc: "Click on the Clients Directory tab in the sidebar. Register new clients by specifying their company title, primary contact emails, and brand logo. Onboarding clients correctly allows ReportIQ to match generated reports to their email accounts and customize portal workspaces."
                          },
                          {
                            step: "Step 2",
                            title: "Input Metric Notes & Attach Documents",
                            desc: "Navigate to the Reports Creator. Select a client, and start drafting report details. You can input text summaries of your weekly accomplishments, key performance indicators (KPIs), or attach supporting links, images, and PDF/TXT documents."
                          },
                          {
                            step: "Step 3",
                            title: "Compile with Advanced Llama AI Models",
                            desc: "Adjust settings like content length target (brief, detailed) and aesthetic tone (casual, professional). Click 'Generate Section with AI' (Starter Plan) to invoke our high-performance Llama compiler, transforming raw notes into fully written business prose summaries."
                          },
                          {
                            step: "Step 4",
                            title: "Share Web Portals & Copy Branded URLs",
                            desc: "Publish your report. Copy the shareable link to send to your clients. For Free/Starter tiers, reports use standard share links. For Pro tier agencies, ReportIQ automatically generates custom-branded URLs matching your agency slug (e.g., /a/your-brand/r/report-slug)."
                          },
                          {
                            step: "Step 5",
                            title: "Review View Analytics & Client Portals",
                            desc: "Visit the View Logs section in the report preview to monitor when clients open your reports. Pro users can also provide a global login link under /portal, letting clients view all active deliverables in one place."
                          }
                        ].map((item, idx) => (
                          <div key={idx} className="flex gap-4 p-3.5 bg-slate-50 border border-slate-100 rounded-2xl">
                            <span className="px-2.5 py-1 bg-indigo-50 border border-indigo-100 text-indigo-750 font-bold rounded-xl text-[10px] h-fit shrink-0">
                              {item.step}
                            </span>
                            <div className="space-y-1">
                              <h5 className="font-bold text-slate-900 text-[11px]">{item.title}</h5>
                              <p className="text-slate-550 leading-relaxed text-[11px]">{item.desc}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {docsActiveTab === "plans" && (
                    <div className="space-y-5">
                      <h4 className="text-sm font-bold text-slate-900 mb-1">Subscription Tiers Comparison Matrix</h4>
                      <p className="text-slate-550 leading-relaxed">
                        Compare capabilities and quotas across each billing tier. Upgrade at any time from your settings panel to unlock advanced reporting properties.
                      </p>

                      <div className="overflow-x-auto border border-slate-200 rounded-2xl bg-white shadow-3xs mt-3">
                        <table className="w-full text-[11px] border-collapse">
                          <thead>
                            <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-mono uppercase tracking-wider text-[9px]">
                              <th className="py-2.5 px-3.5 text-left font-bold border-r border-slate-200">Feature</th>
                              <th className="py-2.5 px-3.5 text-center font-bold border-r border-slate-200">Free ($0)</th>
                              <th className="py-2.5 px-3.5 text-center font-bold border-r border-slate-200 text-indigo-650">Starter ($29)</th>
                              <th className="py-2.5 px-3.5 text-center font-bold text-slate-900">Pro ($79)</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-150 text-slate-700 font-sans">
                            {[
                              { name: "Monthly Report Quota", free: "3 reports", starter: "20 reports", pro: "Unlimited" },
                              { name: "Active Clients Limit", free: "2 clients", starter: "10 clients", pro: "Unlimited" },
                              { name: "Support AI Chat Bot", free: "✓ Standard", starter: "✓ Priority", pro: "✓ 24h Premium Escalation" },
                              { name: "Report Customizations", free: "Standard Options", starter: "Brand logo, tones, lengths", pro: "White-label (Hide ReportIQ branding)" },
                              { name: "AI Section Generator", free: "Locked", starter: "✓ Included", pro: "✓ Included" },
                              { name: "File/Link Attachments", free: "Locked", starter: "✓ Included", pro: "✓ Unlimited" },
                              { name: "Client Portal Login", free: "✗ Not Available", starter: "✗ Not Available", pro: "✓ Unlimited (/portal)" },
                              { name: "Share URLs Branding", free: "Standard /r/:slug", starter: "Standard /r/:slug", pro: "Branded /a/:agency/r/:slug" },
                              { name: "View logs & Analytics", free: "✗ Not Available", starter: "✗ Not Available", pro: "✓ Full logs details" },
                              { name: "Client Feedback Log", free: "✗ Not Available", starter: "✗ Not Available", pro: "✓ Enabled" }
                            ].map((row, i) => (
                              <tr key={i} className="hover:bg-slate-50/50 transition-colors">
                                <td className="py-2 px-3.5 font-bold text-slate-900 border-r border-slate-200 bg-slate-50/10">{row.name}</td>
                                <td className="py-2 px-3.5 text-center border-r border-slate-200 text-slate-500">{row.free}</td>
                                <td className="py-2 px-3.5 text-center border-r border-slate-200 text-indigo-650 font-medium">{row.starter}</td>
                                <td className="py-2 px-3.5 text-center font-bold text-slate-955 bg-indigo-50/10">{row.pro}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                  {docsActiveTab === "faq" && (
                    <div className="space-y-4">
                      <h4 className="text-sm font-bold text-slate-900 mb-1">Frequently Asked Questions</h4>
                      <p className="text-slate-550 leading-relaxed mb-4">
                        Click on any question below to expand details. If you cannot find what you are looking for, contact support@reportiq.xyz.
                      </p>

                      <div className="space-y-3 font-sans">
                        {[
                          {
                            q: "How does the AI report content compiler write summaries?",
                            a: "ReportIQ connects to high-performance generative models (such as Groq Llama text model servers). When you click 'Generate Section with AI', it digests all text notes, milestones, links, and documents uploaded to the client workspace, compiling a professionally structured narrative matching your target lengths and aesthetics."
                          },
                          {
                            q: "Is my client metadata and metrics data secure?",
                            a: "Absolutely. Data security is built into ReportIQ's core. Your data is stored on encrypted Supabase servers and we strictly operate zero-retention API integrations with our LLM providers. Your private logs and client reports are never sold or used for training machine learning models."
                          },
                          {
                            q: "What is the global Client Portal under `/portal`?",
                            a: "The Client Portal is a unified white-labeled hub for Pro users. Instead of sending clients separate share links every month, they can visit your workspace's portal link, authenticate with their email address, and view all active, published reports generated for their account in one clean panel."
                          },
                          {
                            q: "How do custom branded agency URLs function?",
                            a: "For agencies on the Pro Plan, report share links are generated using a premium custom structure: `/a/:agencySlug/r/:slug` instead of `/r/:slug`. This showcases your agency brand name in the address bar, keeping your work white-labeled and professional."
                          },
                          {
                            q: "Can I cancel or upgrade my subscription easily?",
                            a: "Yes. All subscription plans are billed monthly on a cancel-anytime basis. You can manage your subscription, download receipt documents, or change tiers instantly by visiting the 'Settings & Billing' tab inside your dashboard."
                          }
                        ].map((item, idx) => {
                          const open = openFaqIndex === idx;
                          return (
                            <div key={idx} className="border border-slate-200 rounded-2xl bg-white shadow-2xs overflow-hidden transition-all duration-300">
                              <button
                                type="button"
                                onClick={() => setOpenFaqIndex(open ? null : idx)}
                                className="w-full p-4 flex items-center justify-between text-left font-bold text-slate-900 hover:bg-slate-50 cursor-pointer select-none text-[11px] gap-4"
                              >
                                <span>{item.q}</span>
                                <Plus className={`w-4 h-4 text-slate-400 shrink-0 transform transition-transform duration-300 ${open ? "rotate-45 text-indigo-600" : ""}`} />
                              </button>
                              
                              <div className={`transition-all duration-300 ease-in-out ${open ? "max-h-40 border-t border-slate-100" : "max-h-0"} overflow-hidden`}>
                                <div className="p-4 bg-slate-50/50 text-slate-550 leading-relaxed text-[11px]">
                                  {item.a}
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {showStickyCta && !user && (
          <div className="fixed bottom-0 left-0 right-0 z-50 bg-indigo-700 border-t border-indigo-600 text-white shadow-2xl py-4.5 px-6 sm:px-12 flex flex-col sm:flex-row items-center justify-between gap-4 animate-slide-up font-sans">
            <div className="flex items-center gap-3 text-left">
              <div className="w-10 h-10 bg-white/10 border border-white/20 rounded-xl flex items-center justify-center shrink-0">
                <Sparkles className="w-5 h-5 text-indigo-200 animate-pulse" />
              </div>
              <div>
                <h4 className="font-extrabold font-display text-sm sm:text-base leading-tight">
                  Stop writing reports manually.
                </h4>
                <p className="text-indigo-100 text-xs sm:text-sm font-medium">
                  Sign up free in 30 seconds to generate unlimited reports and invite clients to white-labeled portals.
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-4 shrink-0 w-full sm:w-auto">
              <button
                onClick={() => {
                  setAuthError(null);
                  setShowAuthForm("signup");
                }}
                className="w-full sm:w-auto px-6 py-2.5 bg-white text-indigo-700 font-bold rounded-xl hover:bg-indigo-50 shadow-md transition-all cursor-pointer text-xs sm:text-sm text-center border-none animate-pulse"
              >
                Get Started Free &rarr;
              </button>
              <button
                onClick={handleDismissSticky}
                className="text-indigo-200 hover:text-white p-2 rounded-lg hover:bg-white/10 cursor-pointer transition-colors border-none bg-transparent"
                title="Dismiss"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>
        )}
      </div>
    );
  }

  // Calculate reports counts associated with clients
  const reportsCountByClient: Record<string, number> = {};
  reports.forEach(r => {
    reportsCountByClient[r.clientId] = (reportsCountByClient[r.clientId] || 0) + 1;
  });

  // Render Dashboard Layout if Authenticated
  return (
    <div className="flex h-screen bg-slate-50 text-slate-700 font-sans">
      {/* Sidebar navigation drawer */}
      <aside className="w-64 bg-slate-900 text-slate-400 flex flex-col justify-between shrink-0 font-sans shadow-lg">
        <div>
          <div className="flex items-center gap-3 px-6 py-6 border-b border-slate-800">
            <div className="w-9 h-9 bg-indigo-600 rounded-xl flex items-center justify-center text-white shadow-sm shrink-0">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <span className="font-extrabold font-display text-white tracking-tight uppercase text-base">
                ReportIQ
              </span>
              <p className="text-[9px] font-mono text-slate-500 tracking-wider">WORKSPACE NODE</p>
            </div>
          </div>

          <nav className="p-4 space-y-1">
            {[
              { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
              { id: "clients", label: "Clients Directory", icon: Users },
              { id: "reports", label: "Reports Creator", icon: ClipboardList },
              { id: "settings", label: "Settings & Billing", icon: SettingsIcon },
            ].map(item => {
              const active = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    setActiveTab(item.id);
                    if (item.id !== "reports") setSelectedReportId(null);
                  }}
                  className={`w-full flex items-center gap-3 px-4.5 py-3 rounded-xl text-xs font-semibold tracking-wide transition-all cursor-pointer ${
                    active
                      ? "bg-indigo-600 text-white font-bold"
                      : "hover:bg-slate-800 hover:text-white"
                  }`}
                >
                  <item.icon className="w-4 h-4 shrink-0" />
                  {item.label}
                </button>
              );
            })}

            {user && user.email === (process.env.ADMIN_EMAIL || "farooquiumair18@gmail.com") && (
              <button
                onClick={() => {
                  setActiveTab("blog");
                  setActiveBlogRoute(null);
                  window.history.pushState(null, "", "/admin/blog");
                  window.dispatchEvent(new PopStateEvent('popstate'));
                }}
                className={`w-full flex items-center gap-3 px-4.5 py-3 rounded-xl text-xs font-semibold tracking-wide transition-all cursor-pointer ${
                  activeTab === "blog"
                    ? "bg-indigo-600 text-white font-bold"
                    : "hover:bg-slate-800 hover:text-white"
                }`}
              >
                <FileText className="w-4 h-4 shrink-0 text-indigo-400" />
                Blog Manager
              </button>
            )}

            <div className="pt-4 mt-4 border-t border-slate-800/80 px-1">
              <div className="bg-slate-950/40 p-3 rounded-xl border border-slate-800 text-[10px] space-y-2">
                <div className="flex items-center justify-between text-slate-350 font-bold font-mono uppercase tracking-wider">
                  <span>Client Access</span>
                  <span className="inline-flex px-1.5 py-0.5 leading-none bg-indigo-500/20 text-indigo-400 rounded-md border border-indigo-500/20 text-[8px]">
                    Pro Portal
                  </span>
                </div>
                <p className="text-[9px] text-slate-500 leading-normal">
                  Give clients secure portal access to view all active reports.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    const portalUrl = `${window.location.protocol}//${window.location.host}/portal`;
                    navigator.clipboard.writeText(portalUrl);
                    alert("Client Portal link copied to clipboard:\n" + portalUrl);
                  }}
                  className="w-full py-1.5 px-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-lg font-bold transition-all text-[9px] flex items-center justify-center gap-1 cursor-pointer border border-slate-750"
                >
                  <Globe className="w-3.5 h-3.5 text-indigo-400" />
                  Copy Portal Link
                </button>
              </div>
            </div>
          </nav>
        </div>

        {/* profile footer and logout operation triggers */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/20">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full border border-slate-700 bg-slate-800 shrink-0 overflow-hidden flex items-center justify-center">
              {profile?.avatarUrl ? (
                <img src={profile.avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
              ) : (
                <span className="text-white text-xs font-bold font-mono">
                  {(profile?.agencyName || "S")[0].toUpperCase()}
                </span>
              )}
            </div>
            <div className="truncate flex-1">
              <p className="text-white text-xs font-bold leading-tight truncate">
                {profile?.agencyName || "Smith Digital"}
              </p>
              <p className="text-[10px] text-slate-500 font-mono truncate leading-none mt-1">
                {user?.email}
              </p>
            </div>
            <button
              onClick={handleSignOut}
              className="p-1.5 rounded-lg hover:bg-slate-800 hover:text-red-500 cursor-pointer text-slate-400 transition-all shrink-0"
              title="Sign Out Connection"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main panel view dynamic switch */}
      <main className="flex-1 overflow-y-auto p-6 sm:p-10 relative">
        {dataLoading && (
          <div className="absolute top-4 right-4 flex items-center gap-2 font-mono text-[9px] text-indigo-600 bg-indigo-50 border border-indigo-100 p-1.5 px-3 rounded-full animate-pulse shadow-sm z-50">
            <div className="w-1.5 h-1.5 bg-indigo-600 rounded-full animate-ping" />
            SYNCING DATABASE...
          </div>
        )}



        {activeTab === "dashboard" && (
          <Dashboard
            profile={profile}
            clients={clients}
            reports={reports}
            onNavigate={setActiveTab}
            onSelectReportId={setSelectedReportId}
          />
        )}

        {activeTab === "blog" && (
          <BlogAdmin />
        )}

        {activeTab === "clients" && (
          <Clients
            userId={workspaceOwnerId || user.id}
            clients={clients}
            profile={profile}
            reportsCountByClient={reportsCountByClient}
            onRefresh={handleReloadData}
            onUpgrade={triggerUpgrade}
          />
        )}

        {activeTab === "reports" && (
          <Reports
            userId={workspaceOwnerId || user.id}
            reports={reports}
            clients={clients}
            profile={profile}
            activeReportId={selectedReportId}
            onSelectReportId={setSelectedReportId}
            onRefresh={handleReloadData}
            onNavigate={setActiveTab}
            showLock={showLock}
            onUpgrade={triggerUpgrade}
          />
        )}

        {activeTab === "settings" && (
          <Settings
            userId={user.id}
            profile={profile}
            onRefresh={handleReloadData}
            showLock={showLock}
          />
        )}
      </main>

      {/* Elegant payment success or cancelled floating feedback warning toast panel */}
      {paymentBanner && (
        <div className="fixed bottom-24 right-6 z-50 max-w-sm w-full bg-white border border-slate-200 rounded-2xl shadow-xl p-4.5 flex items-start gap-3.5 pr-10 animate-scale-up">
          <button
            onClick={() => setPaymentBanner(null)}
            className="absolute top-3 right-3 text-slate-400 hover:text-slate-650 p-1 rounded-lg hover:bg-slate-50 cursor-pointer"
            title="Dismiss notice"
          >
            <X className="w-4 h-4" />
          </button>
          
          {paymentBanner.type === "success" ? (
            <>
              <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-xl border border-emerald-100 shrink-0 select-none">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div className="font-sans text-xs">
                <h4 className="font-bold text-xs text-slate-950 uppercase tracking-wider font-mono">
                  Plan Activated!
                </h4>
                <p className="text-slate-500 leading-normal mt-1.5">
                  Congratulations! Your ReportIQ <strong className="text-indigo-600 uppercase font-bold tracking-wide">{paymentBanner.plan}</strong> tier privileges are officially active.
                </p>
              </div>
            </>
          ) : (
            <>
              <div className="p-2.5 bg-amber-50 text-amber-600 rounded-xl border border-amber-100 shrink-0 select-none">
                <ShieldAlert className="w-5 h-5" />
              </div>
              <div className="font-sans text-xs">
                <h4 className="font-bold text-xs text-slate-950 uppercase tracking-wider font-mono">
                  Redirection Cancelled
                </h4>
                <p className="text-slate-500 leading-normal mt-1.5">
                  Checkout cancelled. Your agency privileges remain under the limits of the <strong className="text-indigo-600 font-bold uppercase tracking-wide">Free Plan</strong>.
                </p>
              </div>
            </>
          )}
        </div>
      )}

      {/* Persistent AI Support Chat Widget (Bottom Right) */}
      <div className="fixed bottom-6 right-6 z-50 font-sans">
        {chatOpen ? (
          <div className="w-80 h-96 bg-white border border-slate-200 rounded-2xl shadow-2xl flex flex-col justify-between overflow-hidden animate-scale-up text-xs font-sans text-slate-700">
            {/* Header */}
            <div className="bg-indigo-600 text-white p-3 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-1.5 font-bold">
                <Sparkles className="w-4 h-4 animate-pulse" />
                <span>ReportIQ AI Assistant</span>
              </div>
              <button
                onClick={() => setChatOpen(false)}
                className="text-white/80 hover:text-white font-bold text-sm cursor-pointer p-0.5"
              >
                &times;
              </button>
            </div>

            {/* Chat Messages Body */}
            <div className="flex-1 p-3 overflow-y-auto space-y-2 bg-slate-50">
              {chatMessages.map((msg, idx) => {
                const isUser = msg.role === "user";
                return (
                  <div
                    key={idx}
                    className={`flex ${isUser ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`max-w-[80%] p-2 rounded-xl leading-relaxed text-[11px] ${
                        isUser
                          ? "bg-indigo-600 text-white rounded-br-none"
                          : "bg-white border border-slate-200 text-slate-800 rounded-bl-none shadow-3xs"
                      }`}
                    >
                      {msg.content}
                    </div>
                  </div>
                );
              })}
              {chatSending && (
                <div className="flex justify-start">
                  <div className="bg-white border border-slate-200 text-slate-500 rounded-xl rounded-bl-none p-2 shadow-3xs flex items-center gap-1">
                    <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                </div>
              )}
              <div className="pt-2 mt-2 border-t border-slate-100 flex flex-col gap-1.5">
                <span className="text-[9px] font-bold text-slate-450 uppercase tracking-wider text-left">Quick Support Actions:</span>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      const subject = "ReportIQ Support Complaint Request";
                      const bodyText = `From: ${profile?.fullName || 'User'} (${profile?.email || user?.email || 'User Email'})\n\nHi ReportIQ Support Team,\n\nI would like to file a complaint regarding the following issue:\n\n[Enter details of your problem here]\n\nBest regards,`;
                      const url = `https://mail.google.com/mail/?view=cm&fs=1&to=support@reportiq.xyz&su=${encodeURIComponent(subject)}&body=${encodeURIComponent(bodyText)}`;
                      window.open(url, "_blank");
                      setChatMessages(prev => [
                        ...prev,
                        { role: "assistant", content: "✓ Opened Gmail in a new tab to file your complaint to support@reportiq.xyz. Please hit 'Send' in Gmail!" }
                      ]);
                    }}
                    className="flex-1 py-1.5 px-2 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-150 rounded-lg font-bold text-[9px] cursor-pointer flex items-center justify-center gap-1 transition-colors"
                  >
                    ⚠️ File a Complaint
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const subject = "ReportIQ Support Recommendation Request";
                      const bodyText = `From: ${profile?.fullName || 'User'} (${profile?.email || user?.email || 'User Email'})\n\nHi ReportIQ Support Team,\n\nI would like to suggest the following recommendation/feedback:\n\n[Enter details of your feedback here]\n\nBest regards,`;
                      const url = `https://mail.google.com/mail/?view=cm&fs=1&to=support@reportiq.xyz&su=${encodeURIComponent(subject)}&body=${encodeURIComponent(bodyText)}`;
                      window.open(url, "_blank");
                      setChatMessages(prev => [
                        ...prev,
                        { role: "assistant", content: "✓ Opened Gmail in a new tab to submit your recommendation to support@reportiq.xyz. Please hit 'Send' in Gmail!" }
                      ]);
                    }}
                    className="flex-1 py-1.5 px-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-150 rounded-lg font-bold text-[9px] cursor-pointer flex items-center justify-center gap-1 transition-colors"
                  >
                    💡 Send Recommendation
                  </button>
                </div>
              </div>
            </div>

            {/* Form Input Footer */}
            <form onSubmit={handleSendChatMessage} className="p-2 border-t border-slate-200 bg-white flex gap-1.5 shrink-0">
              <input
                type="text"
                value={chatInput}
                onChange={e => setChatInput(e.target.value)}
                placeholder="Ask about ReportIQ..."
                className="flex-1 border border-slate-200 rounded-lg p-1.5 px-2.5 outline-none focus:border-indigo-600 text-[11px]"
                disabled={chatSending}
              />
              <button
                type="submit"
                disabled={chatSending || !chatInput.trim()}
                className="bg-indigo-600 hover:bg-indigo-750 text-white rounded-lg px-3 py-1 font-bold cursor-pointer disabled:opacity-50 text-[11px]"
              >
                Send
              </button>
            </form>
          </div>
        ) : (
          <button
            onClick={() => setChatOpen(true)}
            className="w-12 h-12 bg-indigo-600 hover:bg-indigo-700 text-white rounded-full shadow-lg flex items-center justify-center cursor-pointer transition-all hover:scale-105"
            title="Open AI Support Chat"
          >
            <Sparkles className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Global Lock Modal Component */}
      {lockModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl border border-slate-200 w-full max-w-md p-6 shadow-2xl relative animate-scale-up text-center font-sans text-sm text-slate-700">
            <button
              onClick={() => setLockModal(prev => ({ ...prev, isOpen: false }))}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-655 p-1 rounded-lg hover:bg-slate-50 cursor-pointer"
            >
              <Plus className="w-5 h-5 rotate-45 transform" />
            </button>
            
            <div className="w-14 h-14 bg-indigo-50 border border-indigo-100 rounded-2xl flex items-center justify-center text-indigo-650 mx-auto mb-4 shadow-3xs">
              <Lock className="w-6 h-6 text-indigo-600 animate-pulse" />
            </div>
            
            <h3 className="text-lg font-bold text-slate-950 font-display">
              Feature Locked
            </h3>
            <p className="text-slate-550 text-xs mt-1.5 leading-normal">
              To unlock <strong className="text-slate-800 font-semibold">{lockModal.featureName}</strong>, upgrade to the <strong className="text-indigo-650 font-bold uppercase">{lockModal.unlockPlan} Plan</strong>.
            </p>
            
            <div className="my-5 p-3.5 bg-slate-50 border border-slate-100 rounded-2xl flex items-center justify-between text-left">
              <div>
                <span className="text-[9px] font-mono font-bold uppercase tracking-wider text-slate-400">Unlock Tier</span>
                <p className="text-xs font-bold text-slate-800 leading-tight">{lockModal.unlockPlan} Subscription</p>
              </div>
              <div className="text-right">
                <span className="text-[9px] font-mono font-bold uppercase tracking-wider text-slate-400">Price</span>
                <p className="text-xs font-extrabold text-indigo-600 leading-tight">{lockModal.price}</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3 font-sans">
              <button
                type="button"
                onClick={() => setLockModal(prev => ({ ...prev, isOpen: false }))}
                className="flex-1 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600 text-xs font-semibold cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleLockUpgrade}
                className="flex-1 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-sm transition-all cursor-pointer"
              >
                Upgrade Now
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export function ResetPasswordForm({ onComplete }: { onComplete: () => void }) {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    const initializeSession = async () => {
      try {
        // 1. Handle PKCE code flow (search params query)
        const searchParams = new URLSearchParams(window.location.search);
        const code = searchParams.get("code");
        if (code) {
          console.log("ResetPasswordForm: Found PKCE code, exchanging for session...");
          const { error } = await supabase.auth.exchangeCodeForSession(code);
          if (error) {
            console.error("ResetPasswordForm: PKCE exchange error:", error);
            setError(error.message);
          } else {
            console.log("ResetPasswordForm: PKCE exchange success!");
          }
          return;
        }

        // 2. Handle implicit grant flow (hash parameters fragment)
        const hash = window.location.hash;
        if (hash && hash.startsWith("#")) {
          const hashParams = new URLSearchParams(hash.substring(1));
          const accessToken = hashParams.get("access_token");
          const refreshToken = hashParams.get("refresh_token");
          if (accessToken && refreshToken) {
            console.log("ResetPasswordForm: Found session tokens in hash fragment, setting session manually...");
            const { error } = await supabase.auth.setSession({
              access_token: accessToken,
              refresh_token: refreshToken
            });
            if (error) {
              console.error("ResetPasswordForm: setSession error:", error);
              setError(error.message);
            } else {
              console.log("ResetPasswordForm: setSession success!");
            }
          }
        }
      } catch (err: any) {
        console.error("ResetPasswordForm: Error initializing session:", err);
        setError("Could not establish auth session. Please request another reset email link.");
      }
    };

    initializeSession();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    try {
      setLoading(true);
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      setSuccess(true);
      setTimeout(() => {
        onComplete();
      }, 2000);
    } catch (err: any) {
      console.error("Password reset update failure:", err);
      setError(err.message || "Failed to update password.");
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="text-center py-4 space-y-3 font-sans">
        <div className="w-12 h-12 bg-green-50 text-green-600 rounded-full flex items-center justify-center mx-auto border border-green-100">
          <Check className="w-6 h-6 animate-bounce" />
        </div>
        <h4 className="text-sm font-bold text-slate-900 font-display">Password Updated!</h4>
        <p className="text-xs text-slate-500">Redirecting you to login...</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 font-sans text-sm">
      {error && (
        <div className="p-3.5 bg-red-50 border border-red-100 text-red-700 text-xs font-medium rounded-xl flex gap-1.5 items-start animate-fade-in">
          <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5" />
          <span className="leading-relaxed text-left">{error}</span>
        </div>
      )}
      <div>
        <label className="block text-xs font-bold font-mono uppercase tracking-wider text-slate-500 mb-1.5">
          New Password
        </label>
        <div className="relative">
          <Lock className="absolute left-3 top-3.5 w-4 h-4 text-slate-400" />
          <input
            type="password"
            required
            placeholder="Min. 6 alphanumeric"
            value={password}
            onChange={e => setPassword(e.target.value)}
            className="w-full rounded-xl border border-slate-200 bg-slate-50/50 outline-none p-2.5 pl-10 focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100"
            minLength={6}
          />
        </div>
      </div>
      <div>
        <label className="block text-xs font-bold font-mono uppercase tracking-wider text-slate-500 mb-1.5">
          Confirm Password
        </label>
        <div className="relative">
          <Lock className="absolute left-3 top-3.5 w-4 h-4 text-slate-400" />
          <input
            type="password"
            required
            placeholder="Confirm new password"
            value={confirmPassword}
            onChange={e => setConfirmPassword(e.target.value)}
            className="w-full rounded-xl border border-slate-200 bg-slate-50/50 outline-none p-2.5 pl-10 focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100"
            minLength={6}
          />
        </div>
      </div>
      <div className="pt-2">
        <button
          type="submit"
          disabled={loading}
          className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-sm transition-all flex items-center justify-center gap-1.5 cursor-pointer"
        >
          {loading ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              Updating...
            </>
          ) : (
            "Update Password"
          )}
        </button>
      </div>
    </form>
  );
}
