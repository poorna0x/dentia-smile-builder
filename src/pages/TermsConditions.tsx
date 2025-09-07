/**
 * Terms & Conditions Page Component
 * 
 * This page contains the terms and conditions for using Jeshna Dental Care's
 * website and services. It covers user responsibilities, service terms,
 * and legal disclaimers.
 * 
 * @returns JSX.Element - The rendered terms and conditions page
 */
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FileText, Users, Shield, AlertTriangle, Phone, Calendar } from 'lucide-react';

const TermsConditions = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-dental-mint via-dental-cream to-white">
      <Navigation />
      
      {/* Hero Section */}
      <section className="pt-24 pb-16">
        <div className="container mx-auto px-4">
          <div className="text-center max-w-3xl mx-auto">
            <div className="inline-flex items-center px-4 py-2 bg-blue-100 text-blue-700 rounded-full text-sm font-medium mb-6">
              <FileText className="w-4 h-4 mr-2" />
              Legal Terms
            </div>
            <h1 className="heading-xl mb-6">
              <span className="text-gradient">Terms & Conditions</span>
            </h1>
            <p className="body-lg text-dental-slate">
              Please read these terms and conditions carefully before using our website 
              or services. By accessing our services, you agree to be bound by these terms.
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
            
            {/* Acceptance of Terms */}
            <Card className="card-dental">
              <CardHeader>
                <CardTitle className="heading-md text-dental-charcoal flex items-center gap-2">
                  <Users className="w-5 h-5 text-blue-600" />
                  Acceptance of Terms
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-dental-slate text-sm mb-4">
                  By accessing and using the Jeshna Dental Care website and services, you accept and agree 
                  to be bound by the terms and provision of this agreement. If you do not agree to abide 
                  by the above, please do not use this service.
                </p>
                <p className="text-dental-slate text-sm">
                  These terms apply to all visitors, users, and others who access or use our services.
                </p>
              </CardContent>
            </Card>

            {/* Use of Website */}
            <Card className="card-dental">
              <CardHeader>
                <CardTitle className="heading-md text-dental-charcoal flex items-center gap-2">
                  <FileText className="w-5 h-5 text-blue-600" />
                  Use of Website
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h4 className="font-semibold text-dental-charcoal mb-2">Permitted Use</h4>
                  <ul className="text-dental-slate space-y-1 text-sm ml-4">
                    <li>• Browse information about our dental services</li>
                    <li>• Schedule appointments online</li>
                    <li>• Contact us for inquiries</li>
                    <li>• Access educational dental content</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-semibold text-dental-charcoal mb-2">Prohibited Use</h4>
                  <ul className="text-dental-slate space-y-1 text-sm ml-4">
                    <li>• Unauthorized access to our systems</li>
                    <li>• Distribution of malicious software</li>
                    <li>• Violation of any applicable laws</li>
                    <li>• Interference with website functionality</li>
                  </ul>
                </div>
              </CardContent>
            </Card>

            {/* Medical Disclaimer */}
            <Card className="card-dental">
              <CardHeader>
                <CardTitle className="heading-md text-dental-charcoal flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-blue-600" />
                  Medical Disclaimer
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                  <p className="text-blue-800 text-sm font-medium mb-2">Important Medical Notice</p>
                  <p className="text-blue-700 text-sm">
                    The information on this website is for educational purposes only and does not 
                    constitute medical advice. Always consult with a qualified healthcare professional 
                    for diagnosis and treatment.
                  </p>
                </div>
                <ul className="text-dental-slate space-y-1 text-sm">
                  <li>• Website content is not a substitute for professional medical advice</li>
                  <li>• Individual results may vary</li>
                  <li>• Emergency situations require immediate professional care</li>
                  <li>• Always consult with our dentists for personalized treatment plans</li>
                </ul>
              </CardContent>
            </Card>

            {/* Appointment Terms */}
            <Card className="card-dental">
              <CardHeader>
                <CardTitle className="heading-md text-dental-charcoal flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-blue-600" />
                  Appointment Terms
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-semibold text-dental-charcoal mb-2">Scheduling</h4>
                    <ul className="text-dental-slate space-y-1 text-sm">
                      <li>• Appointments are subject to availability</li>
                      <li>• Confirmation required within 24 hours</li>
                      <li>• Valid contact information required</li>
                      <li>• Insurance verification may be needed</li>
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-semibold text-dental-charcoal mb-2">Cancellation Policy</h4>
                    <ul className="text-dental-slate space-y-1 text-sm">
                      <li>• 24-hour notice required for cancellations</li>
                      <li>• No-show fees may apply</li>
                      <li>• Emergency situations exempt</li>
                      <li>• Rescheduling available</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Payment Terms */}
            <Card className="card-dental">
              <CardHeader>
                <CardTitle className="heading-md text-dental-charcoal flex items-center gap-2">
                  <Shield className="w-5 h-5 text-blue-600" />
                  Payment & Billing
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-semibold text-dental-charcoal mb-2">Payment Methods</h4>
                    <ul className="text-dental-slate space-y-1 text-sm">
                      <li>• Cash, credit cards, and digital payments</li>
                      <li>• Insurance billing available</li>
                      <li>• Payment plans for major treatments</li>
                      <li>• Secure payment processing</li>
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-semibold text-dental-charcoal mb-2">Billing Terms</h4>
                    <ul className="text-dental-slate space-y-1 text-sm">
                      <li>• Payment due at time of service</li>
                      <li>• Insurance claims filed on your behalf</li>
                      <li>• Outstanding balances subject to interest</li>
                      <li>• Refund policy for overpayments</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Privacy & Data */}
            <Card className="card-dental">
              <CardHeader>
                <CardTitle className="heading-md text-dental-charcoal flex items-center gap-2">
                  <Shield className="w-5 h-5 text-blue-600" />
                  Privacy & Data Protection
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-dental-slate text-sm mb-4">
                  We are committed to protecting your privacy and personal information. Our collection, 
                  use, and protection of your data is governed by our Privacy Policy and applicable 
                  healthcare privacy laws.
                </p>
                <ul className="text-dental-slate space-y-1 text-sm">
                  <li>• HIPAA compliance for medical information</li>
                  <li>• Secure data transmission and storage</li>
                  <li>• Limited access to authorized personnel only</li>
                  <li>• Regular security audits and updates</li>
                </ul>
              </CardContent>
            </Card>

            {/* Limitation of Liability */}
            <Card className="card-dental">
              <CardHeader>
                <CardTitle className="heading-md text-dental-charcoal flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-blue-600" />
                  Limitation of Liability
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-dental-slate text-sm mb-4">
                  Jeshna Dental Care shall not be liable for any indirect, incidental, special, 
                  consequential, or punitive damages, including without limitation, loss of profits, 
                  data, use, goodwill, or other intangible losses.
                </p>
                <p className="text-dental-slate text-sm">
                  Our liability is limited to the maximum extent permitted by law and shall not 
                  exceed the amount paid by you for our services.
                </p>
              </CardContent>
            </Card>

            {/* Contact Information */}
            <Card className="card-dental">
              <CardHeader>
                <CardTitle className="heading-md text-dental-charcoal flex items-center gap-2">
                  <Phone className="w-5 h-5 text-blue-600" />
                  Contact Information
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-semibold text-dental-charcoal mb-2">Jeshna Dental Care</h4>
                    <p className="text-dental-slate text-sm mb-1">Bangalore, Karnataka</p>
                    <p className="text-dental-slate text-sm mb-1">
                      <strong>Phone:</strong> <a href="tel:6363116263" className="text-blue-600 hover:text-blue-700">6363116263</a>
                    </p>
                    <p className="text-dental-slate text-sm">
                      <strong>Email:</strong> <a href="mailto:contact@jeshnadentalclinic.com" className="text-blue-600 hover:text-blue-700">contact@jeshnadentalclinic.com</a>
                    </p>
                  </div>
                  <div>
                    <h4 className="font-semibold text-dental-charcoal mb-2">Questions About Terms</h4>
                    <p className="text-dental-slate text-sm">
                      If you have any questions about these Terms & Conditions, please contact us 
                      using the information provided. We're here to help clarify any concerns.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Changes to Terms */}
            <Card className="card-dental">
              <CardHeader>
                <CardTitle className="heading-md text-dental-charcoal">Changes to Terms</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-dental-slate text-sm">
                  We reserve the right to modify these terms at any time. Changes will be effective 
                  immediately upon posting on our website. Your continued use of our services after 
                  any changes constitutes acceptance of the new terms.
                </p>
                <p className="text-dental-slate text-sm mt-4">
                  <strong>Note:</strong> These terms are governed by the laws of India. For specific 
                  legal advice regarding these terms, please consult with a qualified attorney.
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

export default TermsConditions;
