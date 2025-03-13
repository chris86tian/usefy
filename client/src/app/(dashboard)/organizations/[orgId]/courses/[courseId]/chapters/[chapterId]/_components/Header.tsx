import Link from "next/link";
import { Blocks, BookOpen, HelpCircle } from 'lucide-react';
import { SignedIn } from "@clerk/nextjs";
import ThemeSelector from "./ThemeSelector";
import LanguageSelector from "./LanguageSelector";
import RunButton from "./RunButton";
import SubmitButton from "./SubmitButton";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from "@/components/ui/card";

interface HeaderProps {
  assignment: Assignment;
  courseId: string;
  sectionId: string;
  chapterId: string;
}

async function Header({ assignment, courseId, sectionId, chapterId }: HeaderProps) {
  return (
    <div className="relative z-10">
      <Card className="mb-4 shadow-sm border border-border">
        <CardHeader className="pb-0">
          <div className="flex items-center lg:justify-between justify-center">
            <div className="hidden lg:flex items-center gap-8">
              <Link href="/" className="flex items-center gap-3 group relative">
                <div className="absolute -inset-2 bg-gradient-to-r from-primary/20 to-secondary/20 rounded-lg opacity-0 group-hover:opacity-100 transition-all duration-500 blur-xl" />
                <div className="relative bg-gradient-to-br from-background to-muted p-2 rounded-xl ring-1 ring-border group-hover:ring-ring transition-all">
                  <Blocks className="size-6 text-primary transform -rotate-6 group-hover:rotate-0 transition-transform duration-300" />
                </div>
                <div className="flex flex-col">
                  <span className="block text-lg font-semibold bg-gradient-to-r from-primary via-primary/80 to-secondary text-transparent bg-clip-text">
                    usefy.
                  </span>
                  <span className="block text-xs text-muted-foreground font-medium">
                    Interactive Code Editor
                  </span>
                </div>
              </Link>
            </div>

            <div className="flex items-center gap-4">
              <div className="flex items-center gap-3">
                <ThemeSelector />
                <LanguageSelector assignment={assignment} />
              </div>

              <SignedIn>
                <RunButton />
                <SubmitButton 
                  courseId={courseId}
                  sectionId={sectionId}
                  chapterId={chapterId}
                  assignmentId={assignment.assignmentId}
                  assignment={assignment.description} 
                />
              </SignedIn>
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="pt-6 border-t mt-4">
          <div className="flex items-center gap-2 mb-2">
            <BookOpen className="w-5 h-5 text-primary" />
            <h1 className="text-xl font-semibold text-foreground">{assignment.title}</h1>
          </div>
          <p className="text-sm text-muted-foreground line-clamp-2">{assignment.description}</p>
        </CardContent>
        
        {assignment.hints && assignment.hints.length > 0 && (
          <CardFooter className="pt-0">
            <Collapsible className="w-full">
              <CollapsibleTrigger asChild>
                <Button variant="outline" size="sm" className="gap-2">
                  <HelpCircle className="w-4 h-4" />
                  Need a hint?
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent className="mt-4 space-y-2 animate-fade-in">
                {assignment.hints.map((hint: string, index: number) => (
                  <Alert key={index} variant="default">
                    <AlertDescription className="text-sm">
                      <span className="ml-2">{hint}</span>
                    </AlertDescription>
                  </Alert>
                ))}
              </CollapsibleContent>
            </Collapsible>
          </CardFooter>
        )}
      </Card>
    </div>
  );
}

export default Header;