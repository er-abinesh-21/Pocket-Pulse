import React from 'react';
import { Wallet, Loader2, Chrome } from 'lucide-react';
import { Button } from '../shared/Button';
import { Input } from '../shared/Input';

/**
 * Authentication Form Component
 * Handles login and signup with email/password and Google sign-in
 */
export const AuthForm = ({
    authMode,
    authForm,
    onAuthFormChange,
    onSubmit,
    onGoogleSignIn,
    onToggleMode,
    loading
}) => {
    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 to-blue-50 dark:from-gray-900 dark:to-gray-800 p-4">
            <div className="w-full max-w-md">
                <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6 sm:p-8">
                    <div className="text-center mb-6 sm:mb-8">
                        <div className="inline-flex items-center justify-center w-14 h-14 sm:w-16 sm:h-16 bg-purple-100 dark:bg-purple-900 rounded-full mb-4">
                            <Wallet className="w-7 h-7 sm:w-8 sm:h-8 text-purple-600 dark:text-purple-400" />
                        </div>
                        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">Finance Dashboard</h1>
                        <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 mt-2">
                            {authMode === 'login' ? 'Welcome back!' : 'Create your account'}
                        </p>
                    </div>

                    <form onSubmit={onSubmit} className="space-y-4">
                        <Input
                            label="Email"
                            type="email"
                            value={authForm.email}
                            onChange={(e) => onAuthFormChange({ ...authForm, email: e.target.value })}
                            required
                        />

                        <Input
                            label="Password"
                            type="password"
                            value={authForm.password}
                            onChange={(e) => onAuthFormChange({ ...authForm, password: e.target.value })}
                            required
                            minLength={6}
                        />

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full py-2.5 sm:py-3 px-4 bg-purple-600 hover:bg-purple-700 text-white font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                        >
                            {loading ? (
                                <Loader2 className="w-5 h-5 animate-spin" />
                            ) : (
                                authMode === 'login' ? 'Sign In' : 'Sign Up'
                            )}
                        </button>
                    </form>

                    <div className="mt-4 sm:mt-6">
                        <div className="relative">
                            <div className="absolute inset-0 flex items-center">
                                <div className="w-full border-t border-gray-300 dark:border-gray-600"></div>
                            </div>
                            <div className="relative flex justify-center text-xs sm:text-sm">
                                <span className="px-2 bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400">Or continue with</span>
                            </div>
                        </div>

                        <button
                            onClick={onGoogleSignIn}
                            disabled={loading}
                            className="mt-4 w-full py-2.5 sm:py-3 px-4 border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
                        >
                            <Chrome className="w-5 h-5" />
                            <span>Google</span>
                        </button>
                    </div>

                    <div className="mt-4 sm:mt-6 text-center">
                        <button
                            onClick={onToggleMode}
                            className="text-sm text-purple-600 dark:text-purple-400 hover:underline"
                        >
                            {authMode === 'login' ? "Don't have an account? Sign up" : 'Already have an account? Sign in'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AuthForm;
