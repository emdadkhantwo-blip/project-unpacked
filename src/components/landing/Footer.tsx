import { Link } from "react-router-dom";
import { MapPin, Phone, Mail, Facebook, Youtube, Heart } from "lucide-react";
import beehotelLogo from "@/assets/beehotel-logo.png";

const quickLinks = [
  { label: "ফিচার", href: "#features" },
  { label: "প্রাইসিং", href: "#pricing" },
  { label: "রিভিউ", href: "#reviews" },
  { label: "প্রশ্ন", href: "#faq" },
];

const supportLinks = [
  { label: "হেল্প সেন্টার", href: "#" },
  { label: "ডকুমেন্টেশন", href: "#" },
  { label: "ভিডিও টিউটোরিয়াল", href: "#" },
  { label: "কন্টাক্ট", href: "#" },
];

export function Footer() {
  return (
    <footer className="bg-primary text-primary-foreground">
      {/* Main Footer */}
      <div className="container mx-auto px-4 py-16">
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-12">
          {/* Brand */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <img src={beehotelLogo} alt="BeeHotel" className="h-24 w-auto bg-white rounded-lg p-1" />
            </div>
            <p className="text-primary-foreground/70 mb-6">
              বাংলাদেশের রিসোর্ট ও হোটেলের জন্য স্মার্ট হোটেল ম্যানেজমেন্ট সিস্টেম।
            </p>
            <div className="flex gap-3">
              <a 
                href="#" 
                className="h-10 w-10 rounded-full bg-primary-foreground/10 flex items-center justify-center hover:bg-primary-foreground/20 transition-colors"
              >
                <Facebook className="h-5 w-5" />
              </a>
              <a 
                href="#" 
                className="h-10 w-10 rounded-full bg-primary-foreground/10 flex items-center justify-center hover:bg-primary-foreground/20 transition-colors"
              >
                <Youtube className="h-5 w-5" />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="font-bold text-lg mb-4">দ্রুত লিংক</h3>
            <ul className="space-y-3">
              {quickLinks.map((link, index) => (
                <li key={index}>
                  <a 
                    href={link.href}
                    className="text-primary-foreground/70 hover:text-primary-foreground transition-colors"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Support */}
          <div>
            <h3 className="font-bold text-lg mb-4">সাপোর্ট</h3>
            <ul className="space-y-3">
              {supportLinks.map((link, index) => (
                <li key={index}>
                  <a 
                    href={link.href}
                    className="text-primary-foreground/70 hover:text-primary-foreground transition-colors"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="font-bold text-lg mb-4">যোগাযোগ</h3>
            <ul className="space-y-4">
              <li className="flex items-start gap-3">
                <MapPin className="h-5 w-5 text-info flex-shrink-0 mt-0.5" />
                <span className="text-primary-foreground/70">
                  Halishahar, Chattogram
                </span>
              </li>
              <li className="flex items-center gap-3">
                <Phone className="h-5 w-5 text-info flex-shrink-0" />
                <span className="text-primary-foreground/70">
                  01974599741
                </span>
              </li>
              <li className="flex items-center gap-3">
                <Mail className="h-5 w-5 text-info flex-shrink-0" />
                <span className="text-primary-foreground/70">
                  hotelpms@gmail.com
                </span>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-primary-foreground/10">
        <div className="container mx-auto px-4 py-6">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-primary-foreground/60">
            <div className="flex items-center gap-1">
              © {new Date().getFullYear()} BeeHotel | Made with 
              <Heart className="h-4 w-4 text-destructive fill-destructive mx-1" /> 
              in Bangladesh
            </div>
            <div className="flex items-center gap-4">
              <a href="#" className="hover:text-primary-foreground transition-colors">
                প্রাইভেসি পলিসি
              </a>
              <a href="#" className="hover:text-primary-foreground transition-colors">
                টার্মস অফ সার্ভিস
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
