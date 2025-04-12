
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { calculatePages } from '@/components/PageCalculator';
import { FileUpload } from '@/components/FileUpload';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2 } from 'lucide-react';

const signUpSchema = z.object({
  email: z.string().email({ message: "Please enter a valid email address" }),
  password: z.string().min(6, { message: "Password must be at least 6 characters long" }),
  confirmPassword: z.string()
}).refine(data => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"]
});

const SignUp: React.FC = () => {
  const { signUp } = useAuth();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isFileLoading, setIsFileLoading] = useState(false);

  const form = useForm<z.infer<typeof signUpSchema>>({
    resolver: zodResolver(signUpSchema),
    defaultValues: {
      email: "",
      password: "",
      confirmPassword: ""
    }
  });

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Check file type
    if (file.type !== 'application/pdf') {
      toast({
        title: "Invalid file type",
        description: "Please upload a PDF file",
        variant: "destructive"
      });
      return;
    }

    // Check file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "File size exceeds 10MB limit",
        variant: "destructive"
      });
      return;
    }

    setIsFileLoading(true);
    try {
      const pageCount = await calculatePages(file);
      
      // Check page count
      if (pageCount > 50) {
        toast({
          title: "Too many pages",
          description: "PDF exceeds 50 page limit",
          variant: "destructive"
        });
        return;
      }
      
      setSelectedFile(file);
      toast({
        title: "File selected",
        description: `${file.name} (${pageCount} pages)`,
      });
    } catch (error) {
      toast({
        title: "Error processing file",
        description: "Could not read the PDF file",
        variant: "destructive"
      });
    } finally {
      setIsFileLoading(false);
    }
  };

  const onSubmit = async (data: z.infer<typeof signUpSchema>) => {
    setIsLoading(true);
    try {
      // Sign up the user
      const { error, data: authData } = await signUp(data.email, data.password);
      
      if (error) {
        toast({
          title: "Sign up failed",
          description: error.message,
          variant: "destructive"
        });
        return;
      }

      // If there's a file to upload
      if (selectedFile && authData?.user) {
        const userId = authData.user.id;
        const filePath = `${userId}/${selectedFile.name}`;
        
        // Upload file to Supabase Storage
        const { error: uploadError } = await supabase.storage
          .from('print_files')
          .upload(filePath, selectedFile);

        if (uploadError) {
          toast({
            title: "File upload failed",
            description: uploadError.message,
            variant: "destructive"
          });
        } else {
          // Get the file URL
          const { data: fileData } = supabase.storage
            .from('print_files')
            .getPublicUrl(filePath);

          // Create a record in the files table
          const { error: fileError } = await supabase
            .from('files')
            .insert({
              file_name: selectedFile.name,
              file_size: selectedFile.size,
              file_url: fileData.publicUrl,
              page_count: await calculatePages(selectedFile),
              user_id: userId,
              status: 'uploaded'
            });

          if (fileError) {
            toast({
              title: "Error creating file record",
              description: fileError.message,
              variant: "destructive"
            });
          }
        }
      }

      toast({
        title: "Sign up successful",
        description: "Your account has been created. Please check your email for verification.",
      });

      // Redirect to home page
      navigate('/');
    } catch (err: any) {
      toast({
        title: "Sign up failed",
        description: err.message || "An unexpected error occurred",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-md bg-white rounded-xl shadow-lg p-8">
        <h1 className="text-2xl font-bold text-center mb-6">Create an Account</h1>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input placeholder="your.email@example.com" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Password</FormLabel>
                  <FormControl>
                    <Input type="password" placeholder="••••••" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="confirmPassword"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Confirm Password</FormLabel>
                  <FormControl>
                    <Input type="password" placeholder="••••••" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="space-y-2">
              <FormLabel>Upload PDF (Optional)</FormLabel>
              <div className="mt-1">
                <FileUpload onFileSelect={handleFileSelect} />
                {isFileLoading && (
                  <div className="flex items-center justify-center mt-2">
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    <p className="text-sm text-gray-500">Processing file...</p>
                  </div>
                )}
                {selectedFile && !isFileLoading && (
                  <div className="text-sm text-gray-600 mt-2">
                    Selected: {selectedFile.name} ({(selectedFile.size / 1024 / 1024).toFixed(2)} MB)
                  </div>
                )}
              </div>
            </div>

            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating account...
                </>
              ) : (
                "Sign Up"
              )}
            </Button>
          </form>
        </Form>

        <div className="text-center mt-6">
          <p className="text-sm text-gray-600">
            Already have an account?{" "}
            <Button variant="link" className="p-0" onClick={() => navigate('/login')}>
              Log In
            </Button>
          </p>
        </div>
      </div>
    </div>
  );
};

export default SignUp;
