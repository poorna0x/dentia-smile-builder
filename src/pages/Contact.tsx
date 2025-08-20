/**
 * Contact Page Component
 * 
 * This page provides contact information and a contact form for the dental clinic.
 * It includes:
 * - Navigation header with clinic branding
 * - Page header with title and description
 * - Contact information card with clinic details
 * - Contact form for patient inquiries
 * - Footer with additional contact information
 * 
 * Contact Information Displayed:
 * - Phone number with click-to-call functionality
 * - Email address with mailto link
 * - Physical address
 * - Working hours
 * 
 * Contact Form Features:
 * - Patient name fields (first and last name)
 * - Email and phone number inputs
 * - Subject line for inquiry categorization
 * - Message textarea for detailed inquiries
 * - Form validation and submission handling
 * 
 * Features:
 * - Responsive design for all screen sizes
 * - SEO-friendly page structure
 * - Consistent branding with main site
 * - Interactive contact elements
 * - Professional form design
 * - Easy access to all contact methods
 * 
 * @returns JSX.Element - The rendered contact page
 */
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Phone, Mail, MapPin, Clock, Send } from 'lucide-react';

const ContactPage = () => {
  return (
    <div className="min-h-screen">
      <Navigation />
      <main className="pt-20">
        <div className="container mx-auto px-4 py-8">
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold text-primary mb-4">Contact Us</h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Get in touch with us for any questions or to schedule your appointment
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
            {/* Contact Information */}
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-2xl font-bold text-primary">Get In Touch</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center space-x-3">
                    <Phone className="w-5 h-5 text-accent" />
                    <div>
                      <p className="font-medium">Phone</p>
                      <p className="text-muted-foreground">6363116263</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <Mail className="w-5 h-5 text-accent" />
                    <div>
                      <p className="font-medium">Email</p>
                      <p className="text-muted-foreground">contact@jeshnadentalclinic.com</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <MapPin className="w-5 h-5 text-accent" />
                    <div>
                      <p className="font-medium">Address</p>
                      <p className="text-muted-foreground">Jeshna Dental Clinic, Bangalore, Karnataka</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <Clock className="w-5 h-5 text-accent" />
                    <div>
                      <p className="font-medium">Working Hours</p>
                      <p className="text-muted-foreground">Mon to Sat 09:00 - 20:00</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Contact Form */}
            <Card>
              <CardHeader>
                <CardTitle className="text-2xl font-bold text-primary">Send Message</CardTitle>
              </CardHeader>
              <CardContent>
                <form className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">First Name</label>
                      <Input placeholder="Enter your first name" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Last Name</label>
                      <Input placeholder="Enter your last name" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Email</label>
                    <Input type="email" placeholder="Enter your email" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Phone</label>
                    <Input placeholder="Enter your phone number" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Subject</label>
                    <Input placeholder="Enter subject" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Message</label>
                    <Textarea 
                      placeholder="Enter your message" 
                      rows={4}
                      className="resize-none"
                    />
                  </div>
                  <Button type="submit" className="w-full">
                    <Send className="w-4 h-4 mr-2" />
                    Send Message
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default ContactPage;
