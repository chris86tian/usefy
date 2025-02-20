import Link from "next/link";
import { Blocks, Code2, BookOpen, HelpCircle } from 'lucide-react';
import { SignedIn } from "@clerk/nextjs";
import ThemeSelector from "./ThemeSelector";
import LanguageSelector from "./LanguageSelector";
import RunButton from "./RunButton";
import SubmitButton from "./SubmitButton";
import HeaderProfileBtn from "./HeaderProfileBtn";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface HeaderProps {
  assignment: Assignment;
  courseId: string;
  sectionId: string;
  chapterId: string;
}

async function Header({ assignment, courseId, sectionId, chapterId }: HeaderProps) {
  console.log(assignment);

  return (
    <div className="relative z-10">
      <div className="flex flex-col bg-gray-900 backdrop-blur-xl p-6 mb-4 rounded-lg">
        <div className="flex items-center lg:justify-between justify-center mb-4">
          <div className="hidden lg:flex items-center gap-8">
            <Link href="/" className="flex items-center gap-3 group relative">
              <div className="absolute -inset-2 bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-lg opacity-0 group-hover:opacity-100 transition-all duration-500 blur-xl" />
              <div className="relative bg-gradient-to-br from-[#1a1a2e] to-[#0a0a0f] p-2 rounded-xl ring-1 ring-white/10 group-hover:ring-white/20 transition-all">
                <Blocks className="size-6 text-blue-400 transform -rotate-6 group-hover:rotate-0 transition-transform duration-300" />
              </div>
              <div className="flex flex-col">
                <span className="block text-lg font-semibold bg-gradient-to-r from-blue-400 via-blue-300 to-purple-400 text-transparent bg-clip-text">
                  Usefy
                </span>
                <span className="block text-xs text-blue-400/60 font-medium">
                  Interactive Code Editor
                </span>
              </div>
            </Link>

            {/* <nav className="flex items-center space-x-1">
              <Link
                href="/snippets"
                className="relative group flex items-center gap-2 px-4 py-1.5 rounded-lg text-gray-300 bg-gray-800/50 hover:bg-blue-500/10 border border-gray-800 hover:border-blue-500/50 transition-all duration-300 shadow-lg overflow-hidden"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 to-purple-500/10 opacity-0 group-hover:opacity-100 transition-opacity" />
                <Code2 className="w-4 h-4 relative z-10 group-hover:rotate-3 transition-transform" />
                <span className="text-sm font-medium relative z-10 group-hover:text-white transition-colors">
                  Snippets
                </span>
              </Link>
            </nav> */}
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

            <div className="pl-3 border-l border-gray-800">
              <HeaderProfileBtn />
            </div>
          </div>
        </div>

        <div className="mt-4 border-t border-gray-800 pt-4">
          <div className="flex items-center gap-2 mb-2">
            <BookOpen className="w-5 h-5 text-blue-400" />
            <h1 className="text-xl font-semibold text-white">{assignment.title}</h1>
          </div>
          <p className="text-sm text-gray-400 line-clamp-2">{assignment.description}</p>
          
          {assignment.hints && assignment.hints.length > 0 && (
            <Collapsible className="mt-4">
              <CollapsibleTrigger asChild>
                <Button variant="outline" size="sm" className="gap-2">
                  <HelpCircle className="w-4 h-4" />
                  Need a hint?
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent className="mt-4 space-y-2 animate-fade-in">
                {assignment.hints.map((hint: string, index: number) => (
                  <Alert key={index} className="bg-blue-500/10 border-blue-500/20">
                    <AlertDescription className="text-sm text-blue-200">
                      <span className="ml-2">{hint}</span>
                    </AlertDescription>
                  </Alert>
                ))}
              </CollapsibleContent>
            </Collapsible>
          )}
        </div>
      </div>
    </div>
  );
}

export default Header;