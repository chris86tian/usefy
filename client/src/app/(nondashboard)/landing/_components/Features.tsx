
import { CheckCircle } from "lucide-react"
import { Users } from "lucide-react"
import { Shield } from "lucide-react"
import { Youtube } from "lucide-react"
import { Code } from "lucide-react"
import { BarChart3 } from "lucide-react"
import { BookOpen } from "lucide-react"

const Features = () => {
  return(
    <section id="features" className="py-20">
        <div className="container">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold">Everything you need to run modern courses</h2>
            <p className="mt-4 text-xl text-muted-foreground max-w-2xl mx-auto">
              Our platform combines organization management, AI content generation, and interactive learning tools.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <div className="flex flex-col p-6 bg-background rounded-lg border">
              <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-5">
                <Users className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-xl font-bold">Organization Management</h3>
              <p className="mt-2 text-muted-foreground">
                Create organizations and cohorts, invite users via email or CSV bulk import, and manage members across
                different cohorts.
              </p>
              <ul className="mt-4 space-y-2">
                <li className="flex items-start">
                  <CheckCircle className="h-5 w-5 text-green-500 mr-2 shrink-0" />
                  <span className="text-sm">Create organizations and cohorts</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle className="h-5 w-5 text-green-500 mr-2 shrink-0" />
                  <span className="text-sm">Bulk import via CSV</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle className="h-5 w-5 text-green-500 mr-2 shrink-0" />
                  <span className="text-sm">Cross-cohort management</span>
                </li>
              </ul>
            </div>

            {/* Feature 2 */}
            <div className="flex flex-col p-6 bg-background rounded-lg border">
              <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-5">
                <Shield className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-xl font-bold">Role-Based Access</h3>
              <p className="mt-2 text-muted-foreground">
                Granular permissions for admins, instructors, and learners to ensure the right people have the right
                access.
              </p>
              <ul className="mt-4 space-y-2">
                <li className="flex items-start">
                  <CheckCircle className="h-5 w-5 text-green-500 mr-2 shrink-0" />
                  <span className="text-sm">Admin full control</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle className="h-5 w-5 text-green-500 mr-2 shrink-0" />
                  <span className="text-sm">Instructor course management</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle className="h-5 w-5 text-green-500 mr-2 shrink-0" />
                  <span className="text-sm">Learner-specific views</span>
                </li>
              </ul>
            </div>

            {/* Feature 3 */}
            <div className="flex flex-col p-6 bg-background rounded-lg border">
              <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-5">
                <Youtube className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-xl font-bold">AI Course Generation</h3>
              <p className="mt-2 text-muted-foreground">
                Generate complete courses from video links with AI-powered creation of sections, chapters, and
                assessments.
              </p>
              <ul className="mt-4 space-y-2">
                <li className="flex items-start">
                  <CheckCircle className="h-5 w-5 text-green-500 mr-2 shrink-0" />
                  <span className="text-sm">Video link to course conversion</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle className="h-5 w-5 text-green-500 mr-2 shrink-0" />
                  <span className="text-sm">Auto-generated quizzes</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle className="h-5 w-5 text-green-500 mr-2 shrink-0" />
                  <span className="text-sm">Customizable content</span>
                </li>
              </ul>
            </div>

            {/* Feature 4 */}
            <div className="flex flex-col p-6 bg-background rounded-lg border">
              <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-5">
                <Code className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-xl font-bold">Interactive Learning</h3>
              <p className="mt-2 text-muted-foreground">
                Run code directly in the built-in IDE, receive AI-generated feedback, and engage with course content.
              </p>
              <ul className="mt-4 space-y-2">
                <li className="flex items-start">
                  <CheckCircle className="h-5 w-5 text-green-500 mr-2 shrink-0" />
                  <span className="text-sm">Built-in code editor</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle className="h-5 w-5 text-green-500 mr-2 shrink-0" />
                  <span className="text-sm">AI code feedback</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle className="h-5 w-5 text-green-500 mr-2 shrink-0" />
                  <span className="text-sm">Interactive discussions</span>
                </li>
              </ul>
            </div>

            {/* Feature 5 */}
            <div className="flex flex-col p-6 bg-background rounded-lg border">
              <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-5">
                <BarChart3 className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-xl font-bold">Progress Tracking</h3>
              <p className="mt-2 text-muted-foreground">
                GitHub-like activity graphs, detailed statistics for instructors, and personal progress tracking for
                learners.
              </p>
              <ul className="mt-4 space-y-2">
                <li className="flex items-start">
                  <CheckCircle className="h-5 w-5 text-green-500 mr-2 shrink-0" />
                  <span className="text-sm">Activity commit graphs</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle className="h-5 w-5 text-green-500 mr-2 shrink-0" />
                  <span className="text-sm">Instructor analytics</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle className="h-5 w-5 text-green-500 mr-2 shrink-0" />
                  <span className="text-sm">Personal progress dashboards</span>
                </li>
              </ul>
            </div>

            {/* Feature 6 */}
            <div className="flex flex-col p-6 bg-background rounded-lg border">
              <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-5">
                <BookOpen className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-xl font-bold">Course Management</h3>
              <p className="mt-2 text-muted-foreground">
                Control release timing, change course status, and send instant updates to learners about course changes.
              </p>
              <ul className="mt-4 space-y-2">
                <li className="flex items-start">
                  <CheckCircle className="h-5 w-5 text-green-500 mr-2 shrink-0" />
                  <span className="text-sm">Scheduled content release</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle className="h-5 w-5 text-green-500 mr-2 shrink-0" />
                  <span className="text-sm">Course status control</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle className="h-5 w-5 text-green-500 mr-2 shrink-0" />
                  <span className="text-sm">Automated notifications</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>
  )
}

export default Features