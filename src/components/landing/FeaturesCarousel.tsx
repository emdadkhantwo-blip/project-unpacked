import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ScrollReveal } from "./ScrollReveal";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Calendar, Users, BedDouble, ClipboardList, Wrench, BarChart3, CreditCard, Utensils, Moon } from "lucide-react";
import feature1 from "@/assets/feature-1.jpg";
import feature2 from "@/assets/feature-2.jpg";

const features = [
  {
    id: 1,
    title: "বুকিং ও রিজার্ভেশন ম্যানেজমেন্ট",
    description: "অনলাইন ও অফলাইন বুকিং সহজেই ম্যানেজ করুন। রিয়েল-টাইম ক্যালেন্ডার ভিউ, অটোমেটিক কনফার্মেশন এবং ওভারবুকিং প্রতিরোধ।",
    icon: Calendar,
    image: feature1,
  },
  {
    id: 2,
    title: "রুম ম্যানেজমেন্ট",
    description: "রুম স্ট্যাটাস, ক্যাটাগরি এবং রেট রিয়েল-টাইমে ম্যানেজ করুন। হাউসকিপিং স্ট্যাটাস ট্র্যাকিং সহ।",
    icon: BedDouble,
    image: feature2,
  },
  {
    id: 3,
    title: "গেস্ট প্রোফাইল ম্যানেজমেন্ট",
    description: "গেস্টদের সম্পূর্ণ প্রোফাইল, পছন্দ, VIP স্ট্যাটাস এবং স্টে হিস্টোরি সংরক্ষণ করুন।",
    icon: Users,
    image: feature1,
  },
  {
    id: 4,
    title: "হাউসকিপিং ম্যানেজমেন্ট",
    description: "টাস্ক অ্যাসাইনমেন্ট, রুম ক্লিনিং স্ট্যাটাস এবং স্টাফ পারফরম্যান্স ট্র্যাক করুন।",
    icon: ClipboardList,
    image: feature2,
  },
  {
    id: 5,
    title: "মেইন্টেন্যান্স টিকেটিং",
    description: "মেরামত ও রক্ষণাবেক্ষণ টিকেট তৈরি, ট্র্যাক এবং সমাধান করুন কম্প্লেন আসার আগেই।",
    icon: Wrench,
    image: feature1,
  },
  {
    id: 6,
    title: "রিপোর্ট ও অ্যানালিটিক্স",
    description: "অকুপেন্সি, রেভিনিউ, ADR, RevPAR সহ বিস্তারিত রিপোর্ট। ডেটা-ড্রিভেন সিদ্ধান্ত নিন।",
    icon: BarChart3,
    image: feature2,
  },
  {
    id: 7,
    title: "ফোলিও ও বিলিং",
    description: "গেস্ট ফোলিও, চার্জ পোস্টিং, পেমেন্ট প্রসেসিং এবং ইনভয়েস জেনারেশন সহজে।",
    icon: CreditCard,
    image: feature1,
  },
  {
    id: 8,
    title: "POS ও রেস্টুরেন্ট",
    description: "রেস্টুরেন্ট, বার ও অন্যান্য আউটলেটের অর্ডার সরাসরি গেস্ট ফোলিওতে চার্জ করুন।",
    icon: Utensils,
    image: feature2,
  },
  {
    id: 9,
    title: "নাইট অডিট",
    description: "দৈনিক রুম চার্জ, ট্যাক্স পোস্টিং এবং ডে-এন্ড রিপোর্ট স্বয়ংক্রিয়ভাবে।",
    icon: Moon,
    image: feature1,
  },
];

export function FeaturesCarousel() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);

  useEffect(() => {
    if (!isAutoPlaying) return;
    
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % features.length);
    }, 5000);

    return () => clearInterval(interval);
  }, [isAutoPlaying]);

  const goToPrevious = () => {
    setIsAutoPlaying(false);
    setCurrentIndex((prev) => (prev - 1 + features.length) % features.length);
  };

  const goToNext = () => {
    setIsAutoPlaying(false);
    setCurrentIndex((prev) => (prev + 1) % features.length);
  };

  const currentFeature = features[currentIndex];

  return (
    <section className="py-20 bg-background">
      <div className="container mx-auto px-4">
        {/* Header */}
        <ScrollReveal className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            আপনার হোটেলের জন্য সব ফিচার
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            বাংলাদেশের হোটেল ইন্ডাস্ট্রির জন্য বিশেষভাবে ডিজাইন করা ফিচারসমূহ
          </p>
        </ScrollReveal>

        {/* Carousel */}
        <ScrollReveal delay={0.2}>
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Image */}
            <div className="relative">
              <motion.div 
                className="absolute -top-4 -left-4 bg-info text-info-foreground rounded-full h-10 w-10 flex items-center justify-center font-bold z-10"
                key={`number-${currentIndex}`}
                initial={{ scale: 0.5, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.3 }}
              >
                {currentIndex + 1}
              </motion.div>
              <AnimatePresence mode="wait">
                <motion.img 
                  key={currentFeature.id}
                  src={currentFeature.image} 
                  alt={currentFeature.title}
                  className="rounded-2xl shadow-2xl w-full aspect-[4/3] object-cover"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.4 }}
                />
              </AnimatePresence>
            </div>

            {/* Content */}
            <div>
              <AnimatePresence mode="wait">
                <motion.div
                  key={currentFeature.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.4 }}
                >
                  <div className="inline-flex items-center gap-2 bg-info/10 text-info px-4 py-2 rounded-full mb-6">
                    <currentFeature.icon className="h-4 w-4" />
                    <span className="text-sm font-medium">ফিচার {currentIndex + 1} / {features.length}</span>
                  </div>

                  <h3 className="text-2xl md:text-3xl font-bold text-foreground mb-4">
                    {currentFeature.title}
                  </h3>

                  <p className="text-muted-foreground text-lg mb-8">
                    {currentFeature.description}
                  </p>
                </motion.div>
              </AnimatePresence>

              {/* Dots */}
              <div className="flex gap-2 mb-6">
                {features.map((_, index) => (
                  <motion.button
                    key={index}
                    onClick={() => {
                      setIsAutoPlaying(false);
                      setCurrentIndex(index);
                    }}
                    className={`h-2 rounded-full transition-colors ${
                      index === currentIndex 
                        ? "bg-info" 
                        : "bg-muted-foreground/30 hover:bg-muted-foreground/50"
                    }`}
                    animate={{ width: index === currentIndex ? 32 : 8 }}
                    transition={{ duration: 0.3 }}
                  />
                ))}
              </div>

              {/* Controls */}
              <div className="flex items-center gap-4">
                <Button 
                  variant="outline" 
                  size="icon" 
                  onClick={goToPrevious}
                  className="rounded-full"
                >
                  <ChevronLeft className="h-5 w-5" />
                </Button>
                <Button 
                  variant="outline" 
                  size="icon" 
                  onClick={goToNext}
                  className="rounded-full"
                >
                  <ChevronRight className="h-5 w-5" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsAutoPlaying(!isAutoPlaying)}
                  className="text-muted-foreground"
                >
                  {isAutoPlaying ? "⏸ অটো প্লে বন্ধ" : "▶ অটো প্লে চালু"}
                </Button>
              </div>
            </div>
          </div>
        </ScrollReveal>
      </div>
    </section>
  );
}
