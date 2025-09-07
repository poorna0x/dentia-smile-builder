/**
 * Privacy Policy Page Component
 * 
 * This page contains the privacy policy for Jeshna Dental Care.
 * It covers data collection, usage, protection, and patient rights
 * in compliance with healthcare privacy regulations.
 * 
 * @returns JSX.Element - The rendered privacy policy page
 */
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Shield, Eye, Lock, UserCheck, FileText, Phone } from 'lucide-react';

const PrivacyPolicy = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-dental-mint via-dental-cream to-white">
      <Navigation />
      
      {/* Hero Section */}
      <section className="pt-24 pb-16">
        <div className="container mx-auto px-4">
          <div className="text-center max-w-3xl mx-auto">
            <div className="inline-flex items-center px-4 py-2 bg-blue-100 text-blue-700 rounded-full text-sm font-medium mb-6">
              <Shield className="w-4 h-4 mr-2" />
              Your Privacy Matters
            </div>
            <h1 className="heading-xl mb-6">
              <span className="text-gradient">Privacy Policy</span>
            </h1>
            <p className="body-lg text-dental-slate">
              At Jeshna Dental Care, we are committed to protecting your privacy and personal information. 
              This policy explains how we collect, use, and safeguard your data.
            </p>
            <p className="text-sm text-dental-slate mt-4">
              <strong>Last Updated:</strong> {new Date().toLocaleDateString()}
            </p>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto space-y-8">
            
            {/* Information We Collect */}
            <Card className="card-dental">
              <CardHeader>
                <CardTitle className="heading-md text-dental-charcoal flex items-center gap-2">
                  <Eye className="w-5 h-5 text-blue-600" />
                  Information We Collect
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h4 className="font-semibold text-dental-charcoal mb-2">Personal Information</h4>
                  <ul className="text-dental-slate space-y-1 ml-4">
                    <li>• Name, date of birth, and contact information</li>
                    <li>• Medical and dental history</li>
                    <li>• Insurance information</li>
                    <li>• Emergency contact details</li>
                    <li>• Payment and billing information</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-semibold text-dental-charcoal mb-2">Website Information</h4>
                  <ul className="text-dental-slate space-y-1 ml-4">
                    <li>• IP address and browser information</li>
                    <li>• Pages visited and time spent on our website</li>
                    <li>• Appointment booking information</li>
                    <li>• Contact form submissions</li>
                  </ul>
                </div>
              </CardContent>
            </Card>

            {/* How We Use Information */}
            <Card className="card-dental">
              <CardHeader>
                <CardTitle className="heading-md text-dental-charcoal flex items-center gap-2">
                  <UserCheck className="w-5 h-5 text-blue-600" />
                  How We Use Your Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-semibold text-dental-charcoal mb-2">Healthcare Services</h4>
                    <ul className="text-dental-slate space-y-1 text-sm">
                      <li>• Providing dental treatment and care</li>
                      <li>• Scheduling appointments</li>
                      <li>• Processing insurance claims</li>
                      <li>• Maintaining medical records</li>
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-semibold text-dental-charcoal mb-2">Communication</h4>
                    <ul className="text-dental-slate space-y-1 text-sm">
                      <li>• Appointment reminders</li>
                      <li>• Treatment follow-ups</li>
                      <li>• Health education materials</li>
                      <li>• Practice updates</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Data Protection */}
            <Card className="card-dental">
              <CardHeader>
                <CardTitle className="heading-md text-dental-charcoal flex items-center gap-2">
                  <Lock className="w-5 h-5 text-blue-600" />
                  Data Protection & Security
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-semibold text-dental-charcoal mb-2">Security Measures</h4>
                    <ul className="text-dental-slate space-y-1 text-sm">
                      <li>• Encrypted data transmission</li>
                      <li>• Secure server storage</li>
                      <li>• Regular security updates</li>
                      <li>• Access controls and authentication</li>
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-semibold text-dental-charcoal mb-2">Staff Training</h4>
                    <ul className="text-dental-slate space-y-1 text-sm">
                      <li>• HIPAA compliance training</li>
                      <li>• Privacy policy education</li>
                      <li>• Data handling procedures</li>
                      <li>• Confidentiality agreements</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Your Rights */}
            <Card className="card-dental">
              <CardHeader>
                <CardTitle className="heading-md text-dental-charcoal flex items-center gap-2">
                  <FileText className="w-5 h-5 text-blue-600" />
                  Your Privacy Rights
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-semibold text-dental-charcoal mb-2">Access & Control</h4>
                    <ul className="text-dental-slate space-y-1 text-sm">
                      <li>• Request copies of your records</li>
                      <li>• Correct inaccurate information</li>
                      <li>• Request data deletion</li>
                      <li>• Opt-out of marketing communications</li>
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-semibold text-dental-charcoal mb-2">Complaints</h4>
                    <ul className="text-dental-slate space-y-1 text-sm">
                      <li>• File privacy complaints</li>
                      <li>• Contact our privacy officer</li>
                      <li>• Report security concerns</li>
                      <li>• Request policy clarifications</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Contact Information */}
            <Card className="card-dental">
              <CardHeader>
                <CardTitle className="heading-md text-dental-charcoal flex items-center gap-2">
                  <Phone className="w-5 h-5 text-blue-600" />
                  Contact Us About Privacy
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-semibold text-dental-charcoal mb-2">Privacy Officer</h4>
                    <p className="text-dental-slate text-sm mb-2">Dr. Jeshna</p>
                    <p className="text-dental-slate text-sm">Jeshna Dental Care</p>
                    <p className="text-dental-slate text-sm">Bangalore, Karnataka</p>
                  </div>
                  <div>
                    <h4 className="font-semibold text-dental-charcoal mb-2">Contact Information</h4>
                    <p className="text-dental-slate text-sm mb-1">
                      <strong>Phone:</strong> <a href="tel:6363116263" className="text-blue-600 hover:text-blue-700">6363116263</a>
                    </p>
                    <p className="text-dental-slate text-sm mb-1">
                      <strong>Email:</strong> <a href="mailto:contact@jeshnadentalclinic.com" className="text-blue-600 hover:text-blue-700">contact@jeshnadentalclinic.com</a>
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Policy Updates */}
            <Card className="card-dental">
              <CardHeader>
                <CardTitle className="heading-md text-dental-charcoal">Policy Updates</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-dental-slate text-sm">
                  We may update this privacy policy from time to time. Any changes will be posted on this page 
                  with an updated revision date. We encourage you to review this policy periodically to stay 
                  informed about how we protect your information.
                </p>
                <p className="text-dental-slate text-sm mt-4">
                  <strong>Note:</strong> This privacy policy is designed to comply with applicable healthcare 
                  privacy laws and regulations. For specific legal advice, please consult with a qualified attorney.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default PrivacyPolicy;
