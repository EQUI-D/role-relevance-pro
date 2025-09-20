import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { UserIcon, BuildingIcon } from "lucide-react";

interface LoginScreenProps {
  onLogin: (userType: 'student' | 'placement', userData: any) => void;
}

const LoginScreen = ({ onLogin }: LoginScreenProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleLogin = async (userType: 'student' | 'placement') => {
    setIsLoading(true);
    
    // Simulate login - replace with actual Supabase auth
    setTimeout(() => {
      setIsLoading(false);
      onLogin(userType, {
        id: "user-123",
        email,
        name: userType === 'student' ? "John Doe" : "Jane Smith",
        type: userType,
        location: "Hyderabad"
      });
    }, 1500);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background relative overflow-hidden">
      {/* Background pattern */}
      <div className="absolute inset-0 gradient-hero opacity-5" />
      <div className="absolute inset-0">
        <div className="absolute top-10 left-10 w-32 h-32 gradient-primary rounded-full opacity-10 blur-3xl" />
        <div className="absolute bottom-10 right-10 w-40 h-40 gradient-accent rounded-full opacity-10 blur-3xl" />
      </div>

      <div className="z-10 w-full max-w-md mx-auto px-6">
        <Card className="shadow-card border-0">
          <CardHeader className="text-center space-y-4">
            <div className="w-16 h-16 mx-auto gradient-primary rounded-2xl flex items-center justify-center shadow-elegant">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <CardTitle className="text-2xl font-bold">Welcome Back</CardTitle>
            <CardDescription>
              Sign in to access the Resume Relevance System
            </CardDescription>
          </CardHeader>

          <CardContent>
            <Tabs defaultValue="student" className="space-y-6">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="student" className="flex items-center gap-2">
                  <UserIcon size={16} />
                  Student
                </TabsTrigger>
                <TabsTrigger value="placement" className="flex items-center gap-2">
                  <BuildingIcon size={16} />
                  Placement Team
                </TabsTrigger>
              </TabsList>

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="your.email@innomatics.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="transition-smooth focus:shadow-card"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="transition-smooth focus:shadow-card"
                  />
                </div>
              </div>

              <TabsContent value="student" className="space-y-4">
                <Button
                  className="w-full gradient-primary text-white shadow-elegant hover:shadow-lg transition-smooth"
                  onClick={() => handleLogin('student')}
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Signing in...
                    </div>
                  ) : (
                    "Sign in as Student"
                  )}
                </Button>
              </TabsContent>

              <TabsContent value="placement" className="space-y-4">
                <Button
                  className="w-full gradient-accent text-white shadow-elegant hover:shadow-lg transition-smooth"
                  onClick={() => handleLogin('placement')}
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Signing in...
                    </div>
                  ) : (
                    "Sign in as Placement Team"
                  )}
                </Button>
              </TabsContent>
            </Tabs>

            <div className="mt-6 text-center text-sm text-muted-foreground">
              Need help? Contact your administrator
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default LoginScreen;