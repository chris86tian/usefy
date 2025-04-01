
import Image from "next/image"

const Testimonials = () => {
  
    return (
        <section className="py-20">
        <div className="container">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold">Loved by educators and learners</h2>
            <p className="mt-4 text-xl text-muted-foreground max-w-2xl mx-auto">
              See what our users have to say about their experience
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Testimonial 1 */}
            <div className="flex flex-col p-6 bg-background rounded-lg border">
              <div className="flex items-center gap-4 mb-4">
                <div className="h-12 w-12 rounded-full bg-muted overflow-hidden">
                  <Image src="/placeholder.png" width={48} height={48} alt="User" />
                </div>
                <div>
                  <p className="font-medium">Sarah Johnson</p>
                  <p className="text-sm text-muted-foreground">Computer Science Professor</p>
                </div>
              </div>
              <p className="text-muted-foreground">
                &quot;This platform has transformed how I teach programming. The AI-generated content saves me hours of
                preparation, and students love the interactive coding environment.&quot;
              </p>
            </div>

            {/* Testimonial 2 */}
            <div className="flex flex-col p-6 bg-background rounded-lg border">
              <div className="flex items-center gap-4 mb-4">
                <div className="h-12 w-12 rounded-full bg-muted overflow-hidden">
                  <Image src="/placeholder.png" width={48} height={48} alt="User" />
                </div>
                <div>
                  <p className="font-medium">Michael Chen</p>
                  <p className="text-sm text-muted-foreground">EdTech Director</p>
                </div>
              </div>
              <p className="text-muted-foreground">
                &quot;Managing multiple cohorts across our organization used to be a nightmare. Now it&apos;s seamless. The
                analytics give us insights we never had before.&quot;
              </p>
            </div>

            {/* Testimonial 3 */}
            <div className="flex flex-col p-6 bg-background rounded-lg border">
              <div className="flex items-center gap-4 mb-4">
                <div className="h-12 w-12 rounded-full bg-muted overflow-hidden">
                  <Image src="/placeholder.png" width={48} height={48} alt="User" />
                </div>
                <div>
                  <p className="font-medium">Alex Rivera</p>
                  <p className="text-sm text-muted-foreground">Student</p>
                </div>
              </div>
              <p className="text-muted-foreground">
                &quot;The interactive coding environment and AI feedback have helped me improve faster than any other
                platform I&apos;ve used. It&apos;s like having a personal tutor.&quot;
              </p>
            </div>
          </div>
        </div>
      </section>
    )
  }

  export default Testimonials