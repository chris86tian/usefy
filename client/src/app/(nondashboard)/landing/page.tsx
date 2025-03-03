import Image from "next/image"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { 
  ArrowRight, 
  BookOpen, 
  Users, 
  Brain, 
  Building2, 
  BarChart3, 
  CheckCircle2, 
  Sparkles 
} from "lucide-react"
import { currentUser } from "@clerk/nextjs/server"

export default async function LandingPage() {
  const FeatureIcons = {
    Building2,
    BookOpen,
    Users,
    Brain,
    BarChart3,
    CheckCircle2
  };

  const user = await currentUser()

  return (
    <div className="min-h-screen bg-background">
      <section
        className="relative flex flex-col items-center justify-center container mx-auto px-4 py-10 md:py-32"
        aria-label="Hero"
      >
        <div className="absolute inset-0 -z-10 h-full w-full bg-white dark:bg-black bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:14px_24px]">
          <div className="absolute left-0 right-0 top-0 -z-10 m-auto h-[310px] w-[310px] rounded-full bg-blue-400 dark:bg-blue-500 opacity-20 blur-[100px]"></div>
        </div>

        <div className="space-y-6 text-center max-w-4xl px-4">
          <div className="mx-auto w-fit rounded-full border border-blue-200 dark:border-blue-900 bg-blue-50 dark:bg-blue-900/30 px-4 py-1 mb-6">
            <div className="flex items-center gap-2 text-sm font-medium text-blue-900 dark:text-blue-200">
              <Sparkles className="h-4 w-4" />
              <span>The Ultimate Organizations Platform</span>
            </div>
          </div>

          <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-gray-900 via-blue-800 to-gray-900 dark:from-white dark:via-blue-300 dark:to-white animate-gradient-x pb-2">
            Generate Courses for Your Organization
          </h1>

          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Use AI agents to create and manage learning experiences for your team
          </p>
          <div className="flex flex-wrap justify-center items-center gap-4 pt-4">
            <Link href={user ? "/explore" : "/signin"}>
              <Button
                size="lg"
                className="bg-blue-600 hover:bg-blue-500 text-white rounded-full px-8 h-12"
              >
                Get Started
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>

        <div className="mt-16 relative">
          <div className="border border-border rounded-xl overflow-hidden shadow-lg">
            <Image
              src="/dashboard.png"
              alt="Platform dashboard"
              width={1200}
              height={600}
              className="w-full object-cover"
            />
          </div>
          <div className="absolute -bottom-6 -right-6 bg-primary/10 w-64 h-64 rounded-full -z-10"></div>
          <div className="absolute -top-6 -left-6 bg-primary/10 w-48 h-48 rounded-full -z-10"></div>
        </div>
      </section>

      <section id="features" className="container mx-auto px-4 py-20 md:py-32">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold mb-4 text-foreground">Powerful Features for Organizations</h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Everything you need to create and manage learning experiences for your team or community.
          </p>
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {[
            {
              icon: "Building2",
              title: "Organization Management",
              description: "Create and manage multiple organizations with customizable branding and permissions.",
            },
            {
              icon: "BookOpen",
              title: "Course Creation",
              description: "Build interactive courses with rich media, quizzes, and assignments.",
            },
            {
              icon: "Users",
              title: "Community Learning",
              description: "Foster collaboration with discussion forums, peer reviews, and group projects.",
            },
            {
              icon: "Brain",
              title: "AI-Powered Insights",
              description: "Get personalized recommendations and analytics to improve learning outcomes.",
            },
            {
              icon: "BarChart3",
              title: "Progress Tracking",
              description: "Monitor learner progress with detailed analytics and reporting tools.",
            },
            {
              icon: "CheckCircle2",
              title: "Certification",
              description: "Award custom certificates upon course completion to recognize achievements.",
            },
          ].map((feature, index) => {
            // Get the correct icon component from our icon map
            const IconComponent = FeatureIcons[feature.icon as keyof typeof FeatureIcons];
            
            return (
              <div key={index} className="bg-card p-6 rounded-xl border border-border hover:shadow-md transition-shadow">
                <IconComponent className="h-10 w-10 text-primary mb-4" />
                <h3 className="text-xl font-semibold mb-2 text-foreground">{feature.title}</h3>
                <p className="text-muted-foreground">{feature.description}</p>
              </div>
            );
          })}
        </div>
      </section>

      <section id="how-it-works" className="bg-muted py-20 md:py-32">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4 text-foreground">How It Works</h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Get started in minutes with our simple three-step process.
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            {[
              {
                step: "01",
                title: "Create Your Organization",
                description: "Set up your organization with custom branding and invite team members or students.",
              },
              {
                step: "02",
                title: "Build Your Courses",
                description: "Create engaging courses with our intuitive course builder and content management tools.",
              },
              {
                step: "03",
                title: "Launch & Analyze",
                description: "Publish your courses, enroll learners, and track progress with detailed analytics.",
              },
            ].map((item, index) => (
              <div key={index} className="text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 text-primary font-bold text-xl mb-4">
                  {item.step}
                </div>
                <h3 className="text-xl font-semibold mb-2 text-foreground">{item.title}</h3>
                <p className="text-muted-foreground">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="container mx-auto px-4 py-20 md:py-32">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold mb-4 text-foreground">Trusted by Leading Organizations</h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            See what our customers are saying about their experience.
          </p>
        </div>
        <div className="grid md:grid-cols-3 gap-8">
          {[
            {
              quote:
                "LearnSphere has transformed how we onboard new employees. Our training completion rates have increased by 60%.",
              author: "Sarah Johnson",
              role: "HR Director, TechCorp",
            },
            {
              quote:
                "The ability to create custom courses for different departments has been a game-changer for our organization.",
              author: "Michael Chen",
              role: "Learning & Development, Global Finance",
            },
            {
              quote: "We've been able to scale our educational programs to reach thousands of students worldwide.",
              author: "Emily Rodriguez",
              role: "Program Director, Education First",
            },
          ].map((testimonial, index) => (
            <div key={index} className="bg-card p-8 rounded-xl border border-border hover:shadow-md transition-shadow">
              <p className="text-muted-foreground mb-6 italic">{testimonial.quote}</p>
              <div>
                <p className="font-semibold text-foreground">{testimonial.author}</p>
                <p className="text-muted-foreground/80 text-sm">{testimonial.role}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="bg-primary/5 py-20 md:py-32">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4 text-foreground">Ready to Transform Learning?</h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-10">
            Join thousands of organizations already using LearnSphere to create impactful learning experiences.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" className="bg-primary hover:bg-primary/90 text-white">
              Start Free Trial
            </Button>
            <Button size="lg" variant="outline">
              Schedule Demo
            </Button>
          </div>
        </div>
      </section>
    </div>
  )
}