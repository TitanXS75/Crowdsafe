import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  HelpCircle,
  Search,
  ChevronDown,
  MessageCircle,
  Phone,
  Mail
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AttendeeLayout } from "@/components/attendee/AttendeeLayout";
import { cn } from "@/lib/utils";
import { getFAQs } from "@/lib/db";

export const AttendeeHelp = () => {
  const [faqs, setFaqs] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  useEffect(() => {
    const unsubscribe = getFAQs((data) => {
      setFaqs(data);
    });
    return () => unsubscribe();
  }, []);

  const filteredFaqs = faqs.filter(faq =>
    faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
    faq.answer.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <AttendeeLayout>
      <div className="space-y-6 pb-20 lg:pb-0 max-w-2xl">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h1 className="text-2xl lg:text-3xl font-bold text-foreground">
            Help & FAQs
          </h1>
          <p className="text-muted-foreground mt-1">
            Find answers to common questions
          </p>
        </motion.div>

        {/* Search */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search for help..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-muted rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
          </div>
        </motion.div>

        {/* FAQs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
        >
          <h2 className="text-lg font-semibold text-foreground mb-3">
            Frequently Asked Questions
          </h2>
          <div className="space-y-2">
            {filteredFaqs.map((faq, index) => (
              <Card
                key={index}
                className="border-border/50 overflow-hidden"
              >
                <button
                  onClick={() => setOpenFaq(openFaq === index ? null : index)}
                  className="w-full p-4 flex items-center justify-between text-left"
                >
                  <div className="flex items-start gap-3">
                    <HelpCircle className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                    <span className="font-medium text-foreground">{faq.question}</span>
                  </div>
                  <ChevronDown className={cn(
                    "w-5 h-5 text-muted-foreground transition-transform flex-shrink-0",
                    openFaq === index && "rotate-180"
                  )} />
                </button>
                {openFaq === index && (
                  <div className="px-4 pb-4 pt-0">
                    <p className="text-muted-foreground pl-8">{faq.answer}</p>
                  </div>
                )}
              </Card>
            ))}
          </div>
        </motion.div>

        {/* Contact support */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <h2 className="text-lg font-semibold text-foreground mb-3">
            Still need help?
          </h2>
          <div className="grid gap-3 sm:grid-cols-3">
            <Card className="border-border/50 hover:shadow-md transition-all cursor-pointer">
              <CardContent className="p-4 text-center">
                <div className="w-12 h-12 rounded-full bg-primary/10 mx-auto mb-3 flex items-center justify-center">
                  <MessageCircle className="w-6 h-6 text-primary" />
                </div>
                <p className="font-medium text-foreground">Live Chat</p>
                <p className="text-sm text-muted-foreground">Chat with support</p>
              </CardContent>
            </Card>

            <Card className="border-border/50 hover:shadow-md transition-all cursor-pointer">
              <CardContent className="p-4 text-center">
                <div className="w-12 h-12 rounded-full bg-secondary/10 mx-auto mb-3 flex items-center justify-center">
                  <Phone className="w-6 h-6 text-secondary" />
                </div>
                <p className="font-medium text-foreground">Call Us</p>
                <p className="text-sm text-muted-foreground">1-800-EVENT</p>
              </CardContent>
            </Card>

            <Card className="border-border/50 hover:shadow-md transition-all cursor-pointer">
              <CardContent className="p-4 text-center">
                <div className="w-12 h-12 rounded-full bg-accent/10 mx-auto mb-3 flex items-center justify-center">
                  <Mail className="w-6 h-6 text-accent" />
                </div>
                <p className="font-medium text-foreground">Email</p>
                <p className="text-sm text-muted-foreground">help@crowdnav.com</p>
              </CardContent>
            </Card>
          </div>
        </motion.div>
      </div>
    </AttendeeLayout>
  );
};
