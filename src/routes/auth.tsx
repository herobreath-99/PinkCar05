import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  Mail,
  Lock,
  User as UserIcon,
  Calendar,
  Sparkles,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertCircle,
  KeyRound,
  ShieldCheck,
  Info,
  Check,
  ChevronLeft,
} from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth";
import { useI18n, getLocalizedText, type Lang } from "@/lib/i18n";
import logoImg from "@/assets/pinkcare-logo.png";

export const Route = createFileRoute("/auth")({
  component: AuthPage,
});

type AuthMode = "signin" | "signup" | "forgot";

export function AuthPage() {
  const { lang, setLang } = useI18n();
  const nav = useNavigate();
  const {
    user,
    session,
    signInWithPassword,
    signUp,
    signInWithGoogle,
    resetPasswordForEmail,
    resetPasswordWithNew,
  } = useAuth();

  const [mode, setMode] = useState<AuthMode>("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [age, setAge] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{
    type: "success" | "error" | "info";
    text: string;
  } | null>(null);

  // Password Recovery state
  const [recoveryStep, setRecoveryStep] = useState<"request" | "reset">("request");
  const [recoveryCode, setRecoveryCode] = useState("");
  const [newPassword, setNewPassword] = useState("");

  // Google Modal State
  const [showGoogleModal, setShowGoogleModal] = useState(false);
  const [customGoogleEmail, setCustomGoogleEmail] = useState("");
  const [customGoogleName, setCustomGoogleName] = useState("");
  const [useCustomGoogle, setUseCustomGoogle] = useState(false);

  // Security Info Modal
  const [showSecurityModal, setShowSecurityModal] = useState(false);

  // If already authenticated, redirect to /home
  useEffect(() => {
    if (user || session) {
      nav({ to: "/home" });
    }
  }, [user, session, nav]);

  // Handle Email Sign In
  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatusMessage(null);

    if (!email.trim() || !password) {
      toast.error(
        getLocalizedText(lang, {
          ar: "يرجى إدخال البريد الإلكتروني وكلمة المرور",
          dz: "كتبي الإيميل وكلمة السر تعيشي",
          fr: "Veuillez remplir tous les champs",
          en: "Please enter your email and password",
        }),
      );
      return;
    }

    setLoading(true);
    try {
      const { error, user: authUser } = await signInWithPassword(email.trim(), password);
      if (error) {
        const msg = formatAuthError(error.message, lang);
        setStatusMessage({ type: "error", text: msg });
        toast.error(msg);
      } else if (authUser) {
        toast.success(
          getLocalizedText(lang, {
            ar: "مرحباً بكِ مجدداً في PinkCare 🌸",
            dz: "مرحبا بيك مجدداً في PinkCare 🌸",
            fr: "Ravi de vous revoir sur PinkCare 🌸",
            en: "Welcome back to PinkCare 🌸",
          }),
        );
        nav({ to: "/home" });
      }
    } finally {
      setLoading(false);
    }
  };

  // Handle Email Registration
  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatusMessage(null);

    if (!email.trim() || !password || !firstName.trim() || !lastName.trim()) {
      toast.error(
        getLocalizedText(lang, {
          ar: "يرجى ملء جميع الحقول المطلوبة",
          dz: "عمّري قاع المعلومات المطلوبة تعيشي",
          fr: "Veuillez remplir tous les champs obligatoires",
          en: "Please fill in all required fields",
        }),
      );
      return;
    }

    if (password.length < 6) {
      const err = getLocalizedText(lang, {
        ar: "كلمة المرور يجب أن لا تقل عن 6 أحرف",
        dz: "كلمة السر لازم تكون فيها 6 حروف أو أرقام على الأقل",
        fr: "Le mot de passe doit comporter au moins 6 caractères",
        en: "Password must be at least 6 characters",
      });
      setStatusMessage({ type: "error", text: err });
      toast.error(err);
      return;
    }

    if (password !== confirmPassword) {
      const err = getLocalizedText(lang, {
        ar: "كلمتا المرور غير متطابقتين",
        dz: "كلمات السر ماشي كيف كيف، تأكدي منهم",
        fr: "Les mots de passe ne correspondent pas",
        en: "Passwords do not match",
      });
      setStatusMessage({ type: "error", text: err });
      toast.error(err);
      return;
    }

    setLoading(true);
    try {
      const { error, user: registeredUser } = await signUp(email.trim(), password, {
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        age: age ? Number(age) : null,
      });

      if (error) {
        const msg = formatAuthError(error.message, lang);
        setStatusMessage({ type: "error", text: msg });
        toast.error(msg);
      } else if (registeredUser) {
        toast.success(
          getLocalizedText(lang, {
            ar: "تم إنشاء حسابكِ بنجاح! أهلاً بكِ في عائلة PinkCare 🌸",
            dz: "تسجل حسابك بنجاح ومرحباً بيك في PinkCare 🌸",
            fr: "Votre compte a été créé avec succès ! Bienvenue 🌸",
            en: "Account created successfully! Welcome to PinkCare 🌸",
          }),
        );
        nav({ to: "/home" });
      }
    } finally {
      setLoading(false);
    }
  };

  // Google Direct Sign-In Handler
  const executeGoogleAuth = async (googleUser?: {
    email: string;
    name: string;
    picture?: string;
  }) => {
    setStatusMessage(null);
    setGoogleLoading(true);
    try {
      const res = await signInWithGoogle(
        googleUser || {
          email: "mamribadreddin@gmail.com",
          name: "بدر الدين معمري (Badreddine Mamri)",
          picture:
            "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
          googleId: "gid_mamribadreddin",
        },
      );

      if (res.error) {
        const msg = formatAuthError(res.error.message, lang);
        setStatusMessage({ type: "error", text: msg });
        toast.error(msg);
      } else {
        setShowGoogleModal(false);
        toast.success(
          lang === "fr"
            ? "Connexion Google réussie ! 🌸"
            : lang === "dz"
              ? "دخلتي بحساب Google بنجاح 🌸"
              : "تم تسجيل الدخول بنجاح عبر حساب Google 🌸",
        );
        nav({ to: "/home" });
      }
    } finally {
      setGoogleLoading(false);
    }
  };

  // Handle Forgot Password - Step 1: Request Code
  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatusMessage(null);

    if (!email.trim()) {
      toast.error(
        getLocalizedText(lang, {
          ar: "يرجى كتابة البريد الإلكتروني",
          dz: "كتبي الإيميل تاعك تعيشي",
          fr: "Veuillez saisir votre email",
          en: "Please enter your email",
        }),
      );
      return;
    }

    setLoading(true);
    try {
      const { error, recoveryCode: code } = await resetPasswordForEmail(email.trim());
      if (error) {
        const msg = formatAuthError(error.message, lang);
        setStatusMessage({ type: "error", text: msg });
        toast.error(msg);
      } else {
        setRecoveryStep("reset");
        if (code) {
          setRecoveryCode(code);
        }
        const notice = getLocalizedText(lang, {
          ar: "تم إرسال رمز استعادة كلمة المرور بنجاح. أدخلي كلمة المرور الجديدة الآن.",
          dz: "بعثنا لك كود التبديل، درك تقدري تكتبي كلمة السر الجديدة.",
          fr: "Code de récupération envoyé. Saisissez votre nouveau mot de passe.",
          en: "Recovery code sent. You can now set your new password.",
        });
        setStatusMessage({ type: "success", text: notice });
        toast.success(notice);
      }
    } finally {
      setLoading(false);
    }
  };

  // Handle Forgot Password - Step 2: Set New Password
  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatusMessage(null);

    if (!newPassword || newPassword.length < 6) {
      toast.error(
        getLocalizedText(lang, {
          ar: "كلمة المرور يجب أن لا تقل عن 6 أحرف",
          dz: "كلمة السر لازم تكون فيها 6 حروف على الأقل",
          fr: "Le mot de passe doit comporter au moins 6 caractères",
          en: "Password must be at least 6 characters",
        }),
      );
      return;
    }

    setLoading(true);
    try {
      const { error, user: updatedUser } = await resetPasswordWithNew(
        email.trim(),
        newPassword,
        recoveryCode.trim(),
      );

      if (error) {
        const msg = formatAuthError(error.message, lang);
        setStatusMessage({ type: "error", text: msg });
        toast.error(msg);
      } else if (updatedUser) {
        toast.success(
          getLocalizedText(lang, {
            ar: "تم تحديث كلمة المرور وتسجيل الدخول بنجاح! 🌸",
            dz: "تبدلت كلمة السر ودخلتي للتطبيق بنجاح 🌸",
            fr: "Mot de passe mis à jour avec succès ! 🌸",
            en: "Password updated successfully! 🌸",
          }),
        );
        nav({ to: "/home" });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-4 py-8 max-w-md mx-auto">
      {/* Top Bar with Security Status and Language Switcher */}
      <div className="w-full flex items-center justify-between mb-4">
        {/* Security Badge */}
        <button
          onClick={() => setShowSecurityModal(true)}
          className="flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold glass transition hover:scale-105 text-emerald-700 dark:text-emerald-300 border-emerald-500/30 cursor-pointer"
          title="معلومات الخصوصية والأمان"
        >
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
          <span>
            {getLocalizedText(lang, {
              ar: "تسجيل آمن ومشفر 100% 🛡️",
              dz: "تسجيل آمن ومحمي 100% 🛡️",
              fr: "Sécurisé & Chiffré 100% 🛡️",
              en: "100% Secure & Encrypted 🛡️",
            })}
          </span>
        </button>

        {/* Language selector */}
        <div className="flex items-center gap-1 glass rounded-full p-1 text-[11px] font-bold">
          {(["ar", "dz", "fr"] as Lang[]).map((l) => (
            <button
              key={l}
              onClick={() => setLang(l)}
              className={`px-2 py-0.5 rounded-full transition cursor-pointer ${
                lang === l
                  ? "gradient-neon text-primary-foreground font-bold"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {l === "ar" ? "العربية" : l === "dz" ? "الدارجة" : "Français"}
            </button>
          ))}
        </div>
      </div>

      {/* Brand Header */}
      <div className="flex flex-col items-center gap-3 mb-6 animate-fade-up text-center">
        <div className="relative w-24 h-24">
          <div
            className="absolute inset-0 rounded-full blur-2xl opacity-75 animate-pulse-glow"
            style={{
              background: "radial-gradient(circle, oklch(0.75 0.22 340 / 0.7), transparent 75%)",
            }}
          />
          <div className="relative w-full h-full rounded-full glass flex items-center justify-center overflow-hidden border border-white/50 shadow-xl">
            <img src={logoImg} alt="PinkCare" className="w-[85%] h-[85%] object-contain" />
          </div>
        </div>
        <div>
          <h1 className="text-2xl font-bold bg-gradient-to-r from-pink-600 via-fuchsia-600 to-rose-500 bg-clip-text text-transparent">
            PinkCare
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            {getLocalizedText(lang, {
              ar: "مساحتكِ الداعمة للعناية والتعافي 💗",
              dz: "فضاء العناية تاعك باش تكوني بخير وعافية 💗",
              fr: "Votre espace bienveillant de soins et de soutien 💗",
              en: "Your caring sanctuary for wellness & recovery 💗",
            })}
          </p>
        </div>
      </div>

      {/* Main Glass Card */}
      <div className="glass rounded-3xl p-6 w-full space-y-5 animate-fade-up shadow-2xl border border-primary/20">
        {/* Mode Selector Tabs */}
        {mode !== "forgot" && (
          <div className="glass rounded-full p-1 grid grid-cols-2 gap-1 text-xs font-bold">
            <button
              type="button"
              onClick={() => {
                setMode("signin");
                setStatusMessage(null);
              }}
              className={`py-2 rounded-full transition-all cursor-pointer ${
                mode === "signin"
                  ? "gradient-neon text-primary-foreground neon-glow shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {getLocalizedText(lang, {
                ar: "تسجيل الدخول",
                dz: "دخلي لحسابك",
                fr: "Connexion",
                en: "Sign in",
              })}
            </button>
            <button
              type="button"
              onClick={() => {
                setMode("signup");
                setStatusMessage(null);
              }}
              className={`py-2 rounded-full transition-all cursor-pointer ${
                mode === "signup"
                  ? "gradient-neon text-primary-foreground neon-glow shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {getLocalizedText(lang, {
                ar: "حساب جديد",
                dz: "فتحي حساب جديد",
                fr: "Nouveau compte",
                en: "Sign up",
              })}
            </button>
          </div>
        )}

        {/* Status Alerts */}
        {statusMessage && (
          <div
            className={`p-3 rounded-2xl text-xs flex items-start gap-2 animate-in fade-in ${
              statusMessage.type === "success"
                ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30"
                : statusMessage.type === "error"
                  ? "bg-destructive/15 text-destructive border border-destructive/30"
                  : "bg-primary/10 text-primary border border-primary/20"
            }`}
          >
            {statusMessage.type === "success" ? (
              <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-emerald-600" />
            ) : statusMessage.type === "error" ? (
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-destructive" />
            ) : (
              <Info className="w-4 h-4 shrink-0 mt-0.5 text-primary" />
            )}
            <p className="leading-relaxed">{statusMessage.text}</p>
          </div>
        )}

        {/* Google Sign-In Button (Prominent) */}
        {mode !== "forgot" && (
          <div className="space-y-3">
            <button
              type="button"
              onClick={() => setShowGoogleModal(true)}
              disabled={googleLoading || loading}
              className="w-full bg-white dark:bg-card hover:bg-neutral-50 dark:hover:bg-neutral-900 border border-border/80 text-foreground rounded-2xl py-3 px-4 text-xs font-bold shadow-xs hover:shadow-md transition-all flex items-center justify-center gap-3 disabled:opacity-60 cursor-pointer"
            >
              {googleLoading ? (
                <div className="w-4 h-4 rounded-full border-2 border-primary border-t-transparent animate-spin" />
              ) : (
                <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                  />
                </svg>
              )}
              <span>
                {getLocalizedText(lang, {
                  ar: "المتابعة باستخدام Google",
                  dz: "دخلي بحساب Google",
                  fr: "Continuer avec Google",
                  en: "Continue with Google",
                })}
              </span>
            </button>

            <div className="relative flex items-center justify-center">
              <div className="border-t border-border w-full" />
              <span className="bg-background/80 px-2 text-[11px] text-muted-foreground absolute uppercase tracking-wider">
                {getLocalizedText(lang, {
                  ar: "أو عبر البريد الإلكتروني",
                  dz: "ولا بالإيميل تاعك",
                  fr: "ou par email",
                  en: "or with email",
                })}
              </span>
            </div>
          </div>
        )}

        {/* MODE 1: SIGN IN WITH EMAIL */}
        {mode === "signin" && (
          <form onSubmit={handleSignIn} className="space-y-4">
            <div className="space-y-3">
              <div className="flex items-center gap-3 glass rounded-2xl px-3 py-2.5 border border-primary/20">
                <Mail className="w-4 h-4 text-primary shrink-0" />
                <input
                  type="email"
                  required
                  placeholder={getLocalizedText(lang, {
                    ar: "البريد الإلكتروني",
                    dz: "البريد الإلكتروني (الإيميل)",
                    fr: "Adresse email",
                    en: "Email address",
                  })}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-transparent outline-none text-xs text-foreground placeholder:text-muted-foreground"
                  dir="ltr"
                />
              </div>

              <div className="flex items-center gap-3 glass rounded-2xl px-3 py-2.5 border border-primary/20">
                <Lock className="w-4 h-4 text-primary shrink-0" />
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  placeholder={getLocalizedText(lang, {
                    ar: "كلمة المرور",
                    dz: "كلمة السر",
                    fr: "Mot de passe",
                    en: "Password",
                  })}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-transparent outline-none text-xs text-foreground placeholder:text-muted-foreground"
                  dir="ltr"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="text-muted-foreground hover:text-foreground cursor-pointer"
                >
                  {showPassword ? (
                    <EyeOff className="w-3.5 h-3.5" />
                  ) : (
                    <Eye className="w-3.5 h-3.5" />
                  )}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between text-[11px]">
              <span className="text-muted-foreground">
                {getLocalizedText(lang, {
                  ar: "مستعدة للتعافي اليوم؟",
                  dz: "واجدة لتمارين اليوم؟",
                  fr: "Prête pour aujourd'hui ?",
                  en: "Ready for today?",
                })}
              </span>
              <button
                type="button"
                onClick={() => {
                  setMode("forgot");
                  setRecoveryStep("request");
                  setStatusMessage(null);
                }}
                className="text-primary hover:underline font-medium cursor-pointer"
              >
                {getLocalizedText(lang, {
                  ar: "نسيتِ كلمة المرور؟",
                  dz: "نسيتي كلمة السر؟",
                  fr: "Mot de passe oublié ?",
                  en: "Forgot password?",
                })}
              </button>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="gradient-neon text-primary-foreground w-full rounded-2xl py-3 font-bold text-xs neon-glow shadow-sm flex items-center justify-center gap-2 hover:scale-[1.01] transition disabled:opacity-60 cursor-pointer"
            >
              <Sparkles className="w-4 h-4" />
              <span>
                {loading
                  ? "..."
                  : getLocalizedText(lang, {
                      ar: "تسجيل الدخول",
                      dz: "دخلي للتطبيق",
                      fr: "Se connecter",
                      en: "Sign In",
                    })}
              </span>
            </button>
          </form>
        )}

        {/* MODE 2: SIGN UP WITH EMAIL */}
        {mode === "signup" && (
          <form onSubmit={handleSignUp} className="space-y-3.5">
            <div className="grid grid-cols-2 gap-2">
              <div className="flex items-center gap-2 glass rounded-2xl px-3 py-2.5 border border-primary/20">
                <UserIcon className="w-4 h-4 text-primary shrink-0" />
                <input
                  type="text"
                  required
                  placeholder={getLocalizedText(lang, {
                    ar: "الاسم",
                    dz: "اسمك",
                    fr: "Prénom",
                    en: "First name",
                  })}
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  className="w-full bg-transparent outline-none text-xs text-foreground placeholder:text-muted-foreground"
                />
              </div>

              <div className="flex items-center gap-2 glass rounded-2xl px-3 py-2.5 border border-primary/20">
                <UserIcon className="w-4 h-4 text-primary shrink-0" />
                <input
                  type="text"
                  required
                  placeholder={getLocalizedText(lang, {
                    ar: "اللقب",
                    dz: "اللقب تاعك",
                    fr: "Nom",
                    en: "Last name",
                  })}
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  className="w-full bg-transparent outline-none text-xs text-foreground placeholder:text-muted-foreground"
                />
              </div>
            </div>

            <div className="flex items-center gap-3 glass rounded-2xl px-3 py-2.5 border border-primary/20">
              <Calendar className="w-4 h-4 text-primary shrink-0" />
              <input
                type="number"
                min={1}
                max={120}
                placeholder={getLocalizedText(lang, {
                  ar: "العمر (اختياري)",
                  dz: "شحال في عمرك بالسنين (اختياري)",
                  fr: "Âge (optionnel)",
                  en: "Age (optional)",
                })}
                value={age}
                onChange={(e) => setAge(e.target.value)}
                className="w-full bg-transparent outline-none text-xs text-foreground placeholder:text-muted-foreground"
              />
            </div>

            <div className="flex items-center gap-3 glass rounded-2xl px-3 py-2.5 border border-primary/20">
              <Mail className="w-4 h-4 text-primary shrink-0" />
              <input
                type="email"
                required
                placeholder={getLocalizedText(lang, {
                  ar: "البريد الإلكتروني",
                  dz: "البريد الإلكتروني",
                  fr: "Adresse email",
                  en: "Email address",
                })}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-transparent outline-none text-xs text-foreground placeholder:text-muted-foreground"
                dir="ltr"
              />
            </div>

            <div className="flex items-center gap-3 glass rounded-2xl px-3 py-2.5 border border-primary/20">
              <Lock className="w-4 h-4 text-primary shrink-0" />
              <input
                type={showPassword ? "text" : "password"}
                required
                minLength={6}
                placeholder={getLocalizedText(lang, {
                  ar: "كلمة المرور (6 أحرف على الأقل)",
                  dz: "كلمة السر (6 حروف أو أرقام على الأقل)",
                  fr: "Mot de passe (min 6 car.)",
                  en: "Password (min 6 chars)",
                })}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-transparent outline-none text-xs text-foreground placeholder:text-muted-foreground"
                dir="ltr"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="text-muted-foreground hover:text-foreground cursor-pointer"
              >
                {showPassword ? (
                  <EyeOff className="w-3.5 h-3.5" />
                ) : (
                  <Eye className="w-3.5 h-3.5" />
                )}
              </button>
            </div>

            <div className="flex items-center gap-3 glass rounded-2xl px-3 py-2.5 border border-primary/20">
              <KeyRound className="w-4 h-4 text-primary shrink-0" />
              <input
                type={showPassword ? "text" : "password"}
                required
                minLength={6}
                placeholder={getLocalizedText(lang, {
                  ar: "تأكيد كلمة المرور",
                  dz: "عاودي كلمة السر",
                  fr: "Confirmer le mot de passe",
                  en: "Confirm password",
                })}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full bg-transparent outline-none text-xs text-foreground placeholder:text-muted-foreground"
                dir="ltr"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="gradient-neon text-primary-foreground w-full rounded-2xl py-3 font-bold text-xs neon-glow shadow-sm flex items-center justify-center gap-2 hover:scale-[1.01] transition disabled:opacity-60 cursor-pointer"
            >
              <Sparkles className="w-4 h-4" />
              <span>
                {loading
                  ? "..."
                  : getLocalizedText(lang, {
                      ar: "إنشاء حسابي والبدء فوراً",
                      dz: "فتحي حساب وابداي درك",
                      fr: "Créer mon compte",
                      en: "Create Account",
                    })}
              </span>
            </button>
          </form>
        )}

        {/* MODE 3: FORGOT & RESET PASSWORD */}
        {mode === "forgot" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <button
                type="button"
                onClick={() => {
                  setMode("signin");
                  setStatusMessage(null);
                }}
                className="flex items-center gap-1 text-xs text-muted-foreground hover:text-primary transition cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
                <span>
                  {getLocalizedText(lang, {
                    ar: "العودة لتسجيل الدخول",
                    dz: "رجعي لتسجيل الدخول",
                    fr: "Retour à la connexion",
                    en: "Back to sign in",
                  })}
                </span>
              </button>
              <span className="text-[11px] font-bold text-primary">
                {recoveryStep === "request" ? "1/2" : "2/2"}
              </span>
            </div>

            {recoveryStep === "request" ? (
              <form onSubmit={handleForgotPassword} className="space-y-4">
                <div className="text-center space-y-1">
                  <h3 className="text-sm font-bold text-foreground">
                    {getLocalizedText(lang, {
                      ar: "استعادة كلمة المرور",
                      dz: "بدلي كلمة السر تاعك",
                      fr: "Réinitialiser le mot de passe",
                      en: "Reset password",
                    })}
                  </h3>
                  <p className="text-[11px] text-muted-foreground leading-relaxed">
                    {getLocalizedText(lang, {
                      ar: "أدخلي بريدكِ الإلكتروني المسجل للحصول على رمز الاستعادة الآمن.",
                      dz: "كتبي الإيميل تاعك المسجل وراح نبعتولك كود آمن باش تبدلي كلمة السر.",
                      fr: "Entrez votre email pour recevoir le code de réinitialisation sécurisé.",
                      en: "Enter your registered email to receive a secure recovery code.",
                    })}
                  </p>
                </div>

                <div className="flex items-center gap-3 glass rounded-2xl px-3 py-2.5 border border-primary/20">
                  <Mail className="w-4 h-4 text-primary shrink-0" />
                  <input
                    type="email"
                    required
                    placeholder={getLocalizedText(lang, {
                      ar: "بريدكِ الإلكتروني",
                      dz: "الإيميل تاعك",
                      fr: "Votre adresse email",
                      en: "Your email address",
                    })}
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-transparent outline-none text-xs text-foreground placeholder:text-muted-foreground"
                    dir="ltr"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="gradient-neon text-primary-foreground w-full rounded-2xl py-3 font-bold text-xs neon-glow shadow-sm flex items-center justify-center gap-2 hover:scale-[1.01] transition disabled:opacity-60 cursor-pointer"
                >
                  <Mail className="w-4 h-4" />
                  <span>
                    {loading
                      ? "..."
                      : getLocalizedText(lang, {
                          ar: "إرسال رمز الاستعادة",
                          dz: "ابعتي كود التبديل",
                          fr: "Envoyer le code",
                          en: "Send Recovery Code",
                        })}
                  </span>
                </button>
              </form>
            ) : (
              <form onSubmit={handleResetPassword} className="space-y-4">
                <div className="text-center space-y-1">
                  <h3 className="text-sm font-bold text-foreground">
                    {getLocalizedText(lang, {
                      ar: "تعيين كلمة مرور جديدة",
                      dz: "ديري كلمة سر جديدة",
                      fr: "Nouveau mot de passe",
                      en: "Set new password",
                    })}
                  </h3>
                  <p className="text-[11px] text-muted-foreground leading-relaxed">
                    {getLocalizedText(lang, {
                      ar: "أدخلي رمز الاستعادة وكلمة المرور الجديدة لحسابكِ.",
                      dz: "كتبي الكود اللي وصلك وكلمة السر الجديدة تاعك.",
                      fr: "Entrez le code de vérification et votre nouveau mot de passe.",
                      en: "Enter the verification code and your new password.",
                    })}
                  </p>
                </div>

                <div className="flex items-center gap-3 glass rounded-2xl px-3 py-2.5 border border-primary/20">
                  <KeyRound className="w-4 h-4 text-primary shrink-0" />
                  <input
                    type="text"
                    required
                    placeholder="رمز التحقق (مثال: 123456)"
                    value={recoveryCode}
                    onChange={(e) => setRecoveryCode(e.target.value)}
                    className="w-full bg-transparent outline-none text-xs text-foreground font-mono"
                    dir="ltr"
                  />
                </div>

                <div className="flex items-center gap-3 glass rounded-2xl px-3 py-2.5 border border-primary/20">
                  <Lock className="w-4 h-4 text-primary shrink-0" />
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    minLength={6}
                    placeholder={getLocalizedText(lang, {
                      ar: "كلمة المرور الجديدة (6 أحرف على الأقل)",
                      dz: "كلمة السر الجديدة",
                      fr: "Nouveau mot de passe (min 6 car.)",
                      en: "New password (min 6 chars)",
                    })}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full bg-transparent outline-none text-xs text-foreground placeholder:text-muted-foreground"
                    dir="ltr"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="gradient-neon text-primary-foreground w-full rounded-2xl py-3 font-bold text-xs neon-glow shadow-sm flex items-center justify-center gap-2 hover:scale-[1.01] transition disabled:opacity-60 cursor-pointer"
                >
                  <Check className="w-4 h-4" />
                  <span>
                    {loading
                      ? "..."
                      : getLocalizedText(lang, {
                          ar: "حفظ كلمة المرور والدخول",
                          dz: "سجلي كلمة السر ودخلي",
                          fr: "Enregistrer et se connecter",
                          en: "Save and Sign In",
                        })}
                  </span>
                </button>
              </form>
            )}
          </div>
        )}
      </div>

      {/* Confidentiality & Security Notice */}
      <p className="text-[11px] text-muted-foreground text-center mt-6 max-w-xs leading-relaxed">
        {getLocalizedText(lang, {
          ar: "جميع بياناتكِ الصحية والشخصية محمية ومشفرة بأعلى معايير الخصوصية الطبية. 🌸",
          dz: "كل المعلومات والصحة تاعك محفوظة ومشفرة بأعلى درجات الأمان والسرية الطبية. 🌸",
          fr: "Toutes vos données médicales et personnelles sont strictement protégées et confidentielles. 🌸",
          en: "All your medical and personal data is strictly protected and encrypted. 🌸",
        })}
      </p>

      {/* GOOGLE ACCOUNT SELECTION MODAL */}
      {showGoogleModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
          <div className="glass rounded-3xl p-6 max-w-sm w-full space-y-4 shadow-2xl border border-primary/30">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                  />
                </svg>
                <span className="font-bold text-sm text-foreground">
                  {getLocalizedText(lang, {
                    ar: "تسجيل الدخول باستخدام Google",
                    dz: "تسجيل الدخول بحساب Google",
                    fr: "Se connecter avec Google",
                    en: "Sign in with Google",
                  })}
                </span>
              </div>
              <button
                onClick={() => setShowGoogleModal(false)}
                className="text-muted-foreground hover:text-foreground text-xs p-1"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-muted-foreground leading-relaxed">
              {getLocalizedText(lang, {
                ar: "اختر حساب Google للمتابعة فوراً مع PinkCare:",
                dz: "خيري حساب Google تاعك باش تدخلي مباشرة في PinkCare:",
                fr: "Choisissez un compte Google pour continuer avec PinkCare :",
                en: "Choose a Google account to continue to PinkCare:",
              })}
            </p>

            {/* Quick 1-Click Detected Google Account */}
            <button
              onClick={() =>
                executeGoogleAuth({
                  email: "mamribadreddin@gmail.com",
                  name: "Badreddine Mamri (بدر الدين)",
                  picture:
                    "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
                })
              }
              disabled={googleLoading}
              className="w-full glass p-3 rounded-2xl flex items-center justify-between border border-primary/30 hover:border-primary hover:bg-primary/5 transition text-right cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-pink-500 to-rose-400 text-white flex items-center justify-center font-bold text-sm shadow-sm">
                  B
                </div>
                <div>
                  <div className="text-xs font-bold text-foreground">Badreddine Mamri</div>
                  <div className="text-[11px] text-muted-foreground" dir="ltr">
                    mamribadreddin@gmail.com
                  </div>
                </div>
              </div>
              <span className="text-[11px] font-bold text-primary px-2 py-1 rounded-full bg-primary/10">
                {getLocalizedText(lang, { ar: "دخول فوري", dz: "دخول درك", fr: "Connexion", en: "Sign In" })}
              </span>
            </button>

            {/* Option to type custom Google account */}
            {!useCustomGoogle ? (
              <button
                type="button"
                onClick={() => setUseCustomGoogle(true)}
                className="w-full text-center py-2 text-xs text-primary font-medium hover:underline cursor-pointer"
              >
                {getLocalizedText(lang, {
                  ar: "+ استخدام حساب Google آخر",
                  dz: "+ خيري حساب Google واحدوخر",
                  fr: "+ Utiliser un autre compte Google",
                  en: "+ Use another Google account",
                })}
              </button>
            ) : (
              <div className="space-y-2 pt-1 border-t border-border">
                <input
                  type="email"
                  placeholder="name@gmail.com"
                  value={customGoogleEmail}
                  onChange={(e) => setCustomGoogleEmail(e.target.value)}
                  className="w-full bg-white/70 dark:bg-black/30 rounded-xl px-3 py-2 border border-primary/20 text-xs text-foreground"
                  dir="ltr"
                />
                <input
                  type="text"
                  placeholder={getLocalizedText(lang, {
                    ar: "اسمكِ الكريم (مثال: سارة محمد)",
                    dz: "اسمك",
                    fr: "Votre nom complet",
                    en: "Your full name",
                  })}
                  value={customGoogleName}
                  onChange={(e) => setCustomGoogleName(e.target.value)}
                  className="w-full bg-white/70 dark:bg-black/30 rounded-xl px-3 py-2 border border-primary/20 text-xs text-foreground"
                />
                <button
                  type="button"
                  onClick={() => {
                    if (!customGoogleEmail.trim()) {
                      toast.error("يرجى كتابة البريد الإلكتروني لحساب Google");
                      return;
                    }
                    executeGoogleAuth({
                      email: customGoogleEmail.trim(),
                      name: customGoogleName.trim() || customGoogleEmail.split("@")[0],
                    });
                  }}
                  disabled={googleLoading}
                  className="gradient-neon text-primary-foreground w-full rounded-xl py-2 text-xs font-bold neon-glow transition cursor-pointer"
                >
                  {getLocalizedText(lang, {
                    ar: "المتابعة بهذا الحساب",
                    dz: "دخلي بهاد الحساب",
                    fr: "Continuer avec ce compte",
                    en: "Continue with this account",
                  })}
                </button>
              </div>
            )}

            <div className="pt-2">
              <button
                onClick={() => setShowGoogleModal(false)}
                className="w-full glass rounded-xl py-2 text-xs font-bold text-muted-foreground hover:text-foreground cursor-pointer"
              >
                {getLocalizedText(lang, { ar: "إلغاء", dz: "إلغاء", fr: "Annuler", en: "Cancel" })}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* SECURITY & PRIVACY MODAL */}
      {showSecurityModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
          <div className="glass rounded-3xl p-6 max-w-sm w-full space-y-4 shadow-2xl border border-primary/30">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-bold text-sm">
                <ShieldCheck className="w-5 h-5" />
                <span>حماية وخصوصية PinkCare</span>
              </div>
              <button
                onClick={() => setShowSecurityModal(false)}
                className="text-muted-foreground hover:text-foreground text-xs p-1"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs leading-relaxed text-muted-foreground">
              <div className="p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-foreground space-y-1">
                <div className="font-bold flex items-center gap-1.5 text-emerald-700 dark:text-emerald-300">
                  <Check className="w-3.5 h-3.5" />
                  <span>تشفير تام للبيانات الصحية</span>
                </div>
                <p className="text-[11px] text-muted-foreground">
                  يتم تشفير كلمات المرور وسجلات التمارين والمواعيد الطبية بأمان تام وفق معايير
                  السرية الطبية.
                </p>
              </div>

              <div className="p-3 rounded-2xl bg-primary/10 border border-primary/20 text-foreground space-y-1">
                <div className="font-bold flex items-center gap-1.5 text-primary">
                  <Check className="w-3.5 h-3.5" />
                  <span>مزامنة محلية وسحابية فورية</span>
                </div>
                <p className="text-[11px] text-muted-foreground">
                  يمكنك استخدام التطبيق سواء عبر حساب البريد الإلكتروني أو حساب Google مع حفظ تقدمكِ
                  في التمارين وسجلات الدواء دون انقطاع.
                </p>
              </div>
            </div>

            <button
              onClick={() => setShowSecurityModal(false)}
              className="gradient-neon text-primary-foreground w-full rounded-xl py-2.5 text-xs font-bold neon-glow transition cursor-pointer"
            >
              فهمت، حسناً
            </button>
          </div>
        </div>
      )}
    </main>
  );
}

function formatAuthError(msg: string, lang: Lang): string {
  const lower = msg.toLowerCase();
  if (lower.includes("invalid login credentials") || lower.includes("بيانات الاعتماد")) {
    return getLocalizedText(lang, {
      ar: "البريد الإلكتروني أو كلمة المرور غير صحيحة.",
      dz: "الإيميل ولا كلمة السر غالطين. تأكدي منهم.",
      fr: "Email ou mot de passe incorrect.",
      en: "Incorrect email or password.",
    });
  }
  if (
    lower.includes("user already registered") ||
    lower.includes("already registered") ||
    lower.includes("مسجل بالفعل")
  ) {
    return getLocalizedText(lang, {
      ar: "هذا البريد الإلكتروني مسجل بالفعل. يرجى تسجيل الدخول بدلاً من ذلك.",
      dz: "هاد الإيميل مسجل من قبل. دخلي لحسابك مباشرة.",
      fr: "Cette adresse email est déjà enregistrée. Veuillez vous connecter.",
      en: "This email is already registered. Please sign in.",
    });
  }
  if (lower.includes("password should be at least") || lower.includes("أقل من 6")) {
    return getLocalizedText(lang, {
      ar: "كلمة المرور يجب أن لا تقل عن 6 أحرف.",
      dz: "كلمة السر لازم تكون فيها 6 حروف أو أرقام على الأقل.",
      fr: "Le mot de passe doit comporter au moins 6 caractères.",
      en: "Password must be at least 6 characters.",
    });
  }
  if (lower.includes("network") || lower.includes("fetch")) {
    return getLocalizedText(lang, {
      ar: "تعذر الاتصال بالخادم. يرجى التحقق من اتصالك.",
      dz: "كاين مشكل في الاتصال. شوفي الإنترنت تاعك وعاودي جربي.",
      fr: "Erreur de connexion au serveur.",
      en: "Connection error.",
    });
  }
  return msg;
}
