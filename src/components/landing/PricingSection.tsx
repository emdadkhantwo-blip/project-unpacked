import { useState } from "react";
import { motion } from "framer-motion";
import { ScrollReveal, StaggerContainer, StaggerItem } from "./ScrollReveal";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Check, X, Sparkles, Crown, Zap } from "lucide-react";
import { Link } from "react-router-dom";

const plans = [
  {
    name: "Starter",
    namebn: "স্টার্টার",
    description: "ছোট হোটেলের জন্য",
    icon: Zap,
    monthlyPrice: 2999,
    yearlyPrice: 29990,
    popular: false,
    features: [
      { text: "১টি প্রপার্টি", included: true },
      { text: "২০টি রুম পর্যন্ত", included: true },
      { text: "৩ জন স্টাফ অ্যাকাউন্ট", included: true },
      { text: "বুকিং ম্যানেজমেন্ট", included: true },
      { text: "বেসিক রিপোর্ট", included: true },
      { text: "ইমেইল সাপোর্ট", included: true },
      { text: "POS মডিউল", included: false },
      { text: "চ্যানেল ম্যানেজার", included: false },
      { text: "API অ্যাক্সেস", included: false },
    ],
    color: "bg-muted",
    buttonVariant: "outline" as const,
  },
  {
    name: "Growth",
    namebn: "গ্রোথ",
    description: "মাঝারি হোটেলের জন্য",
    icon: Sparkles,
    monthlyPrice: 5999,
    yearlyPrice: 59990,
    popular: true,
    features: [
      { text: "৩টি প্রপার্টি পর্যন্ত", included: true },
      { text: "১০০টি রুম পর্যন্ত", included: true },
      { text: "১০ জন স্টাফ অ্যাকাউন্ট", included: true },
      { text: "সব বুকিং ফিচার", included: true },
      { text: "অ্যাডভান্সড রিপোর্ট", included: true },
      { text: "ফোন ও চ্যাট সাপোর্ট", included: true },
      { text: "POS মডিউল", included: true },
      { text: "চ্যানেল ম্যানেজার", included: true },
      { text: "API অ্যাক্সেস", included: false },
    ],
    color: "bg-info",
    buttonVariant: "default" as const,
  },
  {
    name: "Pro",
    namebn: "প্রো",
    description: "বড় হোটেল চেইনের জন্য",
    icon: Crown,
    monthlyPrice: 12999,
    yearlyPrice: 129990,
    popular: false,
    features: [
      { text: "আনলিমিটেড প্রপার্টি", included: true },
      { text: "আনলিমিটেড রুম", included: true },
      { text: "আনলিমিটেড স্টাফ", included: true },
      { text: "সব ফিচার আনলক", included: true },
      { text: "কাস্টম রিপোর্ট", included: true },
      { text: "২৪/৭ প্রায়োরিটি সাপোর্ট", included: true },
      { text: "POS + কিচেন ডিসপ্লে", included: true },
      { text: "মাল্টি-চ্যানেল ম্যানেজার", included: true },
      { text: "ফুল API অ্যাক্সেস", included: true },
    ],
    color: "bg-warning",
    buttonVariant: "outline" as const,
  },
];

