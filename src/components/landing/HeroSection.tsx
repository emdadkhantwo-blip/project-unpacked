import { useState } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Phone, ArrowRight, Star, CheckCircle, FileText } from "lucide-react";
import heroBg from "@/assets/hero-bg.jpg";
import { AdminApplicationDialog } from "./AdminApplicationDialog";

export function HeroSection() {
  const [applicationDialogOpen, setApplicationDialogOpen] = useState(false);

  return (
    <>
      <section className="relative min-h-[90vh] overflow-hidden">
        {/* Background Image with Overlay */}
        <div 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{ backgroundImage: `url(${heroBg})` }}
        >
          <div className="absolute inset-0 bg-gradient-to-r from-primary/90 via-primary/70 to-transparent" />
        </div>

        {/* Content */}
        <div className="container relative mx-auto px-4 py-20 md:py-32">
          <div className="grid items-center gap-12 lg:grid-cols-2">
            {/* Left Content */}
            <motion.div 
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, ease: "easeOut" }}
              className="text-primary-foreground"
            >
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.2, duration: 0.5 }}
              >
                <Badge className="mb-6 bg-gradient-to-r from-emerald-500 to-teal-500 text-white border-0 px-4 py-2 shadow-lg shadow-emerald-500/30 font-medium">
                  <span className="mr-2 h-2 w-2 rounded-full bg-white animate-pulse inline-block" />
                  ২০০০+ হোটেল বিশ্বস্ত সফটওয়্যার
                </Badge>
              </motion.div>
              
              <motion.h1 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3, duration: 0.6 }}
                className="mb-6 text-4xl font-bold tracking-tight md:text-5xl lg:text-6xl text-white drop-shadow-lg"
              >
                আপনার <span className="text-amber-300">হোটেল ব্যবসা</span>
                <br />
                রূপান্তর করুন
              </motion.h1>
              
              <motion.p 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4, duration: 0.6 }}
                className="mb-8 text-lg md:text-xl max-w-xl text-white/95 drop-shadow-md"
              >
                অল-ইন-ওয়ান ক্লাউড PMS সফটওয়্যার যা আপনার হোটেল অপারেশন সহজ করে তুলবে। 
                রিজার্ভেশন থেকে হাউসকিপিং - সবকিছু এক প্ল্যাটফর্মে।
              </motion.p>
              
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5, duration: 0.6 }}
                className="flex flex-col gap-4 sm:flex-row"
              >
                <Button 
                  size="lg" 
                  className="bg-info hover:bg-info/90 text-info-foreground gap-2"
                  asChild
                >
                  <Link to="/auth">
                    <Phone className="h-4 w-4" />
                    যোগাযোগ করুন
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
                <Button 
                  size="lg" 
                  className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-semibold shadow-lg shadow-amber-500/30 gap-2 border-0"
                  onClick={() => setApplicationDialogOpen(true)}
                >
                  <FileText className="h-4 w-4" />
                  আবেদন করুন
                </Button>
              </motion.div>

            {/* Stats */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6, duration: 0.6 }}
              className="mt-12 flex flex-wrap gap-8"
            >
              {[
                { value: "২০০০+", label: "সন্তুষ্ট হোটেল" },
                { value: "৯৯.৯%", label: "আপটাইম" },
                { value: "২৪/৭", label: "সাপোর্ট" },
              ].map((stat, index) => (
                <motion.div
                  key={stat.label}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.7 + index * 0.1, duration: 0.4 }}
                >
                  <div className="text-3xl font-bold md:text-4xl text-white drop-shadow-md">{stat.value}</div>
                  <div className="text-sm text-white/90">{stat.label}</div>
                </motion.div>
              ))}
            </motion.div>
          </motion.div>

          {/* Right Content - Dashboard Preview */}
          <motion.div 
            initial={{ opacity: 0, x: 50, scale: 0.95 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            transition={{ delay: 0.4, duration: 0.8, ease: "easeOut" }}
            className="hidden lg:block"
          >
            <div className="relative">
              {/* Main Dashboard Card */}
              <motion.div 
                className="rounded-2xl bg-card/95 backdrop-blur-sm p-6 shadow-2xl border"
                whileHover={{ y: -5 }}
                transition={{ duration: 0.3 }}
              >
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="font-semibold text-card-foreground">Dashboard</h3>
                    <p className="text-sm text-muted-foreground">Bee Hotel</p>
                  </div>
                  <div className="flex gap-1">
                    <div className="h-3 w-3 rounded-full bg-destructive" />
                    <div className="h-3 w-3 rounded-full bg-warning" />
                    <div className="h-3 w-3 rounded-full bg-success" />
                  </div>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-3 gap-4 mb-6">
                  <div className="text-center p-3 bg-muted/50 rounded-lg">
                    <div className="text-2xl font-bold text-card-foreground">89%</div>
                    <div className="text-xs text-muted-foreground">Rooms Occupied</div>
                  </div>
                  <div className="text-center p-3 bg-muted/50 rounded-lg">
                    <div className="text-2xl font-bold text-card-foreground">৳12.4K</div>
                    <div className="text-xs text-muted-foreground">Revenue</div>
                  </div>
                  <div className="text-center p-3 bg-muted/50 rounded-lg">
                    <div className="flex items-center justify-center gap-1">
                      <Star className="h-4 w-4 text-warning fill-warning" />
                      <span className="text-2xl font-bold text-card-foreground">4.9</span>
                    </div>
                    <div className="text-xs text-muted-foreground">Rating</div>
                  </div>
                </div>

                {/* Chart Bars */}
                <div className="flex items-end gap-2 h-24">
                  {[60, 80, 45, 90, 70, 85, 95].map((height, i) => (
                    <motion.div 
                      key={i}
                      initial={{ height: 0 }}
                      animate={{ height: `${height}%` }}
                      transition={{ delay: 0.8 + i * 0.1, duration: 0.5, ease: "easeOut" }}
                      className="flex-1 rounded-t-md bg-gradient-to-t from-info to-room-maintenance"
                    />
                  ))}
                </div>
              </motion.div>

              {/* Floating Notification */}
              <motion.div 
                initial={{ opacity: 0, x: -30 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 1.2, duration: 0.5 }}
                className="absolute -left-8 top-1/3 bg-card rounded-xl p-4 shadow-xl border flex items-center gap-3"
              >
                <div className="h-10 w-10 rounded-full bg-info/20 flex items-center justify-center">
                  <CheckCircle className="h-5 w-5 text-info" />
                </div>
                <div>
                  <div className="font-medium text-card-foreground text-sm">New Booking</div>
                  <div className="text-xs text-muted-foreground">Room 204 confirmed</div>
                </div>
                <ArrowRight className="h-5 w-5 text-info bg-info/20 rounded-full p-1 ml-2" />
              </motion.div>

              {/* Guest Rating Badge */}
              <motion.div 
                initial={{ opacity: 0, x: 30 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 1.4, duration: 0.5 }}
                className="absolute -right-4 bottom-16 bg-card rounded-xl p-3 shadow-xl border"
              >
                <div className="flex items-center gap-2">
                  <div className="h-8 w-8 rounded-full bg-warning/20 flex items-center justify-center">
                    <Star className="h-4 w-4 text-warning fill-warning" />
                  </div>
                  <div>
                    <div className="font-medium text-card-foreground text-sm">Guest Rating</div>
                    <div className="text-xs text-muted-foreground">4.9/5 Average</div>
                  </div>
                </div>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
    
    <AdminApplicationDialog 
      open={applicationDialogOpen} 
      onOpenChange={setApplicationDialogOpen} 
    />
  </>
  );
}
