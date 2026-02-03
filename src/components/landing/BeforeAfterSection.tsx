import { motion } from "framer-motion";
import { ScrollReveal, StaggerContainer, StaggerItem } from "./ScrollReveal";
import { X, Check, FileText, Calculator, Building2, Users, LayoutDashboard, Clock, Receipt, TrendingUp } from "lucide-react";
import beforeChaos from "@/assets/before-chaos.jpg";
import feature2 from "@/assets/feature-2.jpg";

const beforeItems = [
  { icon: FileText, text: "কাগজে বুকিং" },
  { icon: Calculator, text: "Excel-এ হিসাব" },
  { icon: Building2, text: "মিসিং তথ্য" },
  { icon: Users, text: "স্টাফ সমন্বয় কঠিন" },
];

const afterItems = [
  { icon: LayoutDashboard, text: "এক ড্যাশবোর্ড" },
  { icon: Clock, text: "রিয়েল-টাইম রুম স্ট্যাটাস" },
  { icon: Receipt, text: "অটোমেটেড বিলিং" },
  { icon: TrendingUp, text: "পরিষ্কার রিপোর্ট" },
];

export function BeforeAfterSection() {
  return (
    <section className="py-20 bg-gradient-to-br from-rose-50 via-background to-sky-50">
      <div className="container mx-auto px-4">
        {/* Header */}
        <ScrollReveal className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            পুরনো পদ্ধতি থেকে <span className="text-info">আধুনিক সমাধান</span>
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            আপনার হোটেলের সমস্যাগুলো আমরা বুঝি—কারণ আমরা বাংলাদেশের হোটেল ইন্ডাস্ট্রির জন্যই কাজ করি
          </p>
        </ScrollReveal>

        {/* Comparison Grid */}
        <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
          {/* Before Card */}
          <ScrollReveal direction="left" delay={0.1}>
            <motion.div 
              className="bg-gradient-to-br from-rose-100 to-rose-50 rounded-2xl p-6 border border-rose-200 h-full"
              whileHover={{ scale: 1.02 }}
              transition={{ duration: 0.3 }}
            >
              <div className="inline-block bg-destructive/20 text-destructive text-sm font-medium px-3 py-1 rounded-full mb-4">
                আগে
              </div>
              
              <div className="rounded-xl overflow-hidden mb-6">
                <img 
                  src={beforeChaos} 
                  alt="Before - Chaotic office" 
                  className="w-full aspect-video object-cover"
                />
              </div>

              <StaggerContainer className="space-y-3">
                {beforeItems.map((item, index) => (
                  <StaggerItem key={index}>
                    <motion.div 
                      className="flex items-center gap-3 bg-card/80 rounded-lg p-3"
                      whileHover={{ x: 5 }}
                      transition={{ duration: 0.2 }}
                    >
                      <div className="h-8 w-8 rounded-lg bg-destructive/10 flex items-center justify-center">
                        <item.icon className="h-4 w-4 text-destructive" />
                      </div>
                      <span className="text-card-foreground">{item.text}</span>
                      <X className="h-5 w-5 text-destructive ml-auto" />
                    </motion.div>
                  </StaggerItem>
                ))}
              </StaggerContainer>
            </motion.div>
          </ScrollReveal>

          {/* After Card */}
          <ScrollReveal direction="right" delay={0.2}>
            <motion.div 
              className="bg-gradient-to-br from-emerald-100 to-sky-50 rounded-2xl p-6 border border-emerald-200 relative h-full"
              whileHover={{ scale: 1.02 }}
              transition={{ duration: 0.3 }}
            >
              <motion.div 
                className="absolute -top-3 -right-3 bg-success text-success-foreground text-xs font-bold px-3 py-1.5 rounded-full"
                initial={{ scale: 0 }}
                whileInView={{ scale: 1 }}
                transition={{ delay: 0.5, type: "spring" }}
              >
                সফটেক
              </motion.div>
              
              <div className="inline-block bg-info/20 text-info text-sm font-medium px-3 py-1 rounded-full mb-4">
                এখন
              </div>
              
              <div className="rounded-xl overflow-hidden mb-6">
                <img 
                  src={feature2} 
                  alt="After - Modern dashboard" 
                  className="w-full aspect-video object-cover"
                />
              </div>

              <StaggerContainer className="space-y-3">
                {afterItems.map((item, index) => (
                  <StaggerItem key={index}>
                    <motion.div 
                      className="flex items-center gap-3 bg-card/80 rounded-lg p-3"
                      whileHover={{ x: 5 }}
                      transition={{ duration: 0.2 }}
                    >
                      <div className="h-8 w-8 rounded-lg bg-info/10 flex items-center justify-center">
                        <item.icon className="h-4 w-4 text-info" />
                      </div>
                      <span className="text-card-foreground">{item.text}</span>
                      <motion.div 
                        className="ml-auto h-6 w-6 rounded-full bg-success flex items-center justify-center"
                        initial={{ scale: 0 }}
                        whileInView={{ scale: 1 }}
                        transition={{ delay: 0.3 + index * 0.1, type: "spring" }}
                      >
                        <Check className="h-4 w-4 text-success-foreground" />
                      </motion.div>
                    </motion.div>
                  </StaggerItem>
                ))}
              </StaggerContainer>
            </motion.div>
          </ScrollReveal>
        </div>
      </div>
    </section>
  );
}
