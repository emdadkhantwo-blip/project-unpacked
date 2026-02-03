import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ScrollReveal } from "./ScrollReveal";
import { Star, ChevronLeft, ChevronRight, MapPin, Quote } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

const testimonials = [
  {
    id: 1,
    name: "আহমেদ রশিদ",
    role: "মালিক, সিটি ভিউ হোটেল",
    location: "Dhaka",
    rating: 5,
    content: "২৪/৭ সাপোর্ট সত্যিই অসাধারণ। যেকোনো সমস্যায় সাথে সাথে সাহায্য পাই। আমার ৫০ রুমের হোটেল এখন একা একাই ম্যানেজ করতে পারি।",
    avatar: "AR",
  },
  {
    id: 2,
    name: "মোঃ করিম হোসেন",
    role: "জেনারেল ম্যানেজার, সী প্যালেস রিসোর্ট",
    location: "Cox's Bazar",
    rating: 5,
    content: "আগে রুম বুকিং নিয়ে প্রচুর গোলমাল হতো। এখন সফটওয়্যার দিয়ে সব সিস্টেমেটিক। গেস্ট সন্তুষ্টি অনেক বেড়েছে।",
    avatar: "KH",
  },
  {
    id: 3,
    name: "ফাতেমা আক্তার",
    role: "মালিক, গ্রিন ভ্যালি রিসোর্ট",
    location: "Sajek Valley",
    rating: 5,
    content: "পাহাড়ে ইন্টারনেট সমস্যা সত্ত্বেও সফটওয়্যার চমৎকার কাজ করে। অফলাইন মোড থাকায় কোনো সমস্যা হয় না।",
    avatar: "FA",
  },
  {
    id: 4,
    name: "রুমানা বেগম",
    role: "অপারেশন ম্যানেজার, ক্লাউড নাইন কটেজ",
    location: "Bandarban",
    rating: 5,
    content: "রিপোর্ট ফিচার অসাধারণ! প্রতি মাসে কত আয় হচ্ছে, কোন রুম বেশি জনপ্রিয় - সব এক ক্লিকে দেখতে পাই।",
    avatar: "RB",
  },
];

export function TestimonialsSection() {
  const [currentIndex, setCurrentIndex] = useState(0);

  const goToPrevious = () => {
    setCurrentIndex((prev) => (prev - 1 + testimonials.length) % testimonials.length);
  };

  const goToNext = () => {
    setCurrentIndex((prev) => (prev + 1) % testimonials.length);
  };

  const currentTestimonial = testimonials[currentIndex];

  return (
    <section className="py-20 bg-muted/30">
      <div className="container mx-auto px-4">
        {/* Header */}
        <ScrollReveal className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            হোটেল মালিকদের <span className="text-info">অভিজ্ঞতা</span>
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            বাংলাদেশের বিভিন্ন প্রান্তের হোটেল মালিকরা কি বলছেন
          </p>
        </ScrollReveal>

        {/* Testimonial Card */}
        <ScrollReveal delay={0.2}>
          <div className="max-w-4xl mx-auto">
            <motion.div 
              className="bg-card rounded-2xl p-8 md:p-12 shadow-lg border relative"
              whileHover={{ y: -5 }}
              transition={{ duration: 0.3 }}
            >
              <AnimatePresence mode="wait">
                <motion.div
                  key={currentTestimonial.id}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.4 }}
                  className="flex flex-col md:flex-row gap-8 items-center"
                >
                  {/* Avatar & Quote Icon */}
                  <div className="relative flex-shrink-0">
                    <Avatar className="h-24 w-24 md:h-32 md:w-32 border-4 border-info/20">
                      <AvatarImage src="" />
                      <AvatarFallback className="text-2xl bg-primary text-primary-foreground">
                        {currentTestimonial.avatar}
                      </AvatarFallback>
                    </Avatar>
                    <motion.div 
                      className="absolute -bottom-2 -right-2 h-10 w-10 bg-info rounded-full flex items-center justify-center"
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ delay: 0.2, type: "spring" }}
                    >
                      <Quote className="h-5 w-5 text-info-foreground" />
                    </motion.div>
                  </div>

                  {/* Content */}
                  <div className="flex-1 text-center md:text-left">
                    {/* Stars */}
                    <div className="flex gap-1 justify-center md:justify-start mb-4">
                      {Array.from({ length: currentTestimonial.rating }).map((_, i) => (
                        <motion.div
                          key={i}
                          initial={{ opacity: 0, scale: 0 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ delay: i * 0.1 }}
                        >
                          <Star className="h-5 w-5 text-warning fill-warning" />
                        </motion.div>
                      ))}
                    </div>

                    {/* Quote */}
                    <blockquote className="text-lg md:text-xl text-card-foreground mb-6 leading-relaxed">
                      "{currentTestimonial.content}"
                    </blockquote>

                    {/* Author */}
                    <div>
                      <div className="font-bold text-card-foreground text-lg">
                        {currentTestimonial.name}
                      </div>
                      <div className="text-muted-foreground">
                        {currentTestimonial.role}
                      </div>
                      <div className="flex items-center gap-1 text-info mt-1 justify-center md:justify-start">
                        <MapPin className="h-4 w-4" />
                        <span className="text-sm">{currentTestimonial.location}</span>
                      </div>
                    </div>
                  </div>
                </motion.div>
              </AnimatePresence>

              {/* Navigation Arrows */}
              <Button
                variant="outline"
                size="icon"
                onClick={goToPrevious}
                className="absolute left-4 top-1/2 -translate-y-1/2 rounded-full hidden md:flex"
              >
                <ChevronLeft className="h-5 w-5" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                onClick={goToNext}
                className="absolute right-4 top-1/2 -translate-y-1/2 rounded-full hidden md:flex"
              >
                <ChevronRight className="h-5 w-5" />
              </Button>
            </motion.div>

            {/* Dots */}
            <div className="flex justify-center gap-2 mt-8">
              {testimonials.map((_, index) => (
                <motion.button
                  key={index}
                  onClick={() => setCurrentIndex(index)}
                  className={`h-2 rounded-full ${
                    index === currentIndex 
                      ? "bg-info" 
                      : "bg-muted-foreground/30 hover:bg-muted-foreground/50"
                  }`}
                  animate={{ width: index === currentIndex ? 32 : 8 }}
                  transition={{ duration: 0.3 }}
                />
              ))}
            </div>

            {/* Avatar Row */}
            <div className="flex justify-center gap-4 mt-8">
              {testimonials.map((testimonial, index) => (
                <motion.button
                  key={testimonial.id}
                  onClick={() => setCurrentIndex(index)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-full border transition-all ${
                    index === currentIndex 
                      ? "bg-card border-info shadow-md" 
                      : "bg-muted/50 border-transparent hover:bg-muted"
                  }`}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className="text-xs bg-primary text-primary-foreground">
                      {testimonial.avatar}
                    </AvatarFallback>
                  </Avatar>
                  <div className="hidden sm:block text-left">
                    <div className="text-xs font-medium text-card-foreground">{testimonial.name.split(' ')[0]}</div>
                    <div className="text-xs text-muted-foreground">{testimonial.location}</div>
                  </div>
                </motion.button>
              ))}
            </div>
          </div>
        </ScrollReveal>
      </div>
    </section>
  );
}
