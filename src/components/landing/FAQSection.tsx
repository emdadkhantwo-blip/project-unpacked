import { motion } from "framer-motion";
import { ScrollReveal, StaggerContainer, StaggerItem } from "./ScrollReveal";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { HelpCircle, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

const faqs = [
  {
    question: "সফটওয়্যার ব্যবহার করতে কি ইন্টারনেট লাগবে?",
    answer: "হ্যাঁ, সফটওয়্যার ক্লাউড-বেসড হওয়ায় ইন্টারনেট প্রয়োজন। তবে আমাদের অফলাইন মোড ফিচার আছে যা সাময়িক ইন্টারনেট বিভ্রাটের সময় কাজ করে এবং পরে অটোমেটিক সিঙ্ক হয়ে যায়।",
  },
  {
    question: "সফটওয়্যার সেটআপে কত সময় লাগে?",
    answer: "সাধারণত ১-২ দিনের মধ্যে সম্পূর্ণ সেটআপ করা হয়। আমাদের টিম আপনার হোটেলের রুম, ক্যাটাগরি, রেট সব ইনপুট করে দেবে। এছাড়া স্টাফদের ট্রেনিংও দেওয়া হয়।",
  },
  {
    question: "কি কি পেমেন্ট মেথড সাপোর্ট করে?",
    answer: "আমরা বিকাশ, নগদ, রকেট সহ সব মোবাইল ব্যাংকিং সাপোর্ট করি। এছাড়া ক্রেডিট/ডেবিট কার্ড, ব্যাংক ট্রান্সফার এবং ক্যাশ পেমেন্টও রেকর্ড করতে পারবেন।",
  },
  {
    question: "OTA (Booking.com, Agoda) থেকে বুকিং কি অটো সিঙ্ক হয়?",
    answer: "হ্যাঁ! আমাদের চ্যানেল ম্যানেজার Booking.com, Agoda, Expedia সহ সব বড় OTA-এর সাথে সংযুক্ত। বুকিং আসলে অটোমেটিক সিস্টেমে যুক্ত হয় এবং ক্যালেন্ডার আপডেট হয়।",
  },
  {
    question: "ডাটা কতটা নিরাপদ?",
    answer: "আমরা ব্যাংক-গ্রেড SSL এনক্রিপশন ব্যবহার করি। সব ডাটা ক্লাউডে সুরক্ষিত থাকে এবং প্রতিদিন অটোমেটিক ব্যাকআপ হয়। শুধু অথোরাইজড ইউজাররাই সিস্টেমে অ্যাক্সেস পায়।",
  },
  {
    question: "মোবাইল থেকে ব্যবহার করা যায়?",
    answer: "হ্যাঁ! আমাদের সফটওয়্যার সম্পূর্ণ মোবাইল রেসপন্সিভ। স্মার্টফোন বা ট্যাবলেট থেকে যেকোনো জায়গা থেকে হোটেল ম্যানেজ করতে পারবেন।",
  },
  {
    question: "সাপোর্ট কিভাবে পাবো?",
    answer: "আমাদের ২৪/৭ ফোন ও হোয়াটসঅ্যাপ সাপোর্ট আছে। এছাড়া লাইভ চ্যাট, ইমেইল এবং রিমোট স্ক্রিন শেয়ারিং-এর মাধ্যমেও সাহায্য পাবেন।",
  },
  {
    question: "একাধিক শাখা/প্রপার্টি ম্যানেজ করা যায়?",
    answer: "অবশ্যই! Growth ও Pro প্ল্যানে একাধিক প্রপার্টি ম্যানেজ করতে পারবেন। একই ড্যাশবোর্ড থেকে সব শাখার রিপোর্ট দেখা এবং পরিচালনা করা যায়।",
  },
];

export function FAQSection() {
  return (
    <section className="py-20 bg-muted/30">
      <div className="container mx-auto px-4">
        {/* Header */}
        <ScrollReveal className="text-center mb-16">
          <div className="inline-flex items-center gap-2 bg-info/10 text-info px-4 py-2 rounded-full mb-4">
            <HelpCircle className="h-4 w-4" />
            <span className="text-sm font-medium">সাধারণ প্রশ্নাবলী</span>
          </div>
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            আপনার <span className="text-info">প্রশ্নের উত্তর</span>
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            হোটেল সফটওয়্যার সম্পর্কে সবচেয়ে বেশি জিজ্ঞাসিত প্রশ্নগুলো
          </p>
        </ScrollReveal>

        {/* FAQ Accordion */}
        <div className="max-w-3xl mx-auto">
          <StaggerContainer>
            <Accordion type="single" collapsible className="space-y-4">
              {faqs.map((faq, index) => (
                <StaggerItem key={index}>
                  <motion.div
                    whileHover={{ scale: 1.01 }}
                    transition={{ duration: 0.2 }}
                  >
                    <AccordionItem 
                      value={`item-${index}`}
                      className="bg-card border rounded-xl px-6 shadow-sm hover:shadow-md transition-shadow"
                    >
                      <AccordionTrigger className="text-left hover:no-underline py-5">
                        <span className="font-semibold text-card-foreground">
                          {faq.question}
                        </span>
                      </AccordionTrigger>
                      <AccordionContent className="text-muted-foreground pb-5">
                        {faq.answer}
                      </AccordionContent>
                    </AccordionItem>
                  </motion.div>
                </StaggerItem>
              ))}
            </Accordion>
          </StaggerContainer>
        </div>

        {/* Still have questions */}
        <ScrollReveal delay={0.3} className="mt-12">
          <div className="bg-gradient-to-r from-primary to-primary/80 rounded-2xl p-8 max-w-3xl mx-auto text-center">
            <MessageCircle className="h-12 w-12 text-primary-foreground mx-auto mb-4" />
            <h3 className="text-xl font-bold text-primary-foreground mb-2">
              আরও প্রশ্ন আছে?
            </h3>
            <p className="text-primary-foreground/80 mb-6">
              আমাদের টিম আপনাকে সাহায্য করতে প্রস্তুত। যেকোনো সময় যোগাযোগ করুন।
            </p>
            <Button 
              variant="secondary"
              size="lg"
              asChild
            >
              <Link to="/auth">
                যোগাযোগ করুন
              </Link>
            </Button>
          </div>
        </ScrollReveal>
      </div>
    </section>
  );
}
