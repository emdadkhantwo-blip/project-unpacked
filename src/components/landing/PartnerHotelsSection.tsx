import { motion } from "framer-motion";
import { ScrollReveal, StaggerContainer, StaggerItem } from "./ScrollReveal";
import { Star, MapPin, Sparkles } from "lucide-react";
import hotelCoxsbazar from "@/assets/hotel-coxsbazar.jpg";
import hotelSylhet from "@/assets/hotel-sylhet.jpg";
import hotelDhaka from "@/assets/hotel-dhaka.jpg";
import hotelSajek from "@/assets/hotel-sajek.jpg";

const hotels = [
  {
    name: "সী প্যালেস রিসোর্ট",
    location: "কক্সবাজার",
    rooms: "120+ রুম",
    rating: 4.9,
    image: hotelCoxsbazar,
  },
  {
    name: "গ্রিন ভ্যালি রিসোর্ট",
    location: "সিলেট",
    rooms: "45+ রুম",
    rating: 4.8,
    image: hotelSylhet,
  },
  {
    name: "রয়্যাল প্লাজা হোটেল",
    location: "ঢাকা",
    rooms: "200+ রুম",
    rating: 4.7,
    image: hotelDhaka,
  },
  {
    name: "ক্লাউড নাইন কটেজ",
    location: "সাজেক",
    rooms: "25+ রুম",
    rating: 4.9,
    image: hotelSajek,
  },
];

const stats = [
  { value: "৫০০+", label: "পার্টনার হোটেল" },
  { value: "৬৪", label: "জেলায় সেবা" },
  { value: "১০ লাখ+", label: "সফল বুকিং" },
  { value: "৯৯%", label: "সন্তুষ্ট গ্রাহক" },
];

export function PartnerHotelsSection() {
  return (
    <section className="py-20 bg-gradient-to-b from-amber-50/50 to-background">
      <div className="container mx-auto px-4">
        {/* Header */}
        <ScrollReveal className="text-center mb-16">
          <div className="inline-flex items-center gap-2 bg-info/10 text-info px-4 py-2 rounded-full mb-4">
            <Sparkles className="h-4 w-4" />
            <span className="text-sm font-medium">আমাদের পার্টনার</span>
          </div>
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            সফল <span className="text-info">হোটেলগুলো</span> যারা আমাদের বিশ্বাস করে
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            কক্সবাজার থেকে সাজেক - সারা বাংলাদেশে আমাদের পার্টনার হোটেল
          </p>
        </ScrollReveal>

        {/* Hotels Grid */}
        <StaggerContainer className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
          {hotels.map((hotel, index) => (
            <StaggerItem key={index}>
              <motion.div 
                className="group bg-card rounded-2xl overflow-hidden shadow-lg border hover:shadow-xl transition-all"
                whileHover={{ y: -8 }}
                transition={{ duration: 0.3 }}
              >
                {/* Image */}
                <div className="relative aspect-[4/3] overflow-hidden">
                  <motion.img 
                    src={hotel.image}
                    alt={hotel.name}
                    className="w-full h-full object-cover"
                    whileHover={{ scale: 1.1 }}
                    transition={{ duration: 0.5 }}
                  />
                  {/* Location Badge */}
                  <div className="absolute top-3 left-3 bg-card/90 backdrop-blur-sm text-card-foreground text-xs font-medium px-2 py-1 rounded-full flex items-center gap-1">
                    <MapPin className="h-3 w-3 text-info" />
                    {hotel.location}
                  </div>
                  {/* Rating Badge */}
                  <div className="absolute top-3 right-3 bg-success text-success-foreground text-xs font-bold px-2 py-1 rounded-full flex items-center gap-1">
                    <Star className="h-3 w-3 fill-current" />
                    {hotel.rating}
                  </div>
                </div>

                {/* Content */}
                <div className="p-4">
                  <h3 className="font-bold text-card-foreground mb-1">{hotel.name}</h3>
                  <p className="text-sm text-muted-foreground">{hotel.rooms}</p>
                </div>
              </motion.div>
            </StaggerItem>
          ))}
        </StaggerContainer>

        {/* Stats */}
        <StaggerContainer className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {stats.map((stat, index) => (
            <StaggerItem key={index}>
              <motion.div 
                className="text-center p-6 bg-card rounded-xl border shadow-sm"
                whileHover={{ scale: 1.05 }}
                transition={{ duration: 0.2 }}
              >
                <motion.div 
                  className="text-3xl md:text-4xl font-bold text-info mb-2"
                  initial={{ opacity: 0, scale: 0.5 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1, type: "spring" }}
                >
                  {stat.value}
                </motion.div>
                <div className="text-sm text-muted-foreground">
                  {stat.label}
                </div>
              </motion.div>
            </StaggerItem>
          ))}
        </StaggerContainer>
      </div>
    </section>
  );
}
