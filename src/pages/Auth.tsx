import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Loader2, Shield } from 'lucide-react';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth, getRoleDashboard } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import beehotelLogo from '@/assets/beehotel-logo.png';

const loginSchema = z.object({
  username: z.string().min(1, 'Username is required').max(100),
  password: z.string().min(6, 'Password must be at least 6 characters').max(100),
});

type LoginFormData = z.infer<typeof loginSchema>;

const signupSchema = z
  .object({
    email: z.string().email('A valid email is required').max(255),
    password: z.string().min(6, 'Password must be at least 6 characters').max(100),
    confirmPassword: z.string().min(6, 'Please confirm your password').max(100),
  })
  .refine((val) => val.password === val.confirmPassword, {
    path: ['confirmPassword'],
    message: 'Passwords do not match',
  });

type SignupFormData = z.infer<typeof signupSchema>;

export default function Auth() {
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [waitingForRoles, setWaitingForRoles] = useState(false);
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const { signIn, signUp, user, roles } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  // Redirect if already logged in with roles loaded
  useEffect(() => {
    if (user && !waitingForRoles) {
      if (roles.length > 0) {
        const dashboard = getRoleDashboard(roles);
        navigate(dashboard);
      }
    }
  }, [user, roles, waitingForRoles, navigate]);

  // Handle role-based redirect after login
  useEffect(() => {
    if (waitingForRoles && roles.length > 0) {
      setWaitingForRoles(false);
      const dashboard = getRoleDashboard(roles);
      navigate(dashboard);
    }
  }, [waitingForRoles, roles, navigate]);

  const loginForm = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: { username: '', password: '' },
  });

  const signupForm = useForm<SignupFormData>({
    resolver: zodResolver(signupSchema),
    defaultValues: { email: '', password: '', confirmPassword: '' },
  });

  const handleLogin = async (data: LoginFormData) => {
    setIsLoading(true);
    const { error } = await signIn(data.username, data.password);
    setIsLoading(false);

    if (error) {
      toast({
        variant: 'destructive',
        title: 'Login Failed',
        description: error.message === 'Invalid login credentials'
          ? 'Invalid username or password. Please try again.'
          : error.message,
      });
    } else {
      setWaitingForRoles(true);
      toast({
        title: 'Login Successful',
        description: 'Redirecting to your dashboard...',
      });
    }
  };

  const handleSignup = async (data: SignupFormData) => {
    setIsLoading(true);
    const { error } = await signUp(data.email, data.password);
    setIsLoading(false);

    if (error) {
      toast({
        variant: 'destructive',
        title: 'Sign up failed',
        description: error.message,
      });
      return;
    }

    toast({
      title: 'Account created',
      description:
        'Check your email to confirm your account (if required), then sign in.',
    });

    // Pre-fill login with the same email and switch to sign in
    loginForm.setValue('username', data.email);
    loginForm.setValue('password', '');
    signupForm.reset({ email: data.email, password: '', confirmPassword: '' });
    setMode('signin');
  };

  return (
    <div className="flex min-h-screen">
      {/* Left Side - Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-primary via-primary/90 to-primary/80 relative overflow-hidden">
        {/* Decorative Elements */}
        <div className="absolute inset-0">
          <div className="absolute top-20 left-10 w-72 h-72 bg-white/10 rounded-full blur-3xl" />
          <div className="absolute bottom-20 right-10 w-96 h-96 bg-white/5 rounded-full blur-3xl" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-white/5 rounded-full blur-3xl" />
        </div>
        
        {/* Grid Pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0" style={{
            backgroundImage: 'radial-gradient(circle at 1px 1px, white 1px, transparent 0)',
            backgroundSize: '40px 40px'
          }} />
        </div>

        {/* Content */}
        <div className="relative z-10 flex flex-col justify-center items-center w-full p-12 text-white">
          <img 
            src={beehotelLogo} 
            alt="BeeHotel Logo" 
            className="h-32 w-32 mb-8 drop-shadow-2xl"
          />
          <h1 className="text-5xl font-bold mb-4 tracking-tight">BeeHotel</h1>
          <p className="text-xl text-white/80 text-center max-w-md">
            Multi-Tenant Property Management System
          </p>
          
          {/* Features List */}
          <div className="mt-12 space-y-4">
            {[
              'Streamlined Front Desk Operations',
              'Real-time Room Management',
              'Comprehensive Reporting',
              'Multi-Property Support'
            ].map((feature, index) => (
              <div key={index} className="flex items-center gap-3 text-white/90">
                <div className="h-2 w-2 rounded-full bg-white/80" />
                <span className="text-sm">{feature}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right Side - Login Form */}
      <div className="flex-1 flex items-center justify-center bg-background p-4 lg:p-8">
        <div className="w-full max-w-md">
          {/* Mobile Logo */}
          <div className="lg:hidden mb-8 flex flex-col items-center">
            <img 
              src={beehotelLogo} 
              alt="BeeHotel Logo" 
              className="h-24 w-24 mb-4"
            />
            <h1 className="text-3xl font-bold text-foreground">BeeHotel</h1>
            <p className="mt-1 text-sm text-muted-foreground">Property Management System</p>
          </div>

          {/* Login Card */}
          <div className="rounded-2xl border bg-card p-8 shadow-xl">
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-foreground">
                {mode === 'signin' ? 'Welcome back' : 'Create your account'}
              </h2>
              <p className="mt-1 text-muted-foreground">
                {mode === 'signin'
                  ? 'Enter your credentials to access your dashboard'
                  : 'Sign up with email and password to get started'}
              </p>
            </div>

            <Tabs value={mode} onValueChange={(v) => setMode(v as 'signin' | 'signup')} className="space-y-6">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="signin">Sign in</TabsTrigger>
                <TabsTrigger value="signup">Sign up</TabsTrigger>
              </TabsList>

              <TabsContent value="signin">
                <form onSubmit={loginForm.handleSubmit(handleLogin)} className="space-y-5">
                  <div className="space-y-2">
                    <Label htmlFor="username" className="text-sm font-medium">
                      Email
                    </Label>
                    <Input
                      id="username"
                      placeholder="name@company.com"
                      autoComplete="email"
                      {...loginForm.register('username')}
                      className="h-12 rounded-xl border-muted-foreground/20 bg-muted/50 px-4 transition-all focus:bg-background focus:ring-2 focus:ring-primary/20"
                    />
                    {loginForm.formState.errors.username && (
                      <p className="text-xs text-destructive">
                        {loginForm.formState.errors.username.message}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="password" className="text-sm font-medium">
                      Password
                    </Label>
                    <div className="relative">
                      <Input
                        id="password"
                        type={showPassword ? 'text' : 'password'}
                        placeholder="Enter your password"
                        autoComplete="current-password"
                        {...loginForm.register('password')}
                        className="h-12 rounded-xl border-muted-foreground/20 bg-muted/50 px-4 pr-12 transition-all focus:bg-background focus:ring-2 focus:ring-primary/20"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                      >
                        {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                      </button>
                    </div>
                    {loginForm.formState.errors.password && (
                      <p className="text-xs text-destructive">
                        {loginForm.formState.errors.password.message}
                      </p>
                    )}
                  </div>

                  <Button
                    type="submit"
                    className="w-full h-12 rounded-xl text-base font-semibold shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/30 transition-all"
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                        Signing in...
                      </>
                    ) : (
                      'Sign In'
                    )}
                  </Button>
                </form>
              </TabsContent>

              <TabsContent value="signup">
                <form onSubmit={signupForm.handleSubmit(handleSignup)} className="space-y-5">
                  <div className="space-y-2">
                    <Label htmlFor="signup-email" className="text-sm font-medium">
                      Email
                    </Label>
                    <Input
                      id="signup-email"
                      placeholder="name@company.com"
                      autoComplete="email"
                      {...signupForm.register('email')}
                      className="h-12 rounded-xl border-muted-foreground/20 bg-muted/50 px-4 transition-all focus:bg-background focus:ring-2 focus:ring-primary/20"
                    />
                    {signupForm.formState.errors.email && (
                      <p className="text-xs text-destructive">
                        {signupForm.formState.errors.email.message}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="signup-password" className="text-sm font-medium">
                      Password
                    </Label>
                    <div className="relative">
                      <Input
                        id="signup-password"
                        type={showPassword ? 'text' : 'password'}
                        placeholder="Create a password"
                        autoComplete="new-password"
                        {...signupForm.register('password')}
                        className="h-12 rounded-xl border-muted-foreground/20 bg-muted/50 px-4 pr-12 transition-all focus:bg-background focus:ring-2 focus:ring-primary/20"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                      >
                        {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                      </button>
                    </div>
                    {signupForm.formState.errors.password && (
                      <p className="text-xs text-destructive">
                        {signupForm.formState.errors.password.message}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="signup-confirm" className="text-sm font-medium">
                      Confirm password
                    </Label>
                    <Input
                      id="signup-confirm"
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Re-enter password"
                      autoComplete="new-password"
                      {...signupForm.register('confirmPassword')}
                      className="h-12 rounded-xl border-muted-foreground/20 bg-muted/50 px-4 transition-all focus:bg-background focus:ring-2 focus:ring-primary/20"
                    />
                    {signupForm.formState.errors.confirmPassword && (
                      <p className="text-xs text-destructive">
                        {signupForm.formState.errors.confirmPassword.message}
                      </p>
                    )}
                  </div>

                  <Button
                    type="submit"
                    className="w-full h-12 rounded-xl text-base font-semibold shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/30 transition-all"
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                        Creating account...
                      </>
                    ) : (
                      'Create Account'
                    )}
                  </Button>
                </form>
              </TabsContent>
            </Tabs>

            {/* Security Badge */}
            <div className="mt-6 flex items-center justify-center gap-2 text-xs text-muted-foreground">
              <Shield className="h-4 w-4" />
              <span>Secured with enterprise-grade encryption</span>
            </div>
          </div>

          {/* Demo Credentials */}
          <div className="mt-6 rounded-xl border border-dashed border-muted-foreground/30 bg-muted/30 p-4">
            <p className="text-center text-sm text-muted-foreground">
              <span className="font-medium text-foreground">Demo credentials:</span>
              <br />
              admin@demo.com / demo123
            </p>
          </div>

          {/* Footer */}
          <p className="mt-6 text-center text-xs text-muted-foreground">
            © 2024 BeeHotel. All rights reserved.
          </p>
        </div>
      </div>
    </div>
  );
}
