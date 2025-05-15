
import { useState } from 'react';
import Sidebar from '@/components/Sidebar';
import FloatingUploadButton from '@/components/FloatingUploadButton';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/components/ui/use-toast';
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";

export default function Settings() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  const handleSave = () => {
    setLoading(true);

    // Simulate API call
    setTimeout(() => {
      setLoading(false);
      toast({
        title: 'Settings saved',
        description: 'Your preferences have been updated successfully.',
      });
    }, 1000);
  };

  return (
    <div className="flex min-h-screen">
      <Sidebar />

      <div className="flex-1 overflow-auto">
        <div className="container py-8 px-4 max-w-5xl">
          <h1 className="text-3xl font-bold mb-2">Settings</h1>
          <p className="text-muted-foreground mb-8">Manage your account and preferences</p>

          <div className="grid grid-cols-1 gap-8">
            {/* Profile Section */}
            <Card>
              <CardHeader>
                <CardTitle>Profile</CardTitle>
                <CardDescription>Update your personal information</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col md:flex-row gap-8">
                  <div className="flex flex-col items-center gap-4">
                    <Avatar className="h-24 w-24">
                      <AvatarImage src="https://th.bing.com/th/id/OIP.r_sTjdmoydSPvt5Ii79wawAAAA?cb=iwc2&rs=1&pid=ImgDetMain" alt="User" />
                      <AvatarFallback>CN</AvatarFallback>
                    </Avatar>
                    <Button variant="outline" size="sm">Change Avatar</Button>
                  </div>
                  <div className="flex-1 space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="firstName">First Name</Label>
                        <Input id="firstName" defaultValue="Darren" />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="lastName">Last Name</Label>
                        <Input id="lastName" defaultValue="Watkins Jr." />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email">Email</Label>
                      <Input id="email" type="email" defaultValue="ishowspeed@ronaldo.com" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="username">Username</Label>
                      <Input id="username" defaultValue="ishowspeed" />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Preferences Section */}
            <Card>
              <CardHeader>
                <CardTitle>Preferences</CardTitle>
                <CardDescription>Customize your experience</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <h3 className="text-lg font-medium">Display</h3>
                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="darkMode" className="text-base">Dark Mode</Label>
                      <p className="text-sm text-muted-foreground">Enable dark mode for a more comfortable viewing experience</p>
                    </div>
                    <Switch id="darkMode" defaultChecked />
                  </div>
                </div>

                <Separator />

                <div className="space-y-4">
                  <h3 className="text-lg font-medium">Notifications</h3>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <Label htmlFor="emailNotifications" className="text-base">Email Notifications</Label>
                        <p className="text-sm text-muted-foreground">Receive email updates when your AI processes are complete</p>
                      </div>
                      <Switch id="emailNotifications" defaultChecked />
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <Label htmlFor="pushNotifications" className="text-base">Push Notifications</Label>
                        <p className="text-sm text-muted-foreground">Receive browser notifications</p>
                      </div>
                      <Switch id="pushNotifications" />
                    </div>
                  </div>
                </div>

                <Separator />

                <div className="space-y-4">
                  <h3 className="text-lg font-medium">AI Preferences</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="defaultVoice">Default Voice for Podcasts</Label>
                      <Select defaultValue="v1">
                        <SelectTrigger id="defaultVoice">
                          <SelectValue placeholder="Select voice" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="v1">Emma (Female, US)</SelectItem>
                          <SelectItem value="v2">James (Male, UK)</SelectItem>
                          <SelectItem value="v3">Sofia (Female, ES)</SelectItem>
                          <SelectItem value="v4">Michael (Male, AU)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="defaultSummaryFormat">Default Summary Format</Label>
                      <Select defaultValue="bullet">
                        <SelectTrigger id="defaultSummaryFormat">
                          <SelectValue placeholder="Select format" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="bullet">Bullet Points</SelectItem>
                          <SelectItem value="paragraph">Paragraphs</SelectItem>
                          <SelectItem value="tldr">TL;DR</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>

                <Separator />

                <div className="space-y-4">
                  <h3 className="text-lg font-medium">API Integrations</h3>
                  <div className="space-y-2">
                    <Label htmlFor="openaiKey">OpenAI API Key (Optional)</Label>
                    <Input id="openaiKey" type="password" placeholder="Enter your OpenAI API key" />
                    <p className="text-xs text-muted-foreground">Use your own API key for faster processing</p>
                  </div>
                </div>

                <div className="pt-4 flex justify-end gap-3">
                  <Button variant="outline">Cancel</Button>
                  <Button onClick={handleSave} disabled={loading}>
                    {loading ? 'Saving...' : 'Save Changes'}
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Subscription Section */}
            <Card>
              <CardHeader>
                <CardTitle>Subscription</CardTitle>
                <CardDescription>Manage your subscription plan</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="bg-secondary/50 p-4 rounded-lg mb-6">
                  <div className="flex justify-between items-center mb-2">
                    <h3 className="text-lg font-medium">Current Plan: <span className="text-primary">Free</span></h3>
                    <Button variant="outline" size="sm">Upgrade</Button>
                  </div>
                  <p className="text-sm text-muted-foreground">You are currently on the free plan with limited features</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {[
                    {
                      name: 'Free',
                      price: '$0',
                      features: ['3 Documents', 'Basic AI Summaries', 'Limited Audio Conversion'],
                      current: true
                    },
                    {
                      name: 'Pro',
                      price: '$9.99',
                      features: ['Unlimited Documents', 'Advanced AI Q&A', 'Full Audio Conversion', 'Priority Processing'],
                      recommended: true
                    },
                    {
                      name: 'Team',
                      price: '$29.99',
                      features: ['Everything in Pro', 'Collaborative Notes', 'Team Administration', '24/7 Support'],
                    }
                  ].map((plan) => (
                    <Card
                      key={plan.name}
                      className={`border overflow-hidden ${plan.recommended ? 'border-primary' : ''}`}
                    >
                      {plan.recommended && (
                        <div className="bg-primary text-primary-foreground text-center py-1 text-xs font-medium">
                          RECOMMENDED
                        </div>
                      )}
                      <CardHeader>
                        <CardTitle>{plan.name}</CardTitle>
                        <div className="text-2xl font-bold">{plan.price} <span className="text-sm font-normal text-muted-foreground">/ month</span></div>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <ul className="space-y-2">
                          {plan.features.map((feature, i) => (
                            <li key={i} className="flex items-center gap-2 text-sm">
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-primary" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                              </svg>
                              {feature}
                            </li>
                          ))}
                        </ul>
                        <Button
                          className="w-full"
                          variant={plan.current ? 'secondary' : plan.recommended ? 'default' : 'outline'}
                          disabled={plan.current}
                        >
                          {plan.current ? 'Current Plan' : 'Choose Plan'}
                        </Button>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      <FloatingUploadButton />
    </div>
  );
}
