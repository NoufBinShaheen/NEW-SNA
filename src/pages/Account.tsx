import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { User, Mail, Calendar, Shield, Bell, Camera, Loader2, Trash2, UserX } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Profile {
  first_name: string | null;
  last_name: string | null;
  avatar_url: string | null;
  email_notifications: boolean;
  meal_reminders: boolean;
  weekly_reports: boolean;
  coach_reminder_frequency: string | null;
}

const Account = () => {
  const { user, loading, session } = useAuth();
  const navigate = useNavigate();
  
  const [profile, setProfile] = useState<Profile | null>(null);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [mealReminders, setMealReminders] = useState(true);
  const [weeklyReports, setWeeklyReports] = useState(true);
  const [coachReminderFrequency, setCoachReminderFrequency] = useState("weekly");
  
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingEmail, setSavingEmail] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);
  const [savingNotifications, setSavingNotifications] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [deletingData, setDeletingData] = useState(false);
  const [deletingAccount, setDeletingAccount] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      navigate("/auth");
    }
  }, [user, loading, navigate]);

  useEffect(() => {
    if (user) {
      fetchProfile();
      setEmail(user.email || "");
    }
  }, [user]);

  const fetchProfile = async () => {
    if (!user) return;
    
    const { data, error } = await supabase
      .from("profiles")
      .select("first_name, last_name, avatar_url, email_notifications, meal_reminders, weekly_reports, coach_reminder_frequency")
      .eq("user_id", user.id)
      .maybeSingle();

    if (error) {
      console.error("Error fetching profile:", error);
      return;
    }

    if (data) {
      setProfile(data);
      setFirstName(data.first_name || "");
      setLastName(data.last_name || "");
      setAvatarUrl(data.avatar_url);
      setEmailNotifications(data.email_notifications);
      setMealReminders(data.meal_reminders);
      setWeeklyReports(data.weekly_reports);
      setCoachReminderFrequency(data.coach_reminder_frequency || "weekly");
    }
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || !e.target.files[0] || !user) return;
    
    const file = e.target.files[0];
    const fileExt = file.name.split(".").pop();
    const filePath = `${user.id}/${crypto.randomUUID()}.${fileExt}`;

    setUploadingAvatar(true);
    
    try {
      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from("avatars")
        .getPublicUrl(filePath);

      const { error: updateError } = await supabase
        .from("profiles")
        .update({ avatar_url: publicUrl })
        .eq("user_id", user.id);

      if (updateError) throw updateError;

      setAvatarUrl(publicUrl);
      toast.success("Avatar updated successfully!");
    } catch (error: any) {
      toast.error("Failed to upload avatar: " + error.message);
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handleChangeEmail = async () => {
    if (!email || email === user?.email) {
      toast.error("Please enter a different email address");
      return;
    }

    setSavingEmail(true);
    
    try {
      const { error } = await supabase.auth.updateUser({
        email: email
      });

      if (error) throw error;
      
      toast.success("Verification email sent! Please check your inbox to confirm the change.");
    } catch (error: any) {
      toast.error("Failed to update email: " + error.message);
    } finally {
      setSavingEmail(false);
    }
  };

  const handleSaveProfile = async () => {
    if (!user) return;
    
    setSavingProfile(true);
    
    try {
      const { error } = await supabase
        .from("profiles")
        .update({ first_name: firstName, last_name: lastName })
        .eq("user_id", user.id);

      if (error) throw error;
      
      toast.success("Profile updated successfully!");
    } catch (error: any) {
      toast.error("Failed to update profile: " + error.message);
    } finally {
      setSavingProfile(false);
    }
  };

  const handleChangePassword = async () => {
    if (newPassword !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

    if (newPassword.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }

    setSavingPassword(true);
    
    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      });

      if (error) throw error;
      
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      toast.success("Password changed successfully!");
    } catch (error: any) {
      toast.error("Failed to change password: " + error.message);
    } finally {
      setSavingPassword(false);
    }
  };

  const handleSaveNotifications = async () => {
    if (!user) return;
    
    setSavingNotifications(true);
    
    try {
      const { error } = await supabase
        .from("profiles")
        .update({
          email_notifications: emailNotifications,
          meal_reminders: mealReminders,
          weekly_reports: weeklyReports,
          coach_reminder_frequency: coachReminderFrequency
        })
        .eq("user_id", user.id);

      if (error) throw error;
      
      toast.success("Notification settings saved!");
    } catch (error: any) {
      toast.error("Failed to save notification settings: " + error.message);
    } finally {
      setSavingNotifications(false);
    }
  };

  const handleDeleteUserData = async () => {
    if (!user) return;
    
    setDeletingData(true);
    
    try {
      // Delete health profile
      const { error: healthError } = await supabase
        .from("health_profiles")
        .delete()
        .eq("user_id", user.id);
      
      if (healthError) throw healthError;

      // Delete daily tracking data
      const { error: trackingError } = await supabase
        .from("daily_tracking")
        .delete()
        .eq("user_id", user.id);
      
      if (trackingError) throw trackingError;

      // Reset profile to defaults (keep the profile row for auth)
      const { error: profileError } = await supabase
        .from("profiles")
        .update({
          first_name: null,
          last_name: null,
          avatar_url: null,
          email_notifications: true,
          meal_reminders: true,
          weekly_reports: true,
        })
        .eq("user_id", user.id);
      
      if (profileError) throw profileError;

      // Reset local state
      setFirstName("");
      setLastName("");
      setAvatarUrl(null);
      setEmailNotifications(true);
      setMealReminders(true);
      setWeeklyReports(true);
      setProfile(null);

      toast.success("All your data has been deleted successfully");
    } catch (error: any) {
      toast.error("Failed to delete data: " + error.message);
    } finally {
      setDeletingData(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (!user || !session) return;
    
    setDeletingAccount(true);
    
    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/delete-account`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${session.access_token}`,
          },
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to delete account");
      }

      toast.success("Your account has been deleted");
      navigate("/");
    } catch (error: any) {
      toast.error("Failed to delete account: " + error.message);
    } finally {
      setDeletingAccount(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user) return null;

  const createdAt = user.created_at ? new Date(user.created_at).toLocaleDateString() : "N/A";

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <main className="pt-24 pb-16">
        <div className="container mx-auto px-4 max-w-4xl">
          <div className="mb-8">
            <h1 className="text-3xl font-display font-bold text-foreground mb-2">
              Account Settings
            </h1>
            <p className="text-muted-foreground">
              Manage your account information and preferences
            </p>
          </div>

          <div className="grid gap-6">
            {/* Profile Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="w-5 h-5 text-primary" />
                  Profile Information
                </CardTitle>
                <CardDescription>
                  Update your personal details and avatar
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Avatar */}
                <div className="flex items-center gap-4">
                  <div className="relative">
                    <div className="w-20 h-20 rounded-full overflow-hidden bg-muted flex items-center justify-center">
                      {avatarUrl ? (
                        <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                      ) : (
                        <User className="w-10 h-10 text-muted-foreground" />
                      )}
                    </div>
                    <label className="absolute bottom-0 right-0 w-8 h-8 bg-primary rounded-full flex items-center justify-center cursor-pointer hover:bg-primary/90 transition-colors">
                      {uploadingAvatar ? (
                        <Loader2 className="w-4 h-4 text-primary-foreground animate-spin" />
                      ) : (
                        <Camera className="w-4 h-4 text-primary-foreground" />
                      )}
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handleAvatarUpload}
                        disabled={uploadingAvatar}
                      />
                    </label>
                  </div>
                  <div>
                    <p className="font-medium text-foreground">Profile Picture</p>
                    <p className="text-sm text-muted-foreground">Click the camera icon to upload</p>
                  </div>
                </div>

                {/* Name fields */}
                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="firstName">First Name</Label>
                    <Input
                      id="firstName"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      placeholder="Enter your first name"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lastName">Last Name</Label>
                    <Input
                      id="lastName"
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      placeholder="Enter your last name"
                    />
                  </div>
                </div>

                {/* Email */}
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <div className="flex items-center gap-2">
                    <Mail className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                    <Input 
                      id="email" 
                      type="email"
                      value={email} 
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="Enter your email"
                    />
                    <Button 
                      size="sm" 
                      onClick={handleChangeEmail} 
                      disabled={savingEmail || email === user.email}
                    >
                      {savingEmail && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                      Update
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground">A verification email will be sent to confirm the change</p>
                </div>

                {/* Member since */}
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Calendar className="w-4 h-4" />
                  Member since {createdAt}
                </div>

                <Button onClick={handleSaveProfile} disabled={savingProfile}>
                  {savingProfile && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  Save Profile
                </Button>
              </CardContent>
            </Card>

            {/* Password Change */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="w-5 h-5 text-primary" />
                  Change Password
                </CardTitle>
                <CardDescription>
                  Update your password to keep your account secure
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="newPassword">New Password</Label>
                  <Input
                    id="newPassword"
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Enter new password"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirm New Password</Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Confirm new password"
                  />
                </div>
                <Button onClick={handleChangePassword} disabled={savingPassword || !newPassword || !confirmPassword}>
                  {savingPassword && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  Change Password
                </Button>
              </CardContent>
            </Card>

            {/* Notification Settings */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Bell className="w-5 h-5 text-primary" />
                  Notification Settings
                </CardTitle>
                <CardDescription>
                  Manage how you receive notifications
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Email Notifications</Label>
                    <p className="text-sm text-muted-foreground">Receive email updates about your account</p>
                  </div>
                  <Switch
                    checked={emailNotifications}
                    onCheckedChange={setEmailNotifications}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Meal Reminders</Label>
                    <p className="text-sm text-muted-foreground">Get reminded to log your meals</p>
                  </div>
                  <Switch
                    checked={mealReminders}
                    onCheckedChange={setMealReminders}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Weekly Reports</Label>
                    <p className="text-sm text-muted-foreground">Receive weekly nutrition summaries</p>
                  </div>
                  <Switch
                    checked={weeklyReports}
                    onCheckedChange={setWeeklyReports}
                  />
                </div>
                
                {/* Coach Reminder Frequency */}
                <div className="space-y-2">
                  <Label>AI Coach Reminder Frequency</Label>
                  <p className="text-sm text-muted-foreground mb-2">How often should we remind you to check in with your AI coach?</p>
                  <div className="flex gap-2">
                    <Button 
                      variant={coachReminderFrequency === "daily" ? "default" : "outline"}
                      size="sm"
                      onClick={() => setCoachReminderFrequency("daily")}
                    >
                      Daily
                    </Button>
                    <Button 
                      variant={coachReminderFrequency === "weekly" ? "default" : "outline"}
                      size="sm"
                      onClick={() => setCoachReminderFrequency("weekly")}
                    >
                      Weekly
                    </Button>
                    <Button 
                      variant={coachReminderFrequency === "none" ? "default" : "outline"}
                      size="sm"
                      onClick={() => setCoachReminderFrequency("none")}
                    >
                      None
                    </Button>
                  </div>
                </div>
                <Button onClick={handleSaveNotifications} disabled={savingNotifications}>
                  {savingNotifications && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  Save Notification Settings
                </Button>
              </CardContent>
            </Card>

            {/* Delete User Data */}
            <Card className="border-destructive/50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-destructive">
                  <Trash2 className="w-5 h-5" />
                  Delete User Data
                </CardTitle>
                <CardDescription>
                  Permanently delete all your data including health profiles, meal plans, and tracking history
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">
                  This action will delete your health profile, daily tracking data, and reset your profile settings. 
                  Your account will remain active but all personalized data will be removed. This cannot be undone.
                </p>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="destructive" disabled={deletingData}>
                      {deletingData && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                      Delete All My Data
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                      <AlertDialogDescription>
                        This action cannot be undone. This will permanently delete your health profile, 
                        daily tracking data, and reset your profile settings.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={handleDeleteUserData}
                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                      >
                        Yes, delete my data
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </CardContent>
            </Card>

            {/* Delete Account */}
            <Card className="border-destructive/50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-destructive">
                  <UserX className="w-5 h-5" />
                  Delete Account
                </CardTitle>
                <CardDescription>
                  Permanently delete your account and all associated data
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">
                  This action will permanently delete your account and all your data. 
                  You will be logged out and will not be able to recover your account.
                </p>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="destructive" disabled={deletingAccount}>
                      {deletingAccount && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                      Delete My Account
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Delete your account?</AlertDialogTitle>
                      <AlertDialogDescription>
                        This action is permanent and cannot be undone. Your account and all associated 
                        data will be permanently deleted.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={handleDeleteAccount}
                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                      >
                        Yes, delete my account
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Account;
