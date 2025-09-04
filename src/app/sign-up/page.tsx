"use client";
import { Button } from "../../components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
} from "../../components/ui/card";
import { Input } from "../../components/ui/input";
import { AuthApiService } from "../../services/api/auth";
import { Eye, EyeOff, Lock, Mail, User, AlertCircle, CheckCircle } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import React, { useState } from "react";
import toast from "react-hot-toast";

const SignUpPage = () => {
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [emailError, setEmailError] = useState("");
    const [isEmailValid, setIsEmailValid] = useState(false);
    const router = useRouter();

    // Email validation function
    const validateEmail = (email: string) => {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    };

    // Handle email input change with validation
    const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const emailValue = e.target.value;
        setEmail(emailValue);
        
        if (emailValue === "") {
            setEmailError("");
            setIsEmailValid(false);
        } else if (!validateEmail(emailValue)) {
            setEmailError("Please enter a valid email address");
            setIsEmailValid(false);
        } else {
            setEmailError("");
            setIsEmailValid(true);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        // Validate email before submission
        if (!validateEmail(email)) {
            toast.error('Please enter a valid email address');
            return;
        }
        
        if (password !== confirmPassword) {
            toast.error('Passwords do not match');
            return;
        }

        setIsLoading(true);
        
        try {
            console.log("register request", name, email, password);
            const { AuthClient } = await import('@/lib/auth-client');
            const response = await AuthClient.register(name, email, password);
            
            if (response.success) {
                toast.success(response.message || "Registration successful!");
                return window.location.href = '/chat/new';
            } else {
                toast.error(response.error || "Registration failed");
                return window.location.href = '/sign-in?error=Registration failed';
            }
        } catch (error: unknown) {
            console.error(error);
            const errorMessage = error instanceof Error ? error.message : "Error during registration";
            toast.error(errorMessage);
        } finally {
            setIsLoading(false);
        }
    };

    const handleGoogleSignUp = async () => {
        const { AuthClient } = await import('@/lib/auth-client');
        await AuthClient.initiateGoogleLogin();
    };


    return (
        <div className="flex flex-col min-h-screen items-center justify-center bg-gray-900 px-4 py-12 sm:px-6 lg:px-8">
        
            <Card className="w-full max-w-[430px] text-gray-100">
                <CardHeader className="space-y-1 text-left">
                    <CardDescription>
                    Only email registration is supported in your region. One DeepThink account is all you need to access to all DeepThink services.
                    </CardDescription>
                </CardHeader>
        
                <CardContent>
                    <form className="space-y-4" onSubmit={handleSubmit}>
                    <div className="space-y-2">
                        <div className="relative">
                            <Input
                                id="name"
                                placeholder="Full name"
                                type="text"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                className="pl-10 bg-gray-800 border-gray-600 text-gray-100 placeholder:text-gray-400"
                                required
                            />
                            <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                        </div>
                    </div>
                    <div className="space-y-2">
                        <div className="relative">
                            <Input
                                id="email"
                                placeholder="email address"
                                type="email"
                                value={email}
                                onChange={handleEmailChange}
                                className={`pl-10 pr-10 bg-gray-800 border-gray-600 text-gray-100 placeholder:text-gray-400 ${
                                    emailError ? 'border-red-500' : isEmailValid ? 'border-green-500' : ''
                                }`}
                                required
                            />
                            <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                            
                            {/* Email validation icon */}
                            {email && (
                                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                                    {isEmailValid ? (
                                        <CheckCircle className="h-4 w-4 text-green-500" />
                                    ) : emailError ? (
                                        <AlertCircle className="h-4 w-4 text-red-500" />
                                    ) : null}
                                </div>
                            )}
                        </div>
                        
                        {/* Email error message */}
                        {emailError && (
                            <p className="text-sm text-red-400 flex items-center gap-1">
                                <AlertCircle className="h-3 w-3" />
                                {emailError}
                            </p>
                        )}
                        
                        {/* Email success message */}
                        {isEmailValid && (
                            <p className="text-sm text-green-400 flex items-center gap-1">
                                <CheckCircle className="h-3 w-3" />
                                Valid email address
                            </p>
                        )}
                    </div>
    
                    <div className="space-y-2">
                        <div className="relative">
                            <Input
                                id="password"
                                placeholder="password"
                                type={showPassword ? "text" : "password"}
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="pl-10 bg-gray-800 border-gray-600 text-gray-100 placeholder:text-gray-400"
                                required
                            />
                            <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-3 top-1/2  -translate-y-1/2 text-gray-400 hover:text-gray-300"
                            >
                                {showPassword ? (
                                    <EyeOff className="h-4 w-4" />
                                ) : (
                                    <Eye className="h-4 w-4" />
                                )}
                            </button>
                        </div>
                    </div>


                    <div className="space-y-2">
                        <div className="relative">
                            <Input
                                id="confirmPassword"
                                placeholder="confirm password"
                                type={showPassword ? "text" : "password"}
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                className="pl-10 bg-gray-800 border-gray-600 text-gray-100 placeholder:text-gray-400"
                                required
                            />
                            <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-3 top-1/2  -translate-y-1/2 text-gray-400 hover:text-gray-300"
                            >
                                {showPassword ? (
                                    <EyeOff className="h-4 w-4" />
                                ) : (
                                    <Eye className="h-4 w-4" />
                                )}
                            </button>
                        </div>
                    </div>

                    
        
                    <div className="text-left text-xs text-gray-400">
                        By signing up or logging in, you consent to DeepThink&apos;s{" "}
                        <a href="#" className="text-blue-400 underline hover:text-blue-300">
                            Terms of Use
                        </a>{" "}
                        and{" "}
                        <a href="#" className="text-blue-400 underline hover:text-blue-300">
                            Privacy Policy
                        </a>
                        .
                    </div>
                    <Button
                        type="submit"
                        className="w-full bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-50 disabled:cursor-not-allowed"
                        disabled={isLoading || !isEmailValid || !name.trim() || !password || !confirmPassword}
                    >
                        {isLoading ? "Creating account..." : "Sign up"}
                    </Button>
                    </form>
                    <div className="mt-4 text-center text-sm text-gray-300">
                        Already have an account?{" "}
                    <Button
                        variant="link"
                        className="px-0 text-blue-400 text-sm hover:text-blue-300"
                        asChild
                    >
                        <Link href="/sign-in">Sign in</Link>
                    </Button>
                    </div>

                    <div className="relative mt-6">
                        <div className="absolute inset-0 flex items-center">
                            <div className="w-full border-t border-gray-600" />
                        </div>
                        <div className="relative flex justify-center text-sm">
                            <span className="bg-gray-700 px-2 text-gray-400">OR</span>
                        </div>
                    </div>
                    
                    <Button variant="outline" className="mt-6 w-full border-gray-600 text-gray-500 hover:bg-gray-700 hover:text-white" onClick={handleGoogleSignUp}>
                        <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
                            <path
                                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                                fill="#4285F4"
                            />
                            <path
                                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                                fill="#34A853"
                            />
                            <path
                                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                                fill="#FBBC05"
                            />
                            <path
                                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                                fill="#EA4335"
                            />
                            <path d="M1 1h22v22H1z" fill="none" />
                        </svg>
                        Sign up with Google
                    </Button>
             
                </CardContent>
            </Card>
        </div>
    );
}

export default SignUpPage;