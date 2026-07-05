'use client';

import React, { useState, useEffect } from 'react';
import { X, Loader2, ArrowLeft, ShieldCheck, Phone } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { authService } from '@/services/auth.service';
import { customerService } from '@/services/customer.service';
import { useTenant } from '@/components/providers/TenantContext';
import { useCart } from '@/hooks/use-cart';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

export default function LoginPopup() {
    const { domain } = useTenant();
    const { companyDetails } = useCart();
    const { toast } = useToast();

    const [isOpen, setIsOpen] = useState(false);
    const [view, setView] = useState<'phone' | 'otp'>('phone');
    const [phoneNumber, setPhoneNumber] = useState('');
    const [otp, setOtp] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [resendTimer, setResendTimer] = useState(0);
    const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

    // Resend Timer Countdown
    useEffect(() => {
        let interval: NodeJS.Timeout;
        if (resendTimer > 0) {
            interval = setInterval(() => {
                setResendTimer((prev) => prev - 1);
            }, 1000);
        }
        return () => clearInterval(interval);
    }, [resendTimer]);

    // Check if user should be suggested to login/signup
    useEffect(() => {
        const checkLoginStatus = () => {
            const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';
            const dismissed = sessionStorage.getItem('dismissed_login_popup') === 'true';

            if (!isLoggedIn && !dismissed) {
                // Open with a 2-second delay for premium, less intrusive feel
                const timer = setTimeout(() => {
                    setIsOpen(true);
                }, 2000);
                return () => clearTimeout(timer);
            }
        };

        checkLoginStatus();

        // Listen for global auth changes (to close modal if user logs in elsewhere)
        const handleAuthChange = () => {
            if (localStorage.getItem('isLoggedIn') === 'true') {
                setIsOpen(false);
            }
        };

        window.addEventListener('auth-change', handleAuthChange);
        return () => window.removeEventListener('auth-change', handleAuthChange);
    }, []);

    const handleClose = () => {
        setIsOpen(false);
        sessionStorage.setItem('dismissed_login_popup', 'true');
    };

    const handleSendOtp = async () => {
        if (!phoneNumber || phoneNumber.length < 10) {
            toast({
                title: "Invalid Phone",
                description: "Please enter a valid 10-digit number",
                variant: "destructive",
                duration: 2000
            });
            return;
        }

        setIsLoading(true);
        setFeedback(null);
        try {
            await authService.sendOtp(phoneNumber, {
                waPhoneNumId: companyDetails?.waPhoneNumId,
                waToken: companyDetails?.waToken,
                waOtpTemplateName: companyDetails?.waOtpTemplateName,
                companyName: companyDetails?.companyName,
                manaBuyCredentials: companyDetails?.manaBuyCredentials
            });

            setFeedback({ type: 'success', message: `OTP sent to +91 ${phoneNumber}` });
            setView('otp');
            setResendTimer(60);
        } catch (error) {
            toast({
                title: "Error",
                description: "Failed to send OTP",
                variant: "destructive",
                duration: 2000
            });
            setFeedback({ type: 'error', message: "Failed to send OTP. Please try again." });
        } finally {
            setIsLoading(false);
        }
    };

    const handleLogin = async () => {
        if (!otp || otp.length < 4) {
            toast({
                title: "Invalid OTP",
                description: "Please enter the 4-digit code",
                variant: "destructive",
                duration: 2000
            });
            return;
        }

        setIsLoading(true);
        setFeedback(null);
        try {
            const response = await authService.login(
                phoneNumber,
                otp,
                domain || 'babaihomefoods',
                companyDetails?.manaBuyCredentials
            );

            // Save login state & role
            localStorage.setItem('isLoggedIn', 'true');
            if (response.role) {
                localStorage.setItem('userRole', response.role);
            }

            // Warm up customer cache if CUSTOMER
            if (response.role?.includes('CUSTOMER')) {
                customerService.getCustomerDetails().catch(console.error);
            }

            // Dispatch event for other components to react
            window.dispatchEvent(new Event('auth-change'));

            toast({
                title: "Welcome!",
                description: "Logged in successfully",
                duration: 2000
            });

            // Close popup
            setIsOpen(false);
        } catch (error) {
            toast({
                title: "Login Failed",
                description: "Invalid OTP or error occurred",
                variant: "destructive",
                duration: 2000
            });
            setFeedback({ type: 'error', message: "Invalid OTP. Please try again." });
        } finally {
            setIsLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop Overlay */}
            <div 
                className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300"
                onClick={handleClose}
            />

            {/* Modal Box */}
            <div className="relative w-full max-w-4xl bg-background rounded-2xl shadow-2xl overflow-hidden grid grid-cols-1 md:grid-cols-2 z-10 animate-in zoom-in-95 duration-300 max-h-[90vh]">
                
                {/* Close Button (X) */}
                <button
                    onClick={handleClose}
                    className="absolute top-4 right-4 p-2 rounded-full hover:bg-muted text-muted-foreground hover:text-foreground transition-colors z-20"
                    aria-label="Close dialog"
                >
                    <X className="w-5 h-5" />
                </button>

                {/* Left Side: Premium Image Banner (Hidden on Mobile) */}
                <div className="relative hidden md:block bg-muted">
                    <div className="absolute inset-0 bg-black/30 z-10" />
                    <img 
                        src="https://images.unsplash.com/photo-1618244972963-dbee1a7edc95?auto=format&fit=crop&q=80&w=800" 
                        alt="Celebration Sale" 
                        className="w-full h-full object-cover"
                    />
                    {/* Floating Branding / Promotion Text */}
                    <div className="absolute inset-x-6 bottom-12 z-20 text-white flex flex-col justify-end">
                        <span className="text-xs uppercase tracking-[0.2em] font-bold text-white/80 mb-2">Exclusive Launch</span>
                        <h2 className="text-3xl font-bold font-headline leading-tight tracking-tight uppercase">
                            Chandra <br />
                            Celebration Sale
                        </h2>
                        <div className="h-[2px] w-12 bg-white/50 my-4" />
                        <p className="text-sm text-white/80">Login now to unlock special member discounts & seamless tracking.</p>
                    </div>
                </div>

                {/* Right Side: Auth Form */}
                <div className="flex flex-col justify-center items-center p-8 md:p-12 overflow-y-auto max-h-[85vh] md:max-h-none">
                    
                    {/* Brand Logo Header */}
                    <div className="text-center mb-8">
                        <h3 className="text-xl md:text-2xl font-black tracking-[0.25em] font-headline uppercase text-foreground leading-none">
                            {companyDetails?.companyName || 'CHANDRA'}
                        </h3>
                        <p className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground mt-1.5 font-bold">Shopping Mall</p>
                    </div>

                    {/* Form Headline */}
                    <div className="text-center mb-8 space-y-2">
                        <h4 className="text-lg md:text-xl font-bold text-foreground">Login / Sign Up</h4>
                        <p className="text-xs text-muted-foreground">Enter your phone number to proceed</p>
                    </div>

                    {/* Inline Notification Banner */}
                    {feedback && (
                        <div className={cn(
                            "w-full p-3 rounded-lg text-xs font-semibold mb-6 text-center animate-in slide-in-from-top-3 duration-200",
                            feedback.type === 'success' 
                                ? "bg-green-500/10 text-green-600 border border-green-500/20" 
                                : "bg-destructive/10 text-destructive border border-destructive/20"
                        )}>
                            {feedback.message}
                        </div>
                    )}

                    {/* --- VIEW: ENTER PHONE NUMBER --- */}
                    {view === 'phone' && (
                        <div className="w-full space-y-5">
                            <div className="space-y-2">
                                <label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground/80">
                                    WhatsApp Phone Number
                                </label>
                                <div className="relative flex items-center">
                                    {/* Country Code Block with Indian Flag Emoji matching reference */}
                                    <div className="absolute left-3 flex items-center gap-1.5 border-r pr-3 border-border/80 h-6 text-sm font-semibold select-none">
                                        <span className="text-base leading-none">🇮🇳</span>
                                        <span className="text-muted-foreground">+91</span>
                                    </div>
                                    <Input
                                        type="tel"
                                        placeholder="Phone number"
                                        value={phoneNumber}
                                        onChange={(e) => setPhoneNumber(e.target.value.replace(/\D/g, '').slice(0, 10))}
                                        className="h-12 pl-[92px] rounded-xl text-base tracking-wide border border-input focus-visible:ring-1 focus-visible:ring-primary focus-visible:border-primary"
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter') handleSendOtp();
                                        }}
                                        autoFocus
                                    />
                                </div>
                            </div>

                            <Button
                                onClick={handleSendOtp}
                                disabled={isLoading || phoneNumber.length < 10}
                                className="w-full h-12 rounded-xl text-sm font-bold uppercase tracking-wider bg-black hover:bg-neutral-800 text-white transition-all shadow-md active:scale-[0.98]"
                            >
                                {isLoading ? (
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                    "Request OTP"
                                )}
                            </Button>

                            <div className="text-center pt-2">
                                <p className="text-[10px] text-muted-foreground/75 leading-relaxed">
                                    I accept that I have read & understood our <br />
                                    <a href="/privacy-policy" className="underline hover:text-foreground font-semibold">Privacy Policy</a> and{" "}
                                    <a href="/terms-conditions" className="underline hover:text-foreground font-semibold">T&Cs</a>.
                                </p>
                            </div>
                        </div>
                    )}

                    {/* --- VIEW: VERIFY OTP --- */}
                    {view === 'otp' && (
                        <div className="w-full space-y-6">
                            <button
                                onClick={() => {
                                    setView('phone');
                                    setOtp('');
                                    setFeedback(null);
                                }}
                                className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground font-medium transition-colors"
                            >
                                <ArrowLeft className="w-3.5 h-3.5" />
                                Change phone number
                            </button>

                            <div className="space-y-2">
                                <label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground/80">
                                    4-Digit Verification Code
                                </label>
                                <Input
                                    type="text"
                                    placeholder="Enter OTP"
                                    value={otp}
                                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 4))}
                                    className="h-14 rounded-xl text-center text-2xl tracking-[0.4em] font-bold border border-input focus-visible:ring-1 focus-visible:ring-primary focus-visible:border-primary"
                                    maxLength={4}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter') handleLogin();
                                    }}
                                    autoFocus
                                />
                            </div>

                            <Button
                                onClick={handleLogin}
                                disabled={isLoading || otp.length < 4}
                                className="w-full h-12 rounded-xl text-sm font-bold uppercase tracking-wider bg-black hover:bg-neutral-800 text-white transition-all shadow-md active:scale-[0.98]"
                            >
                                {isLoading ? (
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                    "Verify OTP"
                                )}
                            </Button>

                            <div className="text-center">
                                <Button
                                    variant="link"
                                    disabled={resendTimer > 0 || isLoading}
                                    onClick={handleSendOtp}
                                    className="text-xs font-semibold text-muted-foreground hover:text-foreground h-auto p-0"
                                >
                                    {resendTimer > 0 
                                        ? `Resend OTP in ${resendTimer}s` 
                                        : "Resend OTP code"
                                    }
                                </Button>
                            </div>
                        </div>
                    )}

                </div>
            </div>
        </div>
    );
}