export function PricingSection() {
  const [isYearly, setIsYearly] = useState(false);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("bn-BD").format(price);
  };

  return (
    <section className="py-20 bg-background">
      <div className="container mx-auto px-4">
        {/* Header */}
        <ScrollReveal className="text-center mb-12">
          <div className="inline-flex items-center gap-2 bg-success/10 text-success px-4 py-2 rounded-full mb-4">
            <Sparkles className="h-4 w-4" />
            <span className="text-sm font-medium">মূল্য তালিকা</span>
          </div>
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            আপনার হোটেলের জন্য <span className="text-info">সঠিক প্ল্যান</span> বেছে নিন
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto mb-8">
            সব প্ল্যানে ৩০ দিনের ফ্রি ট্রায়াল। কোনো ক্রেডিট কার্ড লাগবে না।
          </p>

          {/* Toggle */}
          <div className="flex items-center justify-center gap-4">
            <span className={`font-medium ${!isYearly ? "text-foreground" : "text-muted-foreground"}`}>
              মাসিক
            </span>
            <Switch
              checked={isYearly}
              onCheckedChange={setIsYearly}
            />
            <span className={`font-medium ${isYearly ? "text-foreground" : "text-muted-foreground"}`}>
              বাৎসরিক
            </span>
            {isYearly && (
              <Badge className="bg-success/20 text-success border-0">
                ২ মাস ফ্রি!
              </Badge>
            )}
          </div>
        </ScrollReveal>

        {/* Pricing Cards */}
        <StaggerContainer className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {plans.map((plan, index) => (
            <StaggerItem key={plan.name}>
              <motion.div
                whileHover={{ y: -8, transition: { duration: 0.3 } }}
                className={`relative bg-card rounded-2xl border shadow-lg overflow-hidden ${
                  plan.popular ? "border-info shadow-info/20" : ""
                }`}
              >
                {/* Popular Badge */}
                {plan.popular && (
                  <div className="absolute top-0 left-0 right-0 bg-info text-info-foreground text-center text-sm font-medium py-2">
                    সবচেয়ে জনপ্রিয়
                  </div>
                )}

                <div className={`p-6 ${plan.popular ? "pt-12" : ""}`}>
                  {/* Plan Header */}
                  <div className="flex items-center gap-3 mb-4">
                    <div className={`h-12 w-12 rounded-xl ${plan.color}/20 flex items-center justify-center`}>
                      <plan.icon className={`h-6 w-6 ${plan.color === "bg-info" ? "text-info" : plan.color === "bg-warning" ? "text-warning" : "text-muted-foreground"}`} />
                    </div>
                    <div>
                      <h3 className="font-bold text-card-foreground text-lg">{plan.namebn}</h3>
                      <p className="text-sm text-muted-foreground">{plan.description}</p>
                    </div>
                  </div>

                  {/* Price */}
                  <div className="mb-6">
                    <div className="flex items-baseline gap-1">
                      <span className="text-4xl font-bold text-card-foreground">
                        ৳{formatPrice(isYearly ? plan.yearlyPrice : plan.monthlyPrice)}
                      </span>
                      <span className="text-muted-foreground">
                        /{isYearly ? "বছর" : "মাস"}
                      </span>
                    </div>
                    {isYearly && (
                      <p className="text-sm text-success mt-1">
                        ৳{formatPrice(plan.monthlyPrice * 2)} সাশ্রয়!
                      </p>
                    )}
                  </div>

                  {/* Features */}
                  <ul className="space-y-3 mb-6">
                    {plan.features.map((feature, fIndex) => (
                      <li key={fIndex} className="flex items-center gap-3">
                        {feature.included ? (
                          <div className="h-5 w-5 rounded-full bg-success/20 flex items-center justify-center flex-shrink-0">
                            <Check className="h-3 w-3 text-success" />
                          </div>
                        ) : (
                          <div className="h-5 w-5 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
                            <X className="h-3 w-3 text-muted-foreground" />
                          </div>
                        )}
                        <span className={feature.included ? "text-card-foreground" : "text-muted-foreground"}>
                          {feature.text}
                        </span>
                      </li>
                    ))}
                  </ul>

                  {/* CTA Button */}
                  <Button 
                    className={`w-full ${plan.popular ? "bg-info hover:bg-info/90 text-info-foreground" : ""}`}
                    variant={plan.buttonVariant}
                    size="lg"
                    asChild
                  >
                    <Link to="/auth">
                      ফ্রি ট্রায়াল শুরু করুন
                    </Link>
                  </Button>
                </div>
              </motion.div>
            </StaggerItem>
          ))}
        </StaggerContainer>

        {/* Enterprise CTA */}
        <ScrollReveal delay={0.3} className="mt-12">
          <div className="bg-gradient-to-r from-muted to-muted/50 rounded-2xl p-8 max-w-4xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
            <div>
              <h3 className="text-xl font-bold text-foreground mb-2">
                এন্টারপ্রাইজ সলিউশন দরকার?
              </h3>
              <p className="text-muted-foreground">
                বড় হোটেল চেইন বা কর্পোরেট ক্লায়েন্টদের জন্য কাস্টম সলিউশন
              </p>
            </div>
            <Button variant="outline" size="lg" asChild>
              <Link to="/auth">যোগাযোগ করুন</Link>
            </Button>
          </div>
        </ScrollReveal>
      </div>
    </section>
  );
}
